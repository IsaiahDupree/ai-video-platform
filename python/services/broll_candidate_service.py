"""
B-Roll Candidate Service
========================
Finds, ranks, and manages B-roll candidates for video formats.
Connects to the Narrative Builder to generate story-driven B-roll suggestions.
"""
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum
from loguru import logger

from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.ext.asyncio import AsyncSession


class BrollProvider(str, Enum):
    USER_LIBRARY = "user_library"
    PEXELS = "pexels"
    PIXABAY = "pixabay"
    STORYBLOCKS = "storyblocks"
    ARTGRID = "artgrid"
    YOUTUBE_REFERENCE = "youtube_reference"
    OTHER = "other"


class BeatRole(str, Enum):
    HOOK = "hook"
    PROBLEM = "problem"
    SOLUTION = "solution"
    PROOF = "proof"
    STEPS = "steps"
    CTA = "cta"
    OTHER = "other"


class CameraMotion(str, Enum):
    STATIC = "static"
    PAN = "pan"
    TILT = "tilt"
    ZOOM = "zoom"
    TRACKING = "tracking"
    HANDHELD = "handheld"
    UNKNOWN = "unknown"


class VisualStyle(str, Enum):
    UGC = "ugc"
    PROFESSIONAL = "professional"
    CINEMATIC = "cinematic"
    MINIMAL = "minimal"
    UNKNOWN = "unknown"


@dataclass
class BrollSlotQuery:
    """Query profile for finding B-roll candidates"""
    slot_id: str
    beat_id: str
    beat_role: BeatRole
    required_concepts: List[str]
    optional_concepts: List[str] = field(default_factory=list)
    negative_terms: List[str] = field(default_factory=list)
    query_strings: List[str] = field(default_factory=list)
    
    # Constraints
    people: str = "allowed"  # required, allowed, forbidden
    logos: str = "forbidden"  # allowed, forbidden
    setting: Optional[str] = None
    camera_motion: List[str] = field(default_factory=list)
    color_mood: str = "any"
    visual_style: str = "any"
    min_duration_sec: float = 2.0
    max_duration_sec: float = 10.0
    min_width: int = 720
    min_height: int = 1280


@dataclass
class BrollCandidate:
    """A single B-roll candidate with scores and metadata"""
    candidate_id: str
    slot_id: str
    beat_id: str
    
    # Source info
    provider: str
    provider_asset_id: str
    origin: str  # search, trend_seed, user_upload, recommended
    
    # Asset info
    asset_type: str  # video, image, gif
    url: str
    thumbnail_url: str
    duration_sec: float
    width: int
    height: int
    
    # Analysis
    scene_description: str
    tags: List[str]
    detected_objects: List[str] = field(default_factory=list)
    people_present: bool = False
    camera_motion: str = "unknown"
    visual_style: str = "unknown"
    color_mood: str = "unknown"
    
    # Scores (0-1)
    relevance_score: float = 0.0
    format_fit_score: float = 0.0
    novelty_score: float = 0.0
    brand_fit_score: float = 0.0
    diversity_penalty: float = 0.0
    overall_score: float = 0.0
    
    explanation: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "schema": "broll_candidate_v1",
            "candidate_id": self.candidate_id,
            "slot_id": self.slot_id,
            "beat_id": self.beat_id,
            "source": {
                "provider": self.provider,
                "provider_asset_id": self.provider_asset_id,
                "origin": self.origin,
            },
            "asset": {
                "asset_type": self.asset_type,
                "url": self.url,
                "thumbnail_url": self.thumbnail_url,
                "duration_sec": self.duration_sec,
                "width": self.width,
                "height": self.height,
            },
            "analysis": {
                "scene_description": self.scene_description,
                "tags": self.tags,
                "detected_objects": self.detected_objects,
                "people": {"present": self.people_present},
                "camera_motion": self.camera_motion,
                "visual_style": self.visual_style,
                "color_mood": self.color_mood,
            },
            "scores": {
                "relevance_score": self.relevance_score,
                "format_fit_score": self.format_fit_score,
                "novelty_score": self.novelty_score,
                "brand_fit_score": self.brand_fit_score,
                "diversity_penalty": self.diversity_penalty,
            },
            "overall_score": self.overall_score,
            "explanation": self.explanation,
            "created_at_iso": self.created_at.isoformat(),
        }


