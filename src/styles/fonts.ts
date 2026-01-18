// Font configuration and loading helpers

export interface FontConfig {
  name: string;
  weights: number[];
  url?: string;
  fallback: string;
}

export const defaultFonts: Record<string, FontConfig> = {
  Inter: {
    name: 'Inter',
    weights: [400, 500, 600, 700, 800, 900],
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
    fallback: 'system-ui, -apple-system, sans-serif',
  },
  Poppins: {
    name: 'Poppins',
    weights: [400, 500, 600, 700, 800, 900],
    url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap',
    fallback: 'system-ui, sans-serif',
  },
  Roboto: {
    name: 'Roboto',
    weights: [400, 500, 700, 900],
    url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap',
    fallback: 'Arial, sans-serif',
  },
  Montserrat: {
    name: 'Montserrat',
    weights: [400, 500, 600, 700, 800, 900],
    url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap',
    fallback: 'system-ui, sans-serif',
  },
  'Space Grotesk': {
    name: 'Space Grotesk',
    weights: [400, 500, 600, 700],
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
    fallback: 'system-ui, sans-serif',
  },
};

export function getFontFamily(fontName: string): string {
  const font = defaultFonts[fontName];
  if (font) {
    return `'${font.name}', ${font.fallback}`;
  }
  return `'${fontName}', system-ui, sans-serif`;
}

export function getFontUrl(fontName: string): string | undefined {
  return defaultFonts[fontName]?.url;
}

// Font size scales for different contexts
export const fontSizes = {
  // Heading sizes (based on 1080p)
  h1: 96,
  h2: 72,
  h3: 56,
  h4: 48,
  h5: 36,
  h6: 28,
  
  // Body sizes
  bodyLarge: 32,
  body: 24,
  bodySmall: 20,
  
  // Caption sizes
  caption: 18,
  captionSmall: 14,
};

// Scale font sizes based on resolution
export function scaleFontSize(
  baseSize: number,
  targetWidth: number,
  baseWidth: number = 1920
): number {
  return Math.round(baseSize * (targetWidth / baseWidth));
}
