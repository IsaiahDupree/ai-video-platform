/**
 * Brand Theme Builder
 *
 * Utility for building and applying brand themes consistently across videos.
 */

import type {
  BrandTemplate,
  BrandColors,
  BrandTypography,
  BrandAnimations,
  BrandVariant,
  BRAND_TEMPLATE_PRESETS,
} from '../types/BrandTemplate';

// =============================================================================
// Theme Builder
// =============================================================================

export class BrandThemeBuilder {
  private theme: BrandTemplate;

  constructor(template: BrandTemplate) {
    this.theme = template;
  }

  /**
   * Get the current theme
   */
  getTheme(): BrandTemplate {
    return this.theme;
  }

  /**
   * Apply a theme variant (e.g., dark mode)
   */
  applyVariant(variantName: string): BrandTemplate {
    const variant = this.theme.themes?.[variantName];
    if (!variant) {
      return this.theme;
    }

    return {
      ...this.theme,
      ...variant,
      colors: {
        ...this.theme.colors,
        ...(variant.colors || {}),
      },
      typography: {
        ...this.theme.typography,
        ...(variant.typography || {}),
      },
    };
  }

  /**
   * Merge with overrides
   */
  withOverrides(overrides: Partial<BrandTemplate>): BrandThemeBuilder {
    const merged: BrandTemplate = {
      ...this.theme,
      ...overrides,
      colors: {
        ...this.theme.colors,
        ...(overrides.colors || {}),
      },
      typography: {
        ...this.theme.typography,
        ...(overrides.typography || {}),
      },
      animations: {
        ...this.theme.animations,
        ...(overrides.animations || {}),
      },
    };

    return new BrandThemeBuilder(merged);
  }

  /**
   * Get CSS variables for use in stylesheets
   */
  getCSSVariables(): Record<string, string> {
    const vars: Record<string, string> = {};
    const { colors, typography } = this.theme;

    // Colors
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        vars[`--color-${key}`] = value;
      }
    });

    // Gradients
    if (colors.gradients) {
      Object.entries(colors.gradients).forEach(([key, value]) => {
        vars[`--gradient-${key}`] = value;
      });
    }

    // Typography
    if (typography.scales) {
      Object.entries(typography.scales).forEach(([key, value]) => {
        vars[`--text-${key}`] = `${value}px`;
      });
    }

    if (typography.lineHeights) {
      Object.entries(typography.lineHeights).forEach(([key, value]) => {
        vars[`--line-height-${key}`] = String(value);
      });
    }

    if (typography.letterSpacing) {
      Object.entries(typography.letterSpacing).forEach(([key, value]) => {
        vars[`--letter-spacing-${key}`] = value;
      });
    }

    // Font families
    vars['--font-sans'] = typography.sans.fallback || typography.sans.name;
    if (typography.serif) {
      vars['--font-serif'] = typography.serif.fallback || typography.serif.name;
    }
    if (typography.mono) {
      vars['--font-mono'] = typography.mono.fallback || typography.mono.name;
    }

    return vars;
  }

  /**
   * Get a specific color from the theme
   */
  getColor(key: keyof BrandColors | string): string | undefined {
    return (this.theme.colors as any)[key];
  }

  /**
   * Get a specific font size
   */
  getFontSize(size: keyof BrandTypography['scales']): number {
    return this.theme.typography.scales[size];
  }

  /**
   * Get animation preset
   */
  getAnimation(type: keyof BrandAnimations) {
    return this.theme.animations[type];
  }

  /**
   * Get component styles
   */
  getComponentStyles(component: string) {
    return (this.theme.components as any)[component];
  }

  /**
   * Generate React inline styles from theme
   */
  getStyles() {
    return {
      colors: this.theme.colors,
      fonts: {
        sans: this.theme.typography.sans.fallback || this.theme.typography.sans.name,
        serif: this.theme.typography.serif?.fallback || this.theme.typography.serif?.name,
        mono: this.theme.typography.mono?.fallback || this.theme.typography.mono?.name,
      },
      sizes: this.theme.typography.scales,
      animations: this.theme.animations,
      components: this.theme.components,
    };
  }
}

