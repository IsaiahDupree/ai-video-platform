# Assets Directory Structure

This directory contains all media assets used in video compositions.

## Directory Organization

### `/audio`
Generated voiceover audio files for video sections.

**Naming convention:** `{brief-title}-{section-id}.mp3`

Example:
- `example-product-video-intro.mp3`
- `example-product-video-topic1.mp3`

**Generation:**
```bash
npm run generate-tts data/briefs/example-video.json
```

### `/images`
Generic images and graphics for use across videos.

**Supported formats:** PNG, JPG, JPEG, WebP, SVG

### `/scenes`
AI-generated scene backgrounds and visual content.

**Naming convention:** `{brief-title}-{section-id}.png`

Example:
- `example-product-video-intro.png`
- `example-product-video-topic1.png`

**Generation:**
```bash
npm run generate-images data/briefs/example-video.json
```

### `/voices`
Voice reference files for voice cloning.

**Naming convention:** `{voice-name}-reference.mp3`

Example:
- `professional-female-reference.mp3`
- `casual-male-reference.mp3`

**Generation:**
```bash
npm run generate-voice-with-elevenlabs -- --voice nova --text "Sample text" --output public/assets/voices/custom-voice.mp3
```

## Usage in Briefs

Reference assets in your content briefs using relative paths:

```json
{
  "sections": [
    {
      "id": "intro",
      "image": {
        "src": "/assets/scenes/example-product-video-intro.png",
        "fit": "cover"
      },
      "voiceover": "Welcome to our product"
    }
  ]
}
```

## Asset Management Tips

1. **Keep organized:** Use consistent naming conventions
2. **Version control:** Consider using Git LFS for large media files
3. **Optimize images:** Compress images before adding to reduce bundle size
4. **Audio quality:** Use 128kbps or higher for voiceovers
5. **File formats:**
   - Images: PNG for transparency, JPG for photos
   - Audio: MP3 for compatibility
   - Video: MP4 with H.264 codec

## Automated Generation

All assets can be generated programmatically from content briefs:

```bash
# Generate all assets for a brief
npm run generate-tts data/briefs/example-video.json
npm run generate-images data/briefs/example-video.json

# Render final video
npm run render data/briefs/example-video.json
```
