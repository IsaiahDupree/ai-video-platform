"""
Visual Content Campaign Service
Generates Instagram carousels and TikTok picture/music videos
using the 5 stages of customer awareness.
"""
import os
import json
import random
import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Literal
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
from uuid import UUID

from openai import OpenAI
from sqlalchemy import create_engine, text
from loguru import logger

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres")


class ContentFormat(str, Enum):
    INSTAGRAM_CAROUSEL = "instagram_carousel"
    TIKTOK_PICTURE_VIDEO = "tiktok_picture_video"
    INSTAGRAM_REEL = "instagram_reel"
    TIKTOK_VIDEO = "tiktok_video"


class AwarenessStage(str, Enum):
    UNAWARE = "unaware"
    PROBLEM_AWARE = "problem_aware"
    SOLUTION_AWARE = "solution_aware"
    PRODUCT_AWARE = "product_aware"
    MOST_AWARE = "most_aware"


class ContentType(str, Enum):
    HOOK = "hook"
    AUTHORITY = "authority"
    STORY = "story"
    EMOTIONAL = "emotional"
    CTA = "cta"


@dataclass
class Product:
    id: str
    name: str
    slug: str
    description: str
    website_url: str
    tagline: str
    key_features: List[str]
    target_audience: str
    voice_style: str


@dataclass
class VisualTemplate:
    id: str
    name: str
    format: ContentFormat
    template_type: str
    slide_count: int
    structure_json: Dict
    animation_preset: str
    music_mood: Optional[str]


@dataclass
class CarouselSlide:
    slide_number: int
    slide_type: str
    headline: str
    body_text: Optional[str]
    visual_description: str
    layout: str


@dataclass
class GeneratedCarousel:
    title: str
    hook_text: str
    slides: List[CarouselSlide]
    caption: str
    hashtags: List[str]


AWARENESS_GUIDANCE = {
    AwarenessStage.UNAWARE: "Audience doesn't know they have a problem. Use relatable situations, pattern interrupts.",
    AwarenessStage.PROBLEM_AWARE: "Audience knows the problem but not solutions. Agitate the pain, validate frustration.",
    AwarenessStage.SOLUTION_AWARE: "Audience knows solutions exist. Show why YOUR solution is different/better.",
    AwarenessStage.PRODUCT_AWARE: "Audience knows your product. Features, testimonials, overcome objections.",
    AwarenessStage.MOST_AWARE: "Ready to act. Urgency, special offers, direct CTAs."
}

CONTENT_TYPE_GUIDANCE = {
    ContentType.HOOK: "Pattern interrupt, curiosity gap, bold statement. Stop the scroll.",
    ContentType.AUTHORITY: "Share expertise, insights, behind-the-scenes. Build trust.",
    ContentType.STORY: "Personal anecdotes, customer stories, journey narratives.",
    ContentType.EMOTIONAL: "Tap into feelings, aspirations, fears, desires.",
    ContentType.CTA: "Direct call to action, clear next step, urgency."
}


