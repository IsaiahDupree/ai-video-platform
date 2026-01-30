/**
 * Brand Template System
 *
 * Reproducible brand configurations with colors, fonts, voices, and animations.
 * Enables consistent styling across multiple videos while supporting brand customization.
 */

// =============================================================================
// Color System
// =============================================================================

export interface BrandColors {
  // Primary palette
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary palette
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Accent colors
  accent: string;
  accentAlt: string;

  // Neutral palette
  white: string;
  light: string;
  medium: string;
  dark: string;
  black: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Gradients
  gradients: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// =============================================================================
// Typography System
// =============================================================================

export interface FontFamily {
  name: string;
  weights?: {
    light?: number;
    normal?: number;
    semibold?: number;
    bold?: number;
    black?: number;
  };
  googleFont?: boolean; // If from Google Fonts
  fallback?: string;
}

export interface BrandTypography {
  // Font families
  sans: FontFamily;
  serif?: FontFamily;
  mono?: FontFamily;

  // Font sizes
  scales: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
  };

  // Line heights
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };

  // Letter spacing
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
    wider: string;
  };
}

// =============================================================================
// Voice Configuration
// =============================================================================

export interface VoiceConfig {
  provider: 'openai' | 'elevenlabs' | 'huggingface' | 'aws';
  voice: string;
  language?: string;
  accent?: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'calm' | 'explaining';
  speed?: number; // 0.5 - 2.0
  pitch?: number; // 0.5 - 2.0
}

export interface BrandVoices {
  narrator?: VoiceConfig;
  hero?: VoiceConfig;
  supporting?: VoiceConfig;
  voiceover?: VoiceConfig;
}

// =============================================================================
// Animation & Effects
// =============================================================================

export interface AnimationPreset {
  entrance?: 'fade' | 'slide' | 'scale' | 'bounce' | 'flip' | 'rotate';
  exit?: 'fade' | 'slide' | 'scale' | 'shrink';
  duration?: number; // milliseconds
  delay?: number;
  easing?: 'ease' | 'easeIn' | 'easeOut' | 'easeInOut' | 'linear';
}

export interface BrandAnimations {
  entrance: AnimationPreset;
  exit: AnimationPreset;
  transition: AnimationPreset;
  emphasis: AnimationPreset;
  textReveal: AnimationPreset;
}

// =============================================================================
// Component Styles
// =============================================================================

export interface ComponentStyle {
  borderRadius?: number;
  borderWidth?: number;
  padding?: number | { x?: number; y?: number };
  margin?: number | { x?: number; y?: number };
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface BrandComponentStyles {
  button: ComponentStyle & {
    fontSize?: number;
    fontWeight?: number;
  };
  card: ComponentStyle & {
    background?: string;
  };
  input: ComponentStyle & {
    fontSize?: number;
  };
  badge: ComponentStyle;
  divider: {
    color?: string;
    thickness?: number;
  };
}

// =============================================================================
// Logo Configuration
// =============================================================================

export interface LogoConfig {
  url?: string;
  width: number;
  height: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  margin?: number;
  opacity?: number;
}

// =============================================================================
// Watermark Configuration
// =============================================================================

export interface WatermarkConfig {
  enabled: boolean;
  text?: string;
  url?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity?: number;
  fontSize?: number;
}

// =============================================================================
// Brand Template (Main)
// =============================================================================

export interface BrandTemplate {
  // Metadata
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;

  // Brand identity
  company: string;
  industry?: string;
  tagline?: string;

  // Visual System
  colors: BrandColors;
  typography: BrandTypography;
  animations: BrandAnimations;
  components: BrandComponentStyles;

  // Media & Branding
  logo?: LogoConfig;
  watermark?: WatermarkConfig;
  favicon?: string;

  // Voice & Audio
  voices?: BrandVoices;
  musicGenre?: string;
  audioBrand?: {
    soundmark?: string; // Audio logo
    introMusic?: string;
    outroMusic?: string;
  };

  // Video Settings
  video: {
    aspect?: '16:9' | '9:16' | '1:1' | '21:9';
    defaultResolution?: '720p' | '1080p' | '2k' | '4k';
    defaultFps?: 24 | 30 | 60;
  };

  // Custom Properties
  custom?: Record<string, any>;

  // Theme Presets
  themes?: {
    light?: Partial<BrandTemplate>;
    dark?: Partial<BrandTemplate>;
    [key: string]: Partial<BrandTemplate> | undefined;
  };
}

// =============================================================================
// Template Variants
// =============================================================================

export interface BrandVariant {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  overrides: Partial<BrandTemplate>;
  useCase?: string; // e.g., "social", "email", "ads"
}

// =============================================================================
// Preset Packages
// =============================================================================

export const BRAND_TEMPLATE_PRESETS = {
  tech: {
    name: 'Tech Startup',
    colors: {
      primary: '#0080ff',
      secondary: '#ff6b35',
      accent: '#00d4ff',
    },
  },
  corporate: {
    name: 'Corporate Professional',
    colors: {
      primary: '#1a3a52',
      secondary: '#c1666b',
      accent: '#d4a574',
    },
  },
  creative: {
    name: 'Creative Agency',
    colors: {
      primary: '#ff006e',
      secondary: '#00f5ff',
      accent: '#ffbe0b',
    },
  },
  minimal: {
    name: 'Minimal Modern',
    colors: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#666666',
    },
  },
  vibrant: {
    name: 'Vibrant & Bold',
    colors: {
      primary: '#ff4757',
      secondary: '#ffa502',
      accent: '#2ed573',
    },
  },
} as const;

// =============================================================================
// Helper Types
// =============================================================================

export type BrandTemplatePreset = keyof typeof BRAND_TEMPLATE_PRESETS;
export type AspectRatio = '16:9' | '9:16' | '1:1' | '21:9';
export type Resolution = '720p' | '1080p' | '2k' | '4k';
export type FPS = 24 | 30 | 60;

// =============================================================================
// Validation
// =============================================================================

export function isValidBrandTemplate(template: any): template is BrandTemplate {
  return (
    template &&
    typeof template.id === 'string' &&
    typeof template.name === 'string' &&
    template.colors &&
    template.typography
  );
}
