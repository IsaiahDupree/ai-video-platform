"""
Timeline Assembler Service
==========================
Assembles generated video clips into final rendered output.

Pipeline:
1. Load all passed clips in order
2. Apply transitions between clips
3. Mix audio tracks (VO, music, SFX)
4. Render final MP4 via MoviePy

Supported Transitions:
- cut: Hard cut (default)
- crossfade: Dissolve (0.5-2s)
- fade_black: Fade to/from black
"""

import asyncio
import logging
import os
import tempfile
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4

logger = logging.getLogger(__name__)


class TransitionType(str, Enum):
    """Types of transitions between clips."""
    CUT = "cut"
    CROSSFADE = "crossfade"
    FADE_BLACK = "fade_black"
    WIPE_LEFT = "wipe_left"
    WIPE_RIGHT = "wipe_right"


class AudioTrackType(str, Enum):
    """Types of audio tracks."""
    VOICEOVER = "voiceover"
    MUSIC = "music"
    SFX = "sfx"
    ORIGINAL = "original"


@dataclass
class Transition:
    """Transition between clips."""
    type: TransitionType = TransitionType.CUT
    duration_seconds: float = 0.5
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "duration_seconds": self.duration_seconds
        }


@dataclass
class AudioTrack:
    """Audio track to mix into final video."""
    type: AudioTrackType
    file_path: str
    volume: float = 1.0
    start_time: float = 0.0
    end_time: Optional[float] = None
    fade_in: float = 0.0
    fade_out: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "file_path": self.file_path,
            "volume": self.volume,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "fade_in": self.fade_in,
            "fade_out": self.fade_out
        }


@dataclass
class ClipSource:
    """Source clip for assembly."""
    clip_id: str
    file_path: str
    duration: float
    order: int
    scene_id: Optional[str] = None
    narration_text: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "clip_id": self.clip_id,
            "file_path": self.file_path,
            "duration": self.duration,
            "order": self.order,
            "scene_id": self.scene_id
        }


@dataclass
class TimelineSpec:
    """Specification for timeline assembly."""
    clips: List[ClipSource]
    transitions: List[Transition] = field(default_factory=list)
    audio_tracks: List[AudioTrack] = field(default_factory=list)
    output_resolution: Tuple[int, int] = (1920, 1080)
    output_fps: int = 30
    output_format: str = "mp4"
    output_codec: str = "libx264"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "clips": [c.to_dict() for c in self.clips],
            "transitions": [t.to_dict() for t in self.transitions],
            "audio_tracks": [a.to_dict() for a in self.audio_tracks],
            "output_resolution": self.output_resolution,
            "output_fps": self.output_fps,
            "output_format": self.output_format
        }
    
    @property
    def total_duration(self) -> float:
        """Calculate total duration accounting for transitions."""
        if not self.clips:
            return 0.0
        
        base_duration = sum(c.duration for c in self.clips)
        
        # Subtract overlap from crossfades
        overlap = 0.0
        for t in self.transitions:
            if t.type in (TransitionType.CROSSFADE, TransitionType.FADE_BLACK):
                overlap += t.duration_seconds / 2
        
        return max(0, base_duration - overlap)


@dataclass
class RenderResult:
    """Result of timeline render."""
    success: bool
    output_path: Optional[str] = None
    duration_seconds: float = 0.0
    file_size_bytes: int = 0
    error: Optional[str] = None
    render_time_seconds: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "output_path": self.output_path,
            "duration_seconds": self.duration_seconds,
            "file_size_bytes": self.file_size_bytes,
            "error": self.error,
            "render_time_seconds": self.render_time_seconds
        }


