"""
VO Stitcher

Generates per-beat TTS audio, normalizes, concatenates into single narration track,
and produces narration cues for ducking and timeline sync.
"""

import asyncio
import subprocess
import os
from typing import Optional, Protocol
from pathlib import Path
from pydantic import BaseModel, Field
from loguru import logger


class BeatNarrationInput(BaseModel):
    """Input for per-beat narration synthesis."""
    beat_id: str = Field(alias="beatId")
    text: str
    pre_silence_ms: int = Field(default=100, alias="preSilenceMs", ge=0)
    post_silence_ms: int = Field(default=140, alias="postSilenceMs", ge=0)
    
    class Config:
        populate_by_name = True


class NarrationAsset(BaseModel):
    """A synthesized narration asset."""
    beat_id: str = Field(alias="beatId")
    wav_path: str = Field(alias="wavPath")
    duration_seconds: float = Field(alias="durationSeconds")
    
    class Config:
        populate_by_name = True


class NarrationCue(BaseModel):
    """Cue for a single beat's narration."""
    from_frame: int = Field(alias="fromFrame")
    duration_in_frames: int = Field(alias="durationInFrames")
    start_seconds: float = Field(alias="startSeconds")
    duration_seconds: float = Field(alias="durationSeconds")
    
    class Config:
        populate_by_name = True


class StitchedNarration(BaseModel):
    """Result of stitched narration."""
    stitched_wav_path: str = Field(alias="stitchedWavPath")
    stitched_mp3_path: Optional[str] = Field(None, alias="stitchedMp3Path")
    total_seconds: float = Field(alias="totalSeconds")
    cues: dict[str, NarrationCue]
    
    class Config:
        populate_by_name = True


class TTSProvider(Protocol):
    """Protocol for TTS providers."""
    name: str
    
    async def synthesize(self, text: str, out_path: str, voice_id: Optional[str] = None) -> None:
        """Synthesize text to audio file."""
        ...


class DummyTTSProvider:
    """Dummy TTS provider for testing."""
    name = "dummy"
    
    async def synthesize(self, text: str, out_path: str, voice_id: Optional[str] = None) -> None:
        # Generate silence as placeholder
        await generate_silence_wav(out_path, ms=len(text) * 50)  # ~50ms per char


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
    
    stdout, stderr = await process.communicate()
    
    try:
        return float(stdout.decode().strip())
    except (ValueError, AttributeError):
        raise RuntimeError(f"ffprobe failed: {stderr.decode()[:200]}")


async def generate_silence_wav(out_path: str, ms: int, sample_rate: int = 48000) -> None:
    """Generate silence WAV file."""
    seconds = max(0.01, ms / 1000)
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", f"anullsrc=r={sample_rate}:cl=mono",
        "-t", str(seconds),
        out_path,
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await process.communicate()


