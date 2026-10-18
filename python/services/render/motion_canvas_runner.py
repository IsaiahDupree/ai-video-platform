"""
Motion Canvas Render Runner

Automates Motion Canvas rendering via Playwright.
Opens editor with ?render to trigger render, monitors output.
"""

import os
import asyncio
import json
import subprocess
from pathlib import Path
from typing import Optional
from datetime import datetime
from loguru import logger


class MotionCanvasConfig:
    """Configuration for Motion Canvas rendering."""
    
    def __init__(
        self,
        editor_url: str = "http://localhost:9000",
        output_dir: str = "output",
        expected_extensions: list[str] = None,
        server_startup_ms: int = 25000,
        render_timeout_ms: int = 15 * 60 * 1000,
        poll_interval_ms: int = 1000,
        project_dir: Optional[str] = None,
    ):
        self.editor_url = editor_url
        self.output_dir = output_dir
        self.expected_extensions = expected_extensions or [".mp4", ".mov", ".webm", ".mkv"]
        self.server_startup_ms = server_startup_ms
        self.render_timeout_ms = render_timeout_ms
        self.poll_interval_ms = poll_interval_ms
        self.project_dir = project_dir or os.getcwd()


class ServerProcess:
    """Manages Motion Canvas dev server."""
    
    def __init__(self, project_dir: str):
        self.project_dir = project_dir
        self.process: Optional[subprocess.Popen] = None
        self.logs: list[str] = []
    
    def start(self) -> None:
        """Start the Motion Canvas dev server."""
        cmd = ["pnpm", "serve"]
        
        self.process = subprocess.Popen(
            cmd,
            cwd=self.project_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        
        logger.info(f"Started Motion Canvas server (PID: {self.process.pid})")
    
    def stop(self) -> None:
        """Stop the dev server."""
        if self.process and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
            logger.info("Stopped Motion Canvas server")
    
    def is_running(self) -> bool:
        """Check if server is still running."""
        return self.process is not None and self.process.poll() is None
    
    def read_logs(self) -> list[str]:
        """Read recent stdout/stderr."""
        if not self.process:
            return []
        
        # Non-blocking read
        try:
            if self.process.stdout:
                while True:
                    line = self.process.stdout.readline()
                    if not line:
                        break
                    self.logs.append(line)
        except:
            pass
        
        return self.logs[-50:]


def list_files_recursive(directory: str) -> list[dict]:
    """
    List all files in directory recursively.
    
    Returns:
        List of dicts with 'path' and 'mtime_ms'
    """
    results = []
    path = Path(directory)
    
    if not path.exists():
        return results
    
    for item in path.rglob("*"):
        if item.is_file():
            stat = item.stat()
            results.append({
                "path": str(item),
                "mtime_ms": stat.st_mtime * 1000,
                "size": stat.st_size,
            })
    
    return results


def find_newest_video(
    directory: str,
    extensions: list[str],
    after_ms: float = 0,
) -> Optional[dict]:
    """
    Find the newest video file in directory.
    
    Args:
        directory: Directory to search
        extensions: Valid extensions
        after_ms: Only consider files modified after this time
        
    Returns:
        Dict with path and mtime, or None
    """
    files = list_files_recursive(directory)
    
    videos = [
        f for f in files
        if any(f["path"].lower().endswith(ext) for ext in extensions)
        and f["mtime_ms"] > after_ms
    ]
    
    if not videos:
        return None
    
    return max(videos, key=lambda f: f["mtime_ms"])


def file_size_stable(path: str, samples: int = 3, delay_ms: int = 750) -> bool:
    """
    Check if file size is stable (not being written).
    
    Args:
        path: File path
        samples: Number of samples
        delay_ms: Delay between samples
        
    Returns:
        True if size is stable
    """
    import time
    
    last_size = -1
    
    for _ in range(samples):
        try:
            size = Path(path).stat().st_size
        except:
            return False
        
        if last_size != -1 and size != last_size:
            last_size = size
            time.sleep(delay_ms / 1000)
            continue
        
        last_size = size
        time.sleep(delay_ms / 1000)
    
    return True


async def wait_for_server(url: str, timeout_ms: int) -> bool:
    """
    Wait for server to be ready.
    
    Args:
        url: Server URL to check
        timeout_ms: Timeout in milliseconds
        
    Returns:
        True if server is ready
    """
    import aiohttp
    
    start = datetime.now()
    timeout_sec = timeout_ms / 1000
    
    while (datetime.now() - start).total_seconds() < timeout_sec:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=2)) as resp:
                    if resp.status == 200:
                        return True
        except:
            pass
        
        await asyncio.sleep(0.5)
    
    return False


