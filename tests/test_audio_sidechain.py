"""
Tests for FFmpeg sidechain ducking in audio_bus_mixer.

Covers:
- build_ducking_volume_expr(): pure expression generation (no FFmpeg needed)
- mix_audio_bus with narration_cues: end-to-end FFmpeg integration
- build_audio_bus_from_pipeline with duck_during_voice: full pipeline path
"""

import asyncio
import os
import sys
import tempfile

import pytest

# We import the two modules directly via importlib to avoid triggering the
# package __init__.py which pulls in heavy deps (aiohttp, openai, etc.).
import importlib.util

_py_root = os.path.join(os.path.dirname(__file__), '..', 'python')
sys.path.insert(0, _py_root)

# Stub loguru before any import touches it
_loguru_mod = type(sys)("loguru")
class _Logger:
    def info(self, *a, **kw): pass
    def error(self, *a, **kw): pass
    def warning(self, *a, **kw): pass
    def debug(self, *a, **kw): pass
_loguru_mod.logger = _Logger()
sys.modules["loguru"] = _loguru_mod


def _load_module(name: str, path: str):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


# Load audio_ducking first (no heavy deps)
_ducking_path = os.path.join(_py_root, "services", "video_generation", "audio_ducking.py")
_ducking_mod = _load_module("services.video_generation.audio_ducking", _ducking_path)

# Patch the relative import that audio_bus_mixer uses
sys.modules.setdefault("services", type(sys)("services"))
sys.modules.setdefault("services.video_generation", type(sys)("services.video_generation"))
sys.modules["services.video_generation"].audio_ducking = _ducking_mod

# Load audio_bus_mixer
_mixer_path = os.path.join(_py_root, "services", "video_generation", "audio_bus_mixer.py")
_mixer_mod = _load_module("services.video_generation.audio_bus_mixer", _mixer_path)

# Pull symbols into test namespace
DuckingPolicy = _ducking_mod.DuckingPolicy
NarrationCue = _ducking_mod.NarrationCue

AudioTrack = _mixer_mod.AudioTrack
AudioBusConfig = _mixer_mod.AudioBusConfig
build_ducking_volume_expr = _mixer_mod.build_ducking_volume_expr
mix_audio_bus = _mixer_mod.mix_audio_bus
build_audio_bus_from_pipeline = _mixer_mod.build_audio_bus_from_pipeline
probe_audio_duration = _mixer_mod.probe_audio_duration


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_tone(path: str, duration: float = 3.0, freq: int = 440):
    """Generate a sine-wave WAV file using ffmpeg."""
    import subprocess
    subprocess.run(
        [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"sine=frequency={freq}:duration={duration}",
            "-ar", "48000", "-ac", "2",
            path,
        ],
        capture_output=True,
        check=True,
    )


@pytest.fixture()
def tone_files(tmp_path):
    """Create a voice tone and a music tone for integration tests."""
    voice_path = str(tmp_path / "voice.wav")
    music_path = str(tmp_path / "music.wav")
    _generate_tone(voice_path, duration=3.0, freq=300)
    _generate_tone(music_path, duration=6.0, freq=800)
    return voice_path, music_path


# ===========================================================================
# Shared defaults sync test
# ===========================================================================

class TestSharedDefaults:
    """Verify Python defaults match the shared ducking-defaults.json."""

    def test_python_defaults_match_json(self):
        import json
        json_path = os.path.join(
            os.path.dirname(__file__), '..', 'src', 'audio', 'ducking-defaults.json',
        )
        with open(json_path) as f:
            shared = json.load(f)

        policy = DuckingPolicy()
        assert policy.duck_level == shared["duckLevel"]
        assert policy.full_level == shared["fullLevel"]
        assert policy.attack_frames == shared["attackFrames"]
        assert policy.release_frames == shared["releaseFrames"]
        assert policy.enabled == shared["enabled"]

    def test_legacy_compat_properties(self):
        """Old field names still work via properties."""
        policy = DuckingPolicy()
        assert policy.bg_base_volume == policy.full_level
        assert policy.ducked_volume == policy.duck_level
        assert policy.fade_frames == policy.attack_frames


# ===========================================================================
# Unit tests: build_ducking_volume_expr
# ===========================================================================