class TimelineAssembler:
    """
    Assembles video clips into a final rendered output.
    
    Uses MoviePy for video processing.
    """
    
    def __init__(
        self,
        output_dir: Optional[str] = None,
        use_gpu: bool = False
    ):
        self.output_dir = output_dir or tempfile.gettempdir()
        self.use_gpu = use_gpu
        self._moviepy_available = self._check_moviepy()
    
    def _check_moviepy(self) -> bool:
        """Check if MoviePy is available."""
        try:
            import moviepy.editor
            return True
        except ImportError:
            logger.warning("MoviePy not available - render will be simulated")
            return False
    
    async def assemble(
        self,
        spec: TimelineSpec,
        output_filename: Optional[str] = None
    ) -> RenderResult:
        """
        Assemble clips according to timeline spec.
        
        Args:
            spec: TimelineSpec with clips, transitions, audio
            output_filename: Optional output filename
        
        Returns:
            RenderResult with output path and stats
        """
        import time
        start_time = time.time()
        
        if not spec.clips:
            return RenderResult(
                success=False,
                error="No clips provided"
            )
        
        # Generate output filename
        if not output_filename:
            output_filename = f"render_{uuid4().hex[:8]}.{spec.output_format}"
        
        output_path = os.path.join(self.output_dir, output_filename)
        
        logger.info(f"Assembling {len(spec.clips)} clips to {output_path}")
        
        if self._moviepy_available:
            result = await self._render_with_moviepy(spec, output_path)
        else:
            result = await self._simulate_render(spec, output_path)
        
        result.render_time_seconds = time.time() - start_time
        
        return result
    
    async def _render_with_moviepy(
        self,
        spec: TimelineSpec,
        output_path: str
    ) -> RenderResult:
        """Render using MoviePy."""
        try:
            from moviepy.editor import (
                VideoFileClip, AudioFileClip, CompositeVideoClip,
                CompositeAudioClip, concatenate_videoclips
            )
            
            # Load video clips
            video_clips = []
            for clip_source in sorted(spec.clips, key=lambda c: c.order):
                if not os.path.exists(clip_source.file_path):
                    logger.warning(f"Clip not found: {clip_source.file_path}")
                    continue
                
                try:
                    clip = VideoFileClip(clip_source.file_path)
                    video_clips.append(clip)
                except Exception as e:
                    logger.error(f"Failed to load clip: {e}")
                    continue
            
            if not video_clips:
                return RenderResult(
                    success=False,
                    error="No valid video clips loaded"
                )
            
            # Apply transitions
            final_clips = self._apply_transitions(video_clips, spec.transitions)
            
            # Concatenate
            if len(final_clips) == 1:
                final_video = final_clips[0]
            else:
                final_video = concatenate_videoclips(final_clips, method="compose")
            
            # Add audio tracks
            if spec.audio_tracks:
                final_video = self._mix_audio(final_video, spec.audio_tracks)
            
            # Write output
            final_video.write_videofile(
                output_path,
                fps=spec.output_fps,
                codec=spec.output_codec,
                audio_codec="aac",
                threads=4,
                logger=None
            )
            
            # Get file stats
            file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
            
            # Cleanup
            for clip in video_clips:
                clip.close()
            final_video.close()
            
            return RenderResult(
                success=True,
                output_path=output_path,
                duration_seconds=final_video.duration,
                file_size_bytes=file_size
            )
            
        except Exception as e:
            logger.error(f"MoviePy render failed: {e}")
            return RenderResult(
                success=False,
                error=str(e)
            )
    
    def _apply_transitions(
        self,
        clips: List,
        transitions: List[Transition]
    ) -> List:
        """Apply transitions between clips."""
        if not transitions or len(clips) <= 1:
            return clips
        
        from moviepy.editor import CompositeVideoClip, concatenate_videoclips
        
        result = [clips[0]]
        
        for i, clip in enumerate(clips[1:], 1):
            # Get transition for this pair
            trans = transitions[i-1] if i-1 < len(transitions) else Transition()
            
            if trans.type == TransitionType.CUT:
                result.append(clip)
            
            elif trans.type == TransitionType.CROSSFADE:
                # Crossfade: overlap and fade
                duration = trans.duration_seconds
                
                # Set clip to start earlier by overlap amount
                clip = clip.set_start(result[-1].end - duration)
                clip = clip.crossfadein(duration)
                
                result.append(clip)
            
            elif trans.type == TransitionType.FADE_BLACK:
                # Fade out previous, fade in current
                duration = trans.duration_seconds / 2
                
                result[-1] = result[-1].fadeout(duration)
                clip = clip.fadein(duration)
                result.append(clip)
            
            else:
                # Default to cut
                result.append(clip)
        
        return result
    
    def _mix_audio(self, video, audio_tracks: List[AudioTrack]):
        """Mix audio tracks into video."""
        from moviepy.editor import AudioFileClip, CompositeAudioClip
        
        audio_clips = []
        
        # Keep original audio if present
        if video.audio is not None:
            audio_clips.append(video.audio)
        
        for track in audio_tracks:
            if not os.path.exists(track.file_path):
                logger.warning(f"Audio not found: {track.file_path}")
                continue
            
            try:
                audio = AudioFileClip(track.file_path)
                
                # Apply volume
                audio = audio.volumex(track.volume)
                
                # Set start time
                audio = audio.set_start(track.start_time)
                
                # Trim if needed
                if track.end_time:
                    audio = audio.subclip(0, track.end_time - track.start_time)
                
                # Apply fades
                if track.fade_in > 0:
                    audio = audio.audio_fadein(track.fade_in)
                if track.fade_out > 0:
                    audio = audio.audio_fadeout(track.fade_out)
                
                audio_clips.append(audio)
                
            except Exception as e:
                logger.error(f"Failed to load audio: {e}")
        
        if audio_clips:
            final_audio = CompositeAudioClip(audio_clips)
            video = video.set_audio(final_audio)
        
        return video
    
    async def _simulate_render(
        self,
        spec: TimelineSpec,
        output_path: str
    ) -> RenderResult:
        """Simulate render when MoviePy not available."""
        logger.info("Simulating render (MoviePy not available)")
        
        # Simulate processing time
        await asyncio.sleep(0.1 * len(spec.clips))
        
        # Create dummy output file
        with open(output_path, 'wb') as f:
            f.write(b"SIMULATED_VIDEO_OUTPUT")
        
        return RenderResult(
            success=True,
            output_path=output_path,
            duration_seconds=spec.total_duration,
            file_size_bytes=22  # Size of dummy content
        )
    
    def validate_spec(self, spec: TimelineSpec) -> Tuple[bool, List[str]]:
        """
        Validate timeline specification.
        
        Returns:
            Tuple of (is_valid, list of errors)
        """
        errors = []
        
        if not spec.clips:
            errors.append("No clips provided")
        
        # Check clip files exist
        for clip in spec.clips:
            if not clip.file_path:
                errors.append(f"Clip {clip.clip_id} has no file path")
            elif not os.path.exists(clip.file_path):
                errors.append(f"Clip file not found: {clip.file_path}")
        
        # Check transition count matches gaps
        if spec.transitions and len(spec.transitions) > len(spec.clips) - 1:
            errors.append("Too many transitions for number of clips")
        
        # Check audio files exist
        for track in spec.audio_tracks:
            if not os.path.exists(track.file_path):
                errors.append(f"Audio file not found: {track.file_path}")
        
        # Check total duration doesn't exceed 5 minutes
        if spec.total_duration > 300:
            errors.append(f"Total duration {spec.total_duration}s exceeds 5 minute limit")
        
        return len(errors) == 0, errors
    
    async def create_thumbnail(
        self,
        video_path: str,
        timestamp: float = 0.0,
        output_path: Optional[str] = None
    ) -> Optional[str]:
        """
        Extract a thumbnail from video.
        
        Args:
            video_path: Path to video file
            timestamp: Time to extract frame (seconds)
            output_path: Output path for thumbnail
        
        Returns:
            Path to thumbnail or None
        """
        if not output_path:
            base = os.path.splitext(video_path)[0]
            output_path = f"{base}_thumb.jpg"
        
        if self._moviepy_available:
            try:
                from moviepy.editor import VideoFileClip
                
                clip = VideoFileClip(video_path)
                frame = clip.get_frame(min(timestamp, clip.duration - 0.1))
                
                from PIL import Image
                img = Image.fromarray(frame)
                img.save(output_path, quality=85)
                
                clip.close()
                return output_path
                
            except Exception as e:
                logger.error(f"Failed to create thumbnail: {e}")
                return None
        
        return None
    
    def estimate_file_size(self, spec: TimelineSpec) -> int:
        """
        Estimate output file size in bytes.
        
        Rough estimate: ~2MB per second for 1080p H.264
        """
        duration = spec.total_duration
        width, height = spec.output_resolution
        
        # Base: ~2MB/s for 1080p
        base_rate = 2 * 1024 * 1024
        
        # Scale by resolution
        resolution_factor = (width * height) / (1920 * 1080)
        
        estimated_bytes = int(duration * base_rate * resolution_factor)
        
        return estimated_bytes