async def render_with_playwright(
    config: MotionCanvasConfig,
    headless: bool = True,
) -> Optional[str]:
    """
    Render Motion Canvas project using Playwright.
    
    Opens the editor with ?render to trigger rendering,
    waits for output video to appear.
    
    Args:
        config: Render configuration
        headless: Run browser headless
        
    Returns:
        Path to rendered video, or None
    """
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        raise ImportError("Playwright not installed. Run: pip install playwright && playwright install")
    
    output_dir = Path(config.project_dir) / config.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Snapshot before render
    before_ms = datetime.now().timestamp() * 1000
    
    render_url = f"{config.editor_url}/?render"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        page = await browser.new_page()
        
        logger.info(f"Opening {render_url}")
        await page.goto(render_url, wait_until="domcontentloaded")
        
        # Wait for render to complete
        start = datetime.now()
        timeout_sec = config.render_timeout_ms / 1000
        poll_sec = config.poll_interval_ms / 1000
        
        found = None
        
        while (datetime.now() - start).total_seconds() < timeout_sec:
            newest = find_newest_video(
                str(output_dir),
                config.expected_extensions,
                after_ms=before_ms,
            )
            
            if newest:
                # Wait for file to finish writing
                if file_size_stable(newest["path"]):
                    found = newest
                    break
            
            await asyncio.sleep(poll_sec)
        
        await browser.close()
    
    if found:
        logger.info(f"Render complete: {found['path']}")
        return found["path"]
    
    return None


async def run_motion_canvas_render(
    project_dir: str,
    output_dir: str = "output",
    editor_url: str = "http://localhost:9000",
    start_server: bool = True,
    headless: bool = True,
    timeout_minutes: int = 15,
) -> dict:
    """
    Full Motion Canvas render pipeline.
    
    Args:
        project_dir: Path to Motion Canvas project
        output_dir: Output directory (relative to project)
        editor_url: Editor URL
        start_server: Whether to start dev server
        headless: Run browser headless
        timeout_minutes: Render timeout
        
    Returns:
        Dict with status and output path
    """
    config = MotionCanvasConfig(
        editor_url=editor_url,
        output_dir=output_dir,
        project_dir=project_dir,
        render_timeout_ms=timeout_minutes * 60 * 1000,
    )
    
    server = None
    
    try:
        if start_server:
            server = ServerProcess(project_dir)
            server.start()
            
            # Wait for server
            logger.info("Waiting for Motion Canvas server...")
            ready = await wait_for_server(
                editor_url,
                config.server_startup_ms,
            )
            
            if not ready:
                return {
                    "status": "error",
                    "error": "Server did not start in time",
                    "logs": server.read_logs(),
                }
        
        # Run render
        output_path = await render_with_playwright(config, headless)
        
        if output_path:
            return {
                "status": "success",
                "output_path": output_path,
            }
        else:
            return {
                "status": "error",
                "error": "Render timed out - no output detected",
                "logs": server.read_logs() if server else [],
            }
    
    finally:
        if server:
            server.stop()


def run_motion_canvas_render_sync(
    project_dir: str,
    **kwargs,
) -> dict:
    """Synchronous version of run_motion_canvas_render."""
    return asyncio.run(run_motion_canvas_render(project_dir, **kwargs))


class RenderOutputWatcher:
    """Watches for render output files."""
    
    def __init__(self, output_dir: str, extensions: list[str] = None):
        self.output_dir = Path(output_dir)
        self.extensions = extensions or [".mp4", ".mov", ".webm"]
        self._snapshot: dict[str, float] = {}
    
    def take_snapshot(self) -> None:
        """Take snapshot of current files."""
        self._snapshot = {}
        for f in list_files_recursive(str(self.output_dir)):
            self._snapshot[f["path"]] = f["mtime_ms"]
    
    def get_new_files(self) -> list[dict]:
        """Get files created/modified since snapshot."""
        current = list_files_recursive(str(self.output_dir))
        new_files = []
        
        for f in current:
            old_mtime = self._snapshot.get(f["path"], 0)
            if f["mtime_ms"] > old_mtime:
                new_files.append(f)
        
        return new_files
    
    def get_newest_video(self) -> Optional[str]:
        """Get the newest video file since snapshot."""
        new_files = self.get_new_files()
        
        videos = [
            f for f in new_files
            if any(f["path"].lower().endswith(ext) for ext in self.extensions)
        ]
        
        if not videos:
            return None
        
        newest = max(videos, key=lambda f: f["mtime_ms"])
        return newest["path"]
    
    def get_frame_sequence_dir(self) -> Optional[str]:
        """Get directory containing frame sequence."""
        new_files = self.get_new_files()
        
        # Find directories with many image files
        image_exts = [".png", ".jpg", ".jpeg", ".webp"]
        
        dirs: dict[str, int] = {}
        for f in new_files:
            if any(f["path"].lower().endswith(ext) for ext in image_exts):
                dir_path = str(Path(f["path"]).parent)
                dirs[dir_path] = dirs.get(dir_path, 0) + 1
        
        # Find dir with most images (frame sequence)
        if not dirs:
            return None
        
        best_dir = max(dirs, key=dirs.get)
        if dirs[best_dir] >= 10:  # At least 10 frames
            return best_dir
        
        return None
