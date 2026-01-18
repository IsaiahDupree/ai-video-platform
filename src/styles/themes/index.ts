import { StyleConfig, ThemeType } from '../../types';
import { darkTheme, darkGradientTheme } from './dark';
import { lightTheme, lightGradientTheme } from './light';
import { neonTheme, neonPurpleTheme, neonCyberTheme } from './neon';

export { darkTheme, darkGradientTheme } from './dark';
export { lightTheme, lightGradientTheme } from './light';
export { neonTheme, neonPurpleTheme, neonCyberTheme } from './neon';

export const themes: Record<ThemeType, Partial<StyleConfig>> = {
  dark: darkTheme,
  light: lightTheme,
  neon: neonTheme,
  custom: {}, // Custom themes are defined in the brief
};

export function getTheme(themeType: ThemeType): Partial<StyleConfig> {
  return themes[themeType] || themes.dark;
}

export function mergeWithTheme(
  themeType: ThemeType,
  overrides: Partial<StyleConfig>
): StyleConfig {
  const baseTheme = getTheme(themeType);
  return {
    theme: themeType,
    primary_color: overrides.primary_color || baseTheme.primary_color || '#ffffff',
    secondary_color: overrides.secondary_color || baseTheme.secondary_color || '#a1a1aa',
    accent_color: overrides.accent_color || baseTheme.accent_color || '#3b82f6',
    font_heading: overrides.font_heading || baseTheme.font_heading || 'Inter',
    font_body: overrides.font_body || baseTheme.font_body || 'Inter',
    background_type: overrides.background_type || baseTheme.background_type || 'solid',
    background_value: overrides.background_value || baseTheme.background_value || '#0a0a0a',
  };
}
