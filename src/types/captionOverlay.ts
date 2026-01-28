/**
 * Caption Overlay Types
 *
 * Type definitions for text overlays on App Store screenshots.
 * Supports positioning, styling, and localization.
 */

export type CaptionPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom';

export type CaptionAlignment = 'left' | 'center' | 'right' | 'justify';

export type CaptionVerticalAlign = 'top' | 'middle' | 'bottom';

export type FontWeight =
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 'normal'
  | 'bold'
  | 'bolder'
  | 'lighter';

export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export type TextDecoration = 'none' | 'underline' | 'line-through' | 'overline';

/**
 * Caption text style configuration
 */
export interface CaptionStyle {
  // Font
  fontFamily?: string;
  fontSize?: number | string;
  fontWeight?: FontWeight;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  lineHeight?: number | string;
  letterSpacing?: number | string;

  // Color
  color?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;

  // Text styling
  textAlign?: CaptionAlignment;
  textTransform?: TextTransform;
  textDecoration?: TextDecoration;

  // Spacing & padding
  padding?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  margin?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;

  // Border & shadow
  borderRadius?: number | string;
  border?: string;
  boxShadow?: string;
  textShadow?: string;

  // Size constraints
  maxWidth?: number | string;
  minWidth?: number | string;
  width?: number | string;

  // Opacity
  opacity?: number;

  // Backdrop
  backdropFilter?: string;
}

/**
 * Caption positioning configuration
 */
export interface CaptionPositioning {
  // Preset position
  position: CaptionPosition;

  // Custom positioning (used when position = 'custom')
  x?: number | string; // CSS value or percentage (0-100)
  y?: number | string; // CSS value or percentage (0-100)

  // Offset from edge (in pixels or percentage)
  offsetX?: number;
  offsetY?: number;

  // Alignment within the caption area
  horizontalAlign?: CaptionAlignment;
  verticalAlign?: CaptionVerticalAlign;

  // Z-index for layering
  zIndex?: number;
}

/**
 * Localized caption text
 */
export interface LocalizedCaption {
  // Locale code (e.g., 'en-US', 'ja-JP', 'es-ES')
  locale: string;

  // Caption text
  text: string;

  // Optional locale-specific style overrides
  style?: Partial<CaptionStyle>;
}

/**
 * Caption configuration
 */
export interface CaptionConfig {
  // Caption ID
  id: string;

  // Text content (can be string or localized)
  text: string | LocalizedCaption[];

  // Position
  positioning: CaptionPositioning;

  // Style
  style: CaptionStyle;

  // Visibility
  visible?: boolean;

  // Animation (future support)
  animation?: {
    type: 'fade-in' | 'slide-up' | 'slide-down' | 'scale' | 'none';
    duration?: number;
    delay?: number;
    easing?: string;
  };

  // Metadata
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    author?: string;
    notes?: string;
  };
}

/**
 * CaptionOverlay component props
 */
export interface CaptionOverlayProps {
  // Caption configuration
  caption: CaptionConfig;

  // Current locale (for localized captions)
  locale?: string;

  // Container dimensions (for percentage-based positioning)
  containerWidth?: number;
  containerHeight?: number;

  // RTL support
  rtl?: boolean;

  // Additional CSS class
  className?: string;

  // Additional inline styles
  style?: React.CSSProperties;

