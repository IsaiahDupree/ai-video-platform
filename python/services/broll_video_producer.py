"""
B-Roll Video Producer Service
==============================
Finds B-roll candidates, generates trendy text overlays using AI,
and produces videos using Remotion.

Pipeline:
1. Find B-roll candidates from media library
2. Generate trendy/relatable text overlays using Trends Agent + AI
3. Build Remotion composition with text layers
4. Render final video
"""
import os
import json
import uuid
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path

from loguru import logger
from openai import OpenAI
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession

from services.event_bus import EventBus, Topics


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:54322/postgres")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


class TextStyle(str, Enum):
    BOLD_CENTER = "bold_center"
    SUBTITLE = "subtitle"
    HEADLINE = "headline"
    QUOTE = "quote"
    MINIMAL = "minimal"
    IMPACT = "impact"


class TextPosition(str, Enum):
    TOP = "top"
    CENTER = "center"
    BOTTOM = "bottom"
    LOWER_THIRD = "lower_third"


@dataclass
class TextOverlay:
    """A text overlay to apply to video"""
    text: str
    position: TextPosition = TextPosition.CENTER
    style: TextStyle = TextStyle.BOLD_CENTER
    start_time: float = 0.0
    end_time: Optional[float] = None
    animation: str = "fade_in"
    font_size: int = 64
    color: str = "#FFFFFF"
    background_color: Optional[str] = "rgba(0,0,0,0.5)"
    
    def to_dict(self) -> Dict:
        return {
            "text": self.text,
            "position": self.position.value if isinstance(self.position, TextPosition) else self.position,
            "style": self.style.value if isinstance(self.style, TextStyle) else self.style,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "animation": self.animation,
            "font_size": self.font_size,
            "color": self.color,
            "background_color": self.background_color,
        }


@dataclass
class BrollVideoRequest:
    """Request for B-roll video production"""
    # B-roll selection
    video_id: Optional[str] = None  # Specific video ID, or auto-select
    min_duration: float = 5.0
    max_duration: float = 30.0
    require_no_people: bool = False
    tags: List[str] = field(default_factory=list)
    
    # Text overlay options
    use_trending_text: bool = True
    custom_text: Optional[str] = None
    text_style: TextStyle = TextStyle.BOLD_CENTER
    text_position: TextPosition = TextPosition.CENTER
    niche: str = "general"
    tone: str = "engaging"  # engaging, inspirational, humorous, professional
    
    # Output options
    output_format: str = "mp4"
    resolution: str = "1080x1920"  # Portrait by default
    fps: int = 30
    
    # Metadata
    job_id: Optional[str] = None
    correlation_id: Optional[str] = None
    
    def __post_init__(self):
        if self.job_id is None:
            self.job_id = str(uuid.uuid4())
        if self.correlation_id is None:
            self.correlation_id = str(uuid.uuid4())


@dataclass
class BrollVideoResult:
    """Result from B-roll video production"""
    job_id: str
    success: bool
    video_path: Optional[str] = None
    video_url: Optional[str] = None
    source_video_id: Optional[str] = None
    text_overlays: List[Dict] = field(default_factory=list)
    duration_seconds: float = 0.0
    file_size_mb: float = 0.0
    trending_phrases_used: List[str] = field(default_factory=list)
    error: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "job_id": self.job_id,
            "success": self.success,
            "video_path": self.video_path,
            "video_url": self.video_url,
            "source_video_id": self.source_video_id,
            "text_overlays": self.text_overlays,
            "duration_seconds": self.duration_seconds,
            "file_size_mb": self.file_size_mb,
            "trending_phrases_used": self.trending_phrases_used,
            "error": self.error,
        }


