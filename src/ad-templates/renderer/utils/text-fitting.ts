/**
 * Text Fitting Utilities
 * 
 * Helpers for measuring and fitting text within bounded regions.
 * Note: Some utilities require browser environment to work properly.
 */

import type { TextStyle, TextConstraints, Rect } from '../../schema/template-dsl';

// =============================================================================
// Types
// =============================================================================

export interface TextMeasurement {
  width: number;
  height: number;
  lines: number;
  overflow: boolean;
}

export interface FitTextResult {
  fontSize: number;
  lines: string[];
  overflow: boolean;
  finalHeight: number;
}

// =============================================================================
// Text Measurement (Browser-side)
// =============================================================================

/**
 * Creates a measurement context for text calculations
 * Note: This must run in a browser environment
 */
export function createMeasurementCanvas(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  
  const canvas = document.createElement('canvas');
  return canvas.getContext('2d');
}

/**
 * Measures text dimensions using Canvas API
 */
export function measureText(
  text: string,
  style: TextStyle,
  ctx?: CanvasRenderingContext2D | null
): { width: number; height: number } {
  if (!ctx) {
    ctx = createMeasurementCanvas();
  }
  
  if (!ctx) {
    // Fallback estimation when canvas is not available
    const charWidth = style.fontSize * 0.6;
    const lineHeight = style.fontSize * style.lineHeight;
    return {
      width: text.length * charWidth,
      height: lineHeight,
    };
  }

  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  const metrics = ctx.measureText(text);
  
  return {
    width: metrics.width,
    height: style.fontSize * style.lineHeight,
  };
}

/**
 * Wraps text to fit within a given width
 */
export function wrapText(
  text: string,
  maxWidth: number,
  style: TextStyle,
  ctx?: CanvasRenderingContext2D | null
): string[] {
  if (!ctx) {
    ctx = createMeasurementCanvas();
  }

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const { width } = measureText(testLine, style, ctx);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// =============================================================================
// Text Fitting Algorithms
// =============================================================================

/**
 * Fits text by reducing font size until it fits in the bounding box
 */
export function fitTextInBox(
  text: string,
  rect: Rect,
  style: TextStyle,
  constraints: TextConstraints,
  ctx?: CanvasRenderingContext2D | null
): FitTextResult {
  const minFontSize = constraints.minFontSize || 12;
  const maxFontSize = constraints.maxFontSize || style.fontSize;
  const maxLines = constraints.maxLines || Infinity;
  
  let currentFontSize = style.fontSize;
  let lines: string[] = [];
  let overflow = false;
  
  // Binary search for optimal font size
  let low = minFontSize;
  let high = maxFontSize;
  
  while (high - low > 1) {
    currentFontSize = Math.floor((low + high) / 2);
    const testStyle = { ...style, fontSize: currentFontSize };
    lines = wrapText(text, rect.w, testStyle, ctx);
    
    const totalHeight = lines.length * currentFontSize * style.lineHeight;
    
    if (lines.length <= maxLines && totalHeight <= rect.h) {
      low = currentFontSize;
    } else {
      high = currentFontSize;
    }
  }
  
  // Final check with the found size
  currentFontSize = low;
  const finalStyle = { ...style, fontSize: currentFontSize };
  lines = wrapText(text, rect.w, finalStyle, ctx);
  
  const finalHeight = lines.length * currentFontSize * style.lineHeight;
  overflow = lines.length > maxLines || finalHeight > rect.h;
  
  // Truncate if still overflowing
  if (overflow && maxLines < Infinity) {
    lines = lines.slice(0, maxLines);
    if (constraints.overflow === 'ellipsis' && lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      lines[lines.length - 1] = lastLine.slice(0, -3) + '...';
    }
  }
  
  return {
    fontSize: currentFontSize,
    lines,
    overflow,
    finalHeight,
  };
}

/**
 * Fits text on exactly N lines by adjusting font size
 */
export function fitTextOnNLines(
  text: string,
  rect: Rect,
  style: TextStyle,
  targetLines: number,
  minFontSize: number = 12,
  ctx?: CanvasRenderingContext2D | null
): FitTextResult {
  let currentFontSize = style.fontSize;
  let lines: string[] = [];
  
  // Start with current font size and reduce until we hit target lines or min
  while (currentFontSize >= minFontSize) {
    const testStyle = { ...style, fontSize: currentFontSize };
    lines = wrapText(text, rect.w, testStyle, ctx);
    
    if (lines.length <= targetLines) {
      const totalHeight = lines.length * currentFontSize * style.lineHeight;
      if (totalHeight <= rect.h) {
        break;
      }
    }
    
    currentFontSize -= 2;
  }
  
  // Ensure we don't go below minimum
  currentFontSize = Math.max(currentFontSize, minFontSize);
  const finalStyle = { ...style, fontSize: currentFontSize };
  lines = wrapText(text, rect.w, finalStyle, ctx);
  
  const finalHeight = lines.length * currentFontSize * style.lineHeight;
  const overflow = lines.length > targetLines || finalHeight > rect.h;
  
  return {
    fontSize: currentFontSize,
    lines: lines.slice(0, targetLines),
    overflow,
    finalHeight,
  };
}

// =============================================================================
// Overflow Detection
// =============================================================================

/**
 * Checks if text overflows its bounding box
 */
export function detectOverflow(
  text: string,
  rect: Rect,
  style: TextStyle,
  ctx?: CanvasRenderingContext2D | null
): { overflow: boolean; details: TextMeasurement } {
  const lines = wrapText(text, rect.w, style, ctx);
  const lineHeight = style.fontSize * style.lineHeight;
  const totalHeight = lines.length * lineHeight;
  
  const overflow = totalHeight > rect.h;
  
  return {
    overflow,
    details: {
      width: rect.w,
      height: totalHeight,
      lines: lines.length,
      overflow,
    },
  };
}

// =============================================================================
// CSS Style Generation
// =============================================================================

/**
 * Generates CSS styles for text with fitting applied
 */
export function generateFittedTextStyle(
  style: TextStyle,
  constraints: TextConstraints,
  fittedFontSize?: number
): React.CSSProperties {
  const fontSize = fittedFontSize || style.fontSize;
  
  const cssStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontSize,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    textAlign: style.align as React.CSSProperties['textAlign'],
    textTransform: style.textTransform as React.CSSProperties['textTransform'],
    textShadow: style.textShadow,
    margin: 0,
    padding: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  };
  
  // Apply overflow handling
  if (constraints.overflow === 'hidden') {
    cssStyle.overflow = 'hidden';
  } else if (constraints.overflow === 'ellipsis') {
    cssStyle.overflow = 'hidden';
    cssStyle.textOverflow = 'ellipsis';
    
    if (constraints.maxLines === 1) {
      cssStyle.whiteSpace = 'nowrap';
    } else if (constraints.maxLines) {
      cssStyle.display = '-webkit-box';
      (cssStyle as any).WebkitLineClamp = constraints.maxLines;
      (cssStyle as any).WebkitBoxOrient = 'vertical';
    }
  }
  
  return cssStyle;
}
