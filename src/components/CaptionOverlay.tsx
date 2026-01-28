/**
 * CaptionOverlay Component
 *
 * Renders text captions/overlays on screenshots with positioning, styling, and localization support.
 * Compatible with Remotion for static rendering and React for UI.
 *
 * @example
 * ```tsx
 * <CaptionOverlay
 *   caption={{
 *     id: 'caption-1',
 *     text: 'Welcome to Your App',
 *     positioning: { position: 'top-center', offsetY: 80 },
 *     style: { fontSize: 48, fontWeight: 700, color: '#ffffff' }
 *   }}
 *   locale="en-US"
 * />
 * ```
 */

import React, { CSSProperties } from 'react';
import {
  CaptionOverlayProps,
  CaptionPosition,
  getCaptionText,
  getCaptionStyle,
} from '../types/captionOverlay';

/**
 * Convert caption position to CSS positioning
 */
function getPositionStyles(
  position: CaptionPosition,
  offsetX: number = 0,
  offsetY: number = 0
): CSSProperties {
  const styles: CSSProperties = {
    position: 'absolute',
  };

  switch (position) {
    case 'top-left':
      styles.top = offsetY;
      styles.left = offsetX;
      break;
    case 'top-center':
      styles.top = offsetY;
      styles.left = '50%';
      styles.transform = 'translateX(-50%)';
      break;
    case 'top-right':
      styles.top = offsetY;
      styles.right = offsetX;
      break;
    case 'center-left':
      styles.top = '50%';
      styles.left = offsetX;
      styles.transform = 'translateY(-50%)';
      break;
    case 'center':
      styles.top = '50%';
      styles.left = '50%';
      styles.transform = 'translate(-50%, -50%)';
      break;
    case 'center-right':
      styles.top = '50%';
      styles.right = offsetX;
      styles.transform = 'translateY(-50%)';
      break;
    case 'bottom-left':
      styles.bottom = offsetY;
      styles.left = offsetX;
      break;
    case 'bottom-center':
      styles.bottom = offsetY;
      styles.left = '50%';
      styles.transform = 'translateX(-50%)';
      break;
    case 'bottom-right':
      styles.bottom = offsetY;
      styles.right = offsetX;
      break;
    case 'custom':
      // Custom positioning will be handled separately
      break;
  }

  return styles;
}

/**
 * Convert caption style to CSS properties
 */
