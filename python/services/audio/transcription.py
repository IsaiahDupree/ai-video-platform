"""
Transcription Service using OpenAI Whisper
Generates word-level timestamps for video analysis
"""
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
from openai import OpenAI
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class TranscriptionService:
    """Transcribes audio/video using OpenAI Whisper API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize transcription service
        
        Args:
            api_key: OpenAI API key (defaults to settings.OPENAI_API_KEY)
        """
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        
        if not self.client:
            logger.warning("OpenAI API key not configured - transcription disabled")
    
    def is_enabled(self) -> bool:
        """Check if transcription is enabled"""
        return self.client is not None
    
    def transcribe_video(
        self,
        video_path: str,
        language: Optional[str] = None,
        response_format: str = "verbose_json"
    ) -> Dict[str, Any]:
        """
        Transcribe video with word-level timestamps
        
        Args:
            video_path: Path to video file
            language: ISO language code (e.g., 'en', auto-detect if None)
            response_format: 'verbose_json' for word timestamps
            
        Returns:
            Transcription result with words, segments, and full text
        """
        if not self.is_enabled():
            logger.error("Transcription not enabled - missing API key")
            return {"error": "Transcription service not configured"}
        
        try:
            logger.info(f"Transcribing video: {video_path}")
            
            # Open audio file
            with open(video_path, "rb") as audio_file:
                # Call Whisper API with timestamp granularities
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format=response_format,
                    timestamp_granularities=["word", "segment"],
                    language=language
                )
            
            # Parse response
            if response_format == "verbose_json":
                result = {
                    "text": transcript.text,
                    "language": getattr(transcript, 'language', None),
                    "duration": getattr(transcript, 'duration', None),
                    "words": [],
                    "segments": []
                }
                
                # Extract word-level timestamps
                if hasattr(transcript, 'words') and transcript.words:
                    result["words"] = [
                        {
                            "word": word.word,
                            "start": word.start,
                            "end": word.end
                        }
                        for word in transcript.words
                    ]
                
                # Extract segment-level data
                if hasattr(transcript, 'segments') and transcript.segments:
                    result["segments"] = [
                        {
                            "id": seg.id,
                            "start": seg.start,
                            "end": seg.end,
                            "text": seg.text,
                            "avg_logprob": getattr(seg, 'avg_logprob', None),
                            "no_speech_prob": getattr(seg, 'no_speech_prob', None)
                        }
                        for seg in transcript.segments
                    ]
                
                logger.info(f"Transcription complete: {len(result['words'])} words, {len(result['segments'])} segments")
                return result
            
            else:
                # Simple text response
                return {
                    "text": transcript.text if hasattr(transcript, 'text') else str(transcript),
                    "words": [],
                    "segments": []
                }
        
        except Exception as e:
            logger.error(f"Error transcribing video {video_path}: {e}")
            return {"error": str(e)}
    
    def transcribe_audio_only(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transcribe audio file (same as video but clearer naming)
        
        Args:
            audio_path: Path to audio file
            language: ISO language code
            
        Returns:
            Transcription result
        """
        return self.transcribe_video(audio_path, language)
    
    def extract_audio_from_video(
        self,
        video_path: str,
        output_audio_path: Optional[str] = None
    ) -> Optional[str]:
        """
        Extract audio track from video using FFmpeg
        (Optional optimization: transcribe audio instead of full video)
        
        Args:
            video_path: Path to video file
            output_audio_path: Path for extracted audio (auto-generated if None)
            
        Returns:
            Path to extracted audio file or None if error
        """
        import subprocess
        
        if output_audio_path is None:
            video_stem = Path(video_path).stem
            output_audio_path = f"/tmp/{video_stem}_audio.mp3"
        
        try:
            result = subprocess.run(
                [
                    "ffmpeg",
                    "-i", video_path,
                    "-vn",  # No video
                    "-acodec", "libmp3lame",  # MP3 codec
                    "-q:a", "2",  # High quality
                    "-y",  # Overwrite
                    output_audio_path
                ],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0 and Path(output_audio_path).exists():
                logger.info(f"Extracted audio to {output_audio_path}")
                return output_audio_path
            else:
                logger.error(f"FFmpeg error: {result.stderr}")
                return None
        
        except Exception as e:
            logger.error(f"Error extracting audio: {e}")
            return None
    
    def get_transcript_statistics(
        self,
        transcript_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate statistics from transcript
        
        Args:
            transcript_data: Transcript result from transcribe_video
            
        Returns:
            Statistics dict
        """
        words = transcript_data.get("words", [])
        segments = transcript_data.get("segments", [])
        full_text = transcript_data.get("text", "")
        
        if not words:
            return {"error": "No word data available"}
        
        # Calculate pacing
        total_duration = words[-1]["end"] - words[0]["start"] if words else 0
        words_per_minute = (len(words) / total_duration * 60) if total_duration > 0 else 0
        
        # Calculate pauses
        pauses = []
        for i in range(len(words) - 1):
            gap = words[i + 1]["start"] - words[i]["end"]
            if gap > 0.5:  # Pause threshold: 500ms
                pauses.append({
                    "after_word": words[i]["word"],
                    "duration": gap,
                    "time": words[i]["end"]
                })
        
        # Word count by segment
        segment_word_counts = [
            len(seg["text"].split()) for seg in segments
        ] if segments else []
        
        return {
            "total_words": len(words),
            "total_duration_s": total_duration,
            "words_per_minute": round(words_per_minute, 1),
            "total_segments": len(segments),
            "total_pauses": len(pauses),
            "significant_pauses": [p for p in pauses if p["duration"] > 1.0],
            "avg_segment_length": sum(segment_word_counts) / len(segment_word_counts) if segment_word_counts else 0,
            "character_count": len(full_text)
        }
