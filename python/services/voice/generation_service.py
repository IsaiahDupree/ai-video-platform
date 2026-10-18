"""
Voice Generation Service
========================
Orchestrates voice generation and tracks history.

Feature: VC-006
"""

from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from loguru import logger

from database.models import VoiceGeneration, VoiceProfile
from services.voice.modal_voice_service import get_modal_voice_service
from services.exceptions import ServiceError


class VoiceGenerationService:
    """Service for orchestrating voice generation and tracking history."""

    def __init__(self, db: AsyncSession):
        """
        Initialize voice generation service.

        Args:
            db: Database session
        """
        self.db = db
        self.modal_service = get_modal_voice_service()

    async def generate_audio(
        self,
        user_id: UUID,
        text: str,
        voice_profile_id: Optional[UUID] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> VoiceGeneration:
        """
        Generate audio from text using voice profile.

        Args:
            user_id: User ID
            text: Text to synthesize
            voice_profile_id: Voice profile to use (uses default if not specified)
            options: Generation options:
                - speed: float (0.5 - 2.0)
                - pitch: float (-50.0 to 50.0)
                - emotion: str (neutral, happy, serious, excited)
                - stability: float (0.0 - 1.0)

        Returns:
            VoiceGeneration record

        Raises:
            ServiceError: If generation fails
        """
        try:
            # Get voice profile
            if voice_profile_id:
                profile_result = await self.db.execute(
                    select(VoiceProfile).where(VoiceProfile.id == voice_profile_id)
                )
                profile = profile_result.scalar_one_or_none()

                if not profile:
                    raise ServiceError(f"Voice profile {voice_profile_id} not found")
            else:
                # Use default profile
                profile_result = await self.db.execute(
                    select(VoiceProfile).where(
                        VoiceProfile.user_id == user_id,
                        VoiceProfile.is_default == True
                    )
                )
                profile = profile_result.scalar_one_or_none()

                if not profile:
                    raise ServiceError(
                        "No default voice profile found. Please create a voice profile first."
                    )

            # Merge options with profile defaults
            gen_options = {
                "speed": profile.default_speed,
                "emotion": profile.default_emotion,
                "stability": profile.default_stability
            }
            if options:
                gen_options.update(options)

            # Create generation record
            generation = VoiceGeneration(
                user_id=user_id,
                voice_profile_id=profile.id,
                input_text=text,
                options=gen_options,
                status='processing'
            )

            self.db.add(generation)
            await self.db.flush()

            logger.info(
                f"Starting voice generation: {len(text)} chars, "
                f"profile: {profile.name}"
            )

            # Generate audio
            if profile.embedding_id and self.modal_service.is_configured():
                # Use pre-created embedding (faster)
                result = await self.modal_service.generate_with_embedding(
                    text=text,
                    embedding_id=profile.embedding_id,
                    options=gen_options
                )
            elif profile.reference_urls and self.modal_service.is_configured():
                # Use reference audio directly
                result = await self.modal_service.clone_voice(
                    text=text,
                    voice_reference_url=profile.reference_urls[0],
                    options=gen_options
                )
            else:
                raise ServiceError(
                    "Voice profile has no embedding or reference audio, "
                    "and Modal service is not configured"
                )

            # Update generation record with results
            await self.db.execute(
                update(VoiceGeneration)
                .where(VoiceGeneration.id == generation.id)
                .values(
                    status='completed',
                    output_url=result['audio_url'],
                    duration_seconds=result.get('duration_seconds'),
                    processing_time_ms=result.get('processing_time_ms'),
                    modal_job_id=result.get('job_id'),
                    completed_at=datetime.utcnow()
                )
            )

            await self.db.commit()
            await self.db.refresh(generation)

            logger.success(
                f"Voice generation complete: {generation.id} "
                f"({generation.duration_seconds:.1f}s)"
            )

            return generation

        except Exception as e:
            # Mark as failed
            if 'generation' in locals():
                await self.db.execute(
                    update(VoiceGeneration)
                    .where(VoiceGeneration.id == generation.id)
                    .values(
                        status='failed',
                        error_message=str(e)
                    )
                )
                await self.db.commit()

            logger.error(f"Voice generation failed: {e}")
            raise ServiceError(f"Voice generation failed: {str(e)}")

    async def generate_batch(
        self,
        user_id: UUID,
        texts: List[str],
        voice_profile_id: Optional[UUID] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> List[VoiceGeneration]:
        """
        Generate multiple audio files in batch.

        Args:
            user_id: User ID
            texts: List of texts to synthesize
            voice_profile_id: Voice profile to use
            options: Generation options

        Returns:
            List of VoiceGeneration records
        """
        generations = []

        for text in texts:
            try:
                generation = await self.generate_audio(
                    user_id=user_id,
                    text=text,
                    voice_profile_id=voice_profile_id,
                    options=options
                )
                generations.append(generation)

            except Exception as e:
                logger.error(f"Batch generation failed for text: {e}")
                # Continue with next item
                continue

        logger.info(
            f"Batch generation complete: {len(generations)}/{len(texts)} successful"
        )

        return generations

    async def get_generation(self, generation_id: UUID) -> Optional[VoiceGeneration]:
        """Get voice generation by ID."""
        result = await self.db.execute(
            select(VoiceGeneration).where(VoiceGeneration.id == generation_id)
        )
        return result.scalar_one_or_none()

    async def get_user_generations(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None
    ) -> List[VoiceGeneration]:
        """
        Get user's voice generation history.

        Args:
            user_id: User ID
            limit: Max results
            offset: Pagination offset
            status: Filter by status (pending, processing, completed, failed)

        Returns:
            List of voice generations
        """
        query = select(VoiceGeneration).where(VoiceGeneration.user_id == user_id)

        if status:
            query = query.where(VoiceGeneration.status == status)

        query = query.order_by(VoiceGeneration.created_at.desc()).limit(limit).offset(offset)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_profile_generations(
        self,
        profile_id: UUID,
        limit: int = 50
    ) -> List[VoiceGeneration]:
        """Get generations for a specific voice profile."""
        result = await self.db.execute(
            select(VoiceGeneration)
            .where(VoiceGeneration.voice_profile_id == profile_id)
            .order_by(VoiceGeneration.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_as_used(
        self,
        generation_id: UUID,
        used_in_clip_id: Optional[UUID] = None,
        used_in_post_id: Optional[UUID] = None,
        used_in_creative_brief_id: Optional[UUID] = None
    ) -> bool:
        """
        Mark generation as used in content.

        Args:
            generation_id: Generation ID
            used_in_clip_id: Clip ID where audio was used
            used_in_post_id: Post ID where audio was used
            used_in_creative_brief_id: Creative brief ID

        Returns:
            True if updated
        """
        try:
            values = {}
            if used_in_clip_id:
                values["used_in_clip_id"] = used_in_clip_id
            if used_in_post_id:
                values["used_in_post_id"] = used_in_post_id
            if used_in_creative_brief_id:
                values["used_in_creative_brief_id"] = used_in_creative_brief_id

            if values:
                await self.db.execute(
                    update(VoiceGeneration)
                    .where(VoiceGeneration.id == generation_id)
                    .values(**values)
                )
                await self.db.commit()

                logger.success(f"Marked generation {generation_id} as used")
                return True

            return False

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to mark generation as used: {e}")
            return False

    async def get_usage_stats(self, user_id: UUID) -> Dict[str, Any]:
        """
        Get usage statistics for user.

        Returns:
            {
                "total_generations": int,
                "completed_count": int,
                "failed_count": int,
                "total_audio_seconds": float,
                "total_cost_credits": float
            }
        """
        from sqlalchemy import func, case

        result = await self.db.execute(
            select(
                func.count(VoiceGeneration.id).label('total_generations'),
                func.count(
                    case((VoiceGeneration.status == 'completed', 1))
                ).label('completed_count'),
                func.count(
                    case((VoiceGeneration.status == 'failed', 1))
                ).label('failed_count'),
                func.sum(VoiceGeneration.duration_seconds).label('total_audio_seconds'),
                func.sum(VoiceGeneration.cost_credits).label('total_cost_credits')
            )
            .where(VoiceGeneration.user_id == user_id)
        )

        row = result.one()

        return {
            "total_generations": row.total_generations or 0,
            "completed_count": row.completed_count or 0,
            "failed_count": row.failed_count or 0,
            "total_audio_seconds": float(row.total_audio_seconds or 0),
            "total_cost_credits": float(row.total_cost_credits or 0)
        }
