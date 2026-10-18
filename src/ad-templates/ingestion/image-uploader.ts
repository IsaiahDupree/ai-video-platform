/**
 * Reference Image Uploader
 *
 * Handles uploading and validation of PNG/JPG reference ad images for AI layout extraction.
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

// =============================================================================
// Types
// =============================================================================

export interface UploadRequest {
  /** Base64-encoded image data */
  imageBase64?: string;
  /** File buffer (for server-side uploads) */
  fileBuffer?: Buffer;
  /** Original filename */
  filename: string;
  /** Optional metadata */
  metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
    sourceUrl?: string;
  };
}

export interface UploadResult {
  success: boolean;
  /** SHA-256 hash of the image */
  imageId?: string;
  /** Local file path */
  filePath?: string;
  /** Image dimensions */
  dimensions?: { width: number; height: number };
  /** File size in bytes */
  fileSize?: number;
  /** MIME type */
  mimeType?: string;
  error?: string;
  warnings?: string[];
}

export interface UploadedImage {
  imageId: string;
  filename: string;
  filePath: string;
  dimensions: { width: number; height: number };
  fileSize: number;
  mimeType: string;
  sha256: string;
  uploadedAt: string;
  metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
    sourceUrl?: string;
  };
}

// =============================================================================
// Configuration
// =============================================================================

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/assets/uploads/reference-ads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

// =============================================================================
// Validation
// =============================================================================

/**
 * Validates the file extension
 */
function validateExtension(filename: string): { valid: boolean; error?: string } {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Validates file size
 */
function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  return { valid: true };
}

/**
 * Detects MIME type from buffer
 */
function detectMimeType(buffer: Buffer): string | null {
  // PNG signature
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  // JPEG signature
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return 'image/jpeg';
  }
  return null;
}

/**
 * Validates MIME type
 */
function validateMimeType(mimeType: string | null): { valid: boolean; error?: string } {
  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid MIME type "${mimeType}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Gets image dimensions using a simple approach (requires external library for production)
 */
async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  try {
    // PNG dimensions
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // JPEG dimensions (simplified, may not work for all JPEG variants)
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];

        // Start of Frame markers
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }

        const segmentLength = buffer.readUInt16BE(offset + 2);
        offset += segmentLength + 2;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}

// =============================================================================
// File Storage
// =============================================================================

/**
 * Ensures upload directory exists
 */
