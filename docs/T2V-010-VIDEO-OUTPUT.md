# T2V-010: Video Output Pipeline

**Status**: Complete
**Priority**: P0
**Effort**: 5pts
**Category**: text-to-video

## Overview

The Video Output Pipeline provides comprehensive video handling utilities for the AI Video Platform. This utility handles all aspects of video export, including encoding, format conversion, metadata extraction, thumbnail generation, and validation.

## Features

### Core Functionality

1. **Video Saving**
   - Save video buffers with proper encoding
   - Raw save (no re-encoding) for performance
   - Automatic directory creation
   - Overwrite protection

2. **Quality Presets**
   - **Draft**: Fast encoding (CRF 28, ultrafast)
   - **Standard**: Balanced quality/speed (CRF 23, medium)
   - **High**: High quality (CRF 18, slow)
   - **Max**: Maximum quality (CRF 15, veryslow)

3. **Format Support**
   - MP4 (default)
   - MOV
   - WebM
   - AVI

4. **Codec Options**
   - H.264 (libx264) - Default, best compatibility
   - H.265 (libx265) - Better compression
   - VP9 (libvpx-vp9) - WebM format
   - ProRes - Professional video

5. **Metadata Extraction**
   - Resolution (width x height)
   - Duration (seconds)
   - Frame rate (fps)
   - Codec information
   - Bitrate (kbps)
   - File size
   - Format details

6. **Thumbnail Generation**
   - Extract frames at specific timestamps
   - Multiple size options
   - Format support: JPG, PNG, WebP
   - Quality control

7. **Video Validation**
   - Format integrity checking
   - Dimension validation
   - Duration validation
   - Frame rate validation

8. **Batch Processing**
   - Process multiple videos with same config
   - Efficient parallel processing

## Installation Requirements

The Video Output Pipeline requires **ffmpeg** to be installed on your system:

### macOS
```bash
brew install ffmpeg
```

### Ubuntu/Debian
```bash
sudo apt-get install ffmpeg
```

### Windows
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

### Verify Installation
```bash
ffmpeg -version
```

## API Reference

### Save Video with Encoding

```typescript
import { saveVideo } from './src/utils/videoExport';

const outputPath = await saveVideo(videoBuffer, {
  outputPath: 'output/video.mp4',
  quality: 'high',
  codec: 'libx264',
  overwrite: true
});
```

**Parameters:**
- `videoBuffer`: Buffer containing video data
- `config.outputPath`: Output file path (required)
- `config.format`: Video format (default: 'mp4')
- `config.codec`: Video codec (default: 'libx264')
- `config.quality`: Quality preset (default: 'standard')
- `config.crf`: Custom CRF value (0-51, lower is better)
- `config.bitrate`: Custom bitrate (e.g., "2M", "5000k")
- `config.pixelFormat`: Pixel format (default: 'yuv420p')
- `config.additionalParams`: Extra ffmpeg parameters
- `config.overwrite`: Overwrite existing file (default: false)

**Returns:** Promise<string> - Path to saved video

### Save Video Raw (No Re-encoding)

```typescript
import { saveVideoRaw } from './src/utils/videoExport';

const outputPath = await saveVideoRaw(
  videoBuffer,
  'output/video.mp4',
  true // overwrite
);
```

Use this when video is already encoded and you just want to save it.

### Extract Metadata

```typescript
import { getVideoMetadata } from './src/utils/videoExport';

const metadata = await getVideoMetadata('output/video.mp4');

console.log(`Resolution: ${metadata.width}x${metadata.height}`);
console.log(`Duration: ${metadata.duration}s`);
console.log(`FPS: ${metadata.fps}`);
console.log(`Codec: ${metadata.codec}`);
console.log(`Bitrate: ${metadata.bitrate} kbps`);
console.log(`File Size: ${metadata.fileSize} bytes`);
```

**Returns:** VideoMetadata object with:
- `width`: number
- `height`: number
- `duration`: number (seconds)
- `fps`: number
- `codec`: string
- `bitrate`: number (kbps)
- `fileSize`: number (bytes)
- `format`: string

### Generate Thumbnail

```typescript
import { generateThumbnail } from './src/utils/videoExport';

const thumbnailPath = await generateThumbnail('output/video.mp4', {
  outputPath: 'output/thumbnail.jpg',
  timeSeconds: 1.0,
  width: 640,
  quality: 90
});
```

**Parameters:**
- `videoPath`: Path to source video
- `config.outputPath`: Output thumbnail path (required)
- `config.timeSeconds`: Time to capture (default: 0.5)
- `config.width`: Thumbnail width
- `config.height`: Thumbnail height
- `config.format`: Thumbnail format (default: 'jpg')
- `config.quality`: JPEG quality 1-100 (default: 85)

### Validate Video

