import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface TrialReelVariantProps {
  [key: string]: unknown;
  videoUrl: string;
  durationSec: number;
  onScreenText: string;
  onScreenSubtext?: string;
  accentColor: string;
  visualFilter: string;
  overlayColor: string;
  overlayOpacity: number;
  cropScale: number;
  cropXPercent: number;
  cropYPercent: number;
  brandId: string;
}

export const TrialReelVariant: React.FC<TrialReelVariantProps> = ({
  videoUrl,
  onScreenText,
  onScreenSubtext = '',
  accentColor,
  visualFilter,
  overlayColor,
  overlayOpacity,
  cropScale,
  cropXPercent,
  cropYPercent,
  brandId,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 170 } });
  const titleOpacity = interpolate(
    frame,
    [0, 8, Math.max(9, durationInFrames - 12), durationInFrames - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', fontFamily: 'Arial, sans-serif' }}>
      <OffthreadVideo
        src={videoUrl}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: visualFilter,
          transform: `translate(${cropXPercent}%, ${cropYPercent}%) scale(${cropScale})`,
          transformOrigin: 'center center',
        }}
      />

      {overlayOpacity > 0 ? (
        <AbsoluteFill
          style={{
            backgroundColor: overlayColor,
            opacity: Math.max(0, Math.min(1, overlayOpacity)),
            mixBlendMode: 'soft-light',
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 31%, rgba(0,0,0,0) 76%, rgba(0,0,0,0.62) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 118,
          backgroundColor: '#080A0C',
          opacity: titleOpacity,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 118,
          left: 56,
          right: 56,
          display: 'flex',
          opacity: titleOpacity,
          transform: `translateY(${Math.round((1 - entrance) * -28)}px)`,
        }}
      >
        <div style={{ width: 10, flex: '0 0 10px', backgroundColor: accentColor }} />
        <div
          style={{
            minWidth: 0,
            padding: '24px 28px 23px',
            backgroundColor: '#080A0C',
            border: '1px solid rgba(255,255,255,0.16)',
          }}
        >
          <div
            style={{
              color: '#FFFFFF',
              fontSize: 60,
              fontWeight: 900,
              lineHeight: 1.04,
              letterSpacing: 0,
              overflowWrap: 'anywhere',
            }}
          >
            {onScreenText}
          </div>
          {onScreenSubtext ? (
            <div
              style={{
                color: accentColor,
                fontSize: 31,
                fontWeight: 700,
                lineHeight: 1.18,
                letterSpacing: 0,
                marginTop: 14,
              }}
            >
              {onScreenSubtext}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 34,
          bottom: 42,
          color: '#FFFFFF',
          fontSize: 22,
          fontWeight: 700,
          opacity: 0.62,
          letterSpacing: 0,
          textShadow: '0 2px 10px rgba(0,0,0,0.85)',
        }}
      >
        @{brandId.replace(/^@/, '')}
      </div>
    </AbsoluteFill>
  );
};
