"""
Creative Brief Renderer
========================
Takes creative briefs (data, prompts, specifications) and produces videos.

Input Pipeline:
- Creative Brief (text content, style, duration)
- Data Sources (B-Roll video, images, audio)
- AI-Generated Content (quotes, hooks, captions)

Output:
- Rendered video meeting quality standards
- Quality validation report
- Metadata for tracking
"""

import asyncio
import json
import os
import subprocess
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
from loguru import logger


class ContentType(Enum):
    """Types of content that can be rendered"""
    MOTIVATIONAL_QUOTE = "motivational_quote"
    BROLL_TEXT = "broll_text"
    TREND_BREAKDOWN = "trend_breakdown"
    PRODUCT_PROMO = "product_promo"
    HOOK_INTRO = "hook_intro"
    CTA_OUTRO = "cta_outro"


class VideoQuality(Enum):
    """Video quality levels"""
    DRAFT = "draft"  # Quick preview, lower quality
    STANDARD = "standard"  # 1080p, good compression
    HIGH = "high"  # 1080p, high bitrate
    PREMIUM = "premium"  # 4K ready


@dataclass
class CreativeBrief:
    """
    Creative brief containing all information needed to render a video.
    
    This is the INPUT specification.
    """
    # Required
    content_type: ContentType
    primary_text: str
    duration_seconds: float
    
    # Optional text content
    secondary_text: Optional[str] = None
    author_attribution: Optional[str] = None
    call_to_action: Optional[str] = None
    hashtags: List[str] = field(default_factory=list)
    
    # Style settings
    font_family: str = "Inter"
    primary_color: str = "#ffffff"
    secondary_color: str = "rgba(255,255,255,0.8)"
    background_color: str = "rgba(0,0,0,0.5)"
    text_size: int = 64
    
    # Media sources
    background_video_path: Optional[str] = None
    background_image_path: Optional[str] = None
    background_music_path: Optional[str] = None
    music_volume: float = 0.3
    
    # Animation settings
    animation_style: str = "fade"  # fade, slide, scale, bounce
    animation_duration: float = 0.8
    
    # Output settings
    output_width: int = 1080
    output_height: int = 1920  # Default vertical for social
    fps: int = 30
    quality: VideoQuality = VideoQuality.STANDARD
    
    # Metadata
    brief_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "brief_id": self.brief_id,
            "content_type": self.content_type.value,
            "primary_text": self.primary_text,
            "secondary_text": self.secondary_text,
            "author_attribution": self.author_attribution,
            "call_to_action": self.call_to_action,
            "hashtags": self.hashtags,
            "duration_seconds": self.duration_seconds,
            "font_family": self.font_family,
            "primary_color": self.primary_color,
            "secondary_color": self.secondary_color,
            "background_color": self.background_color,
            "text_size": self.text_size,
            "background_video_path": self.background_video_path,
            "background_image_path": self.background_image_path,
            "background_music_path": self.background_music_path,
            "music_volume": self.music_volume,
            "animation_style": self.animation_style,
            "animation_duration": self.animation_duration,
            "output_width": self.output_width,
            "output_height": self.output_height,
            "fps": self.fps,
            "quality": self.quality.value,
            "created_at": self.created_at.isoformat(),
        }


@dataclass
class QualityReport:
    """Quality validation report for rendered video"""
    passed: bool
    video_path: str
    duration_actual: float
    duration_expected: float
    file_size_bytes: int
    resolution: Dict[str, int]
    fps_actual: float
    has_audio: bool
    issues: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "passed": self.passed,
            "video_path": self.video_path,
            "duration_actual": self.duration_actual,
            "duration_expected": self.duration_expected,
            "file_size_bytes": self.file_size_bytes,
            "resolution": self.resolution,
            "fps_actual": self.fps_actual,
            "has_audio": self.has_audio,
            "issues": self.issues,
            "warnings": self.warnings,
        }


@dataclass
class RenderResult:
    """Result of rendering a creative brief"""
    success: bool
    brief_id: str
    video_path: Optional[str]
    quality_report: Optional[QualityReport]
    render_time_seconds: float
    error_message: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "brief_id": self.brief_id,
            "video_path": self.video_path,
            "quality_report": self.quality_report.to_dict() if self.quality_report else None,
            "render_time_seconds": self.render_time_seconds,
            "error_message": self.error_message,
        }


