# ADS-006: Image Positioning Controls

**Status:** ✅ IMPLEMENTED
**Priority:** P1
**Phase:** 5 (Static Ads)

## Overview

The AdImage component provides advanced image positioning controls for static ad templates. It enables precise control over how images are displayed, cropped, and styled within ad compositions.

## Features

### 1. Object Fit Modes
Control how images fill their containers:

- **Cover**: Image covers the entire container, cropped to fit (default)
- **Contain**: Entire image visible within container, no cropping
- **Fill**: Image stretched to fill container (may distort)
- **None**: Image displayed at natural size

### 2. Focal Point Positioning
Precisely control which part of an image is visible when cropped:

- X/Y coordinates in 0-1 range
- (0, 0) = top-left corner
- (0.5, 0.5) = center (default)
- (1, 1) = bottom-right corner

Perfect for:
- Portrait photos (focus on faces)
- Product shots (focus on key features)
- Landscape images (focus on specific areas)

### 3. Rounded Corners
- Customizable border radius in pixels
- Perfect circles with `borderRadius={999}`
- Rounded rectangles for modern designs

### 4. Border Controls
- Border width (pixels)
- Border color (any CSS color)
- Perfect for branded frames

### 5. Shadow Effects
- Built-in shadow support
- Custom shadow styles
- Adds depth to images

### 6. Opacity Control
- Opacity from 0 (transparent) to 1 (opaque)
- Perfect for background images with overlays

## Implementation

### Component Location
```
src/components/AdImage.tsx
```

### Basic Usage

```tsx
import { AdImage } from '@/components/AdImage';

<AdImage
  src="assets/images/product.jpg"
  objectFit="cover"
  width={400}
  height={300}
  borderRadius={16}
  shadow
/>
```

### Advanced Usage with Focal Point

```tsx
import { AdImage, FocalPoints } from '@/components/AdImage';

<AdImage
  src="assets/images/portrait.jpg"
  objectFit="cover"
  focalPoint={FocalPoints.TOP_CENTER}
  width={300}
  height={300}
  borderRadius={999}
  borderWidth={4}
  borderColor="white"
  shadow
/>
```

### Custom Focal Point

```tsx
<AdImage
  src="assets/images/landscape.jpg"
  objectFit="cover"
  focalPoint={{ x: 0.7, y: 0.3 }}
  opacity={0.8}
/>
```

## Preset Focal Points

The component includes preset focal points for common positions:

```tsx
FocalPoints.CENTER        // { x: 0.5, y: 0.5 }
FocalPoints.TOP_LEFT      // { x: 0, y: 0 }
FocalPoints.TOP_CENTER    // { x: 0.5, y: 0 }
FocalPoints.TOP_RIGHT     // { x: 1, y: 0 }
FocalPoints.CENTER_LEFT   // { x: 0, y: 0.5 }
FocalPoints.CENTER_RIGHT  // { x: 1, y: 0.5 }
FocalPoints.BOTTOM_LEFT   // { x: 0, y: 1 }
FocalPoints.BOTTOM_CENTER // { x: 0.5, y: 1 }
FocalPoints.BOTTOM_RIGHT  // { x: 1, y: 1 }
```

## Helper Functions

### createFocalPoint
Create a focal point from percentage values:

```tsx
import { createFocalPoint } from '@/components/AdImage';

const focalPoint = createFocalPoint(70, 30);
// Returns: { x: 0.7, y: 0.3 }
```

### createFocalPointFromPixels
Create a focal point from pixel coordinates:

```tsx
import { createFocalPointFromPixels } from '@/components/AdImage';

const focalPoint = createFocalPointFromPixels(
  960, 540,  // pixel coordinates
  1920, 1080 // image dimensions
);
// Returns: { x: 0.5, y: 0.5 }
```

## Use Cases

### Hero Images
```tsx
<AdImage
  src="hero-background.jpg"
  objectFit="cover"
  focalPoint={{ x: 0.6, y: 0.4 }}
  opacity={0.7}
/>
```

### Product Showcases
```tsx
<AdImage
  src="product-shot.jpg"
  objectFit="contain"
  width={600}
  height={450}
  borderRadius={20}
  shadow
/>
```

