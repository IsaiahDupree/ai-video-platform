/**
 * APP-018: Figma Import Integration
 *
 * Service for importing frames from Figma and mapping them to App Store screenshot sizes.
 *
 * Features:
 * - Figma API authentication
 * - File and frame fetching
 * - Auto-detection of dimensions and device types
 * - Frame export as PNG/JPG
 * - Import history tracking
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  FigmaCredentials,
  FigmaFile,
  FigmaNode,
  FigmaNodeType,
  DetectedFrame,
  MatchedScreenshotSize,
  FigmaDeviceType,
  FrameDetectionConfig,
  FigmaImportSource,
  FrameImportConfig,
  FrameImportResult,
  ImportedFrame,
  FrameImportError,
  FrameImportStatistics,
  FigmaImportSession,
  FigmaImportHistory,
  FigmaApiFileResponse,
  FigmaApiImagesResponse,
  ParsedFrameName,
  ParsedFigmaUrl,
} from '../types/figmaImport';
import { getAllScreenshotSizes } from '../config/screenshotSizes';

// ============================================================================
// Configuration
// ============================================================================

const FIGMA_API_BASE = 'https://api.figma.com/v1';
const CREDENTIALS_DIR = 'data/figma-credentials';
const IMPORT_HISTORY_DIR = 'data/figma-imports';
const DEFAULT_OUTPUT_DIR = 'public/figma-exports';

// Device size ranges (width in pixels)
// Note: Order matters - more specific ranges should be checked first
const DEVICE_SIZE_RANGES = {
  watch: { minWidth: 272, maxWidth: 422, minHeight: 340, maxHeight: 514 },
  iphone: { minWidth: 640, maxWidth: 1320, minHeight: 1136, maxHeight: 2868 },
  tv: { minWidth: 1920, maxWidth: 3840, minHeight: 1080, maxHeight: 2160 },
  ipad: { minWidth: 1488, maxWidth: 2064, minHeight: 1984, maxHeight: 2752 },
  vision: { minWidth: 3840, maxWidth: 3840, minHeight: 2160, maxHeight: 2160 },
  mac: { minWidth: 2560, maxWidth: 5120, minHeight: 1440, maxHeight: 2880 },
};

// ============================================================================
// Credentials Management
// ============================================================================

/**
 * Save Figma credentials to disk
 */
export async function saveFigmaCredentials(
  credentials: FigmaCredentials,
  id: string = 'default'
): Promise<void> {
  await fs.mkdir(CREDENTIALS_DIR, { recursive: true });
  const filePath = path.join(CREDENTIALS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(credentials, null, 2));
}

/**
 * Load Figma credentials from disk
 */
