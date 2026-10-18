"""
Voice Profile Service
=====================
Manage voice profiles and reference audio.

Feature: VC-002
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from loguru import logger

from database.models import VoiceProfile
from services.voice.modal_voice_service import get_modal_voice_service
from services.voice_cloning_quality_assessor import VoiceCloningQualityAssessor
from services.exceptions import ServiceError


class VoiceProfileService:
    """Service for managing voice profiles and reference audio."""

    def __init__(self, db: AsyncSession):
        """
        Initialize voice profile service.

        Args:
            db: Database session
        """
        self.db = db
        self.modal_service = get_modal_voice_service()
        self.quality_assessor = VoiceCloningQualityAssessor()

    async def create_profile(
        self,
        user_id: UUID,
        name: str,
        description: Optional[str] = None,
        reference_urls: Optional[List[str]] = None,
        is_default: bool = False
    ) -> VoiceProfile:
        """
        Create a new voice profile.

        Args:
            user_id: User ID
            name: Profile name
            description: Optional description
            reference_urls: List of reference audio URLs
            is_default: Set as default profile

        Returns:
            Created voice profile

        Raises:
            ServiceError: If creation fails
        """
        try:
            # Create profile
            profile = VoiceProfile(
                user_id=user_id,
                name=name,
                description=description,
                reference_urls=reference_urls or [],
                is_default=is_default
            )

            self.db.add(profile)
            await self.db.flush()

            # If reference URLs provided, create embedding
            if reference_urls:
                await self._create_embedding(profile, reference_urls)

            await self.db.commit()
            await self.db.refresh(profile)

            logger.success(f"Created voice profile: {name} ({profile.id})")
            return profile

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to create voice profile: {e}")
            raise ServiceError(f"Failed to create voice profile: {str(e)}")

    async def add_reference_audio(
        self,
        profile_id: UUID,
        audio_url: str,
        analyze_quality: bool = True
    ) -> Dict[str, Any]:
        """
        Add reference audio to a voice profile.

        Args:
            profile_id: Voice profile ID
            audio_url: URL to reference audio
            analyze_quality: Run quality analysis

        Returns:
            {
                "success": bool,
                "quality_metrics": dict (if analyze_quality=True)
            }

        Raises:
            ServiceError: If operation fails
        """
        try:
            # Get profile
            result = await self.db.execute(
                select(VoiceProfile).where(VoiceProfile.id == profile_id)
            )
            profile = result.scalar_one_or_none()

            if not profile:
                raise ServiceError(f"Voice profile {profile_id} not found")

            # Analyze quality if requested
            quality_metrics = None
            if analyze_quality:
                quality_metrics = await self._analyze_audio_quality(audio_url)

                # Check if quality is acceptable
                if quality_metrics.get("overall_score", 0) < 0.5:
                    logger.warning(
                        f"Low quality audio ({quality_metrics['overall_score']:.2f}): "
                        f"{audio_url}"
                    )

            # Add URL to profile
            reference_urls = profile.reference_urls or []
            if audio_url not in reference_urls:
                reference_urls.append(audio_url)

                await self.db.execute(
                    update(VoiceProfile)
                    .where(VoiceProfile.id == profile_id)
                    .values(reference_urls=reference_urls)
                )

                # Re-create embedding with new reference
                await self._create_embedding(profile, reference_urls)

                await self.db.commit()

                logger.success(
                    f"Added reference audio to profile {profile.name}: {audio_url}"
                )

            return {
                "success": True,
                "quality_metrics": quality_metrics
            }

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to add reference audio: {e}")
            raise ServiceError(f"Failed to add reference audio: {str(e)}")

    async def get_profile(self, profile_id: UUID) -> Optional[VoiceProfile]:
        """Get voice profile by ID."""
        result = await self.db.execute(
            select(VoiceProfile).where(VoiceProfile.id == profile_id)
        )
        return result.scalar_one_or_none()

    async def get_user_profiles(
        self,
        user_id: UUID,
        active_only: bool = True
    ) -> List[VoiceProfile]:
        """
        Get all voice profiles for a user.

        Args:
            user_id: User ID
            active_only: Only return active profiles

        Returns:
            List of voice profiles
        """
        query = select(VoiceProfile).where(VoiceProfile.user_id == user_id)

        if active_only:
            query = query.where(VoiceProfile.is_active == True)

        result = await self.db.execute(query.order_by(VoiceProfile.created_at.desc()))
        return list(result.scalars().all())

    async def get_default_profile(self, user_id: UUID) -> Optional[VoiceProfile]:
        """Get user's default voice profile."""
        result = await self.db.execute(
            select(VoiceProfile).where(
                VoiceProfile.user_id == user_id,
                VoiceProfile.is_default == True
            )
        )
        return result.scalar_one_or_none()

    async def update_profile(
        self,
        profile_id: UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        default_speed: Optional[float] = None,
        default_emotion: Optional[str] = None,
        is_default: Optional[bool] = None
    ) -> VoiceProfile:
        """
        Update voice profile.

        Args:
            profile_id: Profile ID
            name: New name
            description: New description
            default_speed: Default speed setting
            default_emotion: Default emotion setting
            is_default: Set as default

        Returns:
            Updated profile

        Raises:
            ServiceError: If update fails
        """
        try:
            profile = await self.get_profile(profile_id)
            if not profile:
                raise ServiceError(f"Voice profile {profile_id} not found")

            # Build update values
            values = {}
            if name is not None:
                values["name"] = name
            if description is not None:
                values["description"] = description
            if default_speed is not None:
                values["default_speed"] = default_speed
            if default_emotion is not None:
                values["default_emotion"] = default_emotion
            if is_default is not None:
                values["is_default"] = is_default

            if values:
                await self.db.execute(
                    update(VoiceProfile)
                    .where(VoiceProfile.id == profile_id)
                    .values(**values)
                )
                await self.db.commit()
                await self.db.refresh(profile)

                logger.success(f"Updated voice profile: {profile.name}")

            return profile

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to update voice profile: {e}")
            raise ServiceError(f"Failed to update voice profile: {str(e)}")

    async def delete_profile(self, profile_id: UUID) -> bool:
        """
        Delete voice profile.

        Args:
            profile_id: Profile ID

        Returns:
            True if deleted

        Raises:
            ServiceError: If deletion fails
        """
        try:
            result = await self.db.execute(
                delete(VoiceProfile).where(VoiceProfile.id == profile_id)
            )
            await self.db.commit()

            if result.rowcount > 0:
                logger.success(f"Deleted voice profile: {profile_id}")
                return True

            return False

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to delete voice profile: {e}")
            raise ServiceError(f"Failed to delete voice profile: {str(e)}")

    async def _create_embedding(
        self,
        profile: VoiceProfile,
        reference_urls: List[str]
    ) -> None:
        """
        Create voice embedding on Modal service.

        Args:
            profile: Voice profile
            reference_urls: List of reference audio URLs
        """
        if not self.modal_service.is_configured():
            logger.warning("Modal service not configured, skipping embedding creation")
            return

        try:
            # Create embedding on Modal
            result = await self.modal_service.create_voice_embedding(
                voice_reference_urls=reference_urls,
                name=profile.name
            )

            # Update profile with embedding info
            await self.db.execute(
                update(VoiceProfile)
                .where(VoiceProfile.id == profile.id)
                .values(
                    embedding_id=result["embedding_id"],
                    embedding_created_at=datetime.fromisoformat(result["created_at"]),
                    quality_score=result.get("quality_score")
                )
            )

            logger.success(
                f"Created voice embedding for {profile.name}: "
                f"{result['embedding_id']}"
            )

        except Exception as e:
            logger.error(f"Failed to create voice embedding: {e}")
            # Don't fail the whole operation if embedding creation fails
            # Profile can still be used with reference URLs directly

    async def _analyze_audio_quality(self, audio_url: str) -> Dict[str, Any]:
        """
        Analyze audio quality for voice cloning.

        Args:
            audio_url: URL to audio file

        Returns:
            Quality metrics dict
        """
        if not self.modal_service.is_configured():
            logger.warning("Modal service not configured, skipping quality analysis")
            return {"overall_score": 0.0, "suitability": "unknown"}

        try:
            result = await self.modal_service.analyze_reference(audio_url)
            return result

        except Exception as e:
            logger.error(f"Audio quality analysis failed: {e}")
            return {"overall_score": 0.0, "suitability": "unknown", "error": str(e)}
