/**
 * Image Upload Tests
 *
 * Tests for reference ad image ingestion system.
 */

import { uploadReferenceImage, getUploadedImage, listUploadedImages } from '../../src/ad-templates/ingestion/image-uploader';
import { promises as fs } from 'fs';
import path from 'path';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a minimal valid PNG buffer
 */
function createTestPNG(width: number, height: number): Buffer {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk (image header)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(13, 0);
  const ihdrType = Buffer.from('IHDR');
  const ihdrCRC = Buffer.alloc(4);
  ihdrCRC.writeUInt32BE(0, 0); // Simplified CRC

  // IEND chunk (image end)
  const iendLength = Buffer.alloc(4);
  iendLength.writeUInt32BE(0, 0);
  const iendType = Buffer.from('IEND');
  const iendCRC = Buffer.alloc(4);
  iendCRC.writeUInt32BE(0, 0);

  return Buffer.concat([
    signature,
    ihdrLength,
    ihdrType,
    ihdrData,
    ihdrCRC,
    iendLength,
    iendType,
    iendCRC,
  ]);
}

/**
 * Creates a minimal valid JPEG buffer
 */
function createTestJPEG(width: number, height: number): Buffer {
  // JPEG signature (SOI marker)
  const soi = Buffer.from([0xff, 0xd8]);

  // SOF0 marker (Start of Frame)
  const sof0 = Buffer.from([
    0xff, 0xc0, // SOF0 marker
    0x00, 0x11, // Segment length (17 bytes)
    0x08, // Precision
    (height >> 8) & 0xff, height & 0xff, // Height
    (width >> 8) & 0xff, width & 0xff, // Width
    0x03, // Number of components (RGB)
    0x01, 0x22, 0x00, // Component 1
    0x02, 0x11, 0x01, // Component 2
    0x03, 0x11, 0x01, // Component 3
  ]);

  // EOI marker (End of Image)
  const eoi = Buffer.from([0xff, 0xd9]);

  return Buffer.concat([soi, sof0, eoi]);
}

// =============================================================================
// Tests
// =============================================================================

/**
 * Test: Upload PNG image
 */
export async function testUploadPNG(): Promise<boolean> {
  console.log('🧪 Test: Upload PNG image');

  const testImage = createTestPNG(1080, 1080);
  const result = await uploadReferenceImage({
    fileBuffer: testImage,
    filename: 'test-ad.png',
    metadata: {
      name: 'Test Ad',
      tags: ['test', 'png'],
    },
  });

  if (!result.success) {
    console.error('❌ Failed:', result.error);
    return false;
  }

  console.log('✅ PNG uploaded successfully');
  console.log(`   Image ID: ${result.imageId}`);
  console.log(`   Dimensions: ${result.dimensions?.width}x${result.dimensions?.height}`);

  return true;
}

/**
 * Test: Upload JPEG image
 */
export async function testUploadJPEG(): Promise<boolean> {
  console.log('🧪 Test: Upload JPEG image');

  const testImage = createTestJPEG(1200, 628);
  const result = await uploadReferenceImage({
    fileBuffer: testImage,
    filename: 'test-ad.jpg',
    metadata: {
      name: 'FB Feed Ad',
      tags: ['test', 'jpeg', 'facebook'],
    },
  });

  if (!result.success) {
    console.error('❌ Failed:', result.error);
    return false;
  }

  console.log('✅ JPEG uploaded successfully');
  console.log(`   Image ID: ${result.imageId}`);
  console.log(`   Dimensions: ${result.dimensions?.width}x${result.dimensions?.height}`);

  return true;
}

/**
 * Test: Upload with base64 encoding
 */
export async function testUploadBase64(): Promise<boolean> {
  console.log('🧪 Test: Upload with base64');

  const testImage = createTestPNG(1080, 1920);
  const base64 = testImage.toString('base64');

  const result = await uploadReferenceImage({
    imageBase64: base64,
    filename: 'test-story.png',
    metadata: {
      name: 'IG Story Ad',
      tags: ['test', 'instagram', 'story'],
    },
  });

  if (!result.success) {
    console.error('❌ Failed:', result.error);
    return false;
  }

  console.log('✅ Base64 upload successful');
  console.log(`   Image ID: ${result.imageId}`);

  return true;
}

