/**
 * Locale Export Service
 * APP-004: Export ZIP organized by locale and device type
 *
 * Organizes screenshots by locale and device type for App Store Connect upload.
 * Creates organized directory structure or ZIP archive with manifest.
 */

import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';
import crypto from 'crypto';

import {
  LocaleExportConfig,
  LocaleExportResult,
  ExportManifest,
  ManifestEntry,
  ScreenshotFile,
  ValidationResult,
  ValidationRules,
  OrganizationStrategy,
  AppStoreLocale,
  LocaleMetadata,
  QuickExportOptions,
} from '@/types/localeExport';
import { DeviceType } from '@/types/deviceFrame';

/**
 * Default validation rules per App Store Connect requirements
 */
const DEFAULT_VALIDATION_RULES: ValidationRules = {
  maxScreenshotsPerDevice: 10,
  minScreenshotsPerDevice: 1,
  requireConsistentDevices: false,
  requireSequentialOrder: false,
  allowedFormats: ['png', 'jpg', 'jpeg'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  minDimensions: { width: 640, height: 920 },
};

/**
 * Locale metadata database
 */
const LOCALE_METADATA: Record<AppStoreLocale, LocaleMetadata> = {
  'ar-SA': { locale: 'ar-SA', languageName: 'Arabic', nativeLanguageName: 'العربية', rtl: true, region: 'Saudi Arabia' },
  'ca': { locale: 'ca', languageName: 'Catalan', nativeLanguageName: 'Català', rtl: false },
  'cs': { locale: 'cs', languageName: 'Czech', nativeLanguageName: 'Čeština', rtl: false },
  'da': { locale: 'da', languageName: 'Danish', nativeLanguageName: 'Dansk', rtl: false },
  'de-DE': { locale: 'de-DE', languageName: 'German', nativeLanguageName: 'Deutsch', rtl: false, region: 'Germany' },
  'el': { locale: 'el', languageName: 'Greek', nativeLanguageName: 'Ελληνικά', rtl: false },
  'en-AU': { locale: 'en-AU', languageName: 'English', nativeLanguageName: 'English', rtl: false, region: 'Australia' },
  'en-CA': { locale: 'en-CA', languageName: 'English', nativeLanguageName: 'English', rtl: false, region: 'Canada' },
  'en-GB': { locale: 'en-GB', languageName: 'English', nativeLanguageName: 'English', rtl: false, region: 'United Kingdom' },
  'en-US': { locale: 'en-US', languageName: 'English', nativeLanguageName: 'English', rtl: false, region: 'United States' },
  'es-ES': { locale: 'es-ES', languageName: 'Spanish', nativeLanguageName: 'Español', rtl: false, region: 'Spain' },
  'es-MX': { locale: 'es-MX', languageName: 'Spanish', nativeLanguageName: 'Español', rtl: false, region: 'Mexico' },
  'fi': { locale: 'fi', languageName: 'Finnish', nativeLanguageName: 'Suomi', rtl: false },
  'fr-CA': { locale: 'fr-CA', languageName: 'French', nativeLanguageName: 'Français', rtl: false, region: 'Canada' },
  'fr-FR': { locale: 'fr-FR', languageName: 'French', nativeLanguageName: 'Français', rtl: false, region: 'France' },
  'he': { locale: 'he', languageName: 'Hebrew', nativeLanguageName: 'עברית', rtl: true },
  'hi': { locale: 'hi', languageName: 'Hindi', nativeLanguageName: 'हिन्दी', rtl: false },
  'hr': { locale: 'hr', languageName: 'Croatian', nativeLanguageName: 'Hrvatski', rtl: false },
  'hu': { locale: 'hu', languageName: 'Hungarian', nativeLanguageName: 'Magyar', rtl: false },
  'id': { locale: 'id', languageName: 'Indonesian', nativeLanguageName: 'Indonesia', rtl: false },
  'it': { locale: 'it', languageName: 'Italian', nativeLanguageName: 'Italiano', rtl: false },
  'ja': { locale: 'ja', languageName: 'Japanese', nativeLanguageName: '日本語', rtl: false },
  'ko': { locale: 'ko', languageName: 'Korean', nativeLanguageName: '한국어', rtl: false },
  'ms': { locale: 'ms', languageName: 'Malay', nativeLanguageName: 'Melayu', rtl: false },
  'nl-NL': { locale: 'nl-NL', languageName: 'Dutch', nativeLanguageName: 'Nederlands', rtl: false, region: 'Netherlands' },
  'no': { locale: 'no', languageName: 'Norwegian', nativeLanguageName: 'Norsk', rtl: false },
  'pl': { locale: 'pl', languageName: 'Polish', nativeLanguageName: 'Polski', rtl: false },
  'pt-BR': { locale: 'pt-BR', languageName: 'Portuguese', nativeLanguageName: 'Português', rtl: false, region: 'Brazil' },
  'pt-PT': { locale: 'pt-PT', languageName: 'Portuguese', nativeLanguageName: 'Português', rtl: false, region: 'Portugal' },
  'ro': { locale: 'ro', languageName: 'Romanian', nativeLanguageName: 'Română', rtl: false },
  'ru': { locale: 'ru', languageName: 'Russian', nativeLanguageName: 'Русский', rtl: false },
  'sk': { locale: 'sk', languageName: 'Slovak', nativeLanguageName: 'Slovenčina', rtl: false },
  'sv': { locale: 'sv', languageName: 'Swedish', nativeLanguageName: 'Svenska', rtl: false },
  'th': { locale: 'th', languageName: 'Thai', nativeLanguageName: 'ไทย', rtl: false },
  'tr': { locale: 'tr', languageName: 'Turkish', nativeLanguageName: 'Türkçe', rtl: false },
  'uk': { locale: 'uk', languageName: 'Ukrainian', nativeLanguageName: 'Українська', rtl: false },
  'vi': { locale: 'vi', languageName: 'Vietnamese', nativeLanguageName: 'Tiếng Việt', rtl: false },
  'zh-Hans': { locale: 'zh-Hans', languageName: 'Chinese (Simplified)', nativeLanguageName: '简体中文', rtl: false },
  'zh-Hant': { locale: 'zh-Hant', languageName: 'Chinese (Traditional)', nativeLanguageName: '繁體中文', rtl: false },
};

/**
 * Export screenshots organized by locale and device type
 */
export async function exportLocaleScreenshots(
  config: LocaleExportConfig
): Promise<LocaleExportResult> {
  const startTime = Date.now();

  try {
    // Validate configuration
    if (config.validate !== false) {
      const validation = validateScreenshots(config.screenshots);
      if (!validation.valid && validation.errors.length > 0) {
        return {
          success: false,
          outputPath: config.outputPath,
          totalScreenshots: 0,
          byLocale: {},
          byDeviceType: {},
          fileSize: 0,
          duration: Date.now() - startTime,
          warnings: validation.warnings,
          errors: validation.errors,
        };
      }
    }

    // Determine export format
    const format = config.format || (config.outputPath.endsWith('.zip') ? 'zip' : 'directory');
    const organizationStrategy = config.organizationStrategy || 'locale-first';

    let result: LocaleExportResult;

    if (format === 'zip') {
      result = await exportAsZip(config, organizationStrategy, startTime);
    } else {
      result = await exportAsDirectory(config, organizationStrategy, startTime);
    }

    // Generate manifest if requested
    if (config.includeManifest !== false && result.success) {
      const manifest = await generateManifest(
        config.screenshots,
        organizationStrategy,
        result
      );
      const manifestFormat = config.manifestFormat || 'json';
      const manifestFilename = `manifest.${manifestFormat}`;
      const manifestPath = path.join(
        format === 'zip' ? path.dirname(config.outputPath) : config.outputPath,
        manifestFilename
      );

      if (manifestFormat === 'json') {
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      } else {
        await fs.writeFile(manifestPath, convertManifestToCSV(manifest));
      }

      result.manifestPath = manifestPath;
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      outputPath: config.outputPath,
      totalScreenshots: 0,
      byLocale: {},
      byDeviceType: {},
      fileSize: 0,
      duration: Date.now() - startTime,
      warnings: [],
      errors: [error.message],
    };
  }
}

/**
 * Export as ZIP archive
 */
async function exportAsZip(
  config: LocaleExportConfig,
  strategy: OrganizationStrategy,
  startTime: number
): Promise<LocaleExportResult> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(config.outputPath);
    const archive = archiver('zip', {
      zlib: { level: config.compressionLevel || 6 },
    });

    const byLocale: Record<AppStoreLocale, number> = {};
    const byDeviceType: Record<DeviceType, number> = {};

    output.on('close', () => {
      resolve({
        success: true,
        outputPath: config.outputPath,
        totalScreenshots: config.screenshots.length,
        byLocale,
        byDeviceType,
        fileSize: archive.pointer(),
        duration: Date.now() - startTime,
        warnings: [],
        errors: [],
      });
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add screenshots to archive
    for (const screenshot of config.screenshots) {
      const filePath = getOrganizedPath(screenshot, strategy, config.filenameTemplate);

      // Track statistics
      byLocale[screenshot.locale] = (byLocale[screenshot.locale] || 0) + 1;
      byDeviceType[screenshot.deviceType] = (byDeviceType[screenshot.deviceType] || 0) + 1;

      // Add to archive
      if (typeof screenshot.source === 'string') {
        archive.file(screenshot.source, { name: filePath });
      } else {
        archive.append(screenshot.source, { name: filePath });
      }
    }

    archive.finalize();
  });
}