async function ensureUploadDir(): Promise<void> {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create upload directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Computes SHA-256 hash of buffer
 */
function computeHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Saves buffer to disk
 */
async function saveFile(buffer: Buffer, filename: string, imageId: string): Promise<string> {
  const ext = path.extname(filename);
  const targetFilename = `${imageId}${ext}`;
  const filePath = path.join(UPLOAD_DIR, targetFilename);

  await fs.writeFile(filePath, buffer);
  return filePath;
}

/**
 * Saves metadata alongside image
 */
async function saveMetadata(imageId: string, data: UploadedImage): Promise<void> {
  const metadataPath = path.join(UPLOAD_DIR, `${imageId}.json`);
  await fs.writeFile(metadataPath, JSON.stringify(data, null, 2));
}

// =============================================================================
// Main Upload Function
// =============================================================================

/**
 * Uploads and validates a reference ad image
 */
export async function uploadReferenceImage(request: UploadRequest): Promise<UploadResult> {
  const warnings: string[] = [];

  try {
    // Convert to buffer
    let buffer: Buffer;
    if (request.imageBase64) {
      buffer = Buffer.from(request.imageBase64, 'base64');
    } else if (request.fileBuffer) {
      buffer = request.fileBuffer;
    } else {
      return { success: false, error: 'No image data provided (imageBase64 or fileBuffer required)' };
    }

    // Validate file extension
    const extValidation = validateExtension(request.filename);
    if (!extValidation.valid) {
      return { success: false, error: extValidation.error };
    }

    // Validate file size
    const sizeValidation = validateFileSize(buffer.length);
    if (!sizeValidation.valid) {
      return { success: false, error: sizeValidation.error };
    }

    // Detect and validate MIME type
    const mimeType = detectMimeType(buffer);
    const mimeValidation = validateMimeType(mimeType);
    if (!mimeValidation.valid) {
      return { success: false, error: mimeValidation.error };
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(buffer);
    if (!dimensions) {
      warnings.push('Could not detect image dimensions');
    }

    // Validate dimensions (recommend standard ad sizes)
    if (dimensions) {
      const isStandardSize = [
        [1080, 1080], // IG Feed
        [1080, 1920], // IG Story
        [1200, 628],  // FB Feed
        [1200, 1200], // FB Marketplace
        [1080, 1350], // IG Portrait
      ].some(([w, h]) => dimensions.width === w && dimensions.height === h);

      if (!isStandardSize) {
        warnings.push(
          `Non-standard ad size ${dimensions.width}x${dimensions.height}. Standard sizes: 1080x1080, 1080x1920, 1200x628`
        );
      }
    }

    // Compute hash (image ID)
    const sha256 = computeHash(buffer);
    const imageId = sha256.substring(0, 16); // Use first 16 chars as short ID

    // Ensure upload directory exists
    await ensureUploadDir();

    // Check if image already exists
    const existingMetadataPath = path.join(UPLOAD_DIR, `${imageId}.json`);
    try {
      const existingData = await fs.readFile(existingMetadataPath, 'utf-8');
      const existing = JSON.parse(existingData) as UploadedImage;
      warnings.push('Image already exists (duplicate SHA-256)');
      return {
        success: true,
        imageId,
        filePath: existing.filePath,
        dimensions: existing.dimensions,
        fileSize: existing.fileSize,
        mimeType: existing.mimeType,
        warnings,
      };
    } catch {
      // File doesn't exist, proceed with upload
    }

    // Save file
    const filePath = await saveFile(buffer, request.filename, imageId);

    // Create metadata
    const uploadedImage: UploadedImage = {
      imageId,
      filename: request.filename,
      filePath,
      dimensions: dimensions || { width: 0, height: 0 },
      fileSize: buffer.length,
      mimeType: mimeType!,
      sha256,
      uploadedAt: new Date().toISOString(),
      metadata: request.metadata,
    };

    // Save metadata
    await saveMetadata(imageId, uploadedImage);

    return {
      success: true,
      imageId,
      filePath,
      dimensions: dimensions || undefined,
      fileSize: buffer.length,
      mimeType: mimeType!,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Retrieves metadata for an uploaded image
 */
export async function getUploadedImage(imageId: string): Promise<UploadedImage | null> {
  try {
    const metadataPath = path.join(UPLOAD_DIR, `${imageId}.json`);
    const data = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(data) as UploadedImage;
  } catch {
    return null;
  }
}

/**
 * Lists all uploaded images
 */
export async function listUploadedImages(): Promise<UploadedImage[]> {
  try {
    await ensureUploadDir();
    const files = await fs.readdir(UPLOAD_DIR);
    const metadataFiles = files.filter((f) => f.endsWith('.json'));

    const images: UploadedImage[] = [];
    for (const file of metadataFiles) {
      try {
        const data = await fs.readFile(path.join(UPLOAD_DIR, file), 'utf-8');
        images.push(JSON.parse(data) as UploadedImage);
      } catch {
        // Skip invalid metadata files
      }
    }

    return images.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  } catch {
    return [];
  }
}

/**
 * Deletes an uploaded image and its metadata
 */
export async function deleteUploadedImage(imageId: string): Promise<boolean> {
  try {
    const image = await getUploadedImage(imageId);
    if (!image) return false;

    // Delete image file
    await fs.unlink(image.filePath);

    // Delete metadata file
    const metadataPath = path.join(UPLOAD_DIR, `${imageId}.json`);
    await fs.unlink(metadataPath);

    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Exports
// =============================================================================

export default {
  uploadReferenceImage,
  getUploadedImage,
  listUploadedImages,
  deleteUploadedImage,
};
