# APP-023: App Preview Video Generator

**Status:** ✅ Implemented
**Category:** apple-pages
**Priority:** P2
**Effort:** 13pts

## Overview

Create App Store preview videos with device frames, captions, and overlays using Remotion. This feature allows you to generate professional app preview videos that can be submitted to the App Store.

## Features

- **Device Frame Support**: Render videos with realistic iPhone, iPad, Mac, or Watch frames
- **Multiple Scenes**: Compose videos from multiple scenes with different screenshots/videos
- **Text Captions**: Add animated text overlays with positioning and styling
- **Transitions**: Smooth transitions between scenes (fade, slide, zoom)
- **Animations**: Device frame animations (slide, zoom, rotate)
- **Background Customization**: Solid colors, gradients, or images
- **Audio Support**: Background music and voiceover
- **Flexible Export**: MP4, MOV, or WebM output

## Architecture

### Components

```
src/
├── types/
│   └── appPreview.ts              # TypeScript types and interfaces
├── compositions/
│   └── appPreview/
│       ├── AppPreviewComposition.tsx  # Main composition component
│       └── index.ts                   # Exports
└── components/
    ├── DeviceFrame.tsx               # Device frame rendering (APP-001)
    └── CaptionOverlay.tsx            # Caption rendering (APP-002)
```

### Data Structure

```
data/
└── appPreviews/
    └── example-app-preview.json   # Example configuration
```

## Usage

### 1. Create an App Preview Config

Create a JSON configuration file in `data/appPreviews/`:

```json
{
  "id": "my-app-preview",
  "title": "My App Preview",
  "description": "A preview video for my app",
  "dimensions": {
    "width": 1080,
    "height": 1920
  },
  "fps": 30,
  "device": {
    "model": "iphone-16-pro-max",
    "orientation": "portrait",
    "showFrame": true,
    "frameColor": "#1d1d1f",
    "shadow": true
  },
  "background": {
    "gradient": {
      "type": "linear",
      "colors": ["#667eea", "#764ba2"],
      "angle": 135
    }
  },
  "scenes": [
    {
      "id": "scene-1",
      "durationInFrames": 90,
      "content": {
        "src": "assets/screenshots/home.png",
        "type": "image",
        "fit": "cover"
      },
      "captions": [
        {
          "id": "caption-1",
          "text": "Welcome",
          "positioning": {
            "position": "top-center",
            "offsetY": 100
          },
          "style": {
            "fontSize": 48,
            "fontWeight": 700,
            "color": "#ffffff"
          }
        }
      ],
      "animation": {
        "type": "slide-up",
        "duration": 30,
        "easing": "ease-out"
      },
      "transition": {
        "type": "fade",
        "duration": 15
      }
    }
  ]
}
```

### 2. Register Composition in Root.tsx

The composition is automatically registered in `src/Root.tsx`. To add more compositions:

```tsx
import myAppPreview from '../data/appPreviews/my-app-preview.json';

// Calculate duration
const myAppPreviewDuration = (myAppPreview as AppPreviewConfig).scenes.reduce(
  (acc, scene) => acc + scene.durationInFrames,
  0
);

// Register composition
<Composition
  id="MyAppPreview"
  component={AppPreviewComposition}
  durationInFrames={myAppPreviewDuration}
  fps={(myAppPreview as AppPreviewConfig).fps || 30}
  width={(myAppPreview as AppPreviewConfig).dimensions?.width || 1080}
  height={(myAppPreview as AppPreviewConfig).dimensions?.height || 1920}
  defaultProps={{
    config: myAppPreview as AppPreviewConfig,
  }}
/>
```

### 3. Test and Validate

Test your configuration without rendering:

```bash
npm run test:app-preview
```

Test with a custom config:

```bash
npm run test:app-preview -- --config data/appPreviews/my-app-preview.json
```

### 4. Render the Video

Render the video to MP4:

```bash
npm run test:app-preview -- --render
```

Output will be saved to `output/app-previews/{id}.mp4`.

## Configuration Reference

