/**
 * BrollClip — B-roll video layer with fade transitions.
 *
 * Supports looping when the B-roll clip is shorter than the segment,
 * and uses smooth crossfade transitions at entry/exit.
 */

import React from 'react';
import {
  OffthreadVideo,
  Loop,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
} from 'remotion';
import type { BrollAssetRef } from '../../types/LongformSchema';

export interface BrollClipProps {
  broll: BrollAssetRef;
  children?: React.ReactNode;
}

const FADE_FRAMES = 8;

export const BrollClip: React.FC<BrollClipProps> = ({ broll, children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const startFromFrame = Math.round(broll.startTrim * fps);
  const brollDurationFrames = Math.round(broll.endTrim * fps) - startFromFrame;
  const resolvedSrc = broll.localPath.startsWith('http') || broll.localPath.startsWith('/')
    ? broll.localPath
    : staticFile(broll.localPath);

  // Fade in at start, fade out at end
  const fadeIn = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - FADE_FRAMES, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const opacity = Math.min(fadeIn, fadeOut) * broll.opacity;

  // Determine if we need to loop (B-roll shorter than segment)
  const needsLoop = brollDurationFrames > 0 && brollDurationFrames < durationInFrames;

  const videoElement = (
    <OffthreadVideo
      src={resolvedSrc}
      startFrom={startFromFrame}
      style={{
        width: '100%',
        height: '100%',
        objectFit: broll.fit === 'contain' ? 'contain' : 'cover',
      }}
    />
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: '100%', height: '100%', opacity }}>
        {needsLoop ? (
          <Loop durationInFrames={brollDurationFrames}>
            {videoElement}
          </Loop>
        ) : (
          videoElement
        )}
      </div>
      {children}
    </div>
  );
};
