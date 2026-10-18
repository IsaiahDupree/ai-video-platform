"""
Character Generator Service (CHAR-001)
======================================
Generate AI characters via image models with consistent prompts.

Features:
- Generate characters using OpenAI DALL-E 3
- Maintain consistent visual style across variants
- Store character metadata and image references
- Support multiple character styles (mascot, realistic, cartoon, etc.)

Usage:
    from services.character_generator import CharacterGenerator

    generator = CharacterGenerator()

    # Generate a character
    character = await generator.generate_character(
        name="Alex the AI Assistant",
        description="Friendly robot character with blue accents",
        style="cartoon",
        workspace_id=workspace_id
    )

    # Generate variants with different expressions
    variants = await generator.generate_character_variants(
        character_id=character.id,
        expressions=["happy", "surprised", "thinking"]
    )
"""

import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional, Literal
from uuid import UUID, uuid4

from loguru import logger
from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database.connection import async_session_maker
from database.models import CharacterAsset, CharacterVariant

# Character style presets with prompt modifiers
CHARACTER_STYLES = {
    "cartoon": "cartoon style, bold outlines, vibrant colors, simple shapes",
    "realistic": "photorealistic, detailed textures, natural lighting",
    "mascot": "cute mascot design, friendly appearance, brand character",
    "anime": "anime art style, expressive features, dynamic poses",
    "3d_render": "3D rendered character, Pixar-style, smooth surfaces",
    "pixel_art": "pixel art style, retro gaming aesthetic, 16-bit",
    "minimalist": "minimalist design, geometric shapes, clean lines",
    "hand_drawn": "hand-drawn illustration, sketch-like, artistic"
}

# Expression variants
EXPRESSIONS = {
    "neutral": "neutral expression, calm demeanor",
    "happy": "happy expression, big smile, joyful",
    "excited": "excited expression, eyes wide, enthusiastic",
    "surprised": "surprised expression, raised eyebrows, amazed",
    "thinking": "thoughtful expression, hand on chin, pondering",
    "sad": "sad expression, downcast eyes, melancholic",
    "angry": "angry expression, furrowed brows, upset",
    "confused": "confused expression, tilted head, puzzled",
    "laughing": "laughing expression, eyes closed, amused",
    "serious": "serious expression, focused, professional"
}

CharacterStyle = Literal[
    "cartoon", "realistic", "mascot", "anime",
    "3d_render", "pixel_art", "minimalist", "hand_drawn"
]

ExpressionType = Literal[
    "neutral", "happy", "excited", "surprised", "thinking",
    "sad", "angry", "confused", "laughing", "serious"
]


