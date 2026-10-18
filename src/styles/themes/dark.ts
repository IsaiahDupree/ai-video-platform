import { StyleConfig } from '../../types';

export const darkTheme: Partial<StyleConfig> = {
  theme: 'dark',
  primary_color: '#ffffff',
  secondary_color: '#a1a1aa',
  accent_color: '#3b82f6',
  font_heading: 'Inter',
  font_body: 'Inter',
  background_type: 'solid',
  background_value: '#0a0a0a',
};

export const darkGradientTheme: Partial<StyleConfig> = {
  ...darkTheme,
  background_type: 'gradient',
  background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
};
