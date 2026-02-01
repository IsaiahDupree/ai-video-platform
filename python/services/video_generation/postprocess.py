"""
Video Postprocessing

FFmpeg-based postprocessing for chroma keying, audio extraction,
and video manipulation.
"""

import os
import asyncio
import subprocess
from pathlib import Path
from typing import Optional, Literal
from loguru import logger


async def run_ffmpeg(args: list[str]) -> tuple[int, str, str]:
    """
    Run FFmpeg asynchronously.
    
    Args:
        args: FFmpeg arguments (without 'ffmpeg' prefix)
        
    Returns:
        Tuple of (return_code, stdout, stderr)
    """
    cmd = ["ffmpeg", "-y"] + args
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    
    stdout, stderr = await process.communicate()
    
    return (
        process.returncode or 0,
        stdout.decode() if stdout else "",
        stderr.decode() if stderr else "",
    )


def run_ffmpeg_sync(args: list[str]) -> tuple[int, str, str]:
    """
    Run FFmpeg synchronously.
    
    Args:
        args: FFmpeg arguments (without 'ffmpeg' prefix)
        
    Returns:
        Tuple of (return_code, stdout, stderr)
    """
    cmd = ["ffmpeg", "-y"] + args
    
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
    )
    
    return result.returncode, result.stdout, result.stderr


async def chroma_key_to_alpha(
    input_path: str,
    output_path: str,
    color: Literal["green", "magenta"] = "green",
    similarity: float = 0.18,
    blend: float = 0.02,
) -> str:
    """
    Apply chroma key and produce transparent video.
    
    Converts a green/magenta screen video to WebM VP9 with alpha channel.
    
    Args:
        input_path: Path to input video (green/magenta screen)
        output_path: Path to output video (should be .webm)
        color: Key color
        similarity: Color similarity threshold (0.0-1.0)
        blend: Blend threshold (0.0-1.0)
        
    Returns:
        Path to output video
    """
    # Ensure output directory exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Determine key color hex
    key_color = "0x00FF00" if color == "green" else "0xFF00FF"
    
    args = [
        "-i", input_path,
        "-vf", f"colorkey={key_color}:{similarity}:{blend},format=rgba",
        "-c:v", "libvpx-vp9",
        "-pix_fmt", "yuva420p",
        "-b:v", "2M",
        "-an",  # No audio
        output_path,
    ]
    
    code, stdout, stderr = await run_ffmpeg(args)
    
    if code != 0:
        logger.error(f"FFmpeg chroma key failed: {stderr}")
        raise RuntimeError(f"Chroma key failed: {stderr[:200]}")
    
    logger.info(f"Chroma key complete: {output_path}")
    return output_path


async def extract_audio(
    input_path: str,
    output_path: str,
    format: str = "mp3",
) -> str:
    """
    Extract audio from a video file.
    
    Args:
        input_path: Path to input video
        output_path: Path to output audio
        format: Audio format (mp3, wav, aac)
        
    Returns:
        Path to output audio
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    args = [
        "-i", input_path,
        "-vn",  # No video
        "-acodec", format if format != "mp3" else "libmp3lame",
        output_path,
    ]
    
    code, stdout, stderr = await run_ffmpeg(args)
    
    if code != 0:
        logger.error(f"FFmpeg extract audio failed: {stderr}")
        raise RuntimeError(f"Extract audio failed: {stderr[:200]}")
    
    logger.info(f"Extracted audio: {output_path}")
    return output_path


async def mute_video(
    input_path: str,
    output_path: str,
) -> str:
    """
    Remove audio from a video file.
    
    Args:
        input_path: Path to input video
        output_path: Path to output video
        
    Returns:
        Path to output video
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    args = [
        "-i", input_path,
        "-c:v", "copy",
        "-an",  # No audio
        output_path,
    ]
    
    code, stdout, stderr = await run_ffmpeg(args)
    
    if code != 0:
        logger.error(f"FFmpeg mute video failed: {stderr}")
        raise RuntimeError(f"Mute video failed: {stderr[:200]}")
    
    logger.info(f"Muted video: {output_path}")
    return output_path


