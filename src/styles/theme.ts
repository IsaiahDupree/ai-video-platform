/**
 * Theme System - VID-004
 * Dark/light themes with configurable colors and typography
 */

import type { VideoStyle } from '../types/brief';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    textSecondary: string;
    accent: string;
    overlay: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingSize: number;
    bodySize: number;
    headingWeight: number;
    bodyWeight: number;
    lineHeight: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

/**
 * Dark Theme (Default)
 */
export const darkTheme: Theme = {
  colors: {
    primary: '#3b82f6', // blue-500
    secondary: '#8b5cf6', // violet-500
    background: '#0f172a', // slate-900
    text: '#f1f5f9', // slate-100
    textSecondary: '#cbd5e1', // slate-300
    accent: '#06b6d4', // cyan-500
    overlay: 'rgba(15, 23, 42, 0.85)',
  },
  typography: {
    headingFont: 'Inter, system-ui, -apple-system, sans-serif',
    bodyFont: 'Inter, system-ui, -apple-system, sans-serif',
    headingSize: 56,
    bodySize: 28,
    headingWeight: 700,
    bodyWeight: 400,
    lineHeight: 1.6,
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 32,
    lg: 64,
    xl: 80,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
};

/**
 * Light Theme
 */
export const lightTheme: Theme = {
  colors: {
    primary: '#2563eb', // blue-600
    secondary: '#7c3aed', // violet-600
    background: '#ffffff', // white
    text: '#0f172a', // slate-900
    textSecondary: '#475569', // slate-600
    accent: '#0891b2', // cyan-600
    overlay: 'rgba(255, 255, 255, 0.85)',
  },
  typography: {
    headingFont: 'Inter, system-ui, -apple-system, sans-serif',
    bodyFont: 'Inter, system-ui, -apple-system, sans-serif',
    headingSize: 56,
    bodySize: 28,
    headingWeight: 700,
    bodyWeight: 400,
    lineHeight: 1.6,
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 32,
    lg: 64,
    xl: 80,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
};

/**
 * Get theme based on VideoStyle configuration
 * Merges predefined theme with custom overrides
 */
export function getTheme(style: VideoStyle): Theme {
  // Start with base theme
  const baseTheme = style.theme === 'light' ? lightTheme : darkTheme;

  // Create merged theme with custom overrides
  const theme: Theme = {
    colors: {
      ...baseTheme.colors,
      ...(style.colors?.primary && { primary: style.colors.primary }),
      ...(style.colors?.secondary && { secondary: style.colors.secondary }),
      ...(style.colors?.background && { background: style.colors.background }),
      ...(style.colors?.text && { text: style.colors.text }),
      ...(style.colors?.accent && { accent: style.colors.accent }),
    },
    typography: {
      ...baseTheme.typography,
      ...(style.typography?.headingFont && { headingFont: style.typography.headingFont }),
      ...(style.typography?.bodyFont && { bodyFont: style.typography.bodyFont }),
      ...(style.typography?.headingSize && { headingSize: style.typography.headingSize }),
      ...(style.typography?.bodySize && { bodySize: style.typography.bodySize }),
    },
    spacing: baseTheme.spacing,
    borderRadius: baseTheme.borderRadius,
  };

  return theme;
}

/**
 * Helper function to apply theme colors with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${opacity})`;
    }
  }

  // Return original if can't parse
  return color;
}

/**
 * Generate gradient overlay for image backgrounds
 */
export function getGradientOverlay(theme: Theme, direction: 'left' | 'right' | 'top' | 'bottom' = 'right'): string {
  const directionMap = {
    left: 'to left',
    right: 'to right',
    top: 'to top',
    bottom: 'to bottom',
  };

  return `linear-gradient(${directionMap[direction]}, ${theme.colors.overlay} 0%, ${withOpacity(theme.colors.background, 0.4)} 100%)`;
}

/**
 * Preset theme configurations for quick use
 */
export const presetThemes = {
  dark: darkTheme,
  light: lightTheme,
  ocean: {
    ...darkTheme,
    colors: {
      ...darkTheme.colors,
      primary: '#06b6d4', // cyan-500
      secondary: '#3b82f6', // blue-500
      background: '#0c4a6e', // sky-900
      accent: '#0ea5e9', // sky-500
    },
  },
  sunset: {
    ...darkTheme,
    colors: {
      ...darkTheme.colors,
      primary: '#f97316', // orange-500
      secondary: '#ec4899', // pink-500
      background: '#7c2d12', // orange-900
      accent: '#fb923c', // orange-400
    },
  },
  forest: {
    ...darkTheme,
    colors: {
      ...darkTheme.colors,
      primary: '#10b981', // emerald-500
      secondary: '#14b8a6', // teal-500
      background: '#064e3b', // emerald-900
      accent: '#34d399', // emerald-400
    },
  },
  minimal: {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      primary: '#18181b', // zinc-900
      secondary: '#3f3f46', // zinc-700
      background: '#fafafa', // zinc-50
      accent: '#71717a', // zinc-500
    },
  },
};

/**
 * Type-safe theme names
 */
export type PresetThemeName = keyof typeof presetThemes;