### Profile Photos
```tsx
<AdImage
  src="profile.jpg"
  objectFit="cover"
  focalPoint={FocalPoints.TOP_CENTER}
  width={200}
  height={200}
  borderRadius={999}
  borderWidth={6}
  borderColor="white"
/>
```

### Logo Displays
```tsx
<AdImage
  src="logo.png"
  objectFit="contain"
  width={200}
  height={100}
  opacity={0.8}
/>
```

## Demo Pages

### Web Demo
View the interactive demo at:
```
http://localhost:3000/ads/image-demo
```

Features:
- Live examples of all positioning modes
- Interactive demos for each feature
- Code snippets for each example
- Implementation guide

### Remotion Compositions
Example compositions demonstrating AdImage in real ads:
```
src/compositions/ads/ImagePositioningDemo.tsx
```

Includes:
- `HeroAdWithFocalPoint` - Hero ad with custom focal point
- `ProductShowcase` - Product ad with rounded images
- `TestimonialAd` - Testimonial with circular profile photo
- `SplitLayoutAd` - Split layout with focal point control
- `MultiImageGrid` - Grid of images with various settings
- `LogoBanner` - Logo banner with contain mode

## Testing

Run the test suite:
```bash
npx tsx scripts/test-ad-image.ts
```

Tests cover:
- Focal point presets
- Focal point creation from percentages
- Focal point creation from pixels
- Boundary checking (clamping to 0-1 range)
- Component prop types

## API Reference

### AdImageProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | string | required | Image path relative to public/assets |
| alt | string | '' | Alt text for accessibility |
| width | number \| string | '100%' | Container width |
| height | number \| string | '100%' | Container height |
| objectFit | 'cover' \| 'contain' \| 'fill' \| 'none' | 'cover' | How image fills container |
| focalPoint | FocalPoint | { x: 0.5, y: 0.5 } | Which part of image to show |
| borderRadius | number | 0 | Border radius in pixels |
| borderWidth | number | 0 | Border width in pixels |
| borderColor | string | 'transparent' | Border color |
| opacity | number | 1 | Opacity (0-1) |
| shadow | boolean | false | Enable shadow effect |
| shadowStyle | string | '0 4px 20px rgba(0, 0, 0, 0.15)' | Custom shadow CSS |
| style | React.CSSProperties | {} | Additional inline styles |
| className | string | '' | CSS class name |

### FocalPoint Interface

```typescript
interface FocalPoint {
  x: number; // 0 (left) to 1 (right)
  y: number; // 0 (top) to 1 (bottom)
}
```

## Integration with Ad Templates

The AdImage component is designed to replace direct usage of Remotion's `Img` component in ad templates. It provides a consistent API for image positioning across all ad layouts.

### Before (using Img)
```tsx
<Img
  src={staticFile('product.jpg')}
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }}
/>
```

### After (using AdImage)
```tsx
<AdImage
  src="product.jpg"
  objectFit="cover"
  focalPoint={{ x: 0.7, y: 0.3 }}
  borderRadius={16}
  shadow
/>
```

## Benefits

1. **Consistent API**: Single component for all image needs
2. **Precise Control**: Focal point positioning for perfect crops
3. **Modern Design**: Built-in support for rounded corners and shadows
4. **Type Safety**: Full TypeScript support with interfaces
5. **Reusability**: Presets and helpers for common patterns
6. **Flexibility**: Support for all standard object-fit modes
7. **Easy to Use**: Intuitive props with sensible defaults

## Files Created

- `src/components/AdImage.tsx` - Main component
- `src/app/ads/image-demo/page.tsx` - Web demo page
- `src/compositions/ads/ImagePositioningDemo.tsx` - Remotion examples
- `scripts/test-ad-image.ts` - Test suite
- `docs/ADS-006-IMAGE-POSITIONING.md` - This documentation

## Next Steps

The AdImage component is ready to be used in all ad templates. Consider:

1. Updating existing ad templates to use AdImage
2. Creating presets for common use cases
3. Adding image filters/effects in future iterations
4. Integration with brand kit system (ADS-003)

## Related Features

- **ADS-001**: Static Ad Template System
- **ADS-003**: Brand Kit System
- **ADS-005**: Auto-fit Text
- **ADS-007**: renderStill Service

---

**Implementation Date:** January 28, 2026
**Developer:** Claude Code Agent
**Status:** Production Ready ✅