async def mix_audio_tracks(
    tracks: list[dict],
    output_path: str,
    duration_seconds: Optional[float] = None,
) -> str:
    """
    Mix multiple audio tracks into one file.
    
    Args:
        tracks: List of dicts with 'path', 'volume' (0-1), 'start_seconds'
        output_path: Path to output audio
        duration_seconds: Optional total duration
        
    Returns:
        Path to output audio
    """
    if not tracks:
        raise ValueError("No tracks provided")
    
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Build filter complex
    inputs = []
    filter_parts = []
    
    for i, track in enumerate(tracks):
        inputs.extend(["-i", track["path"]])
        
        volume = track.get("volume", 1.0)
        start = track.get("start_seconds", 0)
        
        # Delay and volume adjust
        filter_parts.append(
            f"[{i}:a]adelay={int(start * 1000)}|{int(start * 1000)},"
            f"volume={volume}[a{i}]"
        )
    
    # Mix all adjusted tracks
    mix_inputs = "".join(f"[a{i}]" for i in range(len(tracks)))
    filter_parts.append(f"{mix_inputs}amix=inputs={len(tracks)}:duration=longest[out]")
    
    filter_complex = ";".join(filter_parts)
    
    args = inputs + [
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-acodec", "libmp3lame",
        output_path,
    ]
    
    code, stdout, stderr = await run_ffmpeg(args)
    
    if code != 0:
        logger.error(f"FFmpeg mix audio failed: {stderr}")
        raise RuntimeError(f"Mix audio failed: {stderr[:200]}")
    
    logger.info(f"Mixed audio: {output_path}")
    return output_path


async def get_video_duration(input_path: str) -> float:
    """
    Get the duration of a video file in seconds.
    
    Args:
        input_path: Path to video
        
    Returns:
        Duration in seconds
    """
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        input_path,
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
        raise RuntimeError(f"Could not get duration for {input_path}")


async def get_video_info(input_path: str) -> dict:
    """
    Get video file information.
    
    Args:
        input_path: Path to video
        
    Returns:
        Dict with width, height, fps, duration
    """
    cmd = [
        "ffprobe",
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate",
        "-show_entries", "format=duration",
        "-of", "json",
        input_path,
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    
    stdout, stderr = await process.communicate()
    
    import json
    try:
        data = json.loads(stdout.decode())
        stream = data.get("streams", [{}])[0]
        format_info = data.get("format", {})
        
        # Parse frame rate (e.g., "30/1")
        fps_str = stream.get("r_frame_rate", "30/1")
        if "/" in fps_str:
            num, den = fps_str.split("/")
            fps = float(num) / float(den)
        else:
            fps = float(fps_str)
        
        return {
            "width": stream.get("width"),
            "height": stream.get("height"),
            "fps": fps,
            "duration": float(format_info.get("duration", 0)),
        }
    except Exception as e:
        raise RuntimeError(f"Could not parse video info: {e}")


async def postprocess_sora_clip(
    input_path: str,
    output_dir: str,
    shot_id: str,
    shot_type: str,
    postprocess_hints: Optional[dict] = None,
) -> dict:
    """
    Postprocess a Sora clip based on shot type and hints.
    
    Args:
        input_path: Path to raw Sora clip
        output_dir: Directory for processed clips
        shot_id: Shot identifier
        shot_type: Type of shot
        postprocess_hints: Optional processing hints
        
    Returns:
        Dict with paths to processed files
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    result = {
        "src": input_path,
        "alpha_src": None,
        "matte_color": None,
    }
    
    hints = postprocess_hints or {}
    
    # Handle CHAR_ALPHA: apply chroma key
    if shot_type == "CHAR_ALPHA":
        chroma_config = hints.get("chromaKey", {})
        color = chroma_config.get("color", "green")
        similarity = chroma_config.get("similarity", 0.18)
        blend = chroma_config.get("blend", 0.02)
        
        alpha_path = os.path.join(output_dir, f"{shot_id}_alpha.webm")
        await chroma_key_to_alpha(
            input_path=input_path,
            output_path=alpha_path,
            color=color,
            similarity=similarity,
            blend=blend,
        )
        
        result["alpha_src"] = alpha_path
        result["matte_color"] = color
    
    # Handle audio muting
    if hints.get("muteOriginalAudio"):
        muted_path = os.path.join(output_dir, f"{shot_id}_muted.mp4")
        await mute_video(input_path, muted_path)
        result["src"] = muted_path
    
    return result
