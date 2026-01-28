# ADS-018: S3/R2 Upload Integration

**Status:** ✅ Complete
**Priority:** P2
**Effort:** 5pts

## Overview

The S3/R2 Upload Integration feature provides a unified API for uploading rendered assets to cloud storage, supporting both Amazon S3 and Cloudflare R2. This enables automatic backup, content delivery, and sharing of generated ads.

## Architecture

### Core Components

1. **StorageService** - Main class for managing uploads
2. **Provider Support** - S3 and R2 with same API
3. **Upload Operations** - Single, batch, and buffer uploads
4. **File Management** - Delete, list, and metadata operations
5. **URL Generation** - Public and presigned URLs

### Technology Stack

- **AWS SDK v3** (`@aws-sdk/client-s3`) - S3-compatible client
- **S3 Request Presigner** - Presigned URL generation
- **Node.js fs/crypto** - File operations and hashing

## Features

### 1. Storage Providers

Supports two cloud storage providers:

- **Amazon S3** - AWS object storage
- **Cloudflare R2** - S3-compatible with zero egress fees

### 2. Upload Operations

**Single File Upload:**
```typescript
const result = await storage.uploadFile('/path/to/file.png', {
  key: 'ads/campaign-1/creative.png',
  metadata: { campaign: 'summer-2024' },
  cacheControl: 'public, max-age=31536000',
  acl: 'public-read'
});
```

**Buffer Upload:**
```typescript
const buffer = fs.readFileSync('image.png');
const result = await storage.uploadBuffer(buffer, 'ads/image.png', {
  contentType: 'image/png'
});
```

**Batch Upload:**
```typescript
const results = await storage.uploadBatch([
  'file1.png',
  'file2.jpg',
  'file3.webp'
]);
```

### 3. File Management

**Delete Files:**
```typescript
await storage.deleteFile('ads/old-creative.png');
await storage.deleteBatch(['file1.png', 'file2.png']);
```

**Check Existence:**
```typescript
const exists = await storage.fileExists('ads/creative.png');
```

**Get File Info:**
```typescript
const info = await storage.getFileInfo('ads/creative.png');
// Returns: { key, size, lastModified, etag, contentType }
```

**List Files:**
```typescript
const files = await storage.listFiles('ads/campaign-1/', 1000);
```

### 4. URL Generation

**Public URL:**
```typescript
const url = storage.getPublicUrl('ads/creative.png');
// S3: https://bucket.s3.region.amazonaws.com/ads/creative.png
// R2: https://bucket.account-id.r2.dev/ads/creative.png
```

**Presigned URL (Temporary Access):**
```typescript
const url = await storage.getPresignedUrl('ads/creative.png', 3600);
// Valid for 1 hour
```

### 5. Configuration

**Environment Variables:**
```bash
# Common
STORAGE_PROVIDER=s3  # or 'r2'
STORAGE_BUCKET=my-bucket
STORAGE_ACCESS_KEY_ID=your-key-id
STORAGE_SECRET_ACCESS_KEY=your-secret-key

# S3-specific
STORAGE_REGION=us-east-1

# R2-specific
STORAGE_ACCOUNT_ID=your-account-id

# Optional
STORAGE_ENDPOINT=https://custom-endpoint.com
STORAGE_PUBLIC_URL=https://cdn.example.com
```

**Programmatic Configuration:**
```typescript
const storage = new StorageService({
  provider: StorageProvider.S3,
  bucket: 'my-bucket',
  region: 'us-east-1',
  accessKeyId: 'key',
  secretAccessKey: 'secret'
});
```

## Integration Examples

### 1. With Render Queue

Upload automatically after rendering:

```typescript
import { getRenderQueue } from './services/renderQueue';
import { getStorageService } from './services/storage';

const queue = getRenderQueue();
const storage = getStorageService();

queue.setupEventListener(
  async (jobId, result) => {
    // Upload all rendered files
    for (const renderResult of result.results) {
      if (renderResult.success && storage) {
        const uploadResult = await storage.uploadFile(
          renderResult.outputPath,
          {
            key: `renders/${jobId}/${path.basename(renderResult.outputPath)}`,
            metadata: {
              jobId,
              width: renderResult.width.toString(),
              height: renderResult.height.toString()
            }
          }
        );

        console.log('Uploaded:', uploadResult.url);
      }
    }
  }
);
```