/**
 * Export as directory structure
 */
async function exportAsDirectory(
  config: LocaleExportConfig,
  strategy: OrganizationStrategy,
  startTime: number
): Promise<LocaleExportResult> {
  const byLocale: Record<AppStoreLocale, number> = {};
  const byDeviceType: Record<DeviceType, number> = {};
  let totalSize = 0;

  // Create output directory
  await fs.mkdir(config.outputPath, { recursive: true });

  // Copy screenshots to organized structure
  for (const screenshot of config.screenshots) {
    const filePath = getOrganizedPath(screenshot, strategy, config.filenameTemplate);
    const fullPath = path.join(config.outputPath, filePath);

    // Create directory
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Copy or write file
    if (typeof screenshot.source === 'string') {
      await fs.copyFile(screenshot.source, fullPath);
      const stats = await fs.stat(fullPath);
      totalSize += stats.size;
    } else {
      await fs.writeFile(fullPath, screenshot.source);
      totalSize += screenshot.source.length;
    }

    // Track statistics
    byLocale[screenshot.locale] = (byLocale[screenshot.locale] || 0) + 1;
    byDeviceType[screenshot.deviceType] = (byDeviceType[screenshot.deviceType] || 0) + 1;
  }

  return {
    success: true,
    outputPath: config.outputPath,
    totalScreenshots: config.screenshots.length,
    byLocale,
    byDeviceType,
    fileSize: totalSize,
    duration: Date.now() - startTime,
    warnings: [],
    errors: [],
  };
}

