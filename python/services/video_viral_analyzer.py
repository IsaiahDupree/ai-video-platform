"""
Video Viral Analyzer Service
Analyzes videos for viral potential using AI and the FATE model
"""
from openai import AsyncOpenAI
from typing import Dict, Optional, List
import json
import time
from loguru import logger

VIRAL_ANALYSIS_PROMPT = """
Analyze this video for viral potential using the FATE model and viral content principles.

VIDEO INFO:
- Filename: {filename}
- Duration: {duration} seconds
{transcript_section}

ANALYZE FOR VIRAL POTENTIAL:

1. HOOK (First 3-5 seconds):
   - Hook Type: Choose ONE: [pain, curiosity, aspirational, contrarian, gap, absurd]
   - Hook Strength: Score 0.0-1.0 (how well it stops scrolling)
   - Brief analysis of why it works or doesn't

2. CONTENT CLASSIFICATION:
   - Main Topic: One clear primary topic
   - Related Topics: List 3-5 related topics as tags
   - Content Style: Choose ONE: [tutorial, story, rant, vlog, review, explainer, demo, interview]
   - Pacing: Choose ONE: [fast, medium, slow]
   - Complexity: Choose ONE: [simple, medium, technical]

3. EMOTION ANALYSIS:
   - Primary Emotion: Choose ONE: [relief, excitement, curiosity, fomo, frustration, hope, surprise]
   - Intensity: Score 0.0-1.0 (how strongly the emotion is evoked)

4. FATE MODEL SCORES (0.0-1.0 each):
   - Focus: How specific and targeted is the content? (narrow audience = higher)
   - Authority: Credibility signals, proof, expertise shown
   - Tribe: Community/identity appeal, "us vs them", shared experience
   - Emotion: Overall emotional impact across the video
   - Combined FATE: Average of the four scores

5. CALL TO ACTION:
   - Has CTA: true/false
   - CTA Type: Choose ONE if has_cta is true: [engagement, conversion, open_loop, conversation]
   - CTA Clarity: Score 0.0-1.0 (how clear and actionable)
   - CTA Text: Extract the actual CTA phrase if present

6. VISUAL STYLE (best guess from context):
   - Primary Shot: Choose ONE: [talking_head, screen_record, b_roll, mixed, animation]
   - Text Overlays: true/false (are there on-screen captions/text?)
   - Meme Elements: true/false (reaction faces, memes, cultural references?)

7. KEY INSIGHTS:
   - Top Quote: The single best/most memorable line
   - Virality Prediction: Choose ONE: [low, medium, high]
   - Recommendations: 3 specific, actionable improvements

Return ONLY valid JSON (no markdown, no code blocks):
{{
  "hook": {{
    "type": "pain",
    "strength": 0.85,
    "analysis": "Opens with relatable pain point that immediately resonates"
  }},
  "content": {{
    "main_topic": "Email automation",
    "topics": ["automation", "productivity", "AI", "email", "workflows"],
    "style": "tutorial",
    "pacing": "fast",
    "complexity": "medium"
  }},
  "emotion": {{
    "type": "relief",
    "intensity": 0.7
  }},
  "fate": {{
    "focus": 0.9,
    "authority": 0.7,
    "tribe": 0.6,
    "emotion": 0.8,
    "combined": 0.75
  }},
  "cta": {{
    "has_cta": true,
    "type": "engagement",
    "clarity": 0.8,
    "text": "Comment 'AUTOMATION' to get the template"
  }},
  "visual": {{
    "primary_shot": "screen_record",
    "text_overlays": true,
    "meme_elements": false
  }},
  "insights": {{
    "top_quote": "Stop doing email manually like it's 1995",
    "virality_prediction": "high",
    "recommendations": [
      "Add face cam overlay for 2-3 seconds in the hook to build connection",
      "Make the CTA more specific with exact steps",
      "Add a pattern interrupt at 30 seconds to maintain retention"
    ]
  }}
}}
"""


