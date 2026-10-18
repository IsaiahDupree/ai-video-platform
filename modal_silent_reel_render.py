#!/usr/bin/env python3
"""Authenticated CPU-only cloud renderer for silent explainer reels.

Renders `cloud/silent-reel-renderer` compositions (BlueprintExplainer,
MachineMetaphor) on Modal and uploads the MP4 to Supabase Storage. This is
one available remote render lane. Local Remotion, Orion, GitHub, and this Modal
endpoint may all be used according to task needs.

Deploy (secrets are read from the deploying shell's environment):
    set -a; source .env; set +a   # MODAL_SILENT_RENDER_AUTH_TOKEN
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... modal deploy modal_silent_reel_render.py

Call:
    POST https://isaiahdupree33--silent-reel-render.modal.run
    Authorization: Bearer $MODAL_SILENT_RENDER_AUTH_TOKEN
    {"composition": "BlueprintExplainer", "input_props": {...}, "output_filename": "x.mp4"}
"""
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

APP_NAME = "silent-reel-render"
LOCAL_RENDERER = Path(__file__).resolve().parent / "cloud" / "silent-reel-renderer"
REMOTE_RENDERER = Path("/renderer")
COMPOSITIONS = {"BlueprintExplainer", "MachineMetaphor"}
REQUIRED_SECRETS = ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "MODAL_SILENT_RENDER_AUTH_TOKEN")

missing = [name for name in REQUIRED_SECRETS if not os.environ.get(name)]
if missing:
    raise RuntimeError(f"Missing required deployment secrets: {', '.join(missing)}")

app = modal.App(APP_NAME)
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "chromium", "ffmpeg", "curl", "ca-certificates", "fonts-liberation",
        "fonts-noto-color-emoji", "libasound2", "libatk-bridge2.0-0", "libatk1.0-0",
        "libcups2", "libdrm2", "libgbm1", "libgtk-3-0", "libnss3", "libx11-xcb1",
        "libxcomposite1", "libxdamage1", "libxfixes3", "libxrandr2",
    )
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
        "apt-get install -y nodejs",
    )
    .pip_install("supabase>=2.4.0", "httpx>=0.24,<0.28", "fastapi[standard]")
    # copy=True so node_modules can be baked into the image at build time —
    # per-request `npm ci` cost ~90s on the trial renderer.
    .add_local_dir(
        str(LOCAL_RENDERER),
        remote_path=str(REMOTE_RENDERER),
        copy=True,
        ignore=["node_modules", ".remotion", "output"],
    )
    .run_commands(f"cd {REMOTE_RENDERER} && npm install --no-audit --no-fund")
)
secret = modal.Secret.from_dict({name: os.environ[name] for name in REQUIRED_SECRETS})


def _safe_filename(value: object, fallback: str) -> str:
    cleaned = Path(str(value or "")).name.strip()
    if not cleaned or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.mp4", cleaned):
        return fallback
    return cleaned


def _authorized(request: Request) -> bool:
    supplied = request.headers.get("authorization", "")
    expected = f"Bearer {os.environ['MODAL_SILENT_RENDER_AUTH_TOKEN']}"
    return hmac.compare_digest(supplied, expected)


@app.function(image=image, secrets=[secret], timeout=1800, memory=8192, cpu=4.0)
@modal.fastapi_endpoint(method="POST", label="silent-reel-render")
async def render_silent_reel(request: Request) -> dict:
    if not _authorized(request):
        raise HTTPException(401, "invalid render authorization")
    body = await request.json()
    composition = str(body.get("composition") or "BlueprintExplainer")
    if composition not in COMPOSITIONS:
        raise HTTPException(400, f"composition must be one of {sorted(COMPOSITIONS)}")
    props = body.get("input_props")
    if not isinstance(props, dict) or not isinstance(props.get("states"), list) or not props["states"]:
        raise HTTPException(400, "input_props.states must be a non-empty list")
    total_sec = sum(float(s.get("seconds") or 0) for s in props["states"])
    if not 3 <= total_sec <= 60:
        raise HTTPException(400, f"total duration {total_sec}s must be between 3 and 60 seconds")
    quality = str(body.get("quality") or "production")
    crf = "18" if quality == "production" else "28"
    output_name = _safe_filename(body.get("output_filename"), f"{uuid.uuid4().hex}.mp4")

    started = time.monotonic()
    work = Path(tempfile.mkdtemp(prefix="silent-reel-"))
    output_path = work / output_name
    props_path = work / "props.json"
    props_path.write_text(json.dumps(props), encoding="utf-8")

    render = subprocess.run(
        [
            "./node_modules/.bin/remotion", "render", "src/index.tsx", composition, str(output_path),
            "--props", str(props_path),
            "--browser-executable=/usr/bin/chromium",
            "--codec=h264", "--pixel-format=yuv420p", f"--crf={crf}",
            "--concurrency=2", "--log=warn",
        ],
        cwd=REMOTE_RENDERER, capture_output=True, text=True, timeout=1500,
        env={
            **os.environ,
            "PUPPETEER_EXECUTABLE_PATH": "/usr/bin/chromium",
            "REMOTION_CHROMIUM_FLAGS": "--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage",
            "NODE_ENV": "production",
        },
    )
    if render.returncode or not output_path.exists():
        raise HTTPException(502, {
            "message": "Remotion render failed", "exit_code": render.returncode,
            "stderr": render.stderr[-1800:], "stdout": render.stdout[-800:],
        })

    output_bytes = output_path.read_bytes()
    from supabase import create_client

    storage = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"]).storage
    bucket = "remotion-renders"
    try:
        storage.get_bucket(bucket)
    except Exception:
        storage.create_bucket(bucket, options={"public": True})
    storage_path = f"silent-reels/{time.strftime('%Y-%m-%d')}/{output_name}"
    storage.from_(bucket).upload(path=storage_path, file=output_bytes,
                                 file_options={"content-type": "video/mp4", "upsert": "true"})
    return {
        "schema_version": "1.0",
        "contract_type": "modal_silent_reel_render_receipt",
        "render_id": f"render_{uuid.uuid4().hex}",
        "composition": composition,
        "renderer": {"engine": "remotion", "version": "4.0.434", "lane": "modal-cpu"},
        "duration_sec": total_sec,
        "output_sha256": hashlib.sha256(output_bytes).hexdigest(),
        "bytes": len(output_bytes),
        "url": storage.from_(bucket).get_public_url(storage_path),
        "storage_path": storage_path,
        "render_time_sec": round(time.monotonic() - started, 3),
    }
