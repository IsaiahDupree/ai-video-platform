import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import {
  EVERREACH_COLORS,
  EVERREACH_FONTS,
  AwarenessLevel,
  BeliefCluster,
  COPY_BANK,
} from './config';

// =============================================================================
// Types
// =============================================================================

export interface EverReachAdProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  
  // Awareness & Belief (for tracking)
  awareness?: AwarenessLevel;
  belief?: BeliefCluster;
  
  // Visual
  theme?: 'gradient' | 'dark' | 'light' | 'warm' | 'custom';
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  
  // Background Image
  backgroundImageSrc?: string;
  backgroundOverlay?: boolean;
  backgroundOverlayOpacity?: number;
  
  // Logo
  logoSrc?: string;
  logoPosition?: 'top-left' | 'top-center' | 'top-right' | 'bottom-center' | 'none';
  
  // CTA
  ctaStyle?: 'pill' | 'rectangle' | 'text' | 'none';
  
  // Layout
  layout?: 'centered' | 'top' | 'bottom' | 'split';
  
  // Typography
  headlineSize?: number;
  subheadlineSize?: number;
}

// =============================================================================
// Default Props
// =============================================================================

export const everReachAdDefaultProps: EverReachAdProps = {
  headline: 'Never let a relationship go cold',
  subheadline: 'Pick one person. Get a message. Send in 60 seconds.',
  ctaText: 'Start with 1 person',
  awareness: 'problem_aware',
  belief: 'too_busy',
  theme: 'gradient',
  logoPosition: 'top-left',
  ctaStyle: 'pill',
  layout: 'centered',
  backgroundOverlay: true,
  backgroundOverlayOpacity: 0.6,
};

// =============================================================================
// Helper Functions
// =============================================================================

const getBackgroundStyle = (props: EverReachAdProps): React.CSSProperties => {
  const { theme, primaryColor, secondaryColor, backgroundColor } = props;
  
  switch (theme) {
    case 'gradient':
      return {
        background: primaryColor && secondaryColor
          ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
          : EVERREACH_COLORS.gradientPrimary,
      };
    case 'dark':
      return { background: EVERREACH_COLORS.gradientDark };
    case 'light':
      return { background: EVERREACH_COLORS.white };
    case 'warm':
      return { background: EVERREACH_COLORS.gradientWarm };
    case 'custom':
      return { background: backgroundColor || EVERREACH_COLORS.dark };
    default:
      return { background: EVERREACH_COLORS.gradientPrimary };
  }
};

const getTextColor = (props: EverReachAdProps): string => {
  if (props.textColor) return props.textColor;
  return props.theme === 'light' ? EVERREACH_COLORS.dark : EVERREACH_COLORS.white;
};

// =============================================================================
// Sub-Components
// =============================================================================

const Logo: React.FC<{ src?: string; position: string }> = ({ src, position }) => {
  if (position === 'none' || !src) return null;
  
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 40, left: 40 },
    'top-center': { top: 40, left: '50%', transform: 'translateX(-50%)' },
    'top-right': { top: 40, right: 40 },
    'bottom-center': { bottom: 40, left: '50%', transform: 'translateX(-50%)' },
  };
  
  return (
    <div style={{ position: 'absolute', ...positionStyles[position] }}>
      <Img src={src} style={{ height: 40, objectFit: 'contain' }} />
    </div>
  );
};

const CTAButton: React.FC<{
  text: string;
  style: 'pill' | 'rectangle' | 'text' | 'none';
  accentColor?: string;
}> = ({ text, style, accentColor = EVERREACH_COLORS.accent }) => {
  if (style === 'none') return null;
  
  const baseStyle: React.CSSProperties = {
    fontFamily: EVERREACH_FONTS.heading,
    fontWeight: EVERREACH_FONTS.weights.bold,
    fontSize: 18,
    cursor: 'pointer',
  };
  
  const styles: Record<string, React.CSSProperties> = {
    pill: {
      ...baseStyle,
      backgroundColor: accentColor,
      color: EVERREACH_COLORS.dark,
      padding: '14px 32px',
      borderRadius: 50,
    },
    rectangle: {
      ...baseStyle,
      backgroundColor: accentColor,
      color: EVERREACH_COLORS.dark,
      padding: '14px 32px',
      borderRadius: 8,
    },
    text: {
      ...baseStyle,
      color: accentColor,
      textDecoration: 'underline',
    },
  };
  
  return <div style={styles[style]}>{text}</div>;
};