async def normalize_loudness_wav(in_path: str, out_path: str) -> None:
    """Normalize audio loudness."""
    cmd = [
        "ffmpeg", "-y",
        "-i", in_path,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        out_path,
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await process.communicate()


async def concat_wavs(input_paths: list[str], out_path: str) -> None:
    """Concatenate WAV files using ffmpeg concat demuxer."""
    # Create list file
    list_file = f"{out_path}.txt"
    content = "\n".join(f"file '{p}'" for p in input_paths)
    
    Path(list_file).write_text(content)
    
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", list_file,
        "-c", "copy",
        out_path,
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await process.communicate()
    
    # Cleanup list file
    try:
        os.remove(list_file)
    except:
        pass


async def wav_to_mp3(in_path: str, out_path: str) -> None:
    """Convert WAV to MP3."""
    cmd = [
        "ffmpeg", "-y",
        "-i", in_path,
        "-codec:a", "libmp3lame",
        "-q:a", "2",
        out_path,
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await process.communicate()


async def speed_up_audio(in_path: str, out_path: str, speed: float) -> None:
    """Speed up audio using atempo filter."""
    if speed < 0.5 or speed > 2.0:
        raise ValueError("Speed must be between 0.5 and 2.0")
    
    cmd = [
        "ffmpeg", "-y",
        "-i", in_path,
        "-filter:a", f"atempo={speed:.4f}",
        out_path,
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await process.communicate()


async def synthesize_beat_narrations(
    provider: TTSProvider,
    beats: list[BeatNarrationInput],
    out_dir: str,
    voice_id: Optional[str] = None,
    normalize: bool = True,
) -> list[NarrationAsset]:
    """
    Synthesize narration for each beat.
    
    Args:
        provider: TTS provider
        beats: Beat narration inputs
        out_dir: Output directory
        voice_id: Optional voice ID
        normalize: Whether to normalize loudness
        
    Returns:
        List of NarrationAsset
    """
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    
    assets = []
    
    for beat in beats:
        if not beat.text.strip():
            continue
        
        raw_path = os.path.join(out_dir, f"vo_{beat.beat_id}_raw.wav")
        norm_path = os.path.join(out_dir, f"vo_{beat.beat_id}.wav")
        
        # Synthesize
        await provider.synthesize(beat.text, raw_path, voice_id)
        
        # Normalize
        if normalize:
            await normalize_loudness_wav(raw_path, norm_path)
        else:
            norm_path = raw_path
        
        # Add silence padding
        parts = []
        
        if beat.pre_silence_ms > 0:
            pre_path = os.path.join(out_dir, f"sil_pre_{beat.beat_id}.wav")
            await generate_silence_wav(pre_path, beat.pre_silence_ms)
            parts.append(pre_path)
        
        parts.append(norm_path)
        
        if beat.post_silence_ms > 0:
            post_path = os.path.join(out_dir, f"sil_post_{beat.beat_id}.wav")
            await generate_silence_wav(post_path, beat.post_silence_ms)
            parts.append(post_path)
        
        # Concatenate if needed
        final_path = norm_path
        if len(parts) > 1:
            final_path = os.path.join(out_dir, f"vo_{beat.beat_id}_padded.wav")
            await concat_wavs(parts, final_path)
        
        # Get duration
        duration = await probe_audio_duration(final_path)
        
        assets.append(NarrationAsset(
            beat_id=beat.beat_id,
            wav_path=final_path,
            duration_seconds=duration,
        ))
    
    return assets


def seconds_to_frames(seconds: float, fps: int) -> int:
    """Convert seconds to frames."""
    return max(1, round(seconds * fps))


async def stitch_narration(
    assets: list[NarrationAsset],
    out_dir: str,
    fps: int,
    also_mp3: bool = False,
) -> StitchedNarration:
    """
    Stitch narration assets into single track with cues.
    
    Args:
        assets: List of NarrationAsset
        out_dir: Output directory
        fps: Frames per second
        also_mp3: Also create MP3 version
        
    Returns:
        StitchedNarration
    """
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    
    stitched_wav_path = os.path.join(out_dir, "narration_stitched.wav")
    
    # Concatenate all assets
    await concat_wavs([a.wav_path for a in assets], stitched_wav_path)
    
    # Build cues
    cues = {}
    cursor_seconds = 0
    
    for asset in assets:
        from_frame = round(cursor_seconds * fps)
        duration_frames = seconds_to_frames(asset.duration_seconds, fps)
        
        cues[asset.beat_id] = NarrationCue(
            from_frame=from_frame,
            duration_in_frames=duration_frames,
            start_seconds=cursor_seconds,
            duration_seconds=asset.duration_seconds,
        )
        
        cursor_seconds += asset.duration_seconds
    
    # Optional MP3
    stitched_mp3_path = None
    if also_mp3:
        stitched_mp3_path = os.path.join(out_dir, "narration_stitched.mp3")
        await wav_to_mp3(stitched_wav_path, stitched_mp3_path)
    
    return StitchedNarration(
        stitched_wav_path=stitched_wav_path,
        stitched_mp3_path=stitched_mp3_path,
        total_seconds=cursor_seconds,
        cues=cues,
    )


def stitch_narration_sync(
    assets: list[NarrationAsset],
    out_dir: str,
    fps: int,
    also_mp3: bool = False,
) -> StitchedNarration:
    """Synchronous version of stitch_narration."""
    return asyncio.run(stitch_narration(assets, out_dir, fps, also_mp3))


def beats_to_narration_inputs(
    beats: list[dict],
    pre_silence_ms: int = 100,
    post_silence_ms: int = 140,
) -> list[BeatNarrationInput]:
    """
    Convert beats to narration inputs.
    
    Args:
        beats: List of beat dicts
        pre_silence_ms: Pre-silence duration
        post_silence_ms: Post-silence duration
        
    Returns:
        List of BeatNarrationInput
    """
    inputs = []
    
    for beat in beats:
        narration = beat.get("narration", "")
        if not narration or not narration.strip():
            continue
        
        beat_id = beat.get("id") or beat.get("beatId", "")
        
        inputs.append(BeatNarrationInput(
            beat_id=beat_id,
            text=narration,
            pre_silence_ms=pre_silence_ms,
            post_silence_ms=post_silence_ms,
        ))
    
    return inputs


def story_ir_to_narration_inputs(
    ir: dict,
    pre_silence_ms: int = 100,
    post_silence_ms: int = 140,
) -> list[BeatNarrationInput]:
    """Convert Story IR to narration inputs."""
    return beats_to_narration_inputs(
        ir.get("beats", []),
        pre_silence_ms,
        post_silence_ms,
    )


def cues_to_ducking_format(cues: dict[str, NarrationCue]) -> list[dict]:
    """Convert narration cues to ducking format."""
    return [
        {
            "from": cue.from_frame,
            "durationInFrames": cue.duration_in_frames,
        }
        for cue in cues.values()
    ]
