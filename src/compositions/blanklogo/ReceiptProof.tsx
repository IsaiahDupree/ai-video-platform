import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';
import { BLANKLOGO_COLORS, BLANKLOGO_FONTS, RECEIPT_ITEMS } from './config';

// =============================================================================
// ReceiptProof - Animated checklist proof of value
// Shows checkmarks animating in: Removed ✅ / Quality ✅ / Ad-Free ✅ / Done ✅
// =============================================================================

export interface ReceiptProofProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  
  // Receipt items
  items?: Array<{
    label: string;
    status: 'success' | 'pending' | 'error';
  }>;
  
  // Styling
  theme?: 'dark' | 'gradient';
  showLogo?: boolean;
  receiptStyle?: 'card' | 'minimal' | 'paper';
}

export const receiptProofDefaultProps: ReceiptProofProps = {
  headline: 'Premium Watermark Removal',
  subheadline: 'For people who need it to work the first time.',
  ctaText: 'Remove now',
  items: [...RECEIPT_ITEMS],
  theme: 'dark',
  showLogo: true,
  receiptStyle: 'card',
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

// Animated Checkmark
const AnimatedCheckmark: React.FC<{ delay: number; status: string }> = ({ delay, status }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  const scale = interpolate(checkProgress, [0, 0.5, 1], [0, 1.3, 1]);
  const opacity = interpolate(checkProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return BLANKLOGO_COLORS.success;
      case 'error':
        return BLANKLOGO_COLORS.error;
      default:
        return BLANKLOGO_COLORS.lightGray;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background:
          status === 'success'
            ? BLANKLOGO_COLORS.successBg
            : status === 'error'
            ? BLANKLOGO_COLORS.errorBg
            : 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 18,
          fontWeight: BLANKLOGO_FONTS.weights.bold,
          color: getStatusColor(),
        }}
      >
        {getStatusIcon()}
      </span>
    </div>
  );
};

// Receipt Item
const ReceiptItem: React.FC<{
  label: string;
  status: 'success' | 'pending' | 'error';
  delay: number;
  isLast: boolean;
}> = ({ label, status, delay, isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const opacity = interpolate(slideIn, [0, 1], [0, 1]);
  const translateX = interpolate(slideIn, [0, 1], [30, 0]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 0',
        borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <AnimatedCheckmark delay={delay + 5} status={status} />
      <span
        style={{
          fontSize: 18,
          fontWeight: BLANKLOGO_FONTS.weights.semibold,
          color: BLANKLOGO_COLORS.white,
          fontFamily: BLANKLOGO_FONTS.body,
          flex: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          color:
            status === 'success'
              ? BLANKLOGO_COLORS.success
              : status === 'error'
              ? BLANKLOGO_COLORS.error
              : BLANKLOGO_COLORS.lightGray,
          fontFamily: BLANKLOGO_FONTS.mono,
          fontWeight: BLANKLOGO_FONTS.weights.medium,
          textTransform: 'uppercase',
        }}
      >
        {status === 'success' ? 'Done' : status === 'error' ? 'Failed' : 'Pending'}
      </span>
    </div>
  );
};

// Receipt Card
const ReceiptCard: React.FC<{
  items: Array<{ label: string; status: 'success' | 'pending' | 'error' }>;
  style: 'card' | 'minimal' | 'paper';
}> = ({ items, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardFade = spring({
    frame: frame - 15,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const cardOpacity = interpolate(cardFade, [0, 1], [0, 1]);
  const cardScale = interpolate(cardFade, [0, 1], [0.95, 1]);

  const getCardStyle = (): React.CSSProperties => {
    switch (style) {
      case 'paper':
        return {
          background: '#fafafa',
          border: 'none',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        };
      case 'minimal':
        return {
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
        };
      default:
        return {
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        };
    }
  };

  const textColor = style === 'paper' ? BLANKLOGO_COLORS.dark : BLANKLOGO_COLORS.white;
  const subtextColor = style === 'paper' ? BLANKLOGO_COLORS.mediumGray : BLANKLOGO_COLORS.lightGray;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 450,
        borderRadius: 20,
        padding: 32,
        opacity: cardOpacity,
        transform: `scale(${cardScale})`,
        ...getCardStyle(),
      }}
    >
      {/* Receipt header */}
      <div
        style={{
          textAlign: 'center',
          paddingBottom: 20,
          marginBottom: 8,
          borderBottom: `1px solid ${
            style === 'paper' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)'
          }`,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: BLANKLOGO_FONTS.weights.semibold,
            color: BLANKLOGO_COLORS.primary,
            fontFamily: BLANKLOGO_FONTS.heading,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          BlankLogo
        </div>
        <div
          style={{
            fontSize: 13,
            color: subtextColor,
            fontFamily: BLANKLOGO_FONTS.mono,
          }}
        >
          Processing Summary
        </div>
      </div>

      {/* Items */}
      <div>
        {items.map((item, index) => (
          <ReceiptItem
            key={index}
            label={item.label}
            status={item.status}
            delay={25 + index * 12}
            isLast={index === items.length - 1}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 20,
          borderTop: `1px dashed ${
            style === 'paper' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)'
          }`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: BLANKLOGO_COLORS.success,
            }}
          >
            ✓
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: BLANKLOGO_FONTS.weights.bold,
              color: BLANKLOGO_COLORS.success,
              fontFamily: BLANKLOGO_FONTS.heading,
            }}
          >
            Ready to Download
          </span>
        </div>
      </div>
    </div>
  );
};

export const ReceiptProof: React.FC<ReceiptProofProps> = (inputProps) => {
  const props = { ...receiptProofDefaultProps, ...inputProps };
  const {
    headline,
    subheadline,
    ctaText,
    items,
    theme,
    showLogo,
    receiptStyle,
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
  const ctaOpacity = interpolate(frame, [90, 105], [0, 1], {
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
          bottom: '20%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BLANKLOGO_COLORS.success}15 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '10%',
          top: '30%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BLANKLOGO_COLORS.primary}15 0%, transparent 70%)`,
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

        {/* Receipt card */}
        <ReceiptCard
          items={items || []}
          style={receiptStyle || 'card'}
        />

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

export default ReceiptProof;