class CreativeBriefRenderer:
    """
    Renders videos from creative briefs using Motion Canvas.
    
    Pipeline:
    1. Validate creative brief
    2. Generate Motion Canvas scene from brief
    3. Render video using Motion Canvas CLI
    4. Validate output quality
    5. Return result with quality report
    """
    
    def __init__(
        self,
        motion_canvas_dir: Optional[str] = None,
        output_dir: Optional[str] = None,
    ):
        self.motion_canvas_dir = Path(
            motion_canvas_dir or "/Users/isaiahdupree/Documents/Software/MotionCanvas"
        )
        self.output_dir = Path(
            output_dir or "/Users/isaiahdupree/Documents/Software/MediaPoster/Backend/data/rendered_videos"
        )
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"[CreativeBriefRenderer] Initialized")
        logger.info(f"  Motion Canvas: {self.motion_canvas_dir}")
        logger.info(f"  Output dir: {self.output_dir}")
    
    def validate_brief(self, brief: CreativeBrief) -> List[str]:
        """Validate creative brief before rendering"""
        issues = []
        
        if not brief.primary_text or len(brief.primary_text.strip()) == 0:
            issues.append("Primary text is required")
        
        if brief.duration_seconds <= 0:
            issues.append("Duration must be positive")
        
        if brief.duration_seconds > 120:
            issues.append("Duration exceeds 2 minute limit")
        
        if brief.background_video_path and not Path(brief.background_video_path).exists():
            issues.append(f"Background video not found: {brief.background_video_path}")
        
        if brief.background_image_path and not Path(brief.background_image_path).exists():
            issues.append(f"Background image not found: {brief.background_image_path}")
        
        if brief.background_music_path and not Path(brief.background_music_path).exists():
            issues.append(f"Background music not found: {brief.background_music_path}")
        
        return issues
    
    def _generate_scene_code(self, brief: CreativeBrief) -> str:
        """Generate Motion Canvas TypeScript scene code from brief"""
        
        # Escape text for TypeScript
        primary_text = brief.primary_text.replace("'", "\\'").replace('"', '\\"')
        secondary_text = (brief.secondary_text or "").replace("'", "\\'").replace('"', '\\"')
        author = (brief.author_attribution or "").replace("'", "\\'").replace('"', '\\"')
        
        # Build scene based on content type
        if brief.content_type == ContentType.MOTIVATIONAL_QUOTE:
            return self._generate_quote_scene(brief, primary_text, author)
        elif brief.content_type == ContentType.BROLL_TEXT:
            return self._generate_broll_scene(brief, primary_text, secondary_text)
        else:
            return self._generate_generic_scene(brief, primary_text, secondary_text)
    
    def _generate_quote_scene(self, brief: CreativeBrief, text: str, author: str) -> str:
        """Generate motivational quote scene"""
        return f'''import {{makeScene2D, Txt, Rect}} from '@motion-canvas/2d';
import {{all, createRef, waitFor, easeOutCubic}} from '@motion-canvas/core';

export default makeScene2D(function* (view) {{
  const quoteRef = createRef<Txt>();
  const authorRef = createRef<Txt>();
  const bgRef = createRef<Rect>();

  view.add(
    <Rect
      ref={{bgRef}}
      width={{{brief.output_width}}}
      height={{{brief.output_height}}}
      fill={{'{brief.background_color}'}}
      opacity={{0}}
    />
  );

  view.add(
    <Txt
      ref={{quoteRef}}
      text={{'{text}'}}
      fontSize={{{brief.text_size}}}
      fontFamily={{'{brief.font_family}, sans-serif'}}
      fontStyle={{'italic'}}
      fill={{'{brief.primary_color}'}}
      textAlign={{'center'}}
      width={{{brief.output_width - 100}}}
      textWrap={{true}}
      lineHeight={{1.4}}
      shadowColor={{'rgba(0,0,0,0.5)'}}
      shadowBlur={{15}}
      y={{-30}}
      opacity={{0}}
    />
  );

  view.add(
    <Txt
      ref={{authorRef}}
      text={{'— {author}'}}
      fontSize={{32}}
      fontFamily={{'{brief.font_family}, sans-serif'}}
      fill={{'{brief.secondary_color}'}}
      textAlign={{'center'}}
      y={{120}}
      opacity={{0}}
    />
  );

  yield* bgRef().opacity(1, {brief.animation_duration});
  yield* quoteRef().opacity(1, {brief.animation_duration}, easeOutCubic);
  yield* authorRef().opacity(1, 0.5);
  yield* waitFor({brief.duration_seconds - brief.animation_duration * 3});
  yield* all(
    quoteRef().opacity(0, 0.5),
    authorRef().opacity(0, 0.5),
    bgRef().opacity(0, 0.5),
  );
}});
'''
    
    def _generate_broll_scene(self, brief: CreativeBrief, text: str, subtext: str) -> str:
        """Generate B-Roll + Text scene"""
        return f'''import {{makeScene2D, Txt, Rect}} from '@motion-canvas/2d';
import {{all, createRef, waitFor, easeOutCubic, easeOutBack}} from '@motion-canvas/core';

export default makeScene2D(function* (view) {{
  const textRef = createRef<Txt>();
  const subtextRef = createRef<Txt>();
  const overlayRef = createRef<Rect>();

  view.add(
    <Rect
      ref={{overlayRef}}
      width={{{brief.output_width}}}
      height={{{brief.output_height}}}
      fill={{'{brief.background_color}'}}
      opacity={{0}}
    />
  );

  view.add(
    <Txt
      ref={{textRef}}
      text={{'{text}'}}
      fontSize={{{brief.text_size}}}
      fontFamily={{'{brief.font_family}, sans-serif'}}
      fontWeight={{700}}
      fill={{'{brief.primary_color}'}}
      textAlign={{'center'}}
      width={{{brief.output_width - 100}}}
      textWrap={{true}}
      shadowColor={{'rgba(0,0,0,0.8)'}}
      shadowBlur={{20}}
      y={{-50}}
      opacity={{0}}
      scale={{0.8}}
    />
  );

  view.add(
    <Txt
      ref={{subtextRef}}
      text={{'{subtext}'}}
      fontSize={{36}}
      fontFamily={{'{brief.font_family}, sans-serif'}}
      fill={{'{brief.secondary_color}'}}
      textAlign={{'center'}}
      y={{80}}
      opacity={{0}}
    />
  );

  yield* overlayRef().opacity(1, 0.5);
  yield* all(
    textRef().opacity(1, {brief.animation_duration}, easeOutCubic),
    textRef().scale(1, {brief.animation_duration}, easeOutBack),
  );
  yield* subtextRef().opacity(1, 0.5);
  yield* waitFor({brief.duration_seconds - brief.animation_duration * 2 - 1});
  yield* all(
    textRef().opacity(0, 0.5),
    subtextRef().opacity(0, 0.5),
    overlayRef().opacity(0, 0.5),
  );
}});
'''
    
    def _generate_generic_scene(self, brief: CreativeBrief, text: str, subtext: str) -> str:
        """Generate generic text overlay scene"""
        return f'''import {{makeScene2D, Txt, Rect}} from '@motion-canvas/2d';
import {{all, createRef, waitFor, easeOutCubic}} from '@motion-canvas/core';

export default makeScene2D(function* (view) {{
  const titleRef = createRef<Txt>();
  const bodyRef = createRef<Txt>();
  const bgRef = createRef<Rect>();

  view.add(
    <Rect
      ref={{bgRef}}
      width={{{brief.output_width}}}
      height={{300}}
      y={{300}}
      fill={{'{brief.background_color}'}}
      opacity={{0}}
    />
  );

  view.add(
    <Txt
      ref={{titleRef}}
      text={{'{text}'}}
      fontSize={{{brief.text_size}}}
      fontFamily={{'{brief.font_family}, sans-serif'}}
      fontWeight={{800}}
      fill={{'{brief.primary_color}'}}
      textAlign={{'center'}}
      width={{{brief.output_width - 100}}}
      textWrap={{true}}
      y={{250}}
      opacity={{0}}
    />
  );

  view.add(
    <Txt
      ref={{bodyRef}}
      text={{'{subtext}'}}
      fontSize={{32}}
      fontFamily={{'{brief.font_family}, sans-serif'}}
      fill={{'{brief.secondary_color}'}}
      textAlign={{'center'}}
      y={{330}}
      opacity={{0}}
    />
  );

  yield* bgRef().opacity(1, 0.3);
  yield* titleRef().opacity(1, {brief.animation_duration}, easeOutCubic);
  yield* bodyRef().opacity(1, 0.4);
  yield* waitFor({brief.duration_seconds - brief.animation_duration - 1});
  yield* all(
    titleRef().opacity(0, 0.3),
    bodyRef().opacity(0, 0.3),
    bgRef().opacity(0, 0.3),
  );
}});
'''
    
    async def _validate_output(
        self,
        video_path: Path,
        brief: CreativeBrief,
    ) -> QualityReport:
        """Validate the rendered video meets quality standards"""
        issues = []
        warnings = []
        
        if not video_path.exists():
            return QualityReport(
                passed=False,
                video_path=str(video_path),
                duration_actual=0,
                duration_expected=brief.duration_seconds,
                file_size_bytes=0,
                resolution={"width": 0, "height": 0},
                fps_actual=0,
                has_audio=False,
                issues=["Video file not found"],
            )
        
        file_size = video_path.stat().st_size
        
        # Use ffprobe to get video info
        try:
            probe_cmd = [
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_format", "-show_streams",
                str(video_path)
            ]
            result = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=30)
            probe_data = json.loads(result.stdout)
            
            # Extract video stream info
            video_stream = next(
                (s for s in probe_data.get("streams", []) if s["codec_type"] == "video"),
                None
            )
            audio_stream = next(
                (s for s in probe_data.get("streams", []) if s["codec_type"] == "audio"),
                None
            )
            
            duration = float(probe_data.get("format", {}).get("duration", 0))
            width = int(video_stream.get("width", 0)) if video_stream else 0
            height = int(video_stream.get("height", 0)) if video_stream else 0
            fps = eval(video_stream.get("r_frame_rate", "0/1")) if video_stream else 0
            has_audio = audio_stream is not None
            
        except Exception as e:
            logger.error(f"Error probing video: {e}")
            duration = 0
            width = 0
            height = 0
            fps = 0
            has_audio = False
            issues.append(f"Could not probe video: {e}")
        
        # Quality checks
        duration_diff = abs(duration - brief.duration_seconds)
        if duration_diff > 1:
            warnings.append(f"Duration mismatch: expected {brief.duration_seconds}s, got {duration}s")
        
        if width != brief.output_width or height != brief.output_height:
            warnings.append(f"Resolution mismatch: expected {brief.output_width}x{brief.output_height}, got {width}x{height}")
        
        if file_size < 10000:  # Less than 10KB is suspicious
            issues.append("File size too small - video may be corrupted")
        
        if brief.background_music_path and not has_audio:
            warnings.append("Expected audio but none found")
        
        passed = len(issues) == 0
        
        return QualityReport(
            passed=passed,
            video_path=str(video_path),
            duration_actual=duration,
            duration_expected=brief.duration_seconds,
            file_size_bytes=file_size,
            resolution={"width": width, "height": height},
            fps_actual=fps,
            has_audio=has_audio,
            issues=issues,
            warnings=warnings,
        )
    
    async def render(
        self,
        brief: CreativeBrief,
        on_progress: Optional[Callable[[float, str], None]] = None,
    ) -> RenderResult:
        """
        Render a video from a creative brief.
        
        Args:
            brief: The creative brief specification
            on_progress: Optional callback (progress 0-1, message)
        
        Returns:
            RenderResult with video path and quality report
        """
        start_time = datetime.now()
        
        logger.info("=" * 60)
        logger.info(f"🎬 [VIDEO RENDER] Starting render job")
        logger.info(f"   Brief ID: {brief.brief_id}")
        logger.info(f"   Content Type: {brief.content_type.value}")
        logger.info(f"   Duration: {brief.duration_seconds}s")
        logger.info(f"   Resolution: {brief.output_width}x{brief.output_height}")
        logger.info(f"   Text: {brief.primary_text[:80]}...")
        logger.info(f"   Animation: {brief.animation_style} ({brief.animation_duration}s)")
        logger.info("=" * 60)
        
        if on_progress:
            on_progress(0.1, "Validating brief...")
        
        # Validate brief
        logger.info("📋 [STEP 1/5] Validating creative brief...")
        validation_issues = self.validate_brief(brief)
        if validation_issues:
            logger.error(f"❌ [VALIDATION FAILED] {validation_issues}")
            return RenderResult(
                success=False,
                brief_id=brief.brief_id,
                video_path=None,
                quality_report=None,
                render_time_seconds=0,
                error_message=f"Validation failed: {', '.join(validation_issues)}",
            )
        logger.success("✅ [STEP 1/5] Brief validated successfully")
        
        if on_progress:
            on_progress(0.2, "Generating scene...")
        
        # Generate scene code
        logger.info("🎨 [STEP 2/5] Generating Motion Canvas scene code...")
        scene_code = self._generate_scene_code(brief)
        
        # Write scene file
        scene_dir = self.motion_canvas_dir / "src" / "scenes" / "generated"
        scene_dir.mkdir(parents=True, exist_ok=True)
        scene_file = scene_dir / f"brief_{brief.brief_id}.tsx"
        scene_file.write_text(scene_code)
        
        logger.success(f"✅ [STEP 2/5] Scene generated: {scene_file}")
        
        if on_progress:
            on_progress(0.4, "Rendering video...")
        
        # Output path
        output_path = self.output_dir / f"{brief.brief_id}.mp4"
        
        logger.info("🎥 [STEP 3/5] Rendering video with FFmpeg...")
        logger.info(f"   Output: {output_path}")
        logger.info(f"   Resolution: {brief.output_width}x{brief.output_height}")
        logger.info(f"   Duration: {brief.duration_seconds}s")
        
        # For now, we'll use FFmpeg to create a simple test video
        # In production, this would invoke Motion Canvas CLI
        try:
            # Create a simple video with text using FFmpeg (fallback)
            # This demonstrates the pipeline - Motion Canvas would replace this
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", f"color=c=black:s={brief.output_width}x{brief.output_height}:d={brief.duration_seconds}",
                "-vf", f"drawtext=text='{brief.primary_text[:50]}':fontsize={brief.text_size}:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2",
                "-c:v", "libx264",
                "-t", str(brief.duration_seconds),
                "-pix_fmt", "yuv420p",
                str(output_path)
            ]
            
            logger.debug(f"   FFmpeg command: {' '.join(cmd[:5])}...")
            
            render_start = datetime.now()
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            stdout, stderr = await process.communicate()
            render_duration = (datetime.now() - render_start).total_seconds()
            
            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown render error"
                logger.error(f"❌ [RENDER FAILED] FFmpeg error: {error_msg}")
                raise RuntimeError(f"Render failed: {error_msg}")
            
            logger.success(f"✅ [STEP 3/5] Video rendered in {render_duration:.2f}s")
            
        except Exception as e:
            logger.error(f"❌ [RENDER ERROR] {type(e).__name__}: {e}")
            return RenderResult(
                success=False,
                brief_id=brief.brief_id,
                video_path=None,
                quality_report=None,
                render_time_seconds=(datetime.now() - start_time).total_seconds(),
                error_message=str(e),
            )
        
        if on_progress:
            on_progress(0.8, "Validating output...")
        
        # Validate output
        logger.info("🔍 [STEP 4/5] Validating output quality...")
        quality_report = await self._validate_output(output_path, brief)
        
        if quality_report.passed:
            logger.success(f"✅ [STEP 4/5] Quality check passed")
        else:
            logger.warning(f"⚠️ [STEP 4/5] Quality check issues: {quality_report.issues}")
        
        logger.info(f"   File size: {quality_report.file_size_bytes / 1024:.1f} KB")
        logger.info(f"   Duration: {quality_report.duration_actual}s (expected {quality_report.duration_expected}s)")
        logger.info(f"   Resolution: {quality_report.resolution}")
        logger.info(f"   FPS: {quality_report.fps_actual}")
        
        if on_progress:
            on_progress(1.0, "Complete!")
        
        render_time = (datetime.now() - start_time).total_seconds()
        
        logger.info("=" * 60)
        logger.success(f"🎬 [STEP 5/5] RENDER COMPLETE")
        logger.info(f"   Output: {output_path}")
        logger.info(f"   Total time: {render_time:.2f}s")
        logger.info(f"   Quality: {'✅ PASSED' if quality_report.passed else '❌ FAILED'}")
        logger.info("=" * 60)
        
        return RenderResult(
            success=quality_report.passed,
            brief_id=brief.brief_id,
            video_path=str(output_path) if output_path.exists() else None,
            quality_report=quality_report,
            render_time_seconds=render_time,
        )


# Convenience functions
async def render_motivational_quote(
    quote: str,
    author: str,
    duration: float = 5.0,
    background_video: Optional[str] = None,
) -> RenderResult:
    """Quick helper to render a motivational quote video"""
    brief = CreativeBrief(
        content_type=ContentType.MOTIVATIONAL_QUOTE,
        primary_text=quote,
        author_attribution=author,
        duration_seconds=duration,
        background_video_path=background_video,
    )
    renderer = CreativeBriefRenderer()
    return await renderer.render(brief)


async def render_broll_text(
    main_text: str,
    subtext: str = "",
    duration: float = 5.0,
    background_video: Optional[str] = None,
) -> RenderResult:
    """Quick helper to render B-Roll + Text video"""
    brief = CreativeBrief(
        content_type=ContentType.BROLL_TEXT,
        primary_text=main_text,
        secondary_text=subtext,
        duration_seconds=duration,
        background_video_path=background_video,
    )
    renderer = CreativeBriefRenderer()
    return await renderer.render(brief)
