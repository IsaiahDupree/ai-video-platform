"""
Video Toolkit Pub/Sub Service

Pub/Sub service for extracting and syncing video toolkit resources
from Remotion workspace to other projects.

Topics:
- video_toolkit.extract - Extract toolkit to target directory
- video_toolkit.sync - Sync resources between projects
- video_toolkit.push - Push changes to GitHub

Events:
- TOOLKIT_EXTRACT_REQUESTED
- TOOLKIT_EXTRACT_COMPLETED
- TOOLKIT_SYNC_REQUESTED
- TOOLKIT_SYNC_COMPLETED
- TOOLKIT_GITHUB_PUSH_REQUESTED
- TOOLKIT_GITHUB_PUSH_COMPLETED
"""
import os
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum
from loguru import logger

from services.event_bus import EventBus, Event


class VideoToolkitTopic(Enum):
    """Pub/Sub topics for video toolkit operations"""
    EXTRACT = "video_toolkit.extract"
    SYNC = "video_toolkit.sync"
    PUSH = "video_toolkit.push"
    STATUS = "video_toolkit.status"


class ToolkitEventType(Enum):
    """Event types for video toolkit operations"""
    EXTRACT_REQUESTED = "TOOLKIT_EXTRACT_REQUESTED"
    EXTRACT_COMPLETED = "TOOLKIT_EXTRACT_COMPLETED"
    EXTRACT_FAILED = "TOOLKIT_EXTRACT_FAILED"
    SYNC_REQUESTED = "TOOLKIT_SYNC_REQUESTED"
    SYNC_COMPLETED = "TOOLKIT_SYNC_COMPLETED"
    SYNC_FAILED = "TOOLKIT_SYNC_FAILED"
    GITHUB_PUSH_REQUESTED = "TOOLKIT_GITHUB_PUSH_REQUESTED"
    GITHUB_PUSH_COMPLETED = "TOOLKIT_GITHUB_PUSH_COMPLETED"
    GITHUB_PUSH_FAILED = "TOOLKIT_GITHUB_PUSH_FAILED"


@dataclass
class ToolkitResource:
    """A resource in the video toolkit"""
    name: str
    path: str
    type: str  # "component", "script", "doc", "asset", "config"
    size_bytes: int = 0
    last_modified: Optional[str] = None


@dataclass
class ExtractRequest:
    """Request to extract video toolkit"""
    target_dir: str
    include_motion_canvas: bool = False
    include_docs: bool = True
    include_scripts: bool = True
    include_assets: bool = True
    components_only: bool = False


@dataclass
class ExtractResult:
    """Result of toolkit extraction"""
    success: bool
    target_dir: str
    files_copied: int
    total_size_bytes: int
    resources: List[ToolkitResource] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class GitPushResult:
    """Result of GitHub push"""
    success: bool
    repo_path: str
    commit_hash: Optional[str] = None
    branch: str = "main"
    files_changed: int = 0
    message: str = ""
    errors: List[str] = field(default_factory=list)