```typescript
import { validateVideo } from './src/utils/videoExport';

try {
  await validateVideo('output/video.mp4');
  console.log('Video is valid');
} catch (error) {
  console.error('Video validation failed:', error);
}
```

### Convert Video Format

```typescript
import { convertVideo } from './src/utils/videoExport';

const converted = await convertVideo(
  'input.mov',
  'output.mp4',
  'mp4',
  { quality: 'high' }
);
```

### Batch Process Videos

```typescript
import { batchProcessVideos } from './src/utils/videoExport';

const results = await batchProcessVideos([
  { buffer: video1Buffer, outputPath: 'output/video1.mp4' },
  { buffer: video2Buffer, outputPath: 'output/video2.mp4' },
  { buffer: video3Buffer, outputPath: 'output/video3.mp4' }
], {
  quality: 'high',
  codec: 'libx264'
});
```

### Get File Size

```typescript
import { getVideoFileSize } from './src/utils/videoExport';

const size = getVideoFileSize('output/video.mp4');
console.log(`File size: ${size}`); // "5.2 MB"
```

### Create Export Config

```typescript
import { createExportConfig } from './src/utils/videoExport';

const config = createExportConfig({
  outputPath: 'output/video.mp4',
  quality: 'high',
  overwrite: true
});
```

## Usage Examples

### Example 1: Basic Video Export

```typescript
import { saveVideo } from './src/utils/videoExport';

// Generate video with T2V model
const videoBuffer = await generateVideoWithLTX({
  prompt: "Ocean waves at sunset"
});

// Save with standard quality
await saveVideo(videoBuffer, {
  outputPath: 'output/ocean-waves.mp4',
  quality: 'standard',
  overwrite: true
});
```

### Example 2: High-Quality Export with Custom Settings

```typescript
await saveVideo(videoBuffer, {
  outputPath: 'output/high-quality.mp4',
  quality: 'high',
  codec: 'libx264',
  crf: 18,
  pixelFormat: 'yuv420p',
  overwrite: true
});
```

### Example 3: Multiple Quality Versions

```typescript
const qualities = ['draft', 'standard', 'high'] as const;

for (const quality of qualities) {
  await saveVideo(videoBuffer, {
    outputPath: `output/video-${quality}.mp4`,
    quality,
    overwrite: true
  });
}
```

### Example 4: Complete Workflow

```typescript
import {
  saveVideo,
  getVideoMetadata,
  generateThumbnail,
  validateVideo
} from './src/utils/videoExport';

// 1. Save video
const videoPath = await saveVideo(videoBuffer, {
  outputPath: 'output/final.mp4',
  quality: 'high',
  overwrite: true
});

// 2. Validate
await validateVideo(videoPath);

// 3. Get metadata
const metadata = await getVideoMetadata(videoPath);
console.log(`Video: ${metadata.width}x${metadata.height}, ${metadata.duration}s`);

// 4. Generate thumbnail
await generateThumbnail(videoPath, {
  outputPath: 'output/final-thumb.jpg',
  timeSeconds: metadata.duration / 2, // Middle of video
  width: 640,
  quality: 90
});
```

### Example 5: H.265 Export for Smaller File Sizes

```typescript
await saveVideo(videoBuffer, {
  outputPath: 'output/compressed.mp4',
  codec: 'libx265',
  quality: 'high',
  overwrite: true
});

// Compare file sizes
const h264Size = getVideoFileSize('output/high-quality.mp4');
const h265Size = getVideoFileSize('output/compressed.mp4');
console.log(`H.264: ${h264Size}, H.265: ${h265Size}`);
```

## Integration with T2V Router

The Video Output Pipeline integrates seamlessly with the T2V Router:

```typescript
import { generateVideo } from './src/services/textToVideo';
import { saveVideo, generateThumbnail } from './src/utils/videoExport';

// Generate video with any T2V model
const response = await generateVideo('mochi', {
  prompt: 'Cinematic city at night',
  fps: 30
});

// Save with high quality
const videoPath = await saveVideo(response.video, {
  outputPath: 'output/city-night.mp4',
  quality: 'high',
  overwrite: true
});

// Generate thumbnail
await generateThumbnail(videoPath, {
  outputPath: 'output/city-night-thumb.jpg',
  width: 640
});

console.log(`Video saved: ${videoPath}`);
console.log(`Model: ${response.model}`);
console.log(`Metadata: ${response.metadata.width}x${response.metadata.height}`);
```

## CLI Testing

Test the video export functionality using the provided test script:

```bash
# Run all tests
npm run test-video-export

# Test specific functionality
npm run test-video-export metadata test_ltx_output.mp4
npm run test-video-export thumbnail output/video.mp4
npm run test-video-export quality
npm run test-video-export custom

# Show help
npm run test-video-export help
```

## Quality Presets Comparison

