"""
Video Analysis Service - Orchestrates frame sampling and vision analysis
Combines FrameSamplerService and VisionAnalyzer for complete video analysis
"""
import logging
from typing import List, Dict, Optional, Any
from decimal import Decimal
from pathlib import Path
from sqlalchemy.orm import Session
from database.models import AnalyzedVideo, VideoSegment, VideoFrame
from services.frame_sampler import FrameSamplerService
from services.vision_analyzer import VisionAnalyzer
import uuid

logger = logging.getLogger(__name__)


class VideoAnalysisService:
    """Orchestrates complete video analysis workflow"""
    
    def __init__(
        self,
        db: Session,
        frame_output_dir: str = "/tmp/frames",
        openai_api_key: Optional[str] = None
    ):
        """
        Initialize video analysis service
        
        Args:
            db: Database session
            frame_output_dir: Directory for extracted frames
            openai_api_key: OpenAI API key
        """
        self.db = db
        self.frame_sampler = FrameSamplerService(output_dir=frame_output_dir)
        self.vision_analyzer = VisionAnalyzer(api_key=openai_api_key)
    
    def is_ready(self) -> Dict[str, bool]:
        """Check if all components are ready"""
        return {
            "ffmpeg_installed": self.frame_sampler.check_ffmpeg_installed(),
            "vision_api_enabled": self.vision_analyzer.is_enabled()
        }
    
    def analyze_video_frames(
        self,
        video_path: str,
        video_id: uuid.UUID,
        sampling_interval_s: float = 1.0,
        analysis_type: str = "comprehensive",
        store_in_db: bool = True
    ) -> Dict[str, Any]:
        """
        Full video frame analysis workflow
        
        Args:
            video_path: Path to video file
            video_id: UUID of analyzed_video record
            sampling_interval_s: Interval between frames
            analysis_type: Type of vision analysis
            store_in_db: Whether to store results in database
            
        Returns:
            Analysis results dict
        """
        logger.info(f"Starting video frame analysis for {video_id}")
        
        # Check readiness
        readiness = self.is_ready()
        if not readiness["ffmpeg_installed"]:
            logger.error("FFmpeg not installed - cannot sample frames")
            return {"error": "FFmpeg not installed"}
        
        if not readiness["vision_api_enabled"]:
            logger.warning("OpenAI Vision API not configured - skipping visual analysis")
        
        try:
            # Step 1: Sample frames
            logger.info(f"Sampling frames at {sampling_interval_s}s intervals")
            frames = self.frame_sampler.sample_frames_uniform(
                video_path=video_path,
                interval_s=sampling_interval_s,
                video_id=str(video_id)
            )
            
            if not frames:
                logger.error("No frames extracted")
                return {"error": "Frame extraction failed"}
            
            logger.info(f"Extracted {len(frames)} frames")
            
            # Step 2: Analyze frames with Vision API
            frame_analyses = []
            
            if self.vision_analyzer.is_enabled():
                logger.info(f"Analyzing {len(frames)} frames with OpenAI Vision")
                
                for i, frame in enumerate(frames):
                    logger.info(f"Analyzing frame {i+1}/{len(frames)}")
                    analysis = self.vision_analyzer.analyze_frame(
                        frame["frame_path"],
                        analysis_type=analysis_type
                    )
                    
                    frame_analyses.append({
                        "time_s": frame["time_s"],
                        "frame_path": frame["frame_path"],
                        "analysis": analysis
                    })
            
            # Step 3: Store in database
            if store_in_db and frame_analyses:
                logger.info("Storing frame analyses in database")
                stored_count = self._store_frame_analyses(video_id, frame_analyses)
                logger.info(f"Stored {stored_count} frame analyses")
            
            # Step 4: Detect pattern interrupts (compare consecutive frames)
            pattern_interrupts = []
            
            if self.vision_analyzer.is_enabled() and len(frames) > 1:
                logger.info("Detecting pattern interrupts")
                
                # Sample a few consecutive pairs (not all, to save API calls)
                sample_pairs = []
                for i in range(0, len(frames) - 1, 5):  # Every 5th pair
                    sample_pairs.append((frames[i], frames[i + 1]))
                
                for frame1, frame2 in sample_pairs[:10]:  # Max 10 comparisons
                    interrupt = self.vision_analyzer.detect_pattern_interrupt(
                        frame1["frame_path"],
                        frame2["frame_path"]
                    )
                    
                    if interrupt.get("has_pattern_interrupt"):
                        pattern_interrupts.append({
                            "time_s": frame2["time_s"],
                            "details": interrupt
                        })
            
            return {
                "success": True,
                "video_id": str(video_id),
                "frames_extracted": len(frames),
                "frames_analyzed": len(frame_analyses),
                "pattern_interrupts": len(pattern_interrupts),
                "frame_data": frame_analyses[:5],  # Sample for response
                "pattern_interrupt_data": pattern_interrupts
            }
            
        except Exception as e:
            logger.error(f"Error in video frame analysis: {e}")
            return {"error": str(e)}
    
    def _store_frame_analyses(
        self,
        video_id: uuid.UUID,
        frame_analyses: List[Dict[str, Any]]
    ) -> int:
        """
        Store frame analyses in database
        
        Args:
            video_id: UUID of analyzed video
            frame_analyses: List of frame analysis results
            
        Returns:
            Number of frames stored
        """
        stored_count = 0
        
        for frame_data in frame_analyses:
            try:
                analysis = frame_data["analysis"]
                
                # Skip if analysis failed
                if "error" in analysis:
                    logger.warning(f"Skipping frame at {frame_data['time_s']}s - analysis error")
                    continue
                
                # Parse analysis results
                shot_type = analysis.get("shot_type")
                presence = analysis.get("presence", [])
                text_on_screen = analysis.get("text_on_screen", "")
                objects = analysis.get("objects", [])
                brightness_level = analysis.get("brightness_level")
                color_temperature = analysis.get("color_temperature")
                visual_clutter_score = analysis.get("visual_clutter_score")
                is_pattern_interrupt = analysis.get("is_pattern_interrupt", False)
                is_hook_frame = analysis.get("is_hook_frame", False)
                has_meme_element = analysis.get("has_meme_element", False)
                
                # Create VideoFrame record
                frame_record = VideoFrame(
                    video_id=video_id,
                    frame_time_s=Decimal(str(frame_data["time_s"])),
                    frame_url=frame_data["frame_path"],
                    shot_type=shot_type,
                    presence=presence,
                    objects=objects,
                    text_on_screen=text_on_screen,
                    brightness_level=brightness_level,
                    color_temperature=color_temperature,
                    visual_clutter_score=Decimal(str(visual_clutter_score)) if visual_clutter_score else None,
                    is_pattern_interrupt=is_pattern_interrupt,
                    is_hook_frame=is_hook_frame,
                    has_meme_element=has_meme_element
                )
                
                self.db.add(frame_record)
                stored_count += 1
                
            except Exception as e:
                logger.error(f"Error storing frame at {frame_data['time_s']}s: {e}")
                continue
        
        # Commit all frames
        try:
            self.db.commit()
        except Exception as e:
            logger.error(f"Error committing frames: {e}")
            self.db.rollback()
            return 0
        
        return stored_count
    
    def analyze_hook_frames(
        self,
        video_path: str,
        video_id: uuid.UUID,
        hook_segment_end_s: float = 5.0
    ) -> Dict[str, Any]:
        """
        Specialized analysis for hook frames (first few seconds)
        
        Args:
            video_path: Path to video file
            video_id: UUID of analyzed video
            hook_segment_end_s: End of hook segment in seconds
            
        Returns:
            Hook analysis results
        """
        logger.info(f"Analyzing hook frames for {video_id} (0-{hook_segment_end_s}s)")
        
        # Sample frames densely in hook region
        hook_timestamps = [i * 0.5 for i in range(int(hook_segment_end_s / 0.5) + 1)]
        
        frames = self.frame_sampler.sample_frames_at_times(
            video_path=video_path,
            timestamps=hook_timestamps,
            video_id=str(video_id)
        )
        
        if not frames or not self.vision_analyzer.is_enabled():
            return {"error": "Cannot analyze hook frames"}
        
        # Analyze with "hook" analysis type
        hook_analyses = []
        
        for frame in frames:
            analysis = self.vision_analyzer.analyze_frame(
                frame["frame_path"],
                analysis_type="hook"
            )
            
            hook_analyses.append({
                "time_s": frame["time_s"],
                "is_hook_frame": analysis.get("is_hook_frame", False),
                "hook_score": analysis.get("hook_score", 0.0),
                "reasons": analysis.get("reasons", []),
                "suggestions": analysis.get("suggestions", [])
            })
        
        # Find best hook frame
        best_hook = max(hook_analyses, key=lambda x: x.get("hook_score", 0.0))
        
        return {
            "success": True,
            "best_hook_time_s": best_hook["time_s"],
            "best_hook_score": best_hook["hook_score"],
            "hook_frames_analyzed": len(hook_analyses),
            "all_hook_data": hook_analyses
        }
    
    def cleanup(self, video_id: Optional[uuid.UUID] = None):
        """Clean up extracted frames"""
        video_id_str = str(video_id) if video_id else None
        self.frame_sampler.cleanup_frames(video_id=video_id_str)
