import React from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig } from 'remotion';
import {
  EVERREACH_COLORS,
  EVERREACH_FONTS,
  AwarenessLevel,
  BeliefCluster,
} from './config';

// =============================================================================
// Types
// =============================================================================

export interface EverReachScreenshotAdProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;

  // Awareness & Belief (for tracking)
  awareness?: AwarenessLevel;
  belief?: BeliefCluster;

  // Screenshot
  screenshotSrc?: string;      // Path relative to public/ e.g. 'everreach/screenshots/05-warmth-score.png'
  screenshotAlt?: string;
  showPhone?: boolean;         // Wrap screenshot in phone frame

  // Visual
  theme?: 'dark' | 'light' | 'warmGradient' | 'coolGradient';
  accentColor?: string;

  // Logo
  logoSrc?: string;
  showLogo?: boolean;

  // Layout
  layout?: 'left' | 'right' | 'center' | 'bottom';
  ctaStyle?: 'pill' | 'rectangle' | 'none';
  badge?: string;              // e.g. 'FREE TRIAL', 'NEW', 'TOP RATED'

  // Typography
  headlineSize?: number;
  subheadlineSize?: number;
}

// =============================================================================
// Default Props
// =============================================================================

export const everReachScreenshotAdDefaultProps: EverReachScreenshotAdProps = {
  headline: 'See who\'s going cold',
  subheadline: 'Warmth score shows you who needs attention today.',
  ctaText: 'Try it free',
  awareness: 'product_aware',
  belief: 'too_busy',
  screenshotSrc: 'everreach/screenshots/01-contacts-list.png',
  showPhone: true,
  theme: 'dark',
  logoSrc: 'everreach/branding/logo-no-bg.png',
  showLogo: true,
  layout: 'right',
  ctaStyle: 'pill',
};

// =============================================================================
// Phone Mockup Component
// =============================================================================

const PhoneMockup: React.FC<{
  screenshotSrc: string;
  width: number;
  height: number;
  borderColor?: string;
}> = ({ screenshotSrc, width, height, borderColor = 'rgba(255,255,255,0.15)' }) => {
  const phoneWidth = width;
  const phoneHeight = height;
  const screenPadding = Math.round(phoneWidth * 0.04);
  const borderRadius = Math.round(phoneWidth * 0.12);
  const notchWidth = Math.round(phoneWidth * 0.35);
  const notchHeight = Math.round(phoneWidth * 0.08);

  return (
    <div
      style={{
        width: phoneWidth,
        height: phoneHeight,
        position: 'relative',
        borderRadius,
        border: `3px solid ${borderColor}`,
        background: '#000',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        flexShrink: 0,
      }}
    >
      {/* Dynamic Island */}
      <div
        style={{
          position: 'absolute',
          top: screenPadding,
          left: '50%',
          transform: 'translateX(-50%)',
          width: notchWidth,
          height: notchHeight,
          borderRadius: notchHeight,
          background: '#000',
          zIndex: 10,
        }}
      />
      {/* Screenshot */}
      <Img
        src={staticFile(screenshotSrc)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: borderRadius - 3,
        }}
      />
    </div>
  );
};

// =============================================================================
// Bare Screenshot (no phone frame)
// =============================================================================