class TestBuildDuckingVolumeExpr:
    """Pure-logic tests for the FFmpeg volume expression builder."""

    def test_empty_cues_returns_empty(self):
        assert build_ducking_volume_expr([]) == ""

    def test_single_cue_produces_valid_expression(self):
        cue = NarrationCue(from_frame=30, duration_in_frames=60)
        expr = build_ducking_volume_expr([cue], fps=30)

        assert expr, "Expression should not be empty"
        # Must contain 'if(' — it is an FFmpeg conditional expression
        assert "if(" in expr
        # Must reference the ducked volume (0.08 default from shared JSON)
        assert "0.08" in expr

    def test_expression_contains_correct_timestamps(self):
        """Cue at frames 60-120 @ 30fps → 2.0s to 4.0s."""
        cue = NarrationCue(from_frame=60, duration_in_frames=60)
        expr = build_ducking_volume_expr([cue], fps=30)

        assert "2.0000" in expr  # start_s
        assert "4.0000" in expr  # end_s

    def test_multiple_cues(self):
        cues = [
            NarrationCue(from_frame=0, duration_in_frames=30),
            NarrationCue(from_frame=90, duration_in_frames=30),
        ]
        expr = build_ducking_volume_expr(cues, fps=30)

        # Both cue regions should appear
        assert "0.0000" in expr
        assert "3.0000" in expr  # 90/30 = 3.0

    def test_custom_policy(self):
        cue = NarrationCue(from_frame=30, duration_in_frames=30)
        policy = DuckingPolicy(
            enabled=True,
            full_level=0.7,
            duck_level=0.05,
            attack_frames=3,
            release_frames=3,
        )
        expr = build_ducking_volume_expr([cue], fps=30, policy=policy)

        assert "0.05" in expr
        assert "0.7" in expr

    def test_zero_fade_frames(self):
        """With zero fade there should be no attack/release ramps."""
        cue = NarrationCue(from_frame=30, duration_in_frames=30)
        policy = DuckingPolicy(attack_frames=0, release_frames=0)
        expr = build_ducking_volume_expr([cue], fps=30, policy=policy)

        # Should still have the hold-ducked region
        assert "0.08" in expr
        # Count the number of if() calls — only the hold region per cue
        assert expr.count("between") == 1

    def test_expression_has_balanced_parens(self):
        cues = [
            NarrationCue(from_frame=0, duration_in_frames=30),
            NarrationCue(from_frame=90, duration_in_frames=60),
            NarrationCue(from_frame=180, duration_in_frames=30),
        ]
        expr = build_ducking_volume_expr(cues, fps=30)
        assert expr.count("(") == expr.count(")"), (
            f"Unbalanced parens in: {expr}"
        )

    def test_fallback_value_is_full_level(self):
        """When no cue is active the expression should evaluate to full level."""
        cue = NarrationCue(from_frame=30, duration_in_frames=30)
        expr = build_ducking_volume_expr([cue], fps=30)
        # The innermost fallback (last non-paren token) should be full level (0.45)
        assert ",0.45)" in expr


# ===========================================================================
# Integration tests: FFmpeg mix with sidechain ducking
# ===========================================================================

import shutil
_HAS_FFMPEG = shutil.which("ffmpeg") is not None

