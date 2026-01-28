/**
 * Screenshot Size Generator - Type Definitions
 * APP-003: Batch resize screenshots to all required App Store dimensions
 *
 * Supports batch resizing of screenshots to all required App Store Connect
 * dimensions for iPhone, iPad, Mac, Apple Watch, Apple TV, and Vision Pro.
 */

import { DeviceType, DeviceModel, Orientation } from './deviceFrame';

/**
 * Screenshot size specification for a device
 */
export interface ScreenshotSize {
  /** Unique identifier */
  id: string;

  /** Device type */
  deviceType: DeviceType;

  /** Device model */
  model: DeviceModel;

  /** Width in pixels */
  width: number;

  /** Height in pixels */
  height: number;

  /** Orientation */
  orientation: Orientation;

  /** Display size (for reference, e.g. "6.9-inch") */
  displaySize?: string;

  /** Human-readable name */
  name: string;
}

/**
 * Resize operation configuration
 */
export interface ResizeOperation {
  /** Source image path or buffer */
  source: string | Buffer;

  /** Target size */
  targetSize: ScreenshotSize;

  /** Output path (optional, for batch operations) */
  outputPath?: string;

  /** Resize mode */
  mode?: ResizeMode;

  /** Quality (1-100, default 95) */
  quality?: number;

  /** Output format (default: png) */
  format?: ImageFormat;

  /** Background color for padding (default: transparent) */
  backgroundColor?: string;
}

/**
 * Resize modes for fitting content
 */
export type ResizeMode =
  | 'cover'       // Scale to cover entire area, crop if needed
  | 'contain'     // Scale to fit within bounds, pad if needed
  | 'fill'        // Stretch to exact dimensions
  | 'scale-down'; // Only scale down if larger, never scale up

/**
 * Supported image formats
 */
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp';

/**
 * Batch resize configuration
 */
export interface BatchResizeConfig {
  /** Source image */
  source: string | Buffer;

  /** Target sizes (if not provided, uses all sizes for deviceTypes) */
  targetSizes?: ScreenshotSize[];

  /** Device types to generate (if targetSizes not provided) */
  deviceTypes?: DeviceType[];

  /** Orientations to generate (if targetSizes not provided) */
  orientations?: Orientation[];

  /** Output directory */
  outputDir: string;

  /** Filename template (supports {width}, {height}, {model}, {orientation}) */
  filenameTemplate?: string;

  /** Resize mode */
  mode?: ResizeMode;

  /** Quality (1-100) */
  quality?: number;

  /** Output format */
  format?: ImageFormat;

  /** Background color */
  backgroundColor?: string;

  /** Organize by device type subdirectories */
  organizeByType?: boolean;
}

/**
 * Batch resize result
 */
export interface BatchResizeResult {
  /** Total operations */
  total: number;

  /** Successful operations */
  success: number;

  /** Failed operations */
  failed: number;

  /** Individual results */
  results: ResizeResult[];

  /** Processing time (ms) */
  duration: number;
}

/**
 * Individual resize result
 */
export interface ResizeResult {
  /** Target size */
  targetSize: ScreenshotSize;

  /** Output path */
  outputPath: string;

  /** Success status */
  success: boolean;

  /** Error message (if failed) */
  error?: string;

  /** Output file size (bytes) */
  fileSize?: number;

  /** Processing time (ms) */
  duration?: number;
}

/**
 * Screenshot size presets organized by device type
 */
export interface ScreenshotSizePresets {
  iphone: ScreenshotSize[];
  ipad: ScreenshotSize[];
  mac: ScreenshotSize[];
  watch: ScreenshotSize[];
  tv: ScreenshotSize[];
  vision: ScreenshotSize[];
}

/**
 * Resize validation result
 */
export interface ResizeValidation {
  /** Is valid */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}

/**
 * Resize statistics
 */
export interface ResizeStatistics {
  /** Original size */
  originalSize: { width: number; height: number };

  /** Target size */
  targetSize: { width: number; height: number };

  /** Scale factor */
  scale: number;

  /** Aspect ratio match */
  aspectRatioMatch: boolean;

  /** Cropped dimensions (if any) */
  cropped?: { width: number; height: number };

  /** Padded dimensions (if any) */
  padded?: { width: number; height: number };
}

/**
 * Options for screenshot size retrieval
 */
export interface GetSizesOptions {
  /** Filter by device types */
  deviceTypes?: DeviceType[];

  /** Filter by orientations */
  orientations?: Orientation[];

  /** Filter by device models */
  models?: DeviceModel[];

  /** Minimum width */
  minWidth?: number;

  /** Maximum width */
  maxWidth?: number;

  /** Minimum height */
  minHeight?: number;

  /** Maximum height */
  maxHeight?: number;
}

/**
 * Screenshot resize metadata
 */
export interface ResizeMetadata {
  /** Source dimensions */
  source: { width: number; height: number; format?: string };

  /** Target dimensions */
  target: { width: number; height: number; format: string };

  /** Resize mode used */
  mode: ResizeMode;

  /** Quality used */
  quality: number;

  /** Processing time (ms) */
  duration: number;

  /** Timestamp */
  timestamp: string;

  /** Device info */
  device: {
    type: DeviceType;
    model: DeviceModel;
    orientation: Orientation;
  };
}
