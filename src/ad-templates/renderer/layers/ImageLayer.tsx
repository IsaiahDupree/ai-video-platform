/**
 * ImageLayer Component
 * 
 * Renders images with pixel-accurate positioning and flexible fit modes.
 */

import React from 'react';
import { Img } from 'remotion';
import type { ImageLayer as ImageLayerType, Bindings, ImageAnchor } from '../../schema/template-dsl';
import { resolveImageSrc } from '../../schema/template-dsl';

interface ImageLayerProps {
  layer: ImageLayerType;
  bindings: Bindings;
}

const getObjectPosition = (anchor: ImageAnchor): string => {
  switch (anchor) {
    case 'center': return 'center center';
    case 'top': return 'center top';
    case 'bottom': return 'center bottom';
    case 'left': return 'left center';
    case 'right': return 'right center';
    case 'top-left': return 'left top';
    case 'top-right': return 'right top';
    case 'bottom-left': return 'left bottom';
    case 'bottom-right': return 'right bottom';
    default: return 'center center';
  }
};

export const ImageLayer: React.FC<ImageLayerProps> = ({ layer, bindings }) => {
  if (!layer.visible) return null;

  const src = resolveImageSrc(layer, bindings);
  if (!src) return null;

  const { rect, image } = layer;
  const imageStyle = image || { fit: 'cover', anchor: 'center', borderRadius: 0, opacity: 1 };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: rect.x,
    top: rect.y,
    width: rect.w,
    height: rect.h,
    overflow: 'hidden',
    borderRadius: imageStyle.borderRadius || 0,
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: imageStyle.fit || 'cover',
    objectPosition: getObjectPosition(imageStyle.anchor || 'center'),
    opacity: imageStyle.opacity ?? 1,
    filter: imageStyle.filter,
  };

  return (
    <div style={containerStyle}>
      <Img src={src} style={imgStyle} />
    </div>
  );
};

export default ImageLayer;
