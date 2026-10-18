"""
Gemini Video Pipeline
=====================
Generates YouTube videos from transcripts using Google Gemini for image generation,
with captions and scene titles.

Features:
- Scene-based image generation with Google Gemini
- Caption overlay with timing
- Title/scene description at top of frame
- Voice audio integration
- Final video compilation with ffmpeg
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
class Scene:
    """Represents a video scene with text, image, and timing"""
    index: int
    title: str
    description: str
    transcript_segment: str
    duration_seconds: float
    image_path: Optional[str] = None
    image_prompt: Optional[str] = None
    start_time: float = 0.0


@dataclass
class VideoProject:
    """Video project configuration"""
    name: str
    transcript: str
    output_dir: str
    scenes: List[Scene] = field(default_factory=list)
    audio_path: Optional[str] = None
    output_path: Optional[str] = None
    resolution: tuple = (1920, 1080)
    fps: int = 30
    font_size_title: int = 48
    font_size_caption: int = 36


class GeminiVideoService:
    """
    Service for generating videos with Gemini-powered image generation.
    
    Uses Google Gemini API for:
    - Scene image generation
    - Character consistency (Nano Banana style)
    """
    
    def __init__(
        self,
        google_api_key: Optional[str] = None,
        google_cloud_project: Optional[str] = None,
        openai_api_key: Optional[str] = None
    ):
        self.google_api_key = google_api_key or os.getenv("GOOGLE_API_KEY")
        self.google_cloud_project = google_cloud_project or os.getenv("GOOGLE_CLOUD_PROJECT")
        self.openai = OpenAI(api_key=openai_api_key or os.getenv("OPENAI_API_KEY"))
        
        # Gemini API endpoint
        self.gemini_endpoint = "https://generativelanguage.googleapis.com/v1beta"
        
        if not self.google_api_key:
            logger.warning("GOOGLE_API_KEY not set - image generation will fail")
    
    async def create_video_from_transcript(
        self,
        transcript: str,
        title: str,
        output_dir: str,
        voice_audio_path: Optional[str] = None,
        style_prompt: str = "modern, clean, professional tech illustration"
    ) -> VideoProject:
        """
        Create a complete video from transcript.
        
        Args:
            transcript: Full video transcript/script
            title: Video title
            output_dir: Directory for output files
            voice_audio_path: Pre-generated voice audio (optional)
            style_prompt: Visual style description
            
        Returns:
            VideoProject with paths to generated assets
        """
        os.makedirs(output_dir, exist_ok=True)
        
        project = VideoProject(
            name=title,
            transcript=transcript,
            output_dir=output_dir
        )
        
        logger.info(f"Starting video generation: {title}")
        
        # Step 1: Parse transcript into scenes
        project.scenes = await self._parse_transcript_to_scenes(transcript)
        logger.info(f"Parsed {len(project.scenes)} scenes from transcript")
        
        # Step 2: Generate image prompts for each scene
        for scene in project.scenes:
            scene.image_prompt = await self._generate_image_prompt(
                scene.description,
                scene.title,
                style_prompt
            )
        
        # Step 3: Generate images with Gemini
        for scene in project.scenes:
            scene.image_path = await self._generate_scene_image(
                scene.image_prompt,
                output_dir,
                scene.index
            )
            logger.info(f"Generated image for scene {scene.index}: {scene.title}")
        
        # Step 4: Generate voice audio if not provided
        if voice_audio_path:
            project.audio_path = voice_audio_path
        else:
            project.audio_path = await self._generate_voice_audio(
                transcript,
                output_dir
            )
        
        # Step 5: Get audio duration and calculate scene timings
        audio_duration = await self._get_audio_duration(project.audio_path)
        await self._calculate_scene_timings(project.scenes, audio_duration)
        
        # Step 6: Compile video with ffmpeg
        project.output_path = await self._compile_video(
            project,
            output_dir
        )
        
        logger.success(f"Video generated: {project.output_path}")
        return project
    
    async def _parse_transcript_to_scenes(
        self,
        transcript: str,
        target_scenes: int = 6
    ) -> List[Scene]:
        """Parse transcript into distinct scenes using GPT-4"""
        
        prompt = f"""Analyze this transcript and divide it into {target_scenes} distinct scenes.
For each scene, provide:
1. A short title (3-5 words)
2. A visual description for image generation (1-2 sentences)
3. The transcript segment for that scene

Transcript:
{transcript}