// =============================================================================
// Preset Loaders
// =============================================================================

/**
 * Create a brand theme from a preset
 */
export function createThemeFromPreset(
  presetKey: keyof typeof BRAND_TEMPLATE_PRESETS,
  customizations?: Partial<BrandTemplate>
): BrandTemplate {
  const preset = BRAND_TEMPLATE_PRESETS[presetKey];

  const defaultTheme: BrandTemplate = {
    id: `brand-${presetKey}`,
    name: preset.name,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    company: preset.name,
    colors: {
      ...preset.colors,
      primaryLight: '#5b9ef5',
      primaryDark: '#0056cc',
      secondaryLight: '#ff9960',
      secondaryDark: '#cc3300',
      accent: '#00d4ff',
      accentAlt: '#ffaa00',
      white: '#ffffff',
      light: '#f0f0f0',
      medium: '#808080',
      dark: '#333333',
      black: '#000000',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
      gradients: {
        primary: `linear-gradient(135deg, ${preset.colors.primary} 0%, ${preset.colors.primaryDark} 100%)`,
        secondary: `linear-gradient(135deg, ${preset.colors.secondary} 0%, ${preset.colors.secondaryDark} 100%)`,
        accent: `linear-gradient(135deg, ${preset.colors.accent} 0%, ${preset.colors.accentAlt} 100%)`,
      },
    } as BrandColors,
    typography: {
      sans: {
        name: 'Inter',
        fallback: 'system-ui, -apple-system, sans-serif',
        weights: {
          light: 300,
          normal: 400,
          semibold: 600,
          bold: 700,
          black: 900,
        },
      },
      scales: {
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
        loose: 2,
      },
      letterSpacing: {
        tight: '-0.02em',
        normal: '0em',
        wide: '0.02em',
        wider: '0.05em',
      },
    },
    animations: {
      entrance: {
        entrance: 'fade',
        duration: 300,
        easing: 'easeOut',
      },
      exit: {
        exit: 'fade',
        duration: 200,
        easing: 'easeIn',
      },
      transition: {
        entrance: 'slide',
        duration: 400,
        easing: 'easeInOut',
      },
      emphasis: {
        entrance: 'scale',
        duration: 500,
        easing: 'easeOut',
      },
      textReveal: {
        entrance: 'fade',
        duration: 600,
        easing: 'easeOut',
      },
    },
    components: {
      button: {
        borderRadius: 6,
        padding: { x: 16, y: 10 },
        shadow: 'md',
        fontSize: 14,
        fontWeight: 600,
      },
      card: {
        borderRadius: 8,
        padding: 16,
        shadow: 'sm',
        background: 'rgba(255, 255, 255, 0.05)',
      },
      input: {
        borderRadius: 4,
        padding: { x: 12, y: 8 },
        borderWidth: 1,
        fontSize: 14,
      },
      badge: {
        borderRadius: 12,
        padding: { x: 8, y: 4 },
      },
      divider: {
        thickness: 1,
      },
    },
    video: {
      aspect: '16:9',
      defaultResolution: '1080p',
      defaultFps: 30,
    },
  };

  if (customizations) {
    return {
      ...defaultTheme,
      ...customizations,
      colors: {
        ...defaultTheme.colors,
        ...(customizations.colors || {}),
      },
    };
  }

  return defaultTheme;
}

/**
 * Load theme from JSON file
 */
export async function loadThemeFromJson(filePath: string): Promise<BrandTemplate> {
  const response = await fetch(filePath);
  const data = await response.json();
  return data as BrandTemplate;
}

/**
 * Save theme to JSON
 */
export function themeToJson(theme: BrandTemplate): string {
  return JSON.stringify(theme, null, 2);
}

// =============================================================================
// Color Utilities
// =============================================================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function adjustBrightness(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const r = Math.min(255, Math.max(0, rgb.r + amount));
  const g = Math.min(255, Math.max(0, rgb.g + amount));
  const b = Math.min(255, Math.max(0, rgb.b + amount));

  return rgbToHex(r, g, b);
}

export default BrandThemeBuilder;
