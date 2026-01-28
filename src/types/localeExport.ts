/**
 * Locale-organized Export - Type Definitions
 * APP-004: Export ZIP organized by locale and device type
 *
 * Organizes screenshots by locale and device type for easy App Store Connect upload.
 * Follows Apple's recommended directory structure for localized screenshots.
 */

import { DeviceType, DeviceModel, Orientation } from './deviceFrame';
import { ScreenshotSize } from './screenshotResize';

/**
 * Supported App Store Connect locales
 * Based on Apple's official locale list (January 2026)
 */
export type AppStoreLocale =
  | 'ar-SA'    // Arabic (Saudi Arabia)
  | 'ca'       // Catalan
  | 'cs'       // Czech
  | 'da'       // Danish
  | 'de-DE'    // German
  | 'el'       // Greek
  | 'en-AU'    // English (Australia)
  | 'en-CA'    // English (Canada)
  | 'en-GB'    // English (UK)
  | 'en-US'    // English (US)
  | 'es-ES'    // Spanish (Spain)
  | 'es-MX'    // Spanish (Mexico)
  | 'fi'       // Finnish
  | 'fr-CA'    // French (Canada)
  | 'fr-FR'    // French
  | 'he'       // Hebrew
  | 'hi'       // Hindi
  | 'hr'       // Croatian
  | 'hu'       // Hungarian
  | 'id'       // Indonesian
  | 'it'       // Italian
  | 'ja'       // Japanese
  | 'ko'       // Korean
  | 'ms'       // Malay
  | 'nl-NL'    // Dutch
  | 'no'       // Norwegian
  | 'pl'       // Polish
  | 'pt-BR'    // Portuguese (Brazil)
  | 'pt-PT'    // Portuguese (Portugal)
  | 'ro'       // Romanian
  | 'ru'       // Russian
  | 'sk'       // Slovak
  | 'sv'       // Swedish
  | 'th'       // Thai
  | 'tr'       // Turkish
  | 'uk'       // Ukrainian
  | 'vi'       // Vietnamese
  | 'zh-Hans'  // Chinese (Simplified)
  | 'zh-Hant'; // Chinese (Traditional)

/**
 * Screenshot file with metadata
 */
export interface ScreenshotFile {
  /** Source file path or buffer */
  source: string | Buffer;

  /** Device type */
  deviceType: DeviceType;

  /** Device model */
  model: DeviceModel;

  /** Orientation */
  orientation: Orientation;

  /** Display order (1-10 for App Store) */
  displayOrder: number;

  /** Screenshot size specification */
  size: ScreenshotSize;

  /** Locale */
  locale: AppStoreLocale;

  /** Original filename */
  filename: string;

  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Locale export configuration
 */
export interface LocaleExportConfig {
  /** Screenshots to export */
  screenshots: ScreenshotFile[];

  /** Output directory or zip path */
  outputPath: string;

  /** Export format */
  format?: 'zip' | 'directory';

  /** Directory organization strategy */
  organizationStrategy?: OrganizationStrategy;

  /** Include manifest file */
  includeManifest?: boolean;

  /** Manifest format */
  manifestFormat?: 'json' | 'csv';

  /** Validate before export */
  validate?: boolean;

  /** Compression level (0-9, zip only) */
  compressionLevel?: number;

  /** Filename template */
  filenameTemplate?: string;
}

/**
 * Directory organization strategies
 */
export type OrganizationStrategy =
  | 'locale-first'     // locale/device-type/screenshots
  | 'device-first'     // device-type/locale/screenshots
  | 'flat-locale'      // locale/screenshots (no device subdirs)
  | 'flat-device';     // device-type/screenshots (no locale subdirs)

/**
 * Export result
 */
export interface LocaleExportResult {
  /** Success status */
  success: boolean;

  /** Output path */
  outputPath: string;

  /** Total screenshots exported */
  totalScreenshots: number;

  /** Screenshots by locale */
  byLocale: Record<AppStoreLocale, number>;

  /** Screenshots by device type */
  byDeviceType: Record<DeviceType, number>;

  /** File size (bytes) */
  fileSize: number;

  /** Processing time (ms) */
  duration: number;

  /** Validation warnings */
  warnings: string[];

  /** Errors encountered */
  errors: string[];

  /** Export manifest path (if generated) */
  manifestPath?: string;
}

/**
 * Export manifest entry
 */
export interface ManifestEntry {
  /** Locale */
  locale: AppStoreLocale;

  /** Device type */
  deviceType: DeviceType;

  /** Device model */
  model: DeviceModel;

  /** Orientation */
  orientation: Orientation;

  /** Filename */
  filename: string;

  /** File path (relative to export root) */
  filePath: string;

  /** Display order */
  displayOrder: number;

  /** Dimensions */
  dimensions: {
    width: number;
    height: number;
  };

  /** File size (bytes) */
  fileSize: number;

  /** Checksum (MD5) */
  checksum?: string;

  /** Timestamp */
  timestamp: string;
}

/**
 * Export manifest
 */
export interface ExportManifest {
  /** Export metadata */
  metadata: {
    exportDate: string;
    totalScreenshots: number;
    locales: AppStoreLocale[];
    deviceTypes: DeviceType[];
    organizationStrategy: OrganizationStrategy;
    version: string;
  };

  /** Screenshot entries */
  screenshots: ManifestEntry[];

  /** Export statistics */
  statistics: {
    byLocale: Record<AppStoreLocale, number>;
    byDeviceType: Record<DeviceType, number>;
    byOrientation: Record<Orientation, number>;
  };

  /** Validation results */
  validation?: {
    valid: boolean;
    warnings: string[];
    errors: string[];
  };
}

/**
 * Validation rules for App Store screenshots
 */
export interface ValidationRules {
  /** Maximum screenshots per locale/device */
  maxScreenshotsPerDevice?: number;

  /** Minimum screenshots per locale/device */
  minScreenshotsPerDevice?: number;

  /** Require all locales to have same device types */
  requireConsistentDevices?: boolean;

  /** Require sequential display order (1, 2, 3...) */
  requireSequentialOrder?: boolean;

  /** Allowed file formats */
  allowedFormats?: string[];

  /** Maximum file size (bytes) */
  maxFileSize?: number;

  /** Minimum dimensions */
  minDimensions?: { width: number; height: number };
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is valid */
  valid: boolean;

  /** Errors (blocking issues) */
  errors: string[];

  /** Warnings (non-blocking issues) */
  warnings: string[];

  /** Statistics */
  statistics: {
    totalScreenshots: number;
    localesCount: number;
    deviceTypesCount: number;
    missingDeviceTypes: string[];
    duplicateDisplayOrders: string[];
  };
}

/**
 * Locale metadata
 */
export interface LocaleMetadata {
  /** Locale code */
  locale: AppStoreLocale;

  /** Language name (English) */
  languageName: string;

  /** Native language name */
  nativeLanguageName: string;

  /** Right-to-left language */
  rtl: boolean;

  /** Region */
  region?: string;

  /** Primary markets */
  primaryMarkets?: string[];
}

/**
 * Export options for quick exports
 */
export interface QuickExportOptions {
  /** Source directory containing screenshots */
  sourceDir: string;

  /** Output path */
  outputPath: string;

  /** Auto-detect locales from directory structure */
  autoDetectLocales?: boolean;

  /** Auto-detect device types from filenames or dimensions */
  autoDetectDevices?: boolean;

  /** Default locale if not detected */
  defaultLocale?: AppStoreLocale;

  /** Organization strategy */
  organizationStrategy?: OrganizationStrategy;
}
