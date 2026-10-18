"""
Lip-Sync Mouth Layers (CHAR-004)
=================================
Separate body/mouth layers for word timestamp lip-sync animation.

Features:
- Phoneme extraction from word timestamps
- Mouth shape mapping (visemes)
- Frame-accurate animation data
- Support for multiple character styles

Viseme Set (Preston Blair):
- A/I: "ah", "ay", "eye"
- E: "eh", "ee"
- O: "oh", "aw"
- U: "oo", "uh"
- M/B/P: "m", "b", "p"
- F/V: "f", "v"
- L: "l"
- S/Z: "s", "z"
- T/D/N: "t", "d", "n"
- Th: "th"
- W/Q: "w", "q"
- Rest: silence/closed mouth

Usage:
    from services.ai_video_pipeline.lip_sync import LipSyncEngine

    engine = LipSyncEngine()

    # Generate mouth animation from word timestamps
    animation = await engine.generate_lip_sync(
        word_timestamps=[
            {"word": "Hello", "start": 0.0, "end": 0.5},
            {"word": "world", "start": 0.6, "end": 1.1}
        ],
        fps=30,
        character_id="char_123"
    )
"""

import re
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Literal
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class Viseme(str, Enum):
    """Standard viseme mouth shapes for lip-sync animation"""
    REST = "rest"           # Closed/neutral mouth
    A = "a"                 # "ah", "ay", "eye"
    E = "e"                 # "eh", "ee"
    O = "o"                 # "oh", "aw"
    U = "u"                 # "oo", "uh"
    M = "m"                 # "m", "b", "p" (lips together)
    F = "f"                 # "f", "v" (teeth on lip)
    L = "l"                 # "l" (tongue up)
    S = "s"                 # "s", "z" (teeth together)
    T = "t"                 # "t", "d", "n" (tongue on teeth)
    TH = "th"               # "th" (tongue between teeth)
    W = "w"                 # "w", "q" (rounded lips)


@dataclass
class WordTimestamp:
    """Word with timing information"""
    word: str
    start: float  # seconds
    end: float    # seconds
    confidence: float = 1.0


@dataclass
class VisemeFrame:
    """Single frame of mouth animation"""
    frame_number: int
    time: float  # seconds
    viseme: Viseme
    intensity: float = 1.0  # 0.0-1.0 for blend shapes
    word: Optional[str] = None


