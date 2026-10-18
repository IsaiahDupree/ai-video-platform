import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';
import { BLANKLOGO_COLORS, BLANKLOGO_FONTS, THREE_STEPS } from './config';

// =============================================================================
// ThreeSteps - Animated 3-step flow: Upload → Remove → Download
// Cards slide in sequentially with smooth animations
// =============================================================================

export interface ThreeStepsProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  
  // Steps (can override defaults)
  steps?: Array<{
    step: number;
    title: string;
    description: string;
    icon: string;
  }>;
  
  // Styling
  theme?: 'dark' | 'gradient';
  showLogo?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export const threeStepsDefaultProps: ThreeStepsProps = {
  headline: 'Remove Watermarks in 3 Steps',
  subheadline: 'Creators use this when they need the clip today.',
  ctaText: 'Upload video',
  steps: [...THREE_STEPS],
  theme: 'dark',
  showLogo: true,
  layout: 'horizontal',
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

// Step Card Component
const StepCard: React.FC<{
  step: number;
  title: string;
  description: string;
  icon: string;
  delay: number;
  isVertical: boolean;
}> = ({ step, title, description, icon, delay, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const opacity = interpolate(slideIn, [0, 1], [0, 1]);
  const translateY = interpolate(slideIn, [0, 1], [40, 0]);
  const scale = interpolate(slideIn, [0, 1], [0.9, 1]);

  return (
    <div
      style={{
        flex: isVertical ? 'none' : 1,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: isVertical ? '24px 30px' : 30,
        display: 'flex',
        flexDirection: isVertical ? 'row' : 'column',
        alignItems: 'center',
        gap: isVertical ? 20 : 16,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
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
          width: 100,
          height: 100,
          background: `radial-gradient(circle, ${BLANKLOGO_COLORS.primary}30 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Step number badge */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: BLANKLOGO_COLORS.gradientPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: BLANKLOGO_FONTS.weights.bold,
          color: BLANKLOGO_COLORS.white,
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {step}
      </div>

      {/* Content */}
      <div
        style={{
          textAlign: isVertical ? 'left' : 'center',
          flex: isVertical ? 1 : 'none',
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: isVertical ? 32 : 40,
            marginBottom: isVertical ? 0 : 12,
            display: isVertical ? 'none' : 'block',
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: isVertical ? 22 : 24,
            fontWeight: BLANKLOGO_FONTS.weights.bold,
            color: BLANKLOGO_COLORS.white,
            margin: 0,
            marginBottom: 6,
            fontFamily: BLANKLOGO_FONTS.heading,
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: isVertical ? 15 : 16,
            color: BLANKLOGO_COLORS.lightGray,
            margin: 0,
            fontFamily: BLANKLOGO_FONTS.body,
          }}
        >
          {description}
        </p>
      </div>

      {/* Icon for vertical layout */}
      {isVertical && (
        <div
          style={{
            fontSize: 32,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
};

// Arrow connector
const Arrow: React.FC<{ delay: number; isVertical: boolean }> = ({ delay, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const opacity = interpolate(fadeIn, [0, 1], [0, 1]);

  return (
    <div
      style={{
        opacity,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isVertical ? '8px 0' : '0 8px',
      }}
    >
      <div
        style={{
          fontSize: 24,
          color: BLANKLOGO_COLORS.primary,
          transform: isVertical ? 'rotate(90deg)' : 'none',
        }}
      >
        →
      </div>
    </div>
  );
};

export const ThreeSteps: React.FC<ThreeStepsProps> = (inputProps) => {
  const props = { ...threeStepsDefaultProps, ...inputProps };
  const {
    headline,
    subheadline,
    ctaText,
    steps,
    theme,
    showLogo,
    layout,
  } = props;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = layout === 'vertical';

  // Header animation
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const headerY = interpolate(frame, [0, 15], [20, 0], {
    extrapolateRight: 'clamp',
  });

  // CTA animation
  const ctaOpacity = interpolate(frame, [75, 90], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const background =
    theme === 'gradient'
      ? BLANKLOGO_COLORS.gradientCard
      : BLANKLOGO_COLORS.gradientDark;

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

      {/* Floating orbs */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          top: '30%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BLANKLOGO_COLORS.primary}20 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '10%',
          bottom: '20%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BLANKLOGO_COLORS.accent}15 0%, transparent 70%)`,
          filter: 'blur(40px)',
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
            marginBottom: 40,
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
          }}
        >
          <h1
            style={{
              fontSize: 52,
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
                fontSize: 22,
                fontWeight: BLANKLOGO_FONTS.weights.medium,
                color: BLANKLOGO_COLORS.lightGray,
                margin: 0,
              }}
            >
              {subheadline}
            </p>
          )}
        </div>

        {/* Steps */}
        <div
          style={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            alignItems: 'center',
            gap: 0,
            width: '100%',
            maxWidth: isVertical ? 500 : 1000,
          }}
        >
          {steps?.map((step, index) => (
            <React.Fragment key={step.step}>
              <StepCard
                step={step.step}
                title={step.title}
                description={step.description}
                icon={step.icon}
                delay={20 + index * 15}
                isVertical={isVertical}
              />
              {index < steps.length - 1 && (
                <Arrow delay={30 + index * 15} isVertical={isVertical} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* CTA */}
        {ctaText && (
          <div style={{ marginTop: 40, opacity: ctaOpacity }}>
            <CTAButton text={ctaText} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default ThreeSteps;
