/**
 * Brand Kit Types - ADS-003
 * Type definitions for workspace brand kits
 */

/**
 * Logo asset configuration
 */
export interface BrandLogo {
  id: string;
  name: string;
  path: string;
  width: number;
  height: number;
  format: 'png' | 'svg' | 'jpg' | 'webp';
  variant?: 'primary' | 'secondary' | 'icon' | 'wordmark' | 'white' | 'black';
  backgroundColor?: string; // For transparent logos
}

/**
 * Color palette definition
 */
export interface BrandColors {
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text: string;
  textSecondary?: string;
  success?: string;
  warning?: string;
  error?: string;
  // Additional custom colors
  custom?: Record<string, string>;
}

/**
 * Typography configuration
 */
export interface BrandTypography {
  headlineFont: string;
  bodyFont?: string;
  fontWeights?: {
    light?: number;
    regular?: number;
    medium?: number;
    semibold?: number;
    bold?: number;
    black?: number;
  };
  fontSizes?: {
    xs?: number;
    sm?: number;
    base?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
    '3xl'?: number;
    '4xl'?: number;
    '5xl'?: number;
  };
  lineHeights?: {
    tight?: number;
    normal?: number;
    relaxed?: number;
  };
  letterSpacing?: {
    tight?: number;
    normal?: number;
    wide?: number;
  };
}

/**
 * Spacing and layout configuration
 */
export interface BrandSpacing {
  unit?: number; // Base spacing unit (default 4px)
  padding?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  borderRadius?: {
    none?: number;
    sm?: number;
    md?: number;
    lg?: number;
    full?: number;
  };
}

/**
 * Effects and visual style
 */
export interface BrandEffects {
  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  blur?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
  opacity?: {
    light?: number;
    medium?: number;
    heavy?: number;
  };
}

/**
 * Complete brand kit definition
 */
export interface BrandKit {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;

  // Brand assets
  logos: BrandLogo[];
  primaryLogo?: string; // Logo ID to use by default

  // Visual identity
  colors: BrandColors;
  typography: BrandTypography;
  spacing?: BrandSpacing;
  effects?: BrandEffects;

  // Metadata
  createdAt: string;
  updatedAt: string;
  version: string;
  isDefault?: boolean;
}

/**
 * Brand kit application options
 */
export interface BrandKitApplicationOptions {
  // What to apply from the brand kit
  applyColors?: boolean;
  applyTypography?: boolean;
  applySpacing?: boolean;
  applyEffects?: boolean;
  applyLogo?: boolean;

  // Logo options
  logoVariant?: 'primary' | 'secondary' | 'icon' | 'wordmark' | 'white' | 'black';
  logoPosition?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  logoSize?: number;

  // Override specific values
  overrides?: {
    colors?: Partial<BrandColors>;
    typography?: Partial<BrandTypography>;
    spacing?: Partial<BrandSpacing>;
  };
}

/**
 * Brand kit search criteria
 */
export interface BrandKitSearchCriteria {
  workspaceId?: string;
  name?: string;
  isDefault?: boolean;
}

/**
 * Type guard to check if an object is a valid BrandKit
 */
export function isBrandKit(obj: any): obj is BrandKit {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.workspaceId === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.logos) &&
    obj.colors &&
    obj.typography &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a valid BrandLogo
 */
export function isBrandLogo(obj: any): obj is BrandLogo {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.path === 'string' &&
    typeof obj.width === 'number' &&
    typeof obj.height === 'number' &&
    ['png', 'svg', 'jpg', 'webp'].includes(obj.format)
  );
}

/**
 * Default brand kit colors
 */
export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  background: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

/**
 * Default typography settings
 */
export const DEFAULT_BRAND_TYPOGRAPHY: BrandTypography = {
  headlineFont: 'Inter, system-ui, -apple-system, sans-serif',
  bodyFont: 'Inter, system-ui, -apple-system, sans-serif',
  fontWeights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025,
  },
};

/**
 * Default spacing settings
 */
export const DEFAULT_BRAND_SPACING: BrandSpacing = {
  unit: 4,
  padding: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
  gap: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
};

/**
 * Default effects settings
 */
export const DEFAULT_BRAND_EFFECTS: BrandEffects = {
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  blur: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  opacity: {
    light: 0.1,
    medium: 0.5,
    heavy: 0.8,
  },
};

/**
 * Helper to create a brand kit with default values
 */
export function createBrandKit(
  partial: Partial<BrandKit> & {
    id: string;
    workspaceId: string;
    name: string;
  }
): BrandKit {
  const now = new Date().toISOString();
  return {
    logos: [],
    colors: DEFAULT_BRAND_COLORS,
    typography: DEFAULT_BRAND_TYPOGRAPHY,
    spacing: DEFAULT_BRAND_SPACING,
    effects: DEFAULT_BRAND_EFFECTS,
    createdAt: now,
    updatedAt: now,
    version: '1.0',
    ...partial,
  };
}
