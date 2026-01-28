/**
 * CSV/Feed Batch Import Service - ADS-012
 * Upload CSV to generate 50-500 creatives from product feed
 *
 * This service allows users to upload CSV files with product data
 * and automatically generate ad creatives for each row using a template.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { AdTemplate } from '../types/adTemplate';
import { getSizeById } from '../config/adSizes';
import { renderStill, renderAdTemplate, ImageFormat } from './renderStill';
import { createZipFromDirectory } from './exportZip';
import { serverTracking } from './trackingServer';

// Feature usage tracking
function trackBatchImportServer(
  importId: string,
  rowCount: number,
  columnCount: number,
  mappedFields: string[],
  previewGenerated: boolean
): void {
  serverTracking.track('batch_import', {
    importId,
    rowCount,
    columnCount,
    mappedFields,
    fieldCount: mappedFields.length,
    previewGenerated,
    timestamp: new Date().toISOString(),
  });
}

/**
 * CSV Import configuration
 */
export interface CSVImportConfig {
  /** Path to CSV file */
  filePath: string;
  /** Template to use for generating ads */
  baseTemplate: AdTemplate;
  /** Column mapping from CSV to template fields */
  columnMapping: ColumnMapping;
  /** Size IDs to generate (if empty, uses template size) */
  sizeIds?: string[];
  /** Output configuration */
  output: {
    format: ImageFormat;
    quality?: number;
    directory?: string;
    fileNamingTemplate?: string;
    includeManifest?: boolean;
    createZip?: boolean;
  };
  /** Processing options */
  options?: {
    /** Skip rows with missing required fields */
    skipInvalidRows?: boolean;
    /** Maximum number of rows to process */
    maxRows?: number;
    /** Skip header row */
    skipHeader?: boolean;
  };
}

/**
 * Column mapping from CSV to template fields
 */
export interface ColumnMapping {
  /** Map to headline field */
  headline?: string | number;
  /** Map to subheadline field */
  subheadline?: string | number;
  /** Map to body text field */
  body?: string | number;
  /** Map to CTA text field */
  cta?: string | number;
  /** Map to background image URL/path */
  backgroundImage?: string | number;
  /** Map to product image URL/path */
  productImage?: string | number;
  /** Map to logo URL/path */
  logo?: string | number;
  /** Map to background color */
  backgroundColor?: string | number;
  /** Map to primary color */
  primaryColor?: string | number;
  /** Map to unique ID/SKU field */
  uniqueId?: string | number;
  /** Custom field mappings */
  custom?: Record<string, string | number>;
}

/**
 * CSV Row data
 */
export interface CSVRow {
  [key: string]: string;
}

/**
 * Batch import job
 */
export interface CSVImportJob {
  id: string;
  config: CSVImportConfig;
  assets: CSVImportAsset[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  totalCount: number;
  startedAt?: string;
  completedAt?: string;
  outputDir?: string;
  zipFilePath?: string;
  error?: string;
}

/**
 * Individual asset from CSV import
 */
export interface CSVImportAsset {
  id: string;
  rowIndex: number;
  rowData: CSVRow;
  sizeId: string;
  sizeName: string;
  width: number;
  height: number;
  filePath: string;
  status: 'pending' | 'rendering' | 'completed' | 'failed' | 'skipped';
  error?: string;
  fileSizeBytes?: number;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Import manifest
 */
export interface CSVImportManifest {
  job: {
    id: string;
    generatedAt: string;
    totalAssets: number;
    completedAssets: number;
    failedAssets: number;
    skippedAssets: number;
  };
  config: {
    templateName: string;
    format: ImageFormat;
    sizes: Array<{
      id: string;
      name: string;
      width: number;
      height: number;
    }>;
    columnMapping: ColumnMapping;
  };
  assets: Array<{
    rowIndex: number;
    sizeId: string;
    sizeName: string;
    width: number;
    height: number;
    filePath: string;
    fileSizeBytes?: number;
    uniqueId?: string;
  }>;
  stats: {
    totalSizeBytes: number;
    generationTimeMs: number;
  };
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Parse CSV file
 */
export function parseCSVFile(filePath: string, skipHeader: boolean = true): CSVRow[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true, // Use first row as headers
    skip_empty_lines: true,
    trim: true,
    relaxColumnCount: true, // Allow rows with different column counts
  });

