"""
Video Router Service
Routes videos to appropriate platforms based on orientation and duration
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
from loguru import logger

from .video_analyzer import Orientation


@dataclass
class RoutingDecision:
    """Result of routing analysis"""
    video_id: str
    recommended_platforms: List[str]
    routing_rule: str
    reasoning: str
    youtube_channel_id: Optional[str] = None
    alternative_platforms: List[str] = None
    can_override: bool = True
    auto_routed: bool = True


class VideoRouter:
    """
    Routes videos to appropriate platforms based on characteristics.
    
    Routing Rules:
    - Vertical + < 60s → TikTok, Instagram Reels, YouTube Shorts
    - Horizontal + > 60s → YouTube (main channel)
    - Horizontal + < 60s → YouTube Shorts
    - Square → Instagram Feed, Facebook
    """
    
    # Duration thresholds (seconds)
    SHORT_FORM_THRESHOLD = 60
    MEDIUM_FORM_THRESHOLD = 300
    
    # Platform names
    PLATFORM_TIKTOK = "tiktok"
    PLATFORM_INSTAGRAM_REELS = "instagram_reels"
    PLATFORM_INSTAGRAM_FEED = "instagram_feed"
    PLATFORM_YOUTUBE = "youtube"
    PLATFORM_YOUTUBE_SHORTS = "youtube_shorts"
    PLATFORM_FACEBOOK = "facebook"
    
    def __init__(self):
        logger.info("Video router initialized")
    
    def determine_platforms(
        self,
        video_id: str,
        orientation: Orientation,
        duration: float,
        user_preferences: Optional[Dict] = None,
        manual_override: Optional[List[str]] = None
    ) -> RoutingDecision:
        """
        Determine target platforms for video based on characteristics.
        
        Args:
            video_id: Video identifier
            orientation: Video orientation (vertical, horizontal, square)
            duration: Video duration in seconds
            user_preferences: User routing preferences
            manual_override: Manual platform selection (overrides rules)
            
        Returns:
            RoutingDecision with recommended platforms and reasoning
        """
        user_preferences = user_preferences or {}
        
        # Handle manual override
        if manual_override:
            return RoutingDecision(
                video_id=video_id,
                recommended_platforms=manual_override,
                routing_rule="manual_override",
                reasoning="User manually selected platforms",
                can_override=True,
                auto_routed=False
            )
        
        # Apply routing rules
        if orientation == Orientation.VERTICAL:
            return self._route_vertical(video_id, duration, user_preferences)
        elif orientation == Orientation.HORIZONTAL:
            return self._route_horizontal(video_id, duration, user_preferences)
        else:  # SQUARE
            return self._route_square(video_id, duration, user_preferences)
    
    def _route_vertical(
        self,
        video_id: str,
        duration: float,
        user_preferences: Dict
    ) -> RoutingDecision:
        """Route vertical (9:16) videos"""
        
        if duration < self.SHORT_FORM_THRESHOLD:
            # Short vertical → TikTok, Instagram Reels, YouTube Shorts
            return RoutingDecision(
                video_id=video_id,
                recommended_platforms=[
                    self.PLATFORM_TIKTOK,
                    self.PLATFORM_INSTAGRAM_REELS,
                    self.PLATFORM_YOUTUBE_SHORTS
                ],
                routing_rule="vertical_short_form",
                reasoning=(
                    f"Vertical video under {self.SHORT_FORM_THRESHOLD} seconds - "
                    "optimal for TikTok, Instagram Reels, and YouTube Shorts"
                ),
                alternative_platforms=[self.PLATFORM_INSTAGRAM_FEED]
            )
        elif duration < 90:
            # Medium vertical → Instagram Reels, YouTube Shorts
            return RoutingDecision(
                video_id=video_id,
                recommended_platforms=[
                    self.PLATFORM_INSTAGRAM_REELS,
                    self.PLATFORM_YOUTUBE_SHORTS
                ],
                routing_rule="vertical_medium_form",
                reasoning=(
                    f"Vertical video {duration:.0f} seconds - "
                    "optimal for Instagram Reels and YouTube Shorts"
                ),
                alternative_platforms=[self.PLATFORM_TIKTOK]
            )
        else:
            # Long vertical → Instagram Reels only (TikTok has 10min limit)
            return RoutingDecision(
                video_id=video_id,
                recommended_platforms=[self.PLATFORM_INSTAGRAM_REELS],
                routing_rule="vertical_long_form",
                reasoning=(
                    f"Vertical video {duration:.0f} seconds - "
                    "optimal for Instagram Reels (supports longer videos)"
                ),
                alternative_platforms=[]
            )
    
    def _route_horizontal(
        self,
        video_id: str,
        duration: float,
        user_preferences: Dict
    ) -> RoutingDecision:
        """Route horizontal (16:9) videos"""
        
        if duration < self.SHORT_FORM_THRESHOLD:
            # Short horizontal → YouTube Shorts, Facebook
            return RoutingDecision(
                video_id=video_id,
                recommended_platforms=[
                    self.PLATFORM_YOUTUBE_SHORTS,
                    self.PLATFORM_FACEBOOK
                ],
                routing_rule="horizontal_short_form",
                reasoning=(
                    f"Horizontal video under {self.SHORT_FORM_THRESHOLD} seconds - "
                    "optimal for YouTube Shorts and Facebook"
                ),
                alternative_platforms=[self.PLATFORM_YOUTUBE]
            )
        else:
            # Long horizontal → YouTube main channel
            youtube_channel = user_preferences.get("default_youtube_channel")
            
            return RoutingDecision(
                video_id=video_id,
                recommended_platforms=[self.PLATFORM_YOUTUBE],
                routing_rule="horizontal_long_form",
                reasoning=(
                    f"Horizontal video over {self.SHORT_FORM_THRESHOLD} seconds - "
                    "optimal for YouTube main channel (full-length content)"
                ),
                youtube_channel_id=youtube_channel,
                alternative_platforms=[self.PLATFORM_FACEBOOK],
                can_override=True
            )
    
    def _route_square(
        self,
        video_id: str,
        duration: float,
        user_preferences: Dict
    ) -> RoutingDecision:
        """Route square (1:1) videos"""
        
        # Square videos work well on Instagram Feed and Facebook
        return RoutingDecision(
            video_id=video_id,
            recommended_platforms=[
                self.PLATFORM_INSTAGRAM_FEED,
                self.PLATFORM_FACEBOOK
            ],
            routing_rule="square_format",
            reasoning=(
                "Square video format - optimal for Instagram Feed and Facebook "
                "(better engagement than vertical/horizontal on these platforms)"
            ),
            alternative_platforms=[
                self.PLATFORM_INSTAGRAM_REELS,
                self.PLATFORM_TIKTOK
            ]
        )
    
    def should_route_to_youtube(
        self,
        orientation: Orientation,
        duration: float
    ) -> bool:
        """
        Determine if video should go to YouTube main channel.
        
        Args:
            orientation: Video orientation
            duration: Video duration in seconds
            
        Returns:
            True if video should be routed to YouTube main channel
        """
        return (
            orientation == Orientation.HORIZONTAL and
            duration > self.SHORT_FORM_THRESHOLD
        )
    
    def get_routing_rule_name(
        self,
        orientation: Orientation,
        duration: float
    ) -> str:
        """
        Get the routing rule name for given video characteristics.
        
        Returns:
            Rule name string
        """
        if orientation == Orientation.VERTICAL:
            if duration < self.SHORT_FORM_THRESHOLD:
                return "vertical_short_form"
            elif duration < 90:
                return "vertical_medium_form"
            else:
                return "vertical_long_form"
        elif orientation == Orientation.HORIZONTAL:
            if duration < self.SHORT_FORM_THRESHOLD:
                return "horizontal_short_form"
            else:
                return "horizontal_long_form"
        else:  # SQUARE
            return "square_format"


# Singleton instance
_router_instance = None


def get_video_router() -> VideoRouter:
    """Get or create video router singleton"""
    global _router_instance
    if _router_instance is None:
        _router_instance = VideoRouter()
    return _router_instance