### 2. Convenience Helper

```typescript
import { uploadRenderResult } from './services/storage';

const uploadResult = await uploadRenderResult(
  '/output/ads/creative.png',
  {
    prefix: 'campaign-summer-2024',
    metadata: { campaign: 'summer' }
  }
);
```

### 3. Custom Integration

```typescript
const storage = getStorageService();

if (storage) {
  // Test connection
  const test = await storage.testConnection();
  if (test.success) {
    // Upload with custom options
    const result = await storage.uploadFile(filePath, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=2592000',
      metadata: {
        source: 'batch-render',
        template: 'template-1'
      },
      tags: {
        environment: 'production',
        project: 'ad-studio'
      }
    });
  }
}
```

## API Reference

### StorageService Class

#### Constructor
```typescript
constructor(config: StorageConfig)
```

#### Methods

**Upload Operations:**
- `uploadFile(filePath: string, options?: UploadOptions): Promise<UploadResult>`
- `uploadBuffer(buffer: Buffer, key: string, options?: UploadOptions): Promise<UploadResult>`
- `uploadBatch(filePaths: string[], options?: UploadOptions): Promise<UploadResult[]>`

**File Management:**
- `deleteFile(key: string): Promise<{ success: boolean; error?: string }>`
- `deleteBatch(keys: string[]): Promise<Array<{ success: boolean; error?: string }>>`
- `fileExists(key: string): Promise<boolean>`
- `getFileInfo(key: string): Promise<FileInfo | null>`
- `listFiles(prefix?: string, maxKeys?: number): Promise<FileInfo[]>`

**URL Generation:**
- `getPublicUrl(key: string): string`
- `getPresignedUrl(key: string, expiresIn?: number): Promise<string>`

**Utility:**
- `testConnection(): Promise<{ success: boolean; error?: string }>`
- `getConfig(): Readonly<StorageConfig>`

### Types

```typescript
enum StorageProvider {
  S3 = 's3',
  R2 = 'r2'
}

interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  region?: string;
  accountId?: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicUrl?: string;
}

interface UploadOptions {
  key?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  acl?: string;
  tags?: Record<string, string>;
}

interface UploadResult {
  success: boolean;
  key: string;
  url: string;
  etag?: string;
  versionId?: string;
  error?: string;
}

interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
}
```

## Testing

### Run Tests

```bash
npm run tsx scripts/test-storage.ts
```

### Test with Real Storage

1. Configure environment variables
2. Run test script
3. Verify uploads in console
4. Check storage bucket

### Expected Output

```
=== Storage Service Test Suite ===

Test 1: Creating test files...
✓ Created test files:
  - test.txt
  - test.json
  - test.png

Test 2: Testing storage service instantiation...
✓ Storage service created successfully

Test 3: Testing public URL generation...
✓ S3 URL: https://my-bucket.s3.us-west-2.amazonaws.com/path/to/file.png
✓ R2 URL: https://my-bucket.account123.r2.dev/path/to/file.png

Test 4: Testing environment variable configuration...
✓ Environment variables detected
✓ Storage service created from environment variables
✓ Connection successful!

Test 5: Testing file upload...
✓ Upload successful!
  Key: 1234567890-abc123-test.txt
  URL: https://bucket.s3.region.amazonaws.com/...

✓ All tests completed
```

## Provider-Specific Setup

### Amazon S3

1. **Create S3 Bucket:**
   - Go to AWS Console → S3
   - Create bucket with appropriate name
   - Configure CORS if needed

2. **Create IAM User:**
   - Go to AWS Console → IAM
   - Create user with programmatic access
   - Attach policy: `AmazonS3FullAccess` or custom policy

