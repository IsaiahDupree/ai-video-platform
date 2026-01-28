# APP-002: Caption Overlay System

## Overview

The Caption Overlay System provides text overlays for App Store screenshots with comprehensive positioning, styling, and localization support. This feature allows you to add professional captions to device frame screenshots for marketing materials.

## Status

✅ **Complete** - Session 38, January 28, 2026

## Components

### Type Definitions

**File:** `src/types/captionOverlay.ts` (421 lines)

Comprehensive TypeScript types for caption configuration:

- **CaptionPosition**: 10 preset positions (top-left, center, bottom-right, etc.) + custom
- **CaptionStyle**: Font, color, spacing, border, shadow, backdrop effects
- **CaptionPositioning**: Position, offsets, alignment, z-index
- **LocalizedCaption**: Per-locale text with optional style overrides
- **CaptionConfig**: Complete caption configuration
- **CaptionPreset**: Pre-built caption templates

### Core Component

**File:** `src/components/CaptionOverlay.tsx` (353 lines)

React component for rendering captions:

- Supports all positioning modes (preset and custom)
- Converts caption styles to CSS properties
- Handles localized text and RTL languages
- Color parsing with opacity support
- Animation configuration (fade-in, slide, scale)
- Event handlers (click, hover)
- Compatible with Remotion for static rendering

### Demo Page

**File:** `src/app/screenshots/captions/page.tsx` (200 lines)

Interactive demo for caption overlays:

- Live caption preview on device frames
- Preset selector with 5 built-in templates
- Text editing with real-time update
- Device and orientation selection
- Locale switcher (7 languages)
- Export functionality

**Styles:** `src/app/screenshots/captions/captions.module.css` (367 lines)

### Test Suite

**File:** `scripts/test-caption-overlay.ts` (500 lines)

20 comprehensive tests covering:

- Caption preset validation
- Localization (text and style)
- Positioning (preset and custom)
- Style properties
- Animation configuration
- Metadata preservation

## Features

### 1. Caption Positioning

#### Preset Positions

9 preset positions for quick placement:

- **Top**: top-left, top-center, top-right
- **Middle**: center-left, center, center-right
- **Bottom**: bottom-left, bottom-center, bottom-right

#### Custom Positioning

- Absolute positioning using x/y coordinates
- Percentage-based (0-100) or CSS values
- Offset support (offsetX, offsetY)
- Z-index layering

#### Example

```typescript
const caption: CaptionConfig = {
  id: 'caption-1',
  text: 'Welcome to Your App',
  positioning: {
    position: 'top-center',
    offsetY: 80, // 80px from top
    zIndex: 10,
  },
  style: {
    fontSize: 48,
    fontWeight: 700,
    color: '#ffffff',
  },
};
```

### 2. Caption Styling

#### Font Properties

- fontFamily, fontSize, fontWeight, fontStyle
- lineHeight, letterSpacing
- textAlign, textTransform, textDecoration

#### Colors & Effects

- Text color and background color
- Background opacity (separate from text)
- Text shadow and box shadow
- Border and border radius
- Backdrop filter (blur effects)

#### Spacing & Size

- Padding and margin (all sides)
- Width constraints (min, max, auto)
- Opacity control

#### Example

```typescript
const style: CaptionStyle = {
  fontFamily: 'SF Pro Display, -apple-system, sans-serif',
  fontSize: 48,
  fontWeight: 700,
  color: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  textAlign: 'center',
  padding: '16px 32px',
  borderRadius: 12,
  backdropFilter: 'blur(10px)',
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  maxWidth: '80%',
};
```

### 3. Localization

#### Multiple Locales

Captions support multiple languages with:

- Automatic locale matching (exact or language-only)
- Fallback to default locale
- Per-locale style overrides
- RTL support for Arabic and Hebrew

#### Example

```typescript
const caption: CaptionConfig = {
  id: 'caption-1',
  text: [
    { locale: 'en-US', text: 'Welcome to Your App' },
    { locale: 'es-ES', text: 'Bienvenido a tu aplicación' },
    {
      locale: 'ja-JP',
      text: 'アプリへようこそ',
      style: { fontSize: 44, lineHeight: 1.6 },
    },
    { locale: 'ar-SA', text: 'مرحباً بك في تطبيقك' },
  ],
  positioning: { position: 'top-center' },
  style: { fontSize: 48, color: '#ffffff' },
};
```

#### RTL Support

```tsx
<CaptionOverlay
  caption={caption}
  locale="ar-SA"
  rtl={true}
/>
```

### 4. Caption Presets

5 built-in presets for common use cases:

#### Hero Heading

Large, bold heading at the top

- Font: SF Pro Display, 48px, bold
- Position: top-center, 80px offset
- Color: white with text shadow

#### Subtitle

Medium-sized subtitle text

- Font: SF Pro Text, 24px, medium
- Position: top-center, 160px offset
- Color: white with 90% opacity

#### Feature Badge

Small badge highlighting a feature

- Font: SF Pro Text, 14px, semi-bold
- Position: top-left, 24px offset
- Style: Blue background, rounded, uppercase

#### Bottom Caption

Text caption at the bottom

- Font: SF Pro Text, 18px, regular
- Position: bottom-center, 60px offset
- Style: Semi-transparent background with backdrop blur

#### Center Callout

Large centered text overlay

- Font: SF Pro Display, 36px, bold
- Position: center
- Style: Dark background with backdrop blur and shadow

### 5. Animation Support (Future)

Animation configuration ready for implementation:

- Types: fade-in, slide-up, slide-down, scale, none
- Duration and delay (milliseconds)
- Easing function

