import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ── Offer → CTA text mapping ──────────────────────────────────────────────────
export const OFFER_CTA_MAP: Record<string, string> = {
  audit:         'Book a free 30-min audit → isaiahdupree.com/audit',
  social_growth: "DM me 'system' on Instagram",
  preset_store:  'Follow + join waitlist → isaiahdupree.com/presets',
};

export type OfferType = keyof typeof OFFER_CTA_MAP;

// ── Props ─────────────────────────────────────────────────────────────────────
export interface UTMLowerThirdProps {
  /** Which offer drives the CTA. Falls back to cta_text if set. */
  offer_mapped?: OfferType | string;
  /** Optional explicit override for the CTA text */
  cta_text?: string;
  /** UTM tag for attribution (not displayed — embedded in video metadata) */
  utm_tag?: string;
  /** When to show (default: last 3s of video) */
  startFrame?: number;
  /** Duration in frames (default: fps * 3) */
  durationFrames?: number;
  /** Background accent color (default: brand green) */
  accentColor?: string;
}

// ── Design tokens ──────────────────────────────────────────────────────────
const BG_CARD   = 'rgba(13, 17, 23, 0.92)';
const BG_ACCENT = '#00ff88';
const TEXT_PRIMARY   = '#ffffff';
const TEXT_SECONDARY = '#b3b3b3';

// ── Component ─────────────────────────────────────────────────────────────────
export const UTMLowerThird: React.FC<UTMLowerThirdProps> = ({
  offer_mapped,
  cta_text,
  utm_tag,
  startFrame,
  durationFrames,
  accentColor = BG_ACCENT,
}) => {
  const frame        = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const defaultDuration = fps * 3;
  const start    = startFrame    ?? (durationInFrames - defaultDuration);
  const duration = durationFrames ?? defaultDuration;

  // Resolve CTA text: explicit override → offer_mapped → fallback
  const ctaText =
    cta_text ||
    (offer_mapped && OFFER_CTA_MAP[offer_mapped]) ||
    OFFER_CTA_MAP['audit'];

  // Local frame (0 = when lower third appears)
  const localFrame = frame - start;
  if (localFrame < 0 || localFrame > duration) return null;

  // Slide up entrance
  const slideProgress = spring({
    frame:       localFrame,
    fps,
    config:      { damping: 18, mass: 0.8, stiffness: 120 },
    durationInFrames: fps * 0.5,
  });

  const translateY = interpolate(slideProgress, [0, 1], [80, 0]);
  const opacity    = interpolate(
    localFrame,
    [0, fps * 0.3, duration - fps * 0.5, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems:     'flex-start',
        padding:        '0 0 40px 40px',
        pointerEvents:  'none',
      }}
    >
      <div
        style={{
          opacity,
          transform:    `translateY(${translateY}px)`,
          background:   BG_CARD,
          borderLeft:   `4px solid ${accentColor}`,
          borderRadius: '0 8px 8px 0',
          padding:      '14px 24px',
          maxWidth:     '80%',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Label */}
        <div
          style={{
            fontFamily:    'monospace',
            fontSize:      13,
            color:         accentColor,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom:  4,
            fontWeight:    600,
          }}
        >
          {offer_mapped === 'audit'
            ? '→ FREE AUDIT'
            : offer_mapped === 'social_growth'
            ? '→ DM ME'
            : offer_mapped === 'preset_store'
            ? '→ JOIN WAITLIST'
            : '→ NEXT STEP'}
        </div>

        {/* CTA text */}
        <div
          style={{
            fontFamily: 'sans-serif',
            fontSize:   22,
            fontWeight: 700,
            color:      TEXT_PRIMARY,
            lineHeight: 1.2,
          }}
        >
          {ctaText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Standalone lower-third for use in Root.tsx compositions ─────────────────
export default UTMLowerThird;
