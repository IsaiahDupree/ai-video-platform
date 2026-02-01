"""
Visuals Worker
=============
Event-driven worker for visual asset generation and selection.
"""

import logging
from typing import Dict, Any, Optional

from services.event_bus import EventBus, Event, Topics
from services.workers.base import BaseWorker

from .models import VisualsRequest, VisualsResponse, VisualsType, VisualsSource
from .adapters.meme import MemeAdapter
from .adapters.broll import BrollAdapter
from .adapters.ugc import UGCAdapter

logger = logging.getLogger(__name__)


class VisualsWorker(BaseWorker):
    """
    Worker for processing visuals requests.
    
    Supports:
        - Meme templates (local, RapidAPI)
        - B-roll footage (local, RapidAPI, MediaPoster)
        - UGC content (local, MediaPoster, RapidAPI)
    """
    
    def __init__(self, event_bus: Optional[EventBus] = None, worker_id: Optional[str] = None):
        super().__init__(event_bus, worker_id)
        
        # Create adapters
        meme_adapter = MemeAdapter()
        broll_adapter = BrollAdapter()
        ugc_adapter = UGCAdapter()
        
        # Map visuals types to adapters
        self.adapters = {
            VisualsType.MEME: meme_adapter,
            VisualsType.BROLL: broll_adapter,
            VisualsType.UGC: ugc_adapter,
        }
        
        logger.info(f"[{self.worker_id}] Initialized with visuals adapters: {list(self.adapters.keys())}")
    
    def get_subscriptions(self) -> list:
        """Subscribe to visuals events."""
        return [Topics.VISUALS_REQUESTED]
    
    async def handle_event(self, event: Event) -> None:
        """Process visuals request event."""
        try:
            # Parse request from event payload
            request = self._parse_request(event.payload)
            
            if not request:
                logger.error(f"[{self.worker_id}] Invalid visuals request")
                await self.emit(
                    Topics.VISUALS_FAILED,
                    {
                        "error": "Invalid request payload",
                        "correlation_id": event.correlation_id
                    },
                    event.correlation_id
                )
                return
            
            # Get adapter
            adapter = self.adapters.get(request.visuals_type)
            if not adapter:
                raise ValueError(f"Unsupported visuals type: {request.visuals_type}")
            
            # Emit started event
            await self.emit(
                Topics.VISUALS_STARTED,
                {
                    "job_id": request.job_id,
                    "visuals_type": request.visuals_type.value,
                    "source": request.source.value,
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
            
            # Process request
            if request.file_path:
                # Direct file path (local)
                from pathlib import Path
                response = await adapter.get_visuals(
                    request.file_path,
                    Path(request.output_path) if request.output_path else None
                )
            elif request.asset_id:
                # Specific asset ID
                from pathlib import Path
                response = await adapter.get_visuals(
                    request.asset_id,
                    Path(request.output_path) if request.output_path else None
                )
            elif request.search_criteria:
                # Search and select
                results = await adapter.search_visuals(
                    request.visuals_type,
                    request.search_criteria,
                    limit=1
                )
                if results:
                    asset_id = results[0]["asset_id"]
                    from pathlib import Path
                    response = await adapter.get_visuals(
                        asset_id,
                        Path(request.output_path) if request.output_path else None
                    )
                else:
                    response = VisualsResponse(
                        job_id=request.job_id,
                        success=False,
                        error="No visuals found matching criteria",
                        correlation_id=request.correlation_id
                    )
            else:
                response = VisualsResponse(
                    job_id=request.job_id,
                    success=False,
                    error="No asset_id, file_path, or search_criteria provided",
                    correlation_id=request.correlation_id
                )
            
            # Update job_id
            response.job_id = request.job_id
            response.correlation_id = request.correlation_id
            
            # Emit completion or failure
            if response.success:
                await self.emit(
                    Topics.VISUALS_COMPLETED,
                    {
                        "job_id": response.job_id,
                        "visuals_path": response.visuals_path,
                        "visuals_type": response.visuals_type,
                        "duration_seconds": response.duration_seconds,
                        "correlation_id": response.correlation_id
                    },
                    response.correlation_id
                )
            else:
                await self.emit(
                    Topics.VISUALS_FAILED,
                    {
                        "job_id": response.job_id,
                        "error": response.error,
                        "correlation_id": response.correlation_id
                    },
                    response.correlation_id
                )
                
        except Exception as e:
            logger.error(f"[{self.worker_id}] Error processing visuals event: {e}", exc_info=True)
            await self.emit(
                Topics.VISUALS_FAILED,
                {
                    "error": str(e),
                    "correlation_id": event.correlation_id
                },
                event.correlation_id
            )
    
    def _parse_request(self, payload: Dict[str, Any]) -> Optional[VisualsRequest]:
        """Parse visuals request from event payload."""
        try:
            from .models import VisualsSearchCriteria
            
            # Parse search criteria if present
            search_criteria = None
            if "search_criteria" in payload:
                criteria_data = payload["search_criteria"]
                search_criteria = VisualsSearchCriteria(**criteria_data)
            
            return VisualsRequest(
                visuals_type=VisualsType(payload.get("visuals_type", "meme")),
                source=VisualsSource(payload.get("source", "local")),
                search_criteria=search_criteria,
                file_path=payload.get("file_path"),
                asset_id=payload.get("asset_id"),
                ugc_source=payload.get("ugc_source"),
                output_path=payload.get("output_path"),
                job_id=payload.get("job_id"),
                correlation_id=payload.get("correlation_id")
            )
        except Exception as e:
            logger.error(f"Failed to parse visuals request: {e}")
            return None

