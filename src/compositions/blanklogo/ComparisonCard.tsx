import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';
import { BLANKLOGO_COLORS, BLANKLOGO_FONTS, COMPARISON_DATA } from './config';

// =============================================================================
// ComparisonCard - "Typical tools" vs "BlankLogo" comparison
// Side-by-side bullet comparison with animated reveals
// =============================================================================

export interface ComparisonCardProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  
  // Comparison data
  leftTitle?: string;
  leftItems?: string[];
  rightTitle?: string;
  rightItems?: string[];
  
  // Styling
  theme?: 'dark' | 'gradient';
  showLogo?: boolean;
  layout?: 'side-by-side' | 'stacked';
}

export const comparisonCardDefaultProps: ComparisonCardProps = {
  headline: 'Built to Avoid the Usual Problems',
  subheadline: 'No ad walls. No low-quality exports. No gimmicks.',
  ctaText: 'Try BlankLogo',
  leftTitle: COMPARISON_DATA.typical.title,
  leftItems: [...COMPARISON_DATA.typical.items.slice(0, 4)],
  rightTitle: COMPARISON_DATA.blanklogo.title,
  rightItems: [...COMPARISON_DATA.blanklogo.items.slice(0, 4)],
  theme: 'dark',
  showLogo: true,
  layout: 'side-by-side',
};

// Logo Component
const BlankLogoLogo: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: BLANKLOGO_COLORS.gradientPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        fontWeight: 700,
        color: '#fff',
      }}
    >
      B
    </div>
    <span
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: BLANKLOGO_COLORS.white,
        fontFamily: BLANKLOGO_FONTS.heading,
      }}
    >
      BlankLogo
    </span>
  </div>
);

// CTA Button
const CTAButton: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      background: BLANKLOGO_COLORS.gradientPrimary,
      color: BLANKLOGO_COLORS.white,
      fontFamily: BLANKLOGO_FONTS.heading,
      fontWeight: BLANKLOGO_FONTS.weights.bold,
      fontSize: 18,
      padding: '14px 32px',
      borderRadius: 50,
      display: 'inline-block',
    }}
  >
    {text}
  </div>
);

// Comparison Item
const ComparisonItem: React.FC<{
  text: string;
  type: 'negative' | 'positive';
  delay: number;
}> = ({ text, type, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const opacity = interpolate(slideIn, [0, 1], [0, 1]);
  const translateX = interpolate(
    slideIn,
    [0, 1],
    [type === 'negative' ? -20 : 20, 0]
  );

  const isNegative = type === 'negative';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: isNegative
          ? 'rgba(239, 68, 68, 0.08)'
          : 'rgba(16, 185, 129, 0.08)',
        borderRadius: 10,
        marginBottom: 8,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <span
        style={{
          fontSize: 18,
          color: isNegative ? BLANKLOGO_COLORS.error : BLANKLOGO_COLORS.success,
          flexShrink: 0,
        }}
      >
        {isNegative ? '✗' : '✓'}
      </span>
      <span
        style={{
          fontSize: 17,
          color: isNegative ? BLANKLOGO_COLORS.lightGray : BLANKLOGO_COLORS.white,
          fontFamily: BLANKLOGO_FONTS.body,
          fontWeight: BLANKLOGO_FONTS.weights.medium,
          textDecoration: isNegative ? 'line-through' : 'none',
          opacity: isNegative ? 0.8 : 1,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// Comparison Column
const ComparisonColumn: React.FC<{
  title: string;
  items: string[];
  type: 'negative' | 'positive';
  baseDelay: number;
}> = ({ title, items, type, baseDelay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleFade = spring({
    frame: frame - baseDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const titleOpacity = interpolate(titleFade, [0, 1], [0, 1]);

  const isNegative = type === 'negative';

  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255, 255, 255, 0.02)',
        border: `2px solid ${isNegative ? BLANKLOGO_COLORS.error : BLANKLOGO_COLORS.success}`,
        borderRadius: 20,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          top: -50,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 150,
          height: 150,
          background: `radial-gradient(circle, ${
            isNegative ? BLANKLOGO_COLORS.error : BLANKLOGO_COLORS.success
          }15 0%, transparent 70%)`,
          filter: 'blur(30px)',
        }}
      />

      {/* Title */}
      <h3
        style={{
          fontSize: 24,
          fontWeight: BLANKLOGO_FONTS.weights.bold,
          color: isNegative ? BLANKLOGO_COLORS.error : BLANKLOGO_COLORS.success,
          fontFamily: BLANKLOGO_FONTS.heading,
          margin: 0,
          marginBottom: 20,
          textAlign: 'center',
          opacity: titleOpacity,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {title}
      </h3>

      {/* Items */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {items.map((item, index) => (
          <ComparisonItem
            key={index}
            text={item}
            type={type}
            delay={baseDelay + 10 + index * 8}
          />
        ))}
      </div>
    </div>
  );
};

export const ComparisonCard: React.FC<ComparisonCardProps> = (inputProps) => {
  const props = { ...comparisonCardDefaultProps, ...inputProps };
  const {
    headline,
    subheadline,
    ctaText,
    leftTitle,
    leftItems,
    rightTitle,
    rightItems,
    theme,
    showLogo,
    layout,
  } = props;

  const frame = useCurrentFrame();

  // Header animation
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const headerY = interpolate(frame, [0, 15], [20, 0], {
    extrapolateRight: 'clamp',
  });

  // CTA animation
  const ctaOpacity = interpolate(frame, [85, 100], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const background =
    theme === 'gradient'
      ? BLANKLOGO_COLORS.gradientCard
      : BLANKLOGO_COLORS.gradientDark;

  const isStacked = layout === 'stacked';

  return (
    <AbsoluteFill
      style={{
        background,
        fontFamily: BLANKLOGO_FONTS.heading,
      }}
    >
      {/* Grid pattern */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Logo */}
      {showLogo && (
        <div style={{ position: 'absolute', top: 40, left: 40, zIndex: 10 }}>
          <BlankLogoLogo />
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 40,
          paddingTop: 100,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 32,
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: BLANKLOGO_FONTS.weights.extrabold,
              color: BLANKLOGO_COLORS.white,
              margin: 0,
              marginBottom: 12,
              lineHeight: 1.1,
            }}
          >
            {headline}
          </h1>
          {subheadline && (
            <p
              style={{
                fontSize: 20,
                fontWeight: BLANKLOGO_FONTS.weights.medium,
                color: BLANKLOGO_COLORS.lightGray,
                margin: 0,
              }}
            >
              {subheadline}
            </p>
          )}
        </div>

        {/* Comparison columns */}
        <div
          style={{
            display: 'flex',
            flexDirection: isStacked ? 'column' : 'row',
            gap: 24,
            width: '100%',
            maxWidth: isStacked ? 500 : 900,
          }}
        >
          <ComparisonColumn
            title={leftTitle || 'Typical Tools'}
            items={leftItems || []}
            type="negative"
            baseDelay={15}
          />
          <ComparisonColumn
            title={rightTitle || 'BlankLogo'}
            items={rightItems || []}
            type="positive"
            baseDelay={25}
          />
        </div>

        {/* CTA */}
        {ctaText && (
          <div style={{ marginTop: 32, opacity: ctaOpacity }}>
            <CTAButton text={ctaText} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default ComparisonCard;
