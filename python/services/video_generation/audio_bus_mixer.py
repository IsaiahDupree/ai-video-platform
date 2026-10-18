"""
Audio Bus Mixer

FFmpeg-based audio bus generation combining:
- Voiceover (stitched narration)
- Music (background track)
- SFX (from expanded macro cues)

Supports sidechain ducking: music volume is reduced during narration
segments using FFmpeg volume expressions with smooth attack/release.

Outputs a single audio_bus.wav for Motion Canvas / Remotion.
"""

import asyncio
import os
import json
from typing import Optional
from pathlib import Path
from pydantic import BaseModel, Field
from loguru import logger

from .audio_ducking import DuckingPolicy, NarrationCue, DEFAULT_DUCKING


class AudioTrack(BaseModel):
    """A single audio track for mixing."""
    path: str
    start_seconds: float = Field(default=0, alias="startSeconds")
    volume: float = 1.0
    fade_in_seconds: float = Field(default=0, alias="fadeInSeconds")
    fade_out_seconds: float = Field(default=0, alias="fadeOutSeconds")
    loop: bool = False
    
    class Config:
        populate_by_name = True


class AudioBusConfig(BaseModel):
    """Configuration for audio bus mixing."""
    sample_rate: int = Field(default=48000, alias="sampleRate")
    channels: int = 2
    output_format: str = Field(default="wav", alias="outputFormat")
    normalize: bool = True
    target_lufs: float = Field(default=-16, alias="targetLufs")
    
    class Config:
        populate_by_name = True


class AudioBusResult(BaseModel):
    """Result of audio bus mixing."""
    output_path: str = Field(alias="outputPath")
    duration_seconds: float = Field(alias="durationSeconds")
    track_count: int = Field(alias="trackCount")
    
    class Config:
        populate_by_name = True


