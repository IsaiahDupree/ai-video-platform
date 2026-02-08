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
// UGC Feature List - Checklist-style feature comparison ad
// Shows features with checkmarks/crosses to compare against competitors
// =============================================================================

export interface UGCFeatureListProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  badge?: string;
  trustLine?: string;

  // Feature comparison
  features?: {
    text: string;
    included: boolean;
    highlight?: boolean;
  }[];
  competitorName?: string;

  // Media
  productImageSrc?: string;

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

export const ugcFeatureListDefaultProps: UGCFeatureListProps = {
  headline: 'Why Creators Switch',
  subheadline: 'Everything you need, nothing you don\'t',
  ctaText: 'Switch Now',
  badge: 'COMPARE',
  trustLine: 'Cancel anytime · Free plan available',
  features: [
    { text: 'Instant processing', included: true, highlight: true },
    { text: 'No watermarks', included: true },
    { text: 'HD quality export', included: true },
    { text: 'Batch processing', included: true, highlight: true },
    { text: 'No sign-up required', included: true },
  ],
  competitorName: 'Others',
  primaryColor: '#6366f1',
  accentColor: '#22c55e',
  fontFamily: 'Inter, system-ui, sans-serif',
  colorScheme: 'dark',
  headlineSize: 42,
};

export const UGCFeatureList: React.FC<UGCFeatureListProps> = (inputProps) => {
  const props = { ...ugcFeatureListDefaultProps, ...inputProps };
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
  const ctaIn = spring({ frame: frame - 70, fps, config: { damping: 12, stiffness: 80 } });

  const padding = isVertical ? 40 : 48;
  const headlineSize = props.headlineSize || (isVertical ? 38 : 42);
  const features = props.features || ugcFeatureListDefaultProps.features!;

  // Per-feature staggered animations
  const featureAnimations = features.map((_, i) => {
    const delay = 25 + i * 8;
    const slideX = interpolate(frame, [delay, delay + 12], [-30, 0], { extrapolateRight: 'clamp' });
    const opacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: 'clamp' });
    const checkScale = spring({ frame: frame - (delay + 8), fps, config: { damping: 10, stiffness: 120 } });
    return { slideX, opacity, checkScale };
  });

  return (
    <AbsoluteFill style={{ background: bgColor, fontFamily }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding,
        justifyContent: 'center',
        gap: isVertical ? 20 : 24,
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
              background: `${primaryColor}18`,
              border: `1px solid ${primaryColor}40`,
              color: primaryColor,
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

        {/* Feature List Card */}
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 20,
          padding: isVertical ? '24px 28px' : '28px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: isVertical ? 14 : 16,
          boxShadow: props.colorScheme === 'dark'
            ? `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${primaryColor}08`
            : '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          {features.map((feature, i) => {
            const anim = featureAnimations[i];
            const checkColor = feature.included ? accentColor : '#ef4444';
            const checkIcon = feature.included ? '✓' : '✕';

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  opacity: anim.opacity,
                  transform: `translateX(${anim.slideX}px)`,
                }}
              >
                {/* Check/Cross icon */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: `${checkColor}18`,
                  border: `1.5px solid ${checkColor}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${anim.checkScale})`,
                  flexShrink: 0,
                }}>
                  <span style={{
                    color: checkColor,
                    fontSize: 14,
                    fontWeight: 800,
                  }}>
                    {checkIcon}
                  </span>
                </div>

                {/* Feature text */}
                <span style={{
                  fontSize: isVertical ? 16 : 18,
                  fontWeight: feature.highlight ? 600 : 400,
                  color: feature.included ? textColor : subtextColor,
                  textDecoration: feature.included ? 'none' : 'line-through',
                  flex: 1,
                }}>
                  {feature.text}
                </span>

                {/* Highlight indicator */}
                {feature.highlight && feature.included && (
                  <div style={{
                    background: `${accentColor}20`,
                    color: accentColor,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 10,
                    letterSpacing: '0.05em',
                    opacity: anim.opacity,
                  }}>
                    NEW
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Product image (optional) */}
        {props.productImageSrc && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            opacity: interpolate(frame, [50, 60], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            <Img src={props.productImageSrc} style={{
              maxHeight: isVertical ? 100 : 80,
              borderRadius: 12,
              objectFit: 'contain',
            }} />
          </div>
        )}

        {/* Trust line */}
        {props.trustLine && (
          <div style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: subtextColor,
            opacity: interpolate(frame, [60, 70], [0, 0.8], { extrapolateRight: 'clamp' }),
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
