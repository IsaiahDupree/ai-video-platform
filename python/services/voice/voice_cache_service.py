"""
Voice Clone Caching Layer (VC-011)
===================================
Cache frequently used voice+text combinations in Redis.

Features:
- Cache voiceover results by text+voice_ref hash
- TTL-based expiration (default: 7 days)
- Cache hit/miss metrics
- Memory-efficient storage

Usage:
    from services.voice.voice_cache_service import VoiceCacheService

    cache = VoiceCacheService()

    # Try to get from cache
    cached = await cache.get_cached_voice(
        text="Hello world",
        voice_reference_url="ref_123.mp3"
    )

    if not cached:
        # Generate and cache
        result = await voice_service.clone_voice(...)
        await cache.cache_voice(
            text="Hello world",
            voice_reference_url="ref_123.mp3",
            result=result
        )
"""

import hashlib
import json
import os
from datetime import timedelta
from typing import Optional, Dict, Any
from loguru import logger


class VoiceCacheService:
    """
    Cache layer for voice cloning results.

    Uses Redis for distributed caching or in-memory fallback.
    """

    def __init__(
        self,
        redis_client=None,
        default_ttl_days: int = 7,
        use_redis: bool = True
    ):
        """
        Initialize voice cache service.

        Args:
            redis_client: Redis client instance (optional)
            default_ttl_days: Default cache TTL in days
            use_redis: Whether to use Redis (falls back to in-memory)
        """
        self.redis_client = redis_client
        self.default_ttl = timedelta(days=default_ttl_days)
        self.use_redis = use_redis and redis_client is not None

        # In-memory fallback
        self._memory_cache: Dict[str, Any] = {}

        # Metrics
        self.hits = 0
        self.misses = 0

        if not self.use_redis:
            logger.info("Voice cache using in-memory storage (no Redis)")

    def _generate_cache_key(
        self,
        text: str,
        voice_reference_url: str,
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate cache key from voice parameters.

        Args:
            text: Text to synthesize
            voice_reference_url: Voice reference URL
            options: Optional generation options

        Returns:
            Cache key hash
        """
        # Normalize text
        normalized_text = text.strip().lower()

        # Create deterministic options string
        options_str = ""
        if options:
            # Sort keys for consistency
            sorted_opts = sorted(options.items())
            options_str = json.dumps(sorted_opts, sort_keys=True)

        # Combine into cache key
        cache_input = f"{normalized_text}|{voice_reference_url}|{options_str}"

        # Hash to fixed-length key
        key_hash = hashlib.sha256(cache_input.encode()).hexdigest()

        return f"voice_cache:{key_hash}"

    async def get_cached_voice(
        self,
        text: str,
        voice_reference_url: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached voice result if available.

        Args:
            text: Text to synthesize
            voice_reference_url: Voice reference URL
            options: Generation options

        Returns:
            Cached result dict or None if not found
        """
        cache_key = self._generate_cache_key(text, voice_reference_url, options)

        try:
            if self.use_redis:
                # Try Redis
                cached_data = await self.redis_client.get(cache_key)
                if cached_data:
                    self.hits += 1
                    logger.debug(f"Voice cache HIT: {cache_key[:16]}...")
                    return json.loads(cached_data)
            else:
                # Try in-memory cache
                if cache_key in self._memory_cache:
                    self.hits += 1
                    logger.debug(f"Voice cache HIT (memory): {cache_key[:16]}...")
                    return self._memory_cache[cache_key]

        except Exception as e:
            logger.error(f"Cache read error: {e}")

        self.misses += 1
        logger.debug(f"Voice cache MISS: {cache_key[:16]}...")
        return None

    async def cache_voice(
        self,
        text: str,
        voice_reference_url: str,
        result: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
        ttl: Optional[timedelta] = None
    ) -> bool:
        """
        Cache voice generation result.

        Args:
            text: Text that was synthesized
            voice_reference_url: Voice reference URL
            result: Voice generation result to cache
            options: Generation options used
            ttl: Cache TTL (defaults to 7 days)

        Returns:
            True if cached successfully
        """
        cache_key = self._generate_cache_key(text, voice_reference_url, options)
        ttl = ttl or self.default_ttl

        try:
            # Add metadata
            cached_data = {
                **result,
                "cache_metadata": {
                    "cached_at": str(timedelta(seconds=0)),  # Placeholder
                    "text": text[:100],  # Store preview
                    "voice_ref": voice_reference_url
                }
            }

            if self.use_redis:
                # Store in Redis with TTL
                await self.redis_client.setex(
                    cache_key,
                    int(ttl.total_seconds()),
                    json.dumps(cached_data)
                )
                logger.debug(f"Cached voice in Redis: {cache_key[:16]}... (TTL: {ttl})")
            else:
                # Store in memory (no TTL enforcement)
                self._memory_cache[cache_key] = cached_data
                logger.debug(f"Cached voice in memory: {cache_key[:16]}...")

                # Limit memory cache size (keep last 1000 entries)
                if len(self._memory_cache) > 1000:
                    # Remove oldest entries
                    keys_to_remove = list(self._memory_cache.keys())[:-1000]
                    for key in keys_to_remove:
                        del self._memory_cache[key]

            return True

        except Exception as e:
            logger.error(f"Cache write error: {e}")
            return False

    async def clear_cache(self, pattern: str = "voice_cache:*") -> int:
        """
        Clear cached voices matching pattern.

        Args:
            pattern: Redis key pattern to match

        Returns:
            Number of keys deleted
        """
        if self.use_redis:
            try:
                keys = await self.redis_client.keys(pattern)
                if keys:
                    deleted = await self.redis_client.delete(*keys)
                    logger.info(f"Cleared {deleted} voice cache entries")
                    return deleted
            except Exception as e:
                logger.error(f"Cache clear error: {e}")
        else:
            # Clear in-memory cache
            count = len(self._memory_cache)
            self._memory_cache.clear()
            logger.info(f"Cleared {count} in-memory voice cache entries")
            return count

        return 0

    def get_metrics(self) -> Dict[str, Any]:
        """
        Get cache performance metrics.

        Returns:
            Dict with hits, misses, hit_rate
        """
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0.0

        return {
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total,
            "hit_rate_percent": round(hit_rate, 2),
            "cache_type": "redis" if self.use_redis else "memory",
            "memory_entries": len(self._memory_cache) if not self.use_redis else None
        }


# Singleton instance
_voice_cache_service: Optional[VoiceCacheService] = None


def get_voice_cache_service(redis_client=None) -> VoiceCacheService:
    """Get or create voice cache service singleton."""
    global _voice_cache_service
    if _voice_cache_service is None:
        _voice_cache_service = VoiceCacheService(redis_client=redis_client)
    return _voice_cache_service