Respond in JSON format:
{{
    "scenes": [
        {{
            "title": "Scene Title",
            "description": "Visual description for image generation",
            "transcript_segment": "The text spoken during this scene"
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
        for i, scene_data in enumerate(result.get("scenes", [])):
            scenes.append(Scene(
                index=i,
                title=scene_data.get("title", f"Scene {i+1}"),
                description=scene_data.get("description", ""),
                transcript_segment=scene_data.get("transcript_segment", ""),
                duration_seconds=0.0  # Calculated later
            ))
        
        return scenes
    
    async def _generate_image_prompt(
        self,
        scene_description: str,
        scene_title: str,
        style_prompt: str
    ) -> str:
        """Generate detailed image prompt for Gemini"""
        
        prompt = f"""Create a detailed image generation prompt for this scene:

Title: {scene_title}
Description: {scene_description}
Style: {style_prompt}

The prompt should:
1. Be specific and detailed
2. Include visual elements, colors, composition
3. Be optimized for AI image generation
4. NOT include any text/words in the image

Respond with ONLY the image prompt, nothing else."""

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
        """Generate image using Google Gemini API"""
        
        image_path = os.path.join(output_dir, f"scene_{scene_index:03d}.png")
        
        # Use Gemini's Imagen model via the API
        url = f"{self.gemini_endpoint}/models/imagen-3.0-generate-001:predict"
        
        payload = {
            "instances": [{"prompt": prompt}],
            "parameters": {
                "sampleCount": 1,
                "aspectRatio": "16:9",
                "negativePrompt": "text, words, letters, watermark, blurry, low quality"
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.google_api_key
        }
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    # Decode base64 image
                    if "predictions" in result and result["predictions"]:
                        import base64
                        image_data = base64.b64decode(
                            result["predictions"][0].get("bytesBase64Encoded", "")
                        )
                        with open(image_path, "wb") as f:
                            f.write(image_data)
                        return image_path
                
                # Fallback to Gemini 2.0 Flash for image generation
                logger.warning(f"Imagen failed ({response.status_code}), trying Gemini Flash")
                return await self._generate_with_gemini_flash(prompt, image_path)
                
        except Exception as e:
            logger.error(f"Gemini image generation failed: {e}")
            # Create placeholder
            return await self._create_placeholder_image(prompt, image_path)
    
    async def _generate_with_gemini_flash(
        self,
        prompt: str,
        output_path: str
    ) -> str:
        """Fallback: Use Gemini 2.0 Flash for image generation"""
        
        url = f"{self.gemini_endpoint}/models/gemini-2.0-flash-exp:generateContent"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"Generate an image: {prompt}"
                }]
            }],
            "generationConfig": {
                "responseModalities": ["IMAGE", "TEXT"]
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.google_api_key
        }
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    # Extract image from response
                    for candidate in result.get("candidates", []):
                        for part in candidate.get("content", {}).get("parts", []):
                            if "inlineData" in part:
                                import base64
                                image_data = base64.b64decode(
                                    part["inlineData"].get("data", "")
                                )
                                with open(output_path, "wb") as f:
                                    f.write(image_data)
                                return output_path
                
                logger.warning(f"Gemini Flash failed: {response.status_code}")
                return await self._create_placeholder_image(prompt, output_path)
                
        except Exception as e:
            logger.error(f"Gemini Flash failed: {e}")
            return await self._create_placeholder_image(prompt, output_path)
    
    async def _create_placeholder_image(
        self,
        prompt: str,
        output_path: str
    ) -> str:
        """Create a placeholder image with text description"""
        
        # Use ffmpeg to create a gradient background with text
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", "color=c=0x1a1a2e:s=1920x1080:d=1",
            "-vf", f"drawtext=text='{prompt[:100]}...':fontsize=32:fontcolor=white:x=(w-tw)/2:y=(h-th)/2",
            "-frames:v", "1",
            output_path
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return output_path
        except Exception as e:
            logger.error(f"Placeholder creation failed: {e}")
            # Create minimal placeholder
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", "color=c=0x1a1a2e:s=1920x1080:d=1",
                "-frames:v", "1",
                output_path
            ]
            subprocess.run(cmd, capture_output=True)
            return output_path
    
    async def _generate_voice_audio(
        self,
        transcript: str,
        output_dir: str
    ) -> str:
        """Generate voice audio using OpenAI TTS"""
        
        audio_path = os.path.join(output_dir, "voice.mp3")
        
        response = self.openai.audio.speech.create(
            model="tts-1-hd",
            voice="onyx",  # Deep male voice
            input=transcript
        )
        
        response.stream_to_file(audio_path)
        logger.info(f"Generated voice audio: {audio_path}")
        
        return audio_path
    
    async def _get_audio_duration(self, audio_path: str) -> float:
        """Get audio duration in seconds"""
        
        result = subprocess.run([
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ], capture_output=True, text=True)
        
        return float(result.stdout.strip())
    
    async def _calculate_scene_timings(
        self,
        scenes: List[Scene],
        total_duration: float
    ):
        """Calculate start time and duration for each scene"""
        
        # Distribute duration proportionally based on transcript length
        total_chars = sum(len(s.transcript_segment) for s in scenes)
        
        current_time = 0.0
        for scene in scenes:
            char_ratio = len(scene.transcript_segment) / total_chars if total_chars > 0 else 1/len(scenes)
            scene.duration_seconds = total_duration * char_ratio
            scene.start_time = current_time
            current_time += scene.duration_seconds
    
    async def _compile_video(
        self,
        project: VideoProject,
        output_dir: str
    ) -> str:
        """Compile final video with ffmpeg"""
        
        output_path = os.path.join(output_dir, f"{project.name.replace(' ', '_')}.mp4")
        
        # Create filter complex for scene transitions with titles and captions
        filter_parts = []
        inputs = []
        
        # Add each scene image
        for i, scene in enumerate(project.scenes):
            if scene.image_path:
                inputs.extend(["-loop", "1", "-t", str(scene.duration_seconds), "-i", scene.image_path])
        
        # Build filter complex
        n_scenes = len(project.scenes)
        
        # Scale and concat scenes
        for i in range(n_scenes):
            filter_parts.append(f"[{i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v{i}];")
        
        # Add titles and captions
        for i, scene in enumerate(project.scenes):
            title_text = scene.title.replace("'", "'\\''")
            caption_text = scene.transcript_segment[:150].replace("'", "'\\''").replace("\n", " ")
            
            filter_parts.append(
                f"[v{i}]drawtext=text='{title_text}':fontsize=48:fontcolor=white:"
                f"x=(w-tw)/2:y=50:box=1:boxcolor=black@0.6:boxborderw=10,"
                f"drawtext=text='{caption_text}':fontsize=32:fontcolor=white:"
                f"x=(w-tw)/2:y=h-100:box=1:boxcolor=black@0.7:boxborderw=8[t{i}];"
            )
        
        # Concat all scenes
        concat_inputs = "".join([f"[t{i}]" for i in range(n_scenes)])
        filter_parts.append(f"{concat_inputs}concat=n={n_scenes}:v=1:a=0[outv]")
        
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
        
        logger.info(f"Compiling video with ffmpeg...")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.success(f"Video compiled: {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg failed: {e.stderr}")
            raise


# =====================================================
# Script to generate Voice Clone feature video
# =====================================================

async def generate_voice_clone_video():
    """Generate a YouTube video about Voice Clone features"""
    
    transcript = """
    Welcome to MediaPoster's Voice Clone System - a powerful suite of tools for creating 
    AI-generated voice content.
    
    Let's explore the six key features that make up this system.
    
    First, we have the Modal Voice Clone Deployment Script. This allows you to deploy 
    voice cloning models to Modal's GPU cloud infrastructure, enabling fast and scalable 
    voice synthesis for your content creation needs.
    
    Second is Voice Reference Management. This feature lets you upload, organize, and 
    manage your voice reference audio files. The system analyzes audio quality and provides 
    recommendations for optimal voice cloning results.
    
    Third, the Voice Clone API Client provides a clean interface to interact with the 
    Modal-hosted voice cloning service. It handles authentication, request formatting, 
    and response parsing automatically.
    
    Fourth, the Voice Clone Database Schema stores all your voice profiles, generation 
    history, and usage statistics in a structured format, making it easy to track and 
    manage your voice cloning projects.
    
    Fifth is the TTS Pipeline Voice Clone Option. This integrates voice cloning directly 
    into the text-to-speech pipeline, allowing you to choose between standard TTS voices 
    or your custom cloned voices for any content generation task.
    
    Finally, the Script-to-Voiceover Worker automates the entire process of converting 
    written scripts into professional voiceovers using your cloned voice, complete with 
    proper pacing and emphasis.
    
    Together, these six features provide a complete voice cloning solution for content 
    creators who want to scale their video production while maintaining a consistent 
    personal voice across all content.
    """
    
    service = GeminiVideoService()
    
    output_dir = "/tmp/voice_clone_video"
    
    project = await service.create_video_from_transcript(
        transcript=transcript,
        title="Voice Clone Features Overview",
        output_dir=output_dir,
        style_prompt="modern tech illustration, blue and purple gradients, clean UI mockups, professional"
    )
    
    print(f"\n✅ Video generated: {project.output_path}")
    print(f"📁 Output directory: {output_dir}")
    print(f"🎬 Scenes: {len(project.scenes)}")
    
    return project


if __name__ == "__main__":
    asyncio.run(generate_voice_clone_video())
