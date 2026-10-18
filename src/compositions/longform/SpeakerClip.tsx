/**
 * SpeakerClip — Original speaker footage with zoom effects.
 */

import React from 'react';
import {
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
} from 'remotion';
import type { ZoomConfig } from '../../types/LongformSchema';

export interface SpeakerClipProps {
  src: string;
  startTrim: number;   // seconds into source video
  endTrim: number;
  zoom: ZoomConfig | null;
  children?: React.ReactNode;
}

export const SpeakerClip: React.FC<SpeakerClipProps> = ({
  src,
  startTrim,
  endTrim,
  zoom,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const startFromFrame = Math.round(startTrim * fps);
  const resolvedSrc = src.startsWith('http') || src.startsWith('/') ? src : staticFile(src);

  // Compute zoom scale
  let scale = 1.0;
  if (zoom && zoom.type !== 'none') {
    if (zoom.type === 'snap_zoom') {
      // Quick snap to target scale in first 6 frames
      scale = interpolate(frame, [0, 6], [zoom.startScale, zoom.endScale], {
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp',
      });
    } else {
      // Smooth push in or pull out over full duration
      scale = interpolate(
        frame,
        [0, durationInFrames],
        [zoom.startScale, zoom.endScale],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <Video
          src={resolvedSrc}
          startFrom={startFromFrame}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
      {children}
    </div>
  );
};