class BrollVideoProducer:
    """
    Produces B-roll videos with trendy text overlays.
    
    Usage:
        producer = BrollVideoProducer()
        result = await producer.produce(BrollVideoRequest(
            use_trending_text=True,
            niche="productivity",
            tone="inspirational"
        ))
    """
    
    def __init__(self, db_url: str = None):
        self.db_url = db_url or DATABASE_URL
        self.engine = create_engine(self.db_url)
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        self.output_dir = Path("data/broll_outputs")
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def produce(self, request: BrollVideoRequest) -> BrollVideoResult:
        """
        Main production pipeline:
        1. Find/validate B-roll video
        2. Generate text overlays
        3. Render with Remotion
        """
        logger.info(f"🎬 [BrollProducer] Starting production job {request.job_id}")
        
        try:
            # Step 1: Find B-roll candidate
            video_info = await self._find_broll_video(request)
            if not video_info:
                return BrollVideoResult(
                    job_id=request.job_id,
                    success=False,
                    error="No suitable B-roll video found"
                )
            
            logger.info(f"📹 [BrollProducer] Selected video: {video_info['id']} ({video_info.get('file_name', 'unknown')})")
            
            # Step 2: Generate text overlays
            text_overlays = await self._generate_text_overlays(request, video_info)
            logger.info(f"✍️ [BrollProducer] Generated {len(text_overlays)} text overlays")
            
            # Step 3: Render video with Remotion
            result = await self._render_video(request, video_info, text_overlays)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ [BrollProducer] Production failed: {e}", exc_info=True)
            return BrollVideoResult(
                job_id=request.job_id,
                success=False,
                error=str(e)
            )
    
    async def _find_broll_video(self, request: BrollVideoRequest) -> Optional[Dict]:
        """Find a suitable B-roll video from the media library"""
        
        if request.video_id:
            # Use specific video
            return await self._get_video_by_id(request.video_id)
        
        # Auto-select based on criteria
        with self.engine.connect() as conn:
            query = text("""
                SELECT 
                    v.id, v.file_name, v.source_uri, v.duration_sec,
                    1080 as width, 1920 as height, v.resolution,
                    va.pre_social_score, va.topics, va.visual_analysis,
                    va.transcript
                FROM videos v
                LEFT JOIN video_analysis va ON v.id = va.video_id
                WHERE v.duration_sec >= :min_duration
                  AND v.duration_sec <= :max_duration
                  AND v.source_uri IS NOT NULL
                ORDER BY va.pre_social_score DESC NULLS LAST, RANDOM()
                LIMIT 1
            """)
            
            result = conn.execute(query, {
                "min_duration": request.min_duration,
                "max_duration": request.max_duration,
            })
            
            row = result.fetchone()
            if not row:
                return None
            
            return {
                "id": str(row[0]),
                "file_name": row[1],
                "source_uri": row[2],
                "duration_sec": row[3] or 10.0,
                "width": row[4] or 1080,
                "height": row[5] or 1920,
                "resolution": row[6],
                "score": row[7],
                "topics": row[8] or [],
                "visual_analysis": row[9] or {},
                "transcription": row[10],
            }
    
    async def _get_video_by_id(self, video_id: str) -> Optional[Dict]:
        """Get specific video by ID"""
        with self.engine.connect() as conn:
            query = text("""
                SELECT 
                    v.id, v.file_name, v.source_uri, v.duration_sec,
                    1080 as width, 1920 as height, v.resolution,
                    va.pre_social_score, va.topics, va.visual_analysis,
                    va.transcript
                FROM videos v
                LEFT JOIN video_analysis va ON v.id = va.video_id
                WHERE v.id = :video_id
            """)
            
            result = conn.execute(query, {"video_id": video_id})
            row = result.fetchone()
            
            if not row:
                return None
            
            return {
                "id": str(row[0]),
                "file_name": row[1],
                "source_uri": row[2],
                "duration_sec": row[3] or 10.0,
                "width": row[4] or 1080,
                "height": row[5] or 1920,
                "resolution": row[6],
                "score": row[7],
                "topics": row[8] or [],
                "visual_analysis": row[9] or {},
                "transcription": row[10],
            }
    
    async def _generate_text_overlays(
        self, 
        request: BrollVideoRequest,
        video_info: Dict
    ) -> List[TextOverlay]:
        """Generate text overlays using AI based on video context and trends"""
        
        overlays = []
        
        # If custom text provided, use it
        if request.custom_text:
            overlays.append(TextOverlay(
                text=request.custom_text,
                position=request.text_position,
                style=request.text_style,
                start_time=0.0,
                end_time=video_info.get("duration_sec", 10.0),
            ))
            return overlays
        
        # Generate AI-powered text overlays
        if request.use_trending_text and self.openai_client:
            trending_texts = await self._generate_trending_text(request, video_info)
            
            # Calculate timing for multiple overlays
            duration = video_info.get("duration_sec", 10.0)
            overlay_duration = min(4.0, duration / len(trending_texts)) if trending_texts else duration
            
            for i, text_content in enumerate(trending_texts):
                start = i * overlay_duration
                end = start + overlay_duration
                
                overlays.append(TextOverlay(
                    text=text_content,
                    position=request.text_position,
                    style=request.text_style,
                    start_time=start,
                    end_time=min(end, duration),
                    animation="fade_in" if i == 0 else "slide_up",
                ))
        
        # If no AI, generate fallback text
        if not overlays:
            overlays.append(TextOverlay(
                text="✨ Check this out",
                position=TextPosition.CENTER,
                style=TextStyle.BOLD_CENTER,
                start_time=0.0,
                end_time=video_info.get("duration_sec", 10.0),
            ))
        
        return overlays
    
    async def _generate_trending_text(
        self, 
        request: BrollVideoRequest,
        video_info: Dict
    ) -> List[str]:
        """Use AI to generate trendy, relatable text overlays"""
        
        # Build context from video
        topics = video_info.get("topics", [])
        transcription = video_info.get("transcription", "")
        visual = video_info.get("visual_analysis", {})
        scene_desc = visual.get("scene_description", "") if visual else ""
        
        context_parts = []
        if topics:
            context_parts.append(f"Topics: {', '.join(topics[:5])}")
        if scene_desc:
            context_parts.append(f"Scene: {scene_desc}")
        if transcription:
            context_parts.append(f"Audio: {transcription[:200]}")
        
        context = "\n".join(context_parts) if context_parts else "Generic lifestyle/productivity content"
        
        prompt = f"""Generate 3 short, trendy text overlays for a B-roll video to post on social media.

Video Context:
{context}

Requirements:
- Niche: {request.niche}
- Tone: {request.tone}
- Each text should be 3-8 words max
- Use trendy phrases that resonate with Gen Z/Millennials
- Make them relatable, thought-provoking, or motivational
- Think TikTok/Reels style text overlays
- Include relevant emojis where appropriate

Examples of good text overlays:
- "POV: you finally did the thing"
- "This changed everything 🔥"
- "Nobody talks about this..."
- "Wait for it..."
- "The secret nobody tells you"
- "Real talk though 💯"

Return as JSON array of 3 strings:
["text1", "text2", "text3"]

Output ONLY the JSON array, no other text."""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a viral content creator who writes punchy, scroll-stopping text overlays for short-form video. Output only valid JSON."
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.9
            )
            
            content = response.choices[0].message.content.strip()
            
            # Clean markdown if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            
            texts = json.loads(content)
            
            if isinstance(texts, list) and len(texts) > 0:
                logger.info(f"🔥 [BrollProducer] AI generated texts: {texts}")
                return texts[:3]
            
        except Exception as e:
            logger.error(f"AI text generation failed: {e}")
        
        # Fallback trendy texts
        return [
            "This hits different 🎯",
            "Nobody asked but...",
            "Main character energy ✨"
        ]
    
    async def _render_video(
        self,
        request: BrollVideoRequest,
        video_info: Dict,
        text_overlays: List[TextOverlay]
    ) -> BrollVideoResult:
        """Render the video using FFmpeg with text overlays"""
        
        source_path = video_info.get("source_uri")
        if not source_path or not Path(source_path).exists():
            # Try streaming URL
            source_path = f"http://localhost:5555/api/media-provider/stream/{video_info['id']}"
        
        output_path = self.output_dir / f"{request.job_id}.mp4"
        
        # Build FFmpeg filter for text overlays
        filter_complex = await self._build_ffmpeg_filter(text_overlays, video_info)
        
        # FFmpeg command
        import subprocess
        
        cmd = [
            "ffmpeg", "-y",
            "-i", str(source_path),
            "-vf", filter_complex,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            str(output_path)
        ]
        
        logger.info(f"🎬 [BrollProducer] Rendering with FFmpeg...")
        
        try:
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if process.returncode != 0:
                logger.error(f"FFmpeg error: {process.stderr}")
                raise Exception(f"FFmpeg failed: {process.stderr[:500]}")
            
            # Get file info
            file_size_mb = output_path.stat().st_size / (1024 * 1024) if output_path.exists() else 0
            
            # Auto-save to media library
            await self._save_to_media_library(
                job_id=request.job_id,
                output_path=str(output_path),
                duration=video_info.get("duration_sec", 0),
                source_video_id=video_info["id"],
                text_overlays=[o.text for o in text_overlays]
            )
            
            return BrollVideoResult(
                job_id=request.job_id,
                success=True,
                video_path=str(output_path),
                video_url=f"/api/broll-producer/output/{request.job_id}",
                source_video_id=video_info["id"],
                text_overlays=[o.to_dict() for o in text_overlays],
                duration_seconds=video_info.get("duration_sec", 0),
                file_size_mb=file_size_mb,
                trending_phrases_used=[o.text for o in text_overlays],
            )
            
        except subprocess.TimeoutExpired:
            return BrollVideoResult(
                job_id=request.job_id,
                success=False,
                error="Rendering timed out"
            )
        except Exception as e:
            return BrollVideoResult(
                job_id=request.job_id,
                success=False,
                error=str(e)
            )
    
    async def _build_ffmpeg_filter(
        self, 
        text_overlays: List[TextOverlay],
        video_info: Dict
    ) -> str:
        """Build FFmpeg drawtext filter for text overlays"""
        
        filters = []
        
        # Scale to target resolution if needed
        filters.append("scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2")
        
        for i, overlay in enumerate(text_overlays):
            # Escape special characters
            text = overlay.text.replace("'", "'\\''").replace(":", "\\:")
            
            # Position mapping
            y_positions = {
                TextPosition.TOP: "h*0.15",
                TextPosition.CENTER: "(h-text_h)/2",
                TextPosition.BOTTOM: "h*0.80",
                TextPosition.LOWER_THIRD: "h*0.75",
            }
            y_pos = y_positions.get(overlay.position, "(h-text_h)/2")
            
            # Font size based on style
            font_sizes = {
                TextStyle.BOLD_CENTER: 56,
                TextStyle.SUBTITLE: 40,
                TextStyle.HEADLINE: 72,
                TextStyle.QUOTE: 48,
                TextStyle.MINIMAL: 36,
                TextStyle.IMPACT: 64,
            }
            font_size = font_sizes.get(overlay.style, 56)
            
            # Build drawtext filter
            duration = video_info.get("duration_sec", 10.0)
            enable_start = overlay.start_time
            enable_end = overlay.end_time or duration
            
            drawtext = (
                f"drawtext=text='{text}':"
                f"fontfile=/System/Library/Fonts/Helvetica.ttc:"
                f"fontsize={font_size}:"
                f"fontcolor=white:"
                f"borderw=3:"
                f"bordercolor=black:"
                f"x=(w-text_w)/2:"
                f"y={y_pos}:"
                f"enable='between(t,{enable_start},{enable_end})'"
            )
            
            filters.append(drawtext)
        
        return ",".join(filters)
    
    async def get_trending_phrases(self, niche: str = "general", limit: int = 10) -> List[Dict]:
        """Get current trending phrases for text overlays"""
        
        if not self.openai_client:
            return [
                {"phrase": "This hits different", "score": 0.95},
                {"phrase": "POV:", "score": 0.92},
                {"phrase": "Wait for it", "score": 0.90},
                {"phrase": "Nobody asked but", "score": 0.88},
                {"phrase": "Real talk", "score": 0.85},
            ]
        
        prompt = f"""List the top {limit} most viral/trending text overlay phrases used in short-form video content right now.

Niche focus: {niche}

For each phrase, rate its current virality (0-1).

Return as JSON array:
[{{"phrase": "text", "score": 0.95}}]

Only include phrases that are actually trending NOW on TikTok/Reels.
Output ONLY the JSON array."""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a social media trends expert. Output only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            content = response.choices[0].message.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            phrases = json.loads(content)
            return phrases[:limit]
            
        except Exception as e:
            logger.error(f"Failed to get trending phrases: {e}")
            return []
    
    async def _save_to_media_library(
        self,
        job_id: str,
        output_path: str,
        duration: float,
        source_video_id: str,
        text_overlays: List[str]
    ) -> bool:
        """Save produced B-Roll video to the media library"""
        try:
            from pathlib import Path
            
            file_path = Path(output_path)
            if not file_path.exists():
                logger.warning(f"Output file not found: {output_path}")
                return False
            
            file_size = file_path.stat().st_size
            
            with self.engine.connect() as conn:
                # Check if already exists
                existing = conn.execute(text("""
                    SELECT id FROM videos WHERE file_name = :fn OR source_uri = :uri
                """), {"fn": file_path.name, "uri": output_path}).fetchone()
                
                if existing:
                    logger.info(f"✅ [BrollProducer] Video already in library: {job_id}")
                    return True
                
                # Insert into videos table
                conn.execute(text("""
                    INSERT INTO videos (
                        id, user_id, source_type, source_uri, file_name,
                        title, file_size, duration_sec, created_at
                    ) VALUES (
                        gen_random_uuid(),
                        '00000000-0000-0000-0000-000000000000'::uuid,
                        'broll_producer',
                        :source_uri,
                        :file_name,
                        :title,
                        :file_size,
                        :duration,
                        NOW()
                    )
                """), {
                    "source_uri": output_path,
                    "file_name": file_path.name,
                    "title": f"B-Roll: {text_overlays[0][:50] if text_overlays else job_id}",
                    "file_size": file_size,
                    "duration": duration,
                })
                
                conn.commit()
                logger.success(f"✅ [BrollProducer] Saved to media library: {job_id}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to save to media library: {e}")
            return False


# Singleton instance
_producer_instance = None

def get_producer() -> BrollVideoProducer:
    global _producer_instance
    if _producer_instance is None:
        _producer_instance = BrollVideoProducer()
    return _producer_instance
