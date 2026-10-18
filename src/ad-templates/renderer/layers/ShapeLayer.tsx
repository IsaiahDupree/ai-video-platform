/**
 * ShapeLayer Component
 * 
 * Renders shapes (rect, circle, ellipse, line) with pixel-accurate positioning.
 */

import React from 'react';
import type { ShapeLayer as ShapeLayerType } from '../../schema/template-dsl';

interface ShapeLayerProps {
  layer: ShapeLayerType;
}

export const ShapeLayer: React.FC<ShapeLayerProps> = ({ layer }) => {
  if (!layer.visible) return null;

  const { rect, shape } = layer;

  // Build gradient if specified
  const getBackground = (): string | undefined => {
    if (shape.gradient) {
      const { type, angle, stops } = shape.gradient;
      const stopStrings = stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ');
      
      if (type === 'linear') {
        return `linear-gradient(${angle || 0}deg, ${stopStrings})`;
      } else {
        return `radial-gradient(circle, ${stopStrings})`;
      }
    }
    return shape.fill;
  };

  // Build box shadow if specified
  const getBoxShadow = (): string | undefined => {
    if (!shape.shadow) return undefined;
    const { x, y, blur, spread = 0, color } = shape.shadow;
    return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  };

  // Common styles for all shapes
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: rect.x,
    top: rect.y,
    width: rect.w,
    height: rect.h,
    opacity: shape.opacity ?? 1,
  };

  // Render based on shape kind
  switch (shape.kind) {
    case 'rect': {
      const style: React.CSSProperties = {
        ...baseStyle,
        background: getBackground(),
        borderRadius: shape.radius || 0,
        border: shape.stroke ? `${shape.strokeWidth || 1}px solid ${shape.stroke}` : undefined,
        boxShadow: getBoxShadow(),
      };
      return <div style={style} />;
    }

    case 'circle': {
      // For circle, use the smaller dimension as diameter
      const diameter = Math.min(rect.w, rect.h);
      const style: React.CSSProperties = {
        ...baseStyle,
        width: diameter,
        height: diameter,
        background: getBackground(),
        borderRadius: '50%',
        border: shape.stroke ? `${shape.strokeWidth || 1}px solid ${shape.stroke}` : undefined,
        boxShadow: getBoxShadow(),
      };
      return <div style={style} />;
    }

    case 'ellipse': {
      const style: React.CSSProperties = {
        ...baseStyle,
        background: getBackground(),
        borderRadius: '50%',
        border: shape.stroke ? `${shape.strokeWidth || 1}px solid ${shape.stroke}` : undefined,
        boxShadow: getBoxShadow(),
      };
      return <div style={style} />;
    }

    case 'line': {
      // Line is rendered as a thin rectangle
      const style: React.CSSProperties = {
        ...baseStyle,
        height: shape.strokeWidth || 1,
        background: shape.stroke || shape.fill || '#000000',
      };
      return <div style={style} />;
    }

    default:
      return null;
  }
};

export default ShapeLayer;
