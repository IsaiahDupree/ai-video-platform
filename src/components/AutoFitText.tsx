'use client';

import { useEffect, useRef, useState } from 'react';

export interface AutoFitTextProps {
  /** The text content to display */
  text: string;
  /** Maximum font size in pixels (default: 64) */
  maxFontSize?: number;
  /** Minimum font size in pixels (default: 12) */
  minFontSize?: number;
  /** Font weight (default: 700) */
  fontWeight?: number;
  /** Font family (default: 'Inter, sans-serif') */
  fontFamily?: string;
  /** Text color (default: '#000000') */
  color?: string;
  /** Line height multiplier (default: 1.2) */
  lineHeight?: number;
  /** Maximum number of lines before truncating (optional) */
  maxLines?: number;
  /** Container width in pixels */
  containerWidth: number;
  /** Container height in pixels */
  containerHeight: number;
  /** Padding inside container (default: 0) */
  padding?: number;
  /** Text alignment (default: 'center') */
  align?: 'left' | 'center' | 'right';
  /** Vertical alignment (default: 'middle') */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Truncation string when max lines exceeded (default: '...') */
  ellipsis?: string;
  /** Whether to allow shrinking below minimum font size (default: false) */
  allowOverflow?: boolean;
  /** CSS class name for custom styling */
  className?: string;
  /** Callback when text doesn't fit (font size = min) */
  onOverflow?: (isTruncated: boolean) => void;
}

interface TextMetrics {
  fontSize: number;
  lines: string[];
  isTruncated: boolean;
  actualWidth: number;
  actualHeight: number;
}

/**
 * AutoFitText - Automatically size text to fit within a container
 *
 * Features:
 * - Shrink-to-fit: Automatically reduces font size to fit text
 * - Line wrapping: Breaks text into multiple lines
 * - Line clamping: Limits maximum number of lines with ellipsis
 * - Safe-area handling: Respects padding and container bounds
 * - Vertical alignment: Top, middle, or bottom positioning
 * - Overflow detection: Callback when text doesn't fit
 */
export default function AutoFitText({
  text,
  maxFontSize = 64,
  minFontSize = 12,
  fontWeight = 700,
  fontFamily = 'Inter, sans-serif',
  color = '#000000',
  lineHeight = 1.2,
  maxLines,
  containerWidth,
  containerHeight,
  padding = 0,
  align = 'center',
  verticalAlign = 'middle',
  ellipsis = '...',
  allowOverflow = false,
  className = '',
  onOverflow,
}: AutoFitTextProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [metrics, setMetrics] = useState<TextMetrics>({
    fontSize: maxFontSize,
    lines: [],
    isTruncated: false,
    actualWidth: 0,
    actualHeight: 0,
  });

  useEffect(() => {
    const result = calculateOptimalSize();
    setMetrics(result);

    if (onOverflow) {
      onOverflow(result.isTruncated);
    }
  }, [
    text,
    maxFontSize,
    minFontSize,
    fontWeight,
    fontFamily,
    containerWidth,
    containerHeight,
    padding,
    maxLines,
  ]);

  const calculateOptimalSize = (): TextMetrics => {
    // Create a canvas for text measurement
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        fontSize: maxFontSize,
        lines: [text],
        isTruncated: false,
        actualWidth: 0,
        actualHeight: 0,
      };
    }

    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;

    // Binary search for optimal font size
    let low = minFontSize;
    let high = maxFontSize;
    let bestFit: TextMetrics = {
      fontSize: minFontSize,
      lines: [],
      isTruncated: false,
      actualWidth: 0,
      actualHeight: 0,
    };

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const result = tryFitText(ctx, mid, availableWidth, availableHeight);

      if (result.fits) {
        bestFit = result.metrics;
        low = mid + 1; // Try larger size
      } else {
        high = mid - 1; // Try smaller size
      }
    }

    return bestFit;
  };

  const tryFitText = (
    ctx: CanvasRenderingContext2D,
    fontSize: number,
    maxWidth: number,
    maxHeight: number
  ): { fits: boolean; metrics: TextMetrics } => {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    // Wrap text into lines
    const lines = wrapText(ctx, text, maxWidth);
    const lineHeightPx = fontSize * lineHeight;
    const totalHeight = lines.length * lineHeightPx;

    // Check if we need to truncate due to maxLines
    let isTruncated = false;
    let finalLines = lines;

    if (maxLines && lines.length > maxLines) {
      isTruncated = true;
      finalLines = lines.slice(0, maxLines);

      // Add ellipsis to last line
      const lastLine = finalLines[maxLines - 1];
      const ellipsisWidth = ctx.measureText(ellipsis).width;

      // Trim last line to fit ellipsis
      let trimmedLine = lastLine;
      while (ctx.measureText(trimmedLine + ellipsis).width > maxWidth && trimmedLine.length > 0) {
        trimmedLine = trimmedLine.slice(0, -1).trim();
      }
      finalLines[maxLines - 1] = trimmedLine + ellipsis;
    }

    // Calculate actual dimensions
    let maxLineWidth = 0;
    finalLines.forEach((line) => {
      const width = ctx.measureText(line).width;
      if (width > maxLineWidth) {
        maxLineWidth = width;
      }
    });

    const actualHeight = finalLines.length * lineHeightPx;
    const fits = actualHeight <= maxHeight && maxLineWidth <= maxWidth;

    return {
      fits: allowOverflow || fits,
      metrics: {
        fontSize,
        lines: finalLines,
        isTruncated,
        actualWidth: maxLineWidth,
        actualHeight,
      },
    };
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  };

  // Calculate vertical position based on alignment
  const getVerticalOffset = (): number => {
    const availableHeight = containerHeight - padding * 2;
    const contentHeight = metrics.actualHeight;

    switch (verticalAlign) {
      case 'top':
        return padding;
      case 'bottom':
        return containerHeight - padding - contentHeight;
      case 'middle':
      default:
        return (containerHeight - contentHeight) / 2;
    }
  };

  // Calculate text alignment style
  const getTextAlign = (): 'left' | 'center' | 'right' => {
    return align;
  };

  const verticalOffset = getVerticalOffset();
  const lineHeightPx = metrics.fontSize * lineHeight;

  return (
    <div
      className={className}
      style={{
        width: containerWidth,
        height: containerHeight,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: padding,
          right: padding,
          top: verticalOffset,
          textAlign: getTextAlign(),
          fontFamily,
          fontWeight,
          fontSize: metrics.fontSize,
          lineHeight: `${lineHeightPx}px`,
          color,
        }}
      >
        {metrics.lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook for measuring text dimensions
 * Useful for calculating text size before rendering
 */
export function useTextMetrics(
  text: string,
  fontSize: number,
  fontWeight: number,
  fontFamily: string
): { width: number; height: number } {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);

    setDimensions({
      width: metrics.width,
      height: fontSize,
    });
  }, [text, fontSize, fontWeight, fontFamily]);

  return dimensions;
}

/**
 * Utility function to check if text fits in container
 * Useful for validation before rendering
 */
export function checkTextFits(
  text: string,
  fontSize: number,
  fontWeight: number,
  fontFamily: string,
  maxWidth: number,
  maxHeight: number,
  lineHeight: number = 1.2
): { fits: boolean; lines: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { fits: false, lines: 0 };

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  // Simple word wrapping
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  const totalHeight = lines.length * fontSize * lineHeight;
  const fits = totalHeight <= maxHeight;

  return { fits, lines: lines.length };
}