  return records as CSVRow[];
}

/**
 * Validate CSV import configuration
 */
export function validateCSVImportConfig(config: CSVImportConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate file path
  if (!config.filePath) {
    errors.push('CSV file path is required');
  } else if (!fs.existsSync(config.filePath)) {
    errors.push(`CSV file not found: ${config.filePath}`);
  }

  // Validate template
  if (!config.baseTemplate) {
    errors.push('Base template is required');
  }

  // Validate column mapping
  if (!config.columnMapping) {
    errors.push('Column mapping is required');
  } else {
    const hasMapping = Object.values(config.columnMapping).some(
      (value) => value !== undefined && value !== null
    );
    if (!hasMapping) {
      warnings.push('No column mappings defined - ads will use template defaults');
    }
  }

  // Validate output format
  if (!config.output.format) {
    errors.push('Output format is required');
  } else if (!['png', 'jpeg', 'webp'].includes(config.output.format)) {
    errors.push(`Invalid output format: ${config.output.format}`);
  }

  // Validate sizes
  if (config.sizeIds && config.sizeIds.length > 0) {
    for (const sizeId of config.sizeIds) {
      const size = getSizeById(sizeId);
      if (!size) {
        errors.push(`Invalid size ID: ${sizeId}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate CSV row data
 */
function validateCSVRow(
  row: CSVRow,
  mapping: ColumnMapping,
  rowIndex: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if mapped columns exist in the row (only warn, don't error)
  for (const [field, column] of Object.entries(mapping)) {
    if (column !== undefined && column !== null) {
      const columnKey = typeof column === 'number' ? Object.keys(row)[column] : column;
      if (columnKey && !(columnKey in row)) {
        warnings.push(`Row ${rowIndex}: Mapped column "${columnKey}" not found, will use template default`);
      }
    }
  }

  // Check if row is completely empty
  const hasData = Object.values(row).some((value) => value && value.trim() !== '');
  if (!hasData) {
    warnings.push(`Row ${rowIndex}: Empty row`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Apply column mapping to create template variant
 */
function applyColumnMapping(
  baseTemplate: AdTemplate,
  row: CSVRow,
  mapping: ColumnMapping,
  rowIndex: number,
  sizeId: string
): AdTemplate {
  const size = getSizeById(sizeId);
  if (!size) {
    throw new Error(`Size ${sizeId} not found`);
  }

  // Helper to get value from row by column mapping
  const getValue = (columnRef: string | number | undefined): string | undefined => {
    if (columnRef === undefined || columnRef === null) return undefined;

    const columnKey = typeof columnRef === 'number'
      ? Object.keys(row)[columnRef]
      : columnRef;

    return columnKey && columnKey in row ? row[columnKey] : undefined;
  };

  // Create variant template
  const template: AdTemplate = {
    ...baseTemplate,
    id: `csv-import-${rowIndex}-${sizeId}`,
    name: `CSV Import Row ${rowIndex} - ${size.name}`,
    dimensions: {
      width: size.width,
      height: size.height,
      name: size.name,
      platform: size.platform,
    },
    content: {
      ...baseTemplate.content,
      // Apply mappings
      headline: getValue(mapping.headline) || baseTemplate.content.headline,
      subheadline: getValue(mapping.subheadline) || baseTemplate.content.subheadline,
      body: getValue(mapping.body) || baseTemplate.content.body,
      cta: getValue(mapping.cta) || baseTemplate.content.cta,
      backgroundImage: getValue(mapping.backgroundImage) || baseTemplate.content.backgroundImage,
      productImage: getValue(mapping.productImage) || baseTemplate.content.productImage,
      logo: getValue(mapping.logo) || baseTemplate.content.logo,
      backgroundColor: getValue(mapping.backgroundColor) || baseTemplate.content.backgroundColor,
    },
    style: {
      ...baseTemplate.style,
      // Apply color mappings if present
      primaryColor: getValue(mapping.primaryColor) || baseTemplate.style.primaryColor,
    },
  };

  return template;
}

/**
 * Generate filename for CSV import asset
 */
function generateAssetFilename(
  row: CSVRow,
  rowIndex: number,
  sizeId: string,
  template: string,
  format: ImageFormat,
  mapping: ColumnMapping
): string {
  const size = getSizeById(sizeId);

  // Get unique ID if mapped
  let uniqueId = rowIndex.toString();
  if (mapping.uniqueId !== undefined) {
    const columnKey = typeof mapping.uniqueId === 'number'
      ? Object.keys(row)[mapping.uniqueId]
      : mapping.uniqueId;
    if (columnKey && columnKey in row && row[columnKey]) {
      uniqueId = row[columnKey].replace(/[^a-zA-Z0-9-_]/g, '_');
    }
  }

  // Replace template variables
  const filename = template
    .replace('{rowIndex}', rowIndex.toString())
    .replace('{uniqueId}', uniqueId)
    .replace('{sizeId}', sizeId)
    .replace('{sizeName}', size?.name.replace(/[^a-zA-Z0-9-_]/g, '_') || sizeId)
    .replace('{width}', size?.width.toString() || '')
    .replace('{height}', size?.height.toString() || '')
    .replace('{timestamp}', Date.now().toString());

  return `${filename}.${format}`;
}

/**
 * Import and generate ads from CSV
 */
export async function importFromCSV(
  config: CSVImportConfig
): Promise<CSVImportJob> {
  // Validate config
  const validation = validateCSVImportConfig(config);
  if (!validation.valid) {
    throw new Error(`CSV import validation failed: ${validation.errors.join(', ')}`);
  }

  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn('CSV import warnings:', validation.warnings);
  }

  // Parse CSV
  const rows = parseCSVFile(config.filePath, config.options?.skipHeader !== false);

  // Apply max rows limit
  const maxRows = config.options?.maxRows || rows.length;
  const limitedRows = rows.slice(0, maxRows);

  // Determine sizes to generate
  const sizeIds = config.sizeIds && config.sizeIds.length > 0
    ? config.sizeIds
    : [config.baseTemplate.dimensions.width + 'x' + config.baseTemplate.dimensions.height];

  // Create output directory
  const baseOutputDir = config.output.directory || path.join(process.cwd(), 'output', 'csv-imports');
  const jobId = `csv-import-${Date.now()}`;
  const outputDir = path.join(baseOutputDir, jobId);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Track batch import (TRACK-007)
  const mappedFields = Object.keys(config.columnMapping).filter(
    key => config.columnMapping[key as keyof ColumnMapping] !== undefined
  );
  trackBatchImportServer(
    jobId,
    limitedRows.length,
    rows.length > 0 ? Object.keys(rows[0]).length : 0,
    mappedFields,
    false // Will be updated later when previews are generated
  );

  // Initialize job
  const job: CSVImportJob = {
    id: jobId,
    config,
    assets: [],
    status: 'pending',
    progress: 0,
    completedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    totalCount: limitedRows.length * sizeIds.length,
    startedAt: new Date().toISOString(),
    outputDir,
  };

  // Generate asset definitions
  const assets: CSVImportAsset[] = [];
  for (let i = 0; i < limitedRows.length; i++) {
    const row = limitedRows[i];
    const rowIndex = i + 1;

    // Validate row
    const rowValidation = validateCSVRow(row, config.columnMapping, rowIndex);

    if (!rowValidation.valid) {
      if (config.options?.skipInvalidRows) {
        console.warn(`Skipping invalid row ${rowIndex}:`, rowValidation.errors);
        job.skippedCount += sizeIds.length;
        continue;
      } else {
        throw new Error(`Row ${rowIndex} validation failed: ${rowValidation.errors.join(', ')}`);
      }
    }

    // Create assets for each size
    for (const sizeId of sizeIds) {
      const size = getSizeById(sizeId);
      if (!size) {
        console.warn(`Size ${sizeId} not found, skipping`);
        job.skippedCount++;
        continue;
      }

      const asset: CSVImportAsset = {
        id: `asset-${rowIndex}-${sizeId}`,
        rowIndex,
        rowData: row,
        sizeId,
        sizeName: size.name,
        width: size.width,
        height: size.height,
        filePath: '',
        status: 'pending',
      };

      assets.push(asset);
    }
  }

  job.assets = assets;
  job.status = 'in-progress';

  // Render each asset
  const startTime = Date.now();
  const fileNamingTemplate = config.output.fileNamingTemplate || '{uniqueId}_{sizeName}';

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    asset.status = 'rendering';
    asset.startedAt = new Date().toISOString();

    try {
      // Create template variant for this row
      const template = applyColumnMapping(
        config.baseTemplate,
        asset.rowData,
        config.columnMapping,
        asset.rowIndex,
        asset.sizeId
      );

      // Generate filename
      const filename = generateAssetFilename(
        asset.rowData,
        asset.rowIndex,
        asset.sizeId,
        fileNamingTemplate,
        config.output.format,
        config.columnMapping
      );

      const outputPath = path.join(outputDir, filename);

      // Render the asset using the dynamic template
      const result = await renderAdTemplate(template, {
        outputPath,
        format: config.output.format,
        quality: config.output.quality,
      });

      if (result.success) {
        asset.status = 'completed';
        asset.filePath = filename;
        asset.fileSizeBytes = result.sizeInBytes;
        job.completedCount++;
      } else {
        asset.status = 'failed';
        asset.error = result.error || 'Unknown error';
        job.failedCount++;
      }
    } catch (error) {
      asset.status = 'failed';
      asset.error = error instanceof Error ? error.message : String(error);
      job.failedCount++;
    }

    asset.completedAt = new Date().toISOString();
    job.progress = Math.round(((i + 1) / assets.length) * 100);
  }

  // Generate manifest if requested
  if (config.output.includeManifest) {
    const manifest = generateCSVImportManifest(job, startTime);
    const manifestPath = path.join(outputDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  // Create ZIP if requested
  if (config.output.createZip) {
    const zipPath = path.join(baseOutputDir, `${jobId}.zip`);
    await createZipFromDirectory(outputDir, zipPath);
    job.zipFilePath = zipPath;
  }

  // Update job status
  job.status = job.failedCount === 0 ? 'completed' : 'failed';
  job.completedAt = new Date().toISOString();

  return job;
}

/**
 * Generate manifest for CSV import
 */
function generateCSVImportManifest(
  job: CSVImportJob,
  startTime: number
): CSVImportManifest {
  const completedAssets = job.assets.filter((a) => a.status === 'completed');
  const totalSizeBytes = completedAssets.reduce(
    (sum, a) => sum + (a.fileSizeBytes || 0),
    0
  );

  // Get unique sizes
  const uniqueSizes = Array.from(
    new Set(completedAssets.map((a) => a.sizeId))
  ).map((sizeId) => {
    const size = getSizeById(sizeId);
    return {
      id: sizeId,
      name: size?.name || sizeId,
      width: size?.width || 0,
      height: size?.height || 0,
    };
  });

  return {
    job: {
      id: job.id,
      generatedAt: new Date().toISOString(),
      totalAssets: job.assets.length,
      completedAssets: job.completedCount,
      failedAssets: job.failedCount,
      skippedAssets: job.skippedCount,
    },
    config: {
      templateName: job.config.baseTemplate.name,
      format: job.config.output.format,
      sizes: uniqueSizes,
      columnMapping: job.config.columnMapping,
    },
    assets: completedAssets.map((a) => {
      // Get unique ID from row if mapped
      let uniqueId: string | undefined;
      if (job.config.columnMapping.uniqueId !== undefined) {
        const columnKey = typeof job.config.columnMapping.uniqueId === 'number'
          ? Object.keys(a.rowData)[job.config.columnMapping.uniqueId]
          : job.config.columnMapping.uniqueId;
        if (columnKey && columnKey in a.rowData) {
          uniqueId = a.rowData[columnKey];
        }
      }

      return {
        rowIndex: a.rowIndex,
        sizeId: a.sizeId,
        sizeName: a.sizeName,
        width: a.width,
        height: a.height,
        filePath: a.filePath,
        fileSizeBytes: a.fileSizeBytes,
        uniqueId,
      };
    }),
    stats: {
      totalSizeBytes,
      generationTimeMs: Date.now() - startTime,
    },
  };
}

/**
 * Preview CSV import (render first N rows)
 */
export async function previewCSVImport(
  config: CSVImportConfig,
  previewCount: number = 3
): Promise<CSVImportAsset[]> {
  const validation = validateCSVImportConfig(config);
  if (!validation.valid) {
    throw new Error(`CSV import validation failed: ${validation.errors.join(', ')}`);
  }

  const rows = parseCSVFile(config.filePath, config.options?.skipHeader !== false);
  const previewRows = rows.slice(0, previewCount);

  const sizeIds = config.sizeIds && config.sizeIds.length > 0
    ? [config.sizeIds[0]] // Just use first size for preview
    : [config.baseTemplate.dimensions.width + 'x' + config.baseTemplate.dimensions.height];

  const baseOutputDir = config.output.directory || path.join(process.cwd(), 'output', 'csv-imports', 'previews');
  const previewDir = path.join(baseOutputDir, `preview-${Date.now()}`);

  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
  }

  const previewAssets: CSVImportAsset[] = [];

  for (let i = 0; i < previewRows.length; i++) {
    const row = previewRows[i];
    const rowIndex = i + 1;
    const sizeId = sizeIds[0];
    const size = getSizeById(sizeId);

    if (!size) continue;

    const asset: CSVImportAsset = {
      id: `preview-${rowIndex}-${sizeId}`,
      rowIndex,
      rowData: row,
      sizeId,
      sizeName: size.name,
      width: size.width,
      height: size.height,
      filePath: '',
      status: 'pending',
    };

    try {
      const template = applyColumnMapping(
        config.baseTemplate,
        row,
        config.columnMapping,
        rowIndex,
        sizeId
      );

      const outputPath = path.join(previewDir, `preview-row-${rowIndex}.${config.output.format}`);

      asset.status = 'rendering';
      const result = await renderAdTemplate(template, {
        outputPath,
        format: config.output.format,
        quality: config.output.quality,
      });

      if (result.success) {
        asset.status = 'completed';
        asset.filePath = path.relative(previewDir, outputPath);
        asset.fileSizeBytes = result.sizeInBytes;
      } else {
        asset.status = 'failed';
        asset.error = result.error;
      }
    } catch (error) {
      asset.status = 'failed';
      asset.error = error instanceof Error ? error.message : String(error);
    }

    previewAssets.push(asset);
  }

  return previewAssets;
}

/**
 * Get CSV headers for column mapping
 */
export function getCSVHeaders(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');

  if (lines.length === 0) {
    return [];
  }

  // Parse first line as headers
  const headers = parse(lines[0], {
    columns: false,
    skip_empty_lines: true,
    trim: true,
  });

  return headers[0] || [];
}

/**
 * Estimate CSV import job
 */
export function estimateCSVImport(config: CSVImportConfig): {
  totalRows: number;
  totalAssets: number;
  estimatedTimeSeconds: number;
  estimatedSizeBytes: number;
} {
  const rows = parseCSVFile(config.filePath, config.options?.skipHeader !== false);
  const maxRows = config.options?.maxRows || rows.length;
  const totalRows = Math.min(rows.length, maxRows);

  const sizeCount = config.sizeIds && config.sizeIds.length > 0
    ? config.sizeIds.length
    : 1;

  const totalAssets = totalRows * sizeCount;

  // Estimate ~2 seconds per asset for rendering
  const estimatedTimeSeconds = totalAssets * 2;

  // Estimate file size based on format
  const avgWidth = 1080;
  const avgHeight = 1080;
  const bytesPerPixel = config.output.format === 'png' ? 4 : 0.5;
  const avgAssetSize = avgWidth * avgHeight * bytesPerPixel;
  const estimatedSizeBytes = totalAssets * avgAssetSize;

  return {
    totalRows,
    totalAssets,
    estimatedTimeSeconds,
    estimatedSizeBytes,
  };
}
