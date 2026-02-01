"""
Layered Render Plan V2

Extended render plan with z-index layering, transforms, and
support for alpha video overlays.
"""

from typing import Optional, Literal, Any
from pydantic import BaseModel, Field

from .types import StoryIRV1, FormatPackV1, BeatType


LayerKind = Literal["VIDEO", "ALPHA_VIDEO", "NATIVE"]
Anchor = Literal[
    "top-left", "top", "top-right",
    "left", "center", "right",
    "bottom-left", "bottom", "bottom-right"
]


class Transform2D(BaseModel):
    """2D transform for a layer."""
    x: float = 0
    y: float = 0
    scale: float = 1.0
    rotate: float = 0
    opacity: float = 1.0


class LayerV2(BaseModel):
    """A layer in the render plan."""
    id: str
    kind: LayerKind
    z_index: int = Field(alias="zIndex")
    
    # Timing
    from_frame: int = Field(alias="from")
    duration_in_frames: int = Field(alias="durationInFrames")
    
    # Media sources
    src: Optional[str] = None
    alpha_src: Optional[str] = Field(None, alias="alphaSrc")
    transparent: bool = False
    
    # Native component
    component_name: Optional[str] = Field(None, alias="componentName")
    props: Optional[dict] = None
    
    # Layout
    anchor: Anchor = "center"
    transform: Optional[Transform2D] = None
    
    # Audio
    volume: float = 1.0
    muted: bool = False
    
    class Config:
        populate_by_name = True


class RenderPlanV2Meta(BaseModel):
    """Metadata for render plan V2."""
    fps: int
    size: dict[str, int]  # {"w": 720, "h": 1280}


class RenderPlanRemotionV2(BaseModel):
    """Layered render plan for Remotion."""
    meta: RenderPlanV2Meta
    layers: list[LayerV2]
    
    def total_frames(self) -> int:
        """Get total frames."""
        if not self.layers:
            return 0
        return max(
            layer.from_frame + layer.duration_in_frames
            for layer in self.layers
        )
    
    def get_layers_at_frame(self, frame: int) -> list[LayerV2]:
        """Get all layers active at a specific frame."""
        return [
            layer for layer in self.layers
            if layer.from_frame <= frame < layer.from_frame + layer.duration_in_frames
        ]


class OverlayPreset(BaseModel):
    """Preset for character overlay positioning."""
    anchor: Anchor
    transform: Transform2D


# Default overlay presets for character overlays
DEFAULT_OVERLAY_PRESETS: dict[str, OverlayPreset] = {
    "char_bottom_right": OverlayPreset(
        anchor="bottom-right",
        transform=Transform2D(x=-40, y=-60, scale=0.55),
    ),
    "char_bottom_left": OverlayPreset(
        anchor="bottom-left",
        transform=Transform2D(x=40, y=-60, scale=0.55),
    ),
    "char_top_right": OverlayPreset(
        anchor="top-right",
        transform=Transform2D(x=-40, y=40, scale=0.50),
    ),
    "char_center": OverlayPreset(
        anchor="center",
        transform=Transform2D(x=0, y=0, scale=0.70),
    ),
}


class OverlayRules(BaseModel):
    """Rules for overlay positioning."""
    default_preset: str = Field(default="char_bottom_right", alias="defaultPreset")
    presets: dict[str, OverlayPreset] = Field(default_factory=dict)
    
    class Config:
        populate_by_name = True


