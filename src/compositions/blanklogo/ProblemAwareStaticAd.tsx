import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { BLANKLOGO_COLORS, BLANKLOGO_FONTS } from './config';

// =============================================================================
// Types
// =============================================================================

export interface ProblemAwareStaticAdProps {
  // Main headline
  headline?: string;
  
  // Before/After section
  beforeLabel?: string;
  beforeSubtext?: string;
  afterLabel?: string;
  afterSubtext?: string;
  beforeImageSrc?: string;
  afterImageSrc?: string;
  
  // Comparison bullets
  mostToolsLine?: string;
  blankLogoLine?: string;
  
  // CTA
  ctaText?: string;
  ctaSubtext?: string;
  
  // Visual
  theme?: 'dark' | 'gradient';
  showLogo?: boolean;
  logoSrc?: string;
}

// =============================================================================
// Default Props
// =============================================================================

export const problemAwareStaticAdDefaultProps: ProblemAwareStaticAdProps = {
  headline: 'Downloaded a video…\nand got stuck with the watermark?',
  beforeLabel: 'BEFORE',
  beforeSubtext: 'Watermark present',
  afterLabel: 'AFTER',
  afterSubtext: 'Clean export',
  mostToolsLine: 'blur it • re-encode it • spammy workflow',
  blankLogoLine: 'clean export • quality kept • crop or AI inpaint',
  ctaText: 'Get Free Credits (One-Time)',
  ctaSubtext: 'Start in seconds',
  theme: 'dark',
  showLogo: true,
};

// =============================================================================
// Main Component - 4:5 (1080×1350) Static Ad
// =============================================================================

