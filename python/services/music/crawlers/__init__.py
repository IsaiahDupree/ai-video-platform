"""
Music Crawlers
==============
Crawlers for discovering trending music from various platforms.
"""
from .instagram_music_crawler import InstagramMusicCrawler, InstagramTrack, RateLimiter

__all__ = ["InstagramMusicCrawler", "InstagramTrack", "RateLimiter"]
