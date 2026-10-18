"""
Longform Transcriber — Word-level timestamps + speaker diarization.

Uses OpenAI Whisper API directly (not the existing WhisperTranscriber which
depends on missing AIClient/ModelRegistry). Adds optional speaker diarization
via pyannote.audio.
"""

from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Optional, Tuple

from loguru import logger

from .types import TranscriptWord, TranscriptSegment, TranscriptionResult


class LongformTranscriber:
    """Transcribe long-form video with word-level timestamps and speaker diarization."""

    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        diarization_enabled: bool = True,
        hf_token: Optional[str] = None,
    ):
        self.openai_api_key = openai_api_key or os.environ.get("OPENAI_API_KEY", "")
        self.diarization_enabled = diarization_enabled
        self.hf_token = hf_token or os.environ.get("HF_TOKEN", "")

        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required for transcription")

    # ─── Audio Extraction ─────────────────────────────────────────────────

    @staticmethod
    def has_audio_stream(file_path: str) -> bool:
        """Check if a file has an audio stream using FFprobe."""
        try:
            result = subprocess.run(
                [
                    "ffprobe", "-v", "error",
                    "-select_streams", "a",
                    "-show_entries", "stream=codec_type",
                    "-of", "csv=p=0",
                    file_path,
                ],
                capture_output=True, text=True, timeout=30,
            )
            return "audio" in result.stdout
        except Exception as e:
            logger.warning(f"FFprobe check failed: {e}")
            return False

    @staticmethod
    def extract_audio(video_path: str, output_path: Optional[str] = None) -> str:
        """Extract audio from video as MP3 16kHz mono (Whisper-optimal)."""
        if output_path is None:
            tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
            output_path = tmp.name
            tmp.close()

        cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-vn", "-acodec", "libmp3lame",
            "-ar", "16000", "-ac", "1",
            "-q:a", "4",
            output_path,
        ]
        logger.info(f"Extracting audio: {video_path} → {output_path}")
        subprocess.run(cmd, capture_output=True, check=True, timeout=300)
        return output_path

    @staticmethod
    def get_duration(file_path: str) -> float:
        """Get media duration in seconds via FFprobe."""
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
                file_path,
            ],
            capture_output=True, text=True, timeout=30,
        )
        return float(result.stdout.strip())

    # ─── Whisper Transcription ────────────────────────────────────────────

    def transcribe_audio(self, audio_path: str) -> dict:
        """Call OpenAI Whisper API with word-level timestamps."""
        import openai

        client = openai.OpenAI(api_key=self.openai_api_key)
        logger.info(f"Transcribing with Whisper (word timestamps): {audio_path}")

        # Whisper API has a 25MB file size limit; chunk if needed
        file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
        if file_size_mb > 24:
            logger.info(f"File is {file_size_mb:.1f}MB, chunking for Whisper limit")
            return self._transcribe_chunked(audio_path)

        with open(audio_path, "rb") as f:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["word", "segment"],
            )

        return response.model_dump() if hasattr(response, "model_dump") else dict(response)

    def _transcribe_chunked(self, audio_path: str, chunk_minutes: int = 10) -> dict:
        """Split long audio into chunks and transcribe each, then merge."""
        import openai

        duration = self.get_duration(audio_path)
        chunk_seconds = chunk_minutes * 60
        chunks = []
        offset = 0.0

        with tempfile.TemporaryDirectory() as tmpdir:
            # Split audio into chunks
            chunk_idx = 0
            while offset < duration:
                chunk_path = os.path.join(tmpdir, f"chunk_{chunk_idx}.mp3")
                end = min(offset + chunk_seconds, duration)
                subprocess.run(
                    [
                        "ffmpeg", "-y", "-i", audio_path,
                        "-ss", str(offset), "-to", str(end),
                        "-acodec", "libmp3lame", "-ar", "16000", "-ac", "1",
                        chunk_path,
                    ],
                    capture_output=True, check=True, timeout=120,
                )
                chunks.append((chunk_path, offset))
                offset = end
                chunk_idx += 1

            # Transcribe each chunk
            client = openai.OpenAI(api_key=self.openai_api_key)
            all_words = []
            all_segments = []
            full_text_parts = []

            for chunk_path, time_offset in chunks:
                logger.info(f"Transcribing chunk at offset {time_offset:.1f}s")
                with open(chunk_path, "rb") as f:
                    resp = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=f,
                        response_format="verbose_json",
                        timestamp_granularities=["word", "segment"],
                    )
                data = resp.model_dump() if hasattr(resp, "model_dump") else dict(resp)

                # Offset timestamps
                for word in data.get("words", []):
                    word["start"] = word.get("start", 0) + time_offset
                    word["end"] = word.get("end", 0) + time_offset
                    all_words.append(word)

                for seg in data.get("segments", []):
                    seg["start"] = seg.get("start", 0) + time_offset
                    seg["end"] = seg.get("end", 0) + time_offset
                    all_segments.append(seg)

                full_text_parts.append(data.get("text", ""))

        return {
            "text": " ".join(full_text_parts),
            "words": all_words,
            "segments": all_segments,
            "language": data.get("language", "en"),
            "duration": duration,
        }

    # ─── Speaker Diarization ──────────────────────────────────────────────

    def diarize(self, audio_path: str) -> List[Tuple[float, float, str]]:
        """
        Run speaker diarization. Returns list of (start, end, speaker_label).
        Falls back to single-speaker if pyannote is not available.
        """
        if not self.diarization_enabled:
            duration = self.get_duration(audio_path)
            return [(0.0, duration, "speaker_0")]

        try:
            from pyannote.audio import Pipeline as PyannotePipeline

            logger.info("Running pyannote speaker diarization")
            pipeline = PyannotePipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=self.hf_token,
            )
            diarization = pipeline(audio_path)

            results = []
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                results.append((turn.start, turn.end, speaker))

            logger.info(f"Diarization found {len(set(r[2] for r in results))} speakers")
            return results

        except ImportError:
            logger.warning("pyannote.audio not installed, falling back to single speaker")
            duration = self.get_duration(audio_path)
            return [(0.0, duration, "speaker_0")]
        except Exception as e:
            logger.warning(f"Diarization failed, falling back to single speaker: {e}")
            duration = self.get_duration(audio_path)
            return [(0.0, duration, "speaker_0")]

    # ─── Merge Transcript + Diarization ───────────────────────────────────

    @staticmethod
    def assign_speakers(
        words: List[dict],
        diarization: List[Tuple[float, float, str]],
    ) -> List[TranscriptWord]:
        """Assign speaker labels to words based on time overlap with diarization segments."""
        result = []
        for w in words:
            word_mid = (w.get("start", 0) + w.get("end", 0)) / 2
            speaker = "speaker_0"
            for seg_start, seg_end, seg_speaker in diarization:
                if seg_start <= word_mid <= seg_end:
                    speaker = seg_speaker
                    break
            result.append(TranscriptWord(
                word=w.get("word", ""),
                start=w.get("start", 0),
                end=w.get("end", 0),
                confidence=w.get("confidence", 1.0) if "confidence" in w else 1.0,
                speaker_id=speaker,
            ))
        return result

    @staticmethod
    def group_into_segments(words: List[TranscriptWord], max_gap: float = 1.0) -> List[TranscriptSegment]:
        """Group words into segments by speaker + time gaps."""
        if not words:
            return []

        segments: List[TranscriptSegment] = []
        current_words = [words[0]]
        current_speaker = words[0].speaker_id

        for w in words[1:]:
            gap = w.start - current_words[-1].end
            if w.speaker_id != current_speaker or gap > max_gap:
                # Flush current segment
                segments.append(TranscriptSegment(
                    speaker=current_speaker,
                    start=current_words[0].start,
                    end=current_words[-1].end,
                    text=" ".join(cw.word for cw in current_words),
                    words=current_words,
                ))
                current_words = [w]
                current_speaker = w.speaker_id
            else:
                current_words.append(w)

        # Flush last segment
        if current_words:
            segments.append(TranscriptSegment(
                speaker=current_speaker,
                start=current_words[0].start,
                end=current_words[-1].end,
                text=" ".join(cw.word for cw in current_words),
                words=current_words,
            ))

        return segments

    # ─── Main Entry Point ─────────────────────────────────────────────────

    def transcribe_video(self, video_path: str, cleanup: bool = True) -> TranscriptionResult:
        """
        Full pipeline: extract audio → transcribe with word timestamps → diarize → merge.

        Args:
            video_path: Path to the source video file
            cleanup: Whether to delete temporary audio files

        Returns:
            TranscriptionResult with word-level timestamps and speaker labels
        """
        if not self.has_audio_stream(video_path):
            raise ValueError(f"No audio stream found in {video_path}")

        audio_path = self.extract_audio(video_path)

        try:
            # Step 1: Transcribe with word timestamps
            whisper_result = self.transcribe_audio(audio_path)
            raw_words = whisper_result.get("words", [])
            language = whisper_result.get("language", "en")

            if not raw_words:
                logger.warning("Whisper returned no word-level timestamps")
                # Fall back to segment-level
                for seg in whisper_result.get("segments", []):
                    raw_words.append({
                        "word": seg.get("text", "").strip(),
                        "start": seg.get("start", 0),
                        "end": seg.get("end", 0),
                    })

            # Step 2: Diarize
            diarization = self.diarize(audio_path)

            # Step 3: Merge — assign speaker to each word
            words = self.assign_speakers(raw_words, diarization)

            # Step 4: Group into segments
            segments = self.group_into_segments(words)

            duration = self.get_duration(video_path)
            speakers = sorted(set(w.speaker_id for w in words))

            avg_confidence = (
                sum(w.confidence for w in words) / len(words) if words else 0.0
            )

            result = TranscriptionResult(
                segments=segments,
                speakers=speakers,
                language=language,
                confidence=avg_confidence,
                duration_seconds=duration,
            )
            logger.info(
                f"Transcription complete: {len(words)} words, "
                f"{len(segments)} segments, {len(speakers)} speakers, "
                f"{duration:.1f}s duration"
            )
            return result

        finally:
            if cleanup and os.path.exists(audio_path):
                os.unlink(audio_path)


# ─── CLI Test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python -m services.longform.transcriber <video_path>")
        sys.exit(1)

    transcriber = LongformTranscriber(diarization_enabled=False)
    result = transcriber.transcribe_video(sys.argv[1])
    print(json.dumps(result.to_dict(), indent=2))
