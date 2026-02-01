"""
Video Stitcher - Combine AI-generated clips with text overlays and audio
"""
import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass
import logging
import json

logger = logging.getLogger(__name__)


@dataclass
class TextOverlay:
    text: str
    highlight_words: List[str]
    start_time: float
    duration: float
    position: str = "bottom"  # bottom, center, top


@dataclass
class StitchConfig:
    output_path: str
    clips: List[str]
    audio_path: Optional[str] = None
    text_overlays: List[TextOverlay] = None
    background_music: Optional[str] = None
    music_volume: float = 0.15
    resolution: str = "1080x1920"  # 9:16 vertical
    fps: int = 30


class VideoStitcher:
    def __init__(self, output_dir: str = None):
        self.output_dir = Path(output_dir or tempfile.gettempdir())
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Text style config
        self.font = "Impact"
        self.font_size = 64
        self.text_color = "white"
        self.highlight_color = "#FF69B4"  # Pink
        self.outline_color = "black"
        self.outline_width = 4
    
    def concatenate_clips(self, clips: List[str], output_path: str) -> bool:
        """Concatenate video clips using FFmpeg"""
        
        # Create concat file
        concat_file = self.output_dir / "concat.txt"
        with open(concat_file, "w") as f:
            for clip in clips:
                f.write(f"file '{clip}'\n")
        
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c", "copy",
            output_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.error(f"Concat error: {result.stderr}")
                return False
            return True
        except Exception as e:
            logger.error(f"Concat exception: {e}")
            return False
    
    def add_text_overlay(
        self,
        input_path: str,
        output_path: str,
        overlays: List[TextOverlay]
    ) -> bool:
        """Add text overlays with highlights to video"""
        
        # Build complex filter for multiple text overlays
        filter_parts = []
        
        for i, overlay in enumerate(overlays):
            # Calculate y position
            if overlay.position == "bottom":
                y_pos = "h-150"
            elif overlay.position == "center":
                y_pos = "(h-text_h)/2"
            else:  # top
                y_pos = "100"
            
            # Create drawtext filter
            text_filter = (
                f"drawtext=text='{overlay.text}':"
                f"fontfile=/System/Library/Fonts/Impact.ttf:"
                f"fontsize={self.font_size}:"
                f"fontcolor={self.text_color}:"
                f"borderw={self.outline_width}:"
                f"bordercolor={self.outline_color}:"
                f"x=(w-text_w)/2:y={y_pos}:"
                f"enable='between(t,{overlay.start_time},{overlay.start_time + overlay.duration})'"
            )
            filter_parts.append(text_filter)
        
        filter_string = ",".join(filter_parts) if filter_parts else "null"
        
        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-vf", filter_string,
            "-c:a", "copy",
            output_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.error(f"Text overlay error: {result.stderr}")
                return False
            return True
        except Exception as e:
            logger.error(f"Text overlay exception: {e}")
            return False
    
    def add_audio(
        self,
        video_path: str,
        audio_path: str,
        output_path: str,
        background_music: Optional[str] = None,
        music_volume: float = 0.15
    ) -> bool:
        """Add narration audio and optional background music"""
        
        if background_music:
            # Mix narration with background music
            cmd = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-i", audio_path,
                "-i", background_music,
                "-filter_complex",
                f"[1:a]volume=1[narration];[2:a]volume={music_volume}[music];[narration][music]amix=inputs=2:duration=first[aout]",
                "-map", "0:v",
                "-map", "[aout]",
                "-c:v", "copy",
                "-shortest",
                output_path
            ]
        else:
            # Just add narration
            cmd = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-i", audio_path,
                "-map", "0:v",
                "-map", "1:a",
                "-c:v", "copy",
                "-shortest",
                output_path
            ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.error(f"Audio add error: {result.stderr}")
                return False
            return True
        except Exception as e:
            logger.error(f"Audio add exception: {e}")
            return False
    
    def stitch_full_video(self, config: StitchConfig) -> Optional[str]:
        """Full stitching pipeline: concat → text → audio"""
        
        logger.info(f"Stitching {len(config.clips)} clips...")
        
        # Step 1: Concatenate clips
        concat_output = str(self.output_dir / "concat_temp.mp4")
        if not self.concatenate_clips(config.clips, concat_output):
            return None
        logger.info("✅ Clips concatenated")
        
        # Step 2: Add text overlays
        if config.text_overlays:
            text_output = str(self.output_dir / "text_temp.mp4")
            if not self.add_text_overlay(concat_output, text_output, config.text_overlays):
                return None
            logger.info("✅ Text overlays added")
        else:
            text_output = concat_output
        
        # Step 3: Add audio
        if config.audio_path:
            if not self.add_audio(
                text_output,
                config.audio_path,
                config.output_path,
                config.background_music,
                config.music_volume
            ):
                return None
            logger.info("✅ Audio added")
        else:
            # Just copy
            subprocess.run(["cp", text_output, config.output_path])
        
        # Cleanup temp files
        for temp_file in [concat_output, str(self.output_dir / "text_temp.mp4")]:
            if Path(temp_file).exists() and temp_file != config.output_path:
                Path(temp_file).unlink()
        
        logger.info(f"✅ Final video: {config.output_path}")
        return config.output_path
    
    def get_video_duration(self, video_path: str) -> float:
        """Get duration of a video file"""
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            return float(result.stdout.strip())
        except:
            return 0.0
