"""
Render Plan Generator

Transforms Story IR + Format Pack + Assets into Remotion render plans.
"""

from typing import Optional

from .types import (
    StoryIRV1,
    FormatPackV1,
    AssetManifestV1,
    RenderPlanRemotionV1,
    RenderPlanMeta,
    TimelineItem,
    BeatType,
)


def make_render_plan(
    ir: StoryIRV1,
    format_pack: FormatPackV1,
    assets: AssetManifestV1,
    output_size: Optional[dict[str, int]] = None,
) -> RenderPlanRemotionV1:
    """
    Generate a Remotion render plan from Story IR and assets.
    
    Args:
        ir: Story IR with beats
        format_pack: Format pack with render strategy
        assets: Generated assets (Sora clips, etc.)
        output_size: Output dimensions {"w": 720, "h": 1280}
        
    Returns:
        RenderPlanRemotionV1 for Remotion
    """
    fps = ir.meta.fps
    
    # Determine output size
    if output_size is None:
        if ir.meta.aspect == "9:16":
            output_size = {"w": 720, "h": 1280}
        elif ir.meta.aspect == "16:9":
            output_size = {"w": 1280, "h": 720}
        else:
            output_size = {"w": 1080, "h": 1080}
    
    # Build clip lookup by beat ID
    clip_by_beat = {clip.beat_id: clip for clip in assets.clips}
    
    # Which beats are Sora vs native
    sora_beat_types = set(format_pack.render_strategy.sora_beat_types)
    
    timeline: list[TimelineItem] = []
    cursor = 0  # Current frame position
    
    for beat in ir.beats:
        duration_frames = max(1, round(beat.duration_s * fps))
        
        if beat.type in sora_beat_types:
            # Video from Sora
            clip = clip_by_beat.get(beat.id)
            if not clip:
                raise ValueError(f"Missing Sora clip for beat {beat.id}")
            
            timeline.append(TimelineItem(
                id=f"tl_{beat.id}",
                from_frame=cursor,
                duration_in_frames=duration_frames,
                kind="video",
                src=clip.src,
            ))
        else:
            # Native Remotion component
            component_name = format_pack.component_map.get(
                beat.type.value,
                "SceneFallback"
            )
            
            timeline.append(TimelineItem(
                id=f"tl_{beat.id}",
                from_frame=cursor,
                duration_in_frames=duration_frames,
                kind="native",
                component_name=component_name,
                props={
                    "beat": beat.model_dump(by_alias=True),
                    "variables": ir.variables.model_dump(),
                },
            ))
        
        cursor += duration_frames
    
    return RenderPlanRemotionV1(
        meta=RenderPlanMeta(
            fps=fps,
            size=output_size,
        ),
        timeline=timeline,
    )


def add_audio_layers_to_plan(
    plan: RenderPlanRemotionV1,
    voiceover_src: Optional[str] = None,
    music_src: Optional[str] = None,
    music_volume: float = 0.25,
) -> dict:
    """
    Add audio layer configuration to render plan.
    
    Args:
        plan: The render plan
        voiceover_src: Path to voiceover audio
        music_src: Path to background music
        music_volume: Music volume (0-1)
        
    Returns:
        Extended plan dict with audio layers
    """
    plan_dict = plan.model_dump(by_alias=True)
    
    audio_layers = []
    
    if voiceover_src:
        audio_layers.append({
            "type": "voiceover",
            "src": voiceover_src,
            "from": 0,
            "volume": 1.0,
        })
    
    if music_src:
        audio_layers.append({
            "type": "music",
            "src": music_src,
            "from": 0,
            "volume": music_volume,
            "loop": True,
        })
    
    plan_dict["audioLayers"] = audio_layers
    
    return plan_dict


def get_timeline_duration_frames(plan: RenderPlanRemotionV1) -> int:
    """
    Get total duration of timeline in frames.
    
    Args:
        plan: The render plan
        
    Returns:
        Total frames
    """
    return plan.total_frames()


def get_timeline_duration_seconds(plan: RenderPlanRemotionV1) -> float:
    """
    Get total duration of timeline in seconds.
    
    Args:
        plan: The render plan
        
    Returns:
        Total seconds
    """
    return plan.total_frames() / plan.meta.fps


def get_video_items(plan: RenderPlanRemotionV1) -> list[TimelineItem]:
    """
    Get all video (Sora) items from timeline.
    
    Args:
        plan: The render plan
        
    Returns:
        List of video items
    """
    return [item for item in plan.timeline if item.kind == "video"]


def get_native_items(plan: RenderPlanRemotionV1) -> list[TimelineItem]:
    """
    Get all native (component) items from timeline.
    
    Args:
        plan: The render plan
        
    Returns:
        List of native items
    """
    return [item for item in plan.timeline if item.kind == "native"]


def validate_render_plan(
    plan: RenderPlanRemotionV1,
    assets: AssetManifestV1,
) -> list[str]:
    """
    Validate render plan against assets.
    
    Args:
        plan: The render plan
        assets: The asset manifest
        
    Returns:
        List of validation error messages
    """
    errors = []
    
    asset_srcs = {clip.src for clip in assets.clips}
    
    for item in plan.timeline:
        if item.kind == "video":
            if not item.src:
                errors.append(f"Video item {item.id} missing src")
            elif item.src not in asset_srcs:
                errors.append(f"Video item {item.id} src not in assets: {item.src}")
        
        if item.kind == "native":
            if not item.component_name:
                errors.append(f"Native item {item.id} missing componentName")
    
    # Check for timeline gaps or overlaps
    sorted_items = sorted(plan.timeline, key=lambda x: x.from_frame)
    expected_frame = 0
    
    for item in sorted_items:
        if item.from_frame != expected_frame:
            errors.append(
                f"Timeline discontinuity at {item.id}: "
                f"expected frame {expected_frame}, got {item.from_frame}"
            )
        expected_frame = item.from_frame + item.duration_in_frames
    
    return errors


def render_plan_to_remotion_input_props(plan: RenderPlanRemotionV1) -> dict:
    """
    Convert render plan to Remotion inputProps format.
    
    Args:
        plan: The render plan
        
    Returns:
        Dict suitable for Remotion inputProps
    """
    return {
        "fps": plan.meta.fps,
        "width": plan.meta.size["w"],
        "height": plan.meta.size["h"],
        "durationInFrames": plan.total_frames(),
        "timeline": [item.model_dump(by_alias=True) for item in plan.timeline],
    }
