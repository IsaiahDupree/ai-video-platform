import React from 'react';
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

// =============================================================================
// UGC Stat Counter - Social proof ad with animated big numbers
// Shows key metrics (users, downloads, rating) to build trust
// =============================================================================

export interface UGCStatCounterProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  badge?: string;
  trustLine?: string;

  // Stats
  stats?: {
    value: string;
    label: string;
    prefix?: string;
    suffix?: string;
  }[];

  // Media
  productImageSrc?: string;
  backgroundImageSrc?: string;

  // Brand
  brandName?: string;
  brandLogoSrc?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;

  // Layout
  colorScheme?: 'dark' | 'light';
  headlineSize?: number;
}

export const ugcStatCounterDefaultProps: UGCStatCounterProps = {
  headline: 'Trusted by Creators',
  subheadline: 'Join thousands who already made the switch',
  ctaText: 'Start Free Trial',
  badge: 'POPULAR',
  trustLine: 'Free to start · No credit card required',
  stats: [
    { value: '50K', label: 'Active Users', suffix: '+' },
    { value: '4.9', label: 'App Store Rating', suffix: '★' },
    { value: '2M', label: 'Files Processed', suffix: '+' },
  ],
  primaryColor: '#6366f1',
  accentColor: '#22c55e',
  fontFamily: 'Inter, system-ui, sans-serif',
  colorScheme: 'dark',
  headlineSize: 42,
};

export const UGCStatCounter: React.FC<UGCStatCounterProps> = (inputProps) => {
  const props = { ...ugcStatCounterDefaultProps, ...inputProps };
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isVertical = height > width;
  const primaryColor = props.primaryColor!;
  const accentColor = props.accentColor!;
  const fontFamily = props.fontFamily!;

  const bgColor = props.colorScheme === 'light' ? '#f8fafc' : '#0a0a0f';
  const textColor = props.colorScheme === 'light' ? '#1e293b' : '#ffffff';
  const subtextColor = props.colorScheme === 'light' ? '#64748b' : '#a1a1aa';
  const cardBg = props.colorScheme === 'light' ? '#ffffff' : '#18181b';
  const cardBorder = props.colorScheme === 'light' ? '#e2e8f0' : '#2d2d44';

  // Animations
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const badgeIn = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' });
  const headlineIn = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });
  const headlineY = interpolate(frame, [10, 30], [20, 0], { extrapolateRight: 'clamp' });
  const ctaIn = spring({ frame: frame - 65, fps, config: { damping: 12, stiffness: 80 } });

  const padding = isVertical ? 40 : 48;
  const headlineSize = props.headlineSize || (isVertical ? 38 : 42);
  const stats = props.stats || ugcStatCounterDefaultProps.stats!;

  // Per-stat staggered animations
  const statAnimations = stats.map((_, i) => {
    const delay = 25 + i * 10;
    const scale = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 90 } });
    const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: 'clamp' });
    // Counter roll-up effect
    const countProgress = interpolate(frame, [delay, delay + 25], [0, 1], { extrapolateRight: 'clamp' });
    return { scale, opacity, countProgress };
  });

  return (
    <AbsoluteFill style={{ background: bgColor, fontFamily }}>
      {/* Radial gradient accent */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 30%, ${primaryColor}12 0%, transparent 70%)`,
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding,
        justifyContent: 'center',
        gap: isVertical ? 24 : 28,
      }}>
        {/* Brand + Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: fadeIn,
        }}>
          {props.brandName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {props.brandLogoSrc && (
                <Img src={props.brandLogoSrc} style={{ width: 28, height: 28, borderRadius: 6 }} />
              )}
              <span style={{ fontSize: 18, fontWeight: 700, color: textColor }}>
                {props.brandName}
              </span>
            </div>
          )}
          {props.badge && (
            <div style={{
              opacity: badgeIn,
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}40`,
              color: accentColor,
              padding: '4px 12px',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.06em',
            }}>
              {props.badge}
            </div>
          )}
        </div>

        {/* Headline */}
        <div style={{
          textAlign: 'center',
          opacity: headlineIn,
          transform: `translateY(${headlineY}px)`,
        }}>
          <div style={{
            fontSize: headlineSize,
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}>
            {props.headline}
          </div>
          {props.subheadline && (
            <div style={{
              fontSize: isVertical ? 16 : 18,
              fontWeight: 400,
              color: subtextColor,
              lineHeight: 1.4,
            }}>
              {props.subheadline}
            </div>
          )}
        </div>

        {/* Product image (optional) */}
        {props.productImageSrc && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            opacity: headlineIn,
          }}>
            <Img src={props.productImageSrc} style={{
              maxHeight: isVertical ? 160 : 140,
              borderRadius: 16,
              objectFit: 'contain',
              border: `1px solid ${cardBorder}`,
            }} />
          </div>
        )}

        {/* Stats Grid */}
        <div style={{
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          gap: isVertical ? 12 : 16,
        }}>
          {stats.map((stat, i) => {
            const anim = statAnimations[i];
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  transform: `scale(${anim.scale})`,
                  opacity: anim.opacity,
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 16,
                  padding: isVertical ? '20px 24px' : '24px 16px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Subtle top accent line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
                  borderRadius: 1,
                }} />

                {/* Value */}
                <div style={{
                  fontSize: isVertical ? 36 : 40,
                  fontWeight: 800,
                  color: textColor,
                  lineHeight: 1,
                  marginBottom: 4,
                  letterSpacing: '-0.02em',
                }}>
                  {stat.prefix || ''}
                  <span style={{ color: primaryColor }}>
                    {stat.value}
                  </span>
                  {stat.suffix || ''}
                </div>

                {/* Label */}
                <div style={{
                  fontSize: isVertical ? 13 : 14,
                  fontWeight: 500,
                  color: subtextColor,
                  letterSpacing: '0.02em',
                }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust line */}
        {props.trustLine && (
          <div style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: subtextColor,
            opacity: interpolate(frame, [55, 65], [0, 0.8], { extrapolateRight: 'clamp' }),
          }}>
            {props.trustLine}
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            transform: `scale(${ctaIn})`,
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            color: '#ffffff',
            padding: isVertical ? '14px 36px' : '16px 44px',
            borderRadius: 50,
            fontSize: isVertical ? 18 : 20,
            fontWeight: 700,
            boxShadow: `0 4px 20px ${primaryColor}40`,
          }}>
            {props.ctaText}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
