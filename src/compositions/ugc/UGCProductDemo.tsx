import React from 'react';
import {
  AbsoluteFill,
  Img,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

// =============================================================================
// UGC Product Demo - Step-by-step product showcase ad
// Shows the product workflow in 3 steps with a CTA
// =============================================================================

export interface UGCProductDemoProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  badge?: string;

  // Steps
  steps?: {
    icon: string;
    title: string;
    description: string;
  }[];

  // Media
  productImageSrc?: string;
  productVideoSrc?: string;
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

export const ugcProductDemoDefaultProps: UGCProductDemoProps = {
  headline: 'How It Works',
  subheadline: 'Clean results in under 2 minutes',
  ctaText: 'Get 10 Free Credits',
  badge: 'SIMPLE',
  steps: [
    { icon: '📤', title: 'Upload', description: 'Drop your file' },
    { icon: '✨', title: 'Process', description: 'AI does the work' },
    { icon: '📥', title: 'Download', description: 'Get clean output' },
  ],
  primaryColor: '#6366f1',
  accentColor: '#22c55e',
  fontFamily: 'Inter, system-ui, sans-serif',
  colorScheme: 'dark',
  headlineSize: 44,
};

export const UGCProductDemo: React.FC<UGCProductDemoProps> = (inputProps) => {
  const props = { ...ugcProductDemoDefaultProps, ...inputProps };
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
  const headlineSize = props.headlineSize || (isVertical ? 40 : 44);

  // Per-step staggered animations
  const steps = props.steps || ugcProductDemoDefaultProps.steps!;

  const stepAnimations = steps.map((_, i) => {
    const delay = 30 + i * 12;
    const stepScale = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 90 } });
    const stepOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: 'clamp' });
    return { scale: stepScale, opacity: stepOpacity };
  });

  return (
    <AbsoluteFill style={{ background: bgColor, fontFamily }}>
      {/* Subtle grid pattern */}
      <AbsoluteFill style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
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
              fontSize: isVertical ? 18 : 20,
              fontWeight: 400,
              color: subtextColor,
              lineHeight: 1.4,
            }}>
              {props.subheadline}
            </div>
          )}
        </div>

        {/* Product image/video (optional) */}
        {(props.productImageSrc || props.productVideoSrc) && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            opacity: headlineIn,
          }}>
            <div style={{
              borderRadius: 16,
              overflow: 'hidden',
              border: `1px solid ${cardBorder}`,
              maxHeight: isVertical ? 200 : 180,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}>
              {props.productVideoSrc ? (
                <Video src={props.productVideoSrc} style={{
                  height: isVertical ? 200 : 180,
                  objectFit: 'cover',
                }} />
              ) : (
                <Img src={props.productImageSrc!} style={{
                  height: isVertical ? 200 : 180,
                  objectFit: 'cover',
                }} />
              )}
            </div>
          </div>
        )}

        {/* Steps */}
        <div style={{
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          gap: isVertical ? 12 : 16,
        }}>
          {steps.map((step, i) => {
            const anim = stepAnimations[i];
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
                  padding: isVertical ? '16px 20px' : '20px 16px',
                  display: 'flex',
                  flexDirection: isVertical ? 'row' : 'column',
                  alignItems: 'center',
                  gap: isVertical ? 16 : 10,
                  textAlign: isVertical ? 'left' : 'center',
                }}
              >
                {/* Step number + icon */}
                <div style={{
                  width: isVertical ? 48 : 56,
                  height: isVertical ? 48 : 56,
                  borderRadius: isVertical ? 12 : 14,
                  background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)`,
                  border: `1px solid ${primaryColor}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isVertical ? 22 : 26,
                  flexShrink: 0,
                }}>
                  {step.icon}
                </div>

                <div>
                  {/* Step number */}
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: primaryColor,
                    letterSpacing: '0.08em',
                    marginBottom: 2,
                  }}>
                    STEP {i + 1}
                  </div>
                  {/* Title */}
                  <div style={{
                    fontSize: isVertical ? 16 : 18,
                    fontWeight: 700,
                    color: textColor,
                    marginBottom: 2,
                  }}>
                    {step.title}
                  </div>
                  {/* Description */}
                  <div style={{
                    fontSize: isVertical ? 13 : 14,
                    fontWeight: 400,
                    color: subtextColor,
                  }}>
                    {step.description}
                  </div>
                </div>

                {/* Connector arrow (horizontal only) */}
                {!isVertical && i < steps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    right: -12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: primaryColor,
                    fontSize: 18,
                    opacity: 0.5,
                  }}>
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
