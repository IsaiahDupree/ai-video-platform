"""
Render Trigger

Triggers video rendering via:
- Remotion CLI
- Motion Canvas (Playwright automation)
- Local ffmpeg composition
"""

import asyncio
import os
import json
import subprocess
from typing import Optional, Literal
from pathlib import Path
from pydantic import BaseModel, Field
from loguru import logger


RenderEngine = Literal["remotion", "motion_canvas", "ffmpeg"]


class RenderConfig(BaseModel):
    """Configuration for render triggering."""
    engine: RenderEngine = "remotion"
    output_dir: str = Field(alias="outputDir")
    project_name: str = Field(default="video", alias="projectName")
    
    # Remotion settings
    remotion_root: Optional[str] = Field(None, alias="remotionRoot")
    composition_id: str = Field(default="Main", alias="compositionId")
    
    # Motion Canvas settings
    motion_canvas_root: Optional[str] = Field(None, alias="motionCanvasRoot")
    editor_url: str = Field(default="http://localhost:9000", alias="editorUrl")
    
    # Common settings
    headless: bool = True
    timeout_minutes: int = Field(default=15, alias="timeoutMinutes")
    
    class Config:
        populate_by_name = True


class RenderResult(BaseModel):
    """Result of render operation."""
    success: bool
    output_path: Optional[str] = Field(None, alias="outputPath")
    duration_seconds: Optional[float] = Field(None, alias="durationSeconds")
    error: Optional[str] = None
    engine: str
    
    class Config:
        populate_by_name = True


async def trigger_remotion_render(
    render_plan: dict,
    config: RenderConfig,
) -> RenderResult:
    """
    Trigger Remotion render via CLI.
    
    Args:
        render_plan: Render plan with layers
        config: Render configuration
        
    Returns:
        RenderResult
    """
    try:
        remotion_root = config.remotion_root or os.getcwd()
        output_path = os.path.join(config.output_dir, f"{config.project_name}.mp4")
        
        # Write render plan to props file
        props_path = os.path.join(config.output_dir, "props.json")
        Path(config.output_dir).mkdir(parents=True, exist_ok=True)
        
        with open(props_path, "w") as f:
            json.dump(render_plan, f, indent=2)
        
        # Build Remotion CLI command
        cmd = [
            "npx", "remotion", "render",
            config.composition_id,
            output_path,
            "--props", props_path,
        ]
        
        if config.headless:
            cmd.append("--disable-headless")
        
        # Run render
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=remotion_root,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=config.timeout_minutes * 60,
        )
        
        if process.returncode != 0:
            return RenderResult(
                success=False,
                error=stderr.decode()[:500],
                engine="remotion",
            )
        
        # Get video duration
        duration = await probe_video_duration(output_path)
        
        return RenderResult(
            success=True,
            output_path=output_path,
            duration_seconds=duration,
            engine="remotion",
        )
    
    except asyncio.TimeoutError:
        return RenderResult(
            success=False,
            error="Render timed out",
            engine="remotion",
        )
    except Exception as e:
        return RenderResult(
            success=False,
            error=str(e),
            engine="remotion",
        )


async def trigger_motion_canvas_render(
    render_plan: dict,
    config: RenderConfig,
) -> RenderResult:
    """
    Trigger Motion Canvas render via Playwright.
    
    Args:
        render_plan: Render plan
        config: Render configuration
        
    Returns:
        RenderResult
    """
    try:
        from playwright.async_api import async_playwright
        
        mc_root = config.motion_canvas_root or os.getcwd()
        output_path = os.path.join(config.output_dir, f"{config.project_name}.mp4")
        
        # Write render plan
        plan_path = os.path.join(mc_root, "src", "renderPlan.json")
        with open(plan_path, "w") as f:
            json.dump(render_plan, f, indent=2)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=config.headless)
            page = await browser.new_page()
            
            # Navigate to Motion Canvas editor
            await page.goto(config.editor_url)
            
            # Wait for editor to load
            await page.wait_for_selector('[data-testid="timeline"]', timeout=30000)
            
            # Click render button
            await page.click('[data-testid="render-button"]')
            
            # Wait for render to complete
            await page.wait_for_selector(
                '[data-testid="render-complete"]',
                timeout=config.timeout_minutes * 60 * 1000,
            )
            
            await browser.close()
        
        # Check for output
        expected_output = os.path.join(mc_root, "output", "project.mp4")
        if os.path.exists(expected_output):
            # Move to output dir
            Path(config.output_dir).mkdir(parents=True, exist_ok=True)
            os.rename(expected_output, output_path)
        
        duration = await probe_video_duration(output_path)
        
        return RenderResult(
            success=True,
            output_path=output_path,
            duration_seconds=duration,
            engine="motion_canvas",
        )
    
    except Exception as e:
        return RenderResult(
            success=False,
            error=str(e),
            engine="motion_canvas",
        )