class VisualCampaignService:
    """
    Manages automated visual content campaigns:
    - Instagram carousels (2-10 slides)
    - TikTok picture/music videos
    """
    
    # Blotato account IDs
    INSTAGRAM_ACCOUNTS = ["807", "670", "1369", "4508"]  # Multiple IG accounts
    TIKTOK_ACCOUNTS = ["710", "243", "4508", "571"]  # Multiple TikTok accounts
    
    def __init__(self):
        self.engine = create_engine(DATABASE_URL)
        self.openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Content per day configuration
        self.carousels_per_day = 10  # Instagram carousels
        self.picture_videos_per_day = 15  # TikTok picture videos
        
        logger.info(f"VisualCampaignService initialized - {self.carousels_per_day} carousels + {self.picture_videos_per_day} videos/day")
    
    # =========================================================================
    # DATA ACCESS
    # =========================================================================
    
    def get_products(self) -> List[Product]:
        """Get all campaign products."""
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, name, slug, description, website_url, tagline,
                       key_features, target_audience, voice_style
                FROM campaign_products
                ORDER BY created_at
            """))
            
            products = []
            for row in result.fetchall():
                features = row[6] if isinstance(row[6], list) else json.loads(row[6] or '[]')
                products.append(Product(
                    id=str(row[0]),
                    name=row[1],
                    slug=row[2],
                    description=row[3] or '',
                    website_url=row[4] or '',
                    tagline=row[5] or '',
                    key_features=features,
                    target_audience=row[7] or '',
                    voice_style=row[8] or ''
                ))
            return products
    
    def get_templates(self, format: ContentFormat) -> List[VisualTemplate]:
        """Get templates for a specific format."""
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, name, format, template_type, slide_count, 
                       structure_json, animation_preset, music_mood
                FROM visual_templates
                WHERE format = :format AND is_active = TRUE
                ORDER BY times_used DESC
            """), {"format": format.value})
            
            templates = []
            for row in result.fetchall():
                templates.append(VisualTemplate(
                    id=str(row[0]),
                    name=row[1],
                    format=ContentFormat(row[2]),
                    template_type=row[3],
                    slide_count=row[4],
                    structure_json=row[5] if isinstance(row[5], dict) else json.loads(row[5]),
                    animation_preset=row[6],
                    music_mood=row[7]
                ))
            return templates
    
    def get_user_style(self) -> Dict:
        """Get user's writing style."""
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT sample_tweets, tone_keywords, avoid_words, style_description
                FROM user_writing_styles
                WHERE user_id = 'default'
            """))
            
            row = result.fetchone()
            if row:
                return {
                    'sample_tweets': row[0] if isinstance(row[0], list) else json.loads(row[0] or '[]'),
                    'tone_keywords': row[1] if isinstance(row[1], list) else json.loads(row[1] or '[]'),
                    'avoid_words': row[2] if isinstance(row[2], list) else json.loads(row[2] or '[]'),
                    'style_description': row[3] or ''
                }
            return {'tone_keywords': ['casual', 'direct'], 'avoid_words': [], 'style_description': ''}
    
    # =========================================================================
    # CAROUSEL GENERATION
    # =========================================================================
    
    def generate_carousel(
        self,
        product: Product,
        template: VisualTemplate,
        awareness_stage: AwarenessStage,
        content_type: ContentType
    ) -> GeneratedCarousel:
        """Generate a complete Instagram carousel using AI."""
        
        user_style = self.get_user_style()
        structure = template.structure_json
        
        prompt = f"""Generate an Instagram carousel for:

PRODUCT: {product.name}
- Description: {product.description}
- Website: {product.website_url}
- Key Features: {', '.join(product.key_features[:3])}
- Target Audience: {product.target_audience}

TEMPLATE: {template.name} ({template.template_type})
- Slide Count: {template.slide_count}
- Structure: {json.dumps(structure, indent=2)}

AWARENESS STAGE: {awareness_stage.value}
{AWARENESS_GUIDANCE.get(awareness_stage, '')}

CONTENT TYPE: {content_type.value}
{CONTENT_TYPE_GUIDANCE.get(content_type, '')}

WRITING STYLE:
- Tone: {', '.join(user_style.get('tone_keywords', ['casual']))}
- {user_style.get('style_description', 'Direct and engaging')}

Generate a JSON response with:
{{
    "title": "Carousel title for internal reference",
    "hook_text": "First slide hook that stops the scroll",
    "slides": [
        {{
            "slide_number": 1,
            "slide_type": "hook",
            "headline": "Bold headline text",
            "body_text": "Supporting text (optional)",
            "visual_description": "Description of visual/background",
            "layout": "centered_text"
        }},
        // ... more slides based on template structure
    ],
    "caption": "Instagram caption with emojis (2000 chars max)",
    "hashtags": ["relevant", "hashtags", "max10"]
}}

IMPORTANT:
- Match the template structure exactly
- Each slide should be impactful and scannable
- Headlines should be SHORT and PUNCHY (max 8 words)
- Visual descriptions should be specific for Remotion rendering
- Caption should include CTA and be engaging
- Max 10 hashtags, mix of broad and niche"""

        response = self.openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert social media content creator specializing in viral Instagram carousels. You understand the customer awareness journey and create content that converts. Always respond with valid JSON."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=2000,
            temperature=0.8
        )
        
        result = json.loads(response.choices[0].message.content)
        
        slides = [
            CarouselSlide(
                slide_number=s.get('slide_number', i+1),
                slide_type=s.get('slide_type', 'content'),
                headline=s.get('headline', ''),
                body_text=s.get('body_text'),
                visual_description=s.get('visual_description', ''),
                layout=s.get('layout', 'centered_text')
            )
            for i, s in enumerate(result.get('slides', []))
        ]
        
        return GeneratedCarousel(
            title=result.get('title', f'{product.name} Carousel'),
            hook_text=result.get('hook_text', ''),
            slides=slides,
            caption=result.get('caption', ''),
            hashtags=result.get('hashtags', [])[:10]
        )
    
    # =========================================================================
    # TIKTOK PICTURE VIDEO GENERATION
    # =========================================================================
    
    def generate_picture_video(
        self,
        product: Product,
        template: VisualTemplate,
        awareness_stage: AwarenessStage,
        content_type: ContentType
    ) -> Dict:
        """Generate a TikTok picture/music video using AI."""
        
        user_style = self.get_user_style()
        structure = template.structure_json
        
        prompt = f"""Generate a TikTok picture video (slideshow with music) for:

