"""
Speaker Segmenter — SAM 3 / SAM 2 speaker isolation.

Detects the main speaker via face detection, segments them using
Meta's SAM 3 (facebookresearch/sam3) or SAM 2 as fallback,
and exports an alpha matte for compositing over B-roll in Remotion.

SAM 3 supports promptable segmentation and tracking in video,
making it ideal for isolating a speaker across frames.

GPU required. Falls back to mock mode for CPU-only development.
"""

from __future__ import annotations

import os
import subprocess
import tempfile
import uuid
from typing import List, Optional, Tuple

from loguru import logger

from .types import SpeakerMask, TranscriptionResult


class SpeakerSegmenter:
    """Isolate the main speaker from video background using SAM 2."""

    def __init__(
        self,
        sam2_checkpoint: Optional[str] = None,
        sam2_config: str = "sam2_hiera_large",
        output_dir: Optional[str] = None,
        device: str = "auto",
    ):
        """
        Args:
            sam2_checkpoint: Path to SAM 2 checkpoint. Auto-downloads if None.
            sam2_config: SAM 2 model config name.
            output_dir: Directory for output masks.
            device: "cuda", "cpu", or "auto" (detect GPU).
        """
        self.sam2_checkpoint = sam2_checkpoint
        self.sam2_config = sam2_config
        self.output_dir = output_dir or tempfile.mkdtemp(prefix="speaker_masks_")
        os.makedirs(self.output_dir, exist_ok=True)

        if device == "auto":
            self.device = self._detect_device()
        else:
            self.device = device

        self._sam2_available = self._check_sam2_available()

    @staticmethod
    def _detect_device() -> str:
        try:
            import torch
            return "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            return "cpu"

    def _check_sam2_available(self) -> bool:
        # Try SAM 3 first (facebookresearch/sam3)
        try:
            import sam3  # noqa: F401
            self._sam_version = 3
            return True
        except ImportError:
            pass
        # Fallback to SAM 2
        try:
            import sam2  # noqa: F401
            self._sam_version = 2
            return True
        except ImportError:
            self._sam_version = 0
            return False

    # ─── Face Detection ───────────────────────────────────────────────────

    def detect_speaker_face(
        self,
        video_path: str,
        sample_frame_sec: float = 2.0,
    ) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect the main speaker's face bounding box.
        Returns (x, y, w, h) in pixels or None if no face found.
        """
        try:
            import cv2
            import mediapipe as mp

            # Extract a sample frame
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(sample_frame_sec * fps))
            ret, frame = cap.read()
            cap.release()

            if not ret:
                logger.warning("Could not read frame for face detection")
                return None

            h, w = frame.shape[:2]

            # MediaPipe face detection
            mp_face = mp.solutions.face_detection
            with mp_face.FaceDetection(
                model_selection=1,  # Full range model
                min_detection_confidence=0.5,
            ) as face_det:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = face_det.process(rgb)

                if not results.detections:
                    logger.warning("No faces detected")
                    return None

                # Take the largest face (likely the main speaker)
                best = max(
                    results.detections,
                    key=lambda d: (
                        d.location_data.relative_bounding_box.width *
                        d.location_data.relative_bounding_box.height
                    ),
                )
                bbox = best.location_data.relative_bounding_box
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                bw = int(bbox.width * w)
                bh = int(bbox.height * h)

                # Expand bbox to include torso (roughly 2.5x the face height below)
                torso_expansion = int(bh * 2.5)
                side_expansion = int(bw * 0.5)
                x = max(0, x - side_expansion)
                y = max(0, y - int(bh * 0.3))
                bw = min(w - x, bw + side_expansion * 2)
                bh = min(h - y, bh + torso_expansion)

                logger.info(f"Detected speaker face+torso bbox: ({x}, {y}, {bw}, {bh})")
                return (x, y, bw, bh)

        except ImportError:
            logger.warning("cv2/mediapipe not available for face detection")
            return None
        except Exception as e:
            logger.warning(f"Face detection failed: {e}")
            return None

    # ─── SAM 2 Segmentation ──────────────────────────────────────────────

    def segment_with_sam(
        self,
        video_path: str,
        bbox: Tuple[int, int, int, int],
        start_time: float = 0.0,
        end_time: Optional[float] = None,
    ) -> str:
        """
        Run SAM 3 or SAM 2 segmentation on the speaker region.
        Returns path to the output mask video (grayscale).
        SAM 3 (facebookresearch/sam3) preferred when available.
        """
        if not self._sam2_available:
            logger.warning("No SAM model available, generating mock mask")
            return self._generate_mock_mask(video_path, start_time, end_time)

        if self._sam_version == 3:
            return self._segment_with_sam3(video_path, bbox, start_time, end_time)
        else:
            return self._segment_with_sam2(video_path, bbox, start_time, end_time)

    def _segment_with_sam3(
        self,
        video_path: str,
        bbox: Tuple[int, int, int, int],
        start_time: float = 0.0,
        end_time: Optional[float] = None,
    ) -> str:
        """Segment speaker using SAM 3 video predictor."""
        try:
            import torch
            import numpy as np
            import cv2
            from sam3.model_builder import build_sam3_video_predictor

            logger.info(f"Running SAM 3 segmentation on {self.device}")

            # Build SAM 3 video predictor (auto-downloads checkpoint from HuggingFace)
            predictor = build_sam3_video_predictor(device=self.device)

            # Extract frames to temp directory (SAM 3 needs frame directory)
            frames_dir = os.path.join(self.output_dir, "frames")
            os.makedirs(frames_dir, exist_ok=True)

            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            start_frame = int(start_time * fps)
            end_frame = int(end_time * fps) if end_time else total_frames

            # Extract frames as JPEG images
            frame_idx = 0
            frame_paths = []
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                if start_frame <= frame_idx <= end_frame:
                    path = os.path.join(frames_dir, f"{frame_idx:06d}.jpg")
                    cv2.imwrite(path, frame)
                    frame_paths.append(path)
                frame_idx += 1
            cap.release()
            logger.info(f"Extracted {len(frame_paths)} frames for SAM 3")

            mask_output_path = os.path.join(
                self.output_dir, f"mask_{uuid.uuid4().hex[:8]}.mp4"
            )

            with torch.inference_mode(), torch.autocast(self.device, dtype=torch.bfloat16):
                # Initialize state from frame directory
                state = predictor.init_state(video_path=frames_dir)

                # Add bounding box prompt on first frame
                x, y, bw, bh = bbox
                box = np.array([[x, y, x + bw, y + bh]], dtype=np.float32)
                _, obj_ids, mask_logits = predictor.add_new_points_or_box(
                    inference_state=state,
                    frame_idx=0,  # First extracted frame
                    obj_id=1,
                    box=box,
                )

                # Propagate through all frames and write mask video
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                out = cv2.VideoWriter(mask_output_path, fourcc, fps, (w, h), False)

                for frame_idx, obj_ids, mask_logits in predictor.propagate_in_video(state):
                    mask = (mask_logits[0] > 0.0).cpu().numpy().squeeze().astype(np.uint8) * 255
                    if mask.shape != (h, w):
                        mask = cv2.resize(mask, (w, h))
                    out.write(mask)

                out.release()
                predictor.reset_state(state)

            # Cleanup extracted frames
            import shutil
            shutil.rmtree(frames_dir, ignore_errors=True)

            logger.info(f"SAM 3 mask saved: {mask_output_path}")
            return mask_output_path

        except Exception as e:
            logger.error(f"SAM 3 segmentation failed: {e}", exc_info=True)
            return self._generate_mock_mask(video_path, start_time, end_time)

    def _segment_with_sam2(
        self,
        video_path: str,
        bbox: Tuple[int, int, int, int],
        start_time: float = 0.0,
        end_time: Optional[float] = None,
    ) -> str:
        """Fallback: Segment speaker using SAM 2."""
        try:
            import torch
            import numpy as np
            import cv2
            from sam2.build_sam import build_sam2_video_predictor

            logger.info(f"Running SAM 2 segmentation on {self.device}")

            predictor = build_sam2_video_predictor(
                self.sam2_config,
                self.sam2_checkpoint,
                device=self.device,
            )

            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            start_frame = int(start_time * fps)
            end_frame = int(end_time * fps) if end_time else total_frames
            cap.release()

            with torch.inference_mode(), torch.autocast(self.device, dtype=torch.float16):
                state = predictor.init_state(video_path)

                x, y, bw, bh = bbox
                box = np.array([x, y, x + bw, y + bh], dtype=np.float32)
                _, obj_ids, mask_logits = predictor.add_new_points_or_box(
                    inference_state=state,
                    frame_idx=start_frame,
                    obj_id=1,
                    box=box,
                )

                mask_output_path = os.path.join(
                    self.output_dir, f"mask_{uuid.uuid4().hex[:8]}.mp4"
                )
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                out = cv2.VideoWriter(mask_output_path, fourcc, fps, (w, h), False)

                for frame_idx, obj_ids, mask_logits in predictor.propagate_in_video(state):
                    if frame_idx < start_frame or frame_idx > end_frame:
                        continue
                    mask = (mask_logits[0] > 0.0).cpu().numpy().squeeze().astype(np.uint8) * 255
                    if mask.shape != (h, w):
                        mask = cv2.resize(mask, (w, h))
                    out.write(mask)

                out.release()

            logger.info(f"SAM 2 mask saved: {mask_output_path}")
            return mask_output_path

        except Exception as e:
            logger.error(f"SAM 2 segmentation failed: {e}")
            return self._generate_mock_mask(video_path, start_time, end_time)

    def _generate_mock_mask(
        self,
        video_path: str,
        start_time: float = 0.0,
        end_time: Optional[float] = None,
    ) -> str:
        """Generate a simple center-ellipse mock mask for CPU-only dev."""
        mask_path = os.path.join(self.output_dir, f"mock_mask_{uuid.uuid4().hex[:8]}.mp4")

        # Use FFmpeg to generate a white ellipse on black background
        # matching the source video dimensions and duration
        duration_args = []
        if end_time is not None:
            duration_args = ["-t", str(end_time - start_time)]

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-ss", str(start_time),
            *duration_args,
            "-vf", (
                "format=gray,"
                "geq=lum='if(lt(pow((X-W/2)/(W*0.2),2)+pow((Y-H*0.4)/(H*0.45),2),1),255,0)'"
            ),
            "-an",
            mask_path,
        ]
        try:
            subprocess.run(cmd, capture_output=True, check=True, timeout=120)
            logger.info(f"Mock mask generated: {mask_path}")
        except Exception as e:
            logger.error(f"Mock mask generation failed: {e}")
            raise

        return mask_path

    # ─── Post-Processing ──────────────────────────────────────────────────

    @staticmethod
    def post_process_mask(mask_path: str, output_path: Optional[str] = None) -> str:
        """Apply temporal smoothing and edge feathering to the mask."""
        if output_path is None:
            base, ext = os.path.splitext(mask_path)
            output_path = f"{base}_smooth{ext}"

        # FFmpeg: temporal blur (3 frames) + spatial blur (edge feathering)
        cmd = [
            "ffmpeg", "-y",
            "-i", mask_path,
            "-vf", "tblend=all_mode=average,boxblur=2:1",
            "-an",
            output_path,
        ]
        subprocess.run(cmd, capture_output=True, check=True, timeout=120)
        logger.info(f"Post-processed mask: {output_path}")
        return output_path

    # ─── Convert to Alpha Channel ─────────────────────────────────────────

    @staticmethod
    def apply_mask_to_video(
        video_path: str,
        mask_path: str,
        output_path: str,
    ) -> str:
        """Combine source video + mask into ProRes 4444 with alpha channel."""
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", mask_path,
            "-filter_complex", "[1:v]format=gray[mask];[0:v][mask]alphamerge",
            "-c:v", "prores_ks",
            "-profile:v", "4",  # ProRes 4444
            "-pix_fmt", "yuva444p10le",
            "-an",
            output_path,
        ]
        subprocess.run(cmd, capture_output=True, check=True, timeout=300)
        logger.info(f"Alpha video saved: {output_path}")
        return output_path

    # ─── Main Entry Point ─────────────────────────────────────────────────

    def segment_speaker(
        self,
        video_path: str,
        transcript: Optional[TranscriptionResult] = None,
        start_time: float = 0.0,
        end_time: Optional[float] = None,
    ) -> SpeakerMask:
        """
        Full speaker segmentation pipeline.

        Args:
            video_path: Source video path
            transcript: Optional transcript for speaker detection hints
            start_time: Start time in seconds
            end_time: End time in seconds (None = end of video)

        Returns:
            SpeakerMask with path to the alpha matte video
        """
        mask_id = f"mask_{uuid.uuid4().hex[:8]}"
        speaker_id = "speaker_0"
        if transcript and transcript.speakers:
            speaker_id = transcript.speakers[0]

        # Step 1: Detect speaker face
        bbox = self.detect_speaker_face(video_path, sample_frame_sec=start_time + 2.0)
        if bbox is None:
            logger.warning("No face detected, using center crop as fallback")
            # Use center of frame as default
            bbox = self._get_center_bbox(video_path)

        # Step 2: Segment with SAM 2 (or mock)
        raw_mask_path = self.segment_with_sam(video_path, bbox, start_time, end_time)

        # Step 3: Post-process (smooth + feather)
        smooth_mask_path = self.post_process_mask(raw_mask_path)

        # Step 4: Create alpha channel video
        alpha_path = os.path.join(self.output_dir, f"{mask_id}_alpha.mov")
        self.apply_mask_to_video(video_path, smooth_mask_path, alpha_path)

        if end_time is None:
            end_time = self._get_duration(video_path)

        return SpeakerMask(
            mask_id=mask_id,
            speaker_id=speaker_id,
            start_time=start_time,
            end_time=end_time,
            output_path=alpha_path,
            format="prores_4444_alpha",
            quality_score=0.8 if self._sam2_available else 0.3,
        )

    @staticmethod
    def _get_center_bbox(video_path: str) -> Tuple[int, int, int, int]:
        """Get a center-crop bounding box from video dimensions."""
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height",
                "-of", "csv=p=0",
                video_path,
            ],
            capture_output=True, text=True, timeout=10,
        )
        parts = result.stdout.strip().split(",")
        w, h = int(parts[0]), int(parts[1])
        # Center crop covering ~40% width, ~80% height
        bw, bh = int(w * 0.4), int(h * 0.8)
        x, y = (w - bw) // 2, int(h * 0.05)
        return (x, y, bw, bh)

    @staticmethod
    def _get_duration(video_path: str) -> float:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
                video_path,
            ],
            capture_output=True, text=True, timeout=10,
        )
        return float(result.stdout.strip())


# ─── CLI Test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python -m services.longform.speaker_segmenter <video_path>")
        sys.exit(1)

    segmenter = SpeakerSegmenter()
    mask = segmenter.segment_speaker(sys.argv[1])
    print(json.dumps(mask.to_dict(), indent=2))