async def trigger_ffmpeg_render(
    render_plan: dict,
    config: RenderConfig,
) -> RenderResult:
    """
    Trigger FFmpeg-based render (simple composition).
    
    Args:
        render_plan: Render plan with layers
        config: Render configuration
        
    Returns:
        RenderResult
    """
    try:
        output_path = os.path.join(config.output_dir, f"{config.project_name}.mp4")
        Path(config.output_dir).mkdir(parents=True, exist_ok=True)
        
        fps = render_plan.get("fps", 30)
        width = render_plan.get("width", 1080)
        height = render_plan.get("height", 1920)
        duration_frames = render_plan.get("durationInFrames", 900)
        duration_seconds = duration_frames / fps
        
        layers = render_plan.get("layers", [])
        
        # Find video layers
        video_layers = [l for l in layers if l.get("kind") == "VIDEO" and l.get("src")]
        
        if not video_layers:
            # Generate blank video
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", f"color=c=black:s={width}x{height}:d={duration_seconds}:r={fps}",
                "-c:v", "libx264",
                "-preset", "fast",
                output_path,
            ]
        else:
            # Use first video layer
            first_layer = video_layers[0]
            src = first_layer.get("src", "")
            
            if src.startswith("mock://"):
                # Generate placeholder
                cmd = [
                    "ffmpeg", "-y",
                    "-f", "lavfi",
                    "-i", f"color=c=blue:s={width}x{height}:d={duration_seconds}:r={fps}",
                    "-c:v", "libx264",
                    "-preset", "fast",
                    output_path,
                ]
            else:
                # Use actual video
                cmd = [
                    "ffmpeg", "-y",
                    "-i", src,
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-t", str(duration_seconds),
                    output_path,
                ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        _, stderr = await process.communicate()
        
        if process.returncode != 0:
            return RenderResult(
                success=False,
                error=stderr.decode()[:500],
                engine="ffmpeg",
            )
        
        duration = await probe_video_duration(output_path)
        
        return RenderResult(
            success=True,
            output_path=output_path,
            duration_seconds=duration,
            engine="ffmpeg",
        )
    
    except Exception as e:
        return RenderResult(
            success=False,
            error=str(e),
            engine="ffmpeg",
        )


async def probe_video_duration(file_path: str) -> float:
    """Get video duration using ffprobe."""
    if not os.path.exists(file_path):
        return 0
    
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path,
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    
    stdout, _ = await process.communicate()
    
    try:
        return float(stdout.decode().strip())
    except (ValueError, AttributeError):
        return 0


async def trigger_render(
    render_plan: dict,
    config: RenderConfig,
) -> RenderResult:
    """
    Trigger render using configured engine.
    
    Args:
        render_plan: Render plan
        config: Render configuration
        
    Returns:
        RenderResult
    """
    logger.info(f"🎬 Starting render with engine: {config.engine}")
    
    if config.engine == "remotion":
        return await trigger_remotion_render(render_plan, config)
    elif config.engine == "motion_canvas":
        return await trigger_motion_canvas_render(render_plan, config)
    elif config.engine == "ffmpeg":
        return await trigger_ffmpeg_render(render_plan, config)
    else:
        return RenderResult(
            success=False,
            error=f"Unknown engine: {config.engine}",
            engine=config.engine,
        )


def trigger_render_sync(
    render_plan: dict,
    config: RenderConfig,
) -> RenderResult:
    """Synchronous version of trigger_render."""
    return asyncio.run(trigger_render(render_plan, config))


async def save_render_plan(
    render_plan: dict,
    output_dir: str,
    filename: str = "render_plan.json",
) -> str:
    """Save render plan to JSON file."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    path = os.path.join(output_dir, filename)
    
    with open(path, "w") as f:
        json.dump(render_plan, f, indent=2)
    
    logger.info(f"📝 Saved render plan: {path}")
    return path