/**
 * Get organized file path based on strategy
 */
function getOrganizedPath(
  screenshot: ScreenshotFile,
  strategy: OrganizationStrategy,
  filenameTemplate?: string
): string {
  const filename = filenameTemplate
    ? formatFilename(filenameTemplate, screenshot)
    : screenshot.filename;

  switch (strategy) {
    case 'locale-first':
      return path.join(
        screenshot.locale,
        screenshot.deviceType,
        filename
      );

    case 'device-first':
      return path.join(
        screenshot.deviceType,
        screenshot.locale,
        filename
      );

    case 'flat-locale':
      return path.join(screenshot.locale, filename);

    case 'flat-device':
      return path.join(screenshot.deviceType, filename);

    default:
      return filename;
  }
}

/**
 * Format filename using template
 */
function formatFilename(template: string, screenshot: ScreenshotFile): string {
  return template
    .replace('{locale}', screenshot.locale)
    .replace('{deviceType}', screenshot.deviceType)
    .replace('{model}', screenshot.model)
    .replace('{orientation}', screenshot.orientation)
    .replace('{order}', screenshot.displayOrder.toString())
    .replace('{width}', screenshot.size.width.toString())
    .replace('{height}', screenshot.size.height.toString())
    .replace('{filename}', path.parse(screenshot.filename).name)
    .replace('{ext}', path.parse(screenshot.filename).ext);
}

/**
 * Validate screenshots
 */