async def probe_audio_duration(file_path: str) -> float:
    """Get audio duration using ffprobe."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path,
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    
    stdout, _ = await process.communicate()
    
    try:
        return float(stdout.decode().strip())
    except (ValueError, AttributeError):
        return 0


def build_ducking_volume_expr(
    cues: list[NarrationCue],
    fps: int = 30,
    policy: Optional[DuckingPolicy] = None,
) -> str:
    """
    Build an FFmpeg volume expression that ducks during narration cues.

    Generates a chain of if() expressions that smoothly interpolate
    between full and ducked volume using linear ramps at cue boundaries.

    Args:
        cues: Narration segments to duck around
        fps: Frames per second (for frame-to-seconds conversion)
        policy: Ducking policy with levels and fade duration

    Returns:
        FFmpeg volume expression string (e.g. "if(...)...") or empty
        string if no cues.
    """
    if not cues:
        return ""

    p = policy or DEFAULT_DUCKING
    attack_s = p.attack_frames / fps
    release_s = p.release_frames / fps
    full = p.full_level
    duck = p.duck_level

    # Sort cues by start time
    sorted_cues = sorted(cues, key=lambda c: c.from_frame)

    # Build nested if() expression evaluated by FFmpeg at each sample.
    # For each cue we generate 3 regions:
    #   attack ramp:  [start - attack, start]  -> lerp full->duck
    #   hold ducked:  [start, end]             -> duck
    #   release ramp: [end, end + release]     -> lerp duck->full
    parts: list[str] = []
    for cue in sorted_cues:
        start_s = cue.from_frame / fps
        end_s = cue.end_frame / fps
        attack_start = max(0, start_s - attack_s)
        release_end = end_s + release_s

        # Attack ramp: linear interpolation from full to duck
        if attack_s > 0:
            parts.append(
                f"if(between(t,{attack_start:.4f},{start_s:.4f}),"
                f"{full}+{duck - full}*(t-{attack_start:.4f})/{attack_s:.4f})"
            )

        # Hold ducked
        parts.append(
            f"if(between(t,{start_s:.4f},{end_s:.4f}),{duck})"
        )

        # Release ramp
        if release_s > 0:
            parts.append(
                f"if(between(t,{end_s:.4f},{release_end:.4f}),"
                f"{duck}+{full - duck}*(t-{end_s:.4f})/{release_s:.4f})"
            )

    # Chain with addition — only one if() is non-zero at a time, rest are 0.
    # FFmpeg if(cond,val) returns 0 when cond is false.
    # Final fallback: full volume when no cue is active.
    # We wrap as: max(if1 + if2 + ... + ifN, 0) with a default.
    # Simpler: nest with if/else via the three-arg if().
    # Use the pattern: if(c1,v1, if(c2,v2, ... full))
    expr = str(full)
    for part in reversed(parts):
        # part is "if(cond, val)" — convert to three-arg form
        # "if(cond, val)" -> insert ,<previous_expr> before final )
        expr = part[:-1] + "," + expr + ")"

    return expr


async def mix_audio_bus(
    output_path: str,
    voiceover: Optional[AudioTrack] = None,
    music: Optional[AudioTrack] = None,
    sfx_tracks: Optional[list[AudioTrack]] = None,
    total_duration_seconds: Optional[float] = None,
    config: Optional[AudioBusConfig] = None,
    narration_cues: Optional[list[NarrationCue]] = None,
    ducking_policy: Optional[DuckingPolicy] = None,
    fps: int = 30,
) -> AudioBusResult:
    """
    Mix multiple audio tracks into a single audio bus.

    Args:
        output_path: Output file path
        voiceover: Main narration track
        music: Background music track
        sfx_tracks: List of SFX tracks
        total_duration_seconds: Target duration (extends/trims)
        config: Audio bus configuration
        narration_cues: Speech segments for sidechain ducking music
        ducking_policy: Ducking levels and fade config
        fps: Frames per second (for ducking time conversion)

    Returns:
        AudioBusResult
    """
    cfg = config or AudioBusConfig()
    sfx = sfx_tracks or []
    
    # Collect all input files and build filter graph
    inputs = []
    filters = []
    track_labels = []
    
    # Voiceover input
    if voiceover and os.path.exists(voiceover.path):
        idx = len(inputs) // 2
        inputs.extend(["-i", voiceover.path])

        label = f"vo{idx}"
        filter_parts: list[str] = []

        # Apply volume
        if voiceover.volume != 1.0:
            filter_parts.append(f"volume={voiceover.volume}")

        # Apply delay if start > 0
        if voiceover.start_seconds > 0:
            delay_ms = int(voiceover.start_seconds * 1000)
            filter_parts.append(f"adelay={delay_ms}|{delay_ms}")

        # Need at least one filter; use acopy as pass-through
        if not filter_parts:
            filter_parts.append("acopy")

        filter_str = f"[{idx}:a]" + ",".join(filter_parts) + f"[{label}]"
        filters.append(filter_str)
        track_labels.append(label)
    
    # Music input
    if music and os.path.exists(music.path):
        idx = len(inputs) // 2  # Each input is "-i path"
        inputs.extend(["-i", music.path])

        label = f"music{idx}"
        filter_parts_m: list[str] = []

        # Loop if needed
        if music.loop and total_duration_seconds:
            filter_parts_m.append("aloop=loop=-1:size=2e+09")

        # Apply base volume
        if music.volume != 1.0:
            filter_parts_m.append(f"volume={music.volume}")

        # Sidechain ducking: apply volume expression that ducks during narration
        duck_expr = ""
        if narration_cues:
            duck_expr = build_ducking_volume_expr(narration_cues, fps, ducking_policy)
        if duck_expr:
            filter_parts_m.append(f"volume='{duck_expr}':eval=frame")

        # Fade in/out
        if music.fade_in_seconds > 0:
            filter_parts_m.append(f"afade=t=in:st=0:d={music.fade_in_seconds}")

        if music.fade_out_seconds > 0 and total_duration_seconds:
            fade_start = total_duration_seconds - music.fade_out_seconds
            filter_parts_m.append(f"afade=t=out:st={fade_start}:d={music.fade_out_seconds}")

        if not filter_parts_m:
            filter_parts_m.append("acopy")

        filter_str = f"[{idx}:a]" + ",".join(filter_parts_m) + f"[{label}]"
        filters.append(filter_str)
        track_labels.append(label)
    
    # SFX inputs
    for i, sfx_track in enumerate(sfx):
        if not os.path.exists(sfx_track.path):
            continue

        idx = len(inputs) // 2
        inputs.extend(["-i", sfx_track.path])

        label = f"sfx{i}"
        filter_parts_s: list[str] = []

        # Apply volume
        if sfx_track.volume != 1.0:
            filter_parts_s.append(f"volume={sfx_track.volume}")

        # Apply delay
        if sfx_track.start_seconds > 0:
            delay_ms = int(sfx_track.start_seconds * 1000)
            filter_parts_s.append(f"adelay={delay_ms}|{delay_ms}")

        if not filter_parts_s:
            filter_parts_s.append("acopy")

        filter_str = f"[{idx}:a]" + ",".join(filter_parts_s) + f"[{label}]"
        filters.append(filter_str)
        track_labels.append(label)
    
    if not track_labels:
        # No valid tracks - generate silence
        dur = total_duration_seconds or 60
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"anullsrc=r={cfg.sample_rate}:cl=stereo",
            "-t", str(dur),
            output_path,
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await process.communicate()
        
        return AudioBusResult(
            output_path=output_path,
            duration_seconds=dur,
            track_count=0,
        )
    
    # Build amix filter
    mix_inputs = "".join(f"[{l}]" for l in track_labels)
    mix_filter = f"{mix_inputs}amix=inputs={len(track_labels)}:duration=longest[mixed]"
    filters.append(mix_filter)
    
    # Normalize if requested
    if cfg.normalize:
        filters.append(f"[mixed]loudnorm=I={cfg.target_lufs}:TP=-1.5:LRA=11[out]")
        output_label = "[out]"
    else:
        output_label = "[mixed]"
    
    # Build command
    filter_complex = ";".join(filters)
    
    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", output_label,
        "-ar", str(cfg.sample_rate),
        "-ac", str(cfg.channels),
    ]
    
    # Trim to duration if specified
    if total_duration_seconds:
        cmd.extend(["-t", str(total_duration_seconds)])
    
    cmd.append(output_path)
    
    # Create output directory
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Run FFmpeg
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    
    _, stderr = await process.communicate()
    
    if process.returncode != 0:
        logger.error(f"FFmpeg failed: {stderr.decode()[:500]}")
        raise RuntimeError(f"Audio mix failed: {stderr.decode()[:200]}")
    
    # Get final duration
    duration = await probe_audio_duration(output_path)
    
    return AudioBusResult(
        output_path=output_path,
        duration_seconds=duration,
        track_count=len(track_labels),
    )


def mix_audio_bus_sync(
    output_path: str,
    voiceover: Optional[AudioTrack] = None,
    music: Optional[AudioTrack] = None,
    sfx_tracks: Optional[list[AudioTrack]] = None,
    total_duration_seconds: Optional[float] = None,
    config: Optional[AudioBusConfig] = None,
    narration_cues: Optional[list[NarrationCue]] = None,
    ducking_policy: Optional[DuckingPolicy] = None,
    fps: int = 30,
) -> AudioBusResult:
    """Synchronous version of mix_audio_bus."""
    return asyncio.run(mix_audio_bus(
        output_path, voiceover, music, sfx_tracks,
        total_duration_seconds, config, narration_cues,
        ducking_policy, fps,
    ))


def sfx_cues_to_tracks(
    cues: list[dict],
    sfx_root: str,
    fps: int = 30,
) -> list[AudioTrack]:
    """
    Convert SFX cues to audio tracks.
    
    Args:
        cues: List of SFX cue dicts with frame, sfxId, volume
        sfx_root: Root directory for SFX files
        fps: Frames per second
        
    Returns:
        List of AudioTrack
    """
    tracks = []
    
    for cue in cues:
        frame = cue.get("frame", 0)
        sfx_id = cue.get("sfxId") or cue.get("sfx_id", "")
        volume = cue.get("volume", 1.0)
        
        if not sfx_id:
            continue
        
        # Try common extensions
        sfx_path = None
        for ext in [".wav", ".mp3", ".ogg"]:
            path = os.path.join(sfx_root, f"{sfx_id}{ext}")
            if os.path.exists(path):
                sfx_path = path
                break
        
        if sfx_path:
            tracks.append(AudioTrack(
                path=sfx_path,
                start_seconds=frame / fps,
                volume=volume,
            ))
    
    return tracks


async def build_audio_bus_from_pipeline(
    output_dir: str,
    voiceover_path: Optional[str] = None,
    music_path: Optional[str] = None,
    music_volume: float = 0.25,
    sfx_cues: Optional[list[dict]] = None,
    sfx_root: Optional[str] = None,
    total_duration_seconds: Optional[float] = None,
    fps: int = 30,
    duck_during_voice: bool = True,
    narration_cues: Optional[list[NarrationCue]] = None,
    ducking_policy: Optional[DuckingPolicy] = None,
) -> str:
    """
    Build audio bus from pipeline outputs.

    Args:
        output_dir: Output directory
        voiceover_path: Path to stitched voiceover
        music_path: Path to background music
        music_volume: Music volume (0-1)
        sfx_cues: List of SFX cue dicts
        sfx_root: Root directory for SFX files
        total_duration_seconds: Target duration
        fps: Frames per second
        duck_during_voice: Duck music during voiceover
        narration_cues: Pre-computed narration cues for ducking.
            When duck_during_voice is True and no cues are provided,
            a single cue spanning the full voiceover is used as fallback.
        ducking_policy: Custom ducking levels/fade config

    Returns:
        Path to audio_bus.wav
    """
    output_path = os.path.join(output_dir, "audio_bus.wav")

    # Voiceover track
    vo_track = None
    if voiceover_path and os.path.exists(voiceover_path):
        vo_track = AudioTrack(path=voiceover_path, volume=1.0)

    # Music track
    music_track = None
    if music_path and os.path.exists(music_path):
        music_track = AudioTrack(
            path=music_path,
            volume=music_volume,
            loop=True,
            fade_in_seconds=0.5,
            fade_out_seconds=1.0,
        )

    # Resolve ducking cues
    cues = None
    if duck_during_voice and vo_track and music_track:
        if narration_cues:
            cues = narration_cues
        else:
            # Fallback: treat the entire voiceover as one narration segment.
            # Probe duration so we know the end frame.
            vo_dur = await probe_audio_duration(voiceover_path)
            if vo_dur > 0:
                cues = [NarrationCue(
                    from_frame=0,
                    duration_in_frames=max(1, round(vo_dur * fps)),
                )]
                logger.info(
                    f"Sidechain: auto-cue from voiceover duration "
                    f"({vo_dur:.1f}s, {cues[0].duration_in_frames} frames)"
                )

    # SFX tracks
    sfx_tracks = []
    if sfx_cues and sfx_root:
        sfx_tracks = sfx_cues_to_tracks(sfx_cues, sfx_root, fps)

    result = await mix_audio_bus(
        output_path=output_path,
        voiceover=vo_track,
        music=music_track,
        sfx_tracks=sfx_tracks,
        total_duration_seconds=total_duration_seconds,
        narration_cues=cues,
        ducking_policy=ducking_policy,
        fps=fps,
    )

    logger.info(f"Audio bus built: {result.output_path} ({result.duration_seconds:.1f}s, {result.track_count} tracks)")

    return result.output_path
