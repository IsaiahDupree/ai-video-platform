import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, slideIn, countUp, formatCountValue, pulseGlow } from '../animations';

// Research-backed: Social proof drives 74% of purchasing decisions
// Numbers + logos + faces trigger credibility heuristics instantly
export interface SocialProofContent {
  type: 'social_proof';
  headline?: string;
  metric?: { value: string; label: string };
  logos?: Array<{ name: string; color?: string }>;
  testimonials?: Array<{ quote: string; author: string }>;
  style?: 'logos' | 'number' | 'faces' | 'combined';
}

export interface SocialProofSceneProps {
  content: SocialProofContent;
  style: StyleConfig;
}

export const SocialProofScene: React.FC<SocialProofSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const displayStyle = content.style ?? 'combined';

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const glow = pulseGlow(frame, { color: style.accent_color, cycleDuration: 45, minBlur: 8, maxBlur: 30 });
  const headlineOpacity = fadeIn(frame, { durationInFrames: 16, delay: 0 });

  // Metric: animate the number if it looks numeric
  const numericValue = content.metric ? parseFloat(content.metric.value.replace(/[^0-9.]/g, '')) : 0;
  const metricSuffix = content.metric ? content.metric.value.replace(/[0-9.]/g, '') : '';
  const metricAnim = countUp(frame, {
    from: 0,
    to: numericValue,
    durationInFrames: 40,
    delay: 10,
    easing: Easing.out(Easing.cubic),
  });
  const metricDisplay = isNaN(numericValue) || numericValue === 0
    ? (content.metric?.value ?? '')
    : `${formatCountValue(metricAnim, { compact: numericValue >= 1000 })}${metricSuffix}`;

  const metricOpacity = fadeIn(frame, { durationInFrames: 14, delay: 8 });
  const metricScale = interpolate(frame, [8, 20, 26], [1.4, 0.95, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2)),
  });

  const fontSize = isVertical ? 48 : 38;
  const metricFontSize = isVertical ? 100 : 80;
  const labelFontSize = isVertical ? 28 : 22;

  const renderLogos = (logos: NonNullable<SocialProofContent['logos']>) => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isVertical ? 20 : 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
      }}
    >
      {logos.map((logo, i) => {
        const anim = slideIn(frame, {
          durationInFrames: 14,
          delay: 14 + i * 8,
          direction: 'left',
          distance: 30,
        });
        return (
          <div
            key={i}
            style={{
              backgroundColor: `${logo.color ?? style.accent_color}18`,
              border: `1.5px solid ${logo.color ?? style.accent_color}40`,
              borderRadius: 10,
              padding: isVertical ? '12px 24px' : '10px 20px',
              opacity: anim.opacity,
              transform: `translateX(${anim.x}px)`,
            }}
          >
            <span
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize: isVertical ? 24 : 20,
                fontWeight: 700,
                color: logo.color ?? style.primary_color,
                letterSpacing: '0.04em',
              }}
            >
              {logo.name}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderTestimonials = (testimonials: NonNullable<SocialProofContent['testimonials']>) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isVertical ? 16 : 12,
        marginTop: 24,
      }}
    >
      {testimonials.map((t, i) => {
        const anim = slideIn(frame, {
          durationInFrames: 16,
          delay: 14 + i * 10,
          direction: 'left',
          distance: 40,
        });
        return (
          <div
            key={i}
            style={{
              backgroundColor: `${style.accent_color}0A`,
              border: `1px solid ${style.accent_color}25`,
              borderRadius: 12,
              padding: isVertical ? '16px 20px' : '12px 18px',
              opacity: anim.opacity,
              transform: `translateX(${anim.x}px)`,
              borderLeft: `3px solid ${style.accent_color}`,
            }}
          >
            <p
              style={{
                fontFamily: getFontFamily(style.font_body),
                fontSize: isVertical ? 26 : 20,
                fontWeight: 400,
                color: style.primary_color,
                margin: '0 0 8px 0',
                lineHeight: 1.4,
                fontStyle: 'italic',
              }}
            >
              "{t.quote}"
            </p>
            <span
              style={{
                fontFamily: getFontFamily(style.font_body),
                fontSize: isVertical ? 20 : 16,
                fontWeight: 600,
                color: style.secondary_color,
              }}
            >
              — {t.author}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isVertical ? '60px 40px' : '60px 80px',
            textAlign: 'center',
          }}
        >
          {/* Headline */}
          {content.headline && (
            <div style={{ opacity: headlineOpacity, marginBottom: 8 }}>
              <h2
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize,
                  fontWeight: 800,
                  color: style.primary_color,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {content.headline}
              </h2>
            </div>
          )}

          {/* Big metric */}
          {content.metric && (
            <div
              style={{
                opacity: metricOpacity,
                transform: `scale(${metricScale})`,
                marginTop: content.headline ? 16 : 0,
              }}
            >
              <div
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: metricFontSize,
                  fontWeight: 900,
                  color: style.accent_color,
                  lineHeight: 1,
                  textShadow: glow.textShadow,
                }}
              >
                {metricDisplay}
              </div>
              <div
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: labelFontSize,
                  fontWeight: 500,
                  color: style.secondary_color,
                  marginTop: 8,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {content.metric.label}
              </div>
            </div>
          )}

          {/* Logos */}
          {content.logos && content.logos.length > 0 && renderLogos(content.logos)}

          {/* Testimonials */}
          {content.testimonials && content.testimonials.length > 0 && renderTestimonials(content.testimonials)}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default SocialProofScene;
