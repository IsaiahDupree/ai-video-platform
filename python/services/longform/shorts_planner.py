"""
ShortsPlanner — Build a ShortsEditPlan from a single [start, end] window of a
longform source.

Approach:
  1. Pre-cut the source to the requested window via ffmpeg (so the longform
     pipeline runs on ~30s of input instead of ~30min).
  2. Run the existing LongformPipeline against the pre-cut file. Output:
     `<video_id>_props.json` matching LongformEditPlan.
  3. Transform LongformEditPlan → ShortsEditPlan:
       - Swap resolution to 1080×1920 (vertical).
       - Tune captions to HIGHLIGHT_KEY_WORDS at fontSize=80.
       - Force snap_zoom on the first window (hook).
       - Generate SFX cue events: pop on each caption highlight, ding on the
         payoff window, sub_bass at frame 0.
       - Attach hook_overlay from the clip's selected_title.
  4. Write `<video_id>_shorts_props.json`. Render via:
         npx remotion render ShortsVideo <props.json> <out.mp4>

Contract: ShortsVideoProps in src/types/ShortsSchema.ts.
"""

from __future__ import annotations

import json
import subprocess
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from loguru import logger

# pipeline.py pulls in whisper/mediapipe/scenedetect; lazy-import inside
# run_longform_on_window so consumers that only need the transform helpers
# (or the conftest-stubbed tests) don't have to install the GPU stack.
from .types import LongformEditPlan, EdlEntry, CaptionStyle, ZoomType, RetentionRole


# ─── Shorts-tuned constants ───────────────────────────────────────────────────

SHORTS_WIDTH = 1080
SHORTS_HEIGHT = 1920
SHORTS_FPS = 30
SHORTS_CAPTION_FONT_SIZE = 80
HOOK_OVERLAY_DURATION_FRAMES = 45  # 1.5s @ 30fps

DEFAULT_SFX_MANIFEST: Dict[str, Any] = {
    "version": "1.0",
    "items": [
        {"id": "pop", "file": "pop.mp3", "tags": ["pop", "ui"], "description": "Soft UI pop"},
        {"id": "whoosh", "file": "whoosh.mp3", "tags": ["whoosh"], "description": "Whoosh transition"},
        {"id": "ding", "file": "ding.mp3", "tags": ["ding", "reveal"], "description": "Reveal ding"},
        {"id": "sub_bass", "file": "sub_bass.mp3", "tags": ["bass", "impact"], "description": "Sub bass hook impact"},
        {"id": "riser", "file": "riser.mp3", "tags": ["riser", "tension"], "description": "Build-up riser"},
    ],
}


# ─── Step 1: pre-cut source to the requested window ──────────────────────────


def precut_source(source_path: Path, start_s: float, end_s: float, out_path: Path) -> Path:
    """Cut `source_path` to [start_s, end_s] and write to `out_path`.

    Re-encodes (not stream-copy) so cut points land on a frame boundary —
    critical for downstream scene detection + caption alignment.
    """
    if end_s <= start_s:
        raise ValueError(f"end_s ({end_s}) must be > start_s ({start_s})")
    duration = end_s - start_s
    subprocess.run(
        [
            "ffmpeg", "-y",
            "-ss", f"{start_s:.3f}",
            "-i", str(source_path),
            "-t", f"{duration:.3f}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
            "-c:a", "aac",
            "-movflags", "+faststart",
            str(out_path),
        ],
        check=True, capture_output=True,
    )
    return out_path


# ─── Step 2: run longform pipeline on the cut window ─────────────────────────


def run_longform_on_window(cut_path: Path, workdir: Path, *, topic: str, brand_notes: str) -> LongformEditPlan:
    from .pipeline import LongformPipeline, PipelineConfig

    config = PipelineConfig(
        output_dir=str(workdir),
        fps=SHORTS_FPS,
        # Shorts almost never need B-roll (see PRD §11.4). Caller can override
        # if a channel has shorts_enable_broll = true.
        skip_broll=True,
        # Speaker segmentation is expensive and not used by shorts in v1
        # (we crop with CSS object-fit instead of compositing speaker masks).
        skip_segmentation=True,
        diarization_enabled=False,
        video_topic=topic,
        brand_notes=brand_notes,
    )
    pipeline = LongformPipeline(config=config)
    return pipeline.run_sync(str(cut_path))


# ─── Step 3: transform LongformEditPlan → ShortsEditPlan dict ────────────────


def _tune_entry_for_shorts(entry: EdlEntry, *, is_first: bool, is_last: bool) -> Dict[str, Any]:
    """Translate one EdlEntry to the shorts profile and return the dict
    suitable for ShortsVideoProps.edl[i].
    """
    d = entry.to_remotion()

    # Captions: HIGHLIGHT_KEY_WORDS at bigger font.
    captions = d.get("captions") or {}
    captions["style"] = CaptionStyle.HIGHLIGHT_KEY_WORDS.value
    captions["fontSize"] = SHORTS_CAPTION_FONT_SIZE
    captions["position"] = "bottom_center"
    d["captions"] = captions

    # Zoom: snap_zoom on the first (hook) and last (payoff) windows;
    # slow_push_in elsewhere for visual motion.
    if is_first:
        d["zoom"] = {
            "type": ZoomType.SNAP_ZOOM.value,
            "startScale": 1.0,
            "endScale": 1.08,
        }
    elif is_last:
        d["zoom"] = {
            "type": ZoomType.SLOW_PUSH_IN.value,
            "startScale": 1.0,
            "endScale": 1.06,
        }
    elif d.get("zoom") is None:
        d["zoom"] = {
            "type": ZoomType.SLOW_PUSH_IN.value,
            "startScale": 1.0,
            "endScale": 1.04,
        }

    return d


