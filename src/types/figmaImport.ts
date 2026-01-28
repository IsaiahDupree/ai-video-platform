/**
 * APP-018: Figma Import Integration
 *
 * Type definitions for importing frames from Figma and mapping them to App Store screenshot sizes.
 *
 * Features:
 * - Figma API authentication and token management
 * - File and frame fetching from Figma projects
 * - Auto-detection of frame dimensions and device types
 * - Mapping to App Store Connect screenshot sizes
 * - Batch frame export as PNG/JPG
 * - Import history and metadata tracking
 */

// ============================================================================
// Figma API Types
// ============================================================================

/**
 * Figma authentication credentials
 */
export interface FigmaCredentials {
  /** Personal access token from Figma */
  accessToken: string;
  /** Optional team ID for team-specific access */
  teamId?: string;
  /** Credential label for identification */
  label?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last used timestamp */
  lastUsedAt?: Date;
}

/**
 * Figma file metadata
 */
export interface FigmaFile {
  /** File key (from Figma URL) */
  key: string;
  /** File name */
  name: string;
  /** File version */
  version: string;
  /** Last modified timestamp */
  lastModified: string;
  /** Thumbnail URL */
  thumbnailUrl?: string;
  /** Document structure */
  document?: FigmaNode;
}

/**
 * Figma node (page, frame, component, etc.)
 */
export interface FigmaNode {
  /** Node ID */
  id: string;
  /** Node name */
  name: string;
  /** Node type (DOCUMENT, CANVAS, FRAME, etc.) */
  type: FigmaNodeType;
  /** Child nodes */
  children?: FigmaNode[];
  /** Absolute bounding box */
  absoluteBoundingBox?: FigmaBoundingBox;
  /** Background color */
  backgroundColor?: FigmaColor;
  /** Export settings */
  exportSettings?: FigmaExportSetting[];
}

export type FigmaNodeType =
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'RECTANGLE'
  | 'TEXT'
  | 'VECTOR';

/**
 * Figma bounding box (absolute coordinates)
 */
export interface FigmaBoundingBox {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
}

/**
 * Figma color (RGBA)
 */
export interface FigmaColor {
  /** Red (0-1) */
  r: number;
  /** Green (0-1) */
  g: number;
  /** Blue (0-1) */
  b: number;
  /** Alpha (0-1) */
  a: number;
}

/**
 * Figma export setting
 */
export interface FigmaExportSetting {
  /** File format */
  format: 'PNG' | 'JPG' | 'SVG' | 'PDF';
  /** Scale factor (e.g., 1, 2, 3 for @1x, @2x, @3x) */
  scale: number;
  /** File suffix */
  suffix?: string;
}

// ============================================================================
// Frame Detection & Mapping
// ============================================================================

/**
 * Detected frame from Figma file
 */
export interface DetectedFrame {
  /** Frame ID */
  id: string;
  /** Frame name */
  name: string;
  /** Frame dimensions */
  width: number;
  height: number;
  /** Aspect ratio */
  aspectRatio: number;
  /** Detected device type */
  deviceType?: FigmaDeviceType;
  /** Detected orientation */
  orientation?: 'portrait' | 'landscape';
  /** Matched App Store size (if any) */
  matchedSize?: MatchedScreenshotSize;
  /** Confidence score (0-1) */
  confidence: number;
  /** Original Figma node */
  node: FigmaNode;
}

export type FigmaDeviceType = 'iphone' | 'ipad' | 'mac' | 'watch' | 'tv' | 'vision';

/**
 * Matched screenshot size with similarity score
 */
export interface MatchedScreenshotSize {
  /** Size ID (e.g., 'iphone-67-portrait') */
  id: string;
  /** Display name */
  displayName: string;
  /** Device type */
  deviceType: FigmaDeviceType;
  /** Target width */
  width: number;
  /** Target height */
  height: number;
  /** Similarity score (0-1, 1 = exact match) */
  similarity: number;
  /** Match type */
  matchType: 'exact' | 'close' | 'aspect-ratio';
}

/**
 * Frame detection configuration
 */
export interface FrameDetectionConfig {
  /** Minimum frame width to consider */
  minWidth?: number;
  /** Minimum frame height to consider */
  minHeight?: number;
  /** Maximum frame width to consider */
  maxWidth?: number;
  /** Maximum frame height to consider */
  maxHeight?: number;
  /** Include frames without device type detection */
  includeUnknown?: boolean;
  /** Device types to filter for */
  deviceTypes?: FigmaDeviceType[];
  /** Minimum confidence score (0-1) */
  minConfidence?: number;
  /** Aspect ratio tolerance for matching (default: 0.05) */
  aspectRatioTolerance?: number;
}

// ============================================================================
// Import Operations
// ============================================================================

/**
 * Figma import source configuration
 */
