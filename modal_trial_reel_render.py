#!/usr/bin/env python3
"""Authenticated CPU-only cloud renderer for the Trial Reel composition."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import subprocess
import tempfile
import time
import uuid
from pathlib import Path

import modal
from fastapi import HTTPException, Request


APP_NAME = "trial-reel-remotion-render"
LOCAL_RENDERER = Path(__file__).resolve().parent / "cloud" / "trial-reel-renderer"
REMOTE_RENDERER = Path("/renderer")
REQUIRED_SECRETS = (
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "MODAL_REMOTION_AUTH_TOKEN",
)

missing = [name for name in REQUIRED_SECRETS if not os.environ.get(name)]
if missing:
    raise RuntimeError(f"Missing required deployment secrets: {', '.join(missing)}")

app = modal.App(APP_NAME)
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "chromium",
        "ffmpeg",
        "curl",
        "ca-certificates",
        "fonts-liberation",
        "fonts-noto-color-emoji",
        "libasound2",
        "libatk-bridge2.0-0",
        "libatk1.0-0",
        "libcups2",
        "libdrm2",
        "libgbm1",
        "libgtk-3-0",
        "libnss3",
        "libx11-xcb1",
        "libxcomposite1",
        "libxdamage1",
        "libxfixes3",
        "libxrandr2",
    )
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
        "apt-get install -y nodejs",
    )
    .pip_install("supabase>=2.4.0", "httpx>=0.24,<0.28", "fastapi[standard]")
    .add_local_dir(
        str(LOCAL_RENDERER),
        remote_path=str(REMOTE_RENDERER),
        copy=False,
        ignore=["node_modules", ".remotion", "output"],
    )
)
secret = modal.Secret.from_dict({name: os.environ[name] for name in REQUIRED_SECRETS})


def _safe_id(value: object, field: str) -> str:
    cleaned = str(value or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{1,127}", cleaned):
        raise HTTPException(400, f"{field} must be a filesystem-safe identifier")
    return cleaned


def _require_https(value: object, field: str) -> str:
    cleaned = str(value or "").strip()
    if not cleaned.startswith("https://"):
        raise HTTPException(400, f"{field} must be an HTTPS URL")
    return cleaned


def _authorized(request: Request) -> bool:
    supplied = request.headers.get("authorization", "")
    expected = f"Bearer {os.environ['MODAL_REMOTION_AUTH_TOKEN']}"
    return hmac.compare_digest(supplied, expected)


@app.function(
    image=image,
    secrets=[secret],
    timeout=3600,
    memory=8192,
    cpu=4.0,
)
@modal.fastapi_endpoint(method="POST", label="trial-reel-remotion-render")
async def render_trial_reel(request: Request) -> dict:
    if not _authorized(request):
        raise HTTPException(401, "invalid render authorization")
    body = await request.json()
    family_id = _safe_id(body.get("family_id"), "family_id")
    variant_id = _safe_id(body.get("variant_id"), "variant_id")
    video_url = _require_https(body.get("video_url"), "video_url")
    duration_sec = float(body.get("duration_sec") or 0)
    if not 0 < duration_sec <= 180:
        raise HTTPException(400, "duration_sec must be between 0 and 180")

    props = {
        "videoUrl": video_url,
        "durationSec": duration_sec,
        "onScreenText": str(body.get("on_screen_text") or "").strip(),
        "onScreenSubtext": str(body.get("on_screen_subtext") or "").strip(),
        "accentColor": str(body.get("accent_color") or "#38EF7D"),
        "visualFilter": str(body.get("visual_filter") or "none"),
        "overlayColor": str(body.get("overlay_color") or "#000000"),
        "overlayOpacity": float(body.get("overlay_opacity") or 0),
        "brandId": str(body.get("brand_id") or "the_isaiah_dupree"),
    }
    if not props["onScreenText"]:
        raise HTTPException(400, "on_screen_text is required")

    started = time.monotonic()
    work = Path(tempfile.mkdtemp(prefix="trial-reel-"))
    output_name = f"{variant_id}.mp4"
    output_path = work / output_name
    props_path = work / "props.json"
    props_path.write_text(json.dumps(props, indent=2), encoding="utf-8")

    marker = REMOTE_RENDERER / "node_modules" / ".install_done"
    if not marker.exists():
        install = subprocess.run(
            ["npm", "ci", "--no-audit", "--prefer-offline"],
            cwd=REMOTE_RENDERER,
            capture_output=True,
            text=True,
            timeout=300,
        )
        if install.returncode:
            raise HTTPException(502, f"npm ci failed: {install.stderr[-1200:]}")
        marker.touch()

    render = subprocess.run(
        [
            "./node_modules/.bin/remotion",
            "render",
            "src/index.tsx",
            "TrialReelVariant",
            str(output_path),
            "--props",
            str(props_path),
            "--browser-executable=/usr/bin/chromium",
            "--codec=h264",
            "--pixel-format=yuv420p",
            "--crf=18",
            "--concurrency=2",
            "--log=warn",
        ],
        cwd=REMOTE_RENDERER,
        capture_output=True,
        text=True,
        timeout=3000,
        env={
            **os.environ,
            "PUPPETEER_EXECUTABLE_PATH": "/usr/bin/chromium",
            "REMOTION_CHROMIUM_FLAGS": "--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage",
            "NODE_ENV": "production",
        },
    )
    if render.returncode or not output_path.exists():
        raise HTTPException(
            502,
            {
                "message": "Remotion render failed",
                "exit_code": render.returncode,
                "stderr": render.stderr[-1800:],
                "stdout": render.stdout[-800:],
            },
        )

    output_bytes = output_path.read_bytes()
    output_sha256 = hashlib.sha256(output_bytes).hexdigest()
    from supabase import create_client

    storage = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    ).storage
    bucket = "remotion-renders"
    try:
        storage.get_bucket(bucket)
    except Exception:
        storage.create_bucket(bucket, options={"public": True})
    storage_path = f"trial-reels/{family_id}/{output_name}"
    storage.from_(bucket).upload(
        path=storage_path,
        file=output_bytes,
        file_options={"content-type": "video/mp4", "upsert": "true"},
    )
    public_url = storage.from_(bucket).get_public_url(storage_path)
    return {
        "schema_version": "1.0",
        "contract_type": "modal_trial_reel_render_receipt",
        "render_id": f"render_{uuid.uuid4().hex}",
        "family_id": family_id,
        "variant_id": variant_id,
        "composition": "TrialReelVariant",
        "renderer": {"engine": "remotion", "version": "4.0.434", "lane": "modal-cpu"},
        "duration_sec": duration_sec,
        "output_sha256": output_sha256,
        "bytes": len(output_bytes),
        "url": public_url,
        "storage_path": storage_path,
        "render_time_sec": round(time.monotonic() - started, 3),
    }
