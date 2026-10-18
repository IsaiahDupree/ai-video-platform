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
// UGC Problem/Solution - Two-panel storytelling ad
// Top: problem state with pain-point copy
// Bottom: solution state with benefit copy + CTA
// =============================================================================

export interface UGCProblemSolutionProps {
  // Content
  headline?: string;
  problemText?: string;
  solutionText?: string;
  ctaText?: string;
  badge?: string;
  trustLine?: string;

  // Media
  problemImageSrc?: string;
  solutionImageSrc?: string;
  problemVideoSrc?: string;
  solutionVideoSrc?: string;

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

export const ugcProblemSolutionDefaultProps: UGCProblemSolutionProps = {
  headline: 'There\'s a Better Way',
  problemText: 'Wasting hours on tools that blur your output?',
  solutionText: 'Upload once. Get a clean, HD result in seconds.',
  ctaText: 'Try It Free',
  badge: 'SOLVED',
  trustLine: 'No ads · No installs · Works instantly',
  primaryColor: '#6366f1',
  accentColor: '#22c55e',
  fontFamily: 'Inter, system-ui, sans-serif',
  colorScheme: 'dark',
  headlineSize: 42,
};

export const UGCProblemSolution: React.FC<UGCProblemSolutionProps> = (inputProps) => {
  const props = { ...ugcProblemSolutionDefaultProps, ...inputProps };
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
  const headlineIn = interpolate(frame, [5, 25], [0, 1], { extrapolateRight: 'clamp' });
  const headlineY = interpolate(frame, [5, 25], [20, 0], { extrapolateRight: 'clamp' });

  const problemIn = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 90 } });
  const solutionIn = spring({ frame: frame - 35, fps, config: { damping: 14, stiffness: 90 } });

  const ctaIn = spring({ frame: frame - 55, fps, config: { damping: 12, stiffness: 80 } });

  const padding = isVertical ? 40 : 48;
  const headlineSize = props.headlineSize || (isVertical ? 38 : 42);

  const renderPanel = (
    type: 'problem' | 'solution',
    text?: string,
    imageSrc?: string,
    videoSrc?: string,
    scale?: number,
  ) => {
    const isProblem = type === 'problem';
    const iconColor = isProblem ? '#ef4444' : accentColor;
    const icon = isProblem ? '✕' : '✓';
    const borderColor = isProblem ? '#ef444440' : `${accentColor}40`;

    return (
      <div style={{
        flex: 1,
        transform: `scale(${scale || 1})`,
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        gap: 16,
        background: cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 16,
        padding: isVertical ? 20 : 24,
        overflow: 'hidden',
        alignItems: 'center',
      }}>
        {/* Media */}
        {(imageSrc || videoSrc) && (
          <div style={{
            width: isVertical ? '100%' : 120,
            height: isVertical ? 120 : '100%',
            borderRadius: 12,
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {videoSrc ? (
              <Video src={videoSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Img src={imageSrc!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
        )}

        {/* Text */}
        <div style={{ flex: 1 }}>
          {/* Icon badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 14,
            background: `${iconColor}20`,
            border: `1px solid ${iconColor}50`,
            color: iconColor,
            fontSize: 14,
            fontWeight: 800,
            marginBottom: 8,
          }}>
            {icon}
          </div>

          <div style={{
            fontSize: isVertical ? 16 : 18,
            fontWeight: 500,
            color: textColor,
            lineHeight: 1.4,
          }}>
            {text}
          </div>
        </div>
      </div>
    );
  };

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
              opacity: fadeIn,
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

        {/* Problem panel */}
        {renderPanel(
          'problem',
          props.problemText,
          props.problemImageSrc,
          props.problemVideoSrc,
          problemIn,
        )}

        {/* Divider arrow */}
        <div style={{
          textAlign: 'center',
          fontSize: 24,
          color: primaryColor,
          opacity: interpolate(frame, [30, 40], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          ↓
        </div>

        {/* Solution panel */}
        {renderPanel(
          'solution',
          props.solutionText,
          props.solutionImageSrc,
          props.solutionVideoSrc,
          solutionIn,
        )}

        {/* Trust line */}
        {props.trustLine && (
          <div style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: subtextColor,
            opacity: interpolate(frame, [50, 60], [0, 0.8], { extrapolateRight: 'clamp' }),
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