def _sfx_events_for(plan: LongformEditPlan, fps: int) -> Dict[str, Any]:
    """Generate an SFX cue track:
      - sub_bass at frame 0 (hook impact)
      - pop on the first highlight word of each entry
      - ding at the start of the final (payoff) window
    """
    events: List[Dict[str, Any]] = [
        {"type": "sfx", "sfxId": "sub_bass", "frame": 0, "volume": 0.6},
    ]
    for i, entry in enumerate(plan.edl):
        if entry.captions and entry.captions.words:
            first_highlight = next(
                (w for w in entry.captions.words if getattr(w, "highlight", False)),
                None,
            )
            if first_highlight is not None:
                frame = entry.start_frame + int(first_highlight.start * fps)
                events.append({"type": "sfx", "sfxId": "pop", "frame": frame, "volume": 0.4})
        if i == len(plan.edl) - 1:
            events.append({"type": "sfx", "sfxId": "ding", "frame": entry.start_frame, "volume": 0.7})
    return {"fps": fps, "events": events}


@dataclass
class ShortsPlannerInput:
    source_path: Path
    workdir: Path
    start_s: float
    end_s: float
    selected_title: str
    selected_description: str = ""
    topic: str = ""
    brand_notes: str = ""
    music_track_url: Optional[str] = None
    enable_broll: bool = False
    enable_sfx: bool = True


def build_shorts_props(input: ShortsPlannerInput) -> Dict[str, Any]:
    """Run the full plan for ONE shorts clip and return the props dict that
    matches ShortsVideoProps. Does NOT render — caller invokes Remotion.
    """
    cut_path = input.workdir / "cut.mp4"
    precut_source(input.source_path, input.start_s, input.end_s, cut_path)

    plan = run_longform_on_window(
        cut_path,
        input.workdir,
        topic=input.topic,
        brand_notes=input.brand_notes,
    )

    # Re-target resolution to 9:16. The EDL keeps its frame numbers — only the
    # canvas changes, and SpeakerClip's objectFit:cover handles the crop.
    edl_dicts: List[Dict[str, Any]] = []
    for i, entry in enumerate(plan.edl):
        edl_dicts.append(
            _tune_entry_for_shorts(
                entry,
                is_first=(i == 0),
                is_last=(i == len(plan.edl) - 1),
            )
        )

    music_bed = None
    if input.music_track_url:
        music_bed = {
            "trackUrl": input.music_track_url,
            "volume": 0.06,
            "duckDuringSpeech": True,
            "duckVolume": 0.02,
        }

    sfx_events = _sfx_events_for(plan, fps=SHORTS_FPS) if input.enable_sfx else None
    sfx_manifest = DEFAULT_SFX_MANIFEST if input.enable_sfx else None

    hook_overlay = None
    if input.selected_title:
        hook_overlay = {
            "text": input.selected_title.upper()[:80],
            "durationFrames": HOOK_OVERLAY_DURATION_FRAMES,
            "position": "top",
            "style": "punchy",
        }

    return {
        "videoId": plan.video_id,
        "sourceVideo": str(cut_path),
        "fps": SHORTS_FPS,
        "totalDurationFrames": plan.total_duration_frames,
        "resolution": {"width": SHORTS_WIDTH, "height": SHORTS_HEIGHT},
        "edl": edl_dicts,
        "musicBed": music_bed,
        "globalStyle": {
            "colorGrade": "neutral_warm",
            "letterbox": False,
            "watermark": None,
        },
        "sfxEvents": sfx_events,
        "sfxManifest": sfx_manifest,
        "hookOverlay": hook_overlay,
    }


def write_props_and_render(
    input: ShortsPlannerInput,
    out_path: Path,
    remotion_project_dir: str = "/opt/remotion",
) -> Path:
    """End-to-end: build props, write props.json, render via Remotion.

    Remotion's headless Chromium can't fetch arbitrary /tmp paths via <Video>.
    We point --public-dir at the cut.mp4's directory and rewrite sourceVideo
    to a bare filename so staticFile() resolves correctly inside the renderer.
    """
    import shutil

    props = build_shorts_props(input)

    # Rewrite sourceVideo to a relative filename — Remotion's <Video> handles
    # it via the --public-dir flag below. SpeakerClip already does the
    # `staticFile(...)` wrap for non-absolute, non-http srcs.
    cut_path = Path(props["sourceVideo"])
    props["sourceVideo"] = cut_path.name
    public_dir = cut_path.parent

    # --public-dir overrides /opt/remotion/public/, so SfxLayer's
    # staticFile('sfx/<file>') would 404. Mirror the bundled SFX pack into
    # our workdir alongside cut.mp4 so the resolver finds both.
    bundled_sfx = Path(remotion_project_dir) / "public" / "sfx"
    if bundled_sfx.exists():
        dest_sfx = public_dir / "sfx"
        if not dest_sfx.exists():
            shutil.copytree(bundled_sfx, dest_sfx)

    props_path = input.workdir / "shorts_props.json"
    props_path.write_text(json.dumps(props, indent=2))

    logger.info(
        f"shorts_planner: rendering {out_path} from {props_path} "
        f"(public-dir={public_dir})"
    )
    # Remotion CLI v4 requires an explicit entry point as the first arg.
    subprocess.run(
        [
            "npx", "remotion", "render",
            "src/index.ts",
            "ShortsVideo",
            str(out_path),
            f"--props={props_path}",
            f"--public-dir={public_dir}",
        ],
        check=True, capture_output=True, cwd=remotion_project_dir,
    )
    return out_path
