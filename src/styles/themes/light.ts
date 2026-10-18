import { StyleConfig } from '../../types';

export const lightTheme: Partial<StyleConfig> = {
  theme: 'light',
  primary_color: '#1a1a1a',
  secondary_color: '#4a4a4a',
  accent_color: '#2563eb',
  font_heading: 'Inter',
  font_body: 'Inter',
  background_type: 'solid',
  background_value: '#ffffff',
};

export const lightGradientTheme: Partial<StyleConfig> = {
  ...lightTheme,
  background_type: 'gradient',
  background_value: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #ffffff 100%)',
};
