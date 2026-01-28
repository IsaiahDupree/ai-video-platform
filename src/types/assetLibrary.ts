/**
 * APP-005: Asset Library
 * Per-app asset management with version history
 */

import type { AppStoreLocale } from './localeExport';

// ============================================================================
// Asset Types
// ============================================================================

export type AssetType =
  | 'screenshot'      // App Store screenshots
  | 'preview'         // App preview videos
  | 'icon'            // App icons
  | 'logo'            // Logo files
  | 'image'           // General images
  | 'video'           // General videos
  | 'other';          // Other files

export type AssetStatus =
  | 'draft'           // Work in progress
  | 'review'          // Under review
  | 'approved'        // Approved for use
  | 'published'       // Published to App Store Connect
  | 'archived';       // Archived/deprecated

// ============================================================================
// Asset Interface
// ============================================================================

export interface Asset {
  id: string;
  appId: string;                    // App identifier (e.g., bundle ID)
  name: string;                     // Display name
  description?: string;             // Optional description
  type: AssetType;                  // Asset type
  status: AssetStatus;              // Current status

  // File information
  filePath: string;                 // Path to current version
  fileName: string;                 // Original filename
  fileSize: number;                 // File size in bytes
  mimeType: string;                 // MIME type (e.g., 'image/png')
  format: string;                   // File format (e.g., 'png', 'mp4')

  // Dimensions (for images/videos)
  width?: number;
  height?: number;
  duration?: number;                // Video duration in seconds

  // Metadata
  locale?: AppStoreLocale;          // Optional locale (for localized assets)
  deviceType?: string;              // Optional device type (iPhone, iPad, etc.)
  tags?: string[];                  // Tags for organization
  metadata?: Record<string, any>;   // Custom metadata

  // Version tracking
  version: number;                  // Current version number
  versionHistory: AssetVersion[];   // History of all versions

  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy?: string;               // User ID who created
  updatedBy?: string;               // User ID who last updated
}

// ============================================================================
// Asset Version
// ============================================================================

export interface AssetVersion {
  version: number;                  // Version number
  filePath: string;                 // Path to this version
  fileSize: number;                 // File size in bytes
  width?: number;
  height?: number;
  duration?: number;
  checksum: string;                 // MD5 checksum for verification
  changes?: string;                 // Description of changes
  createdAt: string;
  createdBy?: string;
}

// ============================================================================
// App Information
// ============================================================================

