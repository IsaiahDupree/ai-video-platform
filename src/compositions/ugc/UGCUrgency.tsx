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
// UGC Urgency/FOMO - Limited-time offer ad with countdown & scarcity
// Creates urgency through countdown timer, limited spots, and deal framing
// =============================================================================

export interface UGCUrgencyProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  badge?: string;
  trustLine?: string;

  // Urgency elements
  offerText?: string;
  originalPrice?: string;
  salePrice?: string;
  discount?: string;
  spotsLeft?: number;
  countdownHours?: number;
  countdownMinutes?: number;

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

export const ugcUrgencyDefaultProps: UGCUrgencyProps = {
  headline: 'Last Chance',
  subheadline: 'This deal won\'t last',
  ctaText: 'Claim Your Spot',
  badge: 'LIMITED',
  trustLine: '30-day money-back guarantee',
  offerText: 'Annual Pro Plan',
  originalPrice: '$199',
  salePrice: '$79',
  discount: '60% OFF',
  spotsLeft: 23,
  countdownHours: 11,
  countdownMinutes: 47,
  primaryColor: '#6366f1',
  accentColor: '#22c55e',
  fontFamily: 'Inter, system-ui, sans-serif',
  colorScheme: 'dark',
  headlineSize: 44,
};

export const UGCUrgency: React.FC<UGCUrgencyProps> = (inputProps) => {
  const props = { ...ugcUrgencyDefaultProps, ...inputProps };
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isVertical = height > width;
  const primaryColor = props.primaryColor!;
  const accentColor = props.accentColor!;
  const fontFamily = props.fontFamily!;
  const urgentColor = '#ef4444';

  const bgColor = props.colorScheme === 'light' ? '#f8fafc' : '#0a0a0f';
  const textColor = props.colorScheme === 'light' ? '#1e293b' : '#ffffff';
  const subtextColor = props.colorScheme === 'light' ? '#64748b' : '#a1a1aa';
  const cardBg = props.colorScheme === 'light' ? '#ffffff' : '#18181b';
  const cardBorder = props.colorScheme === 'light' ? '#e2e8f0' : '#2d2d44';

  // Animations
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const badgeIn = interpolate(frame, [3, 15], [0, 1], { extrapolateRight: 'clamp' });
  const headlineIn = interpolate(frame, [8, 25], [0, 1], { extrapolateRight: 'clamp' });
  const headlineY = interpolate(frame, [8, 25], [20, 0], { extrapolateRight: 'clamp' });

  const timerIn = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 90 } });
  const priceIn = spring({ frame: frame - 35, fps, config: { damping: 14, stiffness: 90 } });
  const spotsIn = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: 'clamp' });
  const ctaIn = spring({ frame: frame - 55, fps, config: { damping: 12, stiffness: 80 } });

  // Pulsing urgency effect for badge
  const pulse = interpolate(
    frame % 30, [0, 15, 30], [1, 1.08, 1],
    { extrapolateRight: 'clamp' }
  );

  const padding = isVertical ? 40 : 48;
  const headlineSize = props.headlineSize || (isVertical ? 40 : 44);

  // Countdown timer segments
  const timerSegment = (value: string, label: string, delay: number) => {
    const segIn = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 100 } });
    return (
      <div style={{
        transform: `scale(${segIn})`,
        textAlign: 'center',
      }}>
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          padding: isVertical ? '12px 16px' : '16px 20px',
          minWidth: isVertical ? 64 : 72,
        }}>
          <div style={{
            fontSize: isVertical ? 28 : 32,
            fontWeight: 800,
            color: urgentColor,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {value}
          </div>
        </div>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: subtextColor,
          marginTop: 6,
          letterSpacing: '0.06em',
        }}>
          {label}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: bgColor, fontFamily }}>
      {/* Urgent gradient accent */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 0%, ${urgentColor}08 0%, transparent 60%)`,
      }} />

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
              transform: `scale(${pulse})`,
              background: `${urgentColor}18`,
              border: `1px solid ${urgentColor}40`,
              color: urgentColor,
              padding: '4px 12px',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 700,
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
          }}>
            {props.headline}
          </div>
          {props.subheadline && (
            <div style={{
              fontSize: isVertical ? 16 : 18,
              fontWeight: 400,
              color: subtextColor,
              lineHeight: 1.4,
              marginTop: 8,
            }}>
              {props.subheadline}
            </div>
          )}
        </div>

        {/* Countdown Timer */}
        {(props.countdownHours !== undefined || props.countdownMinutes !== undefined) && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isVertical ? 12 : 16,
            transform: `scale(${timerIn})`,
          }}>
            {timerSegment(String(props.countdownHours ?? 0).padStart(2, '0'), 'HOURS', 22)}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 28,
              fontWeight: 800,
              color: urgentColor,
              paddingBottom: 20,
            }}>:</div>

            {timerSegment(String(props.countdownMinutes ?? 0).padStart(2, '0'), 'MINUTES', 25)}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 28,
              fontWeight: 800,
              color: urgentColor,
              paddingBottom: 20,
            }}>:</div>

            {timerSegment('00', 'SECONDS', 28)}
          </div>
        )}

        {/* Price Card */}
        {(props.originalPrice || props.salePrice) && (
          <div style={{
            transform: `scale(${priceIn})`,
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 20,
            padding: isVertical ? '24px 28px' : '28px 36px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: props.colorScheme === 'dark'
              ? `0 8px 32px rgba(0,0,0,0.3)`
              : '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            {/* Discount ribbon */}
            {props.discount && (
              <div style={{
                position: 'absolute',
                top: 12,
                right: -28,
                background: urgentColor,
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 32px',
                transform: 'rotate(45deg)',
                letterSpacing: '0.05em',
              }}>
                {props.discount}
              </div>
            )}

            {props.offerText && (
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: subtextColor,
                marginBottom: 12,
                letterSpacing: '0.04em',
              }}>
                {props.offerText}
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}>
              {props.originalPrice && (
                <span style={{
                  fontSize: isVertical ? 24 : 28,
                  fontWeight: 500,
                  color: subtextColor,
                  textDecoration: 'line-through',
                }}>
                  {props.originalPrice}
                </span>
              )}
              {props.salePrice && (
                <span style={{
                  fontSize: isVertical ? 40 : 48,
                  fontWeight: 800,
                  color: accentColor,
                  lineHeight: 1,
                }}>
                  {props.salePrice}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Product image (optional) */}
        {props.productImageSrc && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            opacity: spotsIn,
          }}>
            <Img src={props.productImageSrc} style={{
              maxHeight: isVertical ? 100 : 80,
              borderRadius: 12,
              objectFit: 'contain',
            }} />
          </div>
        )}

        {/* Spots remaining */}
        {props.spotsLeft !== undefined && (
          <div style={{
            textAlign: 'center',
            opacity: spotsIn,
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: `${urgentColor}12`,
              border: `1px solid ${urgentColor}30`,
              padding: '6px 16px',
              borderRadius: 20,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: urgentColor,
                boxShadow: `0 0 8px ${urgentColor}`,
              }} />
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: urgentColor,
              }}>
                Only {props.spotsLeft} spots left
              </span>
            </div>
          </div>
        )}

        {/* Trust line */}
        {props.trustLine && (
          <div style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: subtextColor,
            opacity: spotsIn,
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