class CharacterGenerator:
    """
    Character Generator Service

    Generates AI characters using DALL-E 3 with consistent visual styles.
    """

    def __init__(self):
        """Initialize character generator"""
        self.settings = get_settings()
        self.client = AsyncOpenAI(api_key=self.settings.openai_api_key)
        self.session_maker = async_session_maker

        # Output directory for generated images
        self.output_dir = Path(self.settings.media_storage_path) / "characters"
        self.output_dir.mkdir(parents=True, exist_ok=True)

    async def generate_character(
        self,
        workspace_id: UUID,
        name: str,
        description: str,
        style: CharacterStyle = "cartoon",
        base_expression: ExpressionType = "neutral",
        size: Literal["1024x1024", "1792x1024", "1024x1792"] = "1024x1024",
        quality: Literal["standard", "hd"] = "hd",
        metadata: Optional[Dict[str, Any]] = None
    ) -> CharacterAsset:
        """
        Generate a new AI character

        Args:
            workspace_id: Workspace ID
            name: Character name
            description: Character description (appearance, traits)
            style: Visual style preset
            base_expression: Default expression
            size: Image dimensions
            quality: Image quality (standard or hd)
            metadata: Additional metadata

        Returns:
            CharacterAsset with generated image

        Raises:
            ValueError: If parameters are invalid
            RuntimeError: If image generation fails
        """
        logger.info(f"🎨 Generating character: {name} (style: {style})")

        # Build DALL-E prompt
        prompt = self._build_character_prompt(
            description=description,
            style=style,
            expression=base_expression
        )

        logger.debug(f"Character prompt: {prompt}")

        try:
            # Generate image via DALL-E 3
            response = await self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=size,
                quality=quality,
                n=1
            )

            image_url = response.data[0].url
            revised_prompt = response.data[0].revised_prompt

            logger.debug(f"DALL-E revised prompt: {revised_prompt}")

            # Download image
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as resp:
                    if resp.status != 200:
                        raise RuntimeError(f"Failed to download image: HTTP {resp.status}")

                    image_data = await resp.read()

            # Save to disk
            character_id = uuid4()
            filename = f"{character_id}_base.png"
            file_path = self.output_dir / filename

            with open(file_path, 'wb') as f:
                f.write(image_data)

            logger.info(f"✓ Character image saved: {file_path}")

            # Calculate checksum
            checksum = hashlib.sha256(image_data).hexdigest()

            # Save to database
            async with self.session_maker() as db_session:
                character = CharacterAsset(
                    id=character_id,
                    workspace_id=workspace_id,
                    name=name,
                    description=description,
                    style=style,
                    base_expression=base_expression,
                    file_path=str(file_path),
                    file_size_bytes=len(image_data),
                    image_url=image_url,
                    revised_prompt=revised_prompt,
                    original_prompt=prompt,
                    checksum=checksum,
                    generation_params={
                        "model": "dall-e-3",
                        "size": size,
                        "quality": quality,
                        "style": style,
                        "expression": base_expression
                    },
                    metadata=metadata or {},
                    created_at=datetime.now(timezone.utc)
                )

                db_session.add(character)
                await db_session.commit()
                await db_session.refresh(character)

            logger.success(f"✓ Character created: {character.id} - {name}")

            return character

        except Exception as e:
            logger.error(f"Failed to generate character: {e}")
            raise RuntimeError(f"Character generation failed: {e}") from e

    async def generate_character_variants(
        self,
        character_id: UUID,
        expressions: List[ExpressionType],
        size: Literal["1024x1024", "1792x1024", "1024x1792"] = "1024x1024",
        quality: Literal["standard", "hd"] = "hd"
    ) -> List[CharacterVariant]:
        """
        Generate expression variants for an existing character

        Args:
            character_id: Base character ID
            expressions: List of expressions to generate
            size: Image dimensions
            quality: Image quality

        Returns:
            List of CharacterVariant objects

        Raises:
            ValueError: If character not found
            RuntimeError: If generation fails
        """
        logger.info(f"🎭 Generating {len(expressions)} variants for character {character_id}")

        # Load base character
        async with self.session_maker() as session:
            character = await session.get(CharacterAsset, character_id)
            if not character:
                raise ValueError(f"Character not found: {character_id}")

        variants = []

        for expression in expressions:
            logger.info(f"Generating variant: {expression}")

            # Build variant prompt based on base character
            prompt = self._build_variant_prompt(
                base_description=character.description,
                style=character.style,
                expression=expression,
                base_prompt=character.revised_prompt or character.original_prompt
            )

            try:
                # Generate variant image
                response = await self.client.images.generate(
                    model="dall-e-3",
                    prompt=prompt,
                    size=size,
                    quality=quality,
                    n=1
                )

                image_url = response.data[0].url
                revised_prompt = response.data[0].revised_prompt

                # Download image
                import aiohttp
                async with aiohttp.ClientSession() as session:
                    async with session.get(image_url) as resp:
                        if resp.status != 200:
                            logger.warning(f"Failed to download variant image: HTTP {resp.status}")
                            continue

                        image_data = await resp.read()

                # Save to disk
                variant_id = uuid4()
                filename = f"{character_id}_{expression}.png"
                file_path = self.output_dir / filename

                with open(file_path, 'wb') as f:
                    f.write(image_data)

                # Save variant to database
                async with self.session_maker() as db_session:
                    variant = CharacterVariant(
                        id=variant_id,
                        character_id=character_id,
                        expression=expression,
                        file_path=str(file_path),
                        file_size_bytes=len(image_data),
                        image_url=image_url,
                        prompt=prompt,
                        revised_prompt=revised_prompt,
                        generation_params={
                            "model": "dall-e-3",
                            "size": size,
                            "quality": quality,
                            "expression": expression
                        },
                        created_at=datetime.now(timezone.utc)
                    )

                    db_session.add(variant)
                    await db_session.commit()
                    await db_session.refresh(variant)

                variants.append(variant)
                logger.success(f"✓ Variant created: {expression}")

            except Exception as e:
                logger.error(f"Failed to generate variant '{expression}': {e}")
                continue

        logger.success(f"✓ Generated {len(variants)}/{len(expressions)} variants")
        return variants

    async def get_character(self, character_id: UUID) -> Optional[CharacterAsset]:
        """Get character by ID"""
        async with self.session_maker() as session:
            return await session.get(CharacterAsset, character_id)

    async def list_characters(
        self,
        workspace_id: UUID,
        style: Optional[CharacterStyle] = None,
        limit: int = 50
    ) -> List[CharacterAsset]:
        """
        List characters for a workspace

        Args:
            workspace_id: Workspace ID
            style: Filter by style (optional)
            limit: Max characters to return

        Returns:
            List of CharacterAsset objects
        """
        async with self.session_maker() as session:
            query = select(CharacterAsset).where(
                CharacterAsset.workspace_id == workspace_id
            )

            if style:
                query = query.where(CharacterAsset.style == style)

            query = query.order_by(CharacterAsset.created_at.desc()).limit(limit)

            result = await session.execute(query)
            return list(result.scalars().all())

    async def get_character_variants(
        self,
        character_id: UUID
    ) -> List[CharacterVariant]:
        """Get all variants for a character"""
        async with self.session_maker() as session:
            query = select(CharacterVariant).where(
                CharacterVariant.character_id == character_id
            ).order_by(CharacterVariant.created_at)

            result = await session.execute(query)
            return list(result.scalars().all())

    def _build_character_prompt(
        self,
        description: str,
        style: CharacterStyle,
        expression: ExpressionType
    ) -> str:
        """Build DALL-E prompt for character generation"""
        style_modifier = CHARACTER_STYLES.get(style, CHARACTER_STYLES["cartoon"])
        expression_modifier = EXPRESSIONS.get(expression, EXPRESSIONS["neutral"])

        # Construct prompt with transparent background hint
        prompt = (
            f"A character illustration with transparent or white background. "
            f"{description}. "
            f"{expression_modifier}. "
            f"{style_modifier}. "
            f"Full body or upper body view, centered composition, clear details. "
            f"Suitable for use as a video overlay character."
        )

        return prompt

    def _build_variant_prompt(
        self,
        base_description: str,
        style: CharacterStyle,
        expression: ExpressionType,
        base_prompt: str
    ) -> str:
        """Build prompt for character variant maintaining consistency"""
        style_modifier = CHARACTER_STYLES.get(style, CHARACTER_STYLES["cartoon"])
        expression_modifier = EXPRESSIONS.get(expression, EXPRESSIONS["neutral"])

        # Try to maintain consistency by referencing the base prompt
        prompt = (
            f"A character illustration with transparent or white background. "
            f"Same character as: {base_description}. "
            f"Maintain the same visual style and appearance. "
            f"{expression_modifier}. "
            f"{style_modifier}. "
            f"Full body or upper body view, centered composition, clear details."
        )

        return prompt


# Singleton instance
_character_generator: Optional[CharacterGenerator] = None


def get_character_generator() -> CharacterGenerator:
    """Get singleton character generator instance"""
    global _character_generator
    if _character_generator is None:
        _character_generator = CharacterGenerator()
    return _character_generator
