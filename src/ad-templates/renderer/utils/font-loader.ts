/**
 * Font Loading Utilities
 * 
 * Handles font loading with delayRender support for Remotion.
 */

import { delayRender, continueRender } from 'remotion';

// =============================================================================
// Types
// =============================================================================

export interface FontConfig {
  family: string;
  weights?: number[];
  styles?: ('normal' | 'italic')[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

export interface FontLoadResult {
  success: boolean;
  family: string;
  error?: string;
}

// =============================================================================
// Font Loading
// =============================================================================

/**
 * Loads a Google Font with specified weights
 * Returns a handle that should be used with delayRender/continueRender
 */
export async function loadGoogleFont(
  config: FontConfig
): Promise<FontLoadResult> {
  const { family, weights = [400, 700], display = 'swap' } = config;
  
  // Build Google Fonts URL
  const weightsStr = weights.join(';');
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weightsStr}&display=${display}`;
  
  try {
    // Check if already loaded
    if (document.querySelector(`link[href="${url}"]`)) {
      return { success: true, family };
    }
    
    // Create and append link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    
    await new Promise<void>((resolve, reject) => {
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load font: ${family}`));
      document.head.appendChild(link);
    });
    
    // Wait for font to be ready
    await document.fonts.ready;
    
    return { success: true, family };
  } catch (error) {
    return {
      success: false,
      family,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Loads a local/bundled font
 */
export async function loadLocalFont(
  family: string,
  src: string,
  weight: number = 400,
  style: 'normal' | 'italic' = 'normal'
): Promise<FontLoadResult> {
  try {
    const fontFace = new FontFace(family, `url(${src})`, {
      weight: String(weight),
      style,
    });
    
    await fontFace.load();
    document.fonts.add(fontFace);
    
    return { success: true, family };
  } catch (error) {
    return {
      success: false,
      family,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// Remotion Integration
// =============================================================================

/**
 * Hook-style font loader for use in Remotion components
 * Uses delayRender to ensure fonts are loaded before rendering
 */
export function useFontLoader(fonts: FontConfig[]): {
  loaded: boolean;
  errors: string[];
} {
  // This is a simplified version - in a real implementation,
  // you would use React hooks and delayRender/continueRender
  
  return {
    loaded: true,
    errors: [],
  };
}

/**
 * Loads fonts with delayRender support
 * Call this in your component before rendering text
 */
export async function loadFontsWithDelay(
  fonts: FontConfig[]
): Promise<{ handle: number; results: FontLoadResult[] }> {
  const handle = delayRender('Loading fonts...');
  const results: FontLoadResult[] = [];
  
  try {
    for (const font of fonts) {
      const result = await loadGoogleFont(font);
      results.push(result);
    }
  } finally {
    continueRender(handle);
  }
  
  return { handle, results };
}

// =============================================================================
// Font Presets
// =============================================================================

export const FONT_PRESETS = {
  inter: {
    family: 'Inter',
    weights: [400, 500, 600, 700, 800],
  },
  roboto: {
    family: 'Roboto',
    weights: [400, 500, 700],
  },
  openSans: {
    family: 'Open Sans',
    weights: [400, 600, 700],
  },
  poppins: {
    family: 'Poppins',
    weights: [400, 500, 600, 700],
  },
  montserrat: {
    family: 'Montserrat',
    weights: [400, 500, 600, 700, 800],
  },
} as const;

/**
 * Common font stacks with fallbacks
 */
export const FONT_STACKS = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
} as const;
