/**
 * HookOverlay — Big bold text overlaid on the first ~1.5s of a short.
 * Slides up, holds, fades out. Designed for vertical 1080×1920 canvas.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import type { HookOverlay as HookOverlayConfig } from '../../types/ShortsSchema';

const SLIDE_IN_FRAMES = 6;
const FADE_OUT_FRAMES = 8;

export const HookOverlay: React.FC<{ config: HookOverlayConfig }> = ({ config }) => {
  const frame = useCurrentFrame();
  if (frame >= config.durationFrames) return null;

  const slideY = interpolate(frame, [0, SLIDE_IN_FRAMES], [80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(
    frame,
    [
      0,
      SLIDE_IN_FRAMES,
      config.durationFrames - FADE_OUT_FRAMES,
      config.durationFrames,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const verticalAlign =
    config.position === 'top' ? 'flex-start' : 'center';
  const paddingTop =
    config.position === 'top' ? '20%' : 0;

  const accent =
    config.style === 'punchy' ? '#ffd400' : '#ffffff';

  return (
    <AbsoluteFill
      style={{
        justifyContent: verticalAlign,
        alignItems: 'center',
        pointerEvents: 'none',
        paddingTop,
        paddingLeft: 60,
        paddingRight: 60,
        zIndex: 30,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${slideY}px)`,
          color: accent,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 96,
          lineHeight: 1.05,
          textAlign: 'center',
          letterSpacing: -1.5,
          textShadow:
            '4px 4px 0 #000, -4px 4px 0 #000, 4px -4px 0 #000, -4px -4px 0 #000, 0 0 32px rgba(0,0,0,0.85)',
          maxWidth: '92%',
        }}
      >
        {config.text}
      </div>
    </AbsoluteFill>
  );
};
