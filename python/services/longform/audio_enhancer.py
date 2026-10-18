"""
Audio Enhancer — Voice cleanup and background music.

Applies noise reduction, compression, EQ, and normalization to the
speaker's audio track. Sources background music from the SoundCloud
Background Music library (localhost:3850) with Pixabay fallback.
"""

from __future__ import annotations

import os
import subprocess
import tempfile
from typing import Optional, Dict, Any

from loguru import logger


# Shared FFmpeg voice filter chain
VOICE_FILTER_CHAIN = ",".join([
    # High-pass: remove low rumble below 80Hz
    "highpass=f=80",
    # Noise gate: reduce noise in quiet passages
    "agate=threshold=0.01:ratio=2:attack=5:release=50",
    # De-esser: tame sibilance (6-9kHz range)
    "equalizer=f=7000:t=q:w=2:g=-3",
    # Presence boost: add clarity at 2.5kHz
    "equalizer=f=2500:t=q:w=1.5:g=3",
    # Warmth: gentle boost at 200Hz
    "equalizer=f=200:t=q:w=1:g=1.5",
    # Compressor: even out dynamics, make voice punchier
    "acompressor=threshold=0.05:ratio=4:attack=5:release=100:makeup=2",
    # Limiter: prevent clipping
    "alimiter=limit=0.95:level=false",
    # Loudness normalization to -16 LUFS (YouTube standard)
    "loudnorm=I=-16:TP=-1.5:LRA=11",
])

# Path to SoundCloud Background Music project (set via env or default)
SOUNDCLOUD_PROJECT_DIR = os.environ.get(
    "SOUNDCLOUD_MUSIC_DIR",
    os.path.expanduser("~/Documents/Coding/SoundcloudBackgroundMusic"),
)
SOUNDCLOUD_ADAPTER_PATH = os.path.join(SOUNDCLOUD_PROJECT_DIR, "adapters")