def make_render_plan_v2(
    ir: StoryIRV1,
    format_pack: FormatPackV1,
    assets: dict,
    overlay_rules: Optional[OverlayRules] = None,
    output_size: Optional[dict[str, int]] = None,
) -> RenderPlanRemotionV2:
    """
    Generate a layered render plan V2.
    
    Supports:
    - Background video layers
    - Alpha video overlays (CHAR_ALPHA)
    - Native component layers
    
    Args:
        ir: Story IR
        format_pack: Format pack
        assets: Asset manifest with clips
        overlay_rules: Optional overlay positioning rules
        output_size: Output dimensions
        
    Returns:
        RenderPlanRemotionV2
    """
    fps = ir.meta.fps
    
    if output_size is None:
        output_size = (
            {"w": 720, "h": 1280} if ir.meta.aspect == "9:16"
            else {"w": 1280, "h": 720}
        )
    
    # Use default overlay rules if not provided
    if overlay_rules is None:
        overlay_rules = OverlayRules(presets=DEFAULT_OVERLAY_PRESETS)
    
    # Build clip lookup
    clips = assets.get("clips", [])
    clip_by_beat = {c.get("beatId") or c.get("beat_id"): c for c in clips}
    
    sora_beat_types = {bt.value if hasattr(bt, 'value') else bt 
                       for bt in format_pack.render_strategy.sora_beat_types}
    
    layers: list[LayerV2] = []
    cursor = 0
    
    for beat in ir.beats:
        duration_frames = max(1, round(beat.duration_s * fps))
        from_frame = cursor
        
        beat_type_str = beat.type.value if hasattr(beat.type, 'value') else beat.type
        is_sora_beat = beat_type_str in sora_beat_types
        
        clip = clip_by_beat.get(beat.id)
        
        if is_sora_beat and clip:
            shot_type = clip.get("shotType") or clip.get("shot_type", "FULL_SCENE")
            
            # Layer 0: Background video
            if clip.get("src"):
                layers.append(LayerV2(
                    id=f"bg_{beat.id}",
                    kind="VIDEO",
                    z_index=0,
                    from_frame=from_frame,
                    duration_in_frames=duration_frames,
                    src=clip["src"],
                    muted=shot_type != "FULL_SCENE",
                ))
            
            # Layer 1: Alpha video overlay (for CHAR_ALPHA)
            if shot_type == "CHAR_ALPHA" and clip.get("alphaSrc"):
                preset_name = overlay_rules.default_preset
                preset = overlay_rules.presets.get(
                    preset_name,
                    DEFAULT_OVERLAY_PRESETS.get(preset_name)
                )
                
                layers.append(LayerV2(
                    id=f"char_{beat.id}",
                    kind="ALPHA_VIDEO",
                    z_index=1,
                    from_frame=from_frame,
                    duration_in_frames=duration_frames,
                    alpha_src=clip.get("alphaSrc"),
                    transparent=True,
                    anchor=preset.anchor if preset else "bottom-right",
                    transform=preset.transform if preset else None,
                    muted=True,
                ))
        else:
            # Native component
            component_name = format_pack.component_map.get(
                beat_type_str,
                "SceneFallback"
            )
            
            layers.append(LayerV2(
                id=f"native_{beat.id}",
                kind="NATIVE",
                z_index=0,
                from_frame=from_frame,
                duration_in_frames=duration_frames,
                component_name=component_name,
                props={
                    "beat": beat.model_dump(by_alias=True),
                    "variables": ir.variables.model_dump(),
                },
            ))
        
        cursor += duration_frames
    
    # Sort layers by from_frame, then z_index
    layers.sort(key=lambda l: (l.from_frame, l.z_index))
    
    return RenderPlanRemotionV2(
        meta=RenderPlanV2Meta(fps=fps, size=output_size),
        layers=layers,
    )


def add_audio_layer(
    plan: RenderPlanRemotionV2,
    audio_src: str,
    z_index: int = -1,
    volume: float = 1.0,
    start_frame: int = 0,
) -> RenderPlanRemotionV2:
    """
    Add an audio layer to a render plan.
    
    Args:
        plan: Existing render plan
        audio_src: Path to audio file
        z_index: Z-index for the layer
        volume: Volume (0-1)
        start_frame: Starting frame
        
    Returns:
        Updated render plan
    """
    total_frames = plan.total_frames()
    
    audio_layer = LayerV2(
        id=f"audio_{len(plan.layers)}",
        kind="VIDEO",  # Audio-only layers use VIDEO kind
        z_index=z_index,
        from_frame=start_frame,
        duration_in_frames=total_frames - start_frame,
        src=audio_src,
        volume=volume,
    )
    
    return RenderPlanRemotionV2(
        meta=plan.meta,
        layers=[*plan.layers, audio_layer],
    )


def validate_render_plan_v2(
    plan: RenderPlanRemotionV2,
    assets: dict,
) -> list[str]:
    """
    Validate a render plan V2.
    
    Args:
        plan: The render plan
        assets: Asset manifest
        
    Returns:
        List of validation error messages
    """
    errors = []
    
    clips = assets.get("clips", [])
    asset_srcs = set()
    for clip in clips:
        if clip.get("src"):
            asset_srcs.add(clip["src"])
        if clip.get("alphaSrc"):
            asset_srcs.add(clip["alphaSrc"])
    
    for layer in plan.layers:
        # Check video layers have sources
        if layer.kind == "VIDEO":
            if not layer.src:
                errors.append(f"VIDEO layer {layer.id} missing src")
            elif layer.src not in asset_srcs and not layer.src.startswith("mock://"):
                errors.append(f"VIDEO layer {layer.id} src not in assets: {layer.src}")
        
        # Check alpha video layers
        if layer.kind == "ALPHA_VIDEO":
            if not layer.alpha_src:
                errors.append(f"ALPHA_VIDEO layer {layer.id} missing alphaSrc")
        
        # Check native layers have components
        if layer.kind == "NATIVE":
            if not layer.component_name:
                errors.append(f"NATIVE layer {layer.id} missing componentName")
        
        # Check timing
        if layer.from_frame < 0:
            errors.append(f"Layer {layer.id} has negative from_frame")
        if layer.duration_in_frames <= 0:
            errors.append(f"Layer {layer.id} has non-positive duration")
    
    return errors


def render_plan_v2_to_remotion_props(plan: RenderPlanRemotionV2) -> dict:
    """
    Convert render plan V2 to Remotion inputProps format.
    
    Args:
        plan: The render plan
        
    Returns:
        Dict for Remotion inputProps
    """
    return {
        "fps": plan.meta.fps,
        "width": plan.meta.size["w"],
        "height": plan.meta.size["h"],
        "durationInFrames": plan.total_frames(),
        "layers": [layer.model_dump(by_alias=True) for layer in plan.layers],
    }
