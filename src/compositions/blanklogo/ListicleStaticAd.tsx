import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { BLANKLOGO_COLORS, BLANKLOGO_FONTS } from './config';

export interface ListicleBullet {
  text: string;
}

export interface ListicleStaticAdProps {
  topLabel?: string;
  headline?: string;
  subheadline?: string;
  compatibilityChips?: string[];
  bullets?: string[];
  beforeImageSrc?: string;
  afterImageSrc?: string;
  ctaText?: string;
  ctaSubtext?: string;
  trustLine?: string;
  theme?: 'dark' | 'gradient';
  showLogo?: boolean;
  logoSrc?: string;
  showBeforeAfter?: boolean;
}

export const listicleStaticAdDefaultProps: ListicleStaticAdProps = {
  topLabel: 'READY TO POST',
  headline: 'Downloaded a video with a watermark?',
  subheadline: 'Clean export in seconds.',
  compatibilityChips: ['Sora', 'TikTok', 'Runway'],
  bullets: [
    'Clean export',
    'No framing loss',
    'Fast workflow',
    'Crop or AI inpaint',
    'Built for reposting',
  ],
  ctaText: 'Claim Starter Credits',
  ctaSubtext: 'Complimentary credits included',
  trustLine: 'Private processing • Auto-delete 90 days',
  theme: 'dark',
  showLogo: true,
  showBeforeAfter: true,
};

export const ListicleStaticAd: React.FC<ListicleStaticAdProps> = (inputProps) => {
  const props = { ...listicleStaticAdDefaultProps, ...inputProps };
  const {
    topLabel,
    headline,
    subheadline,
    compatibilityChips,
    bullets,
    beforeImageSrc,
    afterImageSrc,
    ctaText,
    ctaSubtext,
    trustLine,
    theme,
    showLogo,
    logoSrc,
    showBeforeAfter,
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
        padding: '24px 40px 32px 40px',
        fontFamily: BLANKLOGO_FONTS.heading,
      }}
    >
      {/* Logo (tight top-left) */}
      {showLogo && (
        <div style={{ position: 'absolute', top: 20, left: 36 }}>
          {logoSrc ? (
            <Img src={logoSrc} style={{ height: 28, objectFit: 'contain' }} />
          ) : (
            <div
              style={{
                fontSize: 18,
                fontWeight: BLANKLOGO_FONTS.weights.bold,
                color: BLANKLOGO_COLORS.white,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  background: BLANKLOGO_COLORS.gradientPrimary,
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                ✦
              </span>
              BlankLogo
            </div>
          )}
        </div>
      )}

      {/* ===== TOP: Label + Headline + Subhead ===== */}
      <div
        style={{
          marginTop: 44,
          textAlign: 'center',
        }}
      >
        {/* Small top label */}
        {topLabel && (
          <div
            style={{
              fontSize: 14,
              fontWeight: BLANKLOGO_FONTS.weights.bold,
              color: BLANKLOGO_COLORS.accent,
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            {topLabel}
          </div>
        )}
        <h1
          style={{
            fontSize: 48,
            fontWeight: BLANKLOGO_FONTS.weights.extrabold,
            color: BLANKLOGO_COLORS.white,
            lineHeight: 1.1,
            margin: 0,
            whiteSpace: 'pre-line',
          }}
        >
          {headline}
        </h1>
        {subheadline && (
          <p
            style={{
              fontSize: 20,
              fontWeight: BLANKLOGO_FONTS.weights.medium,
              color: BLANKLOGO_COLORS.lightGray,
              margin: '10px 0 0 0',
            }}
          >
            {subheadline}
          </p>
        )}

        {/* Compatibility chips */}
        {compatibilityChips && compatibilityChips.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 14,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: BLANKLOGO_COLORS.mediumGray,
                fontWeight: BLANKLOGO_FONTS.weights.medium,
              }}
            >
              Works with:
            </span>
            {compatibilityChips.map((chip, index) => (
              <span
                key={index}
                style={{
                  fontSize: 12,
                  fontWeight: BLANKLOGO_FONTS.weights.semibold,
                  color: BLANKLOGO_COLORS.white,
                  background: 'rgba(255,255,255,0.1)',
                  padding: '4px 10px',
                  borderRadius: 12,
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ===== HERO: Before/After (bigger, tighter) ===== */}
      {showBeforeAfter && (beforeImageSrc || afterImageSrc) && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginTop: 20,
          }}
        >
          {/* Before */}
          <div
            style={{
              width: 420,
              height: '100%',
              maxHeight: 420,
              borderRadius: 16,
              border: `3px solid ${BLANKLOGO_COLORS.error}`,
              overflow: 'hidden',
              background: 'rgba(239, 68, 68, 0.08)',
              position: 'relative',
            }}
          >
            {beforeImageSrc ? (
              <Img src={beforeImageSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />
            )}
            {/* Corner tag */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: BLANKLOGO_COLORS.error,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: BLANKLOGO_FONTS.weights.bold,
                color: BLANKLOGO_COLORS.white,
                letterSpacing: 1,
              }}
            >
              BEFORE
            </div>
          </div>

          {/* Thin arrow */}
          <div style={{ fontSize: 28, color: BLANKLOGO_COLORS.accent, fontWeight: 300 }}>→</div>

          {/* After */}
          <div
            style={{
              width: 420,
              height: '100%',
              maxHeight: 420,
              borderRadius: 16,
              border: `3px solid ${BLANKLOGO_COLORS.success}`,
              overflow: 'hidden',
              background: 'rgba(16, 185, 129, 0.08)',
              position: 'relative',
            }}
          >
            {afterImageSrc ? (
              <Img src={afterImageSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />
            )}
            {/* Corner tag */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: BLANKLOGO_COLORS.success,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: BLANKLOGO_FONTS.weights.bold,
                color: BLANKLOGO_COLORS.white,
                letterSpacing: 1,
              }}
            >
              AFTER
            </div>
          </div>
        </div>
      )}

      {/* ===== Single-line Bullets (compact) ===== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.08)',
          marginTop: 20,
        }}
      >
        {bullets?.map((bullet, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Number badge (smaller) */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: BLANKLOGO_COLORS.gradientPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: BLANKLOGO_FONTS.weights.bold,
                color: BLANKLOGO_COLORS.white,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>

            {/* Single-line text */}
            <span
              style={{
                fontSize: 18,
                fontWeight: BLANKLOGO_FONTS.weights.semibold,
                color: BLANKLOGO_COLORS.white,
              }}
            >
              {bullet}
            </span>
          </div>
        ))}
      </div>

      {/* ===== CTA (moved up, tighter) ===== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          marginTop: 16,
        }}
      >
        <div
          style={{
            background: BLANKLOGO_COLORS.gradientPrimary,
            padding: '16px 40px',
            borderRadius: 50,
            fontSize: 19,
            fontWeight: BLANKLOGO_FONTS.weights.bold,
            color: BLANKLOGO_COLORS.white,
            boxShadow: '0 4px 20px rgba(99, 91, 255, 0.35)',
          }}
        >
          {ctaText}
        </div>
        {ctaSubtext && (
          <div
            style={{
              fontSize: 13,
              color: BLANKLOGO_COLORS.lightGray,
            }}
          >
            {ctaSubtext}
          </div>
        )}

        {/* Trust microline */}
        {trustLine && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
              fontSize: 11,
              color: BLANKLOGO_COLORS.mediumGray,
            }}
          >
            <span style={{ fontSize: 12 }}>🔒</span>
            {trustLine}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default ListicleStaticAd;
