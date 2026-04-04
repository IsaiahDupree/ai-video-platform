import React from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig } from 'remotion';
import { EVERREACH_COLORS, EVERREACH_FONTS } from './config';

// =============================================================================
// Props
// =============================================================================

export interface EverReachAppStoreMockupProps {
  layout?: 'story' | 'hero';
  headline?: string;
  subheadline?: string;
  screen1?: string;
  screen2?: string;
  screen3?: string;
  offerBadge?: string;
  offerLine1?: string;
  ctaText?: string;
  socialProof?: string;
  accentColor?: string;
  backgroundStyle?: 'dark' | 'warmGradient' | 'purpleDeep';
}

export const everReachAppStoreMockupDefaultProps: EverReachAppStoreMockupProps = {
  layout: 'story',
  headline: 'Never lose touch\nwith the people\nwho matter.',
  subheadline: 'AI relationship intelligence that tells you who to reach out to, what to say, and when.',
  screen1: 'everreach/screenshots/01-contacts-list.png',
  screen2: 'everreach/screenshots/05-warmth-score.png',
  screen3: 'everreach/screenshots/02-contact-detail.png',
  offerBadge: 'FREE TO START',
  offerLine1: 'No credit card  ·  Cancel anytime',
  ctaText: 'Download EverReach',
  socialProof: 'Trusted by 50,000+ people reconnecting daily',
  accentColor: '#FF6B6B',
  backgroundStyle: 'purpleDeep',
};

// =============================================================================
// Phone Mockup
// =============================================================================

const PhoneMockup: React.FC<{
  screenshotSrc: string;
  width: number;
  height: number;
  rotate?: number;
}> = ({ screenshotSrc, width, height, rotate = 0 }) => {
  const borderRadius = Math.round(width * 0.115);
  const notchW = Math.round(width * 0.34);
  const notchH = Math.round(width * 0.075);
  const notchTop = Math.round(width * 0.035);

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        borderRadius,
        border: '2px solid rgba(255,255,255,0.18)',
        background: '#000',
        overflow: 'hidden',
        flexShrink: 0,
        transform: `rotate(${rotate}deg)`,
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: notchTop,
          left: '50%',
          transform: 'translateX(-50%)',
          width: notchW,
          height: notchH,
          borderRadius: notchH,
          background: '#000',
          zIndex: 10,
        }}
      />
      <Img
        src={staticFile(screenshotSrc)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: borderRadius - 2,
        }}
      />
    </div>
  );
};

// =============================================================================
// Feature Pill
// =============================================================================

