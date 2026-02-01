"""
Remotion Video Pipeline with Word-Level Captions
================================================
Generates YouTube videos using:
- OpenAI TTS for voice generation
- Whisper for word-level timestamps
- GPT-4 for scene detection
- Gemini/DALL-E for scene images
- Remotion for video rendering
"""

import os
import json
import asyncio
import subprocess
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from datetime import datetime
from loguru import logger
import httpx
from openai import OpenAI


@dataclass
class Word:
    """A single word with timing"""
    word: str
    start: float
    end: float


@dataclass
class Scene:
    """A scene with content and timing"""
    index: int
    title: str
    description: str
    text: str
    start_time: float
    end_time: float
    image_path: Optional[str] = None
    image_prompt: Optional[str] = None
    words: List[Word] = field(default_factory=list)


@dataclass
class VideoProject:
    """Complete video project data"""
    title: str
    transcript: str
    output_dir: str
    scenes: List[Scene] = field(default_factory=list)
    words: List[Word] = field(default_factory=list)
    audio_path: Optional[str] = None
    brief_path: Optional[str] = None
    output_path: Optional[str] = None


class RemotionVideoPipeline:
    """
    Pipeline for generating videos with word-level captions using Remotion.
    """
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        google_api_key: Optional[str] = None,
        elevenlabs_api_key: Optional[str] = None,
        elevenlabs_voice_id: str = "k0HDiJKO5QdXkGN6NSLI"
    ):
        self.openai = OpenAI(api_key=openai_api_key or os.getenv("OPENAI_API_KEY"))
        self.google_api_key = google_api_key or os.getenv("GOOGLE_API_KEY")
        self.elevenlabs_api_key = elevenlabs_api_key or os.getenv("ELEVENLABS_API_KEY") or "sk_2252654c95162d4e0e644a1e2a540892d3faa828a36cace5"
        self.elevenlabs_voice_id = elevenlabs_voice_id
        self.gemini_endpoint = "https://generativelanguage.googleapis.com/v1beta"
    
    async def create_video(
        self,
        transcript: str,
        title: str,
        output_dir: str,
        use_elevenlabs: bool = True,
        style_prompt: str = "modern tech illustration, clean design, professional"
    ) -> VideoProject:
        """
        Create a complete video from transcript.
        """
        os.makedirs(output_dir, exist_ok=True)
        
        project = VideoProject(
            title=title,
            transcript=transcript,
            output_dir=output_dir
        )
        
        logger.info(f"Starting Remotion video generation: {title}")
        
        # Step 1: Generate voice audio
        if use_elevenlabs:
            project.audio_path = await self._generate_elevenlabs_audio(
                transcript, output_dir
            )
        else:
            project.audio_path = await self._generate_openai_audio(
                transcript, output_dir
            )
        
        # Step 2: Get word-level timestamps with Whisper
        project.words = await self._get_word_timestamps(project.audio_path)
        logger.info(f"Got {len(project.words)} words with timestamps")
        
        # Step 3: Detect scenes from transcript
        project.scenes = await self._detect_scenes(transcript, project.words)
        logger.info(f"Detected {len(project.scenes)} scenes")
        
        # Step 4: Generate image prompts and images for each scene
        for scene in project.scenes:
            scene.image_prompt = await self._generate_image_prompt(
                scene.description, scene.title, style_prompt
            )
            scene.image_path = await self._generate_scene_image(
                scene.image_prompt, output_dir, scene.index
            )
            logger.info(f"Generated image for scene {scene.index}: {scene.title}")
        
        # Step 5: Create Remotion brief JSON
        project.brief_path = await self._create_remotion_brief(project)
        
        # Step 6: Render video with Remotion
        project.output_path = await self._render_with_remotion(project)
        
        logger.success(f"Video generated: {project.output_path}")
        return project
    
    async def _generate_elevenlabs_audio(
        self,
        text: str,
        output_dir: str
    ) -> str:
        """Generate voice audio using ElevenLabs"""
        
        audio_path = os.path.join(output_dir, "voiceover.mp3")
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.elevenlabs_api_key
        }
        
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.3,  # Lower for more variation/excitement
                "similarity_boost": 0.85,  # Higher for better voice match
                "style": 0.6,  # Higher for more expressive/excited delivery
                "use_speaker_boost": True
            }
        }
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{self.elevenlabs_voice_id}",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                with open(audio_path, "wb") as f:
                    f.write(response.content)
                logger.success(f"Generated ElevenLabs audio: {audio_path}")
                return audio_path
            else:
                logger.warning(f"ElevenLabs failed: {response.status_code}, falling back to OpenAI")
                return await self._generate_openai_audio(text, output_dir)
    
    async def _generate_openai_audio(
        self,
        text: str,
        output_dir: str
    ) -> str:
        """Generate voice audio using OpenAI TTS"""
        
        audio_path = os.path.join(output_dir, "voiceover.mp3")
        
        response = self.openai.audio.speech.create(
            model="tts-1-hd",
            voice="onyx",
            input=text
        )
        
        response.stream_to_file(audio_path)
        logger.success(f"Generated OpenAI audio: {audio_path}")
        return audio_path
    
    async def _get_word_timestamps(self, audio_path: str) -> List[Word]:
        """Get word-level timestamps using Whisper API"""
        
        logger.info("Getting word-level timestamps with Whisper...")
        
        with open(audio_path, "rb") as audio_file:
            response = self.openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["word"]
            )
        
        words = []
        if hasattr(response, 'words') and response.words:
            for w in response.words:
                words.append(Word(
                    word=w.word,
                    start=w.start,
                    end=w.end
                ))
        
        logger.success(f"Extracted {len(words)} word timestamps")
        return words
    
    async def _detect_scenes(
        self,
        transcript: str,
        words: List[Word]
    ) -> List[Scene]:
        """Detect scenes from transcript using GPT-4"""
        
        prompt = f"""Analyze this transcript and divide it into 6-10 distinct scenes/sections.
For each scene, provide:
1. A short title (3-5 words)
2. A visual description for image generation (be specific about visual elements)
3. The exact text segment for that scene

Transcript:
{transcript}

Respond in JSON format:
{{
    "scenes": [
        {{
            "title": "Scene Title",
            "description": "Detailed visual description for image generation",
            "text": "The exact transcript text for this scene"
        }}
    ]
}}"""

        response = self.openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        scenes = []
        current_word_idx = 0
        
        for i, scene_data in enumerate(result.get("scenes", [])):
            scene_text = scene_data.get("text", "")
            scene_words = []
            
            # Find words that belong to this scene
            scene_text_lower = scene_text.lower()
            start_time = None
            end_time = None
            
            for j, word in enumerate(words[current_word_idx:], start=current_word_idx):
                word_lower = word.word.lower().strip()
                if word_lower in scene_text_lower:
                    if start_time is None:
                        start_time = word.start
                    end_time = word.end
                    scene_words.append(word)
                    
                    # Check if we've matched enough words for this scene
                    if len(scene_words) >= len(scene_text.split()) * 0.8:
                        current_word_idx = j + 1
                        break
            
            # Default timing if not found
            if start_time is None:
                if scenes:
                    start_time = scenes[-1].end_time
                else:
                    start_time = 0
            if end_time is None:
                end_time = start_time + 10
            
            scenes.append(Scene(
                index=i,
                title=scene_data.get("title", f"Scene {i+1}"),
                description=scene_data.get("description", ""),
                text=scene_text,
                start_time=start_time,
                end_time=end_time,
                words=scene_words
            ))
        
        return scenes
    
    async def _generate_image_prompt(
        self,
        scene_description: str,
        scene_title: str,
        style_prompt: str
    ) -> str:
        """Generate detailed image prompt"""
        
        prompt = f"""Create a detailed image generation prompt for this scene:

Title: {scene_title}
Description: {scene_description}
Style: {style_prompt}

Requirements:
1. Be specific about visual elements, colors, composition
2. Optimized for AI image generation
3. NO text/words in the image
4. Professional, YouTube thumbnail quality

Respond with ONLY the image prompt."""

        response = self.openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )
        
        return response.choices[0].message.content.strip()
    
    async def _generate_scene_image(
        self,
        prompt: str,
        output_dir: str,
        scene_index: int
    ) -> str:
        """Generate scene image using DALL-E 3"""
        
        image_path = os.path.join(output_dir, f"scene_{scene_index:03d}.png")
        
        try:
            response = self.openai.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1792x1024",
                quality="standard",
                n=1
            )
            
            image_url = response.data[0].url
            
            # Download image
            async with httpx.AsyncClient() as client:
                img_response = await client.get(image_url)
                with open(image_path, "wb") as f:
                    f.write(img_response.content)
            
            logger.success(f"Generated DALL-E image: {image_path}")
            return image_path
            
        except Exception as e:
            logger.warning(f"DALL-E failed: {e}, creating placeholder")
            return await self._create_placeholder_image(prompt, image_path)
    
    async def _create_placeholder_image(
        self,
        prompt: str,
        output_path: str
    ) -> str:
        """Create placeholder image"""
        
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", "color=c=0x1a1a2e:s=1920x1080:d=1",
            "-frames:v", "1",
            output_path
        ]
        
        subprocess.run(cmd, capture_output=True)
        return output_path
    
    async def _create_remotion_brief(self, project: VideoProject) -> str:
        """Create Remotion brief JSON with word-level captions"""
        
        brief = {
            "id": project.title.replace(" ", "_").lower(),
            "title": project.title,
            "settings": {
                "resolution": {"width": 1920, "height": 1080},
                "fps": 30,
                "duration_sec": project.words[-1].end if project.words else 60
            },
            "style": {
                "theme": "dark",
                "primary_color": "#6366f1",
                "caption_style": {
                    "font_size": 48,
                    "font_family": "Inter, sans-serif",
                    "color": "#ffffff",
                    "background": "rgba(0, 0, 0, 0.7)",
                    "position": "bottom"
                }
            },
            "scenes": [],
            "words": [],
            "audio": {
                "voiceover": project.audio_path,
                "volume_voice": 1.0
            }
        }
        
        # Add scenes
        for scene in project.scenes:
            brief["scenes"].append({
                "id": f"scene_{scene.index}",
                "title": scene.title,
                "description": scene.description,
                "text": scene.text,
                "start_time": scene.start_time,
                "end_time": scene.end_time,
                "image_path": scene.image_path,
                "duration_sec": scene.end_time - scene.start_time
            })
        
        # Add word-level timestamps for captions
        for word in project.words:
            brief["words"].append({
                "word": word.word,
                "start": word.start,
                "end": word.end
            })
        
        brief_path = os.path.join(project.output_dir, "brief.json")
        with open(brief_path, "w") as f:
            json.dump(brief, f, indent=2)
        
        logger.success(f"Created Remotion brief: {brief_path}")
        return brief_path
    
    async def _render_with_remotion(self, project: VideoProject) -> str:
        """Render video using ffmpeg with word-level captions"""
        
        output_path = os.path.join(project.output_dir, f"{project.title.replace(' ', '_')}.mp4")
        
        # Build filter complex for scenes with captions
        filter_parts = []
        inputs = []
        
        # Get audio duration
        audio_duration = project.words[-1].end if project.words else 60
        
        # Create scene inputs
        for i, scene in enumerate(project.scenes):
            if scene.image_path and os.path.exists(scene.image_path):
                duration = scene.end_time - scene.start_time
                inputs.extend(["-loop", "1", "-t", str(duration), "-i", scene.image_path])
        
        n_scenes = len([s for s in project.scenes if s.image_path and os.path.exists(s.image_path)])
        
        if n_scenes == 0:
            logger.error("No scene images available")
            return output_path
        
        # Scale all scenes
        for i in range(n_scenes):
            filter_parts.append(
                f"[{i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,"
                f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v{i}];"
            )
        
        # Add title overlay for each scene
        for i, scene in enumerate(project.scenes):
            if i < n_scenes:
                title_safe = scene.title.replace("'", "'\\''")
                filter_parts.append(
                    f"[v{i}]drawtext=text='{title_safe}':"
                    f"fontsize=56:fontcolor=white:x=(w-tw)/2:y=60:"
                    f"box=1:boxcolor=black@0.6:boxborderw=15[t{i}];"
                )
        
        # Concat all scenes
        concat_inputs = "".join([f"[t{i}]" for i in range(n_scenes)])
        filter_parts.append(f"{concat_inputs}concat=n={n_scenes}:v=1:a=0[base];")
        
        # Create word-level captions using ASS subtitles
        ass_path = await self._create_ass_subtitles(project)
        
        # Add subtitles
        filter_parts.append(f"[base]ass='{ass_path}'[outv]")
        
        filter_complex = "".join(filter_parts)
        
        # Build ffmpeg command
        cmd = ["ffmpeg", "-y"]
        cmd.extend(inputs)
        cmd.extend(["-i", project.audio_path])
        cmd.extend([
            "-filter_complex", filter_complex,
            "-map", "[outv]",
            "-map", f"{n_scenes}:a",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            output_path
        ])
        
        logger.info("Rendering video with word-level captions...")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            if result.returncode == 0:
                logger.success(f"Video rendered: {output_path}")
            else:
                logger.error(f"FFmpeg error: {result.stderr[:500]}")
        except Exception as e:
            logger.error(f"Render failed: {e}")
        
        return output_path
    
    async def _create_ass_subtitles(self, project: VideoProject) -> str:
        """Create ASS subtitle file with word-level highlighting"""
        
        ass_path = os.path.join(project.output_dir, "captions.ass")
        
        # ASS header
        ass_content = """[Script Info]
Title: Word-Level Captions
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Inter,52,&H00FFFFFF,&H000088EF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,2,2,50,50,80,1
Style: Highlight,Inter,52,&H0088EEFF,&H000088EF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,2,2,50,50,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        
        # Group words into phrases (5-7 words per line)
        words_per_line = 6
        phrases = []
        
        for i in range(0, len(project.words), words_per_line):
            phrase_words = project.words[i:i + words_per_line]
            if phrase_words:
                phrases.append({
                    "words": phrase_words,
                    "start": phrase_words[0].start,
                    "end": phrase_words[-1].end,
                    "text": " ".join(w.word for w in phrase_words)
                })
        
        def time_to_ass(seconds: float) -> str:
            h = int(seconds // 3600)
            m = int((seconds % 3600) // 60)
            s = seconds % 60
            return f"{h}:{m:02d}:{s:05.2f}"
        
        # Create subtitle events with word highlighting
        for phrase in phrases:
            start = time_to_ass(phrase["start"])
            end = time_to_ass(phrase["end"])
            
            # Create karaoke-style highlighting
            text_parts = []
            for word in phrase["words"]:
                word_duration = int((word.end - word.start) * 100)
                text_parts.append(f"{{\\kf{word_duration}}}{word.word}")
            
            text = " ".join(text_parts)
            ass_content += f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n"
        
        with open(ass_path, "w") as f:
            f.write(ass_content)
        
        logger.success(f"Created ASS subtitles: {ass_path}")
        return ass_path


# =====================================================
# Generate video from Project Handoff Document
# =====================================================

HANDOFF_TRANSCRIPT = """
Welcome to the AI Video Generation Platform with Voice Cloning!