3. **Configure Environment:**
   ```bash
   export STORAGE_PROVIDER=s3
   export STORAGE_BUCKET=my-ad-renders
   export STORAGE_REGION=us-east-1
   export STORAGE_ACCESS_KEY_ID=AKIA...
   export STORAGE_SECRET_ACCESS_KEY=...
   ```

### Cloudflare R2

1. **Create R2 Bucket:**
   - Go to Cloudflare Dashboard → R2
   - Create bucket
   - Enable public access if needed

2. **Create API Token:**
   - Go to R2 → Manage R2 API Tokens
   - Create API token with R2 permissions

3. **Configure Environment:**
   ```bash
   export STORAGE_PROVIDER=r2
   export STORAGE_BUCKET=my-ad-renders
   export STORAGE_ACCOUNT_ID=abc123...
   export STORAGE_ACCESS_KEY_ID=...
   export STORAGE_SECRET_ACCESS_KEY=...
   ```

## Security Best Practices

1. **Use Environment Variables** - Never hardcode credentials
2. **Restrict Bucket Access** - Use IAM policies/R2 permissions
3. **Enable Versioning** - Protect against accidental deletion
4. **Use HTTPS** - Always use secure URLs
5. **Rotate Credentials** - Regularly rotate access keys
6. **Monitor Usage** - Set up CloudWatch/R2 analytics
7. **Implement Lifecycle Rules** - Auto-delete old files

## Cost Optimization

### Amazon S3
- Use Standard-IA for infrequently accessed files
- Enable S3 Intelligent-Tiering
- Set lifecycle policies to expire old renders
- Use CloudFront CDN for delivery

### Cloudflare R2
- Zero egress fees (main advantage)
- Pay only for storage
- Free tier: 10 GB storage
- Ideal for high-bandwidth scenarios

## Error Handling

```typescript
const result = await storage.uploadFile(filePath);

if (!result.success) {
  console.error('Upload failed:', result.error);

  // Common errors:
  // - "File not found" - Invalid file path
  // - "Access Denied" - Invalid credentials
  // - "Bucket does not exist" - Wrong bucket name
  // - "Network error" - Connection issue
}
```

## Performance Tips

1. **Batch Operations** - Use `uploadBatch()` for multiple files
2. **Concurrent Uploads** - Use Promise.all() for parallel uploads
3. **Stream Large Files** - For files >100MB, use streaming
4. **Compress Before Upload** - Reduce storage costs
5. **Cache URLs** - Avoid regenerating public URLs

## Monitoring

Track upload metrics:

```typescript
const startTime = Date.now();
const result = await storage.uploadFile(filePath);
const duration = Date.now() - startTime;

console.log({
  success: result.success,
  key: result.key,
  fileSize: fs.statSync(filePath).size,
  uploadDuration: duration,
  uploadSpeed: fs.statSync(filePath).size / (duration / 1000)
});
```

## Limitations

1. **File Size** - Max 5TB per file (S3), 5GB per request (R2)
2. **Rate Limits** - S3: 3,500 PUT/s, R2: varies
3. **Metadata Size** - Max 2KB per object
4. **Tag Limits** - Max 10 tags per object
5. **Key Length** - Max 1,024 characters

## Future Enhancements

- [ ] Multipart upload for large files (>100MB)
- [ ] Progress callbacks for long uploads
- [ ] Automatic retry with exponential backoff
- [ ] Content compression (gzip/brotli)
- [ ] Image optimization on upload
- [ ] CDN integration (CloudFront/Cloudflare)
- [ ] Storage analytics dashboard
- [ ] Cost estimation tools

## References

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK v3 for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/)
- [S3-compatible API](https://docs.aws.amazon.com/AmazonS3/latest/API/)

## Files Created

- `src/services/storage.ts` (580 lines) - Main storage service
- `scripts/test-storage.ts` (400 lines) - Test suite
- `docs/ADS-018-S3-R2-UPLOAD.md` - This documentation

## Related Features

- **ADS-007**: renderStill Service (render output files)
- **ADS-009**: Render Job Queue (job completion triggers)
- **ADS-010**: ZIP Export (local file organization)
- **ADS-017**: Webhook Notifications (upload status)
