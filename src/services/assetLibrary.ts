/**
 * APP-005: Asset Library Service
 * Per-app asset management with version history
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import archiver from 'archiver';
import { createWriteStream, createReadStream } from 'fs';
import type {
  Asset,
  AssetVersion,
  AppInfo,
  AssetSearchCriteria,
  AssetStatistics,
  AssetUploadConfig,
  AssetExportConfig,
  AssetExportResult,
  AssetExportManifest,
  VersionRollbackConfig,
  BatchUpdateConfig,
  BatchDeleteConfig,
  AssetValidationRules,
  AssetValidationResult,
  AssetType,
  AssetStatus,
  AssetSummary,
} from '@/types/assetLibrary';
import { DEFAULT_VALIDATION_RULES, getMimeType, getFormatFromMimeType } from '@/types/assetLibrary';

// ============================================================================
// Configuration
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'data', 'asset-library');
const ASSETS_DIR = path.join(DATA_DIR, 'assets');
const APPS_DIR = path.join(DATA_DIR, 'apps');
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');

// ============================================================================
// Asset Library Manager
// ============================================================================

export class AssetLibraryManager {
  /**
   * Initialize the asset library (create directories)
   */
  async initialize(): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(ASSETS_DIR, { recursive: true });
    await fs.mkdir(APPS_DIR, { recursive: true });
    await fs.mkdir(VERSIONS_DIR, { recursive: true });
  }

  // ==========================================================================
  // App Management
  // ==========================================================================

  /**
   * Create a new app
   */
  async createApp(app: Omit<AppInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppInfo> {
    await this.initialize();

    const appInfo: AppInfo = {
      id: this.generateId(),
      ...app,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const appPath = path.join(APPS_DIR, `${appInfo.id}.json`);
    await fs.writeFile(appPath, JSON.stringify(appInfo, null, 2));

    return appInfo;
  }

  /**
   * Get app by ID
   */
  async getApp(id: string): Promise<AppInfo | null> {
    try {
      const appPath = path.join(APPS_DIR, `${id}.json`);
      const data = await fs.readFile(appPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update app
   */
  async updateApp(id: string, updates: Partial<Omit<AppInfo, 'id' | 'createdAt'>>): Promise<AppInfo | null> {
    const app = await this.getApp(id);
    if (!app) return null;

    const updatedApp: AppInfo = {
      ...app,
      ...updates,
      id: app.id,
      createdAt: app.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const appPath = path.join(APPS_DIR, `${id}.json`);
    await fs.writeFile(appPath, JSON.stringify(updatedApp, null, 2));

    return updatedApp;
  }

  /**
   * Delete app (and optionally all its assets)
   */
  async deleteApp(id: string, deleteAssets: boolean = false): Promise<boolean> {
    try {
      if (deleteAssets) {
        const assets = await this.searchAssets({ appId: id });
        for (const asset of assets) {
          await this.deleteAsset(asset.id, true);
        }
      }

      const appPath = path.join(APPS_DIR, `${id}.json`);
      await fs.unlink(appPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all apps
   */
  async listApps(): Promise<AppInfo[]> {
    await this.initialize();
    const files = await fs.readdir(APPS_DIR);
    const apps: AppInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(APPS_DIR, file), 'utf-8');
        apps.push(JSON.parse(data));
      }
    }

    return apps.sort((a, b) => a.name.localeCompare(b.name));
  }

  // ==========================================================================
  // Asset Management
  // ==========================================================================

  /**
   * Upload a new asset
   */
  async uploadAsset(
    sourceFilePath: string,
    config: AssetUploadConfig,
    createdBy?: string
  ): Promise<Asset> {
    await this.initialize();

    // Validate the app exists
    const app = await this.getApp(config.appId);
    if (!app) {
      throw new Error(`App not found: ${config.appId}`);
    }

    // Get file info
    const stats = await fs.stat(sourceFilePath);
    const fileName = path.basename(sourceFilePath);
    const format = path.extname(fileName).slice(1).toLowerCase();
    const mimeType = getMimeType(format);

    // Validate the asset
    const validation = await this.validateAsset(sourceFilePath, config.type);
    if (!validation.valid) {
      throw new Error(`Asset validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if asset with same name exists
    if (config.overwriteExisting) {
      const existing = await this.searchAssets({
        appId: config.appId,
        search: config.name,
      });
      const match = existing.find((a) => a.name === config.name);
      if (match) {
        return this.uploadNewVersion(match.id, sourceFilePath, 'New version uploaded', createdBy);
      }
    }

    // Create asset
    const assetId = this.generateId();
    const storagePath = path.join(ASSETS_DIR, config.appId, assetId);
    await fs.mkdir(storagePath, { recursive: true });

    const assetFilePath = path.join(storagePath, `v1${path.extname(fileName)}`);
    await fs.copyFile(sourceFilePath, assetFilePath);

    // Get dimensions if image
    const dimensions = await this.getFileDimensions(assetFilePath, mimeType);

    // Calculate checksum
    const checksum = await this.calculateChecksum(assetFilePath);

    // Create asset record
    const asset: Asset = {
      id: assetId,
      appId: config.appId,
      name: config.name,
      description: config.description,
      type: config.type,
      status: config.status || 'draft',
      filePath: assetFilePath,
      fileName,
      fileSize: stats.size,
      mimeType,
      format,
      width: dimensions?.width,
      height: dimensions?.height,
      duration: dimensions?.duration,
      locale: config.locale,
      deviceType: config.deviceType,
      tags: config.tags || [],
      metadata: config.metadata || {},
      version: 1,
      versionHistory: [
        {
          version: 1,
          filePath: assetFilePath,
          fileSize: stats.size,
          width: dimensions?.width,
          height: dimensions?.height,
          duration: dimensions?.duration,
          checksum,
          changes: 'Initial upload',
          createdAt: new Date().toISOString(),
          createdBy,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      updatedBy: createdBy,
    };

    // Save asset metadata
    const assetMetaPath = path.join(storagePath, 'asset.json');
    await fs.writeFile(assetMetaPath, JSON.stringify(asset, null, 2));

    return asset;
  }

  /**
   * Get asset by ID
   */
  async getAsset(id: string): Promise<Asset | null> {
    try {
      // Find the asset in any app directory
      const apps = await this.listApps();
      for (const app of apps) {
        const assetPath = path.join(ASSETS_DIR, app.id, id, 'asset.json');
        try {
          const data = await fs.readFile(assetPath, 'utf-8');
          return JSON.parse(data);
        } catch {
          continue;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update asset metadata
   */
  async updateAsset(
    id: string,
    updates: Partial<Pick<Asset, 'name' | 'description' | 'status' | 'tags' | 'metadata' | 'locale' | 'deviceType'>>,
    updatedBy?: string
  ): Promise<Asset | null> {
    const asset = await this.getAsset(id);
    if (!asset) return null;

    const updatedAsset: Asset = {
      ...asset,
      ...updates,
      id: asset.id,
      appId: asset.appId,
      version: asset.version,
      versionHistory: asset.versionHistory,
      createdAt: asset.createdAt,
      createdBy: asset.createdBy,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    const storagePath = path.join(ASSETS_DIR, asset.appId, id);
    const assetMetaPath = path.join(storagePath, 'asset.json');
    await fs.writeFile(assetMetaPath, JSON.stringify(updatedAsset, null, 2));

    return updatedAsset;
  }

  /**
   * Delete asset
   */
  async deleteAsset(id: string, deleteAllVersions: boolean = false): Promise<boolean> {
    try {
      const asset = await this.getAsset(id);
      if (!asset) return false;

      const storagePath = path.join(ASSETS_DIR, asset.appId, id);

      if (deleteAllVersions) {
        // Delete entire directory
        await fs.rm(storagePath, { recursive: true, force: true });
      } else {
        // Just delete the asset metadata (keep files for recovery)
        const assetMetaPath = path.join(storagePath, 'asset.json');
        await fs.unlink(assetMetaPath);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Search assets with criteria
   */
  async searchAssets(criteria: AssetSearchCriteria = {}): Promise<Asset[]> {
    await this.initialize();
    const assets: Asset[] = [];

    // Get all apps or specific app
    const apps = criteria.appId
      ? [await this.getApp(criteria.appId)].filter(Boolean) as AppInfo[]
      : await this.listApps();

    // Read all assets
    for (const app of apps) {
      const appAssetsDir = path.join(ASSETS_DIR, app.id);
      try {
        const assetDirs = await fs.readdir(appAssetsDir);
        for (const assetDir of assetDirs) {
          const assetPath = path.join(appAssetsDir, assetDir, 'asset.json');
          try {
            const data = await fs.readFile(assetPath, 'utf-8');
            const asset: Asset = JSON.parse(data);
            assets.push(asset);
          } catch {
            continue;
          }
        }
      } catch {
        continue;
      }
    }

    // Apply filters
    let filtered = assets;

    if (criteria.type) {
      const types = Array.isArray(criteria.type) ? criteria.type : [criteria.type];
      filtered = filtered.filter((a) => types.includes(a.type));
    }

    if (criteria.status) {
      const statuses = Array.isArray(criteria.status) ? criteria.status : [criteria.status];
      filtered = filtered.filter((a) => statuses.includes(a.status));
    }

    if (criteria.locale) {
      const locales = Array.isArray(criteria.locale) ? criteria.locale : [criteria.locale];
      filtered = filtered.filter((a) => a.locale && locales.includes(a.locale));
    }

    if (criteria.deviceType) {
      const deviceTypes = Array.isArray(criteria.deviceType) ? criteria.deviceType : [criteria.deviceType];
      filtered = filtered.filter((a) => a.deviceType && deviceTypes.includes(a.deviceType));
    }

    if (criteria.tags && criteria.tags.length > 0) {
      filtered = filtered.filter((a) =>
        criteria.tags!.some((tag) => a.tags?.includes(tag))
      );
    }

    if (criteria.search) {
      const search = criteria.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(search) ||
          a.description?.toLowerCase().includes(search)
      );
    }

    if (criteria.createdAfter) {
      filtered = filtered.filter((a) => a.createdAt >= criteria.createdAfter!);
    }

    if (criteria.createdBefore) {
      filtered = filtered.filter((a) => a.createdAt <= criteria.createdBefore!);
    }

    // Sort
    const sortBy = criteria.sortBy || 'updatedAt';
    const sortOrder = criteria.sortOrder || 'desc';
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = a.createdAt.localeCompare(b.createdAt);
          break;
        case 'updatedAt':
          comparison = a.updatedAt.localeCompare(b.updatedAt);
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    if (criteria.offset !== undefined || criteria.limit !== undefined) {
      const offset = criteria.offset || 0;
      const limit = criteria.limit || filtered.length;
      filtered = filtered.slice(offset, offset + limit);
    }

    return filtered;
  }

  // ==========================================================================
  // Version Management
  // ==========================================================================

  /**
   * Upload a new version of an existing asset
   */
  async uploadNewVersion(
    assetId: string,
    sourceFilePath: string,
    changes?: string,
    updatedBy?: string
  ): Promise<Asset> {
    const asset = await this.getAsset(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    const stats = await fs.stat(sourceFilePath);
    const format = path.extname(sourceFilePath).slice(1).toLowerCase();
    const mimeType = getMimeType(format);

    // Validate the new version
    const validation = await this.validateAsset(sourceFilePath, asset.type);
    if (!validation.valid) {
      throw new Error(`Asset validation failed: ${validation.errors.join(', ')}`);
    }

    // Get dimensions if image
    const dimensions = await this.getFileDimensions(sourceFilePath, mimeType);

    // Calculate checksum
    const checksum = await this.calculateChecksum(sourceFilePath);

    // Create new version
    const newVersion = asset.version + 1;
    const storagePath = path.join(ASSETS_DIR, asset.appId, assetId);
    const newFilePath = path.join(storagePath, `v${newVersion}${path.extname(sourceFilePath)}`);
    await fs.copyFile(sourceFilePath, newFilePath);

    // Update asset
    const versionInfo: AssetVersion = {
      version: newVersion,
      filePath: newFilePath,
      fileSize: stats.size,
      width: dimensions?.width,
      height: dimensions?.height,
      duration: dimensions?.duration,
      checksum,
      changes: changes || 'Version update',
      createdAt: new Date().toISOString(),
      createdBy: updatedBy,
    };

    const updatedAsset: Asset = {
      ...asset,
      filePath: newFilePath,
      fileSize: stats.size,
      width: dimensions?.width,
      height: dimensions?.height,
      duration: dimensions?.duration,
      version: newVersion,
      versionHistory: [...asset.versionHistory, versionInfo],
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    const assetMetaPath = path.join(storagePath, 'asset.json');
    await fs.writeFile(assetMetaPath, JSON.stringify(updatedAsset, null, 2));

    return updatedAsset;
  }

  /**
   * Rollback to a previous version
   */
  async rollbackVersion(config: VersionRollbackConfig, updatedBy?: string): Promise<Asset> {
    const asset = await this.getAsset(config.assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${config.assetId}`);
    }

    const targetVersionInfo = asset.versionHistory.find((v) => v.version === config.targetVersion);
    if (!targetVersionInfo) {
      throw new Error(`Version not found: ${config.targetVersion}`);
    }

    if (config.createNewVersion) {
      // Copy old version file to new version
      return this.uploadNewVersion(
        config.assetId,
        targetVersionInfo.filePath,
        `Rolled back to version ${config.targetVersion}`,
        updatedBy
      );
    } else {
      // Update current version pointer
      const updatedAsset: Asset = {
        ...asset,
        filePath: targetVersionInfo.filePath,
        fileSize: targetVersionInfo.fileSize,
        width: targetVersionInfo.width,
        height: targetVersionInfo.height,
        duration: targetVersionInfo.duration,
        version: config.targetVersion,
        updatedAt: new Date().toISOString(),
        updatedBy,
      };

      const storagePath = path.join(ASSETS_DIR, asset.appId, config.assetId);
      const assetMetaPath = path.join(storagePath, 'asset.json');
      await fs.writeFile(assetMetaPath, JSON.stringify(updatedAsset, null, 2));

      return updatedAsset;
    }
  }

  /**
   * Get version history for an asset
   */
  async getVersionHistory(assetId: string): Promise<AssetVersion[]> {
    const asset = await this.getAsset(assetId);
    return asset?.versionHistory || [];
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get statistics for an app or all apps
   */
  async getStatistics(appId?: string): Promise<AssetStatistics> {
    const assets = await this.searchAssets(appId ? { appId } : {});

    const stats: AssetStatistics = {
      totalAssets: assets.length,
      totalSize: assets.reduce((sum, a) => sum + a.fileSize, 0),
      byType: {} as Record<AssetType, number>,
      byStatus: {} as Record<AssetStatus, number>,
      byLocale: {},
      latestAssets: assets.slice(0, 10),
    };

    // Count by type
    for (const asset of assets) {
      stats.byType[asset.type] = (stats.byType[asset.type] || 0) + 1;
      stats.byStatus[asset.status] = (stats.byStatus[asset.status] || 0) + 1;
      if (asset.locale) {
        stats.byLocale[asset.locale] = (stats.byLocale[asset.locale] || 0) + 1;
      }
    }

    return stats;
  }

  // ==========================================================================
  // Export
  // ==========================================================================

  /**
   * Export assets to directory or ZIP
   */
  async exportAssets(config: AssetExportConfig): Promise<AssetExportResult> {
    await this.initialize();

    const result: AssetExportResult = {
      success: false,
      outputPath: config.outputPath,
      assetCount: config.assets.length,
      totalSize: config.assets.reduce((sum, a) => sum + a.fileSize, 0),
      errors: [],
    };

    try {
      if (config.format === 'directory') {
        await this.exportToDirectory(config);
      } else {
        await this.exportToZip(config);
      }

      // Create manifest
      if (config.includeMetadata) {
        const manifest = await this.createExportManifest(config.assets);
        result.manifest = manifest;

        const manifestPath =
          config.format === 'directory'
            ? path.join(config.outputPath, 'manifest.json')
            : path.join(path.dirname(config.outputPath), 'manifest.json');

        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      }

      result.success = true;
    } catch (error) {
      result.errors?.push((error as Error).message);
    }

    return result;
  }

  private async exportToDirectory(config: AssetExportConfig): Promise<void> {
    await fs.mkdir(config.outputPath, { recursive: true });

    for (const asset of config.assets) {
      const versions = config.includeVersionHistory
        ? asset.versionHistory
        : [asset.versionHistory[asset.versionHistory.length - 1]];

      for (const version of versions) {
        const destPath = this.getExportPath(asset, version, config);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(version.filePath, destPath);
      }
    }
  }

  private async exportToZip(config: AssetExportConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(config.outputPath);
      const archive = archiver('zip', {
        zlib: { level: config.compression || 9 },
      });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      for (const asset of config.assets) {
        const versions = config.includeVersionHistory
          ? asset.versionHistory
          : [asset.versionHistory[asset.versionHistory.length - 1]];

        for (const version of versions) {
          const archivePath = this.getExportPath(asset, version, config);
          archive.file(version.filePath, { name: archivePath });
        }
      }

      archive.finalize();
    });
  }

  private getExportPath(asset: Asset, version: AssetVersion, config: AssetExportConfig): string {
    const ext = path.extname(version.filePath);
    const versionSuffix = config.includeVersionHistory ? `_v${version.version}` : '';
    const fileName = `${asset.name}${versionSuffix}${ext}`;

    switch (config.organizationStrategy) {
      case 'by-type':
        return path.join(asset.type, fileName);
      case 'by-locale':
        return path.join(asset.locale || 'no-locale', fileName);
      case 'by-status':
        return path.join(asset.status, fileName);
      case 'flat':
      default:
        return fileName;
    }
  }

  private async createExportManifest(assets: Asset[]): Promise<AssetExportManifest> {
    const apps: Record<string, AppInfo> = {};
    for (const asset of assets) {
      if (!apps[asset.appId]) {
        const app = await this.getApp(asset.appId);
        if (app) apps[asset.appId] = app;
      }
    }

    return {
      exportedAt: new Date().toISOString(),
      assetCount: assets.length,
      totalSize: assets.reduce((sum, a) => sum + a.fileSize, 0),
      apps,
      assets,
    };
  }

  // ==========================================================================
  // Batch Operations
  // ==========================================================================

  /**
   * Update multiple assets at once
   */
  async batchUpdate(config: BatchUpdateConfig, updatedBy?: string): Promise<Asset[]> {
    const results: Asset[] = [];
    for (const assetId of config.assetIds) {
      const updated = await this.updateAsset(assetId, config.updates, updatedBy);
      if (updated) results.push(updated);
    }
    return results;
  }

  /**
   * Delete multiple assets at once
   */
  async batchDelete(config: BatchDeleteConfig): Promise<number> {
    let deleted = 0;
    for (const assetId of config.assetIds) {
      const success = await this.deleteAsset(assetId, config.deleteVersionHistory);
      if (success) deleted++;
    }
    return deleted;
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate an asset file
   */
  async validateAsset(
    filePath: string,
    type: AssetType,
    customRules?: AssetValidationRules
  ): Promise<AssetValidationResult> {
    const result: AssetValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    const rules = customRules || DEFAULT_VALIDATION_RULES[type];
    if (!rules) return result;

    try {
      const stats = await fs.stat(filePath);
      const format = path.extname(filePath).slice(1).toLowerCase();
      const mimeType = getMimeType(format);

      // Check file size
      if (rules.maxFileSize && stats.size > rules.maxFileSize) {
        result.errors.push(`File size exceeds maximum: ${stats.size} > ${rules.maxFileSize}`);
        result.valid = false;
      }

      // Check format
      if (rules.allowedFormats && !rules.allowedFormats.includes(format)) {
        result.errors.push(`File format not allowed: ${format}`);
        result.valid = false;
      }

      // Check dimensions for images/videos
      if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
        const dimensions = await this.getFileDimensions(filePath, mimeType);
        if (dimensions) {
          if (rules.minWidth && dimensions.width < rules.minWidth) {
            result.errors.push(`Width too small: ${dimensions.width} < ${rules.minWidth}`);
            result.valid = false;
          }
          if (rules.maxWidth && dimensions.width > rules.maxWidth) {
            result.errors.push(`Width too large: ${dimensions.width} > ${rules.maxWidth}`);
            result.valid = false;
          }
          if (rules.minHeight && dimensions.height < rules.minHeight) {
            result.errors.push(`Height too small: ${dimensions.height} < ${rules.minHeight}`);
            result.valid = false;
          }
          if (rules.maxHeight && dimensions.height > rules.maxHeight) {
            result.errors.push(`Height too large: ${dimensions.height} > ${rules.maxHeight}`);
            result.valid = false;
          }
          if (rules.maxDuration && dimensions.duration && dimensions.duration > rules.maxDuration) {
            result.errors.push(`Duration too long: ${dimensions.duration}s > ${rules.maxDuration}s`);
            result.valid = false;
          }
        }
      }
    } catch (error) {
      result.errors.push(`Validation error: ${(error as Error).message}`);
      result.valid = false;
    }

    return result;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async getFileDimensions(
    filePath: string,
    mimeType: string
  ): Promise<{ width: number; height: number; duration?: number } | null> {
    // For now, return null - in production, use sharp for images or ffprobe for videos
    // This would require installing dependencies, so we'll skip for this implementation
    return null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let manager: AssetLibraryManager | null = null;

export function getAssetLibraryManager(): AssetLibraryManager {
  if (!manager) {
    manager = new AssetLibraryManager();
  }
  return manager;
}

// Export default instance
export default getAssetLibraryManager();
