/**
 * SpeakerOverBroll — Speaker cutout composited over B-roll background.
 *
 * Uses a ProRes 4444 alpha video for the speaker mask layer,
 * positioned and scaled in a corner over the B-roll.
 */

import React from 'react';
import {
  OffthreadVideo,
  useVideoConfig,
} from 'remotion';
import type { BrollAssetRef, SpeakerMaskRef } from '../../types/LongformSchema';
import { BrollClip } from './BrollClip';

export interface SpeakerOverBrollProps {
  broll: BrollAssetRef;
  speakerMask: SpeakerMaskRef;
  sourceVideo: string;
  sourceStartTrim: number;
  children?: React.ReactNode;
}

const POSITION_MAP: Record<string, React.CSSProperties> = {
  bottom_right: { bottom: 40, right: 40 },
  bottom_left: { bottom: 40, left: 40 },
  bottom_center: { bottom: 40, left: '50%', transform: 'translateX(-50%)' },
};

export const SpeakerOverBroll: React.FC<SpeakerOverBrollProps> = ({
  broll,
  speakerMask,
  sourceVideo,
  sourceStartTrim,
  children,
}) => {
  const { fps, width, height } = useVideoConfig();

  const maskStartFrame = Math.round(sourceStartTrim * fps);
  const maskWidth = Math.round(width * speakerMask.scale);
  const maskHeight = Math.round(height * speakerMask.scale);
  const positionStyle = POSITION_MAP[speakerMask.position] || POSITION_MAP.bottom_right;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Background: B-roll */}
      <BrollClip broll={broll} />

      {/* Foreground: Speaker alpha matte */}
      <div
        style={{
          position: 'absolute',
          ...positionStyle,
          width: maskWidth,
          height: maskHeight,
          borderRadius: speakerMask.border.radius,
          border: `${speakerMask.border.width}px solid ${speakerMask.border.color}`,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <OffthreadVideo
          src={speakerMask.path}
          startFrom={maskStartFrame}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Overlay content (captions, etc.) */}
      {children}
    </div>
  );
};
