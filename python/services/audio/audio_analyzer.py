"""
Audio Analyzer Service
Detects background music, speech, and audio characteristics in video content.
Part of Background Music Detection feature (Phase 1)
"""

import os
import subprocess
import tempfile
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
from loguru import logger
import numpy as np

# Try to import librosa for audio analysis
try:
    import librosa
    import librosa.display
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    logger.warning("librosa not installed - using basic audio analysis")


class AudioAnalysisResult:
    """Result of audio analysis"""
    def __init__(
        self,
        has_music: bool = False,
        has_speech: bool = False,
        audio_type: str = "unknown",
        confidence: float = 0.0,
        music_confidence: float = 0.0,
        speech_ratio: float = 0.0,
        segments: List[Dict] = None,
        music_characteristics: Dict = None,
        copyright_risk: str = "unknown",
        overall_loudness_db: float = None,
        dynamic_range_db: float = None,
        duration_sec: float = 0.0,
        error: str = None
    ):
        self.has_music = has_music
        self.has_speech = has_speech
        self.audio_type = audio_type
        self.confidence = confidence
        self.music_confidence = music_confidence
        self.speech_ratio = speech_ratio
        self.segments = segments or []
        self.music_characteristics = music_characteristics or {}
        self.copyright_risk = copyright_risk
        self.overall_loudness_db = overall_loudness_db
        self.dynamic_range_db = dynamic_range_db
        self.duration_sec = duration_sec
        self.error = error
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "has_music": self.has_music,
            "has_speech": self.has_speech,
            "audio_type": self.audio_type,
            "confidence": self.confidence,
            "music_confidence": self.music_confidence,
            "speech_ratio": self.speech_ratio,
            "segments": self.segments,
            "music_characteristics": self.music_characteristics,
            "copyright_risk": self.copyright_risk,
            "overall_loudness_db": self.overall_loudness_db,
            "dynamic_range_db": self.dynamic_range_db,
            "duration_sec": self.duration_sec,
            "analyzed_at": datetime.utcnow().isoformat(),
            "error": self.error
        }