class TimelineBuilder:
    """
    Builder for creating TimelineSpec from clip plan.
    """
    
    def __init__(self, assembler: Optional[TimelineAssembler] = None):
        self.assembler = assembler or TimelineAssembler()
        self._clips: List[ClipSource] = []
        self._transitions: List[Transition] = []
        self._audio_tracks: List[AudioTrack] = []
        self._resolution: Tuple[int, int] = (1920, 1080)
        self._fps: int = 30
    
    def add_clip(
        self,
        clip_id: str,
        file_path: str,
        duration: float,
        order: Optional[int] = None
    ) -> "TimelineBuilder":
        """Add a clip to the timeline."""
        if order is None:
            order = len(self._clips)
        
        self._clips.append(ClipSource(
            clip_id=clip_id,
            file_path=file_path,
            duration=duration,
            order=order
        ))
        return self
    
    def add_transition(
        self,
        type: TransitionType = TransitionType.CUT,
        duration: float = 0.5
    ) -> "TimelineBuilder":
        """Add a transition between clips."""
        self._transitions.append(Transition(
            type=type,
            duration_seconds=duration
        ))
        return self
    
    def add_voiceover(
        self,
        file_path: str,
        volume: float = 1.0,
        start_time: float = 0.0
    ) -> "TimelineBuilder":
        """Add voiceover audio track."""
        self._audio_tracks.append(AudioTrack(
            type=AudioTrackType.VOICEOVER,
            file_path=file_path,
            volume=volume,
            start_time=start_time
        ))
        return self
    
    def add_music(
        self,
        file_path: str,
        volume: float = 0.3,
        fade_in: float = 1.0,
        fade_out: float = 2.0
    ) -> "TimelineBuilder":
        """Add background music track."""
        self._audio_tracks.append(AudioTrack(
            type=AudioTrackType.MUSIC,
            file_path=file_path,
            volume=volume,
            fade_in=fade_in,
            fade_out=fade_out
        ))
        return self
    
    def set_resolution(self, width: int, height: int) -> "TimelineBuilder":
        """Set output resolution."""
        self._resolution = (width, height)
        return self
    
    def set_fps(self, fps: int) -> "TimelineBuilder":
        """Set output FPS."""
        self._fps = fps
        return self
    
    def build(self) -> TimelineSpec:
        """Build the timeline specification."""
        return TimelineSpec(
            clips=sorted(self._clips, key=lambda c: c.order),
            transitions=self._transitions,
            audio_tracks=self._audio_tracks,
            output_resolution=self._resolution,
            output_fps=self._fps
        )
    
    async def build_and_render(
        self,
        output_filename: Optional[str] = None
    ) -> RenderResult:
        """Build spec and render."""
        spec = self.build()
        return await self.assembler.assemble(spec, output_filename)
    
    def reset(self) -> "TimelineBuilder":
        """Reset builder state."""
        self._clips = []
        self._transitions = []
        self._audio_tracks = []
        return self