### AppPreviewConfig

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `title` | string | Yes | Video title |
| `description` | string | No | Video description |
| `dimensions` | object | No | Width and height (defaults to device dimensions) |
| `fps` | number | No | Frame rate (default: 30) |
| `device` | object | Yes | Device configuration |
| `background` | object | No | Background styling |
| `scenes` | array | Yes | Array of scenes |
| `audio` | object | No | Audio configuration |
| `export` | object | No | Export settings |
| `metadata` | object | No | App metadata |

### Device Configuration

```typescript
{
  model: DeviceModel;           // e.g., "iphone-16-pro-max"
  orientation: "portrait" | "landscape";
  showFrame: boolean;           // Show device frame or just content
  frameColor?: string;          // Frame color (default: #1d1d1f)
  shadow?: boolean;             // Drop shadow (default: true)
}
```

### Scene Configuration

```typescript
{
  id: string;
  durationInFrames: number;
  content: {
    src: string;                // Path to image/video
    type: "image" | "video";
    fit?: "cover" | "contain" | "fill";
    startFrom?: number;         // For videos (in frames)
    playbackRate?: number;      // Video speed multiplier
  };
  captions?: CaptionConfig[];   // Text overlays
  animation?: {
    type: "slide-up" | "slide-down" | "slide-left" | "slide-right" |
          "zoom-in" | "zoom-out" | "rotate" | "none";
    duration?: number;          // Animation duration (frames)
    delay?: number;             // Delay before animation (frames)
    easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring";
  };
  transition?: {
    type: "fade" | "slide" | "zoom" | "none";
    duration: number;           // Transition duration (frames)
    easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  };
}
```

### Background Configuration

```typescript
{
  color?: string;               // Solid color
  gradient?: {
    type: "linear" | "radial";
    colors: string[];           // Array of colors
    angle?: number;             // For linear (degrees)
  };
  media?: string;               // Background image/video
  blur?: number;                // Blur amount
  opacity?: number;             // 0-1
}
```

## Animation Types

### Device Frame Animations

- **slide-up**: Slide in from bottom
- **slide-down**: Slide in from top
- **slide-left**: Slide in from right
- **slide-right**: Slide in from left
- **zoom-in**: Zoom in from small to normal
- **zoom-out**: Zoom out from large to normal
- **rotate**: Rotate in from 180°
- **none**: No animation

### Scene Transitions

- **fade**: Crossfade between scenes
- **slide**: Slide to next scene
- **zoom**: Zoom transition
- **none**: Hard cut

## Best Practices

### 1. Video Dimensions

App Store preview video requirements:
- **iPhone**: 1080 x 1920 (portrait) or 1920 x 1080 (landscape)
- **iPad**: 1200 x 1600 (portrait) or 1600 x 1200 (landscape)

### 2. Duration Guidelines

- Total video length: 15-30 seconds
- Scene duration: 2-4 seconds (60-120 frames at 30fps)
- Animation duration: 0.5-1 second (15-30 frames)
- Transition duration: 0.25-0.5 seconds (8-15 frames)

### 3. Caption Placement

- Avoid placing captions too close to device edges
- Use contrasting colors for readability
- Consider safe areas (100px from edges)
- Test on different devices and sizes

### 4. Asset Preparation

- Screenshots: Use high-resolution images (2x or 3x device resolution)
- Videos: Pre-render at target resolution
- Audio: Use AAC format, 128-256 kbps
- Music volume: Keep at 0.2-0.4 to not overpower voiceover

### 5. Performance Optimization

- Use images instead of videos when possible
- Keep scene count under 5-7 for 15-30s videos
- Limit caption count to 1-2 per scene
- Avoid complex animations on every scene

## Examples

### Example 1: Simple Product Showcase

```json
{
  "id": "product-showcase",
  "title": "Product Showcase",
  "fps": 30,
  "device": {
    "model": "iphone-16-pro-max",
    "orientation": "portrait",
    "showFrame": true
  },
  "scenes": [
    {
      "id": "hero",
      "durationInFrames": 90,
      "content": { "src": "assets/hero.png", "type": "image" },
      "animation": { "type": "zoom-in", "duration": 30 },
      "captions": [
        {
          "id": "title",
          "text": "Discover New Features",
          "positioning": { "position": "top-center", "offsetY": 120 },
          "style": { "fontSize": 52, "fontWeight": 800, "color": "#ffffff" }
        }
      ]
    }
  ]
}
```

