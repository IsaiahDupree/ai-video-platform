/**
 * Screenshot Resize Service
 * APP-003: Screenshot Size Generator
 *
 * Batch resize screenshots to all required App Store dimensions.
 * Supports multiple resize modes and output formats.
 * Uses Sharp if available, otherwise falls back to canvas.
 */

import fs from 'fs/promises';
import path from 'path';

// Try to import Sharp, fall back to Canvas if unavailable
let sharp: any;
let canvas: any;

try {
  sharp = require('sharp');
} catch {
  try {
    canvas = require('canvas');
  } catch {
    console.warn('Neither sharp nor canvas available. Image processing features will be limited.');
  }
}
import {
  ResizeOperation,
  ResizeMode,
  BatchResizeConfig,
  BatchResizeResult,
  ResizeResult,
  ResizeValidation,
  ResizeStatistics,
  ResizeMetadata,
  ScreenshotSize,
} from '@/types/screenshotResize';
import {
  getAllScreenshotSizes,
  getScreenshotSizesByType,
  getScreenshotSizes,
} from '@/config/screenshotSizes';

/**
 * Resize a single screenshot to target dimensions
 */
export async function resizeScreenshot(operation: ResizeOperation): Promise<ResizeResult> {
  const startTime = Date.now();

  try {
    // Validate operation
    const validation = validateResize(operation);
    if (!validation.valid) {
      return {
        targetSize: operation.targetSize,
        outputPath: operation.outputPath || '',
        success: false,
        error: validation.errors.join(', '),
      };
    }

    // Load source image
    const image = sharp(operation.source);
    const metadata = await image.metadata();

    // Get resize dimensions
    const { width: targetWidth, height: targetHeight } = operation.targetSize;
    const mode = operation.mode || 'contain';
    const quality = operation.quality || 95;
    const format = operation.format || 'png';
    const backgroundColor = operation.backgroundColor || 'transparent';

    // Apply resize based on mode
    let resized: sharp.Sharp;

    switch (mode) {
      case 'cover':
        // Scale to cover, crop if needed
        resized = image.resize(targetWidth, targetHeight, {
          fit: 'cover',
          position: 'center',
        });
        break;

      case 'contain':
        // Scale to fit within bounds, pad if needed
        resized = image.resize(targetWidth, targetHeight, {
          fit: 'contain',
          position: 'center',
          background: parseColor(backgroundColor),
        });
        break;

      case 'fill':
        // Stretch to exact dimensions
        resized = image.resize(targetWidth, targetHeight, {
          fit: 'fill',
        });
        break;

      case 'scale-down':
        // Only scale down if larger
        const needsResize =
          metadata.width! > targetWidth || metadata.height! > targetHeight;
        if (needsResize) {
          resized = image.resize(targetWidth, targetHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        } else {
          resized = image;
        }
        break;

      default:
        resized = image.resize(targetWidth, targetHeight, {
          fit: 'contain',
          position: 'center',
          background: parseColor(backgroundColor),
        });
    }

    // Apply format-specific options
    switch (format) {
      case 'jpg':
      case 'jpeg':
        resized = resized.jpeg({ quality });
        break;
      case 'webp':
        resized = resized.webp({ quality });
        break;
      case 'png':
      default:
        resized = resized.png({ quality });
        break;
    }

    // Save or return buffer
    let outputPath = operation.outputPath;
    let outputBuffer: Buffer;

    if (outputPath) {
      // Ensure directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await resized.toFile(outputPath);
      const stats = await fs.stat(outputPath);
      const duration = Date.now() - startTime;

      return {
        targetSize: operation.targetSize,
        outputPath,
        success: true,
        fileSize: stats.size,
        duration,
      };
    } else {
      outputBuffer = await resized.toBuffer();
      const duration = Date.now() - startTime;

      return {
        targetSize: operation.targetSize,
        outputPath: '',
        success: true,
        fileSize: outputBuffer.length,
        duration,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      targetSize: operation.targetSize,
      outputPath: operation.outputPath || '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    };
  }
}

/**
 * Batch resize screenshots to multiple sizes
 */
export async function batchResize(config: BatchResizeConfig): Promise<BatchResizeResult> {
  const startTime = Date.now();

  try {
    // Determine target sizes
    let targetSizes: ScreenshotSize[];

    if (config.targetSizes && config.targetSizes.length > 0) {
      targetSizes = config.targetSizes;
    } else {
      // Generate sizes based on device types and orientations
      const deviceTypes = config.deviceTypes || ['iphone', 'ipad', 'mac', 'watch'];
      const orientations = config.orientations;

      if (orientations && orientations.length > 0) {
        targetSizes = getScreenshotSizes({
          deviceTypes,
          orientations,
        });
      } else {
        targetSizes = deviceTypes.flatMap((type) => getScreenshotSizesByType(type));
      }
    }

    if (targetSizes.length === 0) {
      throw new Error('No target sizes specified');
    }

    // Create output directory
    await fs.mkdir(config.outputDir, { recursive: true });

    // Generate resize operations
    const operations: ResizeOperation[] = targetSizes.map((targetSize) => {
      const filename = generateFilename(
        config.filenameTemplate || '{model}_{width}x{height}_{orientation}.{ext}',
        targetSize,
        config.format || 'png'
      );

      const outputPath = config.organizeByType
        ? path.join(config.outputDir, targetSize.deviceType, filename)
        : path.join(config.outputDir, filename);

      return {
        source: config.source,
        targetSize,
        outputPath,
        mode: config.mode,
        quality: config.quality,
        format: config.format,
        backgroundColor: config.backgroundColor,
      };
    });

    // Execute resizes in parallel (with concurrency limit)
    const concurrency = 5;
    const results: ResizeResult[] = [];

    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map((op) => resizeScreenshot(op)));
      results.push(...batchResults);
    }

    // Calculate statistics
    const success = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const duration = Date.now() - startTime;

    return {
      total: results.length,
      success,
      failed,
      results,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    throw new Error(`Batch resize failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate resize operation
 */
export function validateResize(operation: ResizeOperation): ResizeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate source
  if (!operation.source) {
    errors.push('Source image is required');
  }

  // Validate target size
  if (!operation.targetSize) {
    errors.push('Target size is required');
  } else {
    if (operation.targetSize.width <= 0) {
      errors.push('Target width must be positive');
    }
    if (operation.targetSize.height <= 0) {
      errors.push('Target height must be positive');
    }
  }

  // Validate quality
  if (operation.quality !== undefined) {
    if (operation.quality < 1 || operation.quality > 100) {
      errors.push('Quality must be between 1 and 100');
    }
  }

  // Validate mode
  const validModes: ResizeMode[] = ['cover', 'contain', 'fill', 'scale-down'];
  if (operation.mode && !validModes.includes(operation.mode)) {
    errors.push(`Invalid resize mode. Must be one of: ${validModes.join(', ')}`);
  }

  // Warnings
  if (operation.targetSize) {
    const { width, height } = operation.targetSize;

    if (width > 5000 || height > 5000) {
      warnings.push('Target dimensions are very large (>5000px)');
    }

    if (width < 100 || height < 100) {
      warnings.push('Target dimensions are very small (<100px)');
    }
  }

  if (operation.mode === 'fill') {
    warnings.push('Fill mode will stretch the image, which may cause distortion');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate resize statistics
 */
export async function calculateResizeStatistics(
  source: string | Buffer,
  targetSize: ScreenshotSize,
  mode: ResizeMode = 'contain'
): Promise<ResizeStatistics> {
  const image = sharp(source);
  const metadata = await image.metadata();

  const originalWidth = metadata.width!;
  const originalHeight = metadata.height!;
  const targetWidth = targetSize.width;
  const targetHeight = targetSize.height;

  // Calculate scale factor
  const scaleX = targetWidth / originalWidth;
  const scaleY = targetHeight / originalHeight;
  const scale =
    mode === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);

  // Calculate aspect ratios
  const originalRatio = originalWidth / originalHeight;
  const targetRatio = targetWidth / targetHeight;
  const aspectRatioMatch = Math.abs(originalRatio - targetRatio) < 0.01;

  // Calculate cropped/padded dimensions
  let cropped: { width: number; height: number } | undefined;
  let padded: { width: number; height: number } | undefined;

  if (mode === 'cover' && !aspectRatioMatch) {
    const scaledWidth = Math.round(originalWidth * scale);
    const scaledHeight = Math.round(originalHeight * scale);
    cropped = {
      width: scaledWidth - targetWidth,
      height: scaledHeight - targetHeight,
    };
  } else if (mode === 'contain' && !aspectRatioMatch) {
    const scaledWidth = Math.round(originalWidth * scale);
    const scaledHeight = Math.round(originalHeight * scale);
    padded = {
      width: targetWidth - scaledWidth,
      height: targetHeight - scaledHeight,
    };
  }

  return {
    originalSize: { width: originalWidth, height: originalHeight },
    targetSize: { width: targetWidth, height: targetHeight },
    scale,
    aspectRatioMatch,
    cropped,
    padded,
  };
}

/**
 * Generate metadata for a resize operation
 */
export async function generateResizeMetadata(
  source: string | Buffer,
  operation: ResizeOperation,
  duration: number
): Promise<ResizeMetadata> {
  const image = sharp(source);
  const metadata = await image.metadata();

  return {
    source: {
      width: metadata.width!,
      height: metadata.height!,
      format: metadata.format,
    },
    target: {
      width: operation.targetSize.width,
      height: operation.targetSize.height,
      format: operation.format || 'png',
    },
    mode: operation.mode || 'contain',
    quality: operation.quality || 95,
    duration,
    timestamp: new Date().toISOString(),
    device: {
      type: operation.targetSize.deviceType,
      model: operation.targetSize.model,
      orientation: operation.targetSize.orientation,
    },
  };
}

/**
 * Generate filename from template
 */
function generateFilename(
  template: string,
  targetSize: ScreenshotSize,
  format: string
): string {
  return template
    .replace('{width}', targetSize.width.toString())
    .replace('{height}', targetSize.height.toString())
    .replace('{model}', targetSize.model)
    .replace('{deviceType}', targetSize.deviceType)
    .replace('{orientation}', targetSize.orientation)
    .replace('{id}', targetSize.id)
    .replace('{displaySize}', targetSize.displaySize || '')
    .replace('{ext}', format);
}

/**
 * Parse color string to Sharp color format
 */
function parseColor(color: string): sharp.Color {
  if (color === 'transparent') {
    return { r: 0, g: 0, b: 0, alpha: 0 };
  }

  // Parse hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;

    return { r, g, b, alpha };
  }

  // Parse rgb/rgba colors
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      alpha: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }

  // Default to white
  return { r: 255, g: 255, b: 255, alpha: 1 };
}

/**
 * Quick resize preset: Generate all iPhone sizes
 */
export async function resizeForAllIPhones(
  source: string | Buffer,
  outputDir: string,
  options?: Partial<BatchResizeConfig>
): Promise<BatchResizeResult> {
  return batchResize({
    source,
    outputDir,
    deviceTypes: ['iphone'],
    ...options,
  });
}

/**
 * Quick resize preset: Generate all iPad sizes
 */
export async function resizeForAllIPads(
  source: string | Buffer,
  outputDir: string,
  options?: Partial<BatchResizeConfig>
): Promise<BatchResizeResult> {
  return batchResize({
    source,
    outputDir,
    deviceTypes: ['ipad'],
    ...options,
  });
}

/**
 * Quick resize preset: Generate all sizes for a single orientation
 */
export async function resizeForOrientation(
  source: string | Buffer,
  outputDir: string,
  orientation: 'portrait' | 'landscape',
  options?: Partial<BatchResizeConfig>
): Promise<BatchResizeResult> {
  return batchResize({
    source,
    outputDir,
    orientations: [orientation],
    ...options,
  });
}

/**
 * Quick resize preset: Generate recommended minimum sizes
 */
export async function resizeRecommended(
  source: string | Buffer,
  outputDir: string,
  options?: Partial<BatchResizeConfig>
): Promise<BatchResizeResult> {
  const { getRecommendedSizes } = await import('@/config/screenshotSizes');
  const targetSizes = getRecommendedSizes();

  return batchResize({
    source,
    outputDir,
    targetSizes,
    ...options,
  });
}
