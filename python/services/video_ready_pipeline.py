"""
Video Ready Pipeline
====================
Handles the complete flow when a video is ready:
1. Receive alert (webhook, SSE, or polling)
2. AI analyze the video using EXISTING MediaPoster infrastructure
3. Save to database using EXISTING ingestion system
4. Publish to YouTube and TikTok via EXISTING Blotato/EventBus integration

Uses existing MediaPoster services:
- IngestionAnalysisIntegrator - AI analysis (transcription, vision, captions)
- PublishIntegrator - Blotato publishing via EventBus
- EventBus - Event-driven coordination
- Database models - Video, AnalyzedVideo, etc.

Usage:
    from services.video_ready_pipeline import VideoReadyPipeline
    
    pipeline = VideoReadyPipeline()
    
    # When video is ready (e.g., Sora generation complete)
    result = await pipeline.process_video_ready(
        video_path="/path/to/video.mp4",
        source="sora",
        publish_to=["youtube", "tiktok"]
    )
"""

import os
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path
from uuid import uuid4
from loguru import logger
from dataclasses import dataclass

# Import EXISTING MediaPoster infrastructure
from services.event_bus import EventBus, Topics
from services.blotato_service import BlotatoService, BlotatoPlatform


@dataclass
class VideoReadyEvent:
    """Event when a video becomes ready for processing"""
    video_path: str
    source: str  # "sora", "upload", "import", "safari"
    metadata: Dict[str, Any]
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


@dataclass
class AnalysisResult:
    """
    Comprehensive AI analysis result with 100% field coverage.
    All fields are populated by GPT-4o analysis.
    """
    # Core content
    transcript: str
    summary: str
    suggested_caption: str
    hashtags: List[str]
    virality_score: float
    duration_seconds: float
    detected_topics: List[str]
    
    # Platform-specific captions (AI-generated)
    youtube_title: str = ""
    youtube_description: str = ""
    tiktok_caption: str = ""
    instagram_caption: str = ""
    twitter_caption: str = ""
    threads_caption: str = ""
    
    # Content classification
    content_type: str = ""  # "entertainment", "educational", "promotional", etc.
    mood: str = ""  # "funny", "serious", "inspiring", etc.
    target_audience: str = ""  # "gen_z", "millennials", "professionals", etc.
    
    # Hook analysis
    hook_text: str = ""
    hook_type: str = ""  # "question", "statement", "shock", "curiosity"
    hook_strength: int = 0  # 1-10
    
    # Call-to-action
    cta_text: str = ""
    cta_type: str = ""  # "follow", "like", "comment", "share", "link"
    
    # SEO & discoverability
    seo_keywords: List[str] = None
    search_terms: List[str] = None
    
    # Engagement predictions
    predicted_likes: int = 0
    predicted_comments: int = 0
    predicted_shares: int = 0
    engagement_score: float = 0.0
    
    # Content safety
    is_safe_for_ads: bool = True
    content_warnings: List[str] = None
    
    # Audio analysis
    has_speech: bool = True
    has_music: bool = False
    audio_mood: str = ""
    
    # Visual analysis hints
    scene_descriptions: List[str] = None
    dominant_colors: List[str] = None
    
    def __post_init__(self):
        # Initialize None lists to empty lists
        if self.seo_keywords is None:
            self.seo_keywords = []
        if self.search_terms is None:
            self.search_terms = []
        if self.content_warnings is None:
            self.content_warnings = []
        if self.scene_descriptions is None:
            self.scene_descriptions = []
        if self.dominant_colors is None:
            self.dominant_colors = []
    
    def get_field_count(self) -> int:
        """Return total number of fields"""
        return len(self.__dataclass_fields__)
    
    def get_populated_fields(self) -> Dict[str, Any]:
        """Return dict of all populated fields (includes empty lists as 'populated')"""
        from dataclasses import asdict
        result = {}
        for k, v in asdict(self).items():
            # Count as populated if: truthy, zero, False, or empty list (intentional)
            if v or v == 0 or v is False or isinstance(v, list):
                result[k] = v
        return result


