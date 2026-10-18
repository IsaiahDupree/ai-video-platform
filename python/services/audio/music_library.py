"""
Music Library Service (MUSIC-001)
==================================
Service for managing music tracks with rich metadata.

Features:
- Import music from Suno, SoundCloud, social platforms
- Search by mood, genre, tempo, energy
- Auto-deduplication via checksum
- Usage tracking
- Trending music management
- Quality ratings

Usage:
    from services.music_library import MusicLibrary

    library = MusicLibrary()

    # Import a track
    track_id = await library.import_track(
        file_path="/path/to/music.mp3",
        title="Energetic Beats",
        source="suno",
        mood="energetic",
        tempo_bpm=128,
        energy_level=0.8
    )

    # Search for music
    tracks = await library.search_tracks(
        mood="energetic",
        tempo_range=(120, 140),
        energy_min=0.7
    )

    # Get trending music
    trending = await library.get_trending_tracks(platform="tiktok", limit=20)
"""

import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4

from loguru import logger
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import async_session_maker
from database.models import MusicTrack


class MusicLibrary:
    """
    Music Library Service

    Manages the music_tracks database table with rich metadata for
    background music selection and auto-matching.
    """

    def __init__(self):
        """Initialize music library service"""
        self.session_maker = async_session_maker

    async def import_track(
        self,
        workspace_id: UUID,
        file_path: str,
        title: str,
        source: str,
        duration_seconds: float,
        artist: Optional[str] = None,
        source_id: Optional[str] = None,
        source_url: Optional[str] = None,
        # Audio properties
        sample_rate: Optional[int] = None,
        bitrate: Optional[int] = None,
        channels: int = 2,
        file_format: Optional[str] = None,
        # Musical metadata
        tempo_bpm: Optional[float] = None,
        key: Optional[str] = None,
        time_signature: Optional[str] = None,
        genre: Optional[str] = None,
        subgenre: Optional[str] = None,
        # Mood & Energy
        mood: Optional[str] = None,
        energy_level: Optional[float] = None,
        valence: Optional[float] = None,
        danceability: Optional[float] = None,
        instrumentalness: Optional[float] = None,
        # Tags
        tags: Optional[List[str]] = None,
        moods: Optional[List[str]] = None,
        use_cases: Optional[List[str]] = None,
        suitable_for_content_types: Optional[List[str]] = None,
        recommended_video_pacing: Optional[str] = None,
        # Licensing
        license_type: Optional[str] = None,
        attribution_required: bool = False,
        commercial_use_allowed: bool = True,
        license_url: Optional[str] = None,
        # Platform metadata
        platform: Optional[str] = None,
        platform_popularity: Optional[int] = None,
        is_trending: bool = False,
        trending_rank: Optional[int] = None,
        # Import metadata
        imported_from: Optional[str] = None,
        import_batch_id: Optional[UUID] = None,
        # Skip duplicate check
        skip_duplicate_check: bool = False
    ) -> UUID:
        """
        Import a music track into the library

        Args:
            workspace_id: Workspace ID
            file_path: Local path to audio file
            title: Track title
            source: Music source ('suno', 'soundcloud', 'social_platform', 'local')
            duration_seconds: Track duration in seconds
            ... (other metadata fields)
            skip_duplicate_check: Skip checksum deduplication

        Returns:
            UUID of imported track (existing if duplicate, new otherwise)

        Raises:
            FileNotFoundError: If file_path doesn't exist
            ValueError: If required fields are invalid
        """
        # Validate file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Music file not found: {file_path}")

        # Get file properties
        file_size_bytes = os.path.getsize(file_path)
        if not file_format:
            file_format = Path(file_path).suffix.lstrip('.')

        # Calculate checksum for deduplication
        checksum = self._calculate_checksum(file_path)

        async with self.session_maker() as session:
            # Check for duplicate
            if not skip_duplicate_check:
                existing = await self._find_by_checksum(session, checksum, workspace_id)
                if existing:
                    logger.info(f"Track already exists (checksum match): {existing.id}")
                    return existing.id

            # Create new track
            track = MusicTrack(
                id=uuid4(),
                workspace_id=workspace_id,
                # Identification
                title=title,
                artist=artist,
                source=source,
                source_id=source_id,
                source_url=source_url,
                # File info
                file_path=file_path,
                file_size_bytes=file_size_bytes,
                file_format=file_format,
                checksum=checksum,
                # Audio properties
                duration_seconds=duration_seconds,
                sample_rate=sample_rate,
                bitrate=bitrate,
                channels=channels,
                # Musical metadata
                tempo_bpm=tempo_bpm,
                key=key,
                time_signature=time_signature,
                genre=genre,
                subgenre=subgenre,
                # Mood & Energy
                mood=mood,
                energy_level=energy_level,
                valence=valence,
                danceability=danceability,
                instrumentalness=instrumentalness,
                # Tags
                tags=tags,
                moods=moods,
                use_cases=use_cases,
                suitable_for_content_types=suitable_for_content_types,
                recommended_video_pacing=recommended_video_pacing,
                # Licensing
                license_type=license_type or 'royalty_free',
                attribution_required=attribution_required,
                commercial_use_allowed=commercial_use_allowed,
                license_url=license_url,
                # Platform
                platform=platform,
                platform_popularity=platform_popularity,
                is_trending=is_trending,
                trending_rank=trending_rank,
                # Import metadata
                imported_from=imported_from or source,
                import_batch_id=import_batch_id,
                imported_at=datetime.now(timezone.utc)
            )

            session.add(track)
            await session.commit()

            logger.info(f"Imported music track: {track.id} - {title} ({source})")
            return track.id

    async def search_tracks(
        self,
        workspace_id: UUID,
        # Search filters
        mood: Optional[str] = None,
        genre: Optional[str] = None,
        source: Optional[str] = None,
        platform: Optional[str] = None,
        is_trending: Optional[bool] = None,
        # Range filters
        tempo_range: Optional[Tuple[float, float]] = None,  # (min, max)
        energy_min: Optional[float] = None,
        energy_max: Optional[float] = None,
        duration_min: Optional[float] = None,
        duration_max: Optional[float] = None,
        # Tag filters
        tags: Optional[List[str]] = None,  # Must have ALL tags
        content_type: Optional[str] = None,  # suitable_for_content_types
        # Licensing
        commercial_use_only: bool = False,
        attribution_not_required: bool = False,
        # Quality
        min_quality_rating: Optional[float] = None,
        is_curated_only: bool = False,
        # Pagination
        limit: int = 50,
        offset: int = 0,
        # Sorting
        sort_by: str = "created_at",  # created_at, title, tempo_bpm, energy_level, times_used, trending_rank
        sort_desc: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Search music tracks with filters

        Args:
            workspace_id: Workspace ID
            mood: Filter by mood ('energetic', 'calm', etc.)
            genre: Filter by genre
            source: Filter by source ('suno', 'soundcloud', etc.)
            tempo_range: Tempo BPM range (min, max)
            energy_min: Minimum energy level (0.0-1.0)
            energy_max: Maximum energy level (0.0-1.0)
            tags: Must include all specified tags
            limit: Max results
            offset: Pagination offset
            sort_by: Field to sort by
            sort_desc: Sort descending

        Returns:
            List of track dictionaries
        """
        async with self.session_maker() as session:
            # Build query
            query = select(MusicTrack).where(MusicTrack.workspace_id == workspace_id)

            # Filters
            if mood:
                query = query.where(MusicTrack.mood == mood)
            if genre:
                query = query.where(MusicTrack.genre == genre)
            if source:
                query = query.where(MusicTrack.source == source)
            if platform:
                query = query.where(MusicTrack.platform == platform)
            if is_trending is not None:
                query = query.where(MusicTrack.is_trending == is_trending)

            # Range filters
            if tempo_range:
                query = query.where(
                    and_(
                        MusicTrack.tempo_bpm >= tempo_range[0],
                        MusicTrack.tempo_bpm <= tempo_range[1]
                    )
                )
            if energy_min is not None:
                query = query.where(MusicTrack.energy_level >= energy_min)
            if energy_max is not None:
                query = query.where(MusicTrack.energy_level <= energy_max)
            if duration_min is not None:
                query = query.where(MusicTrack.duration_seconds >= duration_min)
            if duration_max is not None:
                query = query.where(MusicTrack.duration_seconds <= duration_max)

            # Tag filters (array contains all specified tags)
            if tags:
                for tag in tags:
                    query = query.where(MusicTrack.tags.contains([tag]))

            if content_type:
                query = query.where(
                    MusicTrack.suitable_for_content_types.contains([content_type])
                )

            # Licensing filters
            if commercial_use_only:
                query = query.where(MusicTrack.commercial_use_allowed == True)
            if attribution_not_required:
                query = query.where(MusicTrack.attribution_required == False)

            # Quality filters
            if min_quality_rating is not None:
                query = query.where(MusicTrack.quality_rating >= min_quality_rating)
            if is_curated_only:
                query = query.where(MusicTrack.is_curated == True)

            # Active tracks only
            query = query.where(MusicTrack.is_active == True)

            # Sorting
            sort_column = getattr(MusicTrack, sort_by, MusicTrack.created_at)
            if sort_desc:
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())

            # Pagination
            query = query.limit(limit).offset(offset)

            # Execute
            result = await session.execute(query)
            tracks = result.scalars().all()

            return [self._track_to_dict(track) for track in tracks]

    async def get_track_by_id(self, track_id: UUID) -> Optional[Dict[str, Any]]:
        """Get track by ID"""
        async with self.session_maker() as session:
            result = await session.execute(
                select(MusicTrack).where(MusicTrack.id == track_id)
            )
            track = result.scalar_one_or_none()
            return self._track_to_dict(track) if track else None

    async def get_trending_tracks(
        self,
        workspace_id: UUID,
        platform: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get trending music tracks"""
        return await self.search_tracks(
            workspace_id=workspace_id,
            platform=platform,
            is_trending=True,
            sort_by="trending_rank",
            sort_desc=False,
            limit=limit
        )

    async def record_usage(self, track_id: UUID) -> None:
        """Record that a track was used"""
        async with self.session_maker() as session:
            result = await session.execute(
                select(MusicTrack).where(MusicTrack.id == track_id)
            )
            track = result.scalar_one_or_none()

            if track:
                track.times_used = (track.times_used or 0) + 1
                track.last_used_at = datetime.now(timezone.utc)
                await session.commit()

    async def update_match_score(self, track_id: UUID, match_score: float) -> None:
        """Update average match score"""
        async with self.session_maker() as session:
            result = await session.execute(
                select(MusicTrack).where(MusicTrack.id == track_id)
            )
            track = result.scalar_one_or_none()

            if track:
                # Calculate running average
                current_avg = track.avg_match_score or 0.0
                times_used = track.times_used or 0
                new_avg = ((current_avg * times_used) + match_score) / (times_used + 1)
                track.avg_match_score = new_avg
                await session.commit()

    def _calculate_checksum(self, file_path: str) -> str:
        """Calculate SHA-256 checksum of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    async def _find_by_checksum(
        self,
        session: AsyncSession,
        checksum: str,
        workspace_id: UUID
    ) -> Optional[MusicTrack]:
        """Find track by checksum (deduplication)"""
        result = await session.execute(
            select(MusicTrack).where(
                and_(
                    MusicTrack.checksum == checksum,
                    MusicTrack.workspace_id == workspace_id
                )
            )
        )
        return result.scalar_one_or_none()

    def _track_to_dict(self, track: MusicTrack) -> Dict[str, Any]:
        """Convert MusicTrack model to dictionary"""
        return {
            "id": str(track.id),
            "workspace_id": str(track.workspace_id),
            # Identification
            "title": track.title,
            "artist": track.artist,
            "source": track.source,
            "source_id": track.source_id,
            "source_url": track.source_url,
            # File info
            "file_path": track.file_path,
            "file_size_bytes": track.file_size_bytes,
            "file_format": track.file_format,
            "duration_seconds": track.duration_seconds,
            # Audio properties
            "sample_rate": track.sample_rate,
            "bitrate": track.bitrate,
            "channels": track.channels,
            # Musical metadata
            "tempo_bpm": track.tempo_bpm,
            "key": track.key,
            "time_signature": track.time_signature,
            "genre": track.genre,
            "subgenre": track.subgenre,
            # Mood & Energy
            "mood": track.mood,
            "energy_level": track.energy_level,
            "valence": track.valence,
            "danceability": track.danceability,
            "instrumentalness": track.instrumentalness,
            # Tags
            "tags": track.tags,
            "moods": track.moods,
            "use_cases": track.use_cases,
            "suitable_for_content_types": track.suitable_for_content_types,
            "recommended_video_pacing": track.recommended_video_pacing,
            # Licensing
            "license_type": track.license_type,
            "attribution_required": track.attribution_required,
            "commercial_use_allowed": track.commercial_use_allowed,
            "license_url": track.license_url,
            # Platform
            "platform": track.platform,
            "platform_popularity": track.platform_popularity,
            "is_trending": track.is_trending,
            "trending_rank": track.trending_rank,
            "trending_date": track.trending_date.isoformat() if track.trending_date else None,
            # Usage
            "times_used": track.times_used,
            "last_used_at": track.last_used_at.isoformat() if track.last_used_at else None,
            "avg_match_score": track.avg_match_score,
            # Quality
            "quality_rating": track.quality_rating,
            "is_active": track.is_active,
            "is_curated": track.is_curated,
            "curation_notes": track.curation_notes,
            # Timestamps
            "created_at": track.created_at.isoformat() if track.created_at else None,
            "updated_at": track.updated_at.isoformat() if track.updated_at else None
        }


# Singleton instance
_music_library: Optional[MusicLibrary] = None

def get_music_library() -> MusicLibrary:
    """Get singleton instance of MusicLibrary"""
    global _music_library
    if _music_library is None:
        _music_library = MusicLibrary()
    return _music_library
