/**
 * TextLayer Component
 * 
 * Renders text with pixel-accurate positioning and optional text fitting.
 */

import React from 'react';
import type { TextLayer as TextLayerType, Bindings } from '../../schema/template-dsl';
import { resolveTextContent } from '../../schema/template-dsl';

interface TextLayerProps {
  layer: TextLayerType;
  bindings: Bindings;
}

export const TextLayer: React.FC<TextLayerProps> = ({ layer, bindings }) => {
  if (!layer.visible) return null;

  const content = resolveTextContent(layer, bindings);
  const { rect, text, constraints } = layer;

  const getJustifyContent = () => {
    switch (text.valign) {
      case 'top': return 'flex-start';
      case 'middle': return 'center';
      case 'bottom': return 'flex-end';
      default: return 'flex-start';
    }
  };

  const getTextAlign = (): React.CSSProperties['textAlign'] => {
    return text.align || 'left';
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: rect.x,
    top: rect.y,
    width: rect.w,
    height: rect.h,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: getJustifyContent(),
    overflow: constraints?.overflow === 'hidden' ? 'hidden' : 'visible',
  };

  const textStyle: React.CSSProperties = {
    fontFamily: text.fontFamily,
    fontWeight: text.fontWeight,
    fontSize: text.fontSize,
    lineHeight: text.lineHeight,
    letterSpacing: text.letterSpacing,
    color: text.color,
    textAlign: getTextAlign(),
    textTransform: text.textTransform || 'none',
    textShadow: text.textShadow,
    margin: 0,
    padding: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  };

  // Handle text overflow with ellipsis
  if (constraints?.overflow === 'ellipsis') {
    textStyle.overflow = 'hidden';
    textStyle.textOverflow = 'ellipsis';
    if (constraints.maxLines === 1) {
      textStyle.whiteSpace = 'nowrap';
    } else if (constraints.maxLines) {
      textStyle.display = '-webkit-box';
      (textStyle as any).WebkitLineClamp = constraints.maxLines;
      (textStyle as any).WebkitBoxOrient = 'vertical';
    }
  }

  return (
    <div style={containerStyle}>
      <p style={textStyle}>{content}</p>
    </div>
  );
};

export default TextLayer;