function captionStyleToCSS(
  style: ReturnType<typeof getCaptionStyle>
): CSSProperties {
  const css: CSSProperties = {};

  // Font
  if (style.fontFamily) css.fontFamily = style.fontFamily;
  if (style.fontSize) css.fontSize = typeof style.fontSize === 'number' ? `${style.fontSize}px` : style.fontSize;
  if (style.fontWeight) css.fontWeight = style.fontWeight;
  if (style.fontStyle) css.fontStyle = style.fontStyle;
  if (style.lineHeight) css.lineHeight = typeof style.lineHeight === 'number' ? `${style.lineHeight}` : style.lineHeight;
  if (style.letterSpacing) css.letterSpacing = typeof style.letterSpacing === 'number' ? `${style.letterSpacing}px` : style.letterSpacing;

  // Color
  if (style.color) css.color = style.color;
  if (style.backgroundColor) {
    if (style.backgroundOpacity !== undefined) {
      // Parse color and apply opacity
      const rgb = parseColor(style.backgroundColor);
      if (rgb) {
        css.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${style.backgroundOpacity})`;
      } else {
        css.backgroundColor = style.backgroundColor;
      }
    } else {
      css.backgroundColor = style.backgroundColor;
    }
  }

  // Text styling
  if (style.textAlign) css.textAlign = style.textAlign;
  if (style.textTransform) css.textTransform = style.textTransform;
  if (style.textDecoration) css.textDecoration = style.textDecoration;

  // Spacing
  if (style.padding !== undefined) css.padding = typeof style.padding === 'number' ? `${style.padding}px` : style.padding;
  if (style.paddingTop !== undefined) css.paddingTop = typeof style.paddingTop === 'number' ? `${style.paddingTop}px` : style.paddingTop;
  if (style.paddingRight !== undefined) css.paddingRight = typeof style.paddingRight === 'number' ? `${style.paddingRight}px` : style.paddingRight;
  if (style.paddingBottom !== undefined) css.paddingBottom = typeof style.paddingBottom === 'number' ? `${style.paddingBottom}px` : style.paddingBottom;
  if (style.paddingLeft !== undefined) css.paddingLeft = typeof style.paddingLeft === 'number' ? `${style.paddingLeft}px` : style.paddingLeft;

  if (style.margin !== undefined) css.margin = typeof style.margin === 'number' ? `${style.margin}px` : style.margin;
  if (style.marginTop !== undefined) css.marginTop = typeof style.marginTop === 'number' ? `${style.marginTop}px` : style.marginTop;
  if (style.marginRight !== undefined) css.marginRight = typeof style.marginRight === 'number' ? `${style.marginRight}px` : style.marginRight;
  if (style.marginBottom !== undefined) css.marginBottom = typeof style.marginBottom === 'number' ? `${style.marginBottom}px` : style.marginBottom;
  if (style.marginLeft !== undefined) css.marginLeft = typeof style.marginLeft === 'number' ? `${style.marginLeft}px` : style.marginLeft;

  // Border & shadow
  if (style.borderRadius !== undefined) css.borderRadius = typeof style.borderRadius === 'number' ? `${style.borderRadius}px` : style.borderRadius;
  if (style.border) css.border = style.border;
  if (style.boxShadow) css.boxShadow = style.boxShadow;
  if (style.textShadow) css.textShadow = style.textShadow;

  // Size
  if (style.maxWidth !== undefined) css.maxWidth = typeof style.maxWidth === 'number' ? `${style.maxWidth}px` : style.maxWidth;
  if (style.minWidth !== undefined) css.minWidth = typeof style.minWidth === 'number' ? `${style.minWidth}px` : style.minWidth;
  if (style.width !== undefined) css.width = typeof style.width === 'number' ? `${style.width}px` : style.width;

  // Opacity
  if (style.opacity !== undefined) css.opacity = style.opacity;

  // Backdrop
  if (style.backdropFilter) css.backdropFilter = style.backdropFilter;

  return css;
}

/**
 * Parse color string to RGB values
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    } else if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  // Handle rgb() format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  return null;
}

/**
 * CaptionOverlay component
 */
export function CaptionOverlay({
  caption,
  locale,
  containerWidth,
  containerHeight,
  rtl = false,
  className,
  style: additionalStyles,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: CaptionOverlayProps) {
  // Don't render if not visible
  if (caption.visible === false) {
    return null;
  }

  // Get localized text and style
  const text = getCaptionText(caption.text, locale);
  const captionStyle = getCaptionStyle(caption.text, caption.style, locale);

  // Build positioning styles
  let positionStyles: CSSProperties;

  if (caption.positioning.position === 'custom') {
    // Custom positioning using x, y coordinates
    positionStyles = {
      position: 'absolute',
      ...(caption.positioning.x !== undefined && {
        left: typeof caption.positioning.x === 'number' ? `${caption.positioning.x}%` : caption.positioning.x,
      }),
      ...(caption.positioning.y !== undefined && {
        top: typeof caption.positioning.y === 'number' ? `${caption.positioning.y}%` : caption.positioning.y,
      }),
    };
  } else {
    // Preset positioning
    positionStyles = getPositionStyles(
      caption.positioning.position,
      caption.positioning.offsetX,
      caption.positioning.offsetY
    );
  }

  // Apply z-index
  if (caption.positioning.zIndex !== undefined) {
    positionStyles.zIndex = caption.positioning.zIndex;
  }

  // Convert caption style to CSS
  const styleCSS = captionStyleToCSS(captionStyle);

  // Apply RTL if needed
  if (rtl) {
    styleCSS.direction = 'rtl';
  }

  // Merge all styles
  const finalStyles: CSSProperties = {
    ...positionStyles,
    ...styleCSS,
    ...additionalStyles,
  };

  // Apply animation if specified
  let animationClass = '';
  if (caption.animation && caption.animation.type !== 'none') {
    animationClass = `caption-animation-${caption.animation.type}`;
  }

  return (
    <div
      className={`caption-overlay ${animationClass} ${className || ''}`.trim()}
      style={finalStyles}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-caption-id={caption.id}
    >
      {text}
    </div>
  );
}

/**
 * Default export
 */
export default CaptionOverlay;

/**
 * Re-export types for convenience
 */
export type {
  CaptionConfig,
  CaptionOverlayProps,
  CaptionPosition,
  CaptionStyle,
  CaptionPositioning,
  LocalizedCaption,
  CaptionPreset,
} from '../types/captionOverlay';

export {
  getCaptionText,
  getCaptionStyle,
  getCaptionPreset,
  getCaptionPresetsByCategory,
  createCaptionFromPreset,
  captionPresets,
} from '../types/captionOverlay';
