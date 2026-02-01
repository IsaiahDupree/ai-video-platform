"""
Voice Cloning Quality Assessment Service

Assesses audio quality of speech recordings for suitability as voice cloning training data.

Key Metrics:
- Signal-to-Noise Ratio (SNR)
- Background noise levels
- Speech clarity and consistency
- Frequency response (voice range)
- Audio level consistency
- Silence detection
- Distortion detection
- Transcript alignment
- Duration requirements
"""

import subprocess
import json
import re
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from loguru import logger
import numpy as np


@dataclass
class VoiceQualityMetrics:
    """Voice cloning quality metrics"""
    # Overall scores (0.0 to 1.0)
    overall_score: float = 0.0
    suitability_for_cloning: str = "poor"  # poor, fair, good, excellent
    
    # Signal Quality
    snr_db: Optional[float] = None  # Signal-to-noise ratio in dB
    background_noise_level_db: Optional[float] = None
    speech_clarity_score: float = 0.0  # 0.0 to 1.0
    
    # Audio Characteristics
    mean_volume_db: Optional[float] = None
    volume_consistency: float = 0.0  # 0.0 to 1.0 (higher = more consistent)
    dynamic_range_db: Optional[float] = None
    
    # Frequency Analysis
    fundamental_frequency_hz: Optional[float] = None  # Average F0
    frequency_response_score: float = 0.0  # 0.0 to 1.0
    voice_range_covered: bool = False  # 85-255 Hz fundamental, harmonics up to 8kHz
    
    # Speech Quality
    silence_percentage: float = 0.0  # Percentage of audio that is silence
    speech_percentage: float = 0.0  # Percentage of audio with speech
    pause_count: int = 0
    avg_pause_duration_s: float = 0.0
    
    # Distortion & Artifacts
    has_distortion: bool = False
    has_clipping: bool = False
    distortion_score: float = 1.0  # 1.0 = no distortion, 0.0 = severe distortion
    
    # Duration & Transcript
    duration_seconds: float = 0.0
    transcript_length_chars: int = 0
    transcript_length_words: int = 0
    words_per_minute: float = 0.0
    transcript_alignment_score: float = 0.0  # How well transcript matches audio duration
    
    # Recommendations
    recommendations: List[str] = field(default_factory=list)
    issues: List[str] = field(default_factory=list)
    
    # Technical Specs
    sample_rate_hz: Optional[int] = None
    bitrate_kbps: Optional[int] = None
    channels: int = 1  # Mono preferred for voice cloning
    audio_format: Optional[str] = None