class VideoToolkitService:
    """
    Service for managing video toolkit extraction and synchronization.
    
    Integrates with pub/sub for async operations.
    """
    
    # Default source paths
    REMOTION_PATH = "/Users/isaiahdupree/Documents/Software/Remotion"
    
    # Resource directories to extract
    COMPONENT_DIRS = [
        "src/components",
        "src/audio",
        "src/sfx",
        "src/video-toolkit",
        "src/utils",
        "src/types",
        "src/animations",
    ]
    
    SCRIPT_DIRS = [
        "scripts",
    ]
    
    DOC_DIRS = [
        "docs",
    ]
    
    ASSET_DIRS = [
        "public/assets",
        "data",
    ]
    
    CONFIG_FILES = [
        "remotion.config.ts",
        "tsconfig.json",
        "package.json",
    ]
    
    def __init__(self, event_bus: Optional[EventBus] = None):
        self.event_bus = event_bus
        self.remotion_path = Path(self.REMOTION_PATH)
        logger.info(f"[VideoToolkitService] Initialized with source: {self.remotion_path}")
    
    def _publish_event(self, event_type: ToolkitEventType, data: Dict[str, Any]):
        """Publish event to event bus if available"""
        if self.event_bus:
            event = Event(
                event_type=event_type.value,
                data=data,
                timestamp=datetime.utcnow()
            )
            self.event_bus.publish(event)
            logger.info(f"[VideoToolkitService] Published event: {event_type.value}")
    
    def list_resources(self) -> List[ToolkitResource]:
        """List all available resources in the toolkit"""
        resources = []
        
        if not self.remotion_path.exists():
            logger.warning(f"[VideoToolkitService] Remotion path not found: {self.remotion_path}")
            return resources
        
        # Components
        for dir_path in self.COMPONENT_DIRS:
            full_path = self.remotion_path / dir_path
            if full_path.exists():
                for file in full_path.rglob("*"):
                    if file.is_file() and not file.name.startswith("."):
                        resources.append(ToolkitResource(
                            name=file.name,
                            path=str(file.relative_to(self.remotion_path)),
                            type="component",
                            size_bytes=file.stat().st_size,
                            last_modified=datetime.fromtimestamp(file.stat().st_mtime).isoformat()
                        ))
        
        # Scripts
        for dir_path in self.SCRIPT_DIRS:
            full_path = self.remotion_path / dir_path
            if full_path.exists():
                for file in full_path.rglob("*"):
                    if file.is_file() and not file.name.startswith("."):
                        resources.append(ToolkitResource(
                            name=file.name,
                            path=str(file.relative_to(self.remotion_path)),
                            type="script",
                            size_bytes=file.stat().st_size,
                            last_modified=datetime.fromtimestamp(file.stat().st_mtime).isoformat()
                        ))
        
        # Docs
        for dir_path in self.DOC_DIRS:
            full_path = self.remotion_path / dir_path
            if full_path.exists():
                for file in full_path.rglob("*"):
                    if file.is_file() and not file.name.startswith("."):
                        resources.append(ToolkitResource(
                            name=file.name,
                            path=str(file.relative_to(self.remotion_path)),
                            type="doc",
                            size_bytes=file.stat().st_size,
                            last_modified=datetime.fromtimestamp(file.stat().st_mtime).isoformat()
                        ))
        
        # Config files
        for config_file in self.CONFIG_FILES:
            full_path = self.remotion_path / config_file
            if full_path.exists():
                resources.append(ToolkitResource(
                    name=full_path.name,
                    path=config_file,
                    type="config",
                    size_bytes=full_path.stat().st_size,
                    last_modified=datetime.fromtimestamp(full_path.stat().st_mtime).isoformat()
                ))
        
        logger.info(f"[VideoToolkitService] Found {len(resources)} resources")
        return resources
    
    def extract(self, request: ExtractRequest) -> ExtractResult:
        """
        Extract video toolkit to target directory.
        
        Publishes TOOLKIT_EXTRACT_REQUESTED and TOOLKIT_EXTRACT_COMPLETED events.
        """
        self._publish_event(ToolkitEventType.EXTRACT_REQUESTED, asdict(request))
        
        target = Path(request.target_dir)
        files_copied = 0
        total_size = 0
        resources = []
        errors = []
        
        try:
            # Create target directory
            target.mkdir(parents=True, exist_ok=True)
            
            # Determine what to copy
            dirs_to_copy = []
            
            if request.components_only:
                dirs_to_copy = self.COMPONENT_DIRS
            else:
                dirs_to_copy = self.COMPONENT_DIRS.copy()
                if request.include_scripts:
                    dirs_to_copy.extend(self.SCRIPT_DIRS)
                if request.include_docs:
                    dirs_to_copy.extend(self.DOC_DIRS)
                if request.include_assets:
                    dirs_to_copy.extend(self.ASSET_DIRS)
            
            # Copy directories
            for dir_path in dirs_to_copy:
                src = self.remotion_path / dir_path
                if src.exists():
                    dst = target / dir_path
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    
                    if src.is_dir():
                        shutil.copytree(src, dst, dirs_exist_ok=True)
                        
                        # Count files
                        for file in dst.rglob("*"):
                            if file.is_file():
                                files_copied += 1
                                total_size += file.stat().st_size
                                resources.append(ToolkitResource(
                                    name=file.name,
                                    path=str(file.relative_to(target)),
                                    type=self._get_resource_type(dir_path),
                                    size_bytes=file.stat().st_size
                                ))
                    else:
                        shutil.copy2(src, dst)
                        files_copied += 1
                        total_size += dst.stat().st_size
            
            # Copy config files
            if not request.components_only:
                for config_file in self.CONFIG_FILES:
                    src = self.remotion_path / config_file
                    if src.exists():
                        dst = target / config_file
                        shutil.copy2(src, dst)
                        files_copied += 1
                        total_size += dst.stat().st_size
                        resources.append(ToolkitResource(
                            name=config_file,
                            path=config_file,
                            type="config",
                            size_bytes=dst.stat().st_size
                        ))
            
            # Copy Motion Canvas if requested
            if request.include_motion_canvas:
                motion_src = self.remotion_path / "motion-canvas"
                if motion_src.exists():
                    motion_dst = target / "motion-canvas"
                    shutil.copytree(motion_src, motion_dst, dirs_exist_ok=True)
                    for file in motion_dst.rglob("*"):
                        if file.is_file():
                            files_copied += 1
                            total_size += file.stat().st_size
            
            result = ExtractResult(
                success=True,
                target_dir=str(target),
                files_copied=files_copied,
                total_size_bytes=total_size,
                resources=resources
            )
            
            self._publish_event(ToolkitEventType.EXTRACT_COMPLETED, asdict(result))
            logger.info(f"[VideoToolkitService] Extracted {files_copied} files to {target}")
            
            return result
            
        except Exception as e:
            error_msg = str(e)
            errors.append(error_msg)
            logger.error(f"[VideoToolkitService] Extract failed: {error_msg}")
            
            result = ExtractResult(
                success=False,
                target_dir=str(target),
                files_copied=files_copied,
                total_size_bytes=total_size,
                errors=errors
            )
            
            self._publish_event(ToolkitEventType.EXTRACT_FAILED, asdict(result))
            return result
    
    def _get_resource_type(self, dir_path: str) -> str:
        """Determine resource type from directory path"""
        if "component" in dir_path or "src/" in dir_path:
            return "component"
        elif "script" in dir_path:
            return "script"
        elif "doc" in dir_path:
            return "doc"
        elif "asset" in dir_path or "public" in dir_path:
            return "asset"
        return "other"
    
    def push_to_github(
        self,
        repo_path: str,
        commit_message: str = "Update video toolkit resources",
        branch: str = "main"
    ) -> GitPushResult:
        """
        Push changes to GitHub.
        
        Publishes TOOLKIT_GITHUB_PUSH_REQUESTED and TOOLKIT_GITHUB_PUSH_COMPLETED events.
        """
        self._publish_event(ToolkitEventType.GITHUB_PUSH_REQUESTED, {
            "repo_path": repo_path,
            "commit_message": commit_message,
            "branch": branch
        })
        
        errors = []
        
        try:
            repo = Path(repo_path)
            if not repo.exists():
                raise FileNotFoundError(f"Repository path not found: {repo_path}")
            
            # Git add
            result = subprocess.run(
                ["git", "add", "-A"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                errors.append(f"git add failed: {result.stderr}")
            
            # Git commit
            result = subprocess.run(
                ["git", "commit", "-m", commit_message],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            
            # Check if there were changes to commit
            if "nothing to commit" in result.stdout:
                return GitPushResult(
                    success=True,
                    repo_path=repo_path,
                    branch=branch,
                    files_changed=0,
                    message="No changes to commit"
                )
            
            if result.returncode != 0 and "nothing to commit" not in result.stdout:
                errors.append(f"git commit failed: {result.stderr}")
            
            # Get commit hash
            hash_result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            commit_hash = hash_result.stdout.strip() if hash_result.returncode == 0 else None
            
            # Git push
            result = subprocess.run(
                ["git", "push", "origin", branch],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                errors.append(f"git push failed: {result.stderr}")
            
            # Count changed files
            diff_result = subprocess.run(
                ["git", "diff", "--stat", "HEAD~1", "HEAD"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            files_changed = len([l for l in diff_result.stdout.split("\n") if "|" in l])
            
            push_result = GitPushResult(
                success=len(errors) == 0,
                repo_path=repo_path,
                commit_hash=commit_hash,
                branch=branch,
                files_changed=files_changed,
                message=commit_message,
                errors=errors
            )
            
            if push_result.success:
                self._publish_event(ToolkitEventType.GITHUB_PUSH_COMPLETED, asdict(push_result))
                logger.info(f"[VideoToolkitService] Pushed to GitHub: {commit_hash}")
            else:
                self._publish_event(ToolkitEventType.GITHUB_PUSH_FAILED, asdict(push_result))
            
            return push_result
            
        except Exception as e:
            error_msg = str(e)
            errors.append(error_msg)
            logger.error(f"[VideoToolkitService] GitHub push failed: {error_msg}")
            
            result = GitPushResult(
                success=False,
                repo_path=repo_path,
                branch=branch,
                errors=errors
            )
            
            self._publish_event(ToolkitEventType.GITHUB_PUSH_FAILED, asdict(result))
            return result


# Singleton instance
_toolkit_service: Optional[VideoToolkitService] = None

def get_toolkit_service() -> VideoToolkitService:
    """Get or create the video toolkit service singleton"""
    global _toolkit_service
    if _toolkit_service is None:
        _toolkit_service = VideoToolkitService()
    return _toolkit_service
