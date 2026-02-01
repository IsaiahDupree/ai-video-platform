"""
Audio Bus Mixer

FFmpeg-based audio bus generation combining:
- Voiceover (stitched narration)
- Music (background track)
- SFX (from expanded macro cues)

Outputs a single audio_bus.wav for Motion Canvas / Remotion.
"""

import asyncio
import os
import json
from typing import Optional
from pathlib import Path
from pydantic import BaseModel, Field
from loguru import logger


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


async def mix_audio_bus(
    output_path: str,
    voiceover: Optional[AudioTrack] = None,
    music: Optional[AudioTrack] = None,
    sfx_tracks: Optional[list[AudioTrack]] = None,
    total_duration_seconds: Optional[float] = None,
    config: Optional[AudioBusConfig] = None,
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
        idx = len(inputs)
        inputs.extend(["-i", voiceover.path])
        
        label = f"vo{idx}"
        filter_str = f"[{idx}:a]"
        
        # Apply volume
        if voiceover.volume != 1.0:
            filter_str += f"volume={voiceover.volume},"
        
        # Apply delay if start > 0
        if voiceover.start_seconds > 0:
            delay_ms = int(voiceover.start_seconds * 1000)
            filter_str += f"adelay={delay_ms}|{delay_ms},"
        
        filter_str = filter_str.rstrip(",") + f"[{label}]"
        filters.append(filter_str)
        track_labels.append(label)
    
    # Music input
    if music and os.path.exists(music.path):
        idx = len(inputs) // 2  # Each input is "-i path"
        inputs.extend(["-i", music.path])
        
        label = f"music{idx}"
        filter_str = f"[{idx}:a]"
        
        # Loop if needed
        if music.loop and total_duration_seconds:
            filter_str += f"aloop=loop=-1:size=2e+09,"
        
        # Apply volume
        if music.volume != 1.0:
            filter_str += f"volume={music.volume},"
        
        # Fade in/out
        if music.fade_in_seconds > 0:
            filter_str += f"afade=t=in:st=0:d={music.fade_in_seconds},"
        
        if music.fade_out_seconds > 0 and total_duration_seconds:
            fade_start = total_duration_seconds - music.fade_out_seconds
            filter_str += f"afade=t=out:st={fade_start}:d={music.fade_out_seconds},"
        
        filter_str = filter_str.rstrip(",") + f"[{label}]"
        filters.append(filter_str)
        track_labels.append(label)
    
    # SFX inputs
    for i, sfx_track in enumerate(sfx):
        if not os.path.exists(sfx_track.path):
            continue
        
        idx = len(inputs) // 2
        inputs.extend(["-i", sfx_track.path])
        
        label = f"sfx{i}"
        filter_str = f"[{idx}:a]"
        
        # Apply volume
        if sfx_track.volume != 1.0:
            filter_str += f"volume={sfx_track.volume},"
        
        # Apply delay
        if sfx_track.start_seconds > 0:
            delay_ms = int(sfx_track.start_seconds * 1000)
            filter_str += f"adelay={delay_ms}|{delay_ms},"
        
        filter_str = filter_str.rstrip(",") + f"[{label}]"
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
) -> AudioBusResult:
    """Synchronous version of mix_audio_bus."""
    return asyncio.run(mix_audio_bus(
        output_path, voiceover, music, sfx_tracks,
        total_duration_seconds, config
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
    )
    
    logger.info(f"✅ Audio bus built: {result.output_path} ({result.duration_seconds:.1f}s, {result.track_count} tracks)")
    
    return result.output_path