This platform provides a complete solution for creating professional videos with custom voice cloning capabilities.

Let's start with the Quick Setup. Clone the repository from GitHub, install dependencies with npm, copy the environment template, and start the development server.

The architecture consists of three main components: Remotion for video rendering, Content Briefs in JSON format, and the Audio Pipeline for text-to-speech and sound effects.

These components connect to external services including OpenAI for DALL-E and TTS, Google Gemini for image generation, ElevenLabs for high-quality voice synthesis, and Modal for IndexTTS voice cloning.

You'll need API keys from these services. OpenAI provides access to GPT-4, DALL-E, and TTS. ElevenLabs offers professional text-to-speech. Google Gemini handles image generation. And Modal enables voice cloning.

For Voice Cloning Setup, first install the Modal CLI with pip. Then deploy the voice clone service with modal deploy. Generate your voice using ElevenLabs as a reference, and use the cloned voice in your videos.

Videos are defined using JSON brief files. Each brief includes settings for resolution, fps, and duration. You can define scenes with headings, body text, and images. Audio configuration includes voiceover and volume settings.

To render your video, preview it in the browser with npm run dev, then render to file using Remotion's command line tools.

The platform includes several key scripts: modal voice clone for the cloning service, generate voice with ElevenLabs for the TTS pipeline, remix character for DALL-E consistency, and generate stickers for background removal.