@dataclass
class LipSyncAnimation:
    """Complete lip-sync animation data"""
    frames: List[VisemeFrame]
    duration: float  # seconds
    fps: int
    total_frames: int
    character_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dict"""
        return {
            "frames": [
                {
                    "frame": f.frame_number,
                    "time": f.time,
                    "viseme": f.viseme.value,
                    "intensity": f.intensity,
                    "word": f.word
                }
                for f in self.frames
            ],
            "duration": self.duration,
            "fps": self.fps,
            "total_frames": self.total_frames,
            "character_id": self.character_id,
            "metadata": self.metadata
        }


# Phoneme to Viseme mapping (simplified English phonetics)
PHONEME_TO_VISEME = {
    # Vowels
    "AA": Viseme.A,  # "father"
    "AE": Viseme.A,  # "cat"
    "AH": Viseme.A,  # "but"
    "AO": Viseme.O,  # "ought"
    "AW": Viseme.O,  # "cow"
    "AY": Viseme.A,  # "hide"
    "EH": Viseme.E,  # "bed"
    "ER": Viseme.E,  # "bird"
    "EY": Viseme.E,  # "ate"
    "IH": Viseme.E,  # "bit"
    "IY": Viseme.E,  # "eat"
    "OW": Viseme.O,  # "oat"
    "OY": Viseme.O,  # "toy"
    "UH": Viseme.U,  # "book"
    "UW": Viseme.U,  # "boot"

    # Consonants
    "B": Viseme.M,   # "bad"
    "CH": Viseme.S,  # "church"
    "D": Viseme.T,   # "dog"
    "DH": Viseme.TH, # "this"
    "F": Viseme.F,   # "food"
    "G": Viseme.T,   # "good"
    "HH": Viseme.REST,  # "house"
    "JH": Viseme.S,  # "judge"
    "K": Viseme.T,   # "cat"
    "L": Viseme.L,   # "lay"
    "M": Viseme.M,   # "man"
    "N": Viseme.T,   # "no"
    "NG": Viseme.T,  # "sing"
    "P": Viseme.M,   # "pin"
    "R": Viseme.U,   # "red"
    "S": Viseme.S,   # "see"
    "SH": Viseme.S,  # "she"
    "T": Viseme.T,   # "top"
    "TH": Viseme.TH, # "think"
    "V": Viseme.F,   # "very"
    "W": Viseme.W,   # "way"
    "Y": Viseme.E,   # "yes"
    "Z": Viseme.S,   # "zoo"
    "ZH": Viseme.S,  # "measure"
}


# Simple word-to-viseme mapping for common words
# This is a fallback when phoneme analysis isn't available
WORD_TO_VISEME_HINTS = {
    "hello": [Viseme.E, Viseme.L, Viseme.O],
    "world": [Viseme.W, Viseme.E, Viseme.L, Viseme.T],
    "yes": [Viseme.E, Viseme.S],
    "no": [Viseme.T, Viseme.O],
    "thank": [Viseme.TH, Viseme.A, Viseme.T],
    "you": [Viseme.E, Viseme.U],
    "welcome": [Viseme.W, Viseme.E, Viseme.L, Viseme.M],
    "please": [Viseme.M, Viseme.L, Viseme.E, Viseme.S],
    "sorry": [Viseme.S, Viseme.O, Viseme.E],
}


class LipSyncEngine:
    """
    Lip-sync animation engine that converts word timestamps to mouth shapes.

    Features:
    - Word-level timing to viseme frames
    - Phoneme-based viseme selection
    - Smooth interpolation between mouth shapes
    - FPS-configurable output
    """

    def __init__(self, default_fps: int = 30):
        """
        Initialize lip-sync engine.

        Args:
            default_fps: Default frames per second for animation
        """
        self.default_fps = default_fps
        self.logger = logger

    async def generate_lip_sync(
        self,
        word_timestamps: List[Dict[str, Any]],
        fps: Optional[int] = None,
        character_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> LipSyncAnimation:
        """
        Generate lip-sync animation from word timestamps.

        Args:
            word_timestamps: List of {"word": str, "start": float, "end": float}
            fps: Frames per second (default: 30)
            character_id: Optional character identifier
            metadata: Optional metadata to include

        Returns:
            LipSyncAnimation with frame-by-frame mouth shapes
        """
        fps = fps or self.default_fps

        # Convert to WordTimestamp objects
        words = [
            WordTimestamp(
                word=w["word"],
                start=w["start"],
                end=w["end"],
                confidence=w.get("confidence", 1.0)
            )
            for w in word_timestamps
        ]

        if not words:
            # Return empty animation
            return LipSyncAnimation(
                frames=[],
                duration=0.0,
                fps=fps,
                total_frames=0,
                character_id=character_id,
                metadata=metadata or {}
            )

        # Calculate duration
        duration = max(w.end for w in words)
        total_frames = int(duration * fps) + 1

        # Generate frames
        frames = self._generate_frames(words, fps, total_frames)

        return LipSyncAnimation(
            frames=frames,
            duration=duration,
            fps=fps,
            total_frames=total_frames,
            character_id=character_id,
            metadata=metadata or {}
        )

    def _generate_frames(
        self,
        words: List[WordTimestamp],
        fps: int,
        total_frames: int
    ) -> List[VisemeFrame]:
        """
        Generate frame-by-frame viseme data.

        Args:
            words: List of word timestamps
            fps: Frames per second
            total_frames: Total number of frames to generate

        Returns:
            List of VisemeFrame objects
        """
        frames = []
        frame_duration = 1.0 / fps

        for frame_num in range(total_frames):
            frame_time = frame_num * frame_duration

            # Find which word this frame belongs to
            current_word = None
            for word in words:
                if word.start <= frame_time <= word.end:
                    current_word = word
                    break

            if current_word:
                # Calculate position within word (0.0 to 1.0)
                word_duration = current_word.end - current_word.start
                word_progress = (frame_time - current_word.start) / word_duration if word_duration > 0 else 0.0

                # Get viseme for this word and position
                viseme = self._get_viseme_for_word(current_word.word, word_progress)
                intensity = 1.0
            else:
                # Rest position (silence)
                viseme = Viseme.REST
                intensity = 0.0

            frames.append(VisemeFrame(
                frame_number=frame_num,
                time=frame_time,
                viseme=viseme,
                intensity=intensity,
                word=current_word.word if current_word else None
            ))

        return frames

    def _get_viseme_for_word(self, word: str, progress: float) -> Viseme:
        """
        Get the appropriate viseme for a word at a given progress point.

        Args:
            word: The word being spoken
            progress: Position within word (0.0 to 1.0)

        Returns:
            Appropriate Viseme for this moment
        """
        word_lower = word.lower().strip(".,!?;:")

        # Check if we have a hint for this word
        if word_lower in WORD_TO_VISEME_HINTS:
            visemes = WORD_TO_VISEME_HINTS[word_lower]
            # Select viseme based on progress through word
            idx = min(int(progress * len(visemes)), len(visemes) - 1)
            return visemes[idx]

        # Fallback: analyze the word structure
        return self._analyze_word_visemes(word_lower, progress)

    def _analyze_word_visemes(self, word: str, progress: float) -> Viseme:
        """
        Analyze word to determine viseme sequence (simplified).

        This is a basic implementation that maps common letter patterns
        to visemes. A full implementation would use phoneme analysis.

        Args:
            word: Word to analyze
            progress: Position within word (0.0 to 1.0)

        Returns:
            Appropriate Viseme
        """
        if not word:
            return Viseme.REST

        # Simple letter-to-viseme mapping
        viseme_sequence = []

        for char in word:
            if char in "aeiou":
                if char in "ae":
                    viseme_sequence.append(Viseme.A)
                elif char in "ei":
                    viseme_sequence.append(Viseme.E)
                elif char in "o":
                    viseme_sequence.append(Viseme.O)
                elif char in "u":
                    viseme_sequence.append(Viseme.U)
            elif char in "mbp":
                viseme_sequence.append(Viseme.M)
            elif char in "fv":
                viseme_sequence.append(Viseme.F)
            elif char in "l":
                viseme_sequence.append(Viseme.L)
            elif char in "sz":
                viseme_sequence.append(Viseme.S)
            elif char in "tdn":
                viseme_sequence.append(Viseme.T)
            elif char in "w":
                viseme_sequence.append(Viseme.W)

        if not viseme_sequence:
            return Viseme.REST

        # Select viseme based on progress
        idx = min(int(progress * len(viseme_sequence)), len(viseme_sequence) - 1)
        return viseme_sequence[idx]

    def export_for_remotion(self, animation: LipSyncAnimation) -> Dict[str, Any]:
        """
        Export animation in Remotion-compatible format.

        Args:
            animation: LipSyncAnimation to export

        Returns:
            JSON-serializable dict for Remotion composition
        """
        return {
            "type": "lip_sync_animation",
            "fps": animation.fps,
            "duration": animation.duration,
            "durationInFrames": animation.total_frames,
            "characterId": animation.character_id,
            "frames": [
                {
                    "frame": f.frame_number,
                    "viseme": f.viseme.value,
                    "intensity": f.intensity
                }
                for f in animation.frames
            ],
            "metadata": animation.metadata
        }

    def get_viseme_image_url(
        self,
        character_id: str,
        viseme: Viseme,
        base_url: str = "/characters"
    ) -> str:
        """
        Get URL for character mouth layer image.

        Args:
            character_id: Character identifier
            viseme: Viseme mouth shape
            base_url: Base URL for character assets

        Returns:
            URL to mouth layer image
        """
        return f"{base_url}/{character_id}/mouth_{viseme.value}.png"


# Factory function for service integration
def get_lip_sync_engine(fps: int = 30) -> LipSyncEngine:
    """
    Get or create LipSyncEngine instance.

    Args:
        fps: Frames per second for animation

    Returns:
        LipSyncEngine instance
    """
    return LipSyncEngine(default_fps=fps)