class AudioEnhancer:
    """Enhance voice quality and mix background music."""

    def __init__(self, output_dir: Optional[str] = None):
        self.output_dir = output_dir or tempfile.mkdtemp(prefix="audio_enhanced_")
        os.makedirs(self.output_dir, exist_ok=True)

    def enhance_voice(self, video_path: str, output_path: Optional[str] = None) -> str:
        """
        Enhance the speaker's voice audio using FFmpeg filters:
        - High-pass filter at 80Hz (remove rumble)
        - Noise gate (reduce background noise in quiet moments)
        - Compressor (even out volume, make voice punchy)
        - EQ boost at 2-4kHz (presence/clarity)
        - Limiter (prevent clipping)
        - Loudness normalization to -16 LUFS (YouTube standard)
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Source video not found: {video_path}")

        if output_path is None:
            output_path = os.path.join(self.output_dir, "enhanced_voice.mp4")

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-af", VOICE_FILTER_CHAIN,
            "-c:v", "copy",  # Don't re-encode video
            "-c:a", "aac", "-b:a", "192k",
            output_path,
        ]

        logger.info(f"Enhancing voice audio: {video_path}")
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        except subprocess.TimeoutExpired:
            raise RuntimeError(f"FFmpeg voice enhancement timed out after 300s")
        if result.returncode != 0:
            logger.error(f"Voice enhancement failed: {result.stderr[-500:]}")
            raise RuntimeError(f"FFmpeg voice enhancement failed: {result.stderr[-200:]}")

        logger.info(f"Voice enhanced: {output_path}")
        return output_path

    def extract_enhanced_audio(self, video_path: str, output_path: Optional[str] = None) -> str:
        """Extract just the enhanced audio as a separate file for Remotion."""
        if output_path is None:
            output_path = os.path.join(self.output_dir, "enhanced_audio.mp3")

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vn",
            "-af", VOICE_FILTER_CHAIN,
            "-c:a", "libmp3lame", "-b:a", "192k",
            output_path,
        ]

        logger.info(f"Extracting enhanced audio: {video_path}")
        try:
            subprocess.run(cmd, capture_output=True, check=True, timeout=300)
        except subprocess.TimeoutExpired:
            raise RuntimeError(f"FFmpeg audio extraction timed out after 300s")
        logger.info(f"Enhanced audio: {output_path}")
        return output_path

    # ─── Background Music ────────────────────────────────────────────────

    def source_background_music(
        self,
        query: str = "ambient corporate background",
        video_topic: str = "",
        output_path: Optional[str] = None,
    ) -> str:
        """
        Source a background music track. Priority:
        1. SoundCloud Background Music library (localhost:3850)
        2. Pixabay Music API (if PIXABAY_API_KEY set)
        3. FFmpeg-generated ambient pad (fallback)
        """
        if output_path is None:
            output_path = os.path.join(self.output_dir, "background_music.mp3")

        if os.path.exists(output_path):
            logger.debug(f"Music already exists: {output_path}")
            return output_path

        # Build a better search query if we have video context
        search_query = query
        if video_topic:
            search_query = f"background music for {video_topic} video, {query}"

        # Try SoundCloud library first
        try:
            result = self._fetch_soundcloud_music(search_query, output_path)
            if result:
                return result
        except Exception as e:
            logger.warning(f"SoundCloud music fetch failed: {e}")

        # Try Pixabay as fallback
        pixabay_key = os.environ.get("PIXABAY_API_KEY", "")
        if pixabay_key:
            try:
                return self._fetch_pixabay_music(pixabay_key, query, output_path)
            except Exception as e:
                logger.warning(f"Pixabay music fetch failed: {e}")

        # Final fallback: generate ambient tone
        logger.info("Generating ambient background tone as fallback")
        return self._generate_ambient_tone(output_path, duration=300)

    def _fetch_soundcloud_music(self, query: str, output_path: str) -> Optional[str]:
        """
        Fetch a music track from the SoundCloud Background Music library.
        Requires the API to be running: npm run serve (localhost:3850)
        """
        import sys
        # Add the SoundCloud adapter to path
        if SOUNDCLOUD_ADAPTER_PATH not in sys.path:
            sys.path.insert(0, SOUNDCLOUD_ADAPTER_PATH)

        try:
            from python_client import pick_best, get_track
        except ImportError:
            logger.warning("SoundCloud python_client not found, skipping")
            return None

        logger.info(f"Searching SoundCloud library: '{query}'")
        track = pick_best(query)

        if not track:
            logger.warning("No matching track found in SoundCloud library")
            return None

        # Get the actual local file path using sc_track_id (not UUID)
        track_id = track.get("track_id", "")
        local_file = None
        if track_id:
            try:
                detail = get_track(track_id)
                sc_id = detail.get("sc_track_id") or detail.get("local_filename", "").replace(".mp3", "")
                if sc_id:
                    local_file = os.path.join(SOUNDCLOUD_PROJECT_DIR, "audio", f"{sc_id}.mp3")
            except Exception as e:
                logger.debug(f"Could not get track detail: {e}")

        # Fallback to UUID-based path
        if not local_file or not os.path.exists(local_file):
            local_file = track.get("local_file", "")

        if not local_file or not os.path.exists(local_file):
            logger.warning(f"Track file not found: {local_file}")
            return None

        # Validate it's actually an audio file
        try:
            result = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "csv=p=0", local_file],
                capture_output=True, text=True, timeout=10,
            )
            duration = float(result.stdout.strip()) if result.stdout.strip() else 0
            if duration < 10:
                logger.warning(f"Track too short ({duration:.1f}s), skipping")
                return None
        except Exception:
            logger.warning(f"Could not validate audio file: {local_file}")
            return None

        # Copy to output dir (don't reference external paths in Remotion)
        import shutil
        shutil.copy2(local_file, output_path)

        logger.info(
            f"SoundCloud music selected: {track.get('title', '?')} — "
            f"{track.get('artist', '?')} | "
            f"BPM:{track.get('bpm', '?')} Energy:{track.get('energy', '?')} "
            f"Score:{track.get('score', 0):.0%}"
        )
        return output_path

    def _fetch_pixabay_music(self, api_key: str, query: str, output_path: str) -> str:
        """Fetch a music track from Pixabay."""
        import httpx

        resp = httpx.get(
            "https://pixabay.com/api/",
            params={
                "key": api_key,
                "q": query,
                "media_type": "music",
                "per_page": 5,
                "order": "popular",
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        hits = data.get("hits", [])
        if not hits:
            raise ValueError(f"No music found for query: {query}")

        # Pick the first track
        track = hits[0]
        audio_url = track.get("previewURL", "") or track.get("musicURL", "")
        if not audio_url:
            raise ValueError("No audio URL in Pixabay response")

        logger.info(f"Downloading music: {track.get('tags', 'unknown')} from Pixabay")
        with httpx.Client(timeout=60, follow_redirects=True) as client:
            audio_resp = client.get(audio_url)
            audio_resp.raise_for_status()

            # Validate response is actually audio (not a JPEG thumbnail)
            content_type = audio_resp.headers.get("content-type", "")
            if "image" in content_type or len(audio_resp.content) < 50000:
                raise ValueError(f"Pixabay returned non-audio content: {content_type}")

            with open(output_path, "wb") as f:
                f.write(audio_resp.content)

        logger.info(f"Music downloaded: {output_path}")
        return output_path

    @staticmethod
    def _generate_ambient_tone(output_path: str, duration: int = 300) -> str:
        """Generate a subtle ambient pad using FFmpeg synthesis."""
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", (
                f"anoisesrc=d={duration}:c=pink:r=44100:a=0.02"
            ),
            "-af", "lowpass=f=300,highpass=f=60,aecho=0.8:0.88:60:0.4,volume=0.5",
            "-c:a", "libmp3lame", "-b:a", "128k",
            "-t", str(duration),
            output_path,
        ]
        try:
            subprocess.run(cmd, capture_output=True, check=True, timeout=60)
        except subprocess.TimeoutExpired:
            raise RuntimeError("FFmpeg ambient tone generation timed out")
        return output_path


# ─── CLI Test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m services.longform.audio_enhancer <video_path>")
        print("       python -m services.longform.audio_enhancer --search 'chill lofi'")
        sys.exit(1)

    enhancer = AudioEnhancer()

    if sys.argv[1] == "--search":
        query = " ".join(sys.argv[2:]) or "ambient corporate background"
        result = enhancer.source_background_music(query=query)
        print(f"Music: {result}")
    else:
        enhanced = enhancer.enhance_voice(sys.argv[1])
        print(f"Enhanced: {enhanced}")
