/**
 * exportZip Service - ADS-010
 * Download ZIP organized by variant/size with manifest.json
 *
 * This service provides methods to create organized ZIP archives of rendered ad images
 * with proper folder structure and metadata manifests.
 */

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { RenderStillResult } from './renderStill';
import type { AdTemplate } from '../types/adTemplate';
import type { AdSize } from '../config/adSizes';
import { serverTracking } from './trackingServer';

/**
 * ZIP export options
 */
export interface ExportZipOptions {
  /** Output path for the ZIP file */
  outputPath?: string;
  /** Compression level (0-9, default: 9) */
  compressionLevel?: number;
  /** Include manifest.json (default: true) */
  includeManifest?: boolean;
  /** Include metadata in manifest (default: true) */
  includeMetadata?: boolean;
  /** Organize by variant folders (default: true) */
  organizeByVariant?: boolean;
  /** Organize by size folders (default: true) */
  organizeBySize?: boolean;
}

/**
 * File entry in the ZIP
 */
export interface ZipFileEntry {
  /** Source file path */
  sourcePath: string;
  /** Path within the ZIP archive */
  zipPath: string;
  /** Template/variant ID */
  variantId?: string;
  /** Size ID */
  sizeId?: string;
  /** Image dimensions */
  width: number;
  height: number;
  /** File size in bytes */
  sizeInBytes: number;
  /** Image format */
  format: string;
}

/**
 * ZIP manifest structure
 */
export interface ZipManifest {
  /** Export timestamp */
  exportDate: string;
  /** Total number of files */
  totalFiles: number;
  /** Total size in bytes */
  totalSizeBytes: number;
  /** Organization structure */
  organization: {
    byVariant: boolean;
    bySize: boolean;
  };
  /** File entries grouped by variant */
  variants: Record<string, VariantManifest>;
  /** File entries grouped by size */
  sizes: Record<string, SizeManifest>;
  /** All files in flat list */
  files: FileManifest[];
}

/**
 * Variant manifest entry
 */
export interface VariantManifest {
  variantId: string;
  variantName?: string;
  fileCount: number;
  files: FileManifest[];
}

/**
 * Size manifest entry
 */
export interface SizeManifest {
  sizeId: string;
  sizeName?: string;
  width: number;
  height: number;
  fileCount: number;
  files: FileManifest[];
}

/**
 * File manifest entry
 */
export interface FileManifest {
  filename: string;
  path: string;
  variantId?: string;
  sizeId?: string;
  width: number;
  height: number;
  format: string;
  sizeInBytes: number;
}

/**
 * Export result
 */
export interface ExportZipResult {
  success: boolean;
  zipPath: string;
  totalFiles: number;
  totalSizeBytes: number;
  compressionRatio?: number;
  error?: string;
}

/**
 * Create a ZIP archive from rendered still images
 *
 * @param files - Array of file entries to include in the ZIP
 * @param options - Export options
 * @returns Promise with export result
 */
export async function createZipExport(
  files: ZipFileEntry[],
  options: ExportZipOptions = {}
): Promise<ExportZipResult> {
  try {
    const {
      outputPath,
      compressionLevel = 9,
      includeManifest = true,
      includeMetadata = true,
      organizeByVariant = true,
      organizeBySize = true,
    } = options;

    // Validate input
    if (files.length === 0) {
      throw new Error('No files to export');
    }

    // Generate output path
    const finalOutputPath = outputPath || generateZipPath();

    // Ensure output directory exists
    const outputDir = path.dirname(finalOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create write stream
    const output = fs.createWriteStream(finalOutputPath);
    const archive = archiver('zip', {
      zlib: { level: compressionLevel },
    });

    // Track total size
    let totalSizeBytes = 0;

    // Handle errors
    archive.on('error', (err) => {
      throw err;
    });

    // Pipe archive to output
    archive.pipe(output);

    // Add files to archive
    for (const file of files) {
      // Verify source file exists
      if (!fs.existsSync(file.sourcePath)) {
        console.warn(`File not found: ${file.sourcePath}`);
        continue;
      }

      // Add file to archive with organized path
      archive.file(file.sourcePath, { name: file.zipPath });
      totalSizeBytes += file.sizeInBytes;
    }

    // Generate and add manifest
    if (includeManifest) {
      const manifest = generateManifest(files, {
        organizeByVariant,
        organizeBySize,
        includeMetadata,
      });

      const manifestJson = JSON.stringify(manifest, null, 2);
      archive.append(manifestJson, { name: 'manifest.json' });
    }

    // Finalize archive
    await archive.finalize();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', (err) => reject(err));
    });

    // Get final ZIP file size
    const stats = fs.statSync(finalOutputPath);
    const compressionRatio = totalSizeBytes > 0 ? stats.size / totalSizeBytes : 0;

    // Track export_downloaded (TRACK-004)
    serverTracking.track('export_downloaded', {
      exportType: 'zip',
      fileCount: files.length,
      sizeInBytes: stats.size,
      organizationStrategy: organizeByVariant ? 'variant-first' : organizeBySize ? 'size-first' : 'flat',
      includesManifest: includeManifest,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      zipPath: finalOutputPath,
      totalFiles: files.length,
      totalSizeBytes: stats.size,
      compressionRatio,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      zipPath: '',
      totalFiles: 0,
      totalSizeBytes: 0,
      error: errorMessage,
    };
  }
}

