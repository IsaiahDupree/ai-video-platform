"""
Longform Pipeline CLI — Entry point for running the pipeline from command line.

Usage:
    python -m services.longform.cli run --video path/to/video.mp4 --output output/
    python -m services.longform.cli run --video video.mp4 --skip-broll --skip-segmentation
    python -m services.longform.cli run --video video.mp4 --topic "Sales outreach" --sync
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from loguru import logger

from .pipeline import LongformPipeline, PipelineConfig


def main():
    parser = argparse.ArgumentParser(
        description="AI Longform Video Pipeline",
        prog="python -m services.longform.cli",
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # ─── run command ──────────────────────────────────────────────────────
    run_parser = subparsers.add_parser("run", help="Run the full pipeline")
    run_parser.add_argument(
        "--video", "-v", required=True,
        help="Path to the source video file",
    )
    run_parser.add_argument(
        "--output", "-o", default="output",
        help="Output directory (default: output/)",
    )
    run_parser.add_argument(
        "--topic", "-t", default="",
        help="Video topic for LLM context",
    )
    run_parser.add_argument(
        "--brand-notes", default="",
        help="Brand/style guidelines for LLM context",
    )
    run_parser.add_argument(
        "--fps", type=int, default=30,
        help="Output FPS (default: 30)",
    )
    run_parser.add_argument(
        "--skip-broll", action="store_true",
        help="Skip B-roll sourcing",
    )
    run_parser.add_argument(
        "--skip-segmentation", action="store_true",
        help="Skip speaker segmentation (no GPU required)",
    )
    run_parser.add_argument(
        "--no-diarization", action="store_true",
        help="Disable speaker diarization",
    )
    run_parser.add_argument(
        "--sync", action="store_true",
        help="Run synchronously (no parallel execution)",
    )
    run_parser.add_argument(
        "--music", default=None,
        help="Path to background music track",
    )
    run_parser.add_argument(
        "--music-volume", type=float, default=0.08,
        help="Music volume (default: 0.08)",
    )

    # ─── dry-run command ──────────────────────────────────────────────────
    dry_parser = subparsers.add_parser("dry-run", help="Plan only, no B-roll or rendering")
    dry_parser.add_argument("--video", "-v", required=True)
    dry_parser.add_argument("--output", "-o", default="output")
    dry_parser.add_argument("--topic", "-t", default="")
    dry_parser.add_argument("--fps", type=int, default=30)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Configure logging
    logger.remove()
    logger.add(sys.stderr, level="INFO", format="{time:HH:mm:ss} | {level:<7} | {message}")

    if args.command == "dry-run":
        args.skip_broll = True
        args.skip_segmentation = True
        args.no_diarization = True
        args.sync = True
        args.music = None
        args.music_volume = 0.08
        args.brand_notes = ""

    # Build config
    music_config = None
    if args.music:
        music_config = {
            "track_url": args.music,
            "volume": args.music_volume,
            "duck_during_speech": True,
            "duck_volume": 0.03,
        }

    config = PipelineConfig(
        output_dir=args.output,
        fps=args.fps,
        skip_broll=args.skip_broll,
        skip_segmentation=args.skip_segmentation,
        diarization_enabled=not args.no_diarization,
        video_topic=args.topic,
        brand_notes=args.brand_notes,
        music_config=music_config,
    )

    pipeline = LongformPipeline(config=config)

    if args.sync:
        edit_plan = pipeline.run_sync(args.video)
    else:
        edit_plan = asyncio.run(pipeline.run_async(args.video))

    # Print summary
    print(f"\n{'='*60}")
    print(f"Pipeline complete!")
    print(f"  Video ID:    {pipeline.video_id}")
    print(f"  EDL entries: {len(edit_plan.edl)}")
    print(f"  Duration:    {edit_plan.total_duration_frames / config.fps:.1f}s")
    print(f"  Resolution:  {edit_plan.resolution_width}x{edit_plan.resolution_height}")
    print(f"  Output:      {config.output_dir}/{pipeline.video_id}_props.json")
    print(f"{'='*60}")
    print(f"\nTo render:")
    print(f"  npx remotion render LongformVideo {config.output_dir}/{pipeline.video_id}_props.json output.mp4")


if __name__ == "__main__":
    main()
