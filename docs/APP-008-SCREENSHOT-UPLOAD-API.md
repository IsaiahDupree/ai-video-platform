# APP-008: Screenshot Upload API

## Overview

Comprehensive service for uploading and managing screenshots in App Store Connect. Handles the complete upload workflow including screenshot set management, file uploads, and batch operations.

## Features

- **Screenshot Set Management**: Create and manage screenshot sets for different device types
- **Single Upload**: Upload individual screenshots with automatic checksum calculation
- **Batch Upload**: Upload multiple screenshots at once
- **Replace Screenshots**: Replace all screenshots in a set
- **Find or Create**: Automatically find existing sets or create new ones
- **Full CRUD**: Complete create, read, update, delete operations
- **Error Handling**: Comprehensive error handling with detailed messages
- **Type Safety**: Full TypeScript types for all operations

## Quick Start

### 1. Upload a Single Screenshot

```typescript
import { uploadScreenshot } from '@/services/ascScreenshots';
import { readFile } from 'fs/promises';

// Load screenshot file
const filePath = 'screenshot.png';
const fileBuffer = await readFile(filePath);

// Upload to screenshot set
const result = await uploadScreenshot({
  appScreenshotSetId: 'screenshot-set-id',
  fileName: 'screenshot.png',
  fileSize: fileBuffer.length,
  file: fileBuffer, // or file path as string
});

if (result.success) {
  console.log('Screenshot uploaded:', result.screenshotId);
  console.log('Screenshot info:', result.screenshot);
} else {
  console.error('Upload failed:', result.error);
}
```

### 2. Upload Multiple Screenshots

```typescript
import { uploadScreenshots } from '@/services/ascScreenshots';

const screenshots = [
  { fileName: 'screenshot1.png', fileSize: 1024000, file: buffer1 },
  { fileName: 'screenshot2.png', fileSize: 1024000, file: buffer2 },
  { fileName: 'screenshot3.png', fileSize: 1024000, file: buffer3 },
];

const result = await uploadScreenshots('screenshot-set-id', screenshots);

console.log(`Uploaded: ${result.uploaded}, Failed: ${result.failed}`);
console.log('Screenshot set:', result.screenshotSet);
```

### 3. Find or Create Screenshot Set

```typescript
import { findOrCreateScreenshotSet } from '@/services/ascScreenshots';

// Automatically finds existing set or creates new one
const screenshotSet = await findOrCreateScreenshotSet(
  'localization-id',
  'APP_IPHONE_67' // Display type
);

console.log('Screenshot set ID:', screenshotSet.id);
```

## API Reference

### Screenshot Set Operations

#### `createScreenshotSet(options, credentials?)`

Create a new screenshot set for a specific device type.

```typescript
import { createScreenshotSet } from '@/services/ascScreenshots';

const screenshotSet = await createScreenshotSet({
  appStoreVersionLocalizationId: 'localization-id',
  screenshotDisplayType: 'APP_IPHONE_67',
});
```

**Parameters:**
- `options.appStoreVersionLocalizationId`: App Store version localization ID
- `options.screenshotDisplayType`: Device type (e.g., `APP_IPHONE_67`)
- `credentials`: Optional ASC credentials

**Returns:** `AppScreenshotSet`

#### `getScreenshotSet(screenshotSetId, credentials?)`

Get a screenshot set by ID.

```typescript
const screenshotSet = await getScreenshotSet('screenshot-set-id');
```

#### `listScreenshotSets(options, credentials?)`

List all screenshot sets for a localization.

```typescript
const response = await listScreenshotSets({
  appStoreVersionLocalizationId: 'localization-id',
  filterScreenshotDisplayType: 'APP_IPHONE_67', // Optional
  include: ['appScreenshots'], // Optional
  limit: 10, // Optional
});
```

#### `deleteScreenshotSet(options, credentials?)`

Delete a screenshot set.

```typescript
await deleteScreenshotSet({ screenshotSetId: 'screenshot-set-id' });
```

#### `findOrCreateScreenshotSet(localizationId, displayType, credentials?)`

Find existing screenshot set or create new one.

```typescript
const screenshotSet = await findOrCreateScreenshotSet(
  'localization-id',
  'APP_IPHONE_67'
);
```

#### `getAllScreenshotSets(localizationId, credentials?)`

Get all screenshot sets for a localization with screenshots.

```typescript
const sets = await getAllScreenshotSets('localization-id');

sets.forEach((set) => {
  console.log(`${set.displayType}: ${set.screenshotCount} screenshots`);
});
```

#### `clearScreenshotSet(screenshotSetId, credentials?)`

Delete all screenshots in a set (keeps the set).

```typescript
await clearScreenshotSet('screenshot-set-id');
```