class AudioAnalyzer:
    """Service for analyzing audio content in videos"""
    
    def __init__(self):
        self.sample_rate = 22050  # Standard for audio analysis
        self.hop_length = 512
        self.n_fft = 2048
        
    async def analyze_video_audio(self, video_path: str) -> AudioAnalysisResult:
        """
        Main entry point: Extract and analyze audio from video file.
        
        Args:
            video_path: Path to video file
            
        Returns:
            AudioAnalysisResult with music detection results
        """
        logger.info(f"[AudioAnalyzer] Starting analysis for: {video_path}")
        
        if not os.path.exists(video_path):
            logger.error(f"[AudioAnalyzer] Video file not found: {video_path}")
            return AudioAnalysisResult(error=f"File not found: {video_path}")
        
        # Extract audio from video
        audio_path = await self._extract_audio(video_path)
        if not audio_path:
            return AudioAnalysisResult(error="Failed to extract audio from video")
        
        try:
            # Analyze the extracted audio
            result = await self._analyze_audio_file(audio_path)
            return result
        finally:
            # Cleanup temp audio file
            if audio_path and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except:
                    pass
    
    async def _extract_audio(self, video_path: str) -> Optional[str]:
        """Extract audio track from video using ffmpeg"""
        try:
            # Create temp file for audio
            temp_dir = tempfile.gettempdir()
            audio_path = os.path.join(temp_dir, f"audio_analysis_{os.getpid()}.wav")
            
            # Use ffmpeg to extract audio as WAV
            cmd = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-vn",  # No video
                "-acodec", "pcm_s16le",  # PCM format
                "-ar", str(self.sample_rate),  # Sample rate
                "-ac", "1",  # Mono
                audio_path
            ]
            
            logger.info(f"[AudioAnalyzer] Extracting audio with ffmpeg...")
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=120
            )
            
            if result.returncode != 0:
                logger.error(f"[AudioAnalyzer] ffmpeg error: {result.stderr}")
                return None
            
            if not os.path.exists(audio_path):
                logger.error("[AudioAnalyzer] Audio extraction failed - no output file")
                return None
                
            logger.info(f"[AudioAnalyzer] Audio extracted to: {audio_path}")
            return audio_path
            
        except subprocess.TimeoutExpired:
            logger.error("[AudioAnalyzer] ffmpeg timed out")
            return None
        except Exception as e:
            logger.error(f"[AudioAnalyzer] Audio extraction failed: {e}")
            return None
    
    async def _analyze_audio_file(self, audio_path: str) -> AudioAnalysisResult:
        """Analyze audio file for music detection"""
        
        if LIBROSA_AVAILABLE:
            return await self._analyze_with_librosa(audio_path)
        else:
            return await self._analyze_basic(audio_path)
    
    async def _analyze_with_librosa(self, audio_path: str) -> AudioAnalysisResult:
        """Advanced audio analysis using librosa"""
        try:
            logger.info("[AudioAnalyzer] Loading audio with librosa...")
            
            # Load audio file
            y, sr = librosa.load(audio_path, sr=self.sample_rate, mono=True)
            duration = librosa.get_duration(y=y, sr=sr)
            
            logger.info(f"[AudioAnalyzer] Audio loaded: {duration:.1f}s at {sr}Hz")
            
            # Basic audio statistics
            rms = librosa.feature.rms(y=y)[0]
            overall_loudness = float(np.mean(rms))
            loudness_db = 20 * np.log10(overall_loudness + 1e-10)
            dynamic_range = float(20 * np.log10((np.max(rms) + 1e-10) / (np.min(rms) + 1e-10)))
            
            # Spectral features for music detection
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
            
            # Zero crossing rate (higher for speech, lower for music)
            zcr = librosa.feature.zero_crossing_rate(y)[0]
            mean_zcr = float(np.mean(zcr))
            
            # Tempo and beat detection
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
            tempo = float(tempo) if not isinstance(tempo, np.ndarray) else float(tempo[0]) if len(tempo) > 0 else 0.0
            beat_strength = len(beats) / duration if duration > 0 else 0
            
            # Harmonic vs percussive separation
            y_harmonic, y_percussive = librosa.effects.hpss(y)
            harmonic_ratio = float(np.sum(np.abs(y_harmonic))) / (float(np.sum(np.abs(y))) + 1e-10)
            
            # Music detection heuristics
            music_indicators = []
            speech_indicators = []
            
            # Strong beat presence indicates music
            if beat_strength > 1.0:
                music_indicators.append(("beat_strength", 0.3))
            
            # Consistent tempo indicates music
            if tempo > 60 and tempo < 200:
                music_indicators.append(("tempo_range", 0.2))
            
            # High harmonic content indicates music
            if harmonic_ratio > 0.5:
                music_indicators.append(("harmonic_ratio", 0.25))
            
            # Low zero crossing rate indicates music
            if mean_zcr < 0.1:
                music_indicators.append(("low_zcr", 0.15))
            
            # Wide spectral bandwidth indicates music
            mean_bandwidth = float(np.mean(spectral_bandwidth))
            if mean_bandwidth > 1500:
                music_indicators.append(("wide_bandwidth", 0.2))
            
            # High ZCR indicates speech
            if mean_zcr > 0.15:
                speech_indicators.append(("high_zcr", 0.3))
            
            # Narrow spectral spread indicates speech
            if mean_bandwidth < 1200:
                speech_indicators.append(("narrow_bandwidth", 0.2))
            
            # Calculate confidence scores
            music_score = sum(weight for _, weight in music_indicators)
            speech_score = sum(weight for _, weight in speech_indicators)
            
            # Normalize
            total_score = music_score + speech_score + 0.1
            music_confidence = min(1.0, music_score / 0.8)  # Max possible ~0.9
            speech_ratio = speech_score / total_score
            
            # Determine audio type
            has_music = music_confidence > 0.4
            has_speech = speech_ratio > 0.3
            
            if has_music and has_speech:
                audio_type = "mixed"
            elif has_music:
                audio_type = "music_only"
            elif has_speech:
                audio_type = "speech_only"
            elif overall_loudness < 0.01:
                audio_type = "silence"
            else:
                audio_type = "ambient"
            
            # Overall confidence
            confidence = max(music_confidence, speech_ratio, 0.5)
            
            # Music characteristics
            music_chars = {}
            if has_music:
                music_chars = {
                    "tempo_bpm": round(tempo, 1),
                    "energy": "high" if overall_loudness > 0.1 else "medium" if overall_loudness > 0.05 else "low",
                    "harmonic_ratio": round(harmonic_ratio, 2),
                    "genre_hints": self._guess_genre(tempo, harmonic_ratio, mean_zcr),
                    "mood": self._guess_mood(tempo, harmonic_ratio, loudness_db),
                    "beat_strength": round(beat_strength, 2)
                }
            
            # Copyright risk assessment
            copyright_risk = "unknown"
            if has_music:
                # Strong beat + high production value = likely copyrighted
                if beat_strength > 2 and harmonic_ratio > 0.6:
                    copyright_risk = "high"
                elif beat_strength > 1 or harmonic_ratio > 0.5:
                    copyright_risk = "medium"
                else:
                    copyright_risk = "low"
            
            logger.info(f"[AudioAnalyzer] Analysis complete: type={audio_type}, music_conf={music_confidence:.2f}")
            
            return AudioAnalysisResult(
                has_music=has_music,
                has_speech=has_speech,
                audio_type=audio_type,
                confidence=round(confidence, 3),
                music_confidence=round(music_confidence, 3),
                speech_ratio=round(speech_ratio, 3),
                music_characteristics=music_chars,
                copyright_risk=copyright_risk,
                overall_loudness_db=round(loudness_db, 1),
                dynamic_range_db=round(dynamic_range, 1),
                duration_sec=round(duration, 2)
            )
            
        except Exception as e:
            logger.error(f"[AudioAnalyzer] Librosa analysis failed: {e}")
            return AudioAnalysisResult(error=str(e))
    
    async def _analyze_basic(self, audio_path: str) -> AudioAnalysisResult:
        """Basic audio analysis without librosa (fallback)"""
        try:
            # Use ffprobe to get basic audio info
            cmd = [
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_streams",
                "-select_streams", "a:0",
                audio_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                info = json.loads(result.stdout)
                streams = info.get("streams", [])
                if streams:
                    stream = streams[0]
                    duration = float(stream.get("duration", 0))
                    
                    # Very basic heuristic - just mark as unknown
                    return AudioAnalysisResult(
                        audio_type="unknown",
                        confidence=0.3,
                        duration_sec=duration,
                        copyright_risk="unknown"
                    )
            
            return AudioAnalysisResult(
                audio_type="unknown",
                confidence=0.0,
                error="Basic analysis - limited capability without librosa"
            )
            
        except Exception as e:
            logger.error(f"[AudioAnalyzer] Basic analysis failed: {e}")
            return AudioAnalysisResult(error=str(e))
    
    def _guess_genre(self, tempo: float, harmonic_ratio: float, zcr: float) -> List[str]:
        """Guess music genre based on audio features"""
        genres = []
        
        if tempo >= 120 and tempo <= 140:
            genres.append("pop")
        if tempo >= 140 and tempo <= 160:
            genres.append("electronic")
        if tempo >= 70 and tempo <= 100:
            genres.append("hip-hop")
        if tempo >= 60 and tempo <= 80 and harmonic_ratio > 0.6:
            genres.append("r&b")
        if tempo >= 100 and tempo <= 130 and harmonic_ratio > 0.7:
            genres.append("rock")
        if harmonic_ratio > 0.8 and zcr < 0.05:
            genres.append("ambient")
        
        return genres[:3] if genres else ["unknown"]
    
    def _guess_mood(self, tempo: float, harmonic_ratio: float, loudness_db: float) -> str:
        """Guess music mood based on audio features"""
        if tempo > 120 and loudness_db > -20:
            return "energetic"
        elif tempo > 100:
            return "upbeat"
        elif tempo < 80 and harmonic_ratio > 0.6:
            return "chill"
        elif loudness_db < -30:
            return "calm"
        else:
            return "neutral"


# Singleton instance
_audio_analyzer: Optional[AudioAnalyzer] = None

def get_audio_analyzer() -> AudioAnalyzer:
    """Get singleton AudioAnalyzer instance"""
    global _audio_analyzer
    if _audio_analyzer is None:
        _audio_analyzer = AudioAnalyzer()
    return _audio_analyzer