class VideoViralAnalyzer:
    """
    Analyzes videos for viral potential using AI
    """
    
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
        logger.info(f"VideoViralAnalyzer initialized with model: {model}")
    
    async def analyze_video(
        self,
        video_id: str,
        filename: str,
        duration_sec: int,
        transcript: Optional[str] = None,
        existing_analysis: Optional[Dict] = None
    ) -> Dict:
        """
        Analyze a video for viral potential
        
        Args:
            video_id: UUID of the video
            filename: Name of the video file
            duration_sec: Duration in seconds
            transcript: Optional transcript text
            existing_analysis: Optional existing analysis to update
        
        Returns:
            Dict with analysis results ready for database insertion
        """
        start_time = time.time()
        
        try:
            logger.info(f"Analyzing video {video_id}: {filename} ({duration_sec}s)")
            
            # Build transcript section
            if transcript:
                # Truncate if too long (max ~3000 chars to stay within token limits)
                truncated_transcript = transcript[:3000]
                if len(transcript) > 3000:
                    truncated_transcript += "...[truncated]"
                transcript_section = f"- Transcript:\n{truncated_transcript}"
            else:
                transcript_section = "- Transcript: Not available (analyzing from filename and metadata)"
            
            # Build prompt
            prompt = VIRAL_ANALYSIS_PROMPT.format(
                filename=filename,
                duration=duration_sec,
                transcript_section=transcript_section
            )
            
            # Call OpenAI
            logger.debug(f"Calling OpenAI API with {self.model}")
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert in viral video analysis, specializing in the FATE model (Focus, Authority, Tribe, Emotion). Analyze videos objectively and provide actionable insights."
                    },
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,  # Lower temperature for more consistent analysis
                max_tokens=1500
            )
            
            # Parse response
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            logger.debug(f"OpenAI response: {content[:200]}...")
            
            analysis = json.loads(content)
            
            # Calculate processing time
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Build result for database
            result = {
                "video_id": video_id,
                "analysis_status": "complete",
                "analyzed_at": "now()",  # Will be converted by DB
                
                # Hook
                "hook_type": analysis["hook"]["type"],
                "hook_strength_score": float(analysis["hook"]["strength"]),
                
                # Content
                "main_topic": analysis["content"]["main_topic"],
                "topics": json.dumps(analysis["content"]["topics"]),
                "content_style": analysis["content"]["style"],
                "pacing": analysis["content"]["pacing"],
                "complexity_level": analysis["content"]["complexity"],
                
                # Emotion
                "emotion_type": analysis["emotion"]["type"],
                "emotion_intensity": float(analysis["emotion"]["intensity"]),
                
                # FATE Model
                "focus_score": float(analysis["fate"]["focus"]),
                "authority_score": float(analysis["fate"]["authority"]),
                "tribe_score": float(analysis["fate"]["tribe"]),
                "emotion_score": float(analysis["fate"]["emotion"]),
                "fate_combined_score": float(analysis["fate"]["combined"]),
                
                # CTA
                "has_cta": analysis["cta"]["has_cta"],
                "cta_type": analysis["cta"].get("type"),
                "cta_clarity_score": float(analysis["cta"].get("clarity", 0)),
                "cta_text": analysis["cta"].get("text"),
                
                # Visual
                "primary_shot_type": analysis["visual"]["primary_shot"],
                "has_text_overlays": analysis["visual"]["text_overlays"],
                "has_meme_elements": analysis["visual"]["meme_elements"],
                
                # Insights
                "transcript_summary": analysis["insights"]["top_quote"],
                "key_quotes": json.dumps([analysis["insights"]["top_quote"]]),
                "recommendations": json.dumps(analysis["insights"]["recommendations"]),
                "virality_prediction": analysis["insights"]["virality_prediction"],
                
                # Metadata
                "processing_time_ms": processing_time_ms,
                "model_version": self.model,
                "tokens_used": tokens_used
            }
            
            logger.success(
                f"Analysis complete for {video_id}: "
                f"FATE={result['fate_combined_score']:.2f}, "
                f"Hook={result['hook_type']}, "
                f"Virality={result['virality_prediction']}, "
                f"Time={processing_time_ms}ms"
            )
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response for {video_id}: {e}")
            processing_time_ms = int((time.time() - start_time) * 1000)
            return {
                "video_id": video_id,
                "analysis_status": "failed",
                "error_message": f"JSON parsing error: {str(e)}",
                "processing_time_ms": processing_time_ms
            }
            
        except Exception as e:
            logger.error(f"Analysis failed for {video_id}: {e}")
            processing_time_ms = int((time.time() - start_time) * 1000)
            return {
                "video_id": video_id,
                "analysis_status": "failed",
                "error_message": str(e),
                "processing_time_ms": processing_time_ms
            }
    
    async def batch_analyze(
        self,
        videos: List[Dict],
        max_concurrent: int = 3
    ) -> List[Dict]:
        """
        Analyze multiple videos with rate limiting
        
        Args:
            videos: List of video dicts with id, filename, duration_sec, transcript
            max_concurrent: Max concurrent API calls
        
        Returns:
            List of analysis results
        """
        import asyncio
        
        logger.info(f"Batch analyzing {len(videos)} videos (max {max_concurrent} concurrent)")
        
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def analyze_with_limit(video):
            async with semaphore:
                return await self.analyze_video(
                    video_id=video["id"],
                    filename=video["filename"],
                    duration_sec=video["duration_sec"],
                    transcript=video.get("transcript")
                )
        
        results = await asyncio.gather(*[
            analyze_with_limit(video) for video in videos
        ])
        
        logger.success(f"Batch analysis complete: {len(results)} videos processed")
        
        return results