export interface AppInfo {
  id: string;                       // App ID (e.g., bundle ID)
  name: string;                     // App name
  bundleId: string;                 // Bundle identifier
  platform: 'ios' | 'macos' | 'tvos' | 'watchos' | 'visionos';
  icon?: string;                    // Path to app icon
  description?: string;             // App description
  metadata?: Record<string, any>;   // Custom metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Search & Filter Criteria
// ============================================================================

export interface AssetSearchCriteria {
  appId?: string;
  type?: AssetType | AssetType[];
  status?: AssetStatus | AssetStatus[];
  locale?: AppStoreLocale | AppStoreLocale[];
  deviceType?: string | string[];
  tags?: string[];                  // Match any of these tags
  search?: string;                  // Text search in name/description
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ============================================================================
// Asset Statistics
// ============================================================================

export interface AssetStatistics {
  totalAssets: number;
  totalSize: number;                // Total size in bytes
  byType: Record<AssetType, number>;
  byStatus: Record<AssetStatus, number>;
  byLocale: Record<string, number>;
  latestAssets: Asset[];            // Most recently updated
}

// ============================================================================
// Upload Configuration
// ============================================================================

export interface AssetUploadConfig {
  appId: string;
  name: string;
  description?: string;
  type: AssetType;
  status?: AssetStatus;
  locale?: AppStoreLocale;
  deviceType?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  overwriteExisting?: boolean;      // If true, replace existing asset with same name
}

// ============================================================================
// Export Configuration
// ============================================================================

export interface AssetExportConfig {
  assets: Asset[];                  // Assets to export
  outputPath: string;               // Output directory or ZIP path
  format: 'directory' | 'zip';
  includeVersionHistory?: boolean;  // Include all versions or just current
  includeMetadata?: boolean;        // Include metadata.json
  organizationStrategy?: 'flat' | 'by-type' | 'by-locale' | 'by-status';
  compression?: number;             // ZIP compression level (0-9)
}

export interface AssetExportResult {
  success: boolean;
  outputPath: string;
  assetCount: number;
  totalSize: number;
  manifest?: AssetExportManifest;
  errors?: string[];
}

export interface AssetExportManifest {
  exportedAt: string;
  assetCount: number;
  totalSize: number;
  apps: Record<string, AppInfo>;
  assets: Asset[];
}

// ============================================================================
// Version Management
// ============================================================================

export interface VersionRollbackConfig {
  assetId: string;
  targetVersion: number;
  createNewVersion?: boolean;       // If true, creates new version from old one
}

// ============================================================================
// Batch Operations
// ============================================================================

export interface BatchUpdateConfig {
  assetIds: string[];
  updates: Partial<Pick<Asset, 'status' | 'tags' | 'metadata' | 'locale' | 'deviceType'>>;
}

export interface BatchDeleteConfig {
  assetIds: string[];
  deleteVersionHistory?: boolean;   // If true, permanently delete all versions
}

// ============================================================================
// Helper Types
// ============================================================================

export interface AssetSummary {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  version: number;
  fileSize: number;
  thumbnailUrl?: string;
  updatedAt: string;
}

// ============================================================================
// Validation Rules
// ============================================================================

export interface AssetValidationRules {
  maxFileSize?: number;             // Max file size in bytes
  allowedFormats?: string[];        // Allowed file formats
  minWidth?: number;                // Min image/video width
  maxWidth?: number;                // Max image/video width
  minHeight?: number;               // Min image/video height
  maxHeight?: number;               // Max image/video height
  maxDuration?: number;             // Max video duration in seconds
}

export interface AssetValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Constants
// ============================================================================

export const ASSET_TYPES: readonly AssetType[] = [
  'screenshot',
  'preview',
  'icon',
  'logo',
  'image',
  'video',
  'other',
] as const;

export const ASSET_STATUSES: readonly AssetStatus[] = [
  'draft',
  'review',
  'approved',
  'published',
  'archived',
] as const;

// Default validation rules for App Store Connect assets
export const DEFAULT_VALIDATION_RULES: Record<AssetType, AssetValidationRules> = {
  screenshot: {
    maxFileSize: 10 * 1024 * 1024,  // 10MB
    allowedFormats: ['png', 'jpg', 'jpeg'],
    minWidth: 640,
    maxWidth: 4096,
    minHeight: 920,
    maxHeight: 4096,
  },
  preview: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedFormats: ['mov', 'mp4'],
    minWidth: 640,
    maxWidth: 1920,
    minHeight: 920,
    maxHeight: 1080,
    maxDuration: 30,                // 30 seconds
  },
  icon: {
    maxFileSize: 1 * 1024 * 1024,   // 1MB
    allowedFormats: ['png'],
    minWidth: 1024,
    maxWidth: 1024,
    minHeight: 1024,
    maxHeight: 1024,
  },
  logo: {
    maxFileSize: 5 * 1024 * 1024,   // 5MB
    allowedFormats: ['png', 'svg', 'jpg', 'jpeg'],
  },
  image: {
    maxFileSize: 20 * 1024 * 1024,  // 20MB
    allowedFormats: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
  },
  video: {
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    allowedFormats: ['mov', 'mp4', 'avi', 'mkv'],
  },
  other: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

export function getAssetTypeName(type: AssetType): string {
  const names: Record<AssetType, string> = {
    screenshot: 'Screenshot',
    preview: 'App Preview',
    icon: 'App Icon',
    logo: 'Logo',
    image: 'Image',
    video: 'Video',
    other: 'Other',
  };
  return names[type];
}

export function getAssetStatusName(status: AssetStatus): string {
  const names: Record<AssetStatus, string> = {
    draft: 'Draft',
    review: 'Under Review',
    approved: 'Approved',
    published: 'Published',
    archived: 'Archived',
  };
  return names[status];
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    // Images
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    // Videos
    'mov': 'video/quicktime',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
  };
  return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
}

export function getFormatFromMimeType(mimeType: string): string {
  const formats: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'video/quicktime': 'mov',
    'video/mp4': 'mp4',
    'video/x-msvideo': 'avi',
    'video/x-matroska': 'mkv',
  };
  return formats[mimeType] || 'unknown';
}
