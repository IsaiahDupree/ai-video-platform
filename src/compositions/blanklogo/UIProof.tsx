import React from 'react';
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';
import { BLANKLOGO_COLORS, BLANKLOGO_FONTS } from './config';

// =============================================================================
// UIProof - App screenshot with animated cursor and highlights
// Shows actual UI to build trust and demonstrate simplicity
// =============================================================================

export interface UIProofProps {
  // Content
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  
  // Screenshot
  screenshotSrc?: string;
  
  // Status display
  showStatus?: boolean;
  statusText?: string;
  statusProgress?: number; // 0-100
  
  // Highlight
  highlightArea?: 'download' | 'upload' | 'status' | 'none';
  
  // Styling
  theme?: 'dark' | 'gradient';
  showLogo?: boolean;
  showCursor?: boolean;
}

export const uiProofDefaultProps: UIProofProps = {
  headline: 'Simple: Upload → Remove → Download',
  subheadline: 'Clear progress. Clean output. Built like a real tool.',
  ctaText: 'Try it now',
  showStatus: true,
  statusText: 'Processing complete',
  statusProgress: 100,
  highlightArea: 'download',
  theme: 'dark',
  showLogo: true,
  showCursor: true,
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

// Animated Cursor
const AnimatedCursor: React.FC<{
  targetX: number;
  targetY: number;
  delay: number;
}> = ({ targetX, targetY, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const moveProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 30, stiffness: 80 },
  });

  const startX = targetX - 100;
  const startY = targetY - 100;

  const x = interpolate(moveProgress, [0, 1], [startX, targetX]);
  const y = interpolate(moveProgress, [0, 1], [startY, targetY]);

  const clickScale = interpolate(
    frame,
    [delay + 25, delay + 30, delay + 35],
    [1, 0.8, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${clickScale})`,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M5 3L19 12L12 13L9 20L5 3Z"
          fill={BLANKLOGO_COLORS.white}
          stroke={BLANKLOGO_COLORS.dark}
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};

// Mock UI Window
const MockUI: React.FC<{
  screenshotSrc?: string;
  showStatus: boolean;
  statusText: string;
  statusProgress: number;
  highlightArea: string;
}> = ({ screenshotSrc, showStatus, statusText, statusProgress, highlightArea }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Progress bar animation
  const progressAnim = spring({
    frame: frame - 20,
    fps,
    config: { damping: 30, stiffness: 50 },
  });
  const animatedProgress = interpolate(progressAnim, [0, 1], [0, statusProgress]);

  // Highlight pulse
  const pulse = Math.sin(frame * 0.15) * 0.3 + 0.7;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 600,
        background: 'rgba(20, 20, 30, 0.95)',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Window header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#ff5f57',
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#ffbd2e',
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#28c840',
          }}
        />
        <span
          style={{
            marginLeft: 12,
            fontSize: 13,
            color: BLANKLOGO_COLORS.lightGray,
            fontFamily: BLANKLOGO_FONTS.body,
          }}
        >
          blanklogo.app
        </span>
      </div>

      {/* Content area */}
      <div style={{ padding: 24 }}>
        {screenshotSrc ? (
          <Img
            src={screenshotSrc}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: 8,
            }}
          />
        ) : (
          <>
            {/* Mock upload area */}
            <div
              style={{
                border: `2px dashed ${
                  highlightArea === 'upload'
                    ? BLANKLOGO_COLORS.primary
                    : 'rgba(255, 255, 255, 0.2)'
                }`,
                borderRadius: 12,
                padding: 30,
                textAlign: 'center',
                marginBottom: 20,
                background:
                  highlightArea === 'upload'
                    ? `rgba(99, 91, 255, ${pulse * 0.1})`
                    : 'rgba(255, 255, 255, 0.02)',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
              <div
                style={{
                  fontSize: 14,
                  color: BLANKLOGO_COLORS.lightGray,
                  fontFamily: BLANKLOGO_FONTS.body,
                }}
              >
                video_file.mp4
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: BLANKLOGO_COLORS.mediumGray,
                  fontFamily: BLANKLOGO_FONTS.body,
                  marginTop: 4,
                }}
              >
                24.5 MB
              </div>
            </div>

            {/* Status section */}
            {showStatus && (
              <div
                style={{
                  background:
                    highlightArea === 'status'
                      ? `rgba(99, 91, 255, ${pulse * 0.15})`
                      : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 20,
                  border:
                    highlightArea === 'status'
                      ? `1px solid ${BLANKLOGO_COLORS.primary}`
                      : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: BLANKLOGO_FONTS.weights.semibold,
                      color: BLANKLOGO_COLORS.white,
                      fontFamily: BLANKLOGO_FONTS.body,
                    }}
                  >
                    {statusText}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color:
                        statusProgress >= 100
                          ? BLANKLOGO_COLORS.success
                          : BLANKLOGO_COLORS.primary,
                      fontFamily: BLANKLOGO_FONTS.mono,
                    }}
                  >
                    {Math.round(animatedProgress)}%
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: 6,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${animatedProgress}%`,
                      height: '100%',
                      background:
                        statusProgress >= 100
                          ? BLANKLOGO_COLORS.gradientSuccess
                          : BLANKLOGO_COLORS.gradientPrimary,
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Download button */}
            <div
              style={{
                background:
                  highlightArea === 'download'
                    ? BLANKLOGO_COLORS.gradientPrimary
                    : 'rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                padding: '14px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow:
                  highlightArea === 'download'
                    ? `0 0 30px ${BLANKLOGO_COLORS.primary}50`
                    : 'none',
                transform:
                  highlightArea === 'download' ? `scale(${0.98 + pulse * 0.04})` : 'scale(1)',
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: BLANKLOGO_FONTS.weights.bold,
                  color: BLANKLOGO_COLORS.white,
                  fontFamily: BLANKLOGO_FONTS.heading,
                }}
              >
                📥 Download Clean Video
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const UIProof: React.FC<UIProofProps> = (inputProps) => {
  const props = { ...uiProofDefaultProps, ...inputProps };
  const {
    headline,
    subheadline,
    ctaText,
    screenshotSrc,
    showStatus,
    statusText,
    statusProgress,
    highlightArea,
    theme,
    showLogo,
    showCursor,
  } = props;

  const frame = useCurrentFrame();

  // Header animation
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const headerY = interpolate(frame, [0, 15], [20, 0], {
    extrapolateRight: 'clamp',
  });

  // UI fade in
  const uiOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const uiScale = interpolate(frame, [10, 25], [0.95, 1], {
    extrapolateRight: 'clamp',
  });

  // CTA animation
  const ctaOpacity = interpolate(frame, [70, 85], [0, 1], {
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
          right: '10%',
          top: '20%',
          width: 200,
          height: 200,
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
              fontSize: 44,
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

        {/* Mock UI */}
        <div
          style={{
            opacity: uiOpacity,
            transform: `scale(${uiScale})`,
            position: 'relative',
          }}
        >
          <MockUI
            screenshotSrc={screenshotSrc}
            showStatus={showStatus || false}
            statusText={statusText || 'Processing'}
            statusProgress={statusProgress || 0}
            highlightArea={highlightArea || 'none'}
          />

          {/* Animated cursor */}
          {showCursor && highlightArea === 'download' && (
            <AnimatedCursor targetX={300} targetY={320} delay={45} />
          )}
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

export default UIProof;