export async function loadFigmaCredentials(
  id: string = 'default'
): Promise<FigmaCredentials | null> {
  try {
    const filePath = path.join(CREDENTIALS_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

/**
 * List all saved credentials
 */
export async function listFigmaCredentials(): Promise<
  Array<{ id: string; credentials: FigmaCredentials }>
> {
  try {
    await fs.mkdir(CREDENTIALS_DIR, { recursive: true });
    const files = await fs.readdir(CREDENTIALS_DIR);
    const credentials: Array<{ id: string; credentials: FigmaCredentials }> = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const id = file.replace('.json', '');
        const creds = await loadFigmaCredentials(id);
        if (creds) {
          credentials.push({ id, credentials: creds });
        }
      }
    }

    return credentials;
  } catch (error) {
    return [];
  }
}

/**
 * Delete saved credentials
 */
export async function deleteFigmaCredentials(id: string = 'default'): Promise<boolean> {
  try {
    const filePath = path.join(CREDENTIALS_DIR, `${id}.json`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// Figma API Requests
// ============================================================================

/**
 * Make authenticated request to Figma API
 */
async function figmaRequest<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(`${FIGMA_API_BASE}${endpoint}`, {
    headers: {
      'X-Figma-Token': accessToken,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Figma API error: ${error.err || response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch Figma file metadata and structure
 */
export async function fetchFigmaFile(
  fileKey: string,
  accessToken: string
): Promise<FigmaFile> {
  const data = await figmaRequest<FigmaApiFileResponse>(
    `/files/${fileKey}`,
    accessToken
  );

  return {
    key: fileKey,
    name: data.name,
    version: data.version,
    lastModified: data.lastModified,
    thumbnailUrl: data.thumbnailUrl,
    document: data.document,
  };
}

/**
 * Export frames as images
 */
export async function exportFigmaImages(
  fileKey: string,
  nodeIds: string[],
  accessToken: string,
  options: {
    format?: 'png' | 'jpg';
    scale?: number;
  } = {}
): Promise<Record<string, string>> {
  const format = options.format || 'png';
  const scale = options.scale || 2;

  const nodeIdsParam = nodeIds.join(',');
  const data = await figmaRequest<FigmaApiImagesResponse>(
    `/images/${fileKey}?ids=${nodeIdsParam}&format=${format}&scale=${scale}`,
    accessToken
  );

  if (data.err) {
    throw new Error(`Figma export error: ${data.err}`);
  }

  return data.images;
}

// ============================================================================
// Frame Detection & Mapping
// ============================================================================

/**
 * Find all frames in a Figma document
 */
export function findFramesInDocument(document: FigmaNode): FigmaNode[] {
  const frames: FigmaNode[] = [];

  function traverse(node: FigmaNode) {
    if (node.type === 'FRAME' || node.type === 'COMPONENT') {
      frames.push(node);
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(document);
  return frames;
}

/**
 * Parse frame name for device type and size hints
 */
export function parseFrameName(name: string): ParsedFrameName {
  const original = name;
  let cleanedName = name;
  let deviceType: DeviceType | undefined;
  let orientation: 'portrait' | 'landscape' | undefined;
  let sizeHint: string | undefined;

  // Device type detection
  const devicePatterns: Record<FigmaDeviceType, RegExp> = {
    iphone: /iphone|ios|phone/i,
    ipad: /ipad|tablet/i,
    mac: /mac|macbook|imac|desktop/i,
    watch: /watch|wearable/i,
    tv: /tv|apple\s*tv/i,
    vision: /vision|visionpro|xr|vr/i,
  };

  for (const [device, pattern] of Object.entries(devicePatterns)) {
    if (pattern.test(name)) {
      deviceType = device as FigmaDeviceType;
      break;
    }
  }

  // Orientation detection
  if (/portrait/i.test(name)) {
    orientation = 'portrait';
  } else if (/landscape/i.test(name)) {
    orientation = 'landscape';
  }

  // Size hint detection (e.g., "6.7", "12.9")
  const sizeMatch = name.match(/(\d+\.?\d*)\s*(?:inch|"|in)?/i);
  if (sizeMatch) {
    sizeHint = sizeMatch[1];
  }

  // Clean up name
  cleanedName = name
    .replace(/\b(iphone|ipad|mac|watch|tv|vision|portrait|landscape)\b/gi, '')
    .replace(/\d+\.?\d*\s*(?:inch|"|in)?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    original,
    deviceType,
    orientation,
    sizeHint,
    cleanedName,
  };
}

/**
 * Detect device type from dimensions
 */
export function detectDeviceType(
  width: number,
  height: number
): FigmaDeviceType | undefined {
  const aspectRatio = width / height;

  // Special cases for 16:9 aspect ratio (TV and Vision Pro)
  if (Math.abs(aspectRatio - 16 / 9) < 0.01) {
    if (width === 3840 && height === 2160) {
      return 'tv'; // 4K TV or Vision Pro (prefer TV)
    }
    if (width === 1920 && height === 1080) {
      return 'tv'; // HD TV
    }
  }

  // Check standard device ranges
  for (const [device, range] of Object.entries(DEVICE_SIZE_RANGES)) {
    if (
      width >= range.minWidth &&
      width <= range.maxWidth &&
      height >= range.minHeight &&
      height <= range.maxHeight
    ) {
      return device as FigmaDeviceType;
    }
  }
  return undefined;
}

/**
 * Find best matching screenshot size
 */
export function findMatchingScreenshotSize(
  width: number,
  height: number,
  deviceType?: FigmaDeviceType
): MatchedScreenshotSize | undefined {
  const allSizes = getAllScreenshotSizes();
  let bestMatch: MatchedScreenshotSize | undefined;
  let bestSimilarity = 0;

  const aspectRatio = width / height;

  for (const size of allSizes) {
    // Filter by device type if specified
    if (deviceType && size.deviceType !== deviceType) {
      continue;
    }

    const sizeAspectRatio = size.width / size.height;
    const widthRatio = Math.min(width, size.width) / Math.max(width, size.width);
    const heightRatio = Math.min(height, size.height) / Math.max(height, size.height);
    const aspectRatioSimilarity =
      1 - Math.abs(aspectRatio - sizeAspectRatio) / Math.max(aspectRatio, sizeAspectRatio);

    // Exact match
    if (width === size.width && height === size.height) {
      return {
        id: size.id,
        displayName: size.displayName,
        deviceType: size.deviceType,
        width: size.width,
        height: size.height,
        similarity: 1.0,
        matchType: 'exact',
      };
    }

    // Close match (within 5%)
    const dimensionSimilarity = (widthRatio + heightRatio) / 2;
    if (dimensionSimilarity > bestSimilarity && dimensionSimilarity >= 0.95) {
      bestMatch = {
        id: size.id,
        displayName: size.displayName,
        deviceType: size.deviceType,
        width: size.width,
        height: size.height,
        similarity: dimensionSimilarity,
        matchType: 'close',
      };
      bestSimilarity = dimensionSimilarity;
    }

    // Aspect ratio match
    if (aspectRatioSimilarity > bestSimilarity && aspectRatioSimilarity >= 0.95) {
      bestMatch = {
        id: size.id,
        displayName: size.displayName,
        deviceType: size.deviceType,
        width: size.width,
        height: size.height,
        similarity: aspectRatioSimilarity,
        matchType: 'aspect-ratio',
      };
      bestSimilarity = aspectRatioSimilarity;
    }
  }

  return bestMatch;
}

/**
 * Detect frames with auto-size mapping
 */
export function detectFrames(
  frames: FigmaNode[],
  config: FrameDetectionConfig = {}
): DetectedFrame[] {
  const {
    minWidth = 0,
    minHeight = 0,
    maxWidth = 10000,
    maxHeight = 10000,
    includeUnknown = true,
    deviceTypes,
    minConfidence = 0,
  } = config;

  const detectedFrames: DetectedFrame[] = [];

  for (const frame of frames) {
    const bbox = frame.absoluteBoundingBox;
    if (!bbox) continue;

    const width = Math.round(bbox.width);
    const height = Math.round(bbox.height);

    // Apply dimension filters
    if (width < minWidth || width > maxWidth || height < minHeight || height > maxHeight) {
      continue;
    }

    // Parse frame name
    const parsed = parseFrameName(frame.name);

    // Detect device type
    let deviceType = parsed.deviceType || detectDeviceType(width, height);

    // Filter by device types
    if (deviceTypes && deviceTypes.length > 0 && !deviceTypes.includes(deviceType!)) {
      continue;
    }

    // Skip unknown if not included
    if (!includeUnknown && !deviceType) {
      continue;
    }

    // Find matching size
    const matchedSize = findMatchingScreenshotSize(width, height, deviceType);

    // Calculate confidence
    let confidence = 0;
    if (deviceType) confidence += 0.3;
    if (matchedSize) confidence += 0.4 + matchedSize.similarity * 0.3;

    // Apply confidence filter
    if (confidence < minConfidence) {
      continue;
    }

    const aspectRatio = width / height;
    const orientation = aspectRatio < 1 ? 'portrait' : 'landscape';

    detectedFrames.push({
      id: frame.id,
      name: frame.name,
      width,
      height,
      aspectRatio,
      deviceType,
      orientation,
      matchedSize,
      confidence,
      node: frame,
    });
  }

  // Sort by confidence descending
  detectedFrames.sort((a, b) => b.confidence - a.confidence);

  return detectedFrames;
}

// ============================================================================
// Frame Import
// ============================================================================

/**
 * Download image from URL and save to disk
 */
async function downloadImage(
  url: string,
  outputPath: string
): Promise<{ filePath: string; fileSize: number }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);

  return {
    filePath: outputPath,
    fileSize: buffer.length,
  };
}

/**
 * Import frames from Figma
 */
export async function importFramesFromFigma(
  source: FigmaImportSource,
  importConfig: FrameImportConfig,
  credentials: FigmaCredentials
): Promise<FrameImportResult> {
  const startTime = Date.now();
  const errors: FrameImportError[] = [];
  const importedFrames: ImportedFrame[] = [];

  try {
    // Fetch file
    const file = await fetchFigmaFile(source.fileKey, credentials.accessToken);

    // Find frames
    let frames = findFramesInDocument(file.document!);

    // Filter to specific page if specified
    if (source.pageName) {
      const page = file.document?.children?.find(
        (node) => node.type === 'CANVAS' && node.name === source.pageName
      );
      if (page) {
        frames = findFramesInDocument(page);
      } else {
        throw new Error(`Page not found: ${source.pageName}`);
      }
    }

    // Filter to specific frame IDs if specified
    if (source.frameIds && source.frameIds.length > 0) {
      frames = frames.filter((frame) => source.frameIds!.includes(frame.id));
    }

    // Detect frames
    const detectedFrames = detectFrames(frames, source.detectionConfig);

    // Export images
    const nodeIds = detectedFrames.map((f) => f.id);
    if (nodeIds.length === 0) {
      return {
        fileKey: source.fileKey,
        detectedFrames: [],
        importedFrames: [],
        errors: [
          {
            frameId: '',
            frameName: '',
            message: 'No frames detected',
            code: 'NO_FRAMES',
            occurredAt: new Date(),
          },
        ],
        statistics: createEmptyStatistics(),
        importedAt: new Date(),
      };
    }

    const imageUrls = await exportFigmaImages(
      source.fileKey,
      nodeIds,
      credentials.accessToken,
      {
        format: importConfig.format.toLowerCase() as 'png' | 'jpg',
        scale: importConfig.scale || 2,
      }
    );

    // Download images
    const outputDir = importConfig.outputDir || DEFAULT_OUTPUT_DIR;
    await fs.mkdir(outputDir, { recursive: true });

    for (const frame of detectedFrames) {
      try {
        const imageUrl = imageUrls[frame.id];
        if (!imageUrl) {
          throw new Error('No image URL returned');
        }

        // Generate filename
        const devicePrefix = frame.deviceType || 'unknown';
        const sizeInfo = frame.matchedSize ? `_${frame.matchedSize.id}` : '';
        const metadata = importConfig.includeMetadata
          ? `_${frame.width}x${frame.height}`
          : '';
        const filename = `${devicePrefix}${sizeInfo}${metadata}_${frame.id}.${importConfig.format.toLowerCase()}`;
        const outputPath = path.join(outputDir, filename);

        // Download image
        const { filePath, fileSize } = await downloadImage(imageUrl, outputPath);

        // Create imported frame record
        importedFrames.push({
          frameId: frame.id,
          frameName: frame.name,
          originalWidth: frame.width,
          originalHeight: frame.height,
          exportedWidth: frame.width * (importConfig.scale || 2),
          exportedHeight: frame.height * (importConfig.scale || 2),
          deviceType: frame.deviceType,
          matchedSize: frame.matchedSize,
          filePath,
          fileSize,
          format: importConfig.format,
          figmaUrl: imageUrl,
        });
      } catch (error: any) {
        errors.push({
          frameId: frame.id,
          frameName: frame.name,
          message: error.message || 'Unknown error',
          code: 'EXPORT_FAILED',
          occurredAt: new Date(),
        });
      }
    }

    // Calculate statistics
    const statistics = calculateImportStatistics(
      detectedFrames,
      importedFrames,
      errors,
      Date.now() - startTime
    );

    return {
      fileKey: source.fileKey,
      detectedFrames,
      importedFrames,
      errors,
      statistics,
      importedAt: new Date(),
    };
  } catch (error: any) {
    return {
      fileKey: source.fileKey,
      detectedFrames: [],
      importedFrames: [],
      errors: [
        {
          frameId: '',
          frameName: '',
          message: error.message || 'Unknown error',
          code: 'IMPORT_FAILED',
          occurredAt: new Date(),
        },
      ],
      statistics: createEmptyStatistics(),
      importedAt: new Date(),
    };
  }
}

/**
 * Calculate import statistics
 */
function calculateImportStatistics(
  detectedFrames: DetectedFrame[],
  importedFrames: ImportedFrame[],
  errors: FrameImportError[],
  processingTimeMs: number
): FrameImportStatistics {
  const byDeviceType: Record<FigmaDeviceType, number> = {
    iphone: 0,
    ipad: 0,
    mac: 0,
    watch: 0,
    tv: 0,
    vision: 0,
  };

  const byMatchType: Record<'exact' | 'close' | 'aspect-ratio' | 'unknown', number> = {
    exact: 0,
    close: 0,
    'aspect-ratio': 0,
    unknown: 0,
  };

  let totalFileSize = 0;

  for (const frame of importedFrames) {
    if (frame.deviceType) {
      byDeviceType[frame.deviceType]++;
    }

    if (frame.matchedSize) {
      byMatchType[frame.matchedSize.matchType]++;
    } else {
      byMatchType.unknown++;
    }

    totalFileSize += frame.fileSize;
  }

  return {
    totalDetected: detectedFrames.length,
    totalImported: importedFrames.length,
    totalFailed: errors.length,
    totalFileSize,
    byDeviceType,
    byMatchType,
    processingTimeMs,
  };
}

/**
 * Create empty statistics
 */
function createEmptyStatistics(): FrameImportStatistics {
  return {
    totalDetected: 0,
    totalImported: 0,
    totalFailed: 0,
    totalFileSize: 0,
    byDeviceType: {
      iphone: 0,
      ipad: 0,
      mac: 0,
      watch: 0,
      tv: 0,
      vision: 0,
    },
    byMatchType: {
      exact: 0,
      close: 0,
      'aspect-ratio': 0,
      unknown: 0,
    },
    processingTimeMs: 0,
  };
}

// ============================================================================
// Import History
// ============================================================================

/**
 * Save import session to history
 */
export async function saveImportSession(session: FigmaImportSession): Promise<void> {
  await fs.mkdir(IMPORT_HISTORY_DIR, { recursive: true });
  const filePath = path.join(IMPORT_HISTORY_DIR, `${session.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(session, null, 2));
}

/**
 * Load import session from history
 */
export async function loadImportSession(
  id: string
): Promise<FigmaImportSession | null> {
  try {
    const filePath = path.join(IMPORT_HISTORY_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

/**
 * Get import history
 */
export async function getImportHistory(): Promise<FigmaImportHistory> {
  try {
    await fs.mkdir(IMPORT_HISTORY_DIR, { recursive: true });
    const files = await fs.readdir(IMPORT_HISTORY_DIR);
    const sessions: FigmaImportSession[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const id = file.replace('.json', '');
        const session = await loadImportSession(id);
        if (session) {
          sessions.push(session);
        }
      }
    }

    // Sort by date descending
    sessions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalFrames = sessions.reduce(
      (sum, s) => sum + s.result.importedFrames.length,
      0
    );
    const lastImportAt = sessions.length > 0 ? sessions[0].createdAt : undefined;

    return {
      sessions,
      totalImports: sessions.length,
      totalFrames,
      lastImportAt,
    };
  } catch (error) {
    return {
      sessions: [],
      totalImports: 0,
      totalFrames: 0,
    };
  }
}

/**
 * Delete import session
 */
export async function deleteImportSession(id: string): Promise<boolean> {
  try {
    const filePath = path.join(IMPORT_HISTORY_DIR, `${id}.json`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse Figma URL to extract file key and node ID
 */
export function parseFigmaUrl(url: string): ParsedFigmaUrl {
  const result: ParsedFigmaUrl = {
    fileKey: '',
    isValid: false,
  };

  try {
    const urlObj = new URL(url);

    // Check if it's a Figma URL
    if (!urlObj.hostname.includes('figma.com')) {
      return result;
    }

    // Extract file key from path
    const pathMatch = urlObj.pathname.match(/\/file\/([a-zA-Z0-9]+)/);
    if (pathMatch) {
      result.fileKey = pathMatch[1];
      result.isValid = true;
    }

    // Extract node ID from hash or query
    const nodeIdMatch = urlObj.hash.match(/node-id=([^&]+)/) || url.match(/\?node-id=([^&]+)/);
    if (nodeIdMatch) {
      result.nodeId = decodeURIComponent(nodeIdMatch[1]);
    }

    return result;
  } catch (error) {
    return result;
  }
}

/**
 * Test Figma API credentials
 */
export async function testFigmaCredentials(
  accessToken: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Try to fetch user info
    const response = await fetch('https://api.figma.com/v1/me', {
      headers: {
        'X-Figma-Token': accessToken,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        valid: false,
        error: error.err || 'Invalid credentials',
      };
    }

    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Connection failed',
    };
  }
}
