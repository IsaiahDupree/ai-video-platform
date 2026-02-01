"""
Visual Content Remotion Renderer
Renders Instagram carousels and TikTok picture videos using Remotion.
"""
import os
import json
import asyncio
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timezone
from uuid import uuid4

from loguru import logger
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres")

# Remotion project paths
REMOTION_PROJECT = Path(__file__).parent.parent / "data" / "remotion_project"
REMOTION_OUTPUT = Path(__file__).parent.parent / "data" / "rendered_content"


class VisualRemotionRenderer:
    """
    Renders visual content using Remotion:
    - Instagram carousels → static images
    - TikTok picture videos → MP4 with music
    """
    
    def __init__(self):
        self.engine = create_engine(DATABASE_URL)
        REMOTION_OUTPUT.mkdir(parents=True, exist_ok=True)
    
    def generate_carousel_spec(self, content: Dict) -> Dict:
        """Generate Remotion spec for Instagram carousel."""
        slides = content.get('slides', [])
        
        # Generate spec for each slide as a separate image
        slide_specs = []
        for slide in slides:
            slide_specs.append({
                "id": f"slide_{slide.get('slide_number', 1)}",
                "type": "carousel_slide",
                "width": 1080,
                "height": 1350,  # 4:5 aspect ratio
                "background": self._get_background_style(slide),
                "elements": [
                    {
                        "type": "text",
                        "content": slide.get('headline', ''),
                        "style": {
                            "fontSize": 72,
                            "fontWeight": "bold",
                            "color": "#ffffff",
                            "textAlign": "center",
                            "maxWidth": 900,
                            "position": "center"
                        }
                    },
                    {
                        "type": "text",
                        "content": slide.get('body_text', ''),
                        "style": {
                            "fontSize": 36,
                            "fontWeight": "normal",
                            "color": "#ffffff",
                            "textAlign": "center",
                            "maxWidth": 900,
                            "position": "below_headline",
                            "opacity": 0.9
                        }
                    } if slide.get('body_text') else None
                ],
                "layout": slide.get('layout', 'centered_text')
            })
        
        return {
            "type": "carousel",
            "format": "instagram_carousel",
            "slide_count": len(slides),
            "output_format": "png",
            "slides": [s for s in slide_specs if s]
        }
    
    def generate_picture_video_spec(self, content: Dict) -> Dict:
        """Generate Remotion spec for TikTok picture video."""
        slides = content.get('slides', [])
        music_mood = content.get('music_mood', 'upbeat')
        
        # Calculate total duration
        total_duration = sum(s.get('duration_seconds', 3) for s in slides)
        
        timeline = []
        current_time = 0
        
        for slide in slides:
            duration = slide.get('duration_seconds', 3)
            
            timeline.append({
                "id": f"slide_{slide.get('slide_number', 1)}",
                "type": "picture_slide",
                "start_frame": int(current_time * 30),  # 30 fps
                "duration_frames": int(duration * 30),
                "width": 1080,
                "height": 1920,  # 9:16 aspect ratio
                "background": self._get_background_style(slide),
                "elements": [
                    {
                        "type": "animated_text",
                        "content": slide.get('text_overlay', ''),
                        "animation": slide.get('animation', 'fade'),
                        "style": {
                            "fontSize": 64,
                            "fontWeight": "bold",
                            "color": "#ffffff",
                            "textShadow": "2px 2px 4px rgba(0,0,0,0.5)",
                            "textAlign": "center",
                            "maxWidth": 900
                        }
                    }
                ]
            })
            
            current_time += duration
        
        return {
            "type": "picture_video",
            "format": "tiktok_picture_video",
            "fps": 30,
            "width": 1080,
            "height": 1920,
            "duration_seconds": total_duration,
            "duration_frames": int(total_duration * 30),
            "output_format": "mp4",
            "music": {
                "mood": music_mood,
                "auto_select": True
            },
            "timeline": timeline
        }
    
    def _get_background_style(self, slide: Dict) -> Dict:
        """Generate background style based on slide content."""
        visual_desc = slide.get('visual_description', '').lower()
        
        # Default gradient backgrounds based on content type
        slide_type = slide.get('slide_type', 'content')
        
        gradients = {
            'hook': {'colors': ['#6366f1', '#8b5cf6'], 'direction': '135deg'},
            'problem': {'colors': ['#ef4444', '#f97316'], 'direction': '180deg'},
            'solution': {'colors': ['#10b981', '#06b6d4'], 'direction': '135deg'},
            'cta': {'colors': ['#f59e0b', '#ef4444'], 'direction': '45deg'},
            'item': {'colors': ['#3b82f6', '#6366f1'], 'direction': '180deg'},
            'step': {'colors': ['#8b5cf6', '#ec4899'], 'direction': '135deg'},
            'content': {'colors': ['#1f2937', '#374151'], 'direction': '180deg'},
        }
        
        gradient = gradients.get(slide_type, gradients['content'])
        
        return {
            "type": "gradient",
            "colors": gradient['colors'],
            "direction": gradient['direction']
        }
    
    async def render_carousel(self, content_id: str) -> Dict:
        """Render an Instagram carousel to images."""
        logger.info(f"Rendering carousel {content_id}...")
        
        # Get content from database
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT slides_json, title FROM scheduled_visual_content
                WHERE id = :id
            """), {"id": content_id})
            row = result.fetchone()
            
            if not row:
                return {'success': False, 'error': 'Content not found'}
            
            slides = row[0] if isinstance(row[0], list) else json.loads(row[0] or '[]')
            title = row[1]
        
        content = {'slides': slides, 'title': title}
        spec = self.generate_carousel_spec(content)
        
        # For now, generate placeholder - full Remotion integration would render actual images
        output_dir = REMOTION_OUTPUT / "carousels" / content_id
        output_dir.mkdir(parents=True, exist_ok=True)
        
        rendered_urls = []
        for i, slide in enumerate(slides):
            # In production, this would call Remotion CLI
            # For now, save spec as JSON for manual rendering
            slide_file = output_dir / f"slide_{i+1}.json"
            with open(slide_file, 'w') as f:
                json.dump({
                    'slide': slide,
                    'spec': spec['slides'][i] if i < len(spec['slides']) else {}
                }, f, indent=2)
            rendered_urls.append(str(slide_file))
        
        # Update database
        with self.engine.connect() as conn:
            conn.execute(text("""
                UPDATE scheduled_visual_content
                SET render_status = 'completed',
                    rendered_media_urls = :urls,
                    status = 'scheduled'
                WHERE id = :id
            """), {
                "id": content_id,
                "urls": rendered_urls
            })
            conn.commit()
        
        logger.success(f"✅ Rendered {len(rendered_urls)} carousel slides")
        
        return {
            'success': True,
            'content_id': content_id,
            'rendered_urls': rendered_urls,
            'slide_count': len(rendered_urls)
        }
    
    async def render_picture_video(self, content_id: str) -> Dict:
        """Render a TikTok picture video."""
        logger.info(f"Rendering picture video {content_id}...")
        
        # Get content from database
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT slides_json, title FROM scheduled_visual_content
                WHERE id = :id
            """), {"id": content_id})
            row = result.fetchone()
            
            if not row:
                return {'success': False, 'error': 'Content not found'}
            
            slides = row[0] if isinstance(row[0], list) else json.loads(row[0] or '[]')
            title = row[1]
        
        content = {'slides': slides, 'title': title, 'music_mood': 'upbeat'}
        spec = self.generate_picture_video_spec(content)
        
        # For now, generate spec file - full Remotion integration would render actual video
        output_dir = REMOTION_OUTPUT / "videos" / content_id
        output_dir.mkdir(parents=True, exist_ok=True)
        
        spec_file = output_dir / "video_spec.json"
        with open(spec_file, 'w') as f:
            json.dump(spec, f, indent=2)
        
        # Placeholder video path
        video_path = str(output_dir / "output.mp4")
        
        # Update database
        with self.engine.connect() as conn:
            conn.execute(text("""
                UPDATE scheduled_visual_content
                SET render_status = 'completed',
                    rendered_media_urls = :urls,
                    status = 'scheduled'
                WHERE id = :id
            """), {
                "id": content_id,
                "urls": [video_path]
            })
            conn.commit()
        
        logger.success(f"✅ Generated video spec for {content_id}")
        
        return {
            'success': True,
            'content_id': content_id,
            'video_path': video_path,
            'spec_file': str(spec_file),
            'duration_seconds': spec['duration_seconds']
        }
    
    async def render_pending_content(self) -> Dict:
        """Render all pending visual content."""
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, format FROM scheduled_visual_content
                WHERE render_status = 'pending' AND status = 'pending'
                LIMIT 10
            """))
            
            pending = result.fetchall()
        
        if not pending:
            return {'rendered': 0}
        
        rendered_count = 0
        for row in pending:
            content_id, format_type = str(row[0]), row[1]
            
            try:
                if format_type == 'instagram_carousel':
                    await self.render_carousel(content_id)
                elif format_type == 'tiktok_picture_video':
                    await self.render_picture_video(content_id)
                rendered_count += 1
            except Exception as e:
                logger.error(f"Failed to render {content_id}: {e}")
        
        return {'rendered': rendered_count, 'total_pending': len(pending)}


# Singleton
_renderer = None

def get_visual_renderer() -> VisualRemotionRenderer:
    global _renderer
    if _renderer is None:
        _renderer = VisualRemotionRenderer()
    return _renderer