For cost management, the Modal voice cloning service auto-scales to zero after five minutes of idle time. You can check status, stop the app, or view logs using Modal commands.

Common troubleshooting tips: Voice clone cold starts take 30 to 60 seconds. Ensure audio components are properly included in your composition. Check image paths are relative to the public folder. Re-authenticate with Modal if deployment fails.

For more information, check the related documentation including the Modal Voice Cloning API reference, Voice Cloning Guide, Product Requirements Document, and Integration Guide.

Thank you for using the AI Video Generation Platform!
"""


async def main():
    """Generate video from handoff document"""
    
    print("\n" + "="*60)
    print("Remotion Video Pipeline - Project Handoff")
    print("="*60 + "\n")
    
    pipeline = RemotionVideoPipeline()
    
    output_dir = "/tmp/remotion_handoff_video"
    
    project = await pipeline.create_video(
        transcript=HANDOFF_TRANSCRIPT,
        title="AI Video Platform Overview",
        output_dir=output_dir,
        use_elevenlabs=True,
        style_prompt="modern tech illustration, dark theme, purple and blue gradients, clean UI mockups, professional software documentation style"
    )
    
    print(f"\n✅ Video generated: {project.output_path}")
    print(f"📁 Output directory: {output_dir}")
    print(f"🎬 Scenes: {len(project.scenes)}")
    print(f"📝 Words: {len(project.words)}")
    print(f"📄 Brief: {project.brief_path}")
    
    return project


if __name__ == "__main__":
    asyncio.run(main())
