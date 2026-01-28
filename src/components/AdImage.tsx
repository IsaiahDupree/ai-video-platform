/**
 * AdImage Component - ADS-006: Image Positioning Controls
 *
 * A flexible image component for static ads with advanced positioning controls:
 * - Cover/Contain/Fill object fit modes
 * - Focal point positioning for precise image cropping
 * - Rounded corners with customizable radius
 * - Border and shadow effects
 *
 * Usage:
 * ```tsx
 * <AdImage
 *   src="product.jpg"
 *   objectFit="cover"
 *   focalPoint={{ x: 0.7, y: 0.3 }}
 *   borderRadius={16}
 * />
 * ```
 */

import React from 'react';
import { Img, staticFile } from 'remotion';

/**
 * Focal point position (0-1 range for x and y)
 * - (0, 0) = top-left
 * - (0.5, 0.5) = center (default)
 * - (1, 1) = bottom-right
 */
export interface FocalPoint {
  x: number; // 0 (left) to 1 (right)
  y: number; // 0 (top) to 1 (bottom)
}

/**
 * AdImage component props
 */
export interface AdImageProps {
  /** Image source (path relative to public/assets) */
  src: string;

  /** Alt text for accessibility */
  alt?: string;

  /** Width of the image container */
  width?: number | string;

  /** Height of the image container */
  height?: number | string;

  /** Object fit mode - how the image fills the container */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';

  /**
   * Focal point for cover mode - determines which part of the image to show
   * Default: { x: 0.5, y: 0.5 } (center)
   */
  focalPoint?: FocalPoint;

  /** Border radius in pixels */
  borderRadius?: number;

  /** Border width in pixels */
  borderWidth?: number;

  /** Border color */
  borderColor?: string;

  /** Opacity (0-1) */
  opacity?: number;

  /** Box shadow */
  shadow?: boolean;

  /** Custom shadow style */
  shadowStyle?: string;

  /** Additional inline styles */
  style?: React.CSSProperties;

  /** CSS class name */
  className?: string;
}

/**
 * AdImage component with advanced positioning controls
 */
export const AdImage: React.FC<AdImageProps> = ({
  src,
  alt = '',
  width = '100%',
  height = '100%',
  objectFit = 'cover',
  focalPoint = { x: 0.5, y: 0.5 },
  borderRadius = 0,
  borderWidth = 0,
  borderColor = 'transparent',
  opacity = 1,
  shadow = false,
  shadowStyle = '0 4px 20px rgba(0, 0, 0, 0.15)',
  style = {},
  className = '',
}) => {
  // Container styles
  const containerStyles: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: borderRadius > 0 ? `${borderRadius}px` : undefined,
    border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
    boxShadow: shadow ? shadowStyle : undefined,
    ...style,
  };

  // Image styles
  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    opacity,
  };

  // Apply object fit and focal point
  if (objectFit === 'cover') {
    // For cover mode, use object-position to control the focal point
    imageStyles.objectFit = 'cover';
    imageStyles.objectPosition = `${focalPoint.x * 100}% ${focalPoint.y * 100}%`;
  } else if (objectFit === 'contain') {
    // Contain mode shows the entire image within the container
    imageStyles.objectFit = 'contain';
    imageStyles.objectPosition = 'center';
  } else if (objectFit === 'fill') {
    // Fill mode stretches the image to fill the container
    imageStyles.objectFit = 'fill';
  } else if (objectFit === 'none') {
    // None mode displays the image at its natural size
    imageStyles.objectFit = 'none';
    imageStyles.objectPosition = `${focalPoint.x * 100}% ${focalPoint.y * 100}%`;
  }

  return (
    <div style={containerStyles} className={className}>
      <Img
        src={staticFile(src)}
        alt={alt}
        style={imageStyles}
      />
    </div>
  );
};

/**
 * Preset focal points for common use cases
 */
export const FocalPoints = {
  CENTER: { x: 0.5, y: 0.5 },
  TOP_LEFT: { x: 0, y: 0 },
  TOP_CENTER: { x: 0.5, y: 0 },
  TOP_RIGHT: { x: 1, y: 0 },
  CENTER_LEFT: { x: 0, y: 0.5 },
  CENTER_RIGHT: { x: 1, y: 0.5 },
  BOTTOM_LEFT: { x: 0, y: 1 },
  BOTTOM_CENTER: { x: 0.5, y: 1 },
  BOTTOM_RIGHT: { x: 1, y: 1 },
} as const;

/**
 * Helper function to create a focal point from percentages
 */
export function createFocalPoint(xPercent: number, yPercent: number): FocalPoint {
  return {
    x: Math.max(0, Math.min(1, xPercent / 100)),
    y: Math.max(0, Math.min(1, yPercent / 100)),
  };
}

/**
 * Helper function to create a focal point from pixel coordinates
 * relative to the image dimensions
 */
export function createFocalPointFromPixels(
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number
): FocalPoint {
  return {
    x: Math.max(0, Math.min(1, x / imageWidth)),
    y: Math.max(0, Math.min(1, y / imageHeight)),
  };
}

/**
 * Example usage in ad templates:
 *
 * // Product image with rounded corners
 * <AdImage
 *   src="assets/images/product.jpg"
 *   objectFit="cover"
 *   borderRadius={16}
 *   shadow
 * />
 *
 * // Profile photo focused on face (top-center)
 * <AdImage
 *   src="assets/images/profile.jpg"
 *   objectFit="cover"
 *   focalPoint={FocalPoints.TOP_CENTER}
 *   borderRadius={999}
 * />
 *
 * // Logo with contain mode
 * <AdImage
 *   src="assets/images/logo.png"
 *   objectFit="contain"
 *   width={200}
 *   height={80}
 * />
 *
 * // Background image with custom focal point
 * <AdImage
 *   src="assets/images/background.jpg"
 *   objectFit="cover"
 *   focalPoint={{ x: 0.7, y: 0.3 }}
 *   opacity={0.8}
 * />
 */
