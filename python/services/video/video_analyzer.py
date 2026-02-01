"""
Video Analyzer Service
Analyzes video files to extract orientation, duration, and metadata
"""
import os
import subprocess
import json
from typing import Dict, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
from loguru import logger


class Orientation(str, Enum):
    """Video orientation types"""
    VERTICAL = "vertical"      # 9:16 (e.g., 1080x1920)
    HORIZONTAL = "horizontal"  # 16:9 (e.g., 1920x1080)
    SQUARE = "square"          # 1:1 (e.g., 1080x1080)


@dataclass
class VideoMetadata:
    """Video metadata extracted from file"""
    orientation: Orientation
    aspect_ratio: float
    width: int
    height: int
    duration_seconds: float
    file_size_bytes: int
    codec: str
    bitrate: int
    fps: float
    file_path: str


class VideoAnalyzer:
    """
    Analyzes video files using FFmpeg to extract metadata.
    
    Features:
    - Orientation detection (vertical, horizontal, square)
    - Duration extraction
    - Resolution and aspect ratio
    - Codec and bitrate information
    """
    
    def __init__(self):
        self._verify_ffmpeg()
        logger.info("Video analyzer initialized")
    
    def _verify_ffmpeg(self):
        """Verify FFmpeg is installed and accessible"""
        try:
            subprocess.run(
                ["ffprobe", "-version"],
                capture_output=True,
                check=True
            )
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("FFmpeg/FFprobe not found. Please install FFmpeg.")
            raise RuntimeError("FFmpeg is required but not installed")
    
    def analyze_video(self, file_path: str) -> VideoMetadata:
        """
        Analyze video file and extract all metadata.
        
        Args:
            file_path: Path to video file
            
        Returns:
            VideoMetadata with all extracted information
            
        Raises:
            FileNotFoundError: If video file doesn't exist
            RuntimeError: If FFprobe fails to analyze video
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Video file not found: {file_path}")
        
        logger.info(f"Analyzing video: {file_path}")
        
        # Extract metadata using FFprobe
        metadata = self._extract_metadata(file_path)
        
        # Get video stream info
        video_stream = self._get_video_stream(metadata)
        
        # Extract dimensions
        width = int(video_stream.get("width", 0))
        height = int(video_stream.get("height", 0))
        
        # Calculate aspect ratio and orientation
        aspect_ratio = width / height if height > 0 else 1.0
        orientation = self.detect_orientation(width, height)
        
        # Extract duration
        duration = float(metadata.get("format", {}).get("duration", 0))
        
        # Extract other metadata
        file_size = int(metadata.get("format", {}).get("size", 0))
        codec = video_stream.get("codec_name", "unknown")
        bitrate = int(video_stream.get("bit_rate", 0))
        
        # Extract FPS
        fps_str = video_stream.get("r_frame_rate", "0/1")
        fps = self._parse_fps(fps_str)
        
        result = VideoMetadata(
            orientation=orientation,
            aspect_ratio=round(aspect_ratio, 4),
            width=width,
            height=height,
            duration_seconds=round(duration, 2),
            file_size_bytes=file_size,
            codec=codec,
            bitrate=bitrate,
            fps=round(fps, 2),
            file_path=file_path
        )
        
        logger.info(
            f"Analysis complete: {orientation.value} {width}x{height} "
            f"({duration:.1f}s)"
        )
        
        return result
    
    def _extract_metadata(self, file_path: str) -> Dict:
        """
        Extract video metadata using FFprobe.
        
        Returns:
            Dictionary with format and stream information
        """
        try:
            result = subprocess.run(
                [
                    "ffprobe",
                    "-v", "quiet",
                    "-print_format", "json",
                    "-show_format",
                    "-show_streams",
                    file_path
                ],
                capture_output=True,
                text=True,
                check=True
            )
            
            return json.loads(result.stdout)
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFprobe failed: {e.stderr}")
            raise RuntimeError(f"Failed to analyze video: {e.stderr}")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse FFprobe output: {e}")
            raise RuntimeError(f"Invalid FFprobe output: {e}")
    
    def _get_video_stream(self, metadata: Dict) -> Dict:
        """
        Extract video stream from metadata.
        
        Returns:
            Video stream dictionary
        """
        streams = metadata.get("streams", [])
        
        for stream in streams:
            if stream.get("codec_type") == "video":
                return stream
        
        raise RuntimeError("No video stream found in file")
    
    def _parse_fps(self, fps_str: str) -> float:
        """
        Parse FPS from FFprobe format (e.g., "30/1" or "30000/1001").
        
        Returns:
            FPS as float
        """
        try:
            if "/" in fps_str:
                numerator, denominator = fps_str.split("/")
                return float(numerator) / float(denominator)
            return float(fps_str)
        except (ValueError, ZeroDivisionError):
            return 0.0
    
    def detect_orientation(self, width: int, height: int) -> Orientation:
        """
        Detect video orientation from dimensions.
        
        Args:
            width: Video width in pixels
            height: Video height in pixels
            
        Returns:
            Orientation enum value
            
        Thresholds:
        - Vertical: aspect_ratio < 0.75 (e.g., 9:16 = 0.5625)
        - Horizontal: aspect_ratio > 1.33 (e.g., 16:9 = 1.7778)
        - Square: 0.75 <= aspect_ratio <= 1.33
        """
        if height == 0:
            return Orientation.SQUARE
        
        aspect_ratio = width / height
        
        if aspect_ratio < 0.75:
            return Orientation.VERTICAL
        elif aspect_ratio > 1.33:
            return Orientation.HORIZONTAL
        else:
            return Orientation.SQUARE
    
    def get_duration(self, file_path: str) -> float:
        """
        Extract video duration in seconds.
        
        Args:
            file_path: Path to video file
            
        Returns:
            Duration in seconds
        """
        try:
            result = subprocess.run(
                [
                    "ffprobe",
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    file_path
                ],
                capture_output=True,
                text=True,
                check=True
            )
            
            return float(result.stdout.strip())
            
        except (subprocess.CalledProcessError, ValueError) as e:
            logger.error(f"Failed to extract duration: {e}")
            return 0.0
    
    def get_dimensions(self, file_path: str) -> Tuple[int, int]:
        """
        Extract video dimensions (width, height).
        
        Args:
            file_path: Path to video file
            
        Returns:
            Tuple of (width, height)
        """
        try:
            result = subprocess.run(
                [
                    "ffprobe",
                    "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=width,height",
                    "-of", "csv=s=x:p=0",
                    file_path
                ],
                capture_output=True,
                text=True,
                check=True
            )
            
            width, height = result.stdout.strip().split("x")
            return int(width), int(height)
            
        except (subprocess.CalledProcessError, ValueError) as e:
            logger.error(f"Failed to extract dimensions: {e}")
            return 0, 0


# Singleton instance
_analyzer_instance = None


def get_video_analyzer() -> VideoAnalyzer:
    """Get or create video analyzer singleton"""
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = VideoAnalyzer()
    return _analyzer_instance
