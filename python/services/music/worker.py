"""
Music Worker
============
Event-driven worker for music generation and selection.
"""

import logging
from typing import Dict, Any, Optional
from pathlib import Path

from services.event_bus import EventBus, Event, Topics
from services.workers.base import BaseWorker

from .models import MusicRequest, MusicResponse, MusicSource
from .adapters.suno import SunoAdapter
from .adapters.soundcloud import SoundCloudAdapter
from .adapters.social_platform import SocialPlatformAdapter

logger = logging.getLogger(__name__)


class MusicWorker(BaseWorker):
    """
    Worker for processing music requests.
    
    Supports:
        - Suno (local files)
        - SoundCloud (RapidAPI)
        - Social platforms (RapidAPI for trending music)
    """
    
    def __init__(self, event_bus: Optional[EventBus] = None, worker_id: Optional[str] = None):
        super().__init__(event_bus, worker_id)
        self.adapters = {
            MusicSource.SUNO: SunoAdapter(),
            MusicSource.SOUNDCLOUD: SoundCloudAdapter(),
            MusicSource.SOCIAL_PLATFORM: SocialPlatformAdapter(),
        }
        logger.info(f"[{self.worker_id}] Initialized with music adapters: {list(self.adapters.keys())}")
    
    def get_subscriptions(self) -> list:
        """Subscribe to music events."""
        return [Topics.MUSIC_REQUESTED]
    
    async def handle_event(self, event: Event) -> None:
        """Process music request event."""
        try:
            # Parse request from event payload
            request = self._parse_request(event.payload)
            
            if not request:
                logger.error(f"[{self.worker_id}] Invalid music request")
                await self.emit(
                    Topics.MUSIC_FAILED,
                    {
                        "error": "Invalid request payload",
                        "correlation_id": event.correlation_id
                    },
                    event.correlation_id
                )
                return
            
            # Get adapter
            adapter = self.adapters.get(request.source)
            if not adapter:
                raise ValueError(f"Unsupported music source: {request.source}")
            
            # Emit started event
            await self.emit(
                Topics.MUSIC_STARTED,
                {
                    "job_id": request.job_id,
                    "source": request.source.value,
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
            
            # Process request
            if request.suno_file_path:
                # Direct file path (Suno)
                response = await adapter.get_music(
                    request.suno_file_path,
                    Path(request.output_path) if request.output_path else None
                )
            elif request.track_id:
                # Specific track ID
                response = await adapter.get_music(
                    request.track_id,
                    Path(request.output_path) if request.output_path else None
                )
            elif request.search_criteria:
                # Search and select
                results = await adapter.search_music(request.search_criteria, limit=1)
                if results:
                    track_id = results[0]["track_id"]
                    response = await adapter.get_music(
                        track_id,
                        Path(request.output_path) if request.output_path else None
                    )
                else:
                    response = MusicResponse(
                        job_id=request.job_id,
                        success=False,
                        error="No music found matching criteria",
                        correlation_id=request.correlation_id
                    )
            else:
                response = MusicResponse(
                    job_id=request.job_id,
                    success=False,
                    error="No track_id, file_path, or search_criteria provided",
                    correlation_id=request.correlation_id
                )
            
            # Update job_id
            response.job_id = request.job_id
            response.correlation_id = request.correlation_id
            
            # Emit completion or failure
            if response.success:
                await self.emit(
                    Topics.MUSIC_COMPLETED,
                    {
                        "job_id": response.job_id,
                        "music_path": response.music_path,
                        "duration_seconds": response.duration_seconds,
                        "source": response.source,
                        "correlation_id": response.correlation_id
                    },
                    response.correlation_id
                )
            else:
                await self.emit(
                    Topics.MUSIC_FAILED,
                    {
                        "job_id": response.job_id,
                        "error": response.error,
                        "correlation_id": response.correlation_id
                    },
                    response.correlation_id
                )
                
        except Exception as e:
            logger.error(f"[{self.worker_id}] Error processing music event: {e}", exc_info=True)
            await self.emit(
                Topics.MUSIC_FAILED,
                {
                    "error": str(e),
                    "correlation_id": event.correlation_id
                },
                event.correlation_id
            )
    
    def _parse_request(self, payload: Dict[str, Any]) -> Optional[MusicRequest]:
        """Parse music request from event payload."""
        try:
            from .models import MusicSearchCriteria
            
            # Parse search criteria if present
            search_criteria = None
            if "search_criteria" in payload:
                criteria_data = payload["search_criteria"]
                search_criteria = MusicSearchCriteria(**criteria_data)
            
            return MusicRequest(
                source=MusicSource(payload.get("source", "suno")),
                search_criteria=search_criteria,
                suno_file_path=payload.get("suno_file_path"),
                track_id=payload.get("track_id"),
                search_query=payload.get("search_query"),
                output_path=payload.get("output_path"),
                duration=payload.get("duration"),
                job_id=payload.get("job_id"),
                correlation_id=payload.get("correlation_id")
            )
        except Exception as e:
            logger.error(f"Failed to parse music request: {e}")
            return None