// =============================================================================
// Main EverReach Ad Component
// =============================================================================

export const EverReachAd: React.FC<EverReachAdProps> = (inputProps) => {
  const props = { ...everReachAdDefaultProps, ...inputProps };
  const {
    headline,
    subheadline,
    ctaText,
    backgroundImageSrc,
    backgroundOverlay,
    backgroundOverlayOpacity,
    logoSrc,
    logoPosition,
    ctaStyle,
    layout,
    headlineSize,
    subheadlineSize,
    accentColor,
  } = props;

  const textColor = getTextColor(props);
  const backgroundStyle = getBackgroundStyle(props);

  // Layout configurations
  const layoutStyles: Record<string, React.CSSProperties> = {
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    },
    top: {
      justifyContent: 'flex-start',
      alignItems: 'center',
      textAlign: 'center',
      paddingTop: 120,
    },
    bottom: {
      justifyContent: 'flex-end',
      alignItems: 'center',
      textAlign: 'center',
      paddingBottom: 120,
    },
    split: {
      justifyContent: 'space-between',
      alignItems: 'center',
      textAlign: 'center',
      paddingTop: 100,
      paddingBottom: 100,
    },
  };

  return (
    <AbsoluteFill
      style={{
        ...backgroundStyle,
        display: 'flex',
        flexDirection: 'column',
        padding: 40,
        ...layoutStyles[layout || 'centered'],
      }}
    >
      {/* Background Image */}
      {backgroundImageSrc && (
        <>
          <Img
            src={backgroundImageSrc}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          />
          {backgroundOverlay && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `rgba(0,0,0,${backgroundOverlayOpacity || 0.6})`,
                zIndex: 1,
              }}
            />
          )}
        </>
      )}

      {/* Logo */}
      <Logo src={logoSrc} position={logoPosition || 'none'} />

      {/* Content */}
      <div style={{ zIndex: 2, maxWidth: '90%' }}>
        {/* Headline */}
        <h1
          style={{
            fontSize: headlineSize || 56,
            fontWeight: EVERREACH_FONTS.weights.extrabold,
            color: textColor,
            fontFamily: EVERREACH_FONTS.heading,
            margin: 0,
            marginBottom: subheadline ? 16 : 32,
            lineHeight: 1.1,
            textShadow: backgroundImageSrc ? '0 2px 20px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          {headline}
        </h1>

        {/* Subheadline */}
        {subheadline && (
          <p
            style={{
              fontSize: subheadlineSize || 24,
              fontWeight: EVERREACH_FONTS.weights.medium,
              color: textColor,
              fontFamily: EVERREACH_FONTS.body,
              margin: 0,
              marginBottom: 32,
              opacity: 0.9,
              lineHeight: 1.4,
            }}
          >
            {subheadline}
          </p>
        )}

        {/* CTA */}
        {ctaText && ctaStyle !== 'none' && (
          <CTAButton
            text={ctaText}
            style={ctaStyle || 'pill'}
            accentColor={accentColor || EVERREACH_COLORS.accent}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// Specialized Templates
// =============================================================================

// Pain Point Ad - Problem statement with urgency
export const PainPointAd: React.FC<EverReachAdProps & {
  painStatement?: string;
  costStatement?: string;
}> = (props) => {
  const {
    painStatement = 'Your network is quietly getting weaker',
    costStatement = 'Every week you wait, opportunities fade',
    ctaText = 'Fix it in 60 seconds',
    ...rest
  } = props;

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
        textAlign: 'center',
      }}
    >
      {/* Pain Statement */}
      <h1
        style={{
          fontSize: 52,
          fontWeight: EVERREACH_FONTS.weights.extrabold,
          color: EVERREACH_COLORS.white,
          fontFamily: EVERREACH_FONTS.heading,
          margin: 0,
          marginBottom: 24,
          lineHeight: 1.1,
        }}
      >
        {painStatement}
      </h1>

      {/* Cost Statement */}
      <p
        style={{
          fontSize: 24,
          fontWeight: EVERREACH_FONTS.weights.medium,
          color: EVERREACH_COLORS.error,
          fontFamily: EVERREACH_FONTS.body,
          margin: 0,
          marginBottom: 40,
        }}
      >
        {costStatement}
      </p>

      {/* CTA */}
      <CTAButton text={ctaText} style="pill" />
    </AbsoluteFill>
  );
};

// Listicle Ad - Numbered points
export const ListicleAd: React.FC<EverReachAdProps & {
  title?: string;
  items?: string[];
}> = (props) => {
  const {
    title = '5 reasons your follow-ups fail',
    items = [
      'No system to track who\'s fading',
      'Reminders don\'t tell you what to say',
      'CRMs are for logging, not action',
      'Memory isn\'t reliable',
      'Consistency beats intensity',
    ],
    ctaText = 'EverReach fixes all five',
    ...rest
  } = props;

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 50,
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: 42,
          fontWeight: EVERREACH_FONTS.weights.extrabold,
          color: EVERREACH_COLORS.white,
          fontFamily: EVERREACH_FONTS.heading,
          margin: 0,
          marginBottom: 32,
          textAlign: 'center',
        }}
      >
        {title}
      </h1>

      {/* Items */}
      <div style={{ marginBottom: 32 }}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16,
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: EVERREACH_FONTS.weights.bold,
                color: EVERREACH_COLORS.accent,
                fontFamily: EVERREACH_FONTS.heading,
                marginRight: 16,
                minWidth: 32,
              }}
            >
              {index + 1}.
            </span>
            <span
              style={{
                fontSize: 20,
                color: EVERREACH_COLORS.white,
                fontFamily: EVERREACH_FONTS.body,
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <CTAButton text={ctaText} style="pill" />
      </div>
    </AbsoluteFill>
  );
};