/**
 * Export rendered stills as organized ZIP
 *
 * @param results - Array of render results
 * @param options - Export options
 * @returns Promise with export result
 */
export async function exportRenderedStills(
  results: RenderStillResult[],
  options: ExportZipOptions = {}
): Promise<ExportZipResult> {
  // Convert render results to file entries
  const files: ZipFileEntry[] = results
    .filter((r) => r.success && r.outputPath)
    .map((r) => ({
      sourcePath: r.outputPath,
      zipPath: path.basename(r.outputPath),
      width: r.width,
      height: r.height,
      sizeInBytes: r.sizeInBytes || 0,
      format: r.format,
    }));

  return createZipExport(files, options);
}

/**
 * Export campaign pack with organized structure
 * Files are organized by variant and size folders
 *
 * @param campaignResults - Map of variant ID to render results for each size
 * @param options - Export options
 * @returns Promise with export result
 */
export async function exportCampaignPack(
  campaignResults: Map<string, RenderStillResult[]>,
  options: ExportZipOptions = {}
): Promise<ExportZipResult> {
  const files: ZipFileEntry[] = [];

  // Organize files by variant
  for (const [variantId, results] of campaignResults) {
    for (const result of results) {
      if (!result.success || !result.outputPath) continue;

      const filename = path.basename(result.outputPath);
      const sizeId = `${result.width}x${result.height}`;

      let zipPath = filename;
      if (options.organizeByVariant !== false) {
        if (options.organizeBySize !== false) {
          // variant/size/filename.png
          zipPath = path.join(variantId, sizeId, filename);
        } else {
          // variant/filename.png
          zipPath = path.join(variantId, filename);
        }
      } else if (options.organizeBySize !== false) {
        // size/filename.png
        zipPath = path.join(sizeId, filename);
      }

      files.push({
        sourcePath: result.outputPath,
        zipPath,
        variantId,
        sizeId,
        width: result.width,
        height: result.height,
        sizeInBytes: result.sizeInBytes || 0,
        format: result.format,
      });
    }
  }

  return createZipExport(files, options);
}

/**
 * Export batch with size-based organization
 *
 * @param sizeResults - Map of size ID to render results
 * @param options - Export options
 * @returns Promise with export result
 */
export async function exportBatchBySize(
  sizeResults: Map<string, RenderStillResult[]>,
  options: ExportZipOptions = {}
): Promise<ExportZipResult> {
  const files: ZipFileEntry[] = [];

  for (const [sizeId, results] of sizeResults) {
    for (const result of results) {
      if (!result.success || !result.outputPath) continue;

      const filename = path.basename(result.outputPath);
      const zipPath = options.organizeBySize !== false
        ? path.join(sizeId, filename)
        : filename;

      files.push({
        sourcePath: result.outputPath,
        zipPath,
        sizeId,
        width: result.width,
        height: result.height,
        sizeInBytes: result.sizeInBytes || 0,
        format: result.format,
      });
    }
  }

  return createZipExport(files, options);
}

/**
 * Generate output path for ZIP file
 */
function generateZipPath(): string {
  const outputDir = path.join(process.cwd(), 'output', 'exports');

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `export-${timestamp}.zip`;

  return path.join(outputDir, filename);
}

/**
 * Generate manifest for ZIP export
 */
function generateManifest(
  files: ZipFileEntry[],
  options: {
    organizeByVariant: boolean;
    organizeBySize: boolean;
    includeMetadata: boolean;
  }
): ZipManifest {
  // Group files by variant
  const variantGroups: Record<string, ZipFileEntry[]> = {};
  const sizeGroups: Record<string, ZipFileEntry[]> = {};

  for (const file of files) {
    // Group by variant
    if (file.variantId) {
      if (!variantGroups[file.variantId]) {
        variantGroups[file.variantId] = [];
      }
      variantGroups[file.variantId].push(file);
    }

    // Group by size
    if (file.sizeId) {
      if (!sizeGroups[file.sizeId]) {
        sizeGroups[file.sizeId] = [];
      }
      sizeGroups[file.sizeId].push(file);
    }
  }

  // Build variant manifests
  const variants: Record<string, VariantManifest> = {};
  for (const [variantId, variantFiles] of Object.entries(variantGroups)) {
    variants[variantId] = {
      variantId,
      fileCount: variantFiles.length,
      files: variantFiles.map((f) => fileToManifest(f)),
    };
  }

  // Build size manifests
  const sizes: Record<string, SizeManifest> = {};
  for (const [sizeId, sizeFiles] of Object.entries(sizeGroups)) {
    const firstFile = sizeFiles[0];
    sizes[sizeId] = {
      sizeId,
      width: firstFile.width,
      height: firstFile.height,
      fileCount: sizeFiles.length,
      files: sizeFiles.map((f) => fileToManifest(f)),
    };
  }

  // Calculate totals
  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((sum, f) => sum + f.sizeInBytes, 0);

  return {
    exportDate: new Date().toISOString(),
    totalFiles,
    totalSizeBytes,
    organization: {
      byVariant: options.organizeByVariant,
      bySize: options.organizeBySize,
    },
    variants,
    sizes,
    files: files.map((f) => fileToManifest(f)),
  };
}