class VoiceCloningQualityAssessor:
    """
    Assess audio quality for voice cloning training data.
    
    Evaluates audio recordings against criteria for voice cloning:
    - Clean speech with minimal background noise
    - Consistent audio levels
    - Good frequency response in voice range
    - Minimal distortion and artifacts
    - Adequate duration with transcript alignment
    """
    
    # Voice frequency range (fundamental + harmonics)
    VOICE_FUNDAMENTAL_MIN_HZ = 85  # Lowest male voice
    VOICE_FUNDAMENTAL_MAX_HZ = 255  # Highest female voice
    VOICE_HARMONICS_MAX_HZ = 8000  # Upper limit for voice harmonics
    
    # Quality thresholds
    MIN_SNR_DB = 20.0  # Minimum SNR for good quality
    EXCELLENT_SNR_DB = 35.0  # Excellent SNR threshold
    
    MIN_DURATION_SECONDS = 30.0  # Minimum duration for training
    RECOMMENDED_DURATION_SECONDS = 300.0  # Recommended: 5 minutes
    IDEAL_DURATION_SECONDS = 1800.0  # Ideal: 30 minutes
    
    MIN_WORDS_PER_MINUTE = 100  # Minimum speech rate
    MAX_WORDS_PER_MINUTE = 200  # Maximum speech rate
    
    MAX_SILENCE_PERCENTAGE = 20.0  # Max % silence acceptable
    MAX_BACKGROUND_NOISE_DB = -30.0  # Max background noise level
    
    def __init__(self):
        """Initialize voice cloning quality assessor"""
        logger.info("Voice cloning quality assessor initialized")
    
    def assess_audio_quality(
        self,
        audio_path: Path,
        transcript: Optional[str] = None,
        transcript_segments: Optional[List[Dict]] = None
    ) -> VoiceQualityMetrics:
        """
        Comprehensive audio quality assessment for voice cloning.
        
        Args:
            audio_path: Path to audio file (video or audio)
            transcript: Full transcript text (optional)
            transcript_segments: List of transcript segments with timestamps (optional)
            
        Returns:
            VoiceQualityMetrics with all assessment results
        """
        logger.info(f"Assessing audio quality for voice cloning: {audio_path.name}")
        
        metrics = VoiceQualityMetrics()
        
        try:
            # Extract audio if video file
            audio_file = self._extract_audio_for_analysis(audio_path)
            
            # Get audio metadata
            metadata = self._get_audio_metadata(audio_file)
            metrics.duration_seconds = metadata.get('duration', 0.0)
            metrics.sample_rate_hz = metadata.get('sample_rate')
            metrics.bitrate_kbps = metadata.get('bitrate')
            metrics.channels = metadata.get('channels', 1)
            metrics.audio_format = metadata.get('format')
            
            # Analyze signal quality
            signal_quality = self._analyze_signal_quality(audio_file)
            metrics.snr_db = signal_quality.get('snr_db')
            metrics.background_noise_level_db = signal_quality.get('background_noise_db')
            metrics.speech_clarity_score = signal_quality.get('clarity_score', 0.0)
            
            # Analyze volume levels
            volume_analysis = self._analyze_volume_levels(audio_file)
            metrics.mean_volume_db = volume_analysis.get('mean_volume_db')
            metrics.volume_consistency = volume_analysis.get('consistency', 0.0)
            metrics.dynamic_range_db = volume_analysis.get('dynamic_range_db')
            
            # Analyze frequency response
            frequency_analysis = self._analyze_frequency_response(audio_file)
            metrics.fundamental_frequency_hz = frequency_analysis.get('fundamental_freq_hz')
            metrics.frequency_response_score = frequency_analysis.get('score', 0.0)
            metrics.voice_range_covered = frequency_analysis.get('voice_range_covered', False)
            
            # Detect silence and speech
            silence_analysis = self._analyze_silence_and_speech(audio_file)
            metrics.silence_percentage = silence_analysis.get('silence_percentage', 0.0)
            metrics.speech_percentage = silence_analysis.get('speech_percentage', 0.0)
            metrics.pause_count = silence_analysis.get('pause_count', 0)
            metrics.avg_pause_duration_s = silence_analysis.get('avg_pause_duration', 0.0)
            
            # Detect distortion
            distortion_analysis = self._detect_distortion(audio_file)
            metrics.has_distortion = distortion_analysis.get('has_distortion', False)
            metrics.has_clipping = distortion_analysis.get('has_clipping', False)
            metrics.distortion_score = distortion_analysis.get('score', 1.0)
            
            # Analyze transcript if provided
            if transcript:
                transcript_analysis = self._analyze_transcript_alignment(
                    transcript,
                    transcript_segments,
                    metrics.duration_seconds
                )
                metrics.transcript_length_chars = transcript_analysis.get('char_count', 0)
                metrics.transcript_length_words = transcript_analysis.get('word_count', 0)
                metrics.words_per_minute = transcript_analysis.get('words_per_minute', 0.0)
                metrics.transcript_alignment_score = transcript_analysis.get('alignment_score', 0.0)
            
            # Calculate overall score
            metrics.overall_score = self._calculate_overall_score(metrics)
            metrics.suitability_for_cloning = self._determine_suitability(metrics.overall_score)
            
            # Generate recommendations
            metrics.recommendations = self._generate_recommendations(metrics)
            metrics.issues = self._identify_issues(metrics)
            
            # Cleanup temp file if created
            if audio_file != audio_path and audio_file.exists():
                try:
                    audio_file.unlink()
                except:
                    pass
            
            logger.success(f"✓ Quality assessment complete: {metrics.suitability_for_cloning} ({metrics.overall_score:.2f})")
            
        except Exception as e:
            logger.error(f"Quality assessment failed: {e}", exc_info=True)
            metrics.issues.append(f"Assessment error: {str(e)}")
        
        return metrics
    
    def _extract_audio_for_analysis(self, media_path: Path) -> Path:
        """Extract audio to WAV format for analysis"""
        # If already audio file, return as-is
        audio_extensions = {'.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg'}
        if media_path.suffix.lower() in audio_extensions:
            return media_path
        
        # Extract audio from video
        temp_dir = Path(tempfile.gettempdir())
        audio_file = temp_dir / f"{media_path.stem}_voice_analysis.wav"
        
        logger.info(f"Extracting audio for analysis: {media_path.name}")
        
        cmd = [
            'ffmpeg',
            '-i', str(media_path),
            '-vn',  # No video
            '-acodec', 'pcm_s16le',  # 16-bit PCM
            '-ar', '44100',  # 44.1kHz sample rate
            '-ac', '1',  # Mono
            '-y',  # Overwrite
            str(audio_file)
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode != 0:
                raise RuntimeError(f"Audio extraction failed: {result.stderr}")
            
            return audio_file
            
        except Exception as e:
            logger.error(f"Failed to extract audio: {e}")
            raise
    
    def _get_audio_metadata(self, audio_path: Path) -> Dict:
        """Get audio file metadata using ffprobe"""
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration,bit_rate:stream=sample_rate,channels,codec_name',
            '-of', 'json',
            str(audio_path)
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                format_info = data.get('format', {})
                stream_info = data.get('streams', [{}])[0]
                
                return {
                    'duration': float(format_info.get('duration', 0)),
                    'bitrate': int(format_info.get('bit_rate', 0)) // 1000 if format_info.get('bit_rate') else None,
                    'sample_rate': int(stream_info.get('sample_rate', 0)) if stream_info.get('sample_rate') else None,
                    'channels': int(stream_info.get('channels', 1)),
                    'format': stream_info.get('codec_name', 'unknown')
                }
        except Exception as e:
            logger.warning(f"Failed to get metadata: {e}")
        
        return {}
    
    def _analyze_signal_quality(self, audio_path: Path) -> Dict:
        """Analyze signal-to-noise ratio and background noise"""
        logger.debug("Analyzing signal quality (SNR)")
        
        # Use FFmpeg's astats to analyze signal characteristics
        cmd = [
            'ffmpeg',
            '-i', str(audio_path),
            '-af', 'astats=metadata=1:reset=1,ametadata=print:file=-',
            '-f', 'null',
            '-'
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            rms_levels = []
            peak_levels = []
            
            for line in result.stderr.split('\n'):
                if 'lavfi.astats.Overall.RMS_level' in line:
                    try:
                        rms = float(line.split('=')[1].strip())
                        rms_levels.append(rms)
                    except:
                        pass
                elif 'lavfi.astats.Overall.Peak_level' in line:
                    try:
                        peak = float(line.split('=')[1].strip())
                        peak_levels.append(peak)
                    except:
                        pass
            
            if rms_levels:
                mean_rms = np.mean(rms_levels)
                std_rms = np.std(rms_levels)
                
                # Estimate SNR: RMS of speech vs RMS of background
                # Higher RMS = stronger signal, lower std = more consistent
                # Simple heuristic: mean_rms - std_rms approximates SNR
                estimated_snr = mean_rms - std_rms if std_rms > 0 else mean_rms
                
                # Background noise is estimated from minimum RMS
                background_noise = min(rms_levels) if rms_levels else None
                
                # Clarity score based on SNR and consistency
                clarity_score = min(1.0, max(0.0, (estimated_snr + 20) / 40))  # Normalize to 0-1
                
                return {
                    'snr_db': estimated_snr,
                    'background_noise_db': background_noise,
                    'clarity_score': clarity_score,
                    'rms_mean': mean_rms,
                    'rms_std': std_rms
                }
        except Exception as e:
            logger.warning(f"Signal quality analysis failed: {e}")
        
        return {}
    
    def _analyze_volume_levels(self, audio_path: Path) -> Dict:
        """Analyze volume levels and consistency"""
        logger.debug("Analyzing volume levels")
        
        cmd = [
            'ffmpeg',
            '-i', str(audio_path),
            '-af', 'volumedetect',
            '-f', 'null',
            '-'
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            mean_volume = None
            max_volume = None
            min_volume = None
            
            for line in result.stderr.split('\n'):
                if 'mean_volume:' in line:
                    try:
                        mean_volume = float(line.split('mean_volume:')[1].split('dB')[0].strip())
                    except:
                        pass
                elif 'max_volume:' in line:
                    try:
                        max_volume = float(line.split('max_volume:')[1].split('dB')[0].strip())
                    except:
                        pass
                elif 'min_volume:' in line:
                    try:
                        min_volume = float(line.split('min_volume:')[1].split('dB')[0].strip())
                    except:
                        pass
            
            # Calculate consistency (lower std = more consistent)
            if mean_volume is not None and max_volume is not None and min_volume is not None:
                dynamic_range = max_volume - min_volume
                # Consistency: inverse of dynamic range (normalized)
                # Lower dynamic range = more consistent
                consistency = max(0.0, min(1.0, 1.0 - (dynamic_range / 30.0)))
                
                return {
                    'mean_volume_db': mean_volume,
                    'max_volume_db': max_volume,
                    'min_volume_db': min_volume,
                    'dynamic_range_db': dynamic_range,
                    'consistency': consistency
                }
        except Exception as e:
            logger.warning(f"Volume analysis failed: {e}")
        
        return {}
    
    def _analyze_frequency_response(self, audio_path: Path) -> Dict:
        """Analyze frequency response in voice range"""
        logger.debug("Analyzing frequency response")
        
        # Use FFmpeg's afftfilt to analyze frequency spectrum
        # Focus on voice fundamental range (85-255 Hz) and harmonics (up to 8kHz)
        cmd = [
            'ffmpeg',
            '-i', str(audio_path),
            '-af', f'afftfilt=dc_mode=0:overlap=0.75:win_size=2048,astats=metadata=1:reset=1,ametadata=print:file=-',
            '-f', 'null',
            '-'
        ]
        
        # Alternative: Use a simpler approach with bandpass filters
        # Check energy in voice frequency bands
        try:
            # Measure energy in voice fundamental range
            cmd_fundamental = [
                'ffmpeg',
                '-i', str(audio_path),
                '-af', f'bandpass=f={self.VOICE_FUNDAMENTAL_MIN_HZ}:width_type=h:width={self.VOICE_FUNDAMENTAL_MAX_HZ - self.VOICE_FUNDAMENTAL_MIN_HZ},astats=metadata=1:reset=1,ametadata=print:file=-',
                '-f', 'null',
                '-'
            ]
            
            result = subprocess.run(
                cmd_fundamental,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            # Parse RMS levels in voice range
            voice_energy_levels = []
            for line in result.stderr.split('\n'):
                if 'lavfi.astats.Overall.RMS_level' in line:
                    try:
                        rms = float(line.split('=')[1].strip())
                        voice_energy_levels.append(rms)
                    except:
                        pass
            
            if voice_energy_levels:
                mean_voice_energy = np.mean(voice_energy_levels)
                
                # Check if voice range is well-covered
                # Energy should be significant in voice range
                voice_range_covered = mean_voice_energy > -40.0  # Threshold for voice presence
                
                # Score based on energy level
                frequency_score = min(1.0, max(0.0, (mean_voice_energy + 60) / 40))  # Normalize
                
                # Estimate fundamental frequency (simplified)
                # In practice, this would use pitch detection algorithms
                fundamental_freq = None  # Would need proper pitch detection
                
                return {
                    'fundamental_freq_hz': fundamental_freq,
                    'voice_range_covered': voice_range_covered,
                    'score': frequency_score,
                    'mean_voice_energy_db': mean_voice_energy
                }
        except Exception as e:
            logger.warning(f"Frequency analysis failed: {e}")
        
        return {}
    
    def _analyze_silence_and_speech(self, audio_path: Path) -> Dict:
        """Detect silence periods and calculate speech percentage"""
        logger.debug("Analyzing silence and speech")
        
        cmd = [
            'ffmpeg',
            '-i', str(audio_path),
            '-af', 'silencedetect=noise=-40dB:d=0.5',
            '-f', 'null',
            '-'
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            silences = []
            current_silence = {}
            
            for line in result.stderr.split('\n'):
                if 'silence_start:' in line:
                    try:
                        time = float(line.split('silence_start:')[1].strip())
                        current_silence = {'start': time}
                    except:
                        pass
                elif 'silence_end:' in line and current_silence:
                    try:
                        parts = line.split('silence_end:')[1].strip().split('|')
                        time = float(parts[0].strip())
                        duration = float(parts[1].split('silence_duration:')[1].strip())
                        
                        current_silence['end'] = time
                        current_silence['duration'] = duration
                        silences.append(current_silence)
                        current_silence = {}
                    except:
                        pass
            
            # Get total duration
            duration = self._get_duration(audio_path)
            
            if duration > 0:
                total_silence = sum(s.get('duration', 0) for s in silences)
                silence_percentage = (total_silence / duration) * 100.0
                speech_percentage = 100.0 - silence_percentage
                
                avg_pause = total_silence / len(silences) if silences else 0.0
                
                return {
                    'silence_percentage': silence_percentage,
                    'speech_percentage': speech_percentage,
                    'pause_count': len(silences),
                    'avg_pause_duration': avg_pause,
                    'total_silence_seconds': total_silence
                }
        except Exception as e:
            logger.warning(f"Silence analysis failed: {e}")
        
        return {}
    
    def _detect_distortion(self, audio_path: Path) -> Dict:
        """Detect audio distortion and clipping"""
        logger.debug("Detecting distortion")
        
        # Check for clipping (samples at maximum level)
        cmd = [
            'ffmpeg',
            '-i', str(audio_path),
            '-af', 'astats=metadata=1:reset=1,ametadata=print:file=-',
            '-f', 'null',
            '-'
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            peak_levels = []
            for line in result.stderr.split('\n'):
                if 'lavfi.astats.Overall.Peak_level' in line:
                    try:
                        peak = float(line.split('=')[1].strip())
                        peak_levels.append(peak)
                    except:
                        pass
            
            # Clipping detected if peak is at or near 0 dB
            has_clipping = any(peak >= -0.1 for peak in peak_levels) if peak_levels else False
            
            # Distortion score: lower if clipping detected
            distortion_score = 0.3 if has_clipping else 1.0
            
            # Additional distortion checks could be added here
            # (e.g., harmonic distortion analysis)
            
            return {
                'has_clipping': has_clipping,
                'has_distortion': has_clipping,  # Simplified
                'score': distortion_score,
                'max_peak_db': max(peak_levels) if peak_levels else None
            }
        except Exception as e:
            logger.warning(f"Distortion detection failed: {e}")
        
        return {}
    
    def _analyze_transcript_alignment(
        self,
        transcript: str,
        segments: Optional[List[Dict]],
        duration: float
    ) -> Dict:
        """Analyze transcript and alignment with audio"""
        word_count = len(transcript.split())
        char_count = len(transcript)
        
        # Calculate words per minute
        words_per_minute = (word_count / duration * 60.0) if duration > 0 else 0.0
        
        # Alignment score: check if transcript length matches expected speech duration
        # Typical speech rate: 150 words/minute
        expected_duration = (word_count / 150.0) * 60.0  # seconds
        duration_diff = abs(duration - expected_duration)
        alignment_score = max(0.0, min(1.0, 1.0 - (duration_diff / max(duration, expected_duration))))
        
        return {
            'word_count': word_count,
            'char_count': char_count,
            'words_per_minute': words_per_minute,
            'alignment_score': alignment_score,
            'expected_duration': expected_duration
        }
    
    def _get_duration(self, audio_path: Path) -> float:
        """Get audio duration"""
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'json',
            str(audio_path)
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return float(data['format']['duration'])
        except:
            pass
        
        return 0.0
    
    def _calculate_overall_score(self, metrics: VoiceQualityMetrics) -> float:
        """Calculate overall quality score (0.0 to 1.0)"""
        scores = []
        weights = []
        
        # Signal quality (30%)
        if metrics.snr_db is not None:
            snr_score = min(1.0, max(0.0, (metrics.snr_db - self.MIN_SNR_DB) / (self.EXCELLENT_SNR_DB - self.MIN_SNR_DB)))
            scores.append(snr_score)
            weights.append(0.30)
        
        # Speech clarity (20%)
        scores.append(metrics.speech_clarity_score)
        weights.append(0.20)
        
        # Volume consistency (10%)
        scores.append(metrics.volume_consistency)
        weights.append(0.10)
        
        # Frequency response (15%)
        scores.append(metrics.frequency_response_score)
        weights.append(0.15)
        
        # Distortion (15%)
        scores.append(metrics.distortion_score)
        weights.append(0.15)
        
        # Silence percentage (10%)
        silence_score = max(0.0, 1.0 - (metrics.silence_percentage / self.MAX_SILENCE_PERCENTAGE))
        scores.append(silence_score)
        weights.append(0.10)
        
        # Duration bonus (if long enough)
        duration_score = min(1.0, metrics.duration_seconds / self.RECOMMENDED_DURATION_SECONDS)
        if metrics.duration_seconds >= self.MIN_DURATION_SECONDS:
            scores.append(duration_score)
            weights.append(0.05)
        
        # Normalize weights
        total_weight = sum(weights)
        if total_weight > 0:
            weighted_score = sum(s * w for s, w in zip(scores, weights)) / total_weight
            return min(1.0, max(0.0, weighted_score))
        
        return 0.0
    
    def _determine_suitability(self, score: float) -> str:
        """Determine suitability level from score"""
        if score >= 0.8:
            return "excellent"
        elif score >= 0.65:
            return "good"
        elif score >= 0.5:
            return "fair"
        else:
            return "poor"
    
    def _generate_recommendations(self, metrics: VoiceQualityMetrics) -> List[str]:
        """Generate recommendations for improving quality"""
        recommendations = []
        
        if metrics.snr_db is not None and metrics.snr_db < self.MIN_SNR_DB:
            recommendations.append(f"Increase signal-to-noise ratio (current: {metrics.snr_db:.1f} dB, target: >{self.MIN_SNR_DB} dB)")
        
        if metrics.silence_percentage > self.MAX_SILENCE_PERCENTAGE:
            recommendations.append(f"Reduce silence percentage (current: {metrics.silence_percentage:.1f}%, target: <{self.MAX_SILENCE_PERCENTAGE}%)")
        
        if metrics.volume_consistency < 0.7:
            recommendations.append("Improve volume consistency - use audio normalization")
        
        if metrics.has_clipping:
            recommendations.append("Remove clipping - reduce input gain or use limiter")
        
        if metrics.duration_seconds < self.RECOMMENDED_DURATION_SECONDS:
            recommendations.append(f"Increase duration (current: {metrics.duration_seconds:.1f}s, recommended: >{self.RECOMMENDED_DURATION_SECONDS}s)")
        
        if not metrics.voice_range_covered:
            recommendations.append("Ensure voice frequency range is well-represented")
        
        if metrics.sample_rate_hz and metrics.sample_rate_hz < 22050:
            recommendations.append(f"Increase sample rate (current: {metrics.sample_rate_hz} Hz, recommended: >= 22050 Hz)")
        
        if metrics.channels > 1:
            recommendations.append("Convert to mono channel for voice cloning")
        
        if not recommendations:
            recommendations.append("Audio quality is suitable for voice cloning training")
        
        return recommendations
    
    def _identify_issues(self, metrics: VoiceQualityMetrics) -> List[str]:
        """Identify critical issues"""
        issues = []
        
        if metrics.snr_db is not None and metrics.snr_db < 15.0:
            issues.append(f"Very low signal-to-noise ratio: {metrics.snr_db:.1f} dB")
        
        if metrics.silence_percentage > 40.0:
            issues.append(f"Excessive silence: {metrics.silence_percentage:.1f}%")
        
        if metrics.has_clipping:
            issues.append("Audio clipping detected - will cause distortion in cloned voice")
        
        if metrics.duration_seconds < self.MIN_DURATION_SECONDS:
            issues.append(f"Insufficient duration: {metrics.duration_seconds:.1f}s (minimum: {self.MIN_DURATION_SECONDS}s)")
        
        if metrics.background_noise_level_db and metrics.background_noise_level_db > self.MAX_BACKGROUND_NOISE_DB:
            issues.append(f"High background noise: {metrics.background_noise_level_db:.1f} dB")
        
        return issues


# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python voice_cloning_quality_assessor.py <audio_file> [transcript_file]")
        sys.exit(1)
    
    audio_path = Path(sys.argv[1])
    transcript = None
    
    if len(sys.argv) > 2:
        with open(sys.argv[2], 'r') as f:
            transcript = f.read()
    
    assessor = VoiceCloningQualityAssessor()
    metrics = assessor.assess_audio_quality(audio_path, transcript)
    
    print("\n" + "="*60)
    print("VOICE CLONING QUALITY ASSESSMENT")
    print("="*60)
    print(f"\nOverall Score: {metrics.overall_score:.2f}/1.0")
    print(f"Suitability: {metrics.suitability_for_cloning.upper()}")
    
    print(f"\nSignal Quality:")
    print(f"  SNR: {metrics.snr_db:.1f} dB" if metrics.snr_db else "  SNR: N/A")
    print(f"  Background Noise: {metrics.background_noise_level_db:.1f} dB" if metrics.background_noise_level_db else "  Background Noise: N/A")
    print(f"  Clarity Score: {metrics.speech_clarity_score:.2f}")
    
    print(f"\nAudio Characteristics:")
    print(f"  Duration: {metrics.duration_seconds:.1f}s")
    print(f"  Sample Rate: {metrics.sample_rate_hz} Hz" if metrics.sample_rate_hz else "  Sample Rate: N/A")
    print(f"  Channels: {metrics.channels}")
    print(f"  Volume Consistency: {metrics.volume_consistency:.2f}")
    
    print(f"\nSpeech Analysis:")
    print(f"  Speech: {metrics.speech_percentage:.1f}%")
    print(f"  Silence: {metrics.silence_percentage:.1f}%")
    print(f"  Pauses: {metrics.pause_count}")
    
    if transcript:
        print(f"\nTranscript:")
        print(f"  Words: {metrics.transcript_length_words}")
        print(f"  Words/Minute: {metrics.words_per_minute:.1f}")
        print(f"  Alignment Score: {metrics.transcript_alignment_score:.2f}")
    
    if metrics.issues:
        print(f"\n⚠️  Issues:")
        for issue in metrics.issues:
            print(f"  - {issue}")
    
    if metrics.recommendations:
        print(f"\n💡 Recommendations:")
        for rec in metrics.recommendations:
            print(f"  - {rec}")