/**
 * Test: Invalid file extension
 */
export async function testInvalidExtension(): Promise<boolean> {
  console.log('🧪 Test: Invalid file extension');

  const testImage = createTestPNG(1080, 1080);
  const result = await uploadReferenceImage({
    fileBuffer: testImage,
    filename: 'test-ad.gif',
  });

  if (result.success) {
    console.error('❌ Should have rejected .gif file');
    return false;
  }

  if (!result.error?.includes('Invalid file extension')) {
    console.error('❌ Wrong error message:', result.error);
    return false;
  }

  console.log('✅ Correctly rejected invalid extension');
  return true;
}

/**
 * Test: File too large
 */
export async function testFileSizeLimitExceeded(): Promise<boolean> {
  console.log('🧪 Test: File size limit');

  // Create a 15MB buffer (exceeds 10MB limit)
  const largeBuffer = Buffer.alloc(15 * 1024 * 1024);
  const result = await uploadReferenceImage({
    fileBuffer: largeBuffer,
    filename: 'large-ad.png',
  });

  if (result.success) {
    console.error('❌ Should have rejected large file');
    return false;
  }

  if (!result.error?.includes('exceeds limit')) {
    console.error('❌ Wrong error message:', result.error);
    return false;
  }

  console.log('✅ Correctly rejected oversized file');
  return true;
}

/**
 * Test: Retrieve uploaded image
 */
export async function testGetUploadedImage(): Promise<boolean> {
  console.log('🧪 Test: Retrieve uploaded image');

  // Upload first
  const testImage = createTestPNG(1080, 1080);
  const uploadResult = await uploadReferenceImage({
    fileBuffer: testImage,
    filename: 'retrieve-test.png',
  });

  if (!uploadResult.success || !uploadResult.imageId) {
    console.error('❌ Upload failed');
    return false;
  }

  // Retrieve
  const image = await getUploadedImage(uploadResult.imageId);

  if (!image) {
    console.error('❌ Failed to retrieve image');
    return false;
  }

  if (image.imageId !== uploadResult.imageId) {
    console.error('❌ Image ID mismatch');
    return false;
  }

  console.log('✅ Successfully retrieved image metadata');
  return true;
}

/**
 * Test: List uploaded images
 */
export async function testListImages(): Promise<boolean> {
  console.log('🧪 Test: List uploaded images');

  const images = await listUploadedImages();

  if (!Array.isArray(images)) {
    console.error('❌ Invalid response from listUploadedImages');
    return false;
  }

  console.log(`✅ Found ${images.length} uploaded image(s)`);
  return true;
}

/**
 * Test: Duplicate upload detection
 */
export async function testDuplicateDetection(): Promise<boolean> {
  console.log('🧪 Test: Duplicate upload detection');

  const testImage = createTestPNG(1080, 1080);

  // Upload first time
  const result1 = await uploadReferenceImage({
    fileBuffer: testImage,
    filename: 'duplicate-test.png',
  });

  if (!result1.success) {
    console.error('❌ First upload failed');
    return false;
  }

  // Upload same image again
  const result2 = await uploadReferenceImage({
    fileBuffer: testImage,
    filename: 'duplicate-test-2.png', // Different filename, same content
  });

  if (!result2.success) {
    console.error('❌ Second upload failed');
    return false;
  }

  if (!result2.warnings?.some(w => w.includes('already exists'))) {
    console.error('❌ Should have detected duplicate');
    return false;
  }

  if (result1.imageId !== result2.imageId) {
    console.error('❌ Image IDs should match for duplicates');
    return false;
  }

  console.log('✅ Duplicate detection working');
  return true;
}

// =============================================================================
// Test Runner
// =============================================================================

export async function runAllTests(): Promise<void> {
  console.log('🚀 Running Image Upload Tests\n');

  const tests = [
    testUploadPNG,
    testUploadJPEG,
    testUploadBase64,
    testInvalidExtension,
    testFileSizeLimitExceeded,
    testGetUploadedImage,
    testListImages,
    testDuplicateDetection,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test threw exception:`, error);
      failed++;
    }
    console.log('');
  }

  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
