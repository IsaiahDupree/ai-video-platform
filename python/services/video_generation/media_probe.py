"""
Media Probe

FFprobe-based utilities for extracting actual media timing information.
Used to get real plate durations for perfect looping/stretching.
"""

import asyncio
import subprocess
import json
from typing import Optional
from pathlib import Path
from pydantic import BaseModel, Field
from loguru import logger


class MediaTiming(BaseModel):
    """Timing information for a media file."""
    duration_seconds: float = Field(alias="durationSeconds")
    duration_frames: int = Field(alias="durationFrames")
    
    class Config:
        populate_by_name = True


class MediaInfo(BaseModel):
    """Full media information from ffprobe."""
    duration_seconds: float = Field(alias="durationSeconds")
    width: Optional[int] = None
    height: Optional[int] = None
    fps: Optional[float] = None
    has_audio: bool = Field(default=False, alias="hasAudio")
    codec: Optional[str] = None
    
    class Config:
        populate_by_name = True


async def probe_duration_seconds(file_path: str) -> float:
    """
    Get duration of a media file in seconds using ffprobe.
    
    Args:
        file_path: Path to media file
        
    Returns:
        Duration in seconds
        
    Raises:
        RuntimeError: If ffprobe fails
    """
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
        duration = float(stdout.decode().strip())
        if duration <= 0:
            raise ValueError(f"Invalid duration: {duration}")
        return duration
    except (ValueError, AttributeError) as e:
        raise RuntimeError(f"ffprobe failed for {file_path}: {stderr.decode()[:200]}") from e


def probe_duration_seconds_sync(file_path: str) -> float:
    """Synchronous version of probe_duration_seconds."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path,
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    try:
        duration = float(result.stdout.strip())
        if duration <= 0:
            raise ValueError(f"Invalid duration: {duration}")
        return duration
    except (ValueError, AttributeError) as e:
        raise RuntimeError(f"ffprobe failed for {file_path}: {result.stderr[:200]}") from e


async def probe_media_info(file_path: str) -> MediaInfo:
    """
    Get full media information using ffprobe.
    
    Args:
        file_path: Path to media file
        
    Returns:
        MediaInfo with duration, dimensions, fps, etc.
    """
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration:stream=width,height,r_frame_rate,codec_name,codec_type",
        "-of", "json",
        file_path,
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    
    stdout, stderr = await process.communicate()
    
    try:
        data = json.loads(stdout.decode())
    except json.JSONDecodeError as e:
        raise RuntimeError(f"ffprobe JSON parse failed: {stderr.decode()[:200]}") from e
    
    # Extract format info
    fmt = data.get("format", {})
    duration = float(fmt.get("duration", 0))
    
    # Extract stream info
    streams = data.get("streams", [])
    width = None
    height = None
    fps = None
    has_audio = False
    codec = None
    
    for stream in streams:
        codec_type = stream.get("codec_type")
        
        if codec_type == "video" and width is None:
            width = stream.get("width")
            height = stream.get("height")
            codec = stream.get("codec_name")
            
            # Parse frame rate (e.g., "30/1" or "30000/1001")
            r_frame_rate = stream.get("r_frame_rate", "0/1")
            if "/" in r_frame_rate:
                num, den = r_frame_rate.split("/")
                if int(den) > 0:
                    fps = int(num) / int(den)
        
        if codec_type == "audio":
            has_audio = True
    
    return MediaInfo(
        duration_seconds=duration,
        width=width,
        height=height,
        fps=fps,
        has_audio=has_audio,
        codec=codec,
    )


def seconds_to_frames(seconds: float, fps: int) -> int:
    """Convert seconds to frames."""
    return max(1, round(seconds * fps))


def frames_to_seconds(frames: int, fps: int) -> float:
    """Convert frames to seconds."""
    return frames / fps if fps > 0 else 0


def get_media_timing(duration_seconds: float, fps: int) -> MediaTiming:
    """
    Create MediaTiming from duration and fps.
    
    Args:
        duration_seconds: Duration in seconds
        fps: Frames per second
        
    Returns:
        MediaTiming
    """
    return MediaTiming(
        duration_seconds=duration_seconds,
        duration_frames=seconds_to_frames(duration_seconds, fps),
    )


async def attach_timing_to_clips(
    clips: list[dict],
    fps: int,
) -> list[dict]:
    """
    Attach timing information to clips by probing their files.
    
    Args:
        clips: List of clip dicts with 'src' field
        fps: Frames per second
        
    Returns:
        Clips with timing attached
    """
    result = []
    
    for clip in clips:
        src = clip.get("src")
        
        if not src or src.startswith("mock://"):
            result.append(clip)
            continue
        
        try:
            duration = await probe_duration_seconds(src)
            timing = get_media_timing(duration, fps)
            
            result.append({
                **clip,
                "timing": timing.model_dump(by_alias=True),
            })
        except Exception as e:
            logger.warning(f"Could not probe timing for {src}: {e}")
            result.append(clip)
    
    return result


def build_plate_frames_map(
    clips: list[dict],
    fps: int,
) -> dict[str, int]:
    """
    Build a map of reuse keys to actual plate frame durations.
    
    Args:
        clips: List of clip dicts
        fps: Frames per second
        
    Returns:
        Dict mapping reuseKey to frame count
    """
    plate_map = {}
    
    for clip in clips:
        if clip.get("role") != "bg":
            continue
        
        reuse_key = clip.get("reuseKey") or clip.get("reuse_key")
        if not reuse_key:
            continue
        
        timing = clip.get("timing", {})
        frames = timing.get("durationFrames") or timing.get("duration_frames")
        
        if frames:
            plate_map[reuse_key] = frames
    
    return plate_map


def estimate_loop_count(beat_frames: int, plate_frames: int) -> int:
    """
    Estimate how many times a plate needs to loop for a beat.
    
    Args:
        beat_frames: Beat duration in frames
        plate_frames: Plate duration in frames
        
    Returns:
        Number of loops needed (1 = no loop)
    """
    if plate_frames <= 0:
        return 1
    return max(1, (beat_frames + plate_frames - 1) // plate_frames)


def calculate_optimal_playback_rate(
    beat_frames: int,
    plate_frames: int,
    min_rate: float = 0.7,
    max_rate: float = 1.25,
) -> Optional[float]:
    """
    Calculate optimal playback rate to match beat duration.
    
    Args:
        beat_frames: Target duration
        plate_frames: Source duration
        min_rate: Minimum acceptable rate
        max_rate: Maximum acceptable rate
        
    Returns:
        Playback rate or None if out of bounds
    """
    if plate_frames <= 0 or beat_frames <= 0:
        return None
    
    rate = plate_frames / beat_frames
    
    if min_rate <= rate <= max_rate:
        return round(rate, 3)
    
    return None
