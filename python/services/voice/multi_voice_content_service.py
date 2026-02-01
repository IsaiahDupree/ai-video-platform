"""
Multi-Voice Content Service (VC-012)
=====================================
Generate content with multiple voices for dialogue scripts.

Features:
- Multiple voice assignments per script
- Dialogue turn management
- Voice consistency across scenes
- Parallel voice generation

Usage:
    from services.voice.multi_voice_content_service import MultiVoiceContentService

    service = MultiVoiceContentService()

    # Define dialogue script
    script = [
        {"speaker": "host", "text": "Welcome to the show!"},
        {"speaker": "guest", "text": "Thanks for having me!"},
        {"speaker": "host", "text": "Let's get started."}
    ]

    # Map speakers to voice references
    voice_mapping = {
        "host": "voice_ref_host.mp3",
        "guest": "voice_ref_guest.mp3"
    }

    # Generate all dialogue
    result = await service.generate_multi_voice_content(
        script=script,
        voice_mapping=voice_mapping
    )
"""

import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from loguru import logger


@dataclass
class DialogueLine:
    """Single line of dialogue"""
    speaker: str
    text: str
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    audio_url: Optional[str] = None
    duration_seconds: Optional[float] = None


@dataclass
class MultiVoiceResult:
    """Result of multi-voice content generation"""
    dialogue_lines: List[DialogueLine]
    total_duration_seconds: float
    total_processing_time_ms: int
    voice_mapping: Dict[str, str]
    success: bool
    errors: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dict"""
        return {
            "dialogue_lines": [
                {
                    "speaker": line.speaker,
                    "text": line.text,
                    "start_time": line.start_time,
                    "end_time": line.end_time,
                    "audio_url": line.audio_url,
                    "duration_seconds": line.duration_seconds
                }
                for line in self.dialogue_lines
            ],
            "total_duration_seconds": self.total_duration_seconds,
            "total_processing_time_ms": self.total_processing_time_ms,
            "voice_mapping": self.voice_mapping,
            "success": self.success,
            "errors": self.errors
        }


class MultiVoiceContentService:
    """
    Service for generating multi-voice dialogue content.

    Orchestrates voice generation for scripts with multiple speakers.
    """

    def __init__(self, voice_service=None):
        """
        Initialize multi-voice content service.

        Args:
            voice_service: Voice cloning service instance
        """
        from services.voice.modal_voice_service import get_modal_voice_service

        self.voice_service = voice_service or get_modal_voice_service()

    async def generate_multi_voice_content(
        self,
        script: List[Dict[str, str]],
        voice_mapping: Dict[str, str],
        gap_seconds: float = 0.5,
        max_concurrent: int = 5
    ) -> MultiVoiceResult:
        """
        Generate audio for multi-speaker dialogue script.

        Args:
            script: List of dialogue lines with 'speaker' and 'text' keys
            voice_mapping: Maps speaker names to voice reference URLs
            gap_seconds: Silence gap between dialogue lines
            max_concurrent: Max parallel voice generations

        Returns:
            MultiVoiceResult with all generated dialogue

        Example:
            script = [
                {"speaker": "alice", "text": "Hello!"},
                {"speaker": "bob", "text": "Hi there!"}
            ]

            voice_mapping = {
                "alice": "alice_voice.mp3",
                "bob": "bob_voice.mp3"
            }
        """
        import time

        start_time = time.time()
        errors = []

        # Validate voice mapping
        speakers = set(line.get("speaker") for line in script)
        missing_voices = speakers - set(voice_mapping.keys())
        if missing_voices:
            error_msg = f"Missing voice mappings for speakers: {missing_voices}"
            logger.error(error_msg)
            return MultiVoiceResult(
                dialogue_lines=[],
                total_duration_seconds=0.0,
                total_processing_time_ms=0,
                voice_mapping=voice_mapping,
                success=False,
                errors=[error_msg]
            )

        # Generate all dialogue lines
        dialogue_lines = []
        current_time = 0.0

        # Process in batches for efficiency
        for i in range(0, len(script), max_concurrent):
            batch = script[i:i + max_concurrent]

            # Create generation tasks
            tasks = []
            for line_data in batch:
                speaker = line_data["speaker"]
                text = line_data["text"]
                voice_ref = voice_mapping[speaker]

                tasks.append(
                    self._generate_line(
                        speaker=speaker,
                        text=text,
                        voice_reference_url=voice_ref
                    )
                )

            # Execute batch
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results
            for line_data, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    error_msg = f"Failed to generate line for {line_data['speaker']}: {result}"
                    logger.error(error_msg)
                    errors.append(error_msg)
                    continue

                # Create dialogue line with timing
                duration = result.get("duration_seconds", 2.0)
                end_time = current_time + duration

                dialogue_line = DialogueLine(
                    speaker=line_data["speaker"],
                    text=line_data["text"],
                    start_time=current_time,
                    end_time=end_time,
                    audio_url=result.get("audio_url"),
                    duration_seconds=duration
                )

                dialogue_lines.append(dialogue_line)

                # Advance timeline with gap
                current_time = end_time + gap_seconds

        # Calculate total metrics
        total_duration = current_time - gap_seconds if dialogue_lines else 0.0
        processing_time_ms = int((time.time() - start_time) * 1000)

        return MultiVoiceResult(
            dialogue_lines=dialogue_lines,
            total_duration_seconds=total_duration,
            total_processing_time_ms=processing_time_ms,
            voice_mapping=voice_mapping,
            success=len(errors) == 0,
            errors=errors
        )

    async def _generate_line(
        self,
        speaker: str,
        text: str,
        voice_reference_url: str
    ) -> Dict[str, Any]:
        """
        Generate audio for a single dialogue line.

        Args:
            speaker: Speaker name
            text: Dialogue text
            voice_reference_url: Voice reference URL

        Returns:
            Voice generation result
        """
        try:
            result = await self.voice_service.clone_voice(
                text=text,
                voice_reference_url=voice_reference_url
            )
            return result
        except Exception as e:
            logger.error(f"Voice generation failed for {speaker}: {e}")
            raise

    def create_dialogue_script(
        self,
        lines: List[str],
        speakers: List[str]
    ) -> List[Dict[str, str]]:
        """
        Helper to create dialogue script from parallel lists.

        Args:
            lines: List of dialogue lines
            speakers: List of speaker names (parallel to lines)

        Returns:
            Dialogue script in standard format

        Example:
            script = service.create_dialogue_script(
                lines=["Hello!", "Hi there!"],
                speakers=["alice", "bob"]
            )
        """
        if len(lines) != len(speakers):
            raise ValueError("lines and speakers must have same length")

        return [
            {"speaker": speaker, "text": text}
            for speaker, text in zip(speakers, lines)
        ]

    def validate_voice_mapping(
        self,
        script: List[Dict[str, str]],
        voice_mapping: Dict[str, str]
    ) -> tuple[bool, List[str]]:
        """
        Validate that all speakers have voice mappings.

        Args:
            script: Dialogue script
            voice_mapping: Speaker to voice URL mapping

        Returns:
            (is_valid, missing_speakers)
        """
        speakers = set(line.get("speaker") for line in script)
        missing = speakers - set(voice_mapping.keys())
        return len(missing) == 0, list(missing)


# Singleton instance
_multi_voice_service: Optional[MultiVoiceContentService] = None


def get_multi_voice_content_service() -> MultiVoiceContentService:
    """Get or create multi-voice content service singleton."""
    global _multi_voice_service
    if _multi_voice_service is None:
        _multi_voice_service = MultiVoiceContentService()
    return _multi_voice_service
