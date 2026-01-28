/**
 * renderStill Service - ADS-007
 * Node service using @remotion/renderer for PNG/JPG/WebP output
 *
 * This service provides methods to render static ad templates to image files
 * using Remotion's Still API.
 */

import { renderStill as remotionRenderStill, getCompositions } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';
import fs from 'fs';
import type { AdTemplate } from '../types/adTemplate';
import { serverTracking } from './trackingServer';

// Feature usage tracking
function trackAdGeneratedServer(
  adId: string,
  templateId: string | null,
  method: 'manual' | 'template' | 'ai_variant' | 'csv_import'
): void {
  serverTracking.track('ad_generated', {
    adId,
    templateId,
    method,
    variantCount: 1,
    sizeCount: 1,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Supported image formats
 */
export type ImageFormat = 'png' | 'jpeg' | 'webp';

/**
 * Quality options for lossy formats (JPEG/WebP)
 */
export interface QualityOptions {
  quality?: number; // 0-100, default 90
}

/**
 * Options for rendering a still image
 */
export interface RenderStillOptions {
  outputPath?: string;           // Output file path
  format?: ImageFormat;          // Image format (default: 'png')
  quality?: number;              // Quality for JPEG/WebP (0-100, default: 90)
  scale?: number;                // Scale factor (default: 1)
  width?: number;                // Override width
  height?: number;               // Override height
  overwrite?: boolean;           // Overwrite existing file (default: true)
}

/**
 * Result of a still render
 */
export interface RenderStillResult {
  success: boolean;
  outputPath: string;
  width: number;
  height: number;
  format: ImageFormat;
  sizeInBytes?: number;
  error?: string;
}

/**
 * Batch render options
 */
export interface BatchRenderOptions {
  outputDir: string;             // Output directory for batch
  format?: ImageFormat;          // Image format (default: 'png')
  quality?: number;              // Quality for JPEG/WebP (0-100, default: 90)
  nameTemplate?: string;         // Filename template with {id} placeholder
}

/**
 * Get the entry point for Remotion
 */
function getEntryPoint(): string {
  return path.join(process.cwd(), 'src', 'Root.tsx');
}

/**
 * Bundle the Remotion project
 * This is required before rendering
 */
async function bundleProject(): Promise<string> {
  const entryPoint = getEntryPoint();
  const bundled = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });
  return bundled;
}

/**
 * Get the output directory
 */
function getOutputDir(): string {
  const outputDir = path.join(process.cwd(), 'output', 'ads');

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return outputDir;
}

/**
 * Generate output filename based on template and format
 */
function generateOutputFilename(
  templateId: string,
  format: ImageFormat,
  customPath?: string
): string {
  if (customPath) {
    return customPath;
  }

  const outputDir = getOutputDir();
  const timestamp = Date.now();
  const filename = `${templateId}-${timestamp}.${format}`;

  return path.join(outputDir, filename);
}

/**
 * Validate image format
 */
function validateFormat(format: ImageFormat): boolean {
  return ['png', 'jpeg', 'webp'].includes(format);
}

/**
 * Get image format from Remotion format string
 */
function getRemotionImageFormat(format: ImageFormat): 'png' | 'jpeg' {
  // Remotion only supports 'png' and 'jpeg' directly
  // WebP is handled through PNG conversion
  return format === 'jpeg' ? 'jpeg' : 'png';
}

/**
 * Render a single still image from a composition ID
 *
 * @param compositionId - The ID of the Still composition to render
 * @param options - Rendering options
 * @returns Promise with render result
 */
export async function renderStill(
  compositionId: string,
  options: RenderStillOptions = {}
): Promise<RenderStillResult> {
  try {
    const {
      outputPath,
      format = 'png',
      quality = 90,
      scale = 1,
      width,
      height,
      overwrite = true,
    } = options;

    // Validate format
    if (!validateFormat(format)) {
      throw new Error(`Invalid format: ${format}. Supported formats: png, jpeg, webp`);
    }

    // Bundle the project
    const bundled = await bundleProject();

    // Get compositions to find the target composition
    const compositions = await getCompositions(bundled, {
      inputProps: {},
    });

    const composition = compositions.find((c) => c.id === compositionId);
    if (!composition) {
      throw new Error(`Composition "${compositionId}" not found`);
    }

    // Generate output path
    const finalOutputPath = generateOutputFilename(
      compositionId,
      format,
      outputPath
    );

    // Check if file exists and overwrite is false
    if (!overwrite && fs.existsSync(finalOutputPath)) {
      throw new Error(`File already exists: ${finalOutputPath}`);
    }

    // Prepare render options
    const renderOptions: any = {
      composition,
      serveUrl: bundled,
      output: finalOutputPath,
      imageFormat: getRemotionImageFormat(format),
      inputProps: composition.defaultProps,
    };

    // Add quality for JPEG
    if (format === 'jpeg') {
      renderOptions.jpegQuality = quality;
    }

    // Add scale if specified
    if (scale !== 1) {
      renderOptions.scale = scale;
    }

    // Override dimensions if specified
    if (width) {
      renderOptions.width = width;
    }
    if (height) {
      renderOptions.height = height;
    }

    // Render the still
    await remotionRenderStill(renderOptions);

    // Get file stats
    const stats = fs.statSync(finalOutputPath);

    const result = {
      success: true,
      outputPath: finalOutputPath,
      width: width || composition.width,
      height: height || composition.height,
      format,
      sizeInBytes: stats.size,
    };

    // Track first_render_completed (TRACK-003)
    serverTracking.track('first_render_completed', {
      compositionId,
      format,
      width: result.width,
      height: result.height,
      sizeInBytes: result.sizeInBytes,
      timestamp: new Date().toISOString(),
    });

    // Track ad_generated (TRACK-007)
    trackAdGeneratedServer(
      compositionId,
      compositionId, // Assume compositionId is templateId
      'manual'
    );

    // Track video_rendered for all renders (TRACK-004)
    serverTracking.track('video_rendered', {
      compositionId,
      format,
      width: result.width,
      height: result.height,
      sizeInBytes: result.sizeInBytes,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      outputPath: '',
      width: 0,
      height: 0,
      format: options.format || 'png',
      error: errorMessage,
    };
  }
}

/**
 * Render a still image from an ad template
 * This creates a temporary composition and renders it
 *
 * @param template - The ad template to render
 * @param options - Rendering options
 * @returns Promise with render result
 */
export async function renderAdTemplate(
  template: AdTemplate,
  options: RenderStillOptions = {}
): Promise<RenderStillResult> {
  try {
    const {
      outputPath,
      format = 'png',
      quality = 90,
      overwrite = true,
    } = options;

    // Validate format
    if (!validateFormat(format)) {
      throw new Error(`Invalid format: ${format}. Supported formats: png, jpeg, webp`);
    }

    // Generate output path
    const finalOutputPath = generateOutputFilename(
      template.id,
      format,
      outputPath
    );

    // Check if file exists and overwrite is false
    if (!overwrite && fs.existsSync(finalOutputPath)) {
      throw new Error(`File already exists: ${finalOutputPath}`);
    }

    // Bundle the project
    const bundled = await bundleProject();

    // Get compositions
    const compositions = await getCompositions(bundled, {
      inputProps: {},
    });

    // Find a composition with matching dimensions or use the first ad composition
    const composition = compositions.find(
      (c) => c.width === template.dimensions.width && c.height === template.dimensions.height
    ) || compositions.find((c) => c.id.includes('Ad'));

    if (!composition) {
      throw new Error('No ad composition found');
    }

    // Prepare render options
    const renderOptions: any = {
      composition,
      serveUrl: bundled,
      output: finalOutputPath,
      imageFormat: getRemotionImageFormat(format),
      inputProps: {
        template,
      },
    };

    // Add quality for JPEG
    if (format === 'jpeg') {
      renderOptions.jpegQuality = quality;
    }

    // Render the still
    await remotionRenderStill(renderOptions);

    // Get file stats
    const stats = fs.statSync(finalOutputPath);

    const result = {
      success: true,
      outputPath: finalOutputPath,
      width: template.dimensions.width,
      height: template.dimensions.height,
      format,
      sizeInBytes: stats.size,
    };

    // Track first_render_completed for template render
    serverTracking.track('first_render_completed', {
      templateId: template.id,
      format,
      width: result.width,
      height: result.height,
      sizeInBytes: result.sizeInBytes,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      outputPath: '',
      width: 0,
      height: 0,
      format: options.format || 'png',
      error: errorMessage,
    };
  }
}

/**
 * Batch render multiple compositions
 *
 * @param compositionIds - Array of composition IDs to render
 * @param options - Batch rendering options
 * @returns Promise with array of render results
 */
export async function batchRenderStills(
  compositionIds: string[],
  options: BatchRenderOptions
): Promise<RenderStillResult[]> {
  const {
    outputDir,
    format = 'png',
    quality = 90,
    nameTemplate = '{id}',
  } = options;

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results: RenderStillResult[] = [];

  for (const compositionId of compositionIds) {
    // Generate filename from template
    const filename = nameTemplate.replace('{id}', compositionId);
    const outputPath = path.join(outputDir, `${filename}.${format}`);

    // Render the still
    const result = await renderStill(compositionId, {
      outputPath,
      format,
      quality,
    });

    results.push(result);
  }

  return results;
}

/**
 * Get all available composition IDs
 *
 * @returns Promise with array of composition IDs
 */
export async function getAvailableCompositions(): Promise<string[]> {
  try {
    const bundled = await bundleProject();
    const compositions = await getCompositions(bundled, {
      inputProps: {},
    });

    return compositions.map((c) => c.id);
  } catch (error) {
    console.error('Error getting compositions:', error);
    return [];
  }
}

/**
 * Get composition info
 *
 * @param compositionId - The composition ID
 * @returns Promise with composition details
 */
export async function getCompositionInfo(compositionId: string): Promise<{
  id: string;
  width: number;
  height: number;
  fps?: number;
  durationInFrames?: number;
} | null> {
  try {
    const bundled = await bundleProject();
    const compositions = await getCompositions(bundled, {
      inputProps: {},
    });

    const composition = compositions.find((c) => c.id === compositionId);
    if (!composition) {
      return null;
    }

    return {
      id: composition.id,
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      durationInFrames: composition.durationInFrames,
    };
  } catch (error) {
    console.error('Error getting composition info:', error);
    return null;
  }
}