```typescript
const caption: CaptionConfig = {
  // ... other config
  animation: {
    type: 'fade-in',
    duration: 500,
    delay: 200,
    easing: 'ease-in-out',
  },
};
```

## Usage

### Basic Usage

```tsx
import { CaptionOverlay } from '@/components/CaptionOverlay';
import { createCaptionFromPreset } from '@/types/captionOverlay';

const caption = createCaptionFromPreset('hero-heading', 'My App');

<CaptionOverlay
  caption={caption}
  locale="en-US"
/>
```

### With Device Frame

```tsx
import { DeviceFrame } from '@/components/DeviceFrame';
import { CaptionOverlay } from '@/components/CaptionOverlay';

<div style={{ position: 'relative' }}>
  <DeviceFrame
    device="iphone-16-pro-max"
    orientation="portrait"
    content="/screenshot.png"
  />

  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
    <CaptionOverlay
      caption={caption}
      locale="en-US"
    />
  </div>
</div>
```

### Custom Caption

```tsx
const customCaption: CaptionConfig = {
  id: 'custom-1',
  text: 'Fast. Powerful. Private.',
  positioning: {
    position: 'custom',
    x: 50, // 50% from left
    y: 30, // 30% from top
  },
  style: {
    fontFamily: 'SF Pro Display',
    fontSize: 42,
    fontWeight: 800,
    color: '#ffffff',
    textAlign: 'center',
    textShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    maxWidth: '90%',
  },
  visible: true,
};

<CaptionOverlay caption={customCaption} />
```

## API Reference

### CaptionOverlay Props

```typescript
interface CaptionOverlayProps {
  // Caption configuration (required)
  caption: CaptionConfig;

  // Current locale for localized captions
  locale?: string;

  // Container dimensions for percentage-based positioning
  containerWidth?: number;
  containerHeight?: number;

  // RTL support
  rtl?: boolean;

  // Additional styling
  className?: string;
  style?: React.CSSProperties;

  // Event handlers
  onClick?: () => void;
  onDoubleClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}
```

### Utility Functions

```typescript
// Get localized text
getCaptionText(
  text: string | LocalizedCaption[],
  locale?: string
): string

// Get localized style
getCaptionStyle(
  text: string | LocalizedCaption[],
  baseStyle: CaptionStyle,
  locale?: string
): CaptionStyle

// Get preset by ID
getCaptionPreset(id: string): CaptionPreset | undefined

// Get presets by category
getCaptionPresetsByCategory(
  category: 'heading' | 'subheading' | 'body' | 'badge' | 'feature' | 'custom'
): CaptionPreset[]

// Create caption from preset
createCaptionFromPreset(
  presetId: string,
  text?: string,
  overrides?: Partial<CaptionConfig>
): CaptionConfig | null
```

## Demo

Visit the interactive demo:

```
http://localhost:3000/screenshots/captions
```

Features:
- 5 caption presets
- Live text editing
- Device frame preview
- Locale switcher (7 languages)
- Export functionality

## Tests

Run the test suite:

```bash
npx tsx scripts/test-caption-overlay.ts
```

### Test Coverage

- ✅ 20/20 tests passing (100% success rate)
- Caption preset validation
- Localization (exact match, language fallback, default fallback)
- Style merging with locale overrides
- All positioning modes (preset and custom)
- Style properties (font, color, spacing, effects)
- Animation configuration
- Visibility toggle
- Metadata preservation
- Multiple locales (7 languages)

## Technical Details

### Zero Dependencies

- No external libraries (except React and Remotion)
- Pure CSS positioning and styling
- Built-in color parsing
- Type-safe TypeScript throughout

### Performance

- Minimal re-renders
- CSS-based animations (future)
- No canvas or SVG overhead
- Efficient locale matching

### Compatibility

- React 18+
- Remotion 4.0+
- Works with all device frames
- Responsive to container size

## Future Enhancements

1. **Visual Editor**: Drag-and-drop caption positioning
2. **More Presets**: Expand preset library (20+ templates)
3. **Animations**: Implement fade, slide, scale effects
4. **Gradients**: Text gradient and background gradient support
5. **Templates**: Multi-caption templates for common layouts
6. **Export**: PNG/JPG export with captions baked in
7. **AI Suggestions**: GPT-powered caption text generation
8. **Template Library**: Screenshot templates with preset captions

## Integration

### With Remotion

```tsx
import { Composition } from 'remotion';
import { CaptionOverlay } from '@/components/CaptionOverlay';

<Composition
  id="Screenshot"
  component={ScreenshotComposition}
  width={1260}
  height={2736}
  fps={30}
  durationInFrames={1}
/>
```

### With Device Frames

Captions work seamlessly with APP-001 (Device Frames):

```tsx
const caption = createCaptionFromPreset('hero-heading', 'Welcome');

<DeviceFrame device="iphone-16-pro-max" content="/screenshot.png">
  <CaptionOverlay caption={caption} />
</DeviceFrame>
```

## Files Created

- `src/types/captionOverlay.ts` (421 lines)
- `src/components/CaptionOverlay.tsx` (353 lines)
- `src/app/screenshots/captions/page.tsx` (200 lines)
- `src/app/screenshots/captions/captions.module.css` (367 lines)
- `scripts/test-caption-overlay.ts` (500 lines)
- `docs/APP-002-CAPTION-OVERLAY-SYSTEM.md` (this file)

**Total:** ~1,841 lines of code

## Dependencies

- APP-001: Screenshot Device Frames (complete)

## Next Steps

After APP-002, the next feature is:

**APP-003: Screenshot Size Generator** - Batch resize to all required App Store dimensions
