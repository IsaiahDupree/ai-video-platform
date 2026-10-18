import React from 'react';
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';
import { BLANKLOGO_COLORS, BLANKLOGO_FONTS } from './config';

// =============================================================================
// BeforeAfterSplit - Animated before/after comparison
// Shows watermarked frame vs clean frame with animated divider wipe
// =============================================================================

export interface BeforeAfterSplitProps {
  // Images
  beforeImageSrc?: string;
  afterImageSrc?: string;
  
  // Labels
  beforeLabel?: string;
  afterLabel?: string;
  
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  
  // Styling
  theme?: 'dark' | 'gradient';
  showLogo?: boolean;
  
  // Animation
  animationStyle?: 'wipe' | 'slide' | 'fade';
}

export const beforeAfterSplitDefaultProps: BeforeAfterSplitProps = {
  beforeLabel: 'Before',
  afterLabel: 'After',
  headline: 'Remove Watermarks From Videos',
  subheadline: 'Upload → Remove → Download. No ads.',
  ctaText: 'Try it now',
  theme: 'dark',
  showLogo: true,
  animationStyle: 'wipe',
};

// Logo Component
const BlankLogoLogo: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: BLANKLOGO_COLORS.gradientPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        fontWeight: 700,
        color: '#fff',
      }}
    >
      B
    </div>
    <span
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: BLANKLOGO_COLORS.white,
        fontFamily: BLANKLOGO_FONTS.heading,
      }}
    >
      BlankLogo
    </span>
  </div>
);

// CTA Button
const CTAButton: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      background: BLANKLOGO_COLORS.gradientPrimary,
      color: BLANKLOGO_COLORS.white,
      fontFamily: BLANKLOGO_FONTS.heading,
      fontWeight: BLANKLOGO_FONTS.weights.bold,
      fontSize: 18,
      padding: '14px 32px',
      borderRadius: 50,
      display: 'inline-block',
    }}
  >
    {text}
  </div>
);

export const BeforeAfterSplit: React.FC<BeforeAfterSplitProps> = (inputProps) => {
  const props = { ...beforeAfterSplitDefaultProps, ...inputProps };
  const {
    beforeImageSrc,
    afterImageSrc,
    beforeLabel,
    afterLabel,
    headline,
    subheadline,
    ctaText,
    theme,
    showLogo,
    animationStyle,
  } = props;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation: divider wipe from left to center
  const dividerProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const dividerPosition = interpolate(dividerProgress, [0, 1], [0, 50]);

  // Label fade in
  const labelOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Text content fade in
  const textOpacity = interpolate(frame, [45, 60], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const textY = interpolate(frame, [45, 60], [20, 0], {
    extrapolateRight: 'clamp',
  });

  const background =
    theme === 'gradient'
      ? BLANKLOGO_COLORS.gradientCard
      : BLANKLOGO_COLORS.gradientDark;

  // Placeholder image styles (when no image provided)
  const placeholderBeforeStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  const placeholderAfterStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Watermark overlay for "before" placeholder
  const WatermarkOverlay: React.FC = () => (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
        fontSize: 48,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.3)',
        fontFamily: BLANKLOGO_FONTS.heading,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      WATERMARK
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        background,
        fontFamily: BLANKLOGO_FONTS.heading,
      }}
    >
      {/* Grid pattern */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Logo */}
      {showLogo && (
        <div style={{ position: 'absolute', top: 40, left: 40, zIndex: 10 }}>
          <BlankLogoLogo />
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: 40,
          paddingTop: 100,
        }}
      >
        {/* Before/After comparison area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: 20,
            marginBottom: 30,
            borderRadius: 20,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Before side */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              borderRadius: 16,
              overflow: 'hidden',
              border: `2px solid ${BLANKLOGO_COLORS.error}`,
            }}
          >
            {beforeImageSrc ? (
              <Img
                src={beforeImageSrc}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={placeholderBeforeStyle}>
                <div
                  style={{
                    width: 120,
                    height: 80,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                />
                <WatermarkOverlay />
              </div>
            )}
            {/* Before label */}
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                background: BLANKLOGO_COLORS.errorBg,
                border: `1px solid ${BLANKLOGO_COLORS.error}`,
                color: BLANKLOGO_COLORS.error,
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: BLANKLOGO_FONTS.weights.bold,
                opacity: labelOpacity,
              }}
            >
              {beforeLabel}
            </div>
          </div>

          {/* Animated divider */}
          <div
            style={{
              position: 'absolute',
              left: `${dividerPosition}%`,
              top: 0,
              bottom: 0,
              width: 4,
              background: BLANKLOGO_COLORS.gradientPrimary,
              zIndex: 5,
              boxShadow: `0 0 20px ${BLANKLOGO_COLORS.primary}`,
            }}
          />

          {/* After side */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              borderRadius: 16,
              overflow: 'hidden',
              border: `2px solid ${BLANKLOGO_COLORS.success}`,
            }}
          >
            {afterImageSrc ? (
              <Img
                src={afterImageSrc}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={placeholderAfterStyle}>
                <div
                  style={{
                    width: 120,
                    height: 80,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                />
              </div>
            )}
            {/* After label */}
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                background: BLANKLOGO_COLORS.successBg,
                border: `1px solid ${BLANKLOGO_COLORS.success}`,
                color: BLANKLOGO_COLORS.success,
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: BLANKLOGO_FONTS.weights.bold,
                opacity: labelOpacity,
              }}
            >
              {afterLabel}
            </div>
          </div>
        </div>

        {/* Text content */}
        <div
          style={{
            textAlign: 'center',
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: BLANKLOGO_FONTS.weights.extrabold,
              color: BLANKLOGO_COLORS.white,
              margin: 0,
              marginBottom: 12,
              lineHeight: 1.1,
            }}
          >
            {headline}
          </h1>
          {subheadline && (
            <p
              style={{
                fontSize: 22,
                fontWeight: BLANKLOGO_FONTS.weights.medium,
                color: BLANKLOGO_COLORS.lightGray,
                margin: 0,
                marginBottom: 24,
              }}
            >
              {subheadline}
            </p>
          )}
          {ctaText && <CTAButton text={ctaText} />}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default BeforeAfterSplit;