/**
 * Convert file entry to manifest entry
 */
function fileToManifest(file: ZipFileEntry): FileManifest {
  return {
    filename: path.basename(file.zipPath),
    path: file.zipPath,
    variantId: file.variantId,
    sizeId: file.sizeId,
    width: file.width,
    height: file.height,
    format: file.format,
    sizeInBytes: file.sizeInBytes,
  };
}

/**
 * Extract files from a ZIP archive
 *
 * @param zipPath - Path to ZIP file
 * @param outputDir - Directory to extract to
 * @returns Promise with extraction result
 */
export async function extractZip(
  zipPath: string,
  outputDir: string
): Promise<{ success: boolean; extractedFiles: number; error?: string }> {
  try {
    const extract = require('extract-zip');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extract ZIP
    await extract(zipPath, { dir: outputDir });

    // Count extracted files
    const extractedFiles = countFilesRecursive(outputDir);

    return {
      success: true,
      extractedFiles,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      extractedFiles: 0,
      error: errorMessage,
    };
  }
}

/**
 * Count files in directory recursively
 */
function countFilesRecursive(dir: string): number {
  let count = 0;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      count += countFilesRecursive(fullPath);
    } else {
      count++;
    }
  }

  return count;
}

/**
 * Read manifest from ZIP
 *
 * @param zipPath - Path to ZIP file
 * @returns Promise with manifest or null
 */
export async function readManifestFromZip(
  zipPath: string
): Promise<ZipManifest | null> {
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);

    const manifestEntry = zip.getEntry('manifest.json');
    if (!manifestEntry) {
      return null;
    }

    const manifestContent = manifestEntry.getData().toString('utf8');
    return JSON.parse(manifestContent) as ZipManifest;
  } catch (error) {
    console.error('Error reading manifest:', error);
    return null;
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format compression ratio as percentage
 */
export function formatCompressionRatio(ratio: number): string {
  const percentage = ((1 - ratio) * 100).toFixed(1);
  return `${percentage}%`;
}

/**
 * Create ZIP from entire directory
 * Useful for campaign packs where files are already organized in folders
 *
 * @param sourceDir - Directory to zip
 * @param outputPath - Path for the ZIP file
 * @param compressionLevel - Compression level (0-9, default: 9)
 * @returns Promise with export result
 */
export async function createZipFromDirectory(
  sourceDir: string,
  outputPath: string,
  compressionLevel = 9
): Promise<ExportZipResult> {
  try {
    // Validate source directory
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory does not exist: ${sourceDir}`);
    }

    const stat = fs.statSync(sourceDir);
    if (!stat.isDirectory()) {
      throw new Error(`Source path is not a directory: ${sourceDir}`);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create write stream
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: compressionLevel },
    });

    // Track stats
    let totalFiles = 0;
    let totalSizeBytes = 0;

    // Handle errors
    archive.on('error', (err) => {
      throw err;
    });

    // Pipe archive to output
    archive.pipe(output);

    // Add entire directory to archive
    archive.directory(sourceDir, false);

    // Count files and size
    const countDirStats = (dir: string): void => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const itemStat = fs.statSync(fullPath);

        if (itemStat.isDirectory()) {
          countDirStats(fullPath);
        } else {
          totalFiles++;
          totalSizeBytes += itemStat.size;
        }
      }
    };

    countDirStats(sourceDir);

    // Finalize archive
    await archive.finalize();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', (err) => reject(err));
    });

    // Get final ZIP file size
    const zipStat = fs.statSync(outputPath);
    const compressionRatio = totalSizeBytes > 0 ? zipStat.size / totalSizeBytes : 0;

    return {
      success: true,
      zipPath: outputPath,
      totalFiles,
      totalSizeBytes: zipStat.size,
      compressionRatio,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      zipPath: '',
      totalFiles: 0,
      totalSizeBytes: 0,
      error: errorMessage,
    };
  }
}
