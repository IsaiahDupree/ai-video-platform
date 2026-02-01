"""
B-Roll Detector Service

Detects whether a video is B-roll footage based on:
1. Transcript analysis (no/minimal speech)
2. Visual analysis (scene types, people present but not speaking)
3. Audio characteristics (music, ambient sounds vs speech)

B-roll videos are typically:
- No narration or speech
- Scenic/environmental shots
- Action footage without dialogue
- Cutaway footage for editing

This is useful for:
- Identifying footage suitable for overlays
- Finding supplemental content for video editing
- Categorizing content library by usage type
"""
import os
from typing import Dict, List, Optional, Tuple
from loguru import logger
from dataclasses import dataclass
from enum import Enum


class BRollConfidence(Enum):
    """Confidence level for B-roll classification"""
    DEFINITE = "definite"      # 100% B-roll (no audio/speech at all)
    HIGH = "high"              # Very likely B-roll (minimal/no speech)
    MEDIUM = "medium"          # Possibly B-roll (some ambient speech)
    LOW = "low"                # Unlikely B-roll (contains speech)
    NOT_BROLL = "not_broll"    # Definitely not B-roll (clear narration)


@dataclass
class BRollAnalysis:
    """Result of B-roll detection analysis"""
    is_broll: bool
    confidence: BRollConfidence
    confidence_score: float  # 0.0 to 1.0
    reasons: List[str]
    has_speech: bool
    has_people: bool
    people_speaking: bool
    speech_percentage: float  # % of video with speech
    visual_type: str  # "scenic", "action", "people", "mixed"
    suggested_use: str  # "overlay", "cutaway", "standalone", "primary"


