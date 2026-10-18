// Color utilities and palettes

export interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export const colorPalettes: Record<string, ColorPalette> = {
  midnight: {
    name: 'Midnight',
    primary: '#ffffff',
    secondary: '#a1a1aa',
    accent: '#3b82f6',
    background: '#0a0a0a',
    text: '#ffffff',
  },
  ocean: {
    name: 'Ocean',
    primary: '#0ea5e9',
    secondary: '#38bdf8',
    accent: '#06b6d4',
    background: '#0c4a6e',
    text: '#f0f9ff',
  },
  forest: {
    name: 'Forest',
    primary: '#22c55e',
    secondary: '#4ade80',
    accent: '#10b981',
    background: '#14532d',
    text: '#f0fdf4',
  },
  sunset: {
    name: 'Sunset',
    primary: '#f97316',
    secondary: '#fb923c',
    accent: '#ef4444',
    background: '#7c2d12',
    text: '#fff7ed',
  },
  lavender: {
    name: 'Lavender',
    primary: '#a855f7',
    secondary: '#c084fc',
    accent: '#d946ef',
    background: '#3b0764',
    text: '#faf5ff',
  },
  minimal: {
    name: 'Minimal',
    primary: '#18181b',
    secondary: '#3f3f46',
    accent: '#71717a',
    background: '#fafafa',
    text: '#09090b',
  },
};

// Hex to RGBA conversion
export function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0, 0, 0, ${alpha})`;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Lighten/darken color
export function adjustColor(hex: string, amount: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  
  r = Math.min(255, Math.max(0, r + amount));
  g = Math.min(255, Math.max(0, g + amount));
  b = Math.min(255, Math.max(0, b + amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Generate gradient string
export function createGradient(
  colors: string[],
  angle: number = 135,
  type: 'linear' | 'radial' = 'linear'
): string {
  const stops = colors.map((color, i) => {
    const position = Math.round((i / (colors.length - 1)) * 100);
    return `${color} ${position}%`;
  }).join(', ');
  
  if (type === 'radial') {
    return `radial-gradient(circle, ${stops})`;
  }
  return `linear-gradient(${angle}deg, ${stops})`;
}

// Get contrasting text color
export function getContrastColor(hexColor: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
  if (!result) return '#ffffff';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