### Example 2: Multi-Scene Tutorial

```json
{
  "id": "tutorial",
  "title": "App Tutorial",
  "fps": 30,
  "device": {
    "model": "iphone-16-pro-max",
    "orientation": "portrait",
    "showFrame": true
  },
  "scenes": [
    {
      "id": "step1",
      "durationInFrames": 75,
      "content": { "src": "assets/step1.png", "type": "image" },
      "captions": [
        {
          "id": "step1-caption",
          "text": "Step 1: Sign In",
          "positioning": { "position": "bottom-center", "offsetY": 150 }
        }
      ],
      "transition": { "type": "fade", "duration": 15 }
    },
    {
      "id": "step2",
      "durationInFrames": 75,
      "content": { "src": "assets/step2.png", "type": "image" },
      "captions": [
        {
          "id": "step2-caption",
          "text": "Step 2: Add Content",
          "positioning": { "position": "bottom-center", "offsetY": 150 }
        }
      ],
      "transition": { "type": "fade", "duration": 15 }
    },
    {
      "id": "step3",
      "durationInFrames": 75,
      "content": { "src": "assets/step3.png", "type": "image" },
      "captions": [
        {
          "id": "step3-caption",
          "text": "Step 3: Share!",
          "positioning": { "position": "bottom-center", "offsetY": 150 }
        }
      ]
    }
  ],
  "audio": {
    "music": "assets/audio/upbeat.mp3",
    "musicVolume": 0.3
  }
}
```

## Troubleshooting

### Issue: "Composition not found"

**Solution:** Make sure the composition is registered in `src/Root.tsx` and the ID matches.

### Issue: "Asset not found"

**Solution:** Check that all asset paths are relative to `public/` directory. Use `assets/` prefix.

### Issue: Captions not visible

**Solution:**
- Check caption visibility: `visible: true`
- Verify positioning is within screen bounds
- Check color contrast against background

### Issue: Animation not working

**Solution:**
- Ensure animation duration is less than scene duration
- Check that animation type is valid
- Verify easing function is supported

### Issue: Video quality is poor

**Solution:**
- Increase export quality: `"quality": "high"` or `"ultra"`
- Increase bitrate: `"bitrate": 8000` (8 Mbps)
- Use higher resolution screenshots (2x or 3x)

## Related Features

- **APP-001**: Screenshot Device Frames - Provides device frame rendering
- **APP-002**: Caption Overlay System - Provides caption/text overlay functionality
- **VID-002**: Remotion Project Setup - Base Remotion configuration

## API Reference

### AppPreviewComposition

```tsx
import { AppPreviewComposition } from './compositions/appPreview';

<AppPreviewComposition config={appPreviewConfig} />
```

**Props:**
- `config: AppPreviewConfig` - App preview configuration

### Rendering

```typescript
import { renderMedia } from '@remotion/renderer';
import type { AppPreviewConfig } from './types/appPreview';

await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: './output.mp4',
  inputProps: { config: myConfig },
});
```

## Future Enhancements

- [ ] Interactive preview editor UI
- [ ] Template library for common app categories
- [ ] Automatic scene generation from screenshots
- [ ] AI-powered caption generation
- [ ] Video effect filters and color grading
- [ ] Multi-language caption support
- [ ] Batch rendering for multiple locales
- [ ] Direct upload to App Store Connect (via APP-009)

## Testing

Run tests:

```bash
# Validate config only
npm run test:app-preview

# Render video
npm run test:app-preview -- --render

# Test custom config
npm run test:app-preview -- --config path/to/config.json --render
```

## Notes

- App Store preview videos must be 15-30 seconds long
- Maximum file size: 500MB
- Supported formats: .mov, .m4v, or .mp4
- Aspect ratios must match device specifications
- Audio is optional but recommended
- Videos should demonstrate actual app functionality

## References

- [App Store Connect - App Previews](https://developer.apple.com/app-store/app-previews/)
- [Remotion Documentation](https://www.remotion.dev/docs)
- [Device Frame Specifications](./APP-001-SCREENSHOT-DEVICE-FRAMES.md)
- [Caption Overlay System](./APP-002-CAPTION-OVERLAY-SYSTEM.md)