### Screenshot Operations

#### `createScreenshot(options, credentials?)`

Create a screenshot (reserve slot before upload).

```typescript
const screenshot = await createScreenshot({
  appScreenshotSetId: 'screenshot-set-id',
  fileName: 'screenshot.png',
  fileSize: 1024000,
  file: buffer, // or file path
});

// Screenshot includes upload operations
const uploadOp = screenshot.attributes.uploadOperations[0];
```

#### `getScreenshot(screenshotId, credentials?)`

Get a screenshot by ID.

```typescript
const screenshot = await getScreenshot('screenshot-id');
```

#### `listScreenshots(options, credentials?)`

List screenshots in a screenshot set.

```typescript
const response = await listScreenshots({
  appScreenshotSetId: 'screenshot-set-id',
  include: ['appScreenshotSet'], // Optional
  limit: 10, // Optional
});
```

#### `deleteScreenshot(options, credentials?)`

Delete a screenshot.

```typescript
await deleteScreenshot({ screenshotId: 'screenshot-id' });
```

### Upload Operations

#### `uploadScreenshot(options, credentials?)`

Upload a screenshot (high-level function that handles entire flow).

```typescript
const result = await uploadScreenshot({
  appScreenshotSetId: 'screenshot-set-id',
  fileName: 'screenshot.png',
  fileSize: 1024000,
  file: buffer, // Buffer or file path
});

if (result.success) {
  console.log('Uploaded:', result.screenshotId);
} else {
  console.error('Failed:', result.error);
}
```

**Workflow:**
1. Creates screenshot (reserves slot)
2. Uploads file data to provided URL
3. Commits upload with checksum
4. Returns result with screenshot info

**Returns:** `UploadScreenshotResult`

#### `uploadScreenshots(screenshotSetId, screenshots, credentials?)`

Upload multiple screenshots to a set.

```typescript
const result = await uploadScreenshots('screenshot-set-id', [
  { fileName: 'screenshot1.png', fileSize: 1024000, file: buffer1 },
  { fileName: 'screenshot2.png', fileSize: 1024000, file: buffer2 },
]);

console.log(`Success: ${result.uploaded}/${result.uploaded + result.failed}`);
```

**Returns:** `BatchUploadResult`

#### `replaceScreenshots(screenshotSetId, screenshots, credentials?)`

Replace all screenshots in a set.

```typescript
const result = await replaceScreenshots('screenshot-set-id', [
  { fileName: 'screenshot1.png', fileSize: 1024000, file: buffer1 },
  { fileName: 'screenshot2.png', fileSize: 1024000, file: buffer2 },
]);
```

**Workflow:**
1. Deletes all existing screenshots
2. Uploads new screenshots
3. Returns batch result

### Low-Level Operations

#### `uploadScreenshotData(options)`

Upload screenshot data to the reserved upload URL (low-level).

```typescript
await uploadScreenshotData({
  screenshotId: 'screenshot-id',
  uploadOperation: {
    method: 'PUT',
    url: 'https://upload.url',
    requestHeaders: [{ name: 'Content-Type', value: 'image/png' }],
  },
  fileData: buffer,
});
```

#### `commitScreenshot(options, credentials?)`

Commit screenshot upload (mark as uploaded).

```typescript
const screenshot = await commitScreenshot({
  screenshotId: 'screenshot-id',
  uploaded: true,
  sourceFileChecksum: 'abc123', // Optional MD5 checksum
});
```

### Utility Functions

#### `calculateChecksum(buffer)`

Calculate MD5 checksum of a buffer.

```typescript
import { calculateChecksum } from '@/services/ascScreenshots';

const checksum = calculateChecksum(buffer);
console.log('MD5:', checksum); // 32-character hex string
```

#### `toScreenshotInfo(screenshot)`

Convert AppScreenshot to simplified ScreenshotInfo.

```typescript
import { toScreenshotInfo } from '@/services/ascScreenshots';

const info = toScreenshotInfo(screenshot);
console.log(info.fileName, info.fileSize, info.state);
```

#### `toScreenshotSetInfo(screenshotSet)`

Convert AppScreenshotSet to simplified ScreenshotSetInfo.

```typescript
import { toScreenshotSetInfo } from '@/services/ascScreenshots';

const info = toScreenshotSetInfo(screenshotSet);
console.log(info.displayType, info.screenshotCount);
```

## Display Types

Screenshots are organized by device type (display type). Each device type has specific dimension requirements.

### iPhone Display Types