export const ProblemAwareStaticAd: React.FC<ProblemAwareStaticAdProps> = (inputProps) => {
  const props = { ...problemAwareStaticAdDefaultProps, ...inputProps };
  const {
    headline,
    beforeLabel,
    beforeSubtext,
    afterLabel,
    afterSubtext,
    beforeImageSrc,
    afterImageSrc,
    mostToolsLine,
    blankLogoLine,
    ctaText,
    ctaSubtext,
    theme,
    showLogo,
    logoSrc,
  } = props;

  const bgStyle: React.CSSProperties = theme === 'gradient'
    ? { background: BLANKLOGO_COLORS.gradientCard }
    : { background: BLANKLOGO_COLORS.darker };

  return (
    <AbsoluteFill
      style={{
        ...bgStyle,
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 50px',
        fontFamily: BLANKLOGO_FONTS.heading,
      }}
    >
      {/* Logo (top-left) */}
      {showLogo && (
        <div style={{ position: 'absolute', top: 40, left: 50 }}>
          {logoSrc ? (
            <Img src={logoSrc} style={{ height: 36, objectFit: 'contain' }} />
          ) : (
            <div
              style={{
                fontSize: 24,
                fontWeight: BLANKLOGO_FONTS.weights.bold,
                color: BLANKLOGO_COLORS.white,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  background: BLANKLOGO_COLORS.gradientPrimary,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                ✦
              </span>
              BlankLogo
            </div>
          )}
        </div>
      )}

      {/* ===== TOP: Headline ===== */}
      <div
        style={{
          marginTop: showLogo ? 60 : 0,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 54,
            fontWeight: BLANKLOGO_FONTS.weights.extrabold,
            color: BLANKLOGO_COLORS.white,
            lineHeight: 1.15,
            margin: 0,
            whiteSpace: 'pre-line',
          }}
        >
          {headline}
        </h1>
      </div>

      {/* ===== MIDDLE: Before/After Proof ===== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          marginTop: 40,
          marginBottom: 40,
        }}
      >
        {/* Before Card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              background: 'rgba(239, 68, 68, 0.1)',
              border: `3px solid ${BLANKLOGO_COLORS.error}`,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {beforeImageSrc ? (
              <Img
                src={beforeImageSrc}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* Simulated watermark */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    background: 'rgba(255,255,255,0.3)',
                    padding: '8px 16px',
                    borderRadius: 4,
                    fontSize: 16,
                    fontWeight: BLANKLOGO_FONTS.weights.bold,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  WATERMARK
                </div>
                {/* Play icon placeholder */}
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '20px solid rgba(255,255,255,0.6)',
                      borderTop: '12px solid transparent',
                      borderBottom: '12px solid transparent',
                      marginLeft: 6,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          {/* Label */}
          <div
            style={{
              marginTop: 16,
              fontSize: 20,
              fontWeight: BLANKLOGO_FONTS.weights.bold,
              color: BLANKLOGO_COLORS.error,
              letterSpacing: 2,
            }}
          >
            {beforeLabel}
          </div>
          <div
            style={{
              fontSize: 16,
              color: BLANKLOGO_COLORS.lightGray,
              fontStyle: 'italic',
              marginTop: 4,
            }}
          >
            {beforeSubtext}
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            fontSize: 48,
            color: BLANKLOGO_COLORS.accent,
            fontWeight: BLANKLOGO_FONTS.weights.bold,
          }}
        >
          →
        </div>

        {/* After Card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              background: 'rgba(16, 185, 129, 0.1)',
              border: `3px solid ${BLANKLOGO_COLORS.success}`,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {afterImageSrc ? (
              <Img
                src={afterImageSrc}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* Clean badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: BLANKLOGO_COLORS.success,
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: BLANKLOGO_FONTS.weights.bold,
                    color: BLANKLOGO_COLORS.white,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  ✓ CLEAN
                </div>
                {/* Play icon placeholder */}
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'rgba(16,185,129,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '20px solid rgba(255,255,255,0.8)',
                      borderTop: '12px solid transparent',
                      borderBottom: '12px solid transparent',
                      marginLeft: 6,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          {/* Label */}
          <div
            style={{
              marginTop: 16,
              fontSize: 20,
              fontWeight: BLANKLOGO_FONTS.weights.bold,
              color: BLANKLOGO_COLORS.success,
              letterSpacing: 2,
            }}
          >
            {afterLabel}
          </div>
          <div
            style={{
              fontSize: 16,
              color: BLANKLOGO_COLORS.lightGray,
              fontStyle: 'italic',
              marginTop: 4,
            }}
          >
            {afterSubtext}
          </div>
        </div>
      </div>

      {/* ===== BOTTOM: Comparison + CTA ===== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        {/* Comparison Bullets */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Most tools line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: BLANKLOGO_FONTS.weights.bold,
                color: BLANKLOGO_COLORS.lightGray,
                minWidth: 120,
              }}
            >
              Most tools:
            </span>
            <span
              style={{
                fontSize: 18,
                color: BLANKLOGO_COLORS.mediumGray,
                textDecoration: 'line-through',
                textDecorationColor: BLANKLOGO_COLORS.error,
              }}
            >
              {mostToolsLine}
            </span>
          </div>
          {/* BlankLogo line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: BLANKLOGO_FONTS.weights.bold,
                color: BLANKLOGO_COLORS.accent,
                minWidth: 120,
              }}
            >
              BlankLogo:
            </span>
            <span
              style={{
                fontSize: 18,
                color: BLANKLOGO_COLORS.white,
                fontWeight: BLANKLOGO_FONTS.weights.medium,
              }}
            >
              {blankLogoLine}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              background: BLANKLOGO_COLORS.gradientPrimary,
              padding: '20px 48px',
              borderRadius: 50,
              fontSize: 22,
              fontWeight: BLANKLOGO_FONTS.weights.bold,
              color: BLANKLOGO_COLORS.white,
              boxShadow: '0 4px 24px rgba(99, 91, 255, 0.4)',
            }}
          >
            {ctaText}
          </div>
          {ctaSubtext && (
            <div
              style={{
                fontSize: 15,
                color: BLANKLOGO_COLORS.lightGray,
                marginTop: 4,
              }}
            >
              {ctaSubtext}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ProblemAwareStaticAd;
