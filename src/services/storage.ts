/**
 * Storage Service - ADS-018
 * S3/R2 Upload Integration
 * SEC-001: Signed Download URLs with Expiry
 *
 * This service provides methods to upload rendered assets to cloud storage
 * (Amazon S3 or Cloudflare R2). Supports both services with the same API.
 * Includes signed URLs with 24h expiry for secure downloads.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Storage provider types
 */
export enum StorageProvider {
  S3 = 's3',
  R2 = 'r2',
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  region?: string;              // Required for S3, optional for R2
  accountId?: string;           // Required for R2
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;            // Custom endpoint (for R2 or S3-compatible)
  publicUrl?: string;           // Public URL for accessing files
}

/**
 * Upload options
 */
export interface UploadOptions {
  key?: string;                 // S3 key (path), auto-generated if not provided
  contentType?: string;         // MIME type
  metadata?: Record<string, string>;  // Custom metadata
  cacheControl?: string;        // Cache-Control header
  acl?: string;                 // Access control (e.g., 'public-read')
  tags?: Record<string, string>;      // Object tags
}

/**
 * Upload result
 */
export interface UploadResult {
  success: boolean;
  key: string;
  url: string;
  etag?: string;
  versionId?: string;
  error?: string;
}

/**
 * Download result
 */
export interface DownloadResult {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
  error?: string;
}

/**
 * File info
 */
export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
}

/**
 * Get content type from file extension
 */
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.pdf': 'application/pdf',
  };

  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Generate S3 key from file path
 */
function generateKey(filePath: string, prefix?: string): string {
  const filename = path.basename(filePath);
  const timestamp = Date.now();
  const hash = crypto.randomBytes(4).toString('hex');

  const key = prefix
    ? `${prefix}/${timestamp}-${hash}-${filename}`
    : `${timestamp}-${hash}-${filename}`;

  return key;
}

/**
 * StorageService class - Main storage management
 */
export class StorageService {
  private client: S3Client;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;

    // Create S3 client configuration
    const clientConfig: any = {
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    };

    // Configure for R2 or S3
    if (config.provider === StorageProvider.R2) {
      if (!config.accountId) {
        throw new Error('accountId is required for Cloudflare R2');
      }
      clientConfig.endpoint = config.endpoint || `https://${config.accountId}.r2.cloudflarestorage.com`;
      clientConfig.region = 'auto';
    } else {
      if (!config.region) {
        throw new Error('region is required for Amazon S3');
      }
      clientConfig.region = config.region;
      if (config.endpoint) {
        clientConfig.endpoint = config.endpoint;
      }
    }