- `APP_IPHONE_67`: iPhone 17 Pro Max / 16 Pro Max (6.7") - 1290×2796
- `APP_IPHONE_65`: iPhone 16 Plus / 15 Plus / 14 Plus (6.5") - 1242×2688
- `APP_IPHONE_61`: iPhone 15 / 14 / 13 / 12 (6.1") - 1170×2532
- `APP_IPHONE_58`: iPhone 11 Pro / XS / X (5.8") - 1125×2436
- `APP_IPHONE_55`: iPhone 8 Plus / 7 Plus (5.5") - 1242×2208
- `APP_IPHONE_47`: iPhone SE (4.7") - 750×1334
- `APP_IPHONE_40`: iPhone SE (4.0") - 640×1136
- `APP_IPHONE_35`: iPhone 4s (3.5") - 640×920

### iPad Display Types

- `APP_IPAD_PRO_3GEN_129`: iPad Pro 12.9" (3rd gen+) - 2048×2732
- `APP_IPAD_PRO_3GEN_11`: iPad Pro 11" - 1668×2388
- `APP_IPAD_PRO_129`: iPad Pro 12.9" (1st/2nd gen) - 2048×2732
- `APP_IPAD_105`: iPad 10.5" - 1668×2224
- `APP_IPAD_97`: iPad 9.7" - 1536×2048

### Apple Watch Display Types

- `APP_WATCH_ULTRA`: Apple Watch Ultra (49mm) - 410×502
- `APP_WATCH_SERIES_7`: Apple Watch Series 7+ (45mm) - 396×484
- `APP_WATCH_SERIES_4`: Apple Watch Series 4-6 (44mm) - 368×448
- `APP_WATCH_SERIES_3`: Apple Watch Series 3 (42mm) - 312×390

### Other Display Types

- `APP_APPLE_TV`: Apple TV - 1920×1080
- `APP_DESKTOP`: Mac - 2560×1600 (minimum)
- `APP_VISION_PRO`: Apple Vision Pro - 3840×2160

## Upload Workflow

The complete screenshot upload workflow consists of four steps:

### Step 1: Create Screenshot Set (if needed)

```typescript
const screenshotSet = await findOrCreateScreenshotSet(
  'localization-id',
  'APP_IPHONE_67'
);
```

### Step 2: Reserve Screenshot Slot

```typescript
const screenshot = await createScreenshot({
  appScreenshotSetId: screenshotSet.id,
  fileName: 'screenshot.png',
  fileSize: fileBuffer.length,
  file: fileBuffer,
});
```

This returns upload operations with:
- Upload URL
- HTTP method (usually PUT)
- Required headers
- Content length

### Step 3: Upload File Data

```typescript
await uploadScreenshotData({
  screenshotId: screenshot.id,
  uploadOperation: screenshot.attributes.uploadOperations[0],
  fileData: fileBuffer,
});
```

This uploads the actual file to the provided URL.

### Step 4: Commit Upload

```typescript
const checksum = calculateChecksum(fileBuffer);

await commitScreenshot({
  screenshotId: screenshot.id,
  uploaded: true,
  sourceFileChecksum: checksum,
});
```

This marks the upload as complete and triggers processing.

## High-Level Functions

For convenience, use the high-level `uploadScreenshot()` function that handles all steps:

```typescript
const result = await uploadScreenshot({
  appScreenshotSetId: 'screenshot-set-id',
  fileName: 'screenshot.png',
  fileSize: 1024000,
  file: buffer,
});
```

## Error Handling

All functions include comprehensive error handling:

```typescript
const result = await uploadScreenshot({
  appScreenshotSetId: 'screenshot-set-id',
  fileName: 'screenshot.png',
  fileSize: 1024000,
  file: buffer,
});

if (!result.success) {
  console.error('Upload failed:', result.error);
  // Handle error (e.g., retry, log, notify user)
}
```

Common errors:
- File size mismatch
- Missing upload operations
- Network errors during upload
- Invalid credentials
- API rate limits

## Complete Example

```typescript
import { readFile } from 'fs/promises';
import {
  findOrCreateScreenshotSet,
  uploadScreenshots,
  getAllScreenshotSets,
} from '@/services/ascScreenshots';

async function uploadAppScreenshots() {
  // Step 1: Find or create screenshot sets for different device types
  const iphoneSet = await findOrCreateScreenshotSet(
    'localization-id',
    'APP_IPHONE_67'
  );

  const ipadSet = await findOrCreateScreenshotSet(
    'localization-id',
    'APP_IPAD_PRO_3GEN_129'
  );

  // Step 2: Load screenshot files
  const iphoneScreenshots = [
    {
      fileName: 'iphone-1.png',
      fileSize: (await readFile('iphone-1.png')).length,
      file: await readFile('iphone-1.png'),
    },
    {
      fileName: 'iphone-2.png',
      fileSize: (await readFile('iphone-2.png')).length,
      file: await readFile('iphone-2.png'),
    },
  ];

  // Step 3: Upload screenshots
  const iphoneResult = await uploadScreenshots(iphoneSet.id, iphoneScreenshots);

  console.log(`iPhone: ${iphoneResult.uploaded} uploaded, ${iphoneResult.failed} failed`);

  // Step 4: Get all screenshot sets with details
  const allSets = await getAllScreenshotSets('localization-id');

  allSets.forEach((set) => {
    console.log(`${set.displayType}: ${set.screenshotCount} screenshots`);
    set.screenshots.forEach((screenshot) => {
      console.log(`  - ${screenshot.fileName} (${screenshot.state})`);
    });
  });
}

uploadAppScreenshots().catch(console.error);
```

## Integration with Asset Library

Screenshot upload integrates seamlessly with APP-005 (Asset Library):

```typescript
import { uploadAsset } from '@/services/assetLibrary';
import { uploadScreenshot } from '@/services/ascScreenshots';

// Step 1: Upload to Asset Library (for version history)
const asset = await uploadAsset({
  appId: 'app-id',
  file: screenshotPath,
  metadata: {
    type: 'screenshot',
    deviceType: 'iphone-67',
    locale: 'en-US',
    status: 'draft',
  },
});

// Step 2: Upload to App Store Connect
const result = await uploadScreenshot({
  appScreenshotSetId: 'screenshot-set-id',
  fileName: asset.name,
  fileSize: asset.fileSize,
  file: screenshotPath,
});

// Step 3: Update asset status
if (result.success) {
  await updateAsset({
    assetId: asset.id,
    status: 'published',
    metadata: {
      ascScreenshotId: result.screenshotId,
    },
  });
}
```

## Testing

Run the comprehensive test suite:

```bash
npm run test-asc-screenshots
```

The test suite includes 22 tests covering:
- Screenshot set CRUD operations
- Screenshot CRUD operations
- Upload workflow
- Batch operations
- Error handling
- Type conversions
- Display type validation

## Performance

- **Single upload**: ~2-5 seconds per screenshot (network dependent)
- **Batch upload**: Sequential uploads, ~2-5 seconds per screenshot
- **Checksum calculation**: <1ms for typical screenshots
- **API requests**: ~100-500ms per request

## Best Practices

1. **Use high-level functions**: Prefer `uploadScreenshot()` over low-level operations
2. **Batch uploads**: Use `uploadScreenshots()` for multiple files
3. **Find or create**: Use `findOrCreateScreenshotSet()` to avoid duplicates
4. **Error handling**: Always check `result.success` before proceeding
5. **File validation**: Verify file size and dimensions before upload
6. **Checksum**: Include checksum for data integrity verification
7. **Asset Library**: Store originals in Asset Library for version history
8. **Display types**: Use correct display type for each device
9. **Credentials**: Store credentials securely, never commit to version control
10. **Rate limits**: Respect App Store Connect API rate limits

## Troubleshooting

### File size mismatch
```
Error: File size mismatch: expected 1024000, got 1024512
```
**Solution**: Ensure `fileSize` parameter matches actual file buffer length.

### No upload operations
```
Error: No upload operations returned from API
```
**Solution**: Check screenshot set ID and credentials. Verify localization exists.

### Upload failed
```
Error: Failed to upload screenshot data: 403 Forbidden
```
**Solution**: Check upload URL expiration. Retry with fresh upload operation.

### Invalid display type
```
Error: Invalid screenshot display type
```
**Solution**: Use valid display type from `ScreenshotDisplayType` enum.

## Resources

- [App Store Connect API Reference](https://developer.apple.com/documentation/appstoreconnectapi)
- [Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)
- [App Store Connect API Keys](https://appstoreconnect.apple.com/access/api)
- APP-006: App Store Connect OAuth (authentication)
- APP-005: Asset Library (version history)
- APP-007: App List Fetcher (get app IDs)

## Related Features

- **APP-006**: App Store Connect OAuth - Authentication
- **APP-007**: App List Fetcher - Get app IDs
- **APP-005**: Asset Library - Store originals with version history
- **APP-009**: App Preview Upload API - Upload videos (coming next)
- **APP-010**: Custom Product Page Creator - Use uploaded screenshots

## Next Steps

After implementing screenshot upload, you can:

1. Upload app preview videos (APP-009)
2. Create custom product pages (APP-010)
3. Manage localizations across multiple languages
4. Set up automated upload pipelines
5. Integrate with CI/CD for continuous deployment

---

**Status**: ✅ Complete (Session 44)
**Tests**: 22/22 passing (100%)
**Dependencies**: APP-006 (App Store Connect OAuth)
**Lines of Code**: ~1,100