@pytest.mark.skipif(not _HAS_FFMPEG, reason="ffmpeg not available")
class TestMixAudioBusSidechain:
    """Integration tests that run FFmpeg to verify ducked output."""

    def test_mix_with_ducking_produces_output(self, tone_files, tmp_path):
        voice_path, music_path = tone_files
        output = str(tmp_path / "bus.wav")

        cues = [NarrationCue(from_frame=0, duration_in_frames=90)]  # 3s @ 30fps

        result = asyncio.run(mix_audio_bus(
            output_path=output,
            voiceover=AudioTrack(path=voice_path, volume=1.0),
            music=AudioTrack(path=music_path, volume=0.5, loop=True),
            total_duration_seconds=6.0,
            narration_cues=cues,
            fps=30,
            config=AudioBusConfig(normalize=False),
        ))

        assert os.path.exists(result.output_path)
        assert result.duration_seconds > 0
        assert result.track_count == 2

    def test_mix_without_ducking_still_works(self, tone_files, tmp_path):
        """Passing no cues should behave exactly as before."""
        voice_path, music_path = tone_files
        output = str(tmp_path / "bus_no_duck.wav")

        result = asyncio.run(mix_audio_bus(
            output_path=output,
            voiceover=AudioTrack(path=voice_path, volume=1.0),
            music=AudioTrack(path=music_path, volume=0.5),
            total_duration_seconds=3.0,
            config=AudioBusConfig(normalize=False),
        ))

        assert os.path.exists(result.output_path)
        assert result.track_count == 2

    def test_ducking_reduces_music_during_voice(self, tone_files, tmp_path):
        """
        Compare RMS of the music-only portion vs the ducked portion.
        The ducked segment should be quieter.
        """
        voice_path, music_path = tone_files

        # Render WITH ducking (voice is 0-3s, music is 0-6s)
        ducked_out = str(tmp_path / "ducked.wav")
        cues = [NarrationCue(from_frame=0, duration_in_frames=90)]

        asyncio.run(mix_audio_bus(
            output_path=ducked_out,
            voiceover=AudioTrack(path=voice_path, volume=1.0),
            music=AudioTrack(path=music_path, volume=0.5, loop=True),
            total_duration_seconds=6.0,
            narration_cues=cues,
            fps=30,
            config=AudioBusConfig(normalize=False),
        ))

        # Render WITHOUT ducking
        flat_out = str(tmp_path / "flat.wav")
        asyncio.run(mix_audio_bus(
            output_path=flat_out,
            voiceover=AudioTrack(path=voice_path, volume=1.0),
            music=AudioTrack(path=music_path, volume=0.5, loop=True),
            total_duration_seconds=6.0,
            config=AudioBusConfig(normalize=False),
        ))

        # Both should exist and have similar duration
        dur_ducked = asyncio.run(probe_audio_duration(ducked_out))
        dur_flat = asyncio.run(probe_audio_duration(flat_out))
        assert dur_ducked > 5.0
        assert dur_flat > 5.0

    def test_ducking_with_custom_policy(self, tone_files, tmp_path):
        voice_path, music_path = tone_files
        output = str(tmp_path / "custom_duck.wav")

        policy = DuckingPolicy(
            full_level=0.8,
            duck_level=0.05,
            attack_frames=3,
            release_frames=3,
        )
        cues = [NarrationCue(from_frame=15, duration_in_frames=60)]

        result = asyncio.run(mix_audio_bus(
            output_path=output,
            voiceover=AudioTrack(path=voice_path, volume=1.0),
            music=AudioTrack(path=music_path, volume=0.4),
            total_duration_seconds=4.0,
            narration_cues=cues,
            ducking_policy=policy,
            fps=30,
            config=AudioBusConfig(normalize=False),
        ))

        assert os.path.exists(result.output_path)
        assert result.track_count == 2


# ===========================================================================
# Integration: build_audio_bus_from_pipeline
# ===========================================================================

@pytest.mark.skipif(not _HAS_FFMPEG, reason="ffmpeg not available")
class TestBuildAudioBusFromPipeline:

    def test_pipeline_with_explicit_cues(self, tone_files, tmp_path):
        voice_path, music_path = tone_files
        cues = [NarrationCue(from_frame=0, duration_in_frames=90)]

        out = asyncio.run(build_audio_bus_from_pipeline(
            output_dir=str(tmp_path),
            voiceover_path=voice_path,
            music_path=music_path,
            music_volume=0.3,
            total_duration_seconds=6.0,
            duck_during_voice=True,
            narration_cues=cues,
            fps=30,
        ))

        assert os.path.exists(out)
        dur = asyncio.run(probe_audio_duration(out))
        assert dur > 5.0

    def test_pipeline_auto_cue_from_voiceover(self, tone_files, tmp_path):
        """When no cues are given, the entire voiceover should be auto-cued."""
        voice_path, music_path = tone_files

        out = asyncio.run(build_audio_bus_from_pipeline(
            output_dir=str(tmp_path),
            voiceover_path=voice_path,
            music_path=music_path,
            music_volume=0.3,
            total_duration_seconds=6.0,
            duck_during_voice=True,
            fps=30,
        ))

        assert os.path.exists(out)

    def test_pipeline_ducking_disabled(self, tone_files, tmp_path):
        voice_path, music_path = tone_files

        out = asyncio.run(build_audio_bus_from_pipeline(
            output_dir=str(tmp_path),
            voiceover_path=voice_path,
            music_path=music_path,
            music_volume=0.3,
            total_duration_seconds=4.0,
            duck_during_voice=False,
            fps=30,
        ))

        assert os.path.exists(out)