    this.client = new S3Client(clientConfig);
  }

  /**
   * Upload a file to storage
   *
   * @param filePath - Path to the file to upload
   * @param options - Upload options
   * @returns Promise with upload result
   */
  async uploadFile(filePath: string, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file
      const fileBuffer = fs.readFileSync(filePath);

      // Generate key if not provided
      const key = options.key || generateKey(filePath);

      // Get content type
      const contentType = options.contentType || getContentType(filePath);

      // Prepare upload command
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: options.metadata,
        CacheControl: options.cacheControl,
        ACL: options.acl as any,
        Tagging: options.tags ? this.formatTags(options.tags) : undefined,
      });

      // Upload file
      const response = await this.client.send(command);

      // Generate public URL
      const url = this.getPublicUrl(key);

      return {
        success: true,
        key,
        url,
        etag: response.ETag,
        versionId: response.VersionId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        key: options.key || '',
        url: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Upload a buffer to storage
   *
   * @param buffer - Buffer to upload
   * @param key - S3 key (required)
   * @param options - Upload options
   * @returns Promise with upload result
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Prepare upload command
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata,
        CacheControl: options.cacheControl,
        ACL: options.acl as any,
        Tagging: options.tags ? this.formatTags(options.tags) : undefined,
      });

      // Upload buffer
      const response = await this.client.send(command);

      // Generate public URL
      const url = this.getPublicUrl(key);

      return {
        success: true,
        key,
        url,
        etag: response.ETag,
        versionId: response.VersionId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        key,
        url: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Upload multiple files in batch
   *
   * @param filePaths - Array of file paths to upload
   * @param options - Upload options (applied to all files)
   * @returns Promise with array of upload results
   */
  async uploadBatch(
    filePaths: string[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const filePath of filePaths) {
      const result = await this.uploadFile(filePath, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Delete a file from storage
   *
   * @param key - S3 key of the file to delete
   * @returns Promise with success status
   */
  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete multiple files in batch
   *
   * @param keys - Array of S3 keys to delete
   * @returns Promise with array of delete results
   */
  async deleteBatch(keys: string[]): Promise<Array<{ success: boolean; error?: string }>> {
    const results: Array<{ success: boolean; error?: string }> = [];

    for (const key of keys) {
      const result = await this.deleteFile(key);
      results.push(result);
    }

    return results;
  }

  /**
   * Check if a file exists
   *
   * @param key - S3 key to check
   * @returns Promise with existence status
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file info
   *
   * @param key - S3 key
   * @returns Promise with file info or null if not found
   */
  async getFileInfo(key: string): Promise<FileInfo | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || '',
        contentType: response.ContentType,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * List files with a prefix
   *
   * @param prefix - Key prefix to filter by
   * @param maxKeys - Maximum number of keys to return (default: 1000)
   * @returns Promise with array of file info
   */
  async listFiles(prefix?: string, maxKeys: number = 1000): Promise<FileInfo[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.client.send(command);

      if (!response.Contents) {
        return [];
      }

      return response.Contents.map((item) => ({
        key: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        etag: item.ETag || '',
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Generate a presigned URL for temporary access
   *
   * @param key - S3 key
   * @param expiresIn - URL expiration in seconds (default: 3600)
   * @returns Promise with presigned URL
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * SEC-001: Generate a signed download URL with 24h default expiry
   * Download URLs are signed for secure access to rendered assets
   *
   * @param key - S3 key
   * @param expiresIn - URL expiration in seconds (default: 86400 = 24 hours)
   * @returns Promise with signed download URL
   */
  async getDownloadUrl(key: string, expiresIn: number = 86400): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Get public URL for a file
   *
   * @param key - S3 key
   * @returns Public URL
   */
  getPublicUrl(key: string): string {
    if (this.config.publicUrl) {
      return `${this.config.publicUrl}/${key}`;
    }

    if (this.config.provider === StorageProvider.R2) {
      // R2 public URL format
      return `https://${this.config.bucket}.${this.config.accountId}.r2.dev/${key}`;
    } else {
      // S3 public URL format
      return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    }
  }

  /**
   * Format tags for S3
   */
  private formatTags(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * Get storage configuration
   */
  getConfig(): Readonly<StorageConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Test connection to storage
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        MaxKeys: 1,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
}

/**
 * Create storage service from environment variables
 */
export function createStorageFromEnv(): StorageService | null {
  const provider = process.env.STORAGE_PROVIDER as StorageProvider;
  const bucket = process.env.STORAGE_BUCKET;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;

  if (!provider || !bucket || !accessKeyId || !secretAccessKey) {
    console.warn('Storage environment variables not configured');
    return null;
  }

  const config: StorageConfig = {
    provider,
    bucket,
    accessKeyId,
    secretAccessKey,
    region: process.env.STORAGE_REGION,
    accountId: process.env.STORAGE_ACCOUNT_ID,
    endpoint: process.env.STORAGE_ENDPOINT,
    publicUrl: process.env.STORAGE_PUBLIC_URL,
  };

  return new StorageService(config);
}

/**
 * Singleton storage service instance
 */
let storageServiceInstance: StorageService | null = null;

/**
 * Get storage service instance (singleton)
 */
export function getStorageService(config?: StorageConfig): StorageService | null {
  if (!storageServiceInstance) {
    if (config) {
      storageServiceInstance = new StorageService(config);
    } else {
      storageServiceInstance = createStorageFromEnv();
    }
  }
  return storageServiceInstance;
}

/**
 * Upload render result to storage
 * Convenience function for integrating with render queue
 */
export async function uploadRenderResult(
  outputPath: string,
  options?: {
    prefix?: string;
    metadata?: Record<string, string>;
  }
): Promise<UploadResult | null> {
  const storage = getStorageService();

  if (!storage) {
    console.warn('Storage service not configured');
    return null;
  }

  const uploadOptions: UploadOptions = {
    metadata: options?.metadata,
    cacheControl: 'public, max-age=31536000',
    acl: 'public-read',
  };

  if (options?.prefix) {
    const filename = path.basename(outputPath);
    uploadOptions.key = `${options.prefix}/${filename}`;
  }

  return storage.uploadFile(outputPath, uploadOptions);
}