const BareScreenshot: React.FC<{
  screenshotSrc: string;
  width: number;
  height: number;
}> = ({ screenshotSrc, width, height }) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}
    >
      <Img
        src={staticFile(screenshotSrc)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

// =============================================================================
// Background Helpers
// =============================================================================

function getBackground(theme: string): string {
  switch (theme) {
    case 'dark':
      return EVERREACH_COLORS.gradientDark;
    case 'light':
      return `linear-gradient(180deg, ${EVERREACH_COLORS.lightBg} 0%, ${EVERREACH_COLORS.white} 100%)`;
    case 'warmGradient':
      return EVERREACH_COLORS.gradientWarm;
    case 'coolGradient':
      return EVERREACH_COLORS.gradientCool;
    default:
      return EVERREACH_COLORS.gradientDark;
  }
}

function getTextColor(theme: string): string {
  return theme === 'light' ? EVERREACH_COLORS.dark : EVERREACH_COLORS.white;
}

function getSubtextColor(theme: string): string {
  return theme === 'light' ? EVERREACH_COLORS.gray : EVERREACH_COLORS.lightGray;
}

// =============================================================================
// Main Component
// =============================================================================

export const EverReachScreenshotAd: React.FC<EverReachScreenshotAdProps> = (inputProps) => {
  const props = { ...everReachScreenshotAdDefaultProps, ...inputProps };
  const {
    headline,
    subheadline,
    ctaText,
    screenshotSrc,
    showPhone,
    theme,
    accentColor,
    logoSrc,
    showLogo,
    layout,
    ctaStyle,
    badge,
    headlineSize,
    subheadlineSize,
  } = props;

  const { width, height } = useVideoConfig();
  const isVertical = height > width;           // 9:16 story, 4:5 portrait
  const isSquare = Math.abs(width - height) < 100; // 1:1 post
  const isLandscape = width > height;          // 1.91:1 facebook

  const textColor = getTextColor(theme || 'dark');
  const subtextColor = getSubtextColor(theme || 'dark');
  const accent = accentColor || EVERREACH_COLORS.hot;

  // Canvas-aware layout:
  //   Vertical (9:16, 4:5): phone top half, text bottom half — stacked
  //   Square / Landscape: phone left, text right — side by side
  const useStackedLayout = isVertical;

  // Phone sizing
  const phoneW = useStackedLayout
    ? Math.round(width * 0.62)        // stacked: phone fills most of width
    : Math.round(width * 0.40);       // side-by-side: phone in left ~40%
  const phoneH = Math.round(phoneW * 2.16);

  // Cap phone height: stacked → 58% of canvas height, landscape → 85% of canvas height
  const maxPhoneH = useStackedLayout
    ? Math.round(height * 0.58)
    : Math.round(height * 0.85);
  const finalPhoneH = Math.min(phoneH, maxPhoneH);
  const finalPhoneW = Math.round(finalPhoneH / 2.16);

  // Auto headline sizing
  const hSize = headlineSize || (isVertical ? 46 : isSquare ? 40 : 34);
  const sSize = subheadlineSize || (isVertical ? 22 : isSquare ? 18 : 15);

  // Shared text block
  const TextBlock = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: useStackedLayout ? 'center' : 'flex-start',
        textAlign: useStackedLayout ? 'center' : 'left',
        zIndex: 2,
        flex: useStackedLayout ? undefined : 1,
        maxWidth: useStackedLayout ? '88%' : undefined,
        padding: useStackedLayout ? '0 32px' : '0',
      }}
    >
      {badge && (
        <div
          style={{
            display: 'inline-flex',
            padding: '6px 16px',
            borderRadius: 20,
            background: accent,
            color: EVERREACH_COLORS.dark,
            fontSize: isVertical ? 13 : 11,
            fontWeight: EVERREACH_FONTS.weights.bold,
            fontFamily: EVERREACH_FONTS.heading,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          {badge}
        </div>
      )}
      <h1
        style={{
          fontSize: hSize,
          fontWeight: EVERREACH_FONTS.weights.extrabold,
          color: textColor,
          fontFamily: EVERREACH_FONTS.heading,
          margin: 0,
          marginBottom: subheadline ? 12 : 24,
          lineHeight: 1.15,
        }}
      >
        {headline}
      </h1>
      {subheadline && (
        <p
          style={{
            fontSize: sSize,
            fontWeight: EVERREACH_FONTS.weights.medium,
            color: subtextColor,
            fontFamily: EVERREACH_FONTS.body,
            margin: 0,
            marginBottom: 24,
            lineHeight: 1.4,
          }}
        >
          {subheadline}
        </p>
      )}
      {ctaText && ctaStyle !== 'none' && (
        <div
          style={{
            display: 'inline-flex',
            padding: ctaStyle === 'pill' ? '14px 36px' : '14px 28px',
            borderRadius: ctaStyle === 'pill' ? 50 : 10,
            background: accent,
            color: EVERREACH_COLORS.dark,
            fontSize: isVertical ? 18 : 15,
            fontWeight: EVERREACH_FONTS.weights.bold,
            fontFamily: EVERREACH_FONTS.heading,
          }}
        >
          {ctaText}
        </div>
      )}
    </div>
  );

  // Phone block
  const PhoneBlock = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
      {showPhone ? (
        <PhoneMockup
          screenshotSrc={screenshotSrc || ''}
          width={finalPhoneW}
          height={finalPhoneH}
          borderColor={theme === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'}
        />
      ) : (
        <BareScreenshot
          screenshotSrc={screenshotSrc || ''}
          width={Math.round(phoneW * 1.3)}
          height={Math.round(phoneW * 1.3 * 0.6)}
        />
      )}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        background: getBackground(theme || 'dark'),
        display: 'flex',
        flexDirection: useStackedLayout ? 'column' : 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: useStackedLayout ? '0 0 40px 0' : isLandscape ? '40px 50px' : '40px',
        gap: useStackedLayout ? 32 : 40,
      }}
    >
      {/* Logo — always top-left absolute */}
      {showLogo && logoSrc && (
        <div
          style={{
            position: 'absolute',
            top: useStackedLayout ? 36 : 28,
            left: useStackedLayout ? 36 : 40,
            zIndex: 10,
          }}
        >
          <Img
            src={staticFile(logoSrc)}
            style={{ height: useStackedLayout ? 40 : 32, objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Stacked: phone on top, text below */}
      {useStackedLayout && (
        <>
          {/* Spacer for logo */}
          <div style={{ height: 60, flexShrink: 0 }} />
          {screenshotSrc && <PhoneBlock />}
          <TextBlock />
        </>
      )}

      {/* Side-by-side: phone left, text right */}
      {!useStackedLayout && (
        <>
          {screenshotSrc && <PhoneBlock />}
          <TextBlock />
        </>
      )}
    </AbsoluteFill>
  );
};

export default EverReachScreenshotAd;