class BrollCandidateService:
    """
    Service for finding and ranking B-roll candidates.
    
    Pipeline:
    1. Format defines B-roll slots with query profiles
    2. For each slot, search user library + external sources
    3. Analyze and score candidates
    4. Return ranked list per slot
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self._cache: Dict[str, List[BrollCandidate]] = {}
    
    async def find_candidates_for_format(
        self,
        format_id: str,
        slots: List[BrollSlotQuery],
        limit_per_slot: int = 20,
    ) -> Dict[str, List[BrollCandidate]]:
        """
        Find B-roll candidates for all slots in a format.
        
        Returns dict mapping slot_id -> list of ranked candidates
        """
        logger.info(f"🎬 [B-Roll] Finding candidates for format {format_id}")
        logger.info(f"   Slots: {len(slots)}")
        
        results: Dict[str, List[BrollCandidate]] = {}
        
        for slot in slots:
            logger.info(f"   📍 Slot {slot.slot_id} ({slot.beat_role.value})")
            candidates = await self._find_candidates_for_slot(slot, limit_per_slot)
            results[slot.slot_id] = candidates
            logger.info(f"      Found {len(candidates)} candidates")
        
        return results
    
    async def find_all_broll_candidates(
        self,
        format_id: str,
        limit: int = 50,
        offset: int = 0,
        beat_filter: Optional[str] = None,
        min_score: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Find all B-roll candidates from user library for a format.
        Used for the "All Candidates" view.
        """
        logger.info(f"🎬 [B-Roll] Finding all candidates for format {format_id}")
        logger.info(f"   Limit: {limit}, Offset: {offset}")
        
        from database.models import Video, VideoAnalysis
        
        # Build query for all videos with analysis
        query = select(Video, VideoAnalysis).outerjoin(
            VideoAnalysis, Video.id == VideoAnalysis.video_id
        )
        
        # Filter for videos (not images)
        video_extensions = ('.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm')
        conditions = [Video.file_name.ilike(f'%{ext}') for ext in video_extensions]
        query = query.filter(or_(*conditions))
        
        # Only require that video has some analysis (less strict filter)
        # All analyzed videos are potential B-roll candidates
        query = query.filter(VideoAnalysis.video_id.isnot(None))
        
        # Get total count first
        count_query = select(func.count(Video.id)).outerjoin(
            VideoAnalysis, Video.id == VideoAnalysis.video_id
        ).filter(or_(*conditions)).filter(VideoAnalysis.video_id.isnot(None))
        
        try:
            total_result = await self.db.execute(count_query)
            total = total_result.scalar() or 0
            logger.info(f"   Total eligible videos: {total}")
        except Exception as e:
            logger.error(f"   Count query error: {e}")
            total = 0
        
        # Apply pagination
        query = query.order_by(Video.created_at.desc()).offset(offset).limit(limit)
        
        try:
            result = await self.db.execute(query)
            rows = result.all()
            logger.info(f"   Query returned {len(rows)} rows")
        except Exception as e:
            logger.error(f"   Query error: {e}")
            rows = []
        
        # Convert to candidates
        candidates = []
        for row in rows:
            video, analysis = row
            candidate = await self._video_to_candidate(video, "all", "all", analysis)
            if candidate:
                # Score the candidate
                self._score_candidate_simple(candidate)
                if candidate.overall_score >= min_score:
                    candidates.append(candidate)
        
        logger.info(f"   Converted {len(candidates)} candidates")
        
        # Sort by score
        candidates.sort(key=lambda c: c.overall_score, reverse=True)
        
        return {
            "candidates": [c.to_dict() for c in candidates],
            "total": total,
            "offset": offset,
            "limit": limit,
        }
    
    async def _find_candidates_for_slot(
        self,
        slot: BrollSlotQuery,
        limit: int,
    ) -> List[BrollCandidate]:
        """Find and rank candidates for a single slot"""
        
        candidates: List[BrollCandidate] = []
        
        # Search user library first
        library_candidates = await self._search_user_library(slot, limit * 2)
        candidates.extend(library_candidates)
        
        # Score and rank candidates
        for candidate in candidates:
            self._score_candidate(candidate, slot)
        
        # Sort by overall score
        candidates.sort(key=lambda c: c.overall_score, reverse=True)
        
        return candidates[:limit]
    
    async def _search_user_library(
        self,
        slot: BrollSlotQuery,
        limit: int,
    ) -> List[BrollCandidate]:
        """Search user's media library for matching B-roll"""
        
        from database.models import Video, VideoAnalysis
        
        # Build query
        query = select(Video, VideoAnalysis).outerjoin(
            VideoAnalysis, Video.id == VideoAnalysis.video_id
        )
        
        # Filter for videos only
        video_extensions = ('.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm')
        conditions = [Video.file_name.ilike(f'%{ext}') for ext in video_extensions]
        query = query.filter(or_(*conditions))
        
        # Duration filter
        if slot.min_duration_sec:
            query = query.filter(Video.duration_sec >= slot.min_duration_sec)
        if slot.max_duration_sec:
            query = query.filter(Video.duration_sec <= slot.max_duration_sec)
        
        # Resolution filter
        if slot.min_width:
            query = query.filter(Video.width >= slot.min_width)
        if slot.min_height:
            query = query.filter(Video.height >= slot.min_height)
        
        # People filter based on visual analysis
        if slot.people == "forbidden":
            query = query.filter(
                or_(
                    VideoAnalysis.visual_analysis['has_person'].astext == 'false',
                    VideoAnalysis.visual_analysis.is_(None)
                )
            )
        elif slot.people == "required":
            query = query.filter(
                VideoAnalysis.visual_analysis['has_person'].astext == 'true'
            )
        
        # Limit results
        query = query.limit(limit)
        
        result = await self.db.execute(query)
        rows = result.all()
        
        candidates = []
        for video, analysis in rows:
            candidate = await self._video_to_candidate(video, slot.slot_id, slot.beat_id, analysis)
            if candidate:
                candidates.append(candidate)
        
        return candidates
    
    async def _video_to_candidate(
        self,
        video,
        slot_id: str,
        beat_id: str,
        analysis = None,
    ) -> Optional[BrollCandidate]:
        """Convert a Video model to a BrollCandidate"""
        
        try:
            # Extract analysis data
            visual_data = {}
            if analysis and analysis.visual_analysis:
                visual_data = analysis.visual_analysis if isinstance(analysis.visual_analysis, dict) else {}
            
            # Build thumbnail URL - use media-db endpoint for consistency
            thumbnail_url = f"/api/media-db/thumbnail/{video.id}"
            
            # Build video URL - use media-provider for streaming
            video_url = f"/api/media-provider/stream/{video.id}"
            
            # Extract tags from analysis
            tags = []
            if analysis:
                if analysis.topics:
                    tags.extend(analysis.topics if isinstance(analysis.topics, list) else [])
                if analysis.hooks:
                    tags.extend(analysis.hooks if isinstance(analysis.hooks, list) else [])
            
            # Parse resolution (e.g., "1080x1920" or "1920x1080")
            width, height = 1080, 1920
            if video.resolution:
                try:
                    parts = video.resolution.lower().replace('x', ' ').split()
                    if len(parts) >= 2:
                        width = int(parts[0])
                        height = int(parts[1])
                except (ValueError, IndexError):
                    pass
            
            candidate = BrollCandidate(
                candidate_id=str(uuid.uuid4()),
                slot_id=slot_id,
                beat_id=beat_id,
                provider=BrollProvider.USER_LIBRARY.value,
                provider_asset_id=str(video.id),
                origin="user_upload",
                asset_type="video",
                url=video_url,
                thumbnail_url=thumbnail_url,
                duration_sec=video.duration_sec or 0,
                width=width,
                height=height,
                scene_description=visual_data.get("scene_description", "") or video.title or video.file_name or "",
                tags=tags,
                detected_objects=visual_data.get("detected_objects", []),
                people_present=visual_data.get("has_person", False),
                camera_motion=visual_data.get("camera_motion", "unknown"),
                visual_style=visual_data.get("visual_style", "unknown"),
                color_mood=visual_data.get("color_mood", "unknown"),
            )
            
            return candidate
            
        except Exception as e:
            logger.error(f"Error converting video to candidate: {e}")
            return None
    
    def _score_candidate_simple(self, candidate: BrollCandidate):
        """Score a candidate without specific slot requirements (for browsing)"""
        
        # Base scores for general B-roll suitability
        candidate.relevance_score = 0.7  # Default relevance
        candidate.format_fit_score = 0.8  # Default format fit
        candidate.novelty_score = 0.8  # Default novelty
        candidate.brand_fit_score = 0.9  # Default brand fit
        
        # Boost score if no person (pure B-roll)
        if not candidate.people_present:
            candidate.format_fit_score = 0.95
        
        # Boost if has good duration (3-15 seconds)
        if 3 <= candidate.duration_sec <= 15:
            candidate.relevance_score += 0.1
        
        # Calculate overall
        overall = (
            candidate.relevance_score * 0.35 +
            candidate.format_fit_score * 0.30 +
            candidate.novelty_score * 0.15 +
            candidate.brand_fit_score * 0.20
        )
        candidate.overall_score = max(0, min(1, overall))
        
        # Generate explanation
        reasons = []
        if not candidate.people_present:
            reasons.append("clean B-roll")
        if 3 <= candidate.duration_sec <= 15:
            reasons.append(f"{candidate.duration_sec:.1f}s ideal length")
        if candidate.tags:
            reasons.append(f"tags: {', '.join(candidate.tags[:2])}")
        
        candidate.explanation = "; ".join(reasons) if reasons else "Video from library"
    
    def _score_candidate(self, candidate: BrollCandidate, slot: BrollSlotQuery):
        """Score a candidate based on slot requirements"""
        
        # Relevance score - based on concept matching
        relevance = 0.5  # Base score
        
        # Check tags against required concepts
        candidate_tags_lower = [t.lower() for t in candidate.tags]
        for concept in slot.required_concepts:
            if any(concept.lower() in tag for tag in candidate_tags_lower):
                relevance += 0.1
        
        # Penalize for negative terms
        for neg_term in slot.negative_terms:
            if any(neg_term.lower() in tag for tag in candidate_tags_lower):
                relevance -= 0.2
        
        candidate.relevance_score = max(0, min(1, relevance))
        
        # Format fit score - based on constraints
        format_fit = 1.0
        
        # People constraint
        if slot.people == "forbidden" and candidate.people_present:
            format_fit -= 0.3
        elif slot.people == "required" and not candidate.people_present:
            format_fit -= 0.3
        
        # Camera motion constraint
        if slot.camera_motion and candidate.camera_motion != "unknown":
            if candidate.camera_motion not in slot.camera_motion:
                format_fit -= 0.1
        
        # Visual style constraint
        if slot.visual_style != "any" and candidate.visual_style != "unknown":
            if candidate.visual_style != slot.visual_style:
                format_fit -= 0.1
        
        candidate.format_fit_score = max(0, min(1, format_fit))
        
        # Novelty score - higher for less-used assets
        candidate.novelty_score = 0.8  # TODO: Track usage history
        
        # Brand fit score
        candidate.brand_fit_score = 0.9  # TODO: Compare with brand guidelines
        
        # Calculate overall score
        weights = {
            "relevance": 0.35,
            "format_fit": 0.30,
            "novelty": 0.15,
            "brand_fit": 0.20,
        }
        
        overall = (
            candidate.relevance_score * weights["relevance"] +
            candidate.format_fit_score * weights["format_fit"] +
            candidate.novelty_score * weights["novelty"] +
            candidate.brand_fit_score * weights["brand_fit"]
        )
        
        # Apply diversity penalty
        overall -= candidate.diversity_penalty * 0.1
        
        candidate.overall_score = max(0, min(1, overall))
        
        # Generate explanation
        reasons = []
        if candidate.relevance_score > 0.7:
            reasons.append("matches key concepts")
        if candidate.format_fit_score > 0.8:
            reasons.append("fits format constraints")
        if not candidate.people_present:
            reasons.append("clean B-roll (no people)")
        if candidate.duration_sec >= slot.min_duration_sec:
            reasons.append(f"{candidate.duration_sec:.1f}s duration")
        
        candidate.explanation = "; ".join(reasons) if reasons else "General B-roll candidate"
    
    async def generate_beat_queries(
        self,
        beat_role: BeatRole,
        topic: str,
        context: Dict[str, Any],
    ) -> BrollSlotQuery:
        """
        Generate B-roll search queries for a beat based on topic and context.
        This connects to the Narrative Builder.
        """
        
        # Default query profiles per beat role
        role_profiles = {
            BeatRole.HOOK: {
                "concepts": ["attention", "dramatic", "striking"],
                "camera": ["zoom", "tracking"],
                "style": "cinematic",
            },
            BeatRole.PROBLEM: {
                "concepts": ["frustration", "struggle", "confusion"],
                "camera": ["handheld", "static"],
                "style": "ugc",
            },
            BeatRole.SOLUTION: {
                "concepts": ["relief", "clarity", "success"],
                "camera": ["static", "pan"],
                "style": "professional",
            },
            BeatRole.PROOF: {
                "concepts": ["results", "evidence", "demonstration"],
                "camera": ["static", "zoom"],
                "style": "professional",
            },
            BeatRole.STEPS: {
                "concepts": ["process", "action", "tutorial"],
                "camera": ["static", "tracking"],
                "style": "minimal",
            },
            BeatRole.CTA: {
                "concepts": ["action", "engagement", "forward"],
                "camera": ["zoom", "static"],
                "style": "cinematic",
            },
        }
        
        profile = role_profiles.get(beat_role, role_profiles[BeatRole.OTHER])
        
        return BrollSlotQuery(
            slot_id=f"slot_{beat_role.value}",
            beat_id=f"beat_{beat_role.value}",
            beat_role=beat_role,
            required_concepts=[topic] + profile.get("concepts", []),
            camera_motion=profile.get("camera", []),
            visual_style=profile.get("style", "any"),
        )


# Singleton instance
_service_instance: Optional[BrollCandidateService] = None


def get_broll_service(db: AsyncSession) -> BrollCandidateService:
    """Get or create the B-roll candidate service"""
    return BrollCandidateService(db)
