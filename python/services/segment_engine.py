from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
from datetime import datetime
from pydantic import BaseModel

class SegmentDefinition(BaseModel):
    """
    DSL for defining a segment.
    Example:
    {
        "operator": "AND",
        "conditions": [
            {"field": "activity_state", "operator": "eq", "value": "active"},
            {"field": "interests", "operator": "contains", "value": "AI"}
        ]
    }
    """
    operator: str = "AND" # AND, OR
    conditions: List[Dict[str, Any]] = []

class SegmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: SegmentDefinition

class SegmentResponse(SegmentCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime
    member_count: int = 0

class SegmentInsightResponse(BaseModel):
    segment_id: UUID
    traffic_type: str # organic, paid
    top_topics: List[str] = []
    top_platforms: Dict[str, float] = {}
    best_times: Dict[str, float] = {}
    updated_at: datetime

# Mock Logic for Segment Engine
async def calculate_segment_members(definition: SegmentDefinition) -> List[UUID]:
    """
    Evaluate the DSL against the People Graph to find matching person_ids.
    """
    # TODO: Implement actual SQL generation or in-memory filtering
    # For now, return mock IDs
    return [uuid4(), uuid4()]

async def compute_segment_insights(segment_id: UUID, traffic_type: str) -> SegmentInsightResponse:
    """
    Aggregate insights for all members of a segment.
    """
    # TODO: Fetch members, then aggregate their person_insights + person_events
    return SegmentInsightResponse(
        segment_id=segment_id,
        traffic_type=traffic_type,
        top_topics=["AI Automation", "Content Creation"],
        top_platforms={"instagram": 0.6, "linkedin": 0.3},
        best_times={"Tue_10": 0.8, "Thu_14": 0.7},
        updated_at=datetime.now()
    )