export interface FigmaImportSource {
  /** Figma file URL or key */
  fileKey: string;
  /** Optional page name to import from */
  pageName?: string;
  /** Optional frame IDs to import (if empty, imports all) */
  frameIds?: string[];
  /** Detection config */
  detectionConfig?: FrameDetectionConfig;
}

/**
 * Frame import configuration
 */
export interface FrameImportConfig {
  /** Output format */
  format: 'PNG' | 'JPG';
  /** Scale factor (1-3) */
  scale?: number;
  /** Quality for JPG (1-100) */
  quality?: number;
  /** Use frame dimensions (true) or resize to App Store size (false) */
  useOriginalDimensions?: boolean;
  /** Output directory */
  outputDir?: string;
  /** Include frame metadata in filename */
  includeMetadata?: boolean;
}

/**
 * Batch frame import result
 */
export interface FrameImportResult {
  /** Source file key */
  fileKey: string;
  /** Detected frames */
  detectedFrames: DetectedFrame[];
  /** Imported frames */
  importedFrames: ImportedFrame[];
  /** Errors encountered */
  errors: FrameImportError[];
  /** Import statistics */
  statistics: FrameImportStatistics;
  /** Import timestamp */
  importedAt: Date;
}

/**
 * Single imported frame
 */
export interface ImportedFrame {
  /** Frame ID */
  frameId: string;
  /** Frame name */
  frameName: string;
  /** Original dimensions */
  originalWidth: number;
  originalHeight: number;
  /** Exported dimensions */
  exportedWidth: number;
  exportedHeight: number;
  /** Device type */
  deviceType?: FigmaDeviceType;
  /** Matched size */
  matchedSize?: MatchedScreenshotSize;
  /** Local file path */
  filePath: string;
  /** File size in bytes */
  fileSize: number;
  /** Export format */
  format: 'PNG' | 'JPG';
  /** Figma image URL */
  figmaUrl: string;
}

/**
 * Frame import error
 */
export interface FrameImportError {
  /** Frame ID */
  frameId: string;
  /** Frame name */
  frameName: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Timestamp */
  occurredAt: Date;
}

/**
 * Frame import statistics
 */
export interface FrameImportStatistics {
  /** Total frames detected */
  totalDetected: number;
  /** Total frames imported successfully */
  totalImported: number;
  /** Total frames failed */
  totalFailed: number;
  /** Total file size in bytes */
  totalFileSize: number;
  /** Frames by device type */
  byDeviceType: Record<FigmaDeviceType, number>;
  /** Frames by match type */
  byMatchType: Record<'exact' | 'close' | 'aspect-ratio' | 'unknown', number>;
  /** Processing time in ms */
  processingTimeMs: number;
}

// ============================================================================
// Import History & Tracking
// ============================================================================

/**
 * Figma import session (saved to disk)
 */
export interface FigmaImportSession {
  /** Session ID */
  id: string;
  /** File key */
  fileKey: string;
  /** File name */
  fileName: string;
  /** Import config */
  importConfig: FrameImportConfig;
  /** Detection config */
  detectionConfig?: FrameDetectionConfig;
  /** Import result */
  result: FrameImportResult;
  /** Created at */
  createdAt: Date;
  /** Notes */
  notes?: string;
}

/**
 * Figma import history
 */
export interface FigmaImportHistory {
  /** All import sessions */
  sessions: FigmaImportSession[];
  /** Total imports */
  totalImports: number;
  /** Total frames imported */
  totalFrames: number;
  /** Last import timestamp */
  lastImportAt?: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Figma API file response
 */
export interface FigmaApiFileResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, any>;
  schemaVersion: number;
  styles: Record<string, any>;
}

/**
 * Figma API images response
 */
export interface FigmaApiImagesResponse {
  err: string | null;
  images: Record<string, string>;
  status?: number;
}

/**
 * Figma API error response
 */
export interface FigmaApiError {
  status: number;
  err: string;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Frame filter predicate
 */
export type FrameFilterFn = (frame: DetectedFrame) => boolean;

/**
 * Frame sort comparator
 */
export type FrameSortFn = (a: DetectedFrame, b: DetectedFrame) => number;

/**
 * Frame name parsing result
 */
export interface ParsedFrameName {
  /** Original name */
  original: string;
  /** Device type hint from name */
  deviceType?: FigmaDeviceType;
  /** Orientation hint from name */
  orientation?: 'portrait' | 'landscape';
  /** Size hint from name (e.g., "6.7", "12.9") */
  sizeHint?: string;
  /** Cleaned name (without hints) */
  cleanedName: string;
}

/**
 * Figma URL parse result
 */
export interface ParsedFigmaUrl {
  /** File key */
  fileKey: string;
  /** Node ID (if specified) */
  nodeId?: string;
  /** Valid Figma URL */
  isValid: boolean;
}
