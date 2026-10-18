import React from 'react';
import {
  AbsoluteFill,
  Img,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

// =============================================================================
// UGC Before/After - Brand-agnostic before/after ad for the UGC pipeline
// Supports both static (Still) and animated (Composition) modes
// =============================================================================

export interface UGCBeforeAfterProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  beforeLabel?: string;
  afterLabel?: string;
  trustLine?: string;
  badge?: string;

  // Media - images or video
  beforeImageSrc?: string;
  afterImageSrc?: string;
  beforeVideoSrc?: string;
  afterVideoSrc?: string;

  // Brand
  brandName?: string;
  brandLogoSrc?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;

  // Layout
  colorScheme?: 'dark' | 'light' | 'brand';
  labelStyle?: 'pill' | 'bar' | 'corner' | 'inline';
  ctaPosition?: 'bottom' | 'middle' | 'overlay';
  splitDirection?: 'horizontal' | 'vertical';

  // Sizing
  headlineSize?: number;
  subheadlineSize?: number;
}

export const ugcBeforeAfterDefaultProps: UGCBeforeAfterProps = {
  headline: 'See the Difference',
  subheadline: 'Upload → Transform → Download',
  ctaText: 'Try It Free',
  beforeLabel: 'BEFORE',
  afterLabel: 'AFTER',
  trustLine: 'Trusted by 50K+ creators',
  badge: '',
  primaryColor: '#6366f1',
  accentColor: '#22c55e',
  fontFamily: 'Inter, system-ui, sans-serif',
  colorScheme: 'dark',
  labelStyle: 'pill',
  ctaPosition: 'bottom',
  splitDirection: 'horizontal',
  headlineSize: 48,
  subheadlineSize: 22,
};

export const UGCBeforeAfter: React.FC<UGCBeforeAfterProps> = (inputProps) => {
  const props = { ...ugcBeforeAfterDefaultProps, ...inputProps };
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isVertical = height > width;
  const primaryColor = props.primaryColor!;
  const accentColor = props.accentColor!;
  const fontFamily = props.fontFamily!;

  // Colors based on scheme
  const bgColor = props.colorScheme === 'light' ? '#f8fafc' : '#0a0a0f';
  const textColor = props.colorScheme === 'light' ? '#1e293b' : '#ffffff';
  const subtextColor = props.colorScheme === 'light' ? '#64748b' : '#a1a1aa';
  const cardBg = props.colorScheme === 'light' ? '#ffffff' : '#18181b';

  // Animations
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [5, 25], [40, 0], { extrapolateRight: 'clamp' });

  const beforeLabelIn = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 100 } });
  const afterLabelIn = spring({ frame: frame - 25, fps, config: { damping: 14, stiffness: 100 } });

  const textIn = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: 'clamp' });
  const textSlide = interpolate(frame, [35, 55], [20, 0], { extrapolateRight: 'clamp' });

  const ctaIn = spring({ frame: frame - 55, fps, config: { damping: 12, stiffness: 80 } });
  const badgeIn = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: 'clamp' });

  // Responsive sizing
  const headlineSize = props.headlineSize || (isVertical ? 44 : 48);
  const subheadlineSize = props.subheadlineSize || (isVertical ? 20 : 22);
  const padding = isVertical ? 40 : 48;
  const imageAreaHeight = isVertical ? '50%' : '55%';

  // Render before/after media
  const renderMedia = (
    imageSrc?: string,
    videoSrc?: string,
    label?: string,
    labelColor?: string,
    labelBg?: string,
    labelOpacity?: number
  ) => {
    const mediaStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    };

    return (
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', borderRadius: 16 }}>
        {videoSrc ? (
          <Video src={videoSrc} style={mediaStyle} />
        ) : imageSrc ? (
          <Img src={imageSrc} style={mediaStyle} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${cardBg}, ${bgColor})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 80, height: 60, borderRadius: 8,
              background: `${primaryColor}20`, border: `2px dashed ${primaryColor}40`,
            }} />
          </div>
        )}

        {/* Label */}
        {label && props.labelStyle === 'pill' && (
          <div style={{
            position: 'absolute',
            bottom: 12, left: '50%',
            transform: `translateX(-50%) scale(${labelOpacity || 1})`,
            opacity: labelOpacity,
            background: labelBg || 'rgba(0,0,0,0.8)',
            color: labelColor || '#fff',
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 700,
            fontFamily,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </div>
        )}

        {label && props.labelStyle === 'bar' && (
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            opacity: labelOpacity,
            background: labelBg || 'rgba(0,0,0,0.75)',
            color: labelColor || '#fff',
            padding: '8px 0',
            fontSize: 14,
            fontWeight: 700,
            fontFamily,
            textAlign: 'center',
            letterSpacing: '0.08em',
          }}>
            {label}
          </div>
        )}

        {label && props.labelStyle === 'corner' && (
          <div style={{
            position: 'absolute',
            top: 12, left: 12,
            opacity: labelOpacity,
            background: labelBg || 'rgba(0,0,0,0.8)',
            color: labelColor || '#fff',
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            fontFamily,
            letterSpacing: '0.06em',
          }}>
            {label}
          </div>
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: bgColor, fontFamily }}>
      {/* Content container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding,
        gap: isVertical ? 20 : 24,
      }}>
        {/* Brand header */}
        {(props.brandName || props.badge) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: fadeIn,
          }}>
            {props.brandName && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {props.brandLogoSrc && (
                  <Img src={props.brandLogoSrc} style={{ width: 28, height: 28, borderRadius: 6 }} />
                )}
                <span style={{
                  fontSize: 18, fontWeight: 700, color: textColor,
                  letterSpacing: '-0.01em',
                }}>
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
        )}

        {/* Before/After media area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: props.splitDirection === 'vertical' ? 'column' : 'row',
          gap: 12,
          opacity: fadeIn,
          transform: `translateY(${slideUp}px)`,
          minHeight: 0,
        }}>
          {renderMedia(
            props.beforeImageSrc,
            props.beforeVideoSrc,
            props.beforeLabel,
            '#ef4444',
            'rgba(239, 68, 68, 0.9)',
            beforeLabelIn
          )}
          {renderMedia(
            props.afterImageSrc,
            props.afterVideoSrc,
            props.afterLabel,
            '#22c55e',
            'rgba(34, 197, 94, 0.9)',
            afterLabelIn
          )}
        </div>

        {/* Text content */}
        <div style={{
          textAlign: 'center',
          opacity: textIn,
          transform: `translateY(${textSlide}px)`,
        }}>
          <div style={{
            fontSize: headlineSize,
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.1,
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}>
            {props.headline}
          </div>
          {props.subheadline && (
            <div style={{
              fontSize: subheadlineSize,
              fontWeight: 400,
              color: subtextColor,
              lineHeight: 1.4,
              marginBottom: 16,
            }}>
              {props.subheadline}
            </div>
          )}

          {/* Trust line */}
          {props.trustLine && (
            <div style={{
              fontSize: 14,
              fontWeight: 500,
              color: subtextColor,
              marginBottom: 16,
              opacity: 0.8,
            }}>
              {props.trustLine}
            </div>
          )}

          {/* CTA */}
          {props.ctaText && (
            <div style={{
              display: 'inline-block',
              transform: `scale(${ctaIn})`,
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              color: '#ffffff',
              padding: isVertical ? '14px 36px' : '16px 44px',
              borderRadius: 50,
              fontSize: isVertical ? 18 : 20,
              fontWeight: 700,
              letterSpacing: '0.01em',
              boxShadow: `0 4px 20px ${primaryColor}40`,
            }}>
              {props.ctaText}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
