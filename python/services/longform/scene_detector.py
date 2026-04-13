"""
Scene Detector — PySceneDetect wrapper for shot boundary detection.

Detects visual cut points in source video to create a "safe cut map"
for the timeline planner.
"""

from __future__ import annotations

import os
from typing import List, Optional

from loguru import logger

from .types import SceneBoundary, SceneDetectionResult


class SceneDetector:
    """Detect shot boundaries using PySceneDetect."""

    def __init__(
        self,
        threshold: float = 27.0,
        min_scene_len_sec: float = 1.0,
        adaptive_threshold: float = 3.5,
        use_adaptive: bool = True,
    ):
        """
        Args:
            threshold: ContentDetector sensitivity (lower = more sensitive)
            min_scene_len_sec: Minimum scene length in seconds
            adaptive_threshold: AdaptiveDetector sensitivity
            use_adaptive: Whether to also run AdaptiveDetector and merge results
        """
        self.threshold = threshold
        self.min_scene_len_sec = min_scene_len_sec
        self.adaptive_threshold = adaptive_threshold
        self.use_adaptive = use_adaptive

    def detect_scenes(self, video_path: str) -> SceneDetectionResult:
        """
        Detect scene boundaries in a video file.

        Returns:
            SceneDetectionResult with scenes list and safe_cut_points array
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")

        from scenedetect import open_video, SceneManager
        from scenedetect.detectors import ContentDetector, AdaptiveDetector

        video = open_video(video_path)
        fps = video.frame_rate

        # Run ContentDetector
        scene_manager = SceneManager()
        scene_manager.add_detector(
            ContentDetector(
                threshold=self.threshold,
                min_scene_len=int(self.min_scene_len_sec * fps),
            )
        )

        logger.info(f"Detecting scenes in {video_path} (ContentDetector, threshold={self.threshold})")
        scene_manager.detect_scenes(video, show_progress=False)
        content_scenes = scene_manager.get_scene_list()

        # Optionally run AdaptiveDetector and merge
        adaptive_scenes = []
        if self.use_adaptive:
            video = open_video(video_path)  # re-open for second pass
            scene_manager2 = SceneManager()
            scene_manager2.add_detector(
                AdaptiveDetector(
                    adaptive_threshold=self.adaptive_threshold,
                    min_scene_len=int(self.min_scene_len_sec * fps),
                )
            )
            logger.info("Running AdaptiveDetector second pass")
            scene_manager2.detect_scenes(video, show_progress=False)
            adaptive_scenes = scene_manager2.get_scene_list()

        # Merge and deduplicate scene boundaries
        all_cut_times = set()
        for scene_list, detector_name in [(content_scenes, "content"), (adaptive_scenes, "adaptive")]:
            for scene in scene_list:
                start_sec = scene[0].get_seconds()
                end_sec = scene[1].get_seconds()
                all_cut_times.add(round(start_sec, 3))
                all_cut_times.add(round(end_sec, 3))

        # Remove 0.0 (video start) — it's always a boundary
        all_cut_times.discard(0.0)

        # Build sorted safe cut points
        safe_cut_points = sorted(all_cut_times)

        # Build scene boundaries from content detector results (primary)
        scenes: List[SceneBoundary] = []
        scene_source = content_scenes if content_scenes else adaptive_scenes
        for idx, scene in enumerate(scene_source):
            start_sec = scene[0].get_seconds()
            end_sec = scene[1].get_seconds()
            scenes.append(SceneBoundary(
                scene_id=idx + 1,
                start_time=round(start_sec, 3),
                end_time=round(end_sec, 3),
                transition_type="cut",
                confidence=0.9 if len(scene_source) == len(content_scenes) else 0.7,
            ))

        result = SceneDetectionResult(
            scenes=scenes,
            safe_cut_points=safe_cut_points,
        )
        logger.info(
            f"Scene detection complete: {len(scenes)} scenes, "
            f"{len(safe_cut_points)} cut points"
        )
        return result


# ─── CLI Test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python -m services.longform.scene_detector <video_path>")
        sys.exit(1)

    detector = SceneDetector()
    result = detector.detect_scenes(sys.argv[1])
    print(json.dumps(result.to_dict(), indent=2))