| Preset | CRF | Encoding Speed | File Size | Use Case |
|--------|-----|---------------|-----------|----------|
| Draft | 28 | Ultrafast | Smallest | Quick previews, testing |
| Standard | 23 | Medium | Medium | General use, sharing |
| High | 18 | Slow | Large | Professional output |
| Max | 15 | Very Slow | Largest | Archive, master copy |

## Codec Comparison

| Codec | Compression | Quality | Compatibility | Speed |
|-------|-------------|---------|---------------|-------|
| H.264 (libx264) | Good | Excellent | Universal | Fast |
| H.265 (libx265) | Excellent | Excellent | Modern devices | Slower |
| VP9 (libvpx-vp9) | Excellent | Good | Web browsers | Slow |
| ProRes | Low | Excellent | Professional | Fast |

## Performance Considerations

### Encoding Speed vs Quality

- **Draft preset**: ~2-5x faster than standard
- **High preset**: ~2-3x slower than standard
- **Max preset**: ~4-6x slower than standard

### File Size

CRF values affect file size significantly:
- CRF 28 (draft): ~50% smaller than CRF 23
- CRF 18 (high): ~50% larger than CRF 23
- CRF 15 (max): ~100% larger than CRF 23

### Recommendations

**For Development/Testing:**
- Use `saveVideoRaw()` or `draft` preset
- Skip thumbnail generation
- Use smaller resolutions

**For Production:**
- Use `standard` or `high` preset
- Generate thumbnails at multiple sizes
- Validate videos before delivery

**For Archival:**
- Use `max` preset with H.265 codec
- Keep original buffer as backup
- Generate comprehensive metadata

## Error Handling

```typescript
try {
  await saveVideo(videoBuffer, {
    outputPath: 'output/video.mp4',
    quality: 'high'
  });
} catch (error) {
  if (error.message.includes('ffmpeg not installed')) {
    console.error('Please install ffmpeg first');
  } else if (error.message.includes('File already exists')) {
    console.error('Use overwrite: true to replace existing file');
  } else {
    console.error('Video export failed:', error);
  }
}
```

## Common Issues

### Issue: ffmpeg not found

**Solution:**
```bash
# Install ffmpeg
brew install ffmpeg  # macOS
sudo apt-get install ffmpeg  # Linux

# Verify installation
ffmpeg -version
```

### Issue: H.265 encoding fails

**Solution:**
Some ffmpeg builds don't include H.265 support. Use H.264 instead or rebuild ffmpeg with libx265.

### Issue: Large file sizes

**Solutions:**
1. Use higher CRF value (lower quality)
2. Use H.265 codec
3. Specify custom bitrate
4. Reduce resolution

### Issue: Slow encoding

**Solutions:**
1. Use faster preset (draft or standard)
2. Use H.264 instead of H.265/VP9
3. Reduce resolution or frame count
4. Use `saveVideoRaw()` if no re-encoding needed

## Files

### Implementation
- `src/utils/videoExport.ts` - Main video export utility (600+ lines)

### Testing
- `scripts/test-video-export.ts` - Comprehensive test suite (500+ lines)

### Configuration
- `package.json` - Added `test-video-export` npm script

### Documentation
- `docs/T2V-010-VIDEO-OUTPUT.md` - This file

## Progress

**Feature Status**: Complete
**Implementation Date**: 2026-01-28
**Total Features**: 30/106 (28.3%)
**Phase 4 Progress**: 8/10 (80%)

## Next Steps

Remaining Phase 4 features:
- **T2V-008**: T2V Web Endpoint (P1, 8pts)
- **T2V-009**: T2V CLI Interface (P1, 5pts)

## Technical Notes

### Dependencies
- Node.js built-in modules: `fs`, `path`, `child_process`, `util`
- External requirement: ffmpeg (system-level)

### Video Encoding Details

**Pixel Format (yuv420p)**:
- Maximum compatibility across devices
- Supported by all browsers and media players
- Required for QuickTime and many mobile devices

**CRF (Constant Rate Factor)**:
- 0 = Lossless (huge files)
- 17-18 = Visually lossless
- 23 = Default, good quality
- 28 = Lower quality, smaller files
- 51 = Worst quality

**Preset (encoding speed)**:
- ultrafast, superfast, veryfast, faster, fast
- medium (default)
- slow, slower, veryslow

### Audio Handling

By default, audio is:
- Encoded with AAC codec
- 128 kbps bitrate
- Copied if present in source
- Omitted if not present

Custom audio encoding:
```typescript
await saveVideo(videoBuffer, {
  outputPath: 'output/video.mp4',
  additionalParams: ['-c:a', 'libmp3lame', '-b:a', '192k']
});
```

## See Also

- [T2V-001: LTX-Video Modal Deployment](./T2V-001-LTX-VIDEO.md)
- [T2V-006: T2V API Router](./T2V-006-API-ROUTER.md)
- [T2V-007: Model Weight Caching](./T2V-007-MODEL-CACHING.md)
