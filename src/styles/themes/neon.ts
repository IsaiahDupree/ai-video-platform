import { StyleConfig } from '../../types';

export const neonTheme: Partial<StyleConfig> = {
  theme: 'neon',
  primary_color: '#00ff88',
  secondary_color: '#00ccff',
  accent_color: '#ff00ff',
  font_heading: 'Inter',
  font_body: 'Inter',
  background_type: 'gradient',
  background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a1a1a 100%)',
};

export const neonPurpleTheme: Partial<StyleConfig> = {
  ...neonTheme,
  primary_color: '#bf00ff',
  secondary_color: '#00ffff',
  accent_color: '#ff0080',
};

export const neonCyberTheme: Partial<StyleConfig> = {
  ...neonTheme,
  primary_color: '#00ffff',
  secondary_color: '#ff00ff',
  accent_color: '#ffff00',
  background_value: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
};