PRODUCT: {product.name}
- Description: {product.description}
- Website: {product.website_url}
- Key Features: {', '.join(product.key_features[:3])}

TEMPLATE: {template.name} ({template.template_type})
- Total Duration: {structure.get('total_duration', 15)} seconds
- Slide Structure: {json.dumps(structure.get('slides', []), indent=2)}

AWARENESS STAGE: {awareness_stage.value}
{AWARENESS_GUIDANCE.get(awareness_stage, '')}

CONTENT TYPE: {content_type.value}
{CONTENT_TYPE_GUIDANCE.get(content_type, '')}

MUSIC MOOD: {template.music_mood or 'upbeat'}

Generate a JSON response with:
{{
    "title": "Video title for internal reference",
    "hook_text": "Opening hook (first 2 seconds)",
    "slides": [
        {{
            "slide_number": 1,
            "slide_type": "hook",
            "duration_seconds": 2,
            "text_overlay": "Bold text on screen",
            "visual_description": "Background visual description",
            "animation": "bounce"
        }},
        // ... more slides
    ],
    "caption": "TikTok caption (150 chars max, punchy)",
    "hashtags": ["trending", "hashtags"]
}}

IMPORTANT:
- First slide MUST grab attention in under 2 seconds
- Text overlays should be SHORT (max 6 words)
- Total duration should match template ({structure.get('total_duration', 15)}s)
- TikTok captions are SHORT - make every word count
- Include trending hashtags relevant to the topic"""

        response = self.openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a TikTok content expert who creates viral picture videos. You understand trends, hooks, and what makes content shareable. Always respond with valid JSON."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.9
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    
    # =========================================================================
    # BATCH GENERATION
    # =========================================================================
    
    def generate_batch_carousels(
        self,
        product: Product,
        count: int = 5
    ) -> List[Dict]:
        """Generate a batch of carousels for a product."""
        
        templates = self.get_templates(ContentFormat.INSTAGRAM_CAROUSEL)
        if not templates:
            logger.warning("No carousel templates found")
            return []
        
        stages = list(AwarenessStage)
        types = list(ContentType)
        carousels = []
        
        for i in range(count):
            template = templates[i % len(templates)]
            stage = stages[i % len(stages)]
            content_type = types[i % len(types)]
            
            try:
                carousel = self.generate_carousel(product, template, stage, content_type)
                carousels.append({
                    'product_id': product.id,
                    'product_slug': product.slug,
                    'template_id': template.id,
                    'template_name': template.name,
                    'awareness_stage': stage.value,
                    'content_type': content_type.value,
                    'format': ContentFormat.INSTAGRAM_CAROUSEL.value,
                    'title': carousel.title,
                    'hook_text': carousel.hook_text,
                    'slides': [asdict(s) for s in carousel.slides],
                    'caption': carousel.caption,
                    'hashtags': carousel.hashtags
                })
                logger.info(f"Generated carousel {i+1}/{count} for {product.slug}: {stage.value}/{content_type.value}")
            except Exception as e:
                logger.error(f"Failed to generate carousel: {e}")
        
        return carousels
    
    def generate_batch_picture_videos(
        self,
        product: Product,
        count: int = 5
    ) -> List[Dict]:
        """Generate a batch of TikTok picture videos for a product."""
        
        templates = self.get_templates(ContentFormat.TIKTOK_PICTURE_VIDEO)
        if not templates:
            logger.warning("No TikTok templates found")
            return []
        
        stages = list(AwarenessStage)
        types = list(ContentType)
        videos = []
        
        for i in range(count):
            template = templates[i % len(templates)]
            stage = stages[i % len(stages)]
            content_type = types[i % len(types)]
            
            try:
                video = self.generate_picture_video(product, template, stage, content_type)
                videos.append({
                    'product_id': product.id,
                    'product_slug': product.slug,
                    'template_id': template.id,
                    'template_name': template.name,
                    'awareness_stage': stage.value,
                    'content_type': content_type.value,
                    'format': ContentFormat.TIKTOK_PICTURE_VIDEO.value,
                    'music_mood': template.music_mood,
                    **video
                })
                logger.info(f"Generated video {i+1}/{count} for {product.slug}: {stage.value}/{content_type.value}")
            except Exception as e:
                logger.error(f"Failed to generate video: {e}")
        
        return videos
    
    # =========================================================================
    # SCHEDULING
    # =========================================================================
    
    def schedule_content(
        self,
        content_items: List[Dict],
        platform: str,
        start_time: Optional[datetime] = None,
        interval_minutes: int = 90
    ) -> List[str]:
        """Schedule content items for posting."""
        
        start_time = start_time or datetime.now(timezone.utc)
        accounts = self.INSTAGRAM_ACCOUNTS if platform == 'instagram' else self.TIKTOK_ACCOUNTS
        scheduled_ids = []
        
        with self.engine.connect() as conn:
            for i, item in enumerate(content_items):
                scheduled_time = start_time + timedelta(minutes=interval_minutes * i)
                account_id = accounts[i % len(accounts)]
                
                result = conn.execute(text("""
                    INSERT INTO scheduled_visual_content
                    (product_id, template_id, format, awareness_stage, content_type,
                     title, hook_text, slides_json, caption, hashtags,
                     scheduled_time, platform, blotato_account_id, status)
                    VALUES
                    (:product_id, :template_id, :format, :awareness_stage, :content_type,
                     :title, :hook_text, :slides_json, :caption, :hashtags,
                     :scheduled_time, :platform, :blotato_account_id, 'pending')
                    RETURNING id
                """), {
                    "product_id": item['product_id'],
                    "template_id": item.get('template_id'),
                    "format": item['format'],
                    "awareness_stage": item['awareness_stage'],
                    "content_type": item['content_type'],
                    "title": item['title'],
                    "hook_text": item.get('hook_text', ''),
                    "slides_json": json.dumps(item.get('slides', [])),
                    "caption": item.get('caption', ''),
                    "hashtags": item.get('hashtags', []),
                    "scheduled_time": scheduled_time,
                    "platform": platform,
                    "blotato_account_id": account_id
                })
                
                row = result.fetchone()
                if row:
                    scheduled_ids.append(str(row[0]))
            
            conn.commit()
        
        logger.info(f"Scheduled {len(scheduled_ids)} {platform} content items")
        return scheduled_ids
    
    # =========================================================================
    # MAIN CAMPAIGN RUNNER
    # =========================================================================
    
    async def run_daily_visual_campaign(self):
        """Generate and schedule daily visual content."""
        logger.info("=" * 60)
        logger.info("Starting Daily Visual Content Campaign")
        logger.info("=" * 60)
        
        products = self.get_products()
        
        all_carousels = []
        all_videos = []
        
        carousels_per_product = self.carousels_per_day // len(products)
        videos_per_product = self.picture_videos_per_day // len(products)
        
        for product in products:
            logger.info(f"\n📦 Generating content for {product.name}...")
            
            # Generate carousels
            carousels = self.generate_batch_carousels(product, count=carousels_per_product)
            all_carousels.extend(carousels)
            
            # Generate TikTok videos
            videos = self.generate_batch_picture_videos(product, count=videos_per_product)
            all_videos.extend(videos)
        
        # Shuffle for variety
        random.shuffle(all_carousels)
        random.shuffle(all_videos)
        
        # Schedule content
        carousel_ids = self.schedule_content(all_carousels, 'instagram', interval_minutes=144)  # ~10/day
        video_ids = self.schedule_content(all_videos, 'tiktok', interval_minutes=96)  # ~15/day
        
        logger.info(f"\n✅ Scheduled {len(carousel_ids)} carousels + {len(video_ids)} videos")
        
        return {
            'carousels_scheduled': len(carousel_ids),
            'videos_scheduled': len(video_ids),
            'products': [p.name for p in products]
        }


# Singleton
_visual_campaign_service = None

def get_visual_campaign_service() -> VisualCampaignService:
    global _visual_campaign_service
    if _visual_campaign_service is None:
        _visual_campaign_service = VisualCampaignService()
    return _visual_campaign_service


if __name__ == "__main__":
    import sys
    
    service = get_visual_campaign_service()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "generate":
            import asyncio
            result = asyncio.run(service.run_daily_visual_campaign())
            print(json.dumps(result, indent=2))
        
        elif command == "templates":
            for fmt in [ContentFormat.INSTAGRAM_CAROUSEL, ContentFormat.TIKTOK_PICTURE_VIDEO]:
                templates = service.get_templates(fmt)
                print(f"\n{fmt.value}:")
                for t in templates:
                    print(f"  - {t.name} ({t.template_type})")
        
        else:
            print(f"Unknown command: {command}")
    else:
        print("Visual Campaign Service")
        print("Commands: generate, templates")
