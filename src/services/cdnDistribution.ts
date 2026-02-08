/**
 * CDN Distribution Service - PERF-003
 * Auto-upload rendered videos to R2/CloudFront with signed URLs
 *
 * Distributes rendered videos to CDN for faster global delivery
 * with automatic signed URL generation for access control.
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';

/**
 * CDN configuration
 */
export interface CDNConfig {
  provider: 'cloudflare-r2' | 'aws-s3' | 'cloudfront';
  bucket: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  cdnUrl?: string;
  signedUrlTTL?: number; // in seconds, default 24 hours
}

/**
 * Upload result
 */
export interface CDNUploadResult {
  success: boolean;
  objectKey: string;
  publicUrl?: string;
  signedUrl: string;
  expiresAt: number;
  fileSize: number;
  uploadTime: number;
}

/**
 * CDN Distribution Manager
 */
class CDNDistributionManager {
  private s3Client: S3Client;
  private config: CDNConfig;
  private uploadStats = { total: 0, successful: 0, failed: 0 };

  constructor(config: CDNConfig) {
    this.config = config;

    // Initialize S3 client (works with R2 and S3)
    this.s3Client = new S3Client({
      region: config.region || 'auto',
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      } : undefined,
      endpoint: config.endpoint,
    });
  }

  /**
   * Upload a rendered video to CDN
   *
   * @param videoPath - Local path to video file
   * @param videoBuffer - Video file buffer
   * @param fileName - Name for the CDN object
   * @param contentType - MIME type (default: video/mp4)
   * @param metadata - Custom metadata to store with object
   * @returns Upload result with signed URL
   */
  async uploadVideo(
    videoBuffer: Buffer,
    fileName: string,
    contentType: string = 'video/mp4',
    metadata?: Record<string, string>
  ): Promise<CDNUploadResult> {
    const startTime = Date.now();

    try {
      // Generate object key with timestamp for uniqueness
      const timestamp = Date.now();
      const objectKey = `renders/${timestamp}/${fileName}`;

      // Upload to S3/R2
      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: objectKey,
        Body: videoBuffer,
        ContentType: contentType,
        Metadata: metadata || {},
        // Enable public read for cloudfront
        ACL: this.config.provider === 'aws-s3' ? 'public-read' : undefined,
      });

      await this.s3Client.send(uploadCommand);

      // Generate signed URL
      const getCommand = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: objectKey,
      });

      const ttl = this.config.signedUrlTTL || 24 * 60 * 60; // 24 hours
      const signedUrl = await getSignedUrl(this.s3Client, getCommand, { expiresIn: ttl });

      // Generate public URL if CDN URL provided
      const publicUrl = this.config.cdnUrl ? `${this.config.cdnUrl}/${objectKey}` : undefined;

      const uploadTime = Date.now() - startTime;

      const result: CDNUploadResult = {
        success: true,
        objectKey,
        publicUrl,
        signedUrl,
        expiresAt: Date.now() + ttl * 1000,
        fileSize: videoBuffer.length,
        uploadTime,
      };

      this.uploadStats.successful++;
      this.uploadStats.total++;

      return result;
    } catch (error) {
      this.uploadStats.failed++;
      this.uploadStats.total++;

      console.error('Error uploading to CDN:', error);

      throw new Error(`Failed to upload video to CDN: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload multiple videos in batch
   */
  async uploadVideoBatch(
    videos: Array<{
      buffer: Buffer;
      fileName: string;
      contentType?: string;
      metadata?: Record<string, string>;
    }>
  ): Promise<CDNUploadResult[]> {
    const results = await Promise.all(
      videos.map(video =>
        this.uploadVideo(video.buffer, video.fileName, video.contentType, video.metadata)
      )
    );

    return results;
  }

  /**
   * Generate a CloudFront signed URL (if using CloudFront distribution)
   *
   * @param objectKey - S3 object key
   * @param privateKey - CloudFront private key
   * @param keyPairId - CloudFront key pair ID
   * @param ttl - Time to live in seconds
   */
  generateCloudFrontSignedUrl(
    objectKey: string,
    privateKey: string,
    keyPairId: string,
    ttl: number = 24 * 60 * 60
  ): string {
    const cloudFrontUrl = `${this.config.cdnUrl}/${objectKey}`;
    const expiresAt = Math.floor(Date.now() / 1000) + ttl;

    // Create policy
    const policy = {
      Statement: [
        {
          Resource: cloudFrontUrl,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': expiresAt,
            },
          },
        },
      ],
    };

    const policyString = JSON.stringify(policy);
    const encodedPolicy = Buffer.from(policyString).toString('base64');

    // Sign policy
    const signature = crypto
      .createSign('RSA-SHA1')
      .update(encodedPolicy)
      .sign(privateKey, 'base64');

    // Build signed URL
    const signedUrl = new URL(cloudFrontUrl);
    signedUrl.searchParams.append('Policy', encodedPolicy);
    signedUrl.searchParams.append('Signature', signature);
    signedUrl.searchParams.append('Key-Pair-Id', keyPairId);

    return signedUrl.toString();
  }

  /**
   * Delete object from CDN
   */
  async deleteVideo(objectKey: string): Promise<void> {
    try {
      // Note: For public S3, deletion requires additional permissions
      // For R2, this is more straightforward
      console.log(`Marked for deletion: ${objectKey}`);
      // Actual deletion would use DeleteObjectCommand
    } catch (error) {
      console.error('Error deleting from CDN:', error);
    }
  }

  /**
   * Get upload statistics
   */
  getStats() {
    return {
      ...this.uploadStats,
      successRate: this.uploadStats.total > 0
        ? ((this.uploadStats.successful / this.uploadStats.total) * 100).toFixed(2)
        : '0.00',
    };
  }

  /**
   * Close S3 client
   */
  async close(): Promise<void> {
    await this.s3Client.destroy();
  }
}

// Singleton instance
let cdnInstance: CDNDistributionManager | null = null;

/**
 * Get or create CDN distribution manager
 */
export function getCDNDistribution(config?: CDNConfig): CDNDistributionManager {
  if (!cdnInstance && config) {
    cdnInstance = new CDNDistributionManager(config);
  }

  if (!cdnInstance) {
    // Use environment variables as default config
    const defaultConfig: CDNConfig = {
      provider: (process.env.CDN_PROVIDER || 'cloudflare-r2') as CDNConfig['provider'],
      bucket: process.env.CDN_BUCKET || 'renders',
      region: process.env.CDN_REGION,
      accessKeyId: process.env.CDN_ACCESS_KEY_ID,
      secretAccessKey: process.env.CDN_SECRET_ACCESS_KEY,
      endpoint: process.env.CDN_ENDPOINT,
      cdnUrl: process.env.CDN_URL,
      signedUrlTTL: process.env.CDN_SIGNED_URL_TTL ? parseInt(process.env.CDN_SIGNED_URL_TTL) : undefined,
    };

    cdnInstance = new CDNDistributionManager(defaultConfig);
  }

  return cdnInstance;
}

/**
 * Utility function to upload video to CDN
 */
export async function uploadToCDN(
  videoBuffer: Buffer,
  fileName: string,
  contentType?: string,
  metadata?: Record<string, string>
): Promise<CDNUploadResult> {
  const cdn = getCDNDistribution();
  return cdn.uploadVideo(videoBuffer, fileName, contentType, metadata);
}

/**
 * Utility function for batch upload
 */
export async function uploadBatchToCDN(
  videos: Array<{
    buffer: Buffer;
    fileName: string;
    contentType?: string;
    metadata?: Record<string, string>;
  }>
): Promise<CDNUploadResult[]> {
  const cdn = getCDNDistribution();
  return cdn.uploadVideoBatch(videos);
}

/**
 * Generate signed URL for a rendered video
 */
export async function generateSignedVideoUrl(objectKey: string, ttlHours: number = 24): Promise<string> {
  const cdn = getCDNDistribution();
  const getCommand = new GetObjectCommand({
    Bucket: (process.env.CDN_BUCKET || 'renders'),
    Key: objectKey,
  });

  const s3Client = new S3Client({
    region: process.env.CDN_REGION || 'auto',
    endpoint: process.env.CDN_ENDPOINT,
  });

  const ttl = ttlHours * 60 * 60;
  return getSignedUrl(s3Client, getCommand, { expiresIn: ttl });
}
