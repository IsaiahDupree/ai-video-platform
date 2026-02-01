"""
Unified Transcription Adapter
Provides consistent output format across different transcription providers
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from enum import Enum


class TranscriptionProvider(str, Enum):
    """Supported transcription providers"""
    OPENAI = "openai"
    GROQ = "groq"
    DEEPGRAM = "deepgram"
    ASSEMBLYAI = "assemblyai"
    HUGGINGFACE = "huggingface"


@dataclass
class Word:
    """Word-level transcription data"""
    text: str
    start: float  # seconds
    end: float  # seconds
    confidence: float = 1.0
    speaker: Optional[str] = None
    punctuated: Optional[str] = None  # Formatted version with punctuation


@dataclass
class Segment:
    """Segment-level transcription data"""
    text: str
    start: float  # seconds
    end: float  # seconds
    confidence: float = 1.0
    speaker: Optional[str] = None
    words: List[Word] = field(default_factory=list)


@dataclass
class Speaker:
    """Speaker information"""
    id: str
    label: str  # e.g., "SPEAKER_00", "Speaker A"
    segments: List[Segment] = field(default_factory=list)


@dataclass
class Sentiment:
    """Sentiment analysis result"""
    text: str
    sentiment: str  # "POSITIVE", "NEGATIVE", "NEUTRAL"
    confidence: float
    start: float
    end: float


@dataclass
class Entity:
    """Named entity"""
    text: str
    entity_type: str  # "person_name", "location", "organization", etc.
    start: float
    end: float
    confidence: Optional[float] = None


@dataclass
class Topic:
    """Topic/category"""
    label: str
    confidence: float


@dataclass
class TranscriptionResult:
    """Unified transcription result format"""
    text: str
    language: str
    duration: float
    segments: List[Segment] = field(default_factory=list)
    words: List[Word] = field(default_factory=list)
    
    # Enhanced features (optional)
    speakers: Optional[List[Speaker]] = None
    sentiment: Optional[List[Sentiment]] = None
    entities: Optional[List[Entity]] = None
    topics: Optional[List[Topic]] = None
    summary: Optional[str] = None
    chapters: Optional[List[Dict[str, Any]]] = None
    
    # Metadata
    provider: Optional[str] = None
    model: Optional[str] = None
    confidence: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "text": self.text,
            "language": self.language,
            "duration": self.duration,
            "segments": [
                {
                    "text": s.text,
                    "start": s.start,
                    "end": s.end,
                    "confidence": s.confidence,
                    "speaker": s.speaker,
                    "words": [
                        {
                            "text": w.text,
                            "start": w.start,
                            "end": w.end,
                            "confidence": w.confidence,
                            "speaker": w.speaker
                        }
                        for w in s.words
                    ]
                }
                for s in self.segments
            ],
            "words": [
                {
                    "text": w.text,
                    "start": w.start,
                    "end": w.end,
                    "confidence": w.confidence,
                    "speaker": w.speaker
                }
                for w in self.words
            ],
            "speakers": [
                {
                    "id": sp.id,
                    "label": sp.label,
                    "segments": len(sp.segments)
                }
                for sp in (self.speakers or [])
            ] if self.speakers else None,
            "sentiment": [
                {
                    "text": sent.text,
                    "sentiment": sent.sentiment,
                    "confidence": sent.confidence,
                    "start": sent.start,
                    "end": sent.end
                }
                for sent in (self.sentiment or [])
            ] if self.sentiment else None,
            "entities": [
                {
                    "text": ent.text,
                    "type": ent.entity_type,
                    "start": ent.start,
                    "end": ent.end
                }
                for ent in (self.entities or [])
            ] if self.entities else None,
            "topics": [
                {
                    "label": t.label,
                    "confidence": t.confidence
                }
                for t in (self.topics or [])
            ] if self.topics else None,
            "summary": self.summary,
            "provider": self.provider,
            "model": self.model
        }


class TranscriptionAdapter:
    """
    Adapts different provider outputs to unified TranscriptionResult format
    
    Usage:
        adapter = TranscriptionAdapter()
        result = adapter.adapt(response, provider="groq")
    """
    
    def adapt(self, response: Dict[str, Any], provider: str) -> TranscriptionResult:
        """
        Adapt provider response to unified format
        
        Args:
            response: Raw response from provider
            provider: Provider name (openai, groq, deepgram, assemblyai)
        
        Returns:
            TranscriptionResult with unified format
        """
        provider = provider.lower()
        
        if provider in ["openai", "groq"]:
            return self.adapt_openai(response, provider)
        elif provider == "deepgram":
            return self.adapt_deepgram(response)
        elif provider == "assemblyai":
            return self.adapt_assemblyai(response)
        elif provider == "huggingface":
            return self.adapt_huggingface(response)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def adapt_openai(self, response: Dict[str, Any], provider: str = "openai") -> TranscriptionResult:
        """
        Adapt OpenAI/Groq Whisper response
        
        Format is identical for both providers (OpenAI-compatible API)
        """
        # Extract words if available
        words = []
        if "words" in response:
            words = [
                Word(
                    text=w.get("word", ""),
                    start=w.get("start", 0.0),
                    end=w.get("end", 0.0),
                    confidence=w.get("probability", 1.0)
                )
                for w in response["words"]
            ]
        
        # Extract segments
        segments = []
        if "segments" in response:
            for seg in response["segments"]:
                # Extract words for this segment
                seg_words = []
                if "words" in seg:
                    seg_words = [
                        Word(
                            text=w.get("word", ""),
                            start=w.get("start", 0.0),
                            end=w.get("end", 0.0),
                            confidence=w.get("probability", 1.0)
                        )
                        for w in seg["words"]
                    ]
                
                segments.append(Segment(
                    text=seg.get("text", ""),
                    start=seg.get("start", 0.0),
                    end=seg.get("end", 0.0),
                    confidence=1.0 - seg.get("no_speech_prob", 0.0),
                    words=seg_words
                ))
        
        return TranscriptionResult(
            text=response.get("text", ""),
            language=response.get("language", "unknown"),
            duration=response.get("duration", 0.0),
            segments=segments,
            words=words,
            provider=provider,
            model=response.get("model", "whisper")
        )
    
    def adapt_deepgram(self, response: Dict[str, Any]) -> TranscriptionResult:
        """
        Adapt Deepgram response
        
        Deepgram provides enhanced features like speaker diarization
        """
        metadata = response.get("metadata", {})
        results = response.get("results", {})
        channels = results.get("channels", [])
        
        if not channels:
            return TranscriptionResult(
                text="",
                language="unknown",
                duration=0.0,
                provider="deepgram"
            )
        
        channel = channels[0]
        alternatives = channel.get("alternatives", [])
        
        if not alternatives:
            return TranscriptionResult(
                text="",
                language="unknown",
                duration=metadata.get("duration", 0.0),
                provider="deepgram"
            )
        
        alternative = alternatives[0]
        
        # Extract words with speaker labels
        words = []
        speaker_map = {}
        
        for w in alternative.get("words", []):
            word = Word(
                text=w.get("word", ""),
                start=w.get("start", 0.0),
                end=w.get("end", 0.0),
                confidence=w.get("confidence", 1.0),
                speaker=str(w.get("speaker")) if "speaker" in w else None,
                punctuated=w.get("punctuated_word")
            )
            words.append(word)
            
            # Track speakers
            if word.speaker:
                if word.speaker not in speaker_map:
                    speaker_map[word.speaker] = []
                speaker_map[word.speaker].append(word)
        
        # Create segments from paragraphs or words
        segments = []
        paragraphs = alternative.get("paragraphs", {})
        
        if paragraphs and "paragraphs" in paragraphs:
            for para in paragraphs["paragraphs"]:
                segments.append(Segment(
                    text=para.get("text", ""),
                    start=para.get("start", 0.0),
                    end=para.get("end", 0.0),
                    confidence=1.0
                ))
        else:
            # Create segments from words (group by speaker or time)
            current_segment = None
            for word in words:
                if current_segment is None or (word.speaker and word.speaker != current_segment.speaker):
                    if current_segment:
                        segments.append(current_segment)
                    current_segment = Segment(
                        text=word.text,
                        start=word.start,
                        end=word.end,
                        confidence=word.confidence,
                        speaker=word.speaker,
                        words=[word]
                    )
                else:
                    current_segment.text += " " + word.text
                    current_segment.end = word.end
                    current_segment.words.append(word)
            
            if current_segment:
                segments.append(current_segment)
        
        # Create speaker objects
        speakers = None
        if speaker_map:
            speakers = [
                Speaker(
                    id=speaker_id,
                    label=f"SPEAKER_{speaker_id}",
                    segments=[s for s in segments if s.speaker == speaker_id]
                )
                for speaker_id in speaker_map.keys()
            ]
        
        return TranscriptionResult(
            text=alternative.get("transcript", ""),
            language=metadata.get("language", "unknown"),
            duration=metadata.get("duration", 0.0),
            segments=segments,
            words=words,
            speakers=speakers,
            provider="deepgram",
            model=metadata.get("model", "nova-2"),
            confidence=alternative.get("confidence", 1.0)
        )
    
    def adapt_assemblyai(self, response: Dict[str, Any]) -> TranscriptionResult:
        """
        Adapt AssemblyAI response
        
        AssemblyAI provides extensive NLP features
        """
        # Extract words with speaker labels
        words = []
        for w in response.get("words", []):
            words.append(Word(
                text=w.get("text", ""),
                start=w.get("start", 0) / 1000.0,  # Convert ms to seconds
                end=w.get("end", 0) / 1000.0,
                confidence=w.get("confidence", 1.0),
                speaker=w.get("speaker")
            ))
        
        # Extract segments from utterances (speaker turns)
        segments = []
        speaker_map = {}
        
        for utt in response.get("utterances", []):
            segment = Segment(
                text=utt.get("text", ""),
                start=utt.get("start", 0) / 1000.0,
                end=utt.get("end", 0) / 1000.0,
                confidence=utt.get("confidence", 1.0),
                speaker=utt.get("speaker"),
                words=[w for w in words if utt["start"] <= w.start * 1000 <= utt["end"]]
            )
            segments.append(segment)
            
            # Track speakers
            if segment.speaker:
                if segment.speaker not in speaker_map:
                    speaker_map[segment.speaker] = []
                speaker_map[segment.speaker].append(segment)
        
        # Create speaker objects
        speakers = None
        if speaker_map:
            speakers = [
                Speaker(
                    id=speaker_id,
                    label=speaker_id,
                    segments=segs
                )
                for speaker_id, segs in speaker_map.items()
            ]
        
        # Extract sentiment
        sentiment = None
        if "sentiment_analysis_results" in response:
            sentiment = [
                Sentiment(
                    text=s.get("text", ""),
                    sentiment=s.get("sentiment", "NEUTRAL"),
                    confidence=s.get("confidence", 1.0),
                    start=s.get("start", 0) / 1000.0,
                    end=s.get("end", 0) / 1000.0
                )
                for s in response["sentiment_analysis_results"]
            ]
        
        # Extract entities
        entities = None
        if "entities" in response:
            entities = [
                Entity(
                    text=e.get("text", ""),
                    entity_type=e.get("entity_type", "unknown"),
                    start=e.get("start", 0) / 1000.0,
                    end=e.get("end", 0) / 1000.0
                )
                for e in response["entities"]
            ]
        
        # Extract topics
        topics = None
        if "iab_categories_result" in response:
            summary = response["iab_categories_result"].get("summary", {})
            topics = [
                Topic(label=label, confidence=conf)
                for label, conf in summary.items()
            ]
        
        # Extract summary
        summary = None
        if "summary" in response:
            summary = response["summary"]
        
        # Extract chapters
        chapters = response.get("chapters")
        
        return TranscriptionResult(
            text=response.get("text", ""),
            language=response.get("language_code", "unknown"),
            duration=response.get("audio_duration", 0.0),
            segments=segments,
            words=words,
            speakers=speakers,
            sentiment=sentiment,
            entities=entities,
            topics=topics,
            summary=summary,
            chapters=chapters,
            provider="assemblyai",
            model="universal-1",
            confidence=response.get("confidence", 1.0)
        )
    
    def adapt_huggingface(self, response: Dict[str, Any]) -> TranscriptionResult:
        """
        Adapt Hugging Face transformers pipeline response
        
        Basic format from pipeline("automatic-speech-recognition")
        """
        text = response.get("text", "")
        
        # Extract chunks/segments if available
        segments = []
        if "chunks" in response:
            for chunk in response["chunks"]:
                timestamp = chunk.get("timestamp", [0.0, 0.0])
                segments.append(Segment(
                    text=chunk.get("text", ""),
                    start=timestamp[0] if len(timestamp) > 0 else 0.0,
                    end=timestamp[1] if len(timestamp) > 1 else 0.0,
                    confidence=1.0
                ))
        
        return TranscriptionResult(
            text=text,
            language="unknown",  # HF doesn't always provide language
            duration=segments[-1].end if segments else 0.0,
            segments=segments,
            words=[],  # HF basic pipeline doesn't provide word-level
            provider="huggingface",
            model=response.get("model", "whisper")
        )


def generate_srt(transcription: TranscriptionResult, max_chars_per_line: int = 42, max_duration: float = 7.0) -> str:
    """
    Generate SRT (SubRip) format captions from transcription

    Args:
        transcription: TranscriptionResult with segments or words
        max_chars_per_line: Maximum characters per caption line
        max_duration: Maximum duration for a single caption (seconds)

    Returns:
        SRT formatted string
    """
    import textwrap

    captions = []

    # Use segments if available, otherwise create from words
    if transcription.segments:
        for seg in transcription.segments:
            # Split long segments into smaller captions
            text = seg.text.strip()
            if not text:
                continue

            # Split by duration if segment is too long
            duration = seg.end - seg.start
            if duration > max_duration:
                # Split into smaller chunks based on words
                if seg.words:
                    current_text = ""
                    current_start = seg.words[0].start

                    for i, word in enumerate(seg.words):
                        if word.end - current_start > max_duration or len(current_text) + len(word.text) > max_chars_per_line * 2:
                            if current_text:
                                captions.append({
                                    "start": current_start,
                                    "end": seg.words[i-1].end if i > 0 else word.start,
                                    "text": current_text.strip()
                                })
                            current_text = word.text
                            current_start = word.start
                        else:
                            current_text += " " + word.text if current_text else word.text

                    if current_text:
                        captions.append({
                            "start": current_start,
                            "end": seg.end,
                            "text": current_text.strip()
                        })
                else:
                    # No words, just split text evenly
                    lines = textwrap.wrap(text, max_chars_per_line)
                    num_lines = len(lines)
                    duration_per_line = duration / num_lines

                    for i, line in enumerate(lines):
                        captions.append({
                            "start": seg.start + (i * duration_per_line),
                            "end": seg.start + ((i + 1) * duration_per_line),
                            "text": line
                        })
            else:
                # Segment fits within duration, just wrap text
                lines = textwrap.wrap(text, max_chars_per_line)
                if len(lines) <= 2:
                    captions.append({
                        "start": seg.start,
                        "end": seg.end,
                        "text": "\n".join(lines)
                    })
                else:
                    # Split into multiple captions
                    duration_per_caption = duration / len(lines)
                    for i, line in enumerate(lines):
                        captions.append({
                            "start": seg.start + (i * duration_per_caption),
                            "end": seg.start + ((i + 1) * duration_per_caption),
                            "text": line
                        })

    elif transcription.words:
        # Create captions from words
        current_text = ""
        current_start = transcription.words[0].start

        for i, word in enumerate(transcription.words):
            # Check if adding this word would exceed limits
            test_text = (current_text + " " + word.text) if current_text else word.text

            if (word.end - current_start > max_duration or
                len(test_text) > max_chars_per_line * 2 or
                "\n" in word.text):  # Sentence boundary

                if current_text:
                    # Wrap current caption
                    lines = textwrap.wrap(current_text.strip(), max_chars_per_line)
                    captions.append({
                        "start": current_start,
                        "end": transcription.words[i-1].end if i > 0 else word.start,
                        "text": "\n".join(lines[:2])  # Max 2 lines per caption
                    })

                current_text = word.text
                current_start = word.start
            else:
                current_text = test_text

        # Add final caption
        if current_text:
            lines = textwrap.wrap(current_text.strip(), max_chars_per_line)
            captions.append({
                "start": current_start,
                "end": transcription.words[-1].end,
                "text": "\n".join(lines[:2])
            })

    # Generate SRT output
    srt_lines = []
    for i, caption in enumerate(captions, 1):
        # Format timestamps
        start_time = _format_srt_timestamp(caption["start"])
        end_time = _format_srt_timestamp(caption["end"])

        srt_lines.append(f"{i}")
        srt_lines.append(f"{start_time} --> {end_time}")
        srt_lines.append(caption["text"])
        srt_lines.append("")  # Blank line between captions

    return "\n".join(srt_lines)


def generate_vtt(transcription: TranscriptionResult, max_chars_per_line: int = 42, max_duration: float = 7.0) -> str:
    """
    Generate WebVTT format captions from transcription

    Args:
        transcription: TranscriptionResult with segments or words
        max_chars_per_line: Maximum characters per caption line
        max_duration: Maximum duration for a single caption (seconds)

    Returns:
        WebVTT formatted string
    """
    # Generate SRT content first
    srt_content = generate_srt(transcription, max_chars_per_line, max_duration)

    # Convert SRT to VTT
    # VTT uses dots instead of commas in timestamps
    vtt_content = srt_content.replace(",", ".")

    # Add WebVTT header
    return f"WEBVTT\n\n{vtt_content}"


def _format_srt_timestamp(seconds: float) -> str:
    """
    Format seconds as SRT timestamp (HH:MM:SS,mmm)

    Args:
        seconds: Time in seconds

    Returns:
        Formatted timestamp string
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)

    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


# Convenience function
def adapt_transcription(response: Dict[str, Any], provider: str) -> TranscriptionResult:
    """
    Convenience function to adapt transcription response

    Args:
        response: Raw response from provider
        provider: Provider name

    Returns:
        TranscriptionResult with unified format
    """
    adapter = TranscriptionAdapter()
    return adapter.adapt(response, provider)
