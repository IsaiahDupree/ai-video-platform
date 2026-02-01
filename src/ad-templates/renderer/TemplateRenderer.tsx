/**
 * TemplateRenderer Component
 * 
 * Main renderer that takes a TemplateDSL and renders all layers
 * with pixel-accurate positioning.
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { TemplateDSL, Layer, Bindings } from '../schema/template-dsl';
import { getSortedLayers } from '../schema/template-dsl';
import { TextLayer } from './layers/TextLayer';
import { ImageLayer } from './layers/ImageLayer';
import { ShapeLayer } from './layers/ShapeLayer';

interface TemplateRendererProps {
  template: TemplateDSL;
  overrideBindings?: Partial<Bindings>;
}

const renderLayer = (layer: Layer, bindings: Bindings, index: number) => {
  const key = `${layer.id}-${index}`;
  
  switch (layer.type) {
    case 'text':
      return <TextLayer key={key} layer={layer} bindings={bindings} />;
    case 'image':
      return <ImageLayer key={key} layer={layer} bindings={bindings} />;
    case 'shape':
      return <ShapeLayer key={key} layer={layer} />;
    default:
      return null;
  }
};

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  template,
  overrideBindings,
}) => {
  const { canvas, bindings: templateBindings } = template;
  
  // Merge bindings with overrides
  const bindings: Bindings = {
    text: { ...templateBindings.text, ...overrideBindings?.text },
    assets: { ...templateBindings.assets, ...overrideBindings?.assets },
  };

  // Get layers sorted by z-index
  const sortedLayers = getSortedLayers(template);

  const containerStyle: React.CSSProperties = {
    width: canvas.width,
    height: canvas.height,
    backgroundColor: canvas.bgColor || 'transparent',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <AbsoluteFill style={{ backgroundColor: canvas.bgColor || 'transparent' }}>
      <div style={containerStyle}>
        {sortedLayers.map((layer, index) => renderLayer(layer, bindings, index))}
      </div>
    </AbsoluteFill>
  );
};

export default TemplateRenderer;