class BRollDetector:
    """
    Detects B-roll footage based on transcript and visual analysis.
    
    B-roll detection criteria:
    - No transcript OR very short transcript (< 10 words)
    - High silence ratio (> 0.7)
    - Low words per minute (< 30)
    - Visual analysis shows scenic/action content
    """
    
    # Thresholds for B-roll detection
    MIN_WORDS_FOR_SPEECH = 10  # Less than this = likely no speech
    MAX_WPM_FOR_BROLL = 30     # Words per minute threshold
    MIN_SILENCE_RATIO = 0.7    # Silence ratio for B-roll
    MIN_TRANSCRIPT_LENGTH = 20  # Characters for meaningful speech
    
    def __init__(self):
        logger.info("[BRollDetector] Initialized")
    
    def detect_broll(
        self,
        transcript: Optional[str],
        visual_analysis: Optional[Dict],
        transcription_data: Optional[Dict] = None,
        duration_sec: Optional[float] = None
    ) -> BRollAnalysis:
        """
        Analyze video data to determine if it's B-roll.
        
        Args:
            transcript: Video transcript text
            visual_analysis: Visual analysis dict with visual_summary, etc.
            transcription_data: Detailed transcription metadata
            duration_sec: Video duration in seconds
            
        Returns:
            BRollAnalysis with classification and reasoning
        """
        reasons = []
        confidence_factors = []
        
        # === TRANSCRIPT ANALYSIS ===
        has_speech = False
        speech_percentage = 0.0
        
        # Check if transcript exists and has content
        transcript_clean = (transcript or "").strip()
        word_count = len(transcript_clean.split()) if transcript_clean else 0
        
        if not transcript_clean or len(transcript_clean) < self.MIN_TRANSCRIPT_LENGTH:
            reasons.append("No meaningful transcript detected")
            confidence_factors.append(0.9)  # High confidence it's B-roll
            has_speech = False
        elif word_count < self.MIN_WORDS_FOR_SPEECH:
            reasons.append(f"Minimal speech detected ({word_count} words)")
            confidence_factors.append(0.8)
            has_speech = True  # Some speech exists
        else:
            has_speech = True
        
        # Check transcription metadata for detailed analysis
        if transcription_data:
            silence_ratio = float(transcription_data.get("silence_ratio", 0) or 0)
            wpm = float(transcription_data.get("words_per_minute", 0) or 0)
            
            if silence_ratio and silence_ratio >= self.MIN_SILENCE_RATIO:
                reasons.append(f"High silence ratio ({silence_ratio:.1%})")
                confidence_factors.append(0.7 + (silence_ratio - self.MIN_SILENCE_RATIO) * 0.5)
            
            if wpm and wpm < self.MAX_WPM_FOR_BROLL and wpm > 0:
                reasons.append(f"Low speech density ({wpm:.0f} wpm)")
                confidence_factors.append(0.6)
            elif wpm == 0 or wpm is None:
                if word_count == 0:
                    reasons.append("No speech detected in audio")
                    confidence_factors.append(0.95)
            
            # Calculate speech percentage
            if duration_sec and float(duration_sec) > 0:
                speech_duration = float(transcription_data.get("duration", 0) or 0)
                speech_percentage = (speech_duration / float(duration_sec)) if speech_duration else 0
                if speech_percentage < 0.1:
                    reasons.append(f"Speech covers only {speech_percentage:.0%} of video")
                    confidence_factors.append(0.8)
        
        # === VISUAL ANALYSIS ===
        has_people = False
        people_speaking = False
        visual_type = "unknown"
        
        if visual_analysis:
            visual_summary = visual_analysis.get("visual_summary", "").lower()
            
            # Check for people in video
            people_keywords = ["person", "people", "man", "woman", "someone", "individual", "face", "speaking", "talking"]
            has_people = any(kw in visual_summary for kw in people_keywords)
            
            # Check for speaking indicators
            speaking_keywords = ["speaking", "talking", "narrating", "presenting", "explaining", "saying"]
            people_speaking = any(kw in visual_summary for kw in speaking_keywords)
            
            # Determine visual type
            scenic_keywords = ["landscape", "nature", "sky", "water", "building", "city", "street", "outdoor", "scenery", "aerial"]
            action_keywords = ["movement", "action", "walking", "running", "driving", "moving", "activity"]
            
            if any(kw in visual_summary for kw in scenic_keywords):
                visual_type = "scenic"
                reasons.append("Scenic/environmental visual content")
                confidence_factors.append(0.5)
            elif any(kw in visual_summary for kw in action_keywords) and not people_speaking:
                visual_type = "action"
                reasons.append("Action footage without dialogue")
                confidence_factors.append(0.4)
            elif has_people and not people_speaking:
                visual_type = "people"
                reasons.append("People present but not speaking")
                confidence_factors.append(0.3)
            elif has_people and people_speaking:
                visual_type = "talking_head"
                reasons.append("People speaking on camera - NOT B-roll")
                confidence_factors.append(-0.8)  # Strong negative indicator
            else:
                visual_type = "mixed"
        
        # === CALCULATE FINAL CONFIDENCE ===
        if not confidence_factors:
            # No data available - assume not B-roll
            confidence_score = 0.0
        else:
            # Average positive factors, apply negative factors
            positive_factors = [f for f in confidence_factors if f > 0]
            negative_factors = [f for f in confidence_factors if f < 0]
            
            if positive_factors:
                confidence_score = sum(positive_factors) / len(positive_factors)
            else:
                confidence_score = 0.0
            
            # Apply negative factors
            for neg in negative_factors:
                confidence_score += neg  # Subtracts since neg is negative
            
            confidence_score = max(0.0, min(1.0, confidence_score))
        
        # Determine confidence level
        if confidence_score >= 0.9:
            confidence = BRollConfidence.DEFINITE
            is_broll = True
        elif confidence_score >= 0.7:
            confidence = BRollConfidence.HIGH
            is_broll = True
        elif confidence_score >= 0.5:
            confidence = BRollConfidence.MEDIUM
            is_broll = True
        elif confidence_score >= 0.3:
            confidence = BRollConfidence.LOW
            is_broll = False
        else:
            confidence = BRollConfidence.NOT_BROLL
            is_broll = False
        
        # Determine suggested use
        if is_broll:
            if visual_type == "scenic":
                suggested_use = "overlay"
            elif visual_type == "action":
                suggested_use = "cutaway"
            else:
                suggested_use = "supplemental"
        else:
            if people_speaking:
                suggested_use = "primary"
            else:
                suggested_use = "standalone"
        
        result = BRollAnalysis(
            is_broll=is_broll,
            confidence=confidence,
            confidence_score=confidence_score,
            reasons=reasons,
            has_speech=has_speech,
            has_people=has_people,
            people_speaking=people_speaking,
            speech_percentage=speech_percentage,
            visual_type=visual_type,
            suggested_use=suggested_use
        )
        
        logger.info(f"[BRollDetector] Result: is_broll={is_broll}, confidence={confidence.value}, score={confidence_score:.2f}")
        
        return result
    
    def detect_from_db_record(self, video_analysis: Dict) -> BRollAnalysis:
        """
        Detect B-roll from a video_analysis database record.
        
        Args:
            video_analysis: Dict with transcript, visual_analysis, etc.
            
        Returns:
            BRollAnalysis result
        """
        return self.detect_broll(
            transcript=video_analysis.get("transcript"),
            visual_analysis=video_analysis.get("visual_analysis"),
            transcription_data=video_analysis.get("transcription_data"),
            duration_sec=video_analysis.get("transcription_duration_sec")
        )
    
    def batch_detect(self, video_analyses: List[Dict]) -> List[Tuple[str, BRollAnalysis]]:
        """
        Detect B-roll for multiple videos.
        
        Args:
            video_analyses: List of video analysis dicts with 'video_id' key
            
        Returns:
            List of (video_id, BRollAnalysis) tuples
        """
        results = []
        for va in video_analyses:
            video_id = va.get("video_id") or va.get("id")
            if video_id:
                analysis = self.detect_from_db_record(va)
                results.append((str(video_id), analysis))
        
        logger.info(f"[BRollDetector] Batch processed {len(results)} videos, {sum(1 for _, a in results if a.is_broll)} are B-roll")
        return results
