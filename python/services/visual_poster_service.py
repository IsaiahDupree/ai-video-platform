"""
Visual Content Poster Service
Posts Instagram carousels and TikTok picture videos via Blotato API.
Includes Safari automation fallback.
"""
import os
import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pathlib import Path
import httpx

from sqlalchemy import create_engine, text
from loguru import logger

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres")
BLOTATO_API_URL = os.getenv("BLOTATO_API_URL", "http://localhost:16349")


class VisualPosterService:
    """
    Posts visual content to Instagram and TikTok via Blotato.
    """
    
    def __init__(self):
        self.engine = create_engine(DATABASE_URL)
        self.blotato_url = BLOTATO_API_URL
    
    async def post_to_blotato(
        self,
        account_id: str,
        platform: str,
        caption: str,
        media_urls: List[str],
        hashtags: Optional[List[str]] = None
    ) -> Dict:
        """Post content via Blotato API."""
        
        # Build caption with hashtags
        full_caption = caption
        if hashtags:
            full_caption += "\n\n" + " ".join(f"#{tag}" for tag in hashtags)
        
        # Determine endpoint based on platform and content type
        if platform == "instagram":
            if len(media_urls) > 1:
                endpoint = "/api/v1/post/carousel"
            else:
                endpoint = "/api/v1/post/image"
        else:  # tiktok
            endpoint = "/api/v1/post/video"
        
        payload = {
            "account_id": int(account_id),
            "caption": full_caption,
            "media_urls": media_urls
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.blotato_url}{endpoint}",
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "submission_id": result.get("submission_id"),
                        "platform": platform
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Blotato API error: {response.status_code} - {response.text}"
                    }
        except Exception as e:
            logger.error(f"Blotato API failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def post_scheduled_content(self, content_id: str) -> Dict:
        """Post a specific scheduled content item."""
        
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT svc.id, svc.title, svc.caption, svc.hashtags, svc.platform,
                       svc.blotato_account_id, svc.rendered_media_urls, svc.format,
                       svc.awareness_stage, svc.content_type, svc.product_id, svc.template_id
                FROM scheduled_visual_content svc
                WHERE svc.id = :id AND svc.status IN ('pending', 'scheduled')
            """), {"id": content_id})
            
            row = result.fetchone()
            if not row:
                return {"success": False, "error": "Content not found or already posted"}
        
        content_id = str(row[0])
        title = row[1]
        caption = row[2]
        hashtags = row[3] if isinstance(row[3], list) else []
        platform = row[4]
        account_id = row[5]
        media_urls = row[6] if isinstance(row[6], list) else []
        format_type = row[7]
        awareness_stage = row[8]
        content_type = row[9]
        product_id = row[10]
        template_id = row[11]
        
        logger.info(f"Posting {format_type} to {platform} (account {account_id}): {title}")
        
        # Update status to publishing
        with self.engine.connect() as conn:
            conn.execute(text("""
                UPDATE scheduled_visual_content
                SET status = 'publishing'
                WHERE id = :id
            """), {"id": content_id})
            conn.commit()
        
        # Attempt Blotato posting
        post_result = await self.post_to_blotato(
            account_id=account_id,
            platform=platform,
            caption=caption,
            media_urls=media_urls,
            hashtags=hashtags
        )
        
        if post_result.get("success"):
            # Record as posted
            with self.engine.connect() as conn:
                # Insert into posted_visual_content
                conn.execute(text("""
                    INSERT INTO posted_visual_content
                    (scheduled_content_id, product_id, template_id, format, awareness_stage,
                     content_type, title, caption, platform, blotato_account_id,
                     blotato_submission_id, rendered_media_urls, posted_at)
                    VALUES
                    (:scheduled_id, :product_id, :template_id, :format, :awareness_stage,
                     :content_type, :title, :caption, :platform, :account_id,
                     :submission_id, :media_urls, NOW())
                """), {
                    "scheduled_id": content_id,
                    "product_id": product_id,
                    "template_id": template_id,
                    "format": format_type,
                    "awareness_stage": awareness_stage,
                    "content_type": content_type,
                    "title": title,
                    "caption": caption,
                    "platform": platform,
                    "account_id": account_id,
                    "submission_id": post_result.get("submission_id"),
                    "media_urls": media_urls
                })
                
                # Update scheduled status
                conn.execute(text("""
                    UPDATE scheduled_visual_content
                    SET status = 'posted'
                    WHERE id = :id
                """), {"id": content_id})
                
                conn.commit()
            
            logger.success(f"✅ Posted {format_type} to {platform}: {title}")
            return {"success": True, "content_id": content_id, "platform": platform}
        else:
            # Mark as failed
            with self.engine.connect() as conn:
                conn.execute(text("""
                    UPDATE scheduled_visual_content
                    SET status = 'failed',
                        error_message = :error,
                        retry_count = retry_count + 1
                    WHERE id = :id
                """), {
                    "id": content_id,
                    "error": post_result.get("error", "Unknown error")
                })
                conn.commit()
            
            logger.error(f"❌ Failed to post {format_type}: {post_result.get('error')}")
            return {"success": False, "error": post_result.get("error")}
    
    async def process_due_content(self) -> Dict:
        """Process all content that's due for posting."""
        
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id FROM scheduled_visual_content
                WHERE status IN ('pending', 'scheduled')
                  AND scheduled_time <= NOW()
                  AND render_status = 'completed'
                ORDER BY scheduled_time ASC
                LIMIT 10
            """))
            
            due_content = [str(row[0]) for row in result.fetchall()]
        
        if not due_content:
            return {"posted": 0, "message": "No content due for posting"}
        
        posted = 0
        failed = 0
        
        for content_id in due_content:
            result = await self.post_scheduled_content(content_id)
            if result.get("success"):
                posted += 1
            else:
                failed += 1
        
        return {
            "posted": posted,
            "failed": failed,
            "total_due": len(due_content)
        }
    
    def get_posting_stats(self, days: int = 7) -> Dict:
        """Get posting statistics for the past N days."""
        
        with self.engine.connect() as conn:
            # Posted content by platform
            result = conn.execute(text("""
                SELECT platform, format, COUNT(*) as count,
                       AVG(engagement_rate) as avg_engagement
                FROM posted_visual_content
                WHERE posted_at > NOW() - INTERVAL ':days days'
                GROUP BY platform, format
            """), {"days": days})
            
            by_platform = {}
            for row in result.fetchall():
                key = f"{row[0]}_{row[1]}"
                by_platform[key] = {
                    "count": row[2],
                    "avg_engagement": float(row[3] or 0)
                }
            
            # Scheduled content
            result2 = conn.execute(text("""
                SELECT platform, status, COUNT(*) as count
                FROM scheduled_visual_content
                GROUP BY platform, status
            """))
            
            scheduled = {}
            for row in result2.fetchall():
                key = f"{row[0]}_{row[1]}"
                scheduled[key] = row[2]
            
            return {
                "posted": by_platform,
                "scheduled": scheduled,
                "period_days": days
            }


# Singleton
_poster_service = None

def get_visual_poster_service() -> VisualPosterService:
    global _poster_service
    if _poster_service is None:
        _poster_service = VisualPosterService()
    return _poster_service