const FeaturePill: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 16px',
      borderRadius: 100,
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
    }}
  >
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span
      style={{
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        fontFamily: EVERREACH_FONTS.body,
        fontWeight: EVERREACH_FONTS.weights.medium,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  </div>
);

// =============================================================================
// Background
// =============================================================================

function getBackground(style: string): string {
  switch (style) {
    case 'warmGradient':
      return 'linear-gradient(160deg, #1a0a0a 0%, #2d0a0a 40%, #1a1a0a 100%)';
    case 'purpleDeep':
      return 'linear-gradient(160deg, #05050f 0%, #0d0820 35%, #120a2a 60%, #05050f 100%)';
    default:
      return 'linear-gradient(160deg, #050505 0%, #101010 50%, #050505 100%)';
  }
}

// =============================================================================
// Main Composition
// =============================================================================

export const EverReachAppStoreMockup: React.FC<EverReachAppStoreMockupProps> = (inputProps) => {
  const props = { ...everReachAppStoreMockupDefaultProps, ...inputProps };
  const {
    headline,
    subheadline,
    screen1,
    screen2,
    screen3,
    offerBadge,
    offerLine1,
    ctaText,
    socialProof,
    accentColor,
    backgroundStyle,
  } = props;

  const { width, height } = useVideoConfig();
  const isStory = height > width;
  const accent = accentColor || '#FF6B6B';

  const phoneW = isStory ? Math.round(width * 0.38) : Math.round(height * 0.28);
  const phoneH = Math.round(phoneW * 2.16);
  const heroPhoneW = Math.round(height * 0.30);
  const heroPhoneH = Math.round(heroPhoneW * 2.16);

  const features = [
    { icon: '🎯', text: 'Who to reach out to' },
    { icon: '💬', text: 'AI message drafts' },
    { icon: '🔥', text: 'Warmth scoring' },
    { icon: '⏰', text: 'Smart reminders' },
  ];

  // ─── STORY LAYOUT ──────────────────────────────────────────────────────────
  if (isStory) {
    return (
      <AbsoluteFill
        style={{
          background: getBackground(backgroundStyle || 'purpleDeep'),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: width * 1.2,
            height: height * 0.55,
            background: `radial-gradient(ellipse at center, ${accent}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Logo + Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: Math.round(height * 0.055),
            paddingBottom: Math.round(height * 0.02),
            width: '100%',
            zIndex: 2,
          }}
        >
          <Img
            src={staticFile('everreach/branding/logo-no-bg.png')}
            style={{
              height: Math.round(height * 0.038),
              objectFit: 'contain',
              marginBottom: Math.round(height * 0.022),
            }}
          />
          <h1
            style={{
              fontSize: Math.round(width * 0.098),
              fontWeight: EVERREACH_FONTS.weights.black,
              fontFamily: EVERREACH_FONTS.heading,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.1,
              margin: 0,
              padding: `0 ${Math.round(width * 0.06)}px`,
              letterSpacing: -1.5,
              whiteSpace: 'pre-line',
            }}
          >
            {headline}
          </h1>
          <p
            style={{
              fontSize: Math.round(width * 0.036),
              fontWeight: EVERREACH_FONTS.weights.medium,
              fontFamily: EVERREACH_FONTS.body,
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              lineHeight: 1.45,
              margin: `${Math.round(height * 0.016)}px 0 0`,
              padding: `0 ${Math.round(width * 0.09)}px`,
            }}
          >
            {subheadline}
          </p>
        </div>

        {/* Phone cascade */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: Math.round(height * 0.40),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3,
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'absolute', left: Math.round(width * 0.03), top: '50%', transform: 'translateY(-44%)', zIndex: 1 }}>
            {screen1 && <PhoneMockup screenshotSrc={screen1} width={phoneW} height={phoneH} rotate={-8} />}
          </div>
          <div style={{ position: 'absolute', top: '-6%', zIndex: 3 }}>
            {screen2 && (
              <PhoneMockup
                screenshotSrc={screen2}
                width={Math.round(phoneW * 1.12)}
                height={Math.round(phoneH * 1.12)}
                rotate={0}
              />
            )}
          </div>
          <div style={{ position: 'absolute', right: Math.round(width * 0.03), top: '50%', transform: 'translateY(-44%)', zIndex: 1 }}>
            {screen3 && <PhoneMockup screenshotSrc={screen3} width={phoneW} height={phoneH} rotate={8} />}
          </div>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            padding: `${Math.round(height * 0.016)}px ${Math.round(width * 0.06)}px`,
            zIndex: 2,
          }}
        >
          {features.map((f) => (
            <FeaturePill key={f.text} icon={f.icon} text={f.text} />
          ))}
        </div>

        {/* Offer + CTA */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: Math.round(height * 0.013),
            padding: `${Math.round(height * 0.018)}px ${Math.round(width * 0.06)}px`,
            width: '100%',
            zIndex: 2,
            marginTop: 'auto',
            paddingBottom: Math.round(height * 0.055),
          }}
        >
          {offerBadge && (
            <div
              style={{
                padding: '6px 20px',
                borderRadius: 100,
                background: `${accent}22`,
                border: `1px solid ${accent}55`,
                color: accent,
                fontSize: Math.round(width * 0.028),
                fontWeight: EVERREACH_FONTS.weights.bold,
                fontFamily: EVERREACH_FONTS.heading,
                letterSpacing: 1.5,
              }}
            >
              {offerBadge}
            </div>
          )}
          <div
            style={{
              width: '88%',
              padding: `${Math.round(height * 0.022)}px 0`,
              borderRadius: 18,
              background: '#ffffff',
              color: '#000000',
              fontSize: Math.round(width * 0.048),
              fontWeight: EVERREACH_FONTS.weights.bold,
              fontFamily: EVERREACH_FONTS.heading,
              textAlign: 'center',
              letterSpacing: -0.5,
            }}
          >
            {ctaText}
          </div>
          {offerLine1 && (
            <p
              style={{
                fontSize: Math.round(width * 0.030),
                color: 'rgba(255,255,255,0.40)',
                fontFamily: EVERREACH_FONTS.body,
                fontWeight: EVERREACH_FONTS.weights.medium,
                margin: 0,
                textAlign: 'center',
              }}
            >
              {offerLine1}
            </p>
          )}
          {socialProof && (
            <p
              style={{
                fontSize: Math.round(width * 0.028),
                color: 'rgba(255,255,255,0.28)',
                fontFamily: EVERREACH_FONTS.body,
                margin: 0,
                textAlign: 'center',
              }}
            >
              {socialProof}
            </p>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // ─── HERO LAYOUT (1920x1080) ───────────────────────────────────────────────
  return (
    <AbsoluteFill
      style={{
        background: getBackground(backgroundStyle || 'purpleDeep'),
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '28%',
          transform: 'translate(50%, -50%)',
          width: height * 1.1,
          height: height * 1.1,
          background: `radial-gradient(ellipse at center, ${accent}14 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Left: Text */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `0 ${Math.round(width * 0.06)}px`,
          zIndex: 2,
        }}
      >
        <Img
          src={staticFile('everreach/branding/logo-no-bg.png')}
          style={{ height: 36, objectFit: 'contain', alignSelf: 'flex-start', marginBottom: 28 }}
        />
        <h1
          style={{
            fontSize: Math.round(height * 0.082),
            fontWeight: EVERREACH_FONTS.weights.black,
            fontFamily: EVERREACH_FONTS.heading,
            color: '#ffffff',
            lineHeight: 1.08,
            margin: '0 0 18px',
            letterSpacing: -2,
            whiteSpace: 'pre-line',
          }}
        >
          {headline}
        </h1>
        <p
          style={{
            fontSize: Math.round(height * 0.028),
            fontWeight: EVERREACH_FONTS.weights.medium,
            fontFamily: EVERREACH_FONTS.body,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.5,
            margin: '0 0 28px',
            maxWidth: 500,
          }}
        >
          {subheadline}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {features.map((f) => (
            <FeaturePill key={f.text} icon={f.icon} text={f.text} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              padding: `${Math.round(height * 0.022)}px ${Math.round(height * 0.046)}px`,
              borderRadius: 14,
              background: '#ffffff',
              color: '#000000',
              fontSize: Math.round(height * 0.030),
              fontWeight: EVERREACH_FONTS.weights.bold,
              fontFamily: EVERREACH_FONTS.heading,
              letterSpacing: -0.3,
            }}
          >
            {ctaText}
          </div>
          {offerLine1 && (
            <span style={{ fontSize: Math.round(height * 0.020), color: 'rgba(255,255,255,0.38)', fontFamily: EVERREACH_FONTS.body }}>
              {offerLine1}
            </span>
          )}
        </div>
        {socialProof && (
          <p style={{ fontSize: Math.round(height * 0.018), color: 'rgba(255,255,255,0.25)', fontFamily: EVERREACH_FONTS.body, margin: '12px 0 0' }}>
            {socialProof}
          </p>
        )}
      </div>

      {/* Right: Phone cascade */}
      <div
        style={{
          width: Math.round(width * 0.46),
          height: '100%',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-44%)', zIndex: 1 }}>
          {screen1 && <PhoneMockup screenshotSrc={screen1} width={heroPhoneW} height={heroPhoneH} rotate={-7} />}
        </div>
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
          {screen2 && (
            <PhoneMockup
              screenshotSrc={screen2}
              width={Math.round(heroPhoneW * 1.15)}
              height={Math.round(heroPhoneH * 1.15)}
              rotate={0}
            />
          )}
        </div>
        <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-44%)', zIndex: 1 }}>
          {screen3 && <PhoneMockup screenshotSrc={screen3} width={heroPhoneW} height={heroPhoneH} rotate={7} />}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default EverReachAppStoreMockup;
