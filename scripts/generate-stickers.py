"""
IMG-003: Sticker Generation
Background removal for overlay stickers

This script removes backgrounds from images to create transparent stickers
that can be overlaid on video scenes.

Dependencies:
    pip install rembg pillow

Usage:
    python scripts/generate-stickers.py input.png output.png
    python scripts/generate-stickers.py --batch input_dir output_dir

Features:
    - Single image background removal
    - Batch processing of directories
    - PNG output with transparency
    - Multiple model options for different use cases
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Optional, List

try:
    from rembg import remove
    from PIL import Image
except ImportError:
    print("Error: Required dependencies not installed.")
    print("Please install with: pip install rembg pillow")
    sys.exit(1)


def remove_background(
    input_path: str,
    output_path: str,
    model_name: str = "u2net",
    alpha_matting: bool = False,
    alpha_matting_foreground_threshold: int = 240,
    alpha_matting_background_threshold: int = 10,
    alpha_matting_erode_size: int = 10,
) -> bool:
    """
    Remove background from a single image.

    Args:
        input_path: Path to input image
        output_path: Path to save output PNG
        model_name: Model to use (u2net, u2netp, u2net_human_seg, u2net_cloth_seg, silueta)
        alpha_matting: Enable alpha matting for better edge quality
        alpha_matting_foreground_threshold: Foreground threshold (0-255)
        alpha_matting_background_threshold: Background threshold (0-255)
        alpha_matting_erode_size: Erosion size for matting

    Returns:
        True if successful, False otherwise

    Models:
        - u2net: General purpose, best for most cases
        - u2netp: Lightweight version, faster but less accurate
        - u2net_human_seg: Optimized for human subjects
        - u2net_cloth_seg: Optimized for clothing
        - silueta: Fast model for simple cases
    """
    try:
        print(f"Processing: {input_path}")

        # Load input image
        input_image = Image.open(input_path)

        # Remove background
        output_image = remove(
            input_image,
            model_name=model_name,
            alpha_matting=alpha_matting,
            alpha_matting_foreground_threshold=alpha_matting_foreground_threshold,
            alpha_matting_background_threshold=alpha_matting_background_threshold,
            alpha_matting_erode_size=alpha_matting_erode_size,
        )

        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        # Save as PNG with transparency
        output_image.save(output_path, "PNG")

        print(f"✓ Saved sticker to: {output_path}")
        return True

    except Exception as e:
        print(f"✗ Error processing {input_path}: {e}")
        return False


def batch_remove_background(
    input_dir: str,
    output_dir: str,
    model_name: str = "u2net",
    alpha_matting: bool = False,
    extensions: tuple = (".png", ".jpg", ".jpeg", ".webp"),
) -> dict:
    """
    Batch remove backgrounds from all images in a directory.

    Args:
        input_dir: Directory containing input images
        output_dir: Directory to save output stickers
        model_name: Model to use for background removal
        alpha_matting: Enable alpha matting
        extensions: Tuple of file extensions to process

    Returns:
        Dictionary with success/failure counts and file lists
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    if not input_path.exists():
        print(f"Error: Input directory not found: {input_dir}")
        return {"success": 0, "failed": 0, "files": []}

    # Create output directory
    output_path.mkdir(parents=True, exist_ok=True)

    # Find all image files
    image_files = [
        f for f in input_path.iterdir()
        if f.is_file() and f.suffix.lower() in extensions
    ]

    if not image_files:
        print(f"No image files found in {input_dir}")
        return {"success": 0, "failed": 0, "files": []}

    print(f"\n{'=' * 60}")
    print(f"Batch processing {len(image_files)} images")
    print(f"Input: {input_dir}")
    print(f"Output: {output_dir}")
    print(f"Model: {model_name}")
    print(f"{'=' * 60}\n")

    results = {
        "success": 0,
        "failed": 0,
        "files": []
    }

    for image_file in image_files:
        # Generate output filename (always PNG)
        output_file = output_path / f"{image_file.stem}.png"

        # Process image
        success = remove_background(
            str(image_file),
            str(output_file),
            model_name=model_name,
            alpha_matting=alpha_matting,
        )

        if success:
            results["success"] += 1
            results["files"].append(str(output_file))
        else:
            results["failed"] += 1

    print(f"\n{'=' * 60}")
    print(f"✓ Batch processing complete!")
    print(f"  Success: {results['success']}")
    print(f"  Failed: {results['failed']}")
    print(f"{'=' * 60}\n")

    return results


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Remove backgrounds from images to create transparent stickers",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single image
  python scripts/generate-stickers.py input.jpg output.png

  # Batch processing
  python scripts/generate-stickers.py --batch images/ stickers/

  # Use different model
  python scripts/generate-stickers.py input.jpg output.png --model u2net_human_seg

  # Enable alpha matting for better edges
  python scripts/generate-stickers.py input.jpg output.png --alpha-matting

Models:
  - u2net: General purpose, best for most cases (default)
  - u2netp: Lightweight version, faster but less accurate
  - u2net_human_seg: Optimized for human subjects
  - u2net_cloth_seg: Optimized for clothing
  - silueta: Fast model for simple cases
        """
    )

    # Input/output arguments
    parser.add_argument(
        "input",
        help="Input image file or directory (with --batch)"
    )
    parser.add_argument(
        "output",
        help="Output PNG file or directory (with --batch)"
    )

    # Processing options
    parser.add_argument(
        "--batch",
        action="store_true",
        help="Batch process all images in input directory"
    )
    parser.add_argument(
        "--model",
        default="u2net",
        choices=["u2net", "u2netp", "u2net_human_seg", "u2net_cloth_seg", "silueta"],
        help="Model to use for background removal (default: u2net)"
    )
    parser.add_argument(
        "--alpha-matting",
        action="store_true",
        help="Enable alpha matting for better edge quality"
    )
    parser.add_argument(
        "--foreground-threshold",
        type=int,
        default=240,
        help="Alpha matting foreground threshold 0-255 (default: 240)"
    )
    parser.add_argument(
        "--background-threshold",
        type=int,
        default=10,
        help="Alpha matting background threshold 0-255 (default: 10)"
    )
    parser.add_argument(
        "--erode-size",
        type=int,
        default=10,
        help="Alpha matting erosion size (default: 10)"
    )

    args = parser.parse_args()

    # Validate paths
    if not args.batch and not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}")
        sys.exit(1)

    # Process images
    if args.batch:
        # Batch processing
        results = batch_remove_background(
            args.input,
            args.output,
            model_name=args.model,
            alpha_matting=args.alpha_matting,
        )
        sys.exit(0 if results["failed"] == 0 else 1)
    else:
        # Single image processing
        success = remove_background(
            args.input,
            args.output,
            model_name=args.model,
            alpha_matting=args.alpha_matting,
            alpha_matting_foreground_threshold=args.foreground_threshold,
            alpha_matting_background_threshold=args.background_threshold,
            alpha_matting_erode_size=args.erode_size,
        )
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
