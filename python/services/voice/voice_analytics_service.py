"""
Voice Analytics Dashboard (VC-010)
===================================
Track voice clone usage, costs, and metrics.

Features:
- Usage tracking (requests, duration, cache hits)
- Cost estimation based on API pricing
- Performance metrics (latency, error rate)
- Per-voice statistics

Usage:
    from services.voice.voice_analytics_service import VoiceAnalyticsService

    analytics = VoiceAnalyticsService()

    # Track a voice generation
    await analytics.track_generation(
        voice_id="voice_123",
        text_length=250,
        duration_seconds=15.2,
        processing_time_ms=3400,
        cache_hit=False
    )

    # Get analytics
    stats = await analytics.get_stats(days=30)
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
from collections import defaultdict
from loguru import logger


@dataclass
class VoiceGenerationEvent:
    """Single voice generation event for analytics"""
    timestamp: datetime
    voice_id: str
    text_length: int
    audio_duration_seconds: float
    processing_time_ms: int
    cache_hit: bool
    success: bool
    error: Optional[str] = None
    cost_estimate_usd: float = 0.0


class VoiceAnalyticsService:
    """
    Track and analyze voice cloning usage and performance.

    Stores events in memory with configurable retention.
    For production, integrate with database or time-series DB.
    """

    # Pricing estimate (example: $0.10 per minute of audio)
    COST_PER_MINUTE_USD = 0.10

    def __init__(self, retention_days: int = 90):
        """
        Initialize analytics service.

        Args:
            retention_days: How long to keep events in memory
        """
        self.retention_days = retention_days
        self.events: List[VoiceGenerationEvent] = []
        self._lock = asyncio.Lock()

    async def track_generation(
        self,
        voice_id: str,
        text_length: int,
        duration_seconds: float,
        processing_time_ms: int,
        cache_hit: bool = False,
        success: bool = True,
        error: Optional[str] = None
    ) -> None:
        """
        Track a voice generation event.

        Args:
            voice_id: Voice reference ID
            text_length: Length of text in characters
            duration_seconds: Audio duration
            processing_time_ms: Processing time in milliseconds
            cache_hit: Whether result came from cache
            success: Whether generation succeeded
            error: Error message if failed
        """
        # Calculate cost estimate
        cost = 0.0
        if not cache_hit and success:
            cost = (duration_seconds / 60.0) * self.COST_PER_MINUTE_USD

        event = VoiceGenerationEvent(
            timestamp=datetime.now(timezone.utc),
            voice_id=voice_id,
            text_length=text_length,
            audio_duration_seconds=duration_seconds,
            processing_time_ms=processing_time_ms,
            cache_hit=cache_hit,
            success=success,
            error=error,
            cost_estimate_usd=cost
        )

        async with self._lock:
            self.events.append(event)
            await self._cleanup_old_events()

    async def _cleanup_old_events(self):
        """Remove events older than retention period."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=self.retention_days)
        self.events = [e for e in self.events if e.timestamp > cutoff]

    async def get_stats(
        self,
        days: int = 7,
        voice_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get voice analytics statistics.

        Args:
            days: Number of days to analyze
            voice_id: Optional filter by voice ID

        Returns:
            Dict with comprehensive stats
        """
        async with self._lock:
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            events = [e for e in self.events if e.timestamp > cutoff]

            if voice_id:
                events = [e for e in events if e.voice_id == voice_id]

            if not events:
                return self._empty_stats()

            # Calculate metrics
            total_requests = len(events)
            successful = [e for e in events if e.success]
            failed = [e for e in events if not e.success]
            cache_hits = [e for e in events if e.cache_hit]

            total_audio_duration = sum(e.audio_duration_seconds for e in successful)
            total_cost = sum(e.cost_estimate_usd for e in events)
            avg_processing_time = sum(e.processing_time_ms for e in successful) / len(successful) if successful else 0

            # Per-voice breakdown
            voice_stats = defaultdict(lambda: {
                "requests": 0,
                "audio_duration": 0.0,
                "cost": 0.0
            })

            for event in events:
                voice_stats[event.voice_id]["requests"] += 1
                voice_stats[event.voice_id]["audio_duration"] += event.audio_duration_seconds
                voice_stats[event.voice_id]["cost"] += event.cost_estimate_usd

            return {
                "period_days": days,
                "total_requests": total_requests,
                "successful_requests": len(successful),
                "failed_requests": len(failed),
                "success_rate_percent": round(len(successful) / total_requests * 100, 2),
                "cache_hits": len(cache_hits),
                "cache_hit_rate_percent": round(len(cache_hits) / total_requests * 100, 2),
                "total_audio_duration_seconds": round(total_audio_duration, 2),
                "total_audio_duration_hours": round(total_audio_duration / 3600, 2),
                "estimated_cost_usd": round(total_cost, 2),
                "avg_processing_time_ms": round(avg_processing_time, 2),
                "top_voices": self._get_top_voices(voice_stats, limit=10),
                "daily_breakdown": self._get_daily_breakdown(events)
            }

    def _empty_stats(self) -> Dict[str, Any]:
        """Return empty stats structure."""
        return {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "success_rate_percent": 0.0,
            "cache_hits": 0,
            "cache_hit_rate_percent": 0.0,
            "total_audio_duration_seconds": 0.0,
            "total_audio_duration_hours": 0.0,
            "estimated_cost_usd": 0.0,
            "avg_processing_time_ms": 0.0,
            "top_voices": [],
            "daily_breakdown": []
        }

    def _get_top_voices(
        self,
        voice_stats: Dict[str, Dict],
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top voices by usage."""
        sorted_voices = sorted(
            voice_stats.items(),
            key=lambda x: x[1]["requests"],
            reverse=True
        )[:limit]

        return [
            {
                "voice_id": voice_id,
                "requests": stats["requests"],
                "audio_duration_seconds": round(stats["audio_duration"], 2),
                "cost_usd": round(stats["cost"], 2)
            }
            for voice_id, stats in sorted_voices
        ]

    def _get_daily_breakdown(self, events: List[VoiceGenerationEvent]) -> List[Dict[str, Any]]:
        """Get daily usage breakdown."""
        daily_stats = defaultdict(lambda: {
            "requests": 0,
            "duration": 0.0,
            "cost": 0.0
        })

        for event in events:
            day_key = event.timestamp.date().isoformat()
            daily_stats[day_key]["requests"] += 1
            daily_stats[day_key]["duration"] += event.audio_duration_seconds
            daily_stats[day_key]["cost"] += event.cost_estimate_usd

        return [
            {
                "date": date,
                "requests": stats["requests"],
                "audio_duration_seconds": round(stats["duration"], 2),
                "cost_usd": round(stats["cost"], 2)
            }
            for date, stats in sorted(daily_stats.items())
        ]

    async def get_voice_stats(self, voice_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get stats for a specific voice.

        Args:
            voice_id: Voice ID to analyze
            days: Number of days to analyze

        Returns:
            Voice-specific stats
        """
        return await self.get_stats(days=days, voice_id=voice_id)

    async def get_recent_errors(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get recent generation errors.

        Args:
            limit: Max errors to return

        Returns:
            List of error events
        """
        async with self._lock:
            failed_events = [e for e in self.events if not e.success]
            recent_errors = sorted(
                failed_events,
                key=lambda e: e.timestamp,
                reverse=True
            )[:limit]

            return [
                {
                    "timestamp": e.timestamp.isoformat(),
                    "voice_id": e.voice_id,
                    "error": e.error,
                    "text_length": e.text_length
                }
                for e in recent_errors
            ]


# Singleton instance
_voice_analytics_service: Optional[VoiceAnalyticsService] = None


def get_voice_analytics_service() -> VoiceAnalyticsService:
    """Get or create voice analytics service singleton."""
    global _voice_analytics_service
    if _voice_analytics_service is None:
        _voice_analytics_service = VoiceAnalyticsService()
    return _voice_analytics_service