export function validateScreenshots(
  screenshots: ScreenshotFile[],
  rules: ValidationRules = DEFAULT_VALIDATION_RULES
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Group by locale and device type
  const byLocaleDevice: Record<string, ScreenshotFile[]> = {};

  for (const screenshot of screenshots) {
    const key = `${screenshot.locale}:${screenshot.deviceType}`;
    if (!byLocaleDevice[key]) {
      byLocaleDevice[key] = [];
    }
    byLocaleDevice[key].push(screenshot);
  }

  // Check counts per device
  if (rules.maxScreenshotsPerDevice || rules.minScreenshotsPerDevice) {
    for (const [key, group] of Object.entries(byLocaleDevice)) {
      const count = group.length;

      if (rules.maxScreenshotsPerDevice && count > rules.maxScreenshotsPerDevice) {
        errors.push(`${key}: Too many screenshots (${count}/${rules.maxScreenshotsPerDevice})`);
      }

      if (rules.minScreenshotsPerDevice && count < rules.minScreenshotsPerDevice) {
        warnings.push(`${key}: Too few screenshots (${count}/${rules.minScreenshotsPerDevice})`);
      }
    }
  }

  // Check for duplicate display orders
  const duplicateDisplayOrders: string[] = [];
  for (const [key, group] of Object.entries(byLocaleDevice)) {
    const orders = group.map((s) => s.displayOrder);
    const duplicates = orders.filter((order, index) => orders.indexOf(order) !== index);
    if (duplicates.length > 0) {
      duplicateDisplayOrders.push(`${key}: Duplicate orders ${duplicates.join(', ')}`);
    }
  }

  if (duplicateDisplayOrders.length > 0) {
    warnings.push(...duplicateDisplayOrders);
  }

  // Check sequential order
  if (rules.requireSequentialOrder) {
    for (const [key, group] of Object.entries(byLocaleDevice)) {
      const orders = group.map((s) => s.displayOrder).sort((a, b) => a - b);
      const expected = Array.from({ length: orders.length }, (_, i) => i + 1);
      if (JSON.stringify(orders) !== JSON.stringify(expected)) {
        warnings.push(`${key}: Display orders not sequential (${orders.join(', ')})`);
      }
    }
  }

  // Check dimensions
  if (rules.minDimensions) {
    for (const screenshot of screenshots) {
      if (
        screenshot.size.width < rules.minDimensions.width ||
        screenshot.size.height < rules.minDimensions.height
      ) {
        errors.push(
          `${screenshot.filename}: Dimensions too small (${screenshot.size.width}x${screenshot.size.height})`
        );
      }
    }
  }

  // Collect statistics
  const locales = new Set(screenshots.map((s) => s.locale));
  const deviceTypes = new Set(screenshots.map((s) => s.deviceType));

  // Check for missing device types per locale
  const missingDeviceTypes: string[] = [];
  if (rules.requireConsistentDevices) {
    for (const locale of locales) {
      const localeScreenshots = screenshots.filter((s) => s.locale === locale);
      const localeDeviceTypes = new Set(localeScreenshots.map((s) => s.deviceType));

      for (const deviceType of deviceTypes) {
        if (!localeDeviceTypes.has(deviceType)) {
          missingDeviceTypes.push(`${locale}: Missing ${deviceType}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    statistics: {
      totalScreenshots: screenshots.length,
      localesCount: locales.size,
      deviceTypesCount: deviceTypes.size,
      missingDeviceTypes,
      duplicateDisplayOrders,
    },
  };
}

/**
 * Generate export manifest
 */
async function generateManifest(
  screenshots: ScreenshotFile[],
  strategy: OrganizationStrategy,
  result: LocaleExportResult
): Promise<ExportManifest> {
  const entries: ManifestEntry[] = [];

  for (const screenshot of screenshots) {
    const filePath = getOrganizedPath(screenshot, strategy);

    // Calculate checksum if source is a file path
    let checksum: string | undefined;
    if (typeof screenshot.source === 'string') {
      const buffer = await fs.readFile(screenshot.source);
      checksum = crypto.createHash('md5').update(buffer).digest('hex');
    }

    entries.push({
      locale: screenshot.locale,
      deviceType: screenshot.deviceType,
      model: screenshot.model,
      orientation: screenshot.orientation,
      filename: screenshot.filename,
      filePath,
      displayOrder: screenshot.displayOrder,
      dimensions: {
        width: screenshot.size.width,
        height: screenshot.size.height,
      },
      fileSize: 0, // TODO: Get actual file size
      checksum,
      timestamp: new Date().toISOString(),
    });
  }

  const locales = [...new Set(screenshots.map((s) => s.locale))];
  const deviceTypes = [...new Set(screenshots.map((s) => s.deviceType))];

  const byOrientation: Record<string, number> = {};
  for (const screenshot of screenshots) {
    byOrientation[screenshot.orientation] = (byOrientation[screenshot.orientation] || 0) + 1;
  }

  return {
    metadata: {
      exportDate: new Date().toISOString(),
      totalScreenshots: screenshots.length,
      locales,
      deviceTypes,
      organizationStrategy: strategy,
      version: '1.0.0',
    },
    screenshots: entries,
    statistics: {
      byLocale: result.byLocale,
      byDeviceType: result.byDeviceType,
      byOrientation: byOrientation as Record<'portrait' | 'landscape', number>,
    },
  };
}

/**
 * Convert manifest to CSV format
 */
function convertManifestToCSV(manifest: ExportManifest): string {
  const headers = [
    'locale',
    'deviceType',
    'model',
    'orientation',
    'filename',
    'filePath',
    'displayOrder',
    'width',
    'height',
    'fileSize',
    'checksum',
    'timestamp',
  ];

  const rows = manifest.screenshots.map((entry) => [
    entry.locale,
    entry.deviceType,
    entry.model,
    entry.orientation,
    entry.filename,
    entry.filePath,
    entry.displayOrder,
    entry.dimensions.width,
    entry.dimensions.height,
    entry.fileSize,
    entry.checksum || '',
    entry.timestamp,
  ]);

  return [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
}

/**
 * Get locale metadata
 */
export function getLocaleMetadata(locale: AppStoreLocale): LocaleMetadata {
  return LOCALE_METADATA[locale];
}

/**
 * Get all supported locales
 */
export function getSupportedLocales(): AppStoreLocale[] {
  return Object.keys(LOCALE_METADATA) as AppStoreLocale[];
}

/**
 * Quick export from directory
 */
export async function quickExport(options: QuickExportOptions): Promise<LocaleExportResult> {
  // TODO: Implement directory scanning and auto-detection
  throw new Error('Quick export not yet implemented');
}