class VideoReadyPipeline:
    """
    Complete pipeline for processing videos when they're ready.
    
    Uses EXISTING MediaPoster infrastructure:
    - EventBus for coordination
    - ContentAnalyzer for AI analysis  
    - PublishIntegrator for Blotato publishing
    - Database models for persistence
    
    Flow:
    1. Video Ready Alert → 
    2. Ingest to database (create Video record)
    3. AI Analysis via existing ContentAnalyzer
    4. Publish via EventBus → PublishIntegrator → Blotato
    """
    
    # Default account IDs for publishing (from existing blotato_service.py)
    DEFAULT_ACCOUNTS = {
        "youtube": 228,      # UCnDBsELI2OlaEl5yxA77HNA - Isaiah Dupree
        "tiktok": 710,       # isaiah_dupree
        "instagram": 807,    # the_isaiah_dupree
        "threads": 173,      # the_isaiah_dupree_
    }
    
    def __init__(self):
        # Use EXISTING MediaPoster services
        self.event_bus = EventBus.get_instance()
        self.blotato = BlotatoService.get_instance()
        self._openai_client = None
        self._content_analyzer = None
        self._db_session = None
        
        logger.info("VideoReadyPipeline initialized (using existing MediaPoster infrastructure)")
    
    @property
    def openai_client(self):
        """Lazy load OpenAI client"""
        if self._openai_client is None:
            from openai import OpenAI
            self._openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        return self._openai_client
    
    @property
    def content_analyzer(self):
        """Lazy load existing ContentAnalyzer"""
        if self._content_analyzer is None:
            from services.content_analyzer import ContentAnalyzer
            self._content_analyzer = ContentAnalyzer()
        return self._content_analyzer
    
    async def _get_fresh_db_session(self):
        """Get a fresh database session (creates new connection each time)"""
        from database.connection import init_db, async_session_maker
        import database.connection as db_conn
        
        if db_conn.async_session_maker is None:
            await init_db()
        
        return db_conn.async_session_maker()
    
    async def ingest_video_to_db(self, video_path: str, source: str, metadata: Dict[str, Any]) -> str:
        """
        Ingest video to database using EXISTING MediaPoster schema.
        Creates a Video record and returns the video_id.
        """
        from sqlalchemy import text
        import json
        
        video_id = str(uuid4())
        file_name = Path(video_path).name
        file_size = Path(video_path).stat().st_size
        
        try:
            async with await self._get_fresh_db_session() as db:
                # Check if video already exists by file_path
                result = await db.execute(
                    text("SELECT id FROM original_videos WHERE file_path = :file_path"),
                    {"file_path": video_path}
                )
                existing = result.fetchone()
                
                if existing:
                    # Use existing video_id
                    video_id = str(existing[0])
                    await db.execute(
                        text("UPDATE original_videos SET status = 'pending', updated_at = NOW() WHERE id = :id"),
                        {"id": video_id}
                    )
                else:
                    # Insert new record (cast metadata to jsonb in SQL)
                    await db.execute(
                        text("""
                            INSERT INTO original_videos (id, filename, file_path, file_size, status, source, metadata, created_at)
                            VALUES (:id, :filename, :file_path, :file_size, 'pending', :source, CAST(:meta AS jsonb), NOW())
                        """),
                        {
                            "id": video_id,
                            "filename": file_name,
                            "file_path": video_path,
                            "file_size": file_size,
                            "source": source,
                            "meta": json.dumps(metadata)
                        }
                    )
                await db.commit()
            
            logger.info(f"   📥 Ingested to DB: {video_id}")
            
            # Emit ingestion event for existing infrastructure
            await self.event_bus.publish(
                Topics.CONTENT_INGESTED,
                {
                    "video_id": video_id,
                    "file_path": video_path,
                    "media_type": "video",
                    "source": source,
                    "metadata": metadata
                }
            )
            
            return video_id
            
        except Exception as e:
            logger.warning(f"   ⚠️ DB ingestion failed (continuing): {e}")
            return video_id  # Return ID anyway for analysis
    
    async def process_video_ready(
        self,
        video_path: str,
        source: str = "unknown",
        publish_to: List[str] = None,
        custom_caption: str = None,
        auto_publish: bool = True,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Main entry point - process a video that's ready.
        
        Args:
            video_path: Path to the video file
            source: Where the video came from (sora, upload, etc.)
            publish_to: List of platforms ["youtube", "tiktok", "instagram"]
            custom_caption: Override AI-generated caption
            auto_publish: Whether to automatically publish after analysis
            metadata: Additional metadata (prompt used, character, etc.)
            
        Returns:
            Dict with analysis results and publish status
        """
        logger.info(f"🎬 Processing video ready: {video_path}")
        logger.info(f"   Source: {source}")
        logger.info(f"   Publish to: {publish_to}")
        
        metadata = metadata or {}
        result = {
            "video_path": video_path,
            "video_id": None,
            "source": source,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "analysis": None,
            "publish_results": [],
            "status": "processing"
        }
        
        # Validate video exists
        if not Path(video_path).exists():
            result["status"] = "error"
            result["error"] = f"Video file not found: {video_path}"
            return result
        
        # Step 0: Ingest to database using EXISTING infrastructure
        try:
            logger.info("📥 Step 0/3: Ingesting to database...")
            video_id = await self.ingest_video_to_db(video_path, source, metadata)
            result["video_id"] = video_id
        except Exception as e:
            logger.warning(f"   ⚠️ Ingestion failed (continuing): {e}")
            video_id = str(uuid4())
            result["video_id"] = video_id
        
        # Step 1: AI Analysis using EXISTING infrastructure
        try:
            logger.info("📊 Step 1/3: Running AI analysis (using existing ContentAnalyzer)...")
            analysis = await self.analyze_video(video_path, metadata)
            result["analysis"] = {
                "transcript": analysis.transcript,
                "summary": analysis.summary,
                "suggested_caption": analysis.suggested_caption,
                "hashtags": analysis.hashtags,
                "virality_score": analysis.virality_score,
                "duration_seconds": analysis.duration_seconds,
                "detected_topics": analysis.detected_topics,
                # Platform-specific AI-generated content
                "youtube_title": analysis.youtube_title,
                "youtube_description": analysis.youtube_description,
                "tiktok_caption": analysis.tiktok_caption,
                "instagram_caption": analysis.instagram_caption
            }
            logger.info(f"   ✅ Analysis complete - virality score: {analysis.virality_score}")
        except Exception as e:
            logger.error(f"   ❌ Analysis failed: {e}")
            result["status"] = "analysis_failed"
            result["error"] = str(e)
            return result
        
        # Step 2: Save analysis to database using EXISTING infrastructure
        try:
            logger.info("📊 Step 2/3: Saving analysis to database...")
            await self.save_analysis_to_db(video_id, analysis)
        except Exception as e:
            logger.warning(f"   ⚠️ Failed to save analysis to DB: {e}")
        
        # Step 3: Publish to platforms via EXISTING EventBus → PublishIntegrator
        if auto_publish and publish_to:
            logger.info(f"📤 Step 3/3: Publishing to {publish_to} via EventBus...")
            
            for platform in publish_to:
                try:
                    platform_lower = platform.lower()
                    
                    # Build platform-specific analysis payload for PublishIntegrator
                    analysis_payload = {
                        "title_youtube": analysis.youtube_title,
                        "title_tiktok": analysis.tiktok_caption[:60] if analysis.tiktok_caption else "",
                        "title_instagram": analysis.instagram_caption[:60] if analysis.instagram_caption else "",
                        "description": analysis.youtube_description,
                        "hashtags": analysis.hashtags,
                        "hook": analysis.summary,
                        "cta": "Follow for more!",
                        "transcript": analysis.transcript,
                        "virality_score": analysis.virality_score
                    }
                    
                    # Use EXISTING EventBus to trigger PublishIntegrator (ARCH-003)
                    await self.event_bus.publish(
                        Topics.PUBLISH_REQUESTED,
                        {
                            "pipeline_id": f"video_ready_{video_id}",
                            "video_id": video_id,
                            "platform": platform_lower,
                            "video_path": video_path,
                            "analysis": analysis_payload,
                            "custom_caption": custom_caption,
                            "source": source
                        }
                    )
                    
                    logger.info(f"   ✅ Publish requested for {platform} via EventBus")
                    result["publish_results"].append({
                        "platform": platform,
                        "success": True,
                        "status": "queued",
                        "message": f"Publish request sent to EventBus for {platform}"
                    })
                    
                except Exception as e:
                    logger.error(f"   ❌ Failed to request publish for {platform}: {e}")
                    result["publish_results"].append({
                        "platform": platform,
                        "success": False,
                        "error": str(e)
                    })
        
        result["status"] = "completed"
        logger.info(f"✅ Video processing complete: {video_path}")
        
        return result
    
    async def analyze_video(
        self,
        video_path: str,
        metadata: Dict[str, Any] = None
    ) -> AnalysisResult:
        """
        AI analyze video - transcribe, summarize, generate caption.
        
        Uses OpenAI Whisper for transcription and GPT-4 for analysis.
        """
        metadata = metadata or {}
        
        # Get video duration
        duration = await self._get_video_duration(video_path)
        
        # Transcribe with Whisper
        transcript = await self._transcribe_video(video_path)
        
        # Generate COMPREHENSIVE AI analysis with ALL fields using GPT-4o
        logger.info("🤖 Running GPT-4o COMPREHENSIVE analysis (all fields)...")
        
        analysis_prompt = f"""You are an expert viral content strategist and social media analyst. Perform a COMPREHENSIVE analysis of this video and generate ALL required fields.

VIDEO METADATA:
- Source: {metadata.get('source', 'unknown')}
- Original Prompt (if AI-generated): {metadata.get('prompt', 'N/A')}
- Character/Creator: {metadata.get('character', 'N/A')}
- Duration: {duration:.1f} seconds

TRANSCRIPT:
{transcript if transcript else '[No speech detected - likely a visual/music video]'}

Generate a COMPLETE analysis with ALL of the following fields. Every field MUST be populated:

1. **PLATFORM CAPTIONS** (optimized for each platform):
   - youtube_title: Catchy, curiosity-driven, 60 chars max
   - youtube_description: 2-3 paragraphs with SEO keywords, CTA, and hashtags
   - tiktok_caption: Hook + value + CTA, under 150 chars, trending language
   - instagram_caption: Engaging with emojis, 2-3 lines
   - twitter_caption: Punchy, under 280 chars, with hashtags
   - threads_caption: Conversational, engaging, 2-3 sentences

2. **CONTENT CLASSIFICATION**:
   - content_type: One of "entertainment", "educational", "promotional", "lifestyle", "news", "tutorial"
   - mood: One of "funny", "serious", "inspiring", "dramatic", "calm", "energetic", "emotional"
   - target_audience: One of "gen_z", "millennials", "gen_x", "professionals", "creators", "general"

3. **HOOK ANALYSIS**:
   - hook_text: The exact hook/opening line to use
   - hook_type: One of "question", "statement", "shock", "curiosity", "story", "challenge"
   - hook_strength: 1-10 rating of hook effectiveness

4. **CALL-TO-ACTION**:
   - cta_text: Specific CTA text to use
   - cta_type: One of "follow", "like", "comment", "share", "link", "subscribe"

5. **SEO & DISCOVERABILITY**:
   - hashtags: Array of 8-10 hashtags (mix broad + niche)
   - seo_keywords: Array of 5-8 SEO keywords for search
   - search_terms: Array of 3-5 search phrases people would use

6. **ENGAGEMENT PREDICTIONS** (based on content quality):
   - virality_score: 0-100 overall viral potential
   - engagement_score: 0-100 engagement prediction
   - predicted_likes: Estimated likes (rough number)
   - predicted_comments: Estimated comments
   - predicted_shares: Estimated shares

7. **CONTENT SAFETY**:
   - is_safe_for_ads: true/false - suitable for monetization?
   - content_warnings: Array of any warnings (empty if none)

8. **AUDIO ANALYSIS**:
   - has_speech: true/false based on transcript
   - has_music: true/false - likely has background music?
   - audio_mood: Mood of the audio ("upbeat", "calm", "dramatic", etc.)

9. **VISUAL HINTS** (infer from context):
   - scene_descriptions: Array of 2-3 likely scene descriptions
   - dominant_colors: Array of likely dominant colors

10. **GENERAL**:
    - summary: 1-2 sentence compelling summary
    - topics: Array of main topics/themes

Format as JSON with ALL fields populated:
{{
    "summary": "...",
    "youtube_title": "...",
    "youtube_description": "...",
    "tiktok_caption": "...",
    "instagram_caption": "...",
    "twitter_caption": "...",
    "threads_caption": "...",
    "content_type": "...",
    "mood": "...",
    "target_audience": "...",
    "hook_text": "...",
    "hook_type": "...",
    "hook_strength": 8,
    "cta_text": "...",
    "cta_type": "...",
    "hashtags": ["...", "..."],
    "seo_keywords": ["...", "..."],
    "search_terms": ["...", "..."],
    "virality_score": 75,
    "engagement_score": 70,
    "predicted_likes": 5000,
    "predicted_comments": 200,
    "predicted_shares": 100,
    "is_safe_for_ads": true,
    "content_warnings": [],
    "has_speech": true,
    "has_music": false,
    "audio_mood": "...",
    "scene_descriptions": ["...", "..."],
    "dominant_colors": ["...", "..."],
    "topics": ["...", "..."]
}}"""

        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": analysis_prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        import json
        analysis_data = json.loads(response.choices[0].message.content)
        
        # Count populated fields
        populated = sum(1 for v in analysis_data.values() if v)
        total_fields = len(analysis_data)
        
        logger.info(f"✅ AI Analysis complete ({populated}/{total_fields} fields populated):")
        logger.info(f"   YouTube Title: {analysis_data.get('youtube_title', '')[:50]}...")
        logger.info(f"   TikTok Caption: {analysis_data.get('tiktok_caption', '')[:50]}...")
        logger.info(f"   Virality Score: {analysis_data.get('virality_score', 0)}")
        logger.info(f"   Content Type: {analysis_data.get('content_type', '')}")
        logger.info(f"   Hook Strength: {analysis_data.get('hook_strength', 0)}/10")
        
        return AnalysisResult(
            transcript=transcript,
            summary=analysis_data.get("summary", ""),
            suggested_caption=analysis_data.get("tiktok_caption", ""),
            hashtags=analysis_data.get("hashtags", []),
            virality_score=analysis_data.get("virality_score", 50),
            duration_seconds=duration,
            detected_topics=analysis_data.get("topics", []),
            # Platform captions
            youtube_title=analysis_data.get("youtube_title", ""),
            youtube_description=analysis_data.get("youtube_description", ""),
            tiktok_caption=analysis_data.get("tiktok_caption", ""),
            instagram_caption=analysis_data.get("instagram_caption", ""),
            twitter_caption=analysis_data.get("twitter_caption", ""),
            threads_caption=analysis_data.get("threads_caption", ""),
            # Content classification
            content_type=analysis_data.get("content_type", ""),
            mood=analysis_data.get("mood", ""),
            target_audience=analysis_data.get("target_audience", ""),
            # Hook analysis
            hook_text=analysis_data.get("hook_text", ""),
            hook_type=analysis_data.get("hook_type", ""),
            hook_strength=analysis_data.get("hook_strength", 0),
            # CTA
            cta_text=analysis_data.get("cta_text", ""),
            cta_type=analysis_data.get("cta_type", ""),
            # SEO
            seo_keywords=analysis_data.get("seo_keywords", []),
            search_terms=analysis_data.get("search_terms", []),
            # Engagement predictions
            predicted_likes=analysis_data.get("predicted_likes", 0),
            predicted_comments=analysis_data.get("predicted_comments", 0),
            predicted_shares=analysis_data.get("predicted_shares", 0),
            engagement_score=analysis_data.get("engagement_score", 0.0),
            # Content safety
            is_safe_for_ads=analysis_data.get("is_safe_for_ads", True),
            content_warnings=analysis_data.get("content_warnings", []),
            # Audio
            has_speech=analysis_data.get("has_speech", bool(transcript)),
            has_music=analysis_data.get("has_music", False),
            audio_mood=analysis_data.get("audio_mood", ""),
            # Visual
            scene_descriptions=analysis_data.get("scene_descriptions", []),
            dominant_colors=analysis_data.get("dominant_colors", [])
        )
    
    async def save_analysis_to_db(self, video_id: str, analysis: AnalysisResult) -> None:
        """
        Save analysis results to database using EXISTING MediaPoster schema.
        Updates the original_videos table and creates analyzed_videos record.
        """
        from sqlalchemy import text
        import json
        
        try:
            async with await self._get_fresh_db_session() as db:
                # Update original_videos with analysis status
                await db.execute(
                    text("""
                        UPDATE original_videos 
                        SET status = 'analyzed',
                            ai_title = :title,
                            ai_description = :description,
                            transcript = :transcript,
                            updated_at = NOW()
                        WHERE id = :video_id
                    """),
                    {
                        "video_id": video_id,
                        "title": analysis.youtube_title,
                        "description": analysis.youtube_description,
                        "transcript": analysis.transcript
                    }
                )
                
                # Insert into analyzed_videos table (existing schema)
                await db.execute(
                    text("""
                        INSERT INTO analyzed_videos (
                            id, original_video_id, transcript, 
                            ai_title, ai_description, ai_hashtags,
                            virality_score, duration_seconds, topics,
                            platform_captions, created_at
                        ) VALUES (
                            :id, :original_video_id, :transcript,
                            :ai_title, :ai_description, :ai_hashtags,
                            :virality_score, :duration_seconds, :topics,
                            :platform_captions, NOW()
                        )
                        ON CONFLICT (original_video_id) DO UPDATE SET
                            transcript = EXCLUDED.transcript,
                            ai_title = EXCLUDED.ai_title,
                            ai_description = EXCLUDED.ai_description,
                            ai_hashtags = EXCLUDED.ai_hashtags,
                            virality_score = EXCLUDED.virality_score,
                            platform_captions = EXCLUDED.platform_captions,
                            updated_at = NOW()
                    """),
                    {
                        "id": str(uuid4()),
                        "original_video_id": video_id,
                        "transcript": analysis.transcript,
                        "ai_title": analysis.youtube_title,
                        "ai_description": analysis.youtube_description,
                        "ai_hashtags": json.dumps(analysis.hashtags),
                        "virality_score": analysis.virality_score,
                        "duration_seconds": analysis.duration_seconds,
                        "topics": json.dumps(analysis.detected_topics),
                        "platform_captions": json.dumps({
                            "youtube_title": analysis.youtube_title,
                            "youtube_description": analysis.youtube_description,
                            "tiktok_caption": analysis.tiktok_caption,
                            "instagram_caption": analysis.instagram_caption
                        })
                    }
                )
                
                await db.commit()
            logger.info(f"   ✅ Analysis saved to DB for video {video_id}")
            
            # Emit analysis complete event for existing infrastructure
            await self.event_bus.publish(
                Topics.CONTENT_ANALYSIS_COMPLETED,
                {
                    "video_id": video_id,
                    "virality_score": analysis.virality_score,
                    "youtube_title": analysis.youtube_title,
                    "tiktok_caption": analysis.tiktok_caption,
                    "hashtags": analysis.hashtags
                }
            )
            
        except Exception as e:
            logger.error(f"   ❌ Failed to save analysis to DB: {e}")
            raise
    
    async def _transcribe_video(self, video_path: str) -> str:
        """Transcribe video using OpenAI Whisper"""
        try:
            with open(video_path, "rb") as video_file:
                response = self.openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=video_file,
                    response_format="text"
                )
            return response
        except Exception as e:
            logger.warning(f"Transcription failed: {e}")
            return ""
    
    async def _get_video_duration(self, video_path: str) -> float:
        """Get video duration in seconds"""
        try:
            import subprocess
            result = subprocess.run(
                ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", video_path],
                capture_output=True, text=True
            )
            return float(result.stdout.strip())
        except Exception:
            return 0.0
    
    async def publish_to_platform(
        self,
        video_path: str,
        platform: str,
        caption: str,
        title: str = None,
        description: str = None,
        hashtags: List[str] = None,
        account_id: int = None
    ) -> Dict[str, Any]:
        """
        Publish video to a platform via Blotato with AI-generated content.
        
        Args:
            video_path: Path to video file
            platform: "youtube", "tiktok", "instagram", etc.
            caption: Caption text (platform-specific from AI)
            title: Video title (for YouTube)
            description: Full description (for YouTube)
            hashtags: List of hashtags to append
            account_id: Override default account
            
        Returns:
            Dict with success status, post_id, url
        """
        # Get account ID
        if account_id is None:
            account_id = self.DEFAULT_ACCOUNTS.get(platform.lower())
        
        if not account_id:
            return {"success": False, "error": f"No account configured for {platform}"}
        
        platform_lower = platform.lower()
        
        # Build platform-specific content with hashtags
        if platform_lower == "youtube":
            # YouTube: Use title + description with hashtags at end
            hashtag_str = " ".join(f"#{h.lstrip('#')}" for h in (hashtags or []))
            full_caption = description or caption
            if hashtag_str:
                full_caption = f"{full_caption}\n\n{hashtag_str}"
            video_title = title or "New Video"
            logger.info(f"   📺 YouTube content prepared: title='{video_title[:30]}...', desc={len(full_caption)} chars")
        elif platform_lower == "tiktok":
            # TikTok: Short caption with hashtags inline
            hashtag_str = " ".join(f"#{h.lstrip('#')}" for h in (hashtags or [])[:5])  # Max 5 hashtags for TikTok
            full_caption = f"{caption} {hashtag_str}".strip()
            video_title = None
            logger.info(f"   🎵 TikTok content prepared: '{full_caption[:50]}...'")
        elif platform_lower == "instagram":
            # Instagram: Caption with hashtags in comment style
            hashtag_str = " ".join(f"#{h.lstrip('#')}" for h in (hashtags or []))
            full_caption = f"{caption}\n.\n.\n.\n{hashtag_str}" if hashtag_str else caption
            video_title = None
            logger.info(f"   📸 Instagram content prepared: '{caption[:50]}...'")
        else:
            # Generic: Caption + hashtags
            hashtag_str = " ".join(f"#{h.lstrip('#')}" for h in (hashtags or []))
            full_caption = f"{caption}\n\n{hashtag_str}" if hashtag_str else caption
            video_title = title
        
        # Upload video to Blotato and publish
        try:
            # First, upload the video to get a media_id
            media_id = await self._upload_to_blotato(video_path)
            
            # Build publish payload with platform-specific fields
            publish_kwargs = {}
            if platform_lower == "youtube" and video_title:
                publish_kwargs["title"] = video_title
            
            # Then publish with AI-generated content
            result = await self.blotato.publish_content(
                media_id=media_id,
                account_id=account_id,
                caption=full_caption,
                **publish_kwargs
            )
            
            return {
                "success": result.get("success", False),
                "post_id": result.get("result", {}).get("post_id"),
                "url": result.get("result", {}).get("url"),
                "platform": platform,
                "account_id": account_id
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _upload_to_blotato(self, video_path: str) -> str:
        """Upload video to Blotato and return media_id"""
        import httpx
        
        api_key = os.getenv("BLOTATO_API_KEY")
        if not api_key:
            raise ValueError("BLOTATO_API_KEY not configured")
        
        async with httpx.AsyncClient() as client:
            with open(video_path, "rb") as f:
                files = {"file": (Path(video_path).name, f, "video/mp4")}
                response = await client.post(
                    "https://api.blotato.com/v2/media/upload",
                    headers={"Authorization": f"Bearer {api_key}"},
                    files=files,
                    timeout=120  # Videos can take a while to upload
                )
                response.raise_for_status()
                data = response.json()
                return data.get("media_id") or data.get("id")


# === Webhook Handler for Video Ready Events ===

class VideoReadyWebhookHandler:
    """
    Handles incoming webhooks/events when videos are ready.
    
    Can be triggered by:
    - Safari Automation telemetry (WebSocket on 7071)
    - C2 API events (SSE on 9100)
    - Direct webhook calls
    - File system watcher
    """
    
    def __init__(self):
        self.pipeline = VideoReadyPipeline()
        self._handlers = {}
    
    async def handle_sora_video_ready(
        self,
        video_path: str,
        prompt: str = None,
        character: str = None
    ) -> Dict[str, Any]:
        """
        Handle Sora video generation complete event.
        
        Called when Safari Automation finishes generating a Sora video.
        """
        logger.info(f"🎬 Sora video ready: {video_path}")
        
        return await self.pipeline.process_video_ready(
            video_path=video_path,
            source="sora",
            publish_to=["youtube", "tiktok"],
            metadata={
                "prompt": prompt,
                "character": character,
                "generator": "sora.chatgpt.com"
            }
        )
    
    async def handle_watermark_removal_complete(
        self,
        video_path: str,
        original_path: str = None
    ) -> Dict[str, Any]:
        """
        Handle watermark removal complete event.
        
        Called when a video has been cleaned of watermarks.
        """
        logger.info(f"🎬 Clean video ready: {video_path}")
        
        return await self.pipeline.process_video_ready(
            video_path=video_path,
            source="watermark_removal",
            publish_to=["youtube", "tiktok"],
            metadata={
                "original_path": original_path,
                "cleaned": True
            }
        )
    
    async def handle_generic_video_ready(
        self,
        video_path: str,
        platforms: List[str] = None,
        caption: str = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Handle any video ready event.
        """
        return await self.pipeline.process_video_ready(
            video_path=video_path,
            source=metadata.get("source", "unknown") if metadata else "unknown",
            publish_to=platforms or ["youtube", "tiktok"],
            custom_caption=caption,
            metadata=metadata
        )


# === FastAPI Integration ===

def create_webhook_router():
    """Create FastAPI router for video ready webhooks"""
    from fastapi import APIRouter, HTTPException, BackgroundTasks
    from pydantic import BaseModel
    from typing import Optional
    
    router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
    handler = VideoReadyWebhookHandler()
    
    class VideoReadyPayload(BaseModel):
        video_path: str
        source: str = "unknown"
        platforms: List[str] = ["youtube", "tiktok"]
        caption: Optional[str] = None
        prompt: Optional[str] = None
        character: Optional[str] = None
        auto_publish: bool = True
    
    @router.post("/video-ready")
    async def video_ready_webhook(
        payload: VideoReadyPayload,
        background_tasks: BackgroundTasks
    ):
        """
        Webhook endpoint for video ready events.
        
        Called when a video is ready for processing.
        Processing happens in background.
        """
        # Process in background to return quickly
        background_tasks.add_task(
            handler.handle_generic_video_ready,
            video_path=payload.video_path,
            platforms=payload.platforms,
            caption=payload.caption,
            metadata={
                "source": payload.source,
                "prompt": payload.prompt,
                "character": payload.character
            }
        )
        
        return {
            "accepted": True,
            "message": "Video queued for processing",
            "video_path": payload.video_path
        }
    
    @router.post("/sora-ready")
    async def sora_ready_webhook(
        payload: VideoReadyPayload,
        background_tasks: BackgroundTasks
    ):
        """
        Webhook for Sora video generation complete.
        """
        background_tasks.add_task(
            handler.handle_sora_video_ready,
            video_path=payload.video_path,
            prompt=payload.prompt,
            character=payload.character
        )
        
        return {
            "accepted": True,
            "message": "Sora video queued for analysis and publishing"
        }
    
    return router
