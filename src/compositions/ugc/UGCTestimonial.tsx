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
// UGC Testimonial - Social-proof style ad with quote + avatar
// Designed for UGC-style ads that feel authentic and native
// =============================================================================

export interface UGCTestimonialProps {
  // Content
  headline?: string;
  testimonialQuote?: string;
  authorName?: string;
  authorTitle?: string;
  ctaText?: string;
  badge?: string;
  rating?: number; // 1-5 stars

  // Media
  authorAvatarSrc?: string;
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

export const ugcTestimonialDefaultProps: UGCTestimonialProps = {
  headline: 'Creators Love It',
  testimonialQuote: '"This tool saved me hours every week. No more watermark headaches."',
  authorName: 'Sarah K.',
  authorTitle: 'Content Creator • 120K followers',
  ctaText: 'Try It Free',
  badge: '4.9★ RATED',
  rating: 5,
  primaryColor: '#6366f1',
  accentColor: '#22c55e',
  fontFamily: 'Inter, system-ui, sans-serif',
  colorScheme: 'dark',
  headlineSize: 42,
};

export const UGCTestimonial: React.FC<UGCTestimonialProps> = (inputProps) => {
  const props = { ...ugcTestimonialDefaultProps, ...inputProps };
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isVertical = height > width;
  const primaryColor = props.primaryColor!;
  const accentColor = props.accentColor!;
  const fontFamily = props.fontFamily!;

  const bgColor = props.colorScheme === 'light' ? '#f8fafc' : '#0a0a0f';
  const textColor = props.colorScheme === 'light' ? '#1e293b' : '#ffffff';
  const subtextColor = props.colorScheme === 'light' ? '#64748b' : '#a1a1aa';
  const cardBg = props.colorScheme === 'light' ? '#ffffff' : '#1a1a2e';
  const cardBorder = props.colorScheme === 'light' ? '#e2e8f0' : '#2d2d44';

  // Animations
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const badgeIn = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' });
  const headlineIn = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });
  const headlineY = interpolate(frame, [10, 30], [20, 0], { extrapolateRight: 'clamp' });

  const cardIn = spring({ frame: frame - 20, fps, config: { damping: 15, stiffness: 80 } });
  const quoteIn = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const authorIn = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: 'clamp' });
  const ctaIn = spring({ frame: frame - 55, fps, config: { damping: 12, stiffness: 80 } });

  const padding = isVertical ? 40 : 48;
  const headlineSize = props.headlineSize || (isVertical ? 38 : 42);

  // Stars
  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{
          color: i < count ? '#fbbf24' : '#4b5563',
          fontSize: isVertical ? 20 : 24,
        }}
      >
        ★
      </span>
    ));
  };

  return (
    <AbsoluteFill style={{ background: bgColor, fontFamily }}>
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
          opacity: headlineIn,
          transform: `translateY(${headlineY}px)`,
          fontSize: headlineSize,
          fontWeight: 800,
          color: textColor,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          textAlign: 'center',
        }}>
          {props.headline}
        </div>

        {/* Stars */}
        {props.rating && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
            opacity: headlineIn,
          }}>
            {renderStars(props.rating)}
          </div>
        )}

        {/* Testimonial Card */}
        <div style={{
          transform: `scale(${cardIn})`,
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 20,
          padding: isVertical ? 28 : 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: props.colorScheme === 'dark'
            ? `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${primaryColor}15`
            : '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          {/* Quote */}
          <div style={{
            opacity: quoteIn,
            fontSize: isVertical ? 20 : 24,
            fontWeight: 500,
            color: textColor,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}>
            {props.testimonialQuote}
          </div>

          {/* Author */}
          <div style={{
            opacity: authorIn,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            {props.authorAvatarSrc ? (
              <Img src={props.authorAvatarSrc} style={{
                width: 44, height: 44, borderRadius: 22,
                border: `2px solid ${primaryColor}`,
              }} />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: 22,
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 18, fontWeight: 700,
              }}>
                {(props.authorName || 'A').charAt(0)}
              </div>
            )}
            <div>
              <div style={{
                fontSize: 16, fontWeight: 700, color: textColor,
              }}>
                {props.authorName}
              </div>
              {props.authorTitle && (
                <div style={{
                  fontSize: 13, fontWeight: 400, color: subtextColor,
                }}>
                  {props.authorTitle}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product image (optional) */}
        {props.productImageSrc && (
          <div style={{
            display: 'flex', justifyContent: 'center',
            opacity: authorIn,
          }}>
            <Img src={props.productImageSrc} style={{
              maxHeight: isVertical ? 120 : 100,
              borderRadius: 12,
              objectFit: 'contain',
            }} />
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
