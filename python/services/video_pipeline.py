"""
Complete Video Analysis Pipeline

Orchestrates word-level and frame-level analysis for viral video intelligence.
Designed for both single video and batch processing.
"""

import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import traceback

from services.word_analyzer import WordAnalyzer
from services.frame_analyzer_enhanced import FrameAnalyzerEnhanced
from services.whisper_transcriber import WhisperTranscriber
from database.models import Video
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, text
import uuid
import os

logger = logging.getLogger(__name__)


class VideoAnalysisPipeline:
    """Complete pipeline for video analysis"""
    
    def __init__(self):
        """Initialize all analyzers"""
        api_key = os.getenv("OPENAI_API_KEY")
        self.transcriber = WhisperTranscriber(api_key=api_key)
        self.word_analyzer = WordAnalyzer()
        self.frame_analyzer = FrameAnalyzerEnhanced()
        logger.info("Video analysis pipeline initialized")
    
    async def analyze_video_complete(
        self, 
        video_id: str,
        video_path: str,
        db_session: AsyncSession,
        skip_existing: bool = True
    ) -> Dict[str, Any]:
        """
        Run complete analysis pipeline on a single video
        
        Steps:
        1. Check if already analyzed (if skip_existing=True)
        2. Transcribe with Whisper (word-level timestamps)
        3. Analyze words (emphasis, functions, sentiment)
        4. Extract and analyze frames
        5. Store everything in database
        6. Calculate aggregate metrics
        
        Args:
            video_id: UUID of video
            video_path: Full path to video file
            db_session: Database session
            skip_existing: Skip if video_words already exist
            
        Returns:
            Dict with analysis results and metrics
        """
        start_time = datetime.now()
        logger.info(f"Starting complete analysis for video {video_id}")
        logger.info(f"  Path: {video_path}")
        
        try:
            # Check if already analyzed (using video_id directly - FK disabled)
            if skip_existing:
                check = await db_session.execute(
                    text("SELECT COUNT(*) as count FROM video_words WHERE video_id = :vid"),
                    {"vid": video_id}
                )
                word_count = check.scalar()
                
                if word_count > 0:
                    logger.info(f"  ⏭️  Video already analyzed ({word_count} words), skipping")
                    return {
                        'status': 'skipped',
                        'reason': 'already_analyzed',
                        'existing_word_count': word_count
                    }
            
            # Use video_id directly (FK constraints will be disabled temporarily)
            analyzed_video_id = video_id
            logger.info(f"  🔗 Using video_id: {analyzed_video_id}")
            
            # Step 1: Transcribe audio
            logger.info("  📝 Step 1/4: Transcribing audio with Whisper...")
            transcript_result = await asyncio.to_thread(
                self.transcriber.transcribe_video,
                video_path
            )
            
            if 'error' in transcript_result:
                logger.error(f"  ❌ Transcription failed: {transcript_result['error']}")
                return {
                    'status': 'error',
                    'step': 'transcription',
                    'error': transcript_result['error']
                }
            
            # Extract words from segments or from full text
            words_data = []
            word_index = 0
            segments = transcript_result.get('segments', [])
            
            if segments:
                # Process segments (they are Pydantic objects from OpenAI API)
                for segment in segments:
                    # Check if segment has words attribute
                    segment_words = getattr(segment, 'words', [])
                    if segment_words:
                        # If segment has word-level timestamps
                        for word_obj in segment_words:
                            words_data.append({
                                'word': getattr(word_obj, 'word', '').strip(),
                                'start': getattr(word_obj, 'start', 0.0),
                                'end': getattr(word_obj, 'end', 0.0),
                                'index': word_index
                            })
                            word_index += 1
                    else:
                        # If only segment-level timestamps, split text
                        segment_text = getattr(segment, 'text', '')
                        if segment_text:
                            words = segment_text.split()
                            seg_start_time = getattr(segment, 'start', 0.0)
                            seg_end_time = getattr(segment, 'end', seg_start_time + 1.0)
                            seg_duration = seg_end_time - seg_start_time
                            time_per_word = seg_duration / len(words) if words else 0
                            
                            for i, word in enumerate(words):
                                words_data.append({
                                    'word': word.strip(),
                                    'start': seg_start_time + (i * time_per_word),
                                    'end': seg_start_time + ((i + 1) * time_per_word),
                                    'index': word_index
                                })
                                word_index += 1
            else:
                # Fallback: split full text into words with estimated timestamps
                full_text = transcript_result.get('text', '')
                if full_text:
                    words = full_text.split()
                    duration = transcript_result.get('duration', len(words) * 0.3)
                    time_per_word = duration / len(words) if words else 0
                    
                    for i, word in enumerate(words):
                        words_data.append({
                            'word': word.strip(),
                            'start': i * time_per_word,
                            'end': (i + 1) * time_per_word,
                            'index': word_index
                        })
                        word_index += 1
            
            logger.info(f"  ✅ Transcribed {len(words_data)} words")
            
            if not words_data:
                logger.warning("  ⚠️  No words found in transcript")
                # Don't fail completely, just skip word analysis
                words_data = []
            
            # Step 2: Analyze words
            logger.info("  🔍 Step 2/4: Analyzing words...")
            word_analyses = self.word_analyzer.analyze_transcript(words_data)
            
            # Insert word analyses into database
            insert_count = 0
            for analysis in word_analyses:
                try:
                    await db_session.execute(
                        text("""
                            INSERT INTO video_words (
                                video_id, word_index, word, start_s, end_s,
                                is_emphasis, is_cta_keyword, is_question,
                                speech_function, sentiment_score, emotion
                            ) VALUES (
                                :video_id, :word_index, :word, :start_s, :end_s,
                                :is_emphasis, :is_cta_keyword, :is_question,
                                :speech_function, :sentiment_score, :emotion
                            )
                        """),
                        {
                            'video_id': str(analyzed_video_id),
                            'word_index': analysis.word_index,
                            'word': analysis.word,
                            'start_s': analysis.start_s,
                            'end_s': analysis.end_s,
                            'is_emphasis': analysis.is_emphasis,
                            'is_cta_keyword': analysis.is_cta_keyword,
                            'is_question': analysis.is_question,
                            'speech_function': analysis.speech_function,
                            'sentiment_score': analysis.sentiment_score,
                            'emotion': analysis.emotion
                        }
                    )
                    insert_count += 1
                except Exception as e:
                    logger.warning(f"  ⚠️  Failed to insert word {analysis.word_index}: {e}")
            
            try:
                await db_session.commit()
                logger.info(f"  ✅ Stored {insert_count} word analyses")
            except Exception as e:
                logger.error(f"  ❌ Failed to commit words: {e}")
                await db_session.rollback()
                return {
                    'status': 'error',
                    'step': 'word_commit',
                    'error': str(e)
                }
            
            # Step 3: Analyze frames
            logger.info("  🎬 Step 3/4: Analyzing frames...")
            frame_analyses = await asyncio.to_thread(
                self.frame_analyzer.analyze_video,
                video_path,
                interval_s=0.5,  # Sample every 0.5 seconds
                max_frames=200   # Cap at 200 frames for performance
            )
            
            logger.info(f"  📊 Extracted {len(frame_analyses)} frames")
            
            # Insert frame analyses into database
            frame_insert_count = 0
            for analysis in frame_analyses:
                try:
                    await db_session.execute(
                        text("""
                            INSERT INTO video_frames (
                                video_id, frame_number, timestamp_s,
                                shot_type, camera_motion, has_face, face_count,
                                eye_contact, face_size_ratio, has_text, text_area_ratio,
                                visual_clutter_score, contrast_score,
                                motion_score, scene_change, color_palette
                            ) VALUES (
                                :video_id, :frame_number, :timestamp_s,
                                :shot_type, :camera_motion, :has_face, :face_count,
                                :eye_contact, :face_size_ratio, :has_text, :text_area_ratio,
                                :visual_clutter_score, :contrast_score,
                                :motion_score, :scene_change, CAST(:color_palette AS jsonb)
                            )
                        """),
                        {
                            'video_id': video_id,
                            'frame_number': int(analysis.frame_number),
                            'timestamp_s': float(analysis.timestamp_s),
                            'shot_type': str(analysis.shot_type.value) if analysis.shot_type else None,
                            'camera_motion': str(analysis.camera_motion.value) if analysis.camera_motion else None,
                            'has_face': bool(analysis.has_face),
                            'face_count': int(analysis.face_count),
                            'eye_contact': bool(analysis.eye_contact_detected),
                            'face_size_ratio': float(analysis.face_size_ratio) if analysis.face_size_ratio else None,
                            'has_text': bool(analysis.has_text),
                            'text_area_ratio': float(analysis.text_area_ratio) if analysis.text_area_ratio else None,
                            'visual_clutter_score': float(analysis.visual_clutter_score) if analysis.visual_clutter_score else None,
                            'contrast_score': float(analysis.contrast_score) if analysis.contrast_score else None,
                            'motion_score': float(analysis.motion_score) if analysis.motion_score else None,
                            'scene_change': bool(analysis.scene_change),
                            'color_palette': str(analysis.color_palette) if analysis.color_palette else '[]'
                        }
                    )
                    frame_insert_count += 1
                except Exception as e:
                    logger.warning(f"  ⚠️  Failed to insert frame {analysis.frame_number}: {e}")
                    # Rollback this transaction and start fresh for next frame
                    await db_session.rollback()
            
            try:
                await db_session.commit()
                logger.info(f"  ✅ Stored {frame_insert_count} frame analyses")
            except Exception as e:
                logger.warning(f"  ⚠️  Frame commit failed: {e}")
                await db_session.rollback()
                # Don't fail - frames are optional
            
            # Step 4: Calculate aggregate metrics
            logger.info("  📈 Step 4/4: Calculating metrics...")
            
            pacing_metrics = self.word_analyzer.calculate_pacing_metrics(word_analyses)
            composition_metrics = self.frame_analyzer.get_composition_metrics(frame_analyses)
            
            emphasis_segments = self.word_analyzer.get_emphasis_segments(word_analyses)
            cta_segments = self.word_analyzer.get_cta_segments(word_analyses)
            
            # Update video record with analysis timestamp
            await db_session.execute(
                text("UPDATE videos SET updated_at = NOW() WHERE id = :vid"),
                {"vid": video_id}
            )
            await db_session.commit()
            
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"  ✅ Complete analysis finished in {duration:.1f}s")
            
            return {
                'status': 'success',
                'video_id': video_id,
                'duration_seconds': round(duration, 2),
                'word_count': len(word_analyses),
                'frame_count': len(frame_analyses),
                'pacing_metrics': {
                    'words_per_minute': pacing_metrics.get('words_per_minute'),
                    'avg_word_duration_s': pacing_metrics.get('avg_word_duration_s'),
                    'pause_count': pacing_metrics.get('pause_count'),
                    'total_duration_s': pacing_metrics.get('total_duration_s')
                },
                'composition_metrics': {
                    'face_presence_pct': round(composition_metrics.get('face_presence_pct', 0), 1),
                    'eye_contact_pct': round(composition_metrics.get('eye_contact_pct', 0), 1),
                    'text_presence_pct': round(composition_metrics.get('text_presence_pct', 0), 1),
                    'avg_visual_clutter': round(composition_metrics.get('avg_visual_clutter', 0), 2),
                    'avg_contrast': round(composition_metrics.get('avg_contrast', 0), 2),
                    'scene_change_count': composition_metrics.get('scene_change_count', 0)
                },
                'segments': {
                    'emphasis_count': len(emphasis_segments),
                    'cta_count': len(cta_segments)
                },
                'shot_distribution': composition_metrics.get('shot_type_distribution', {})
            }
            
            # Step 5: Sync to Content Graph (Blend)
            logger.info("  🔄 Step 5/5: Syncing to Content Graph...")
            await self._sync_to_content_graph(
                db_session=db_session,
                video_id=video_id,
                video_path=video_path,
                duration=duration
            )
            
            return {
                'status': 'success',
                'video_id': video_id,
                'duration_seconds': round(duration, 2),
                'word_count': len(word_analyses),
                'frame_count': len(frame_analyses),
                'pacing_metrics': {
                    'words_per_minute': pacing_metrics.get('words_per_minute'),
                    'avg_word_duration_s': pacing_metrics.get('avg_word_duration_s'),
                    'pause_count': pacing_metrics.get('pause_count'),
                    'total_duration_s': pacing_metrics.get('total_duration_s')
                },
                'composition_metrics': {
                    'face_presence_pct': round(composition_metrics.get('face_presence_pct', 0), 1),
                    'eye_contact_pct': round(composition_metrics.get('eye_contact_pct', 0), 1),
                    'text_presence_pct': round(composition_metrics.get('text_presence_pct', 0), 1),
                    'avg_visual_clutter': round(composition_metrics.get('avg_visual_clutter', 0), 2),
                    'avg_contrast': round(composition_metrics.get('avg_contrast', 0), 2),
                    'scene_change_count': composition_metrics.get('scene_change_count', 0)
                },
                'segments': {
                    'emphasis_count': len(emphasis_segments),
                    'cta_count': len(cta_segments)
                },
                'shot_distribution': composition_metrics.get('shot_type_distribution', {})
            }
            
        except Exception as e:
            logger.error(f"  ❌ Analysis failed: {e}")
            logger.error(traceback.format_exc())
            return {
                'status': 'error',
                'video_id': video_id,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    async def analyze_video_by_id(
        self,
        video_id: str,
        db_session: AsyncSession,
        skip_existing: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze video by ID (looks up path from database)
        
        Args:
            video_id: UUID of video
            db_session: Database session
            skip_existing: Skip if already analyzed
            
        Returns:
            Analysis results dict
        """
        # Get video from database
        result = await db_session.execute(
            text("SELECT id, source_uri, file_name FROM videos WHERE id = :vid"),
            {"vid": video_id}
        )
        video = result.first()
        
        if not video:
            return {
                'status': 'error',
                'error': f'Video not found: {video_id}'
            }
        
        video_path = video.source_uri
        
        # Check if file exists
        if not Path(video_path).exists():
            return {
                'status': 'error',
                'error': f'Video file not found: {video_path}'
            }
        
        # Run analysis
        return await self.analyze_video_complete(
            video_id=str(video.id),
            video_path=video_path,
            db_session=db_session,
            skip_existing=skip_existing
        )

    async def _sync_to_content_graph(
        self,
        db_session: AsyncSession,
        video_id: str,
        video_path: str,
        duration: float
    ):
        """
        Sync analyzed video to the Content Graph (Blend tables).
        Creates content_items and content_variants if they don't exist.
        """
        try:
            # Check if content_item already exists for this source_url
            # We assume video_path is the source_url for now
            result = await db_session.execute(
                text("SELECT id FROM content_items WHERE source_url = :url"),
                {"url": video_path}
            )
            existing_content_id = result.scalar()
            
            content_id = existing_content_id
            
            if not content_id:
                # Create new content item
                # Get video filename for title
                filename = Path(video_path).name
                
                result = await db_session.execute(
                    text("""
                        INSERT INTO content_items (
                            type, source_url, title, description
                        ) VALUES (
                            'video', :url, :title, :desc
                        ) RETURNING id
                    """),
                    {
                        "url": video_path,
                        "title": filename,
                        "desc": f"Imported from video analysis. Duration: {duration:.1f}s"
                    }
                )
                content_id = result.scalar()
                logger.info(f"  ✨ Created new content_item: {content_id}")
            else:
                logger.info(f"  📎 Linked to existing content_item: {content_id}")
            
            # Create default variant if none exists
            # We'll treat the original upload as a 'platform=other' variant for now
            
            check_variant = await db_session.execute(
                text("""
                    SELECT id FROM content_variants 
                    WHERE content_id = :cid AND platform = 'other' AND variant_label = 'Original Upload'
                """),
                {"cid": content_id}
            )
            
            if not check_variant.scalar():
                await db_session.execute(
                    text("""
                        INSERT INTO content_variants (
                            content_id, platform, title, description, variant_label, is_paid
                        ) VALUES (
                            :cid, 'other', :title, 'Original analyzed video', 'Original Upload', false
                        )
                    """),
                    {
                        "cid": content_id,
                        "title": Path(video_path).name
                    }
                )
                logger.info("  ✨ Created default content_variant")
                
            await db_session.commit()
            
        except Exception as e:
            logger.error(f"  ⚠️  Failed to sync to Content Graph: {e}")
            # Don't fail the whole analysis, just log error
            await db_session.rollback()


# Example standalone usage
async def analyze_single_video_example():
    """Example: Analyze a single video"""
    from database.connection import get_db
    
    async for session in get_db():
        # Get first video
        result = await session.execute(
            text("SELECT id, file_name FROM videos LIMIT 1")
        )
        video = result.first()
        
        if not video:
            print("No videos found")
            return
        
        print(f"Analyzing: {video.file_name}")
        print("=" * 60)
        
        # Run analysis
        pipeline = VideoAnalysisPipeline()
        results = await pipeline.analyze_video_by_id(
            video_id=str(video.id),
            db_session=session
        )
        
        # Print results
        if results['status'] == 'success':
            print("\n✅ Analysis Complete!")
            print(f"  Duration: {results['duration_seconds']}s")
            print(f"  Words: {results['word_count']}")
            print(f"  Frames: {results['frame_count']}")
            print(f"  WPM: {results['pacing_metrics']['words_per_minute']}")
            print(f"  Face presence: {results['composition_metrics']['face_presence_pct']}%")
            print(f"  Emphasis segments: {results['segments']['emphasis_count']}")
            print(f"  CTA segments: {results['segments']['cta_count']}")
        else:
            print(f"\n❌ Error: {results.get('error')}")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    asyncio.run(analyze_single_video_example())