// Comparison Ad - Before/After or Us vs Them
export const ComparisonAd: React.FC<EverReachAdProps & {
  leftTitle?: string;
  leftItems?: string[];
  rightTitle?: string;
  rightItems?: string[];
}> = (props) => {
  const {
    leftTitle = 'Without EverReach',
    leftItems = ['Forget to follow up', 'Relationships fade', 'Miss opportunities'],
    rightTitle = 'With EverReach',
    rightItems = ['Daily reminder who matters', 'Message ready to send', '60 seconds to stay warm'],
    ctaText = 'Try it free',
  } = props;

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
      }}
    >
      <div style={{ display: 'flex', gap: 24, width: '100%', marginBottom: 32 }}>
        {/* Left Column */}
        <div
          style={{
            flex: 1,
            background: 'rgba(239,68,68,0.2)',
            borderRadius: 16,
            padding: 24,
            border: `2px solid ${EVERREACH_COLORS.error}`,
          }}
        >
          <h3
            style={{
              fontSize: 24,
              fontWeight: EVERREACH_FONTS.weights.bold,
              color: EVERREACH_COLORS.error,
              fontFamily: EVERREACH_FONTS.heading,
              margin: 0,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {leftTitle}
          </h3>
          {leftItems.map((item, i) => (
            <div
              key={i}
              style={{
                fontSize: 18,
                color: EVERREACH_COLORS.white,
                fontFamily: EVERREACH_FONTS.body,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ marginRight: 8 }}>✗</span>
              {item}
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div
          style={{
            flex: 1,
            background: 'rgba(16,185,129,0.2)',
            borderRadius: 16,
            padding: 24,
            border: `2px solid ${EVERREACH_COLORS.success}`,
          }}
        >
          <h3
            style={{
              fontSize: 24,
              fontWeight: EVERREACH_FONTS.weights.bold,
              color: EVERREACH_COLORS.success,
              fontFamily: EVERREACH_FONTS.heading,
              margin: 0,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {rightTitle}
          </h3>
          {rightItems.map((item, i) => (
            <div
              key={i}
              style={{
                fontSize: 18,
                color: EVERREACH_COLORS.white,
                fontFamily: EVERREACH_FONTS.body,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ marginRight: 8 }}>✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      <CTAButton text={ctaText} style="pill" />
    </AbsoluteFill>
  );
};

// Stat Ad - Big number with context
export const StatAd: React.FC<EverReachAdProps & {
  stat?: string;
  statLabel?: string;
  context?: string;
}> = (props) => {
  const {
    stat = '60',
    statLabel = 'seconds',
    context = 'to keep a relationship warm',
    ctaText = 'Start with 1 person',
  } = props;

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientPrimary,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
        textAlign: 'center',
      }}
    >
      {/* Big Stat */}
      <div
        style={{
          fontSize: 140,
          fontWeight: EVERREACH_FONTS.weights.black,
          color: EVERREACH_COLORS.white,
          fontFamily: EVERREACH_FONTS.heading,
          lineHeight: 1,
        }}
      >
        {stat}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: EVERREACH_FONTS.weights.bold,
          color: EVERREACH_COLORS.white,
          fontFamily: EVERREACH_FONTS.heading,
          marginBottom: 16,
        }}
      >
        {statLabel}
      </div>

      {/* Context */}
      <p
        style={{
          fontSize: 28,
          fontWeight: EVERREACH_FONTS.weights.medium,
          color: EVERREACH_COLORS.white,
          fontFamily: EVERREACH_FONTS.body,
          opacity: 0.9,
          marginBottom: 40,
        }}
      >
        {context}
      </p>

      <CTAButton text={ctaText} style="pill" accentColor={EVERREACH_COLORS.white} />
    </AbsoluteFill>
  );
};

// Question Ad - Hook question with answer hint
export const QuestionAd: React.FC<EverReachAdProps & {
  question?: string;
  answerHint?: string;
}> = (props) => {
  const {
    question = 'When did you last check in with your top 10 contacts?',
    answerHint = "If you can't remember, you need EverReach.",
    ctaText = 'See who\'s going cold',
  } = props;

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
        textAlign: 'center',
      }}
    >
      {/* Question */}
      <h1
        style={{
          fontSize: 48,
          fontWeight: EVERREACH_FONTS.weights.extrabold,
          color: EVERREACH_COLORS.white,
          fontFamily: EVERREACH_FONTS.heading,
          margin: 0,
          marginBottom: 24,
          lineHeight: 1.2,
        }}
      >
        {question}
      </h1>

      {/* Answer Hint */}
      <p
        style={{
          fontSize: 24,
          fontWeight: EVERREACH_FONTS.weights.medium,
          color: EVERREACH_COLORS.accent,
          fontFamily: EVERREACH_FONTS.body,
          marginBottom: 40,
        }}
      >
        {answerHint}
      </p>

      <CTAButton text={ctaText} style="pill" />
    </AbsoluteFill>
  );
};

// Objection Killer Ad - Handle objections quickly
export const ObjectionKillerAd: React.FC<EverReachAdProps & {
  objections?: Array<{ objection: string; counter: string }>;
}> = (props) => {
  const {
    objections = COPY_BANK.objectionCounters.slice(0, 5),
    ctaText = 'Try it free',
  } = props;

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      <h2
        style={{
          fontSize: 32,
          fontWeight: EVERREACH_FONTS.weights.bold,
          color: EVERREACH_COLORS.white,
          fontFamily: EVERREACH_FONTS.heading,
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        Still not sure?
      </h2>

      {objections.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            marginBottom: 8,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: EVERREACH_COLORS.lightGray,
              fontFamily: EVERREACH_FONTS.body,
              textDecoration: 'line-through',
            }}
          >
            "{item.objection}"
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: EVERREACH_FONTS.weights.semibold,
              color: EVERREACH_COLORS.success,
              fontFamily: EVERREACH_FONTS.body,
            }}
          >
            → {item.counter}
          </span>
        </div>
      ))}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <CTAButton text={ctaText} style="pill" />
      </div>
    </AbsoluteFill>
  );
};

export default EverReachAd;
