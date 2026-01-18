import React from 'react';
import {
  AbsoluteFill,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  staticFile,
} from 'remotion';
import { BLANKLOGO_COLORS, BLANKLOGO_FONTS } from './config';

export interface BeforeAfterVideoProps {
  beforeVideoSrc?: string;
  afterVideoSrc?: string;
  beforeStartFrame?: number;
  afterStartFrame?: number;
  beforeDuration?: number;
  afterDuration?: number;
  headline?: string;
  subheadline?: string;
  badge?: string;
  cta?: string;
  underButtonText?: string;
  trustLine?: string;
  footerText?: string;
  beforeLabel?: string;
  beforeSubLabel?: string;
  afterLabel?: string;
  afterSubLabel?: string;
  aspectRatio?: '16:9' | '9:16' | '4:5' | '1:1';
}

export const BeforeAfterVideo: React.FC<BeforeAfterVideoProps> = ({
  beforeVideoSrc,
  afterVideoSrc,
  beforeStartFrame = 120, // ~4 seconds at 30fps
  afterStartFrame = 120, // ~4 seconds at 30fps (same position as before)
  beforeDuration = 90, // 3 seconds
  afterDuration = 90, // 3 seconds
  headline = 'Remove Video Watermarks Fast',
  subheadline = 'Upload → Remove Watermark → Download',
  badge = 'AD-FREE',
  cta = 'Get 10 Free Credits',
  underButtonText = '10 free credits (one-time) • No card',
  trustLine = 'Quality preserved • No popups',
  footerText = 'Ad-free • Quality preserved • Built for creators',
  beforeLabel = 'BEFORE',
  beforeSubLabel = "Can't post this.",
  afterLabel = 'AFTER',
  afterSubLabel = 'Ready to post.',
  aspectRatio = '16:9',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Timeline phases
  const beforeEnd = beforeDuration;
  const afterEnd = beforeEnd + afterDuration;
  const textStart = afterEnd;
  const textDuration = 120; // 4 seconds for text

  // Determine current phase
  const isBeforePhase = frame < beforeEnd;
  const isAfterPhase = frame >= beforeEnd && frame < afterEnd;
  const isTextPhase = frame >= textStart;

  // Label animations
  const labelOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const labelScale = spring({
    frame: frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // After label animation
  const afterLabelOpacity = interpolate(
    frame,
    [beforeEnd, beforeEnd + 15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const afterLabelScale = spring({
    frame: Math.max(0, frame - beforeEnd),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Text phase animations
  const textPhaseFrame = Math.max(0, frame - textStart);
  const headlineOpacity = interpolate(textPhaseFrame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const headlineY = interpolate(textPhaseFrame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });
  
  const subheadlineOpacity = interpolate(textPhaseFrame, [15, 35], [0, 1], { extrapolateRight: 'clamp' });
  const subheadlineY = interpolate(textPhaseFrame, [15, 35], [20, 0], { extrapolateRight: 'clamp' });
  
  const ctaOpacity = interpolate(textPhaseFrame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const ctaScale = spring({
    frame: Math.max(0, textPhaseFrame - 30),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const badgeOpacity = interpolate(textPhaseFrame, [45, 60], [0, 1], { extrapolateRight: 'clamp' });

  // Responsive sizing based on aspect ratio
  const isVertical = aspectRatio === '9:16';
  const isSquare = aspectRatio === '1:1';
  const isHorizontal = aspectRatio === '16:9';
  const labelFontSize = isVertical ? 36 : isHorizontal ? 40 : isSquare ? 32 : 28;
  const headlineFontSize = isVertical ? 64 : isHorizontal ? 72 : isSquare ? 56 : 52;
  const subheadlineFontSize = isVertical ? 32 : isHorizontal ? 36 : isSquare ? 28 : 26;
  const ctaFontSize = isVertical ? 28 : isHorizontal ? 32 : isSquare ? 24 : 22;
  const badgeFontSize = isVertical ? 20 : isHorizontal ? 24 : isSquare ? 18 : 16;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BLANKLOGO_COLORS.darker,
      }}
    >
      {/* Before Video Phase */}
      {isBeforePhase && (
        <AbsoluteFill>
          <Video
            src={beforeVideoSrc}
            startFrom={beforeStartFrame}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Before Label */}
          <div
            style={{
              position: 'absolute',
              top: isVertical ? 120 : isHorizontal ? 40 : 60,
              left: '50%',
              transform: `translateX(-50%) scale(${labelScale})`,
              opacity: labelOpacity,
              backgroundColor: 'rgba(239, 68, 68, 0.95)',
              color: 'white',
              padding: isHorizontal ? '16px 48px' : '12px 32px',
              borderRadius: 8,
              fontFamily: BLANKLOGO_FONTS.heading,
              fontSize: labelFontSize,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {beforeLabel}
          </div>
          {/* Watermark indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: isVertical ? 200 : isHorizontal ? 60 : 100,
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: labelOpacity * 0.9,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              color: '#ef4444',
              padding: isHorizontal ? '12px 28px' : '8px 20px',
              borderRadius: 8,
              fontFamily: BLANKLOGO_FONTS.body,
              fontSize: isHorizontal ? labelFontSize * 0.8 : labelFontSize * 0.7,
              fontWeight: 600,
            }}
          >
            {beforeSubLabel}
          </div>
        </AbsoluteFill>
      )}

      {/* After Video Phase */}
      {isAfterPhase && (
        <AbsoluteFill>
          <Video
            src={afterVideoSrc}
            startFrom={afterStartFrame}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* After Label */}
          <div
            style={{
              position: 'absolute',
              top: isVertical ? 120 : isHorizontal ? 40 : 60,
              left: '50%',
              transform: `translateX(-50%) scale(${afterLabelScale})`,
              opacity: afterLabelOpacity,
              backgroundColor: 'rgba(34, 197, 94, 0.95)',
              color: 'white',
              padding: isHorizontal ? '16px 48px' : '12px 32px',
              borderRadius: 8,
              fontFamily: BLANKLOGO_FONTS.heading,
              fontSize: labelFontSize,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {afterLabel}
          </div>
          {/* Clean indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: isVertical ? 200 : isHorizontal ? 60 : 100,
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: afterLabelOpacity * 0.9,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              color: '#22c55e',
              padding: isHorizontal ? '12px 28px' : '8px 20px',
              borderRadius: 8,
              fontFamily: BLANKLOGO_FONTS.body,
              fontSize: isHorizontal ? labelFontSize * 0.8 : labelFontSize * 0.7,
              fontWeight: 600,
            }}
          >
            {afterSubLabel}
          </div>
        </AbsoluteFill>
      )}

      {/* Text Phase */}
      {isTextPhase && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, ${BLANKLOGO_COLORS.darker} 0%, #1a1a2e 100%)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isVertical ? 60 : 40,
          }}
        >
          {/* Logo */}
          <div
            style={{
              position: 'absolute',
              top: isVertical ? 80 : 40,
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: headlineOpacity,
            }}
          >
            <div
              style={{
                fontFamily: BLANKLOGO_FONTS.heading,
                fontSize: isVertical ? 32 : 28,
                fontWeight: 800,
                color: BLANKLOGO_COLORS.white,
                letterSpacing: '-0.02em',
              }}
            >
              Blank<span style={{ color: BLANKLOGO_COLORS.accent }}>Logo</span>
            </div>
          </div>

          {/* Badge */}
          <div
            style={{
              opacity: badgeOpacity,
              backgroundColor: BLANKLOGO_COLORS.accent,
              color: BLANKLOGO_COLORS.darker,
              padding: '8px 20px',
              borderRadius: 20,
              fontFamily: BLANKLOGO_FONTS.body,
              fontSize: badgeFontSize,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 24,
            }}
          >
            {badge}
          </div>

          {/* Headline */}
          <div
            style={{
              opacity: headlineOpacity,
              transform: `translateY(${headlineY}px)`,
              fontFamily: BLANKLOGO_FONTS.heading,
              fontSize: headlineFontSize,
              fontWeight: 800,
              color: BLANKLOGO_COLORS.white,
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: 20,
              maxWidth: '90%',
            }}
          >
            {headline}
          </div>

          {/* Subheadline */}
          <div
            style={{
              opacity: subheadlineOpacity,
              transform: `translateY(${subheadlineY}px)`,
              fontFamily: BLANKLOGO_FONTS.body,
              fontSize: subheadlineFontSize,
              fontWeight: 400,
              color: BLANKLOGO_COLORS.lightGray,
              textAlign: 'center',
              lineHeight: 1.4,
              marginBottom: 40,
              maxWidth: '80%',
            }}
          >
            {subheadline}
          </div>

          {/* Trust Line (above CTA) */}
          <div
            style={{
              opacity: subheadlineOpacity,
              fontFamily: BLANKLOGO_FONTS.body,
              fontSize: isHorizontal ? 20 : isVertical ? 18 : 16,
              fontWeight: 500,
              color: BLANKLOGO_COLORS.lightGray,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            {trustLine}
          </div>

          {/* CTA Button */}
          <div
            style={{
              opacity: ctaOpacity,
              transform: `scale(${ctaScale})`,
              backgroundColor: BLANKLOGO_COLORS.accent,
              color: BLANKLOGO_COLORS.darker,
              padding: isHorizontal ? '20px 56px' : isVertical ? '18px 48px' : '14px 36px',
              borderRadius: 12,
              fontFamily: BLANKLOGO_FONTS.body,
              fontSize: ctaFontSize,
              fontWeight: 700,
              letterSpacing: '0.02em',
              boxShadow: `0 4px 20px ${BLANKLOGO_COLORS.accent}40`,
            }}
          >
            {cta}
          </div>

          {/* Under-button microcopy */}
          <div
            style={{
              opacity: ctaOpacity * 0.9,
              fontFamily: BLANKLOGO_FONTS.body,
              fontSize: isHorizontal ? 18 : isVertical ? 16 : 14,
              fontWeight: 400,
              color: BLANKLOGO_COLORS.lightGray,
              textAlign: 'center',
              marginTop: 12,
            }}
          >
            {underButtonText}
          </div>

          {/* Footer Text */}
          <div
            style={{
              position: 'absolute',
              bottom: isHorizontal ? 40 : isVertical ? 120 : 60,
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: subheadlineOpacity * 0.7,
              fontFamily: BLANKLOGO_FONTS.body,
              fontSize: isHorizontal ? 16 : isVertical ? 14 : 12,
              fontWeight: 400,
              color: BLANKLOGO_COLORS.mediumGray,
              textAlign: 'center',
              maxWidth: '85%',
              lineHeight: 1.5,
            }}
          >
            {footerText}
          </div>
        </AbsoluteFill>
      )}

      {/* Persistent corner badge during video phases */}
      {!isTextPhase && (
        <div
          style={{
            position: 'absolute',
            top: isVertical ? 60 : 30,
            right: isVertical ? 30 : 20,
            opacity: labelOpacity,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '8px 16px',
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontFamily: BLANKLOGO_FONTS.heading,
              fontSize: isVertical ? 20 : 16,
              fontWeight: 700,
              color: BLANKLOGO_COLORS.white,
            }}
          >
            Blank<span style={{ color: BLANKLOGO_COLORS.accent }}>Logo</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export default BeforeAfterVideo;