  // Event handlers
  onClick?: () => void;
  onDoubleClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * Caption preset templates
 */
export interface CaptionPreset {
  id: string;
  name: string;
  description: string;
  category: 'heading' | 'subheading' | 'body' | 'badge' | 'feature' | 'custom';
  positioning: CaptionPositioning;
  style: CaptionStyle;
  exampleText: string;
}

/**
 * Default caption presets
 */
export const captionPresets: CaptionPreset[] = [
  {
    id: 'hero-heading',
    name: 'Hero Heading',
    description: 'Large, bold heading at the top',
    category: 'heading',
    positioning: {
      position: 'top-center',
      offsetY: 80,
      horizontalAlign: 'center',
      verticalAlign: 'top',
    },
    style: {
      fontFamily: 'SF Pro Display, -apple-system, sans-serif',
      fontSize: 48,
      fontWeight: 700,
      color: '#ffffff',
      textAlign: 'center',
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      padding: '16px 32px',
      maxWidth: '80%',
    },
    exampleText: 'Welcome to Your App',
  },
  {
    id: 'subtitle',
    name: 'Subtitle',
    description: 'Medium-sized subtitle text',
    category: 'subheading',
    positioning: {
      position: 'top-center',
      offsetY: 160,
      horizontalAlign: 'center',
      verticalAlign: 'top',
    },
    style: {
      fontFamily: 'SF Pro Text, -apple-system, sans-serif',
      fontSize: 24,
      fontWeight: 500,
      color: '#ffffff',
      textAlign: 'center',
      textShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
      padding: '8px 24px',
      maxWidth: '70%',
      opacity: 0.9,
    },
    exampleText: 'Experience the future of productivity',
  },
  {
    id: 'feature-badge',
    name: 'Feature Badge',
    description: 'Small badge highlighting a feature',
    category: 'badge',
    positioning: {
      position: 'top-left',
      offsetX: 24,
      offsetY: 24,
      horizontalAlign: 'left',
      verticalAlign: 'top',
    },
    style: {
      fontFamily: 'SF Pro Text, -apple-system, sans-serif',
      fontSize: 14,
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#007AFF',
      textAlign: 'center',
      padding: '8px 16px',
      borderRadius: 20,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    exampleText: 'NEW',
  },
  {
    id: 'bottom-caption',
    name: 'Bottom Caption',
    description: 'Text caption at the bottom',
    category: 'body',
    positioning: {
      position: 'bottom-center',
      offsetY: 60,
      horizontalAlign: 'center',
      verticalAlign: 'bottom',
    },
    style: {
      fontFamily: 'SF Pro Text, -apple-system, sans-serif',
      fontSize: 18,
      fontWeight: 400,
      color: '#ffffff',
      textAlign: 'center',
      padding: '12px 24px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
      maxWidth: '85%',
    },
    exampleText: 'Seamlessly sync across all your devices',
  },
  {
    id: 'center-callout',
    name: 'Center Callout',
    description: 'Large centered text overlay',
    category: 'feature',
    positioning: {
      position: 'center',
      horizontalAlign: 'center',
      verticalAlign: 'middle',
    },
    style: {
      fontFamily: 'SF Pro Display, -apple-system, sans-serif',
      fontSize: 36,
      fontWeight: 700,
      color: '#ffffff',
      textAlign: 'center',
      padding: '24px 40px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 16,
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      maxWidth: '80%',
    },
    exampleText: 'Fast. Powerful. Private.',
  },
];

/**
 * Get caption text for a specific locale
 */
export function getCaptionText(
  text: string | LocalizedCaption[],
  locale?: string
): string {
  if (typeof text === 'string') {
    return text;
  }

  if (!locale) {
    return text[0]?.text || '';
  }

  // Try exact match
  const exactMatch = text.find((t) => t.locale === locale);
  if (exactMatch) {
    return exactMatch.text;
  }

  // Try language-only match (e.g., 'en' for 'en-US')
  const languageCode = locale.split('-')[0];
  const languageMatch = text.find((t) => t.locale.startsWith(languageCode));
  if (languageMatch) {
    return languageMatch.text;
  }

  // Fallback to first entry or empty string
  return text[0]?.text || '';
}

/**
 * Get caption style for a specific locale
 */
export function getCaptionStyle(
  text: string | LocalizedCaption[],
  baseStyle: CaptionStyle,
  locale?: string
): CaptionStyle {
  if (typeof text === 'string') {
    return baseStyle;
  }

  if (!locale) {
    return { ...baseStyle, ...text[0]?.style };
  }

  // Try exact match
  const exactMatch = text.find((t) => t.locale === locale);
  if (exactMatch?.style) {
    return { ...baseStyle, ...exactMatch.style };
  }

  // Try language-only match
  const languageCode = locale.split('-')[0];
  const languageMatch = text.find((t) => t.locale.startsWith(languageCode));
  if (languageMatch?.style) {
    return { ...baseStyle, ...languageMatch.style };
  }

  // Fallback to base style
  return { ...baseStyle, ...text[0]?.style };
}

/**
 * Get caption preset by ID
 */
export function getCaptionPreset(id: string): CaptionPreset | undefined {
  return captionPresets.find((preset) => preset.id === id);
}

/**
 * Get caption presets by category
 */
export function getCaptionPresetsByCategory(
  category: CaptionPreset['category']
): CaptionPreset[] {
  return captionPresets.filter((preset) => preset.category === category);
}

/**
 * Create a caption from a preset
 */
export function createCaptionFromPreset(
  presetId: string,
  text?: string,
  overrides?: Partial<CaptionConfig>
): CaptionConfig | null {
  const preset = getCaptionPreset(presetId);
  if (!preset) {
    return null;
  }

  return {
    id: `caption-${Date.now()}`,
    text: text || preset.exampleText,
    positioning: { ...preset.positioning },
    style: { ...preset.style },
    visible: true,
    ...overrides,
  };
}
