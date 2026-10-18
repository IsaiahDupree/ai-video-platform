import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, pulseGlow } from '../animations';

// Research-backed: Curiosity gap is the #1 hook technique across all platforms
// "I can't believe..." / "Nobody talks about..." style setup → delayed reveal
// Drives 4-7x watch time vs direct-value openers
export interface CuriosityGapContent {
  type: 'curiosity_gap';
  setup: string;
  reveal: string;
  setup_label?: string;
  reveal_label?: string;
  hold_percent?: number;  // default 0.5
}

export interface CuriosityGapSceneProps {
  content: CuriosityGapContent;
  style: StyleConfig;
}

export const CuriosityGapScene: React.FC<CuriosityGapSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const holdPercent = content.hold_percent ?? 0.5;
  const switchFrame = Math.floor(durationInFrames * holdPercent);

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const REVEAL_COLOR = style.accent_color;
  const glow = pulseGlow(frame, { color: REVEAL_COLOR, cycleDuration: 30 });

  // Setup phase animations
  const setupOpacity = frame < switchFrame
    ? fadeIn(frame, { durationInFrames: 16, delay: 0 })
    : interpolate(frame, [switchFrame - 6, switchFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const setupScale = frame < switchFrame
    ? interpolate(frame, [0, 12], [0.92, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
    : interpolate(frame, [switchFrame - 6, switchFrame], [1, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Tension pulsing question mark at switch boundary
  const tensionOpacity = interpolate(
    frame,
    [Math.max(0, switchFrame - 20), switchFrame - 10, switchFrame],
    [0, 0.6, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const tensionScale = interpolate(
    frame,
    [Math.max(0, switchFrame - 20), switchFrame - 10],
    [0.5, 1.4],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) }
  );

  // Reveal phase animations
  const revealDelay = switchFrame + 4;
  const revealOpacity = interpolate(frame, [revealDelay, revealDelay + 10], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const revealScale = interpolate(frame, [revealDelay, revealDelay + 12, revealDelay + 18], [1.4, 0.95, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  });

  // Reveal label slide
  const labelSlide = interpolate(frame, [revealDelay, revealDelay + 10], [-30, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const isSetupPhase = frame < switchFrame;
  const fontSize = isVertical ? 58 : 46;
  const labelSize = isVertical ? 26 : 22;

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        {/* Color flash on reveal */}
        {frame >= switchFrame && frame <= switchFrame + 8 && (
          <AbsoluteFill
            style={{
              backgroundColor: REVEAL_COLOR,
              opacity: interpolate(
                frame,
                [switchFrame, switchFrame + 4, switchFrame + 8],
                [0, 0.12, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              ),
            }}
          />
        )}

        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isVertical ? 60 : 80,
            textAlign: 'center',
          }}
        >
          {isSetupPhase ? (
            <div style={{ opacity: setupOpacity, transform: `scale(${setupScale})` }}>
              {/* Setup label */}
              {content.setup_label && (
                <div
                  style={{
                    display: 'inline-block',
                    backgroundColor: `${style.secondary_color}15`,
                    border: `1.5px solid ${style.secondary_color}30`,
                    borderRadius: 8,
                    padding: '5px 16px',
                    marginBottom: 20,
                  }}
                >
                  <span
                    style={{
                      fontFamily: getFontFamily(style.font_body),
                      fontSize: labelSize,
                      fontWeight: 600,
                      color: style.secondary_color,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {content.setup_label}
                  </span>
                </div>
              )}
              <p
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize,
                  fontWeight: 800,
                  color: style.primary_color,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {content.setup}
              </p>

              {/* Tension indicator — animated dots */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'center',
                  marginTop: 24,
                  opacity: interpolate(frame, [10, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                }}
              >
                {[0, 1, 2].map((i) => {
                  const dotOpacity = interpolate(
                    frame % 24,
                    [i * 8, i * 8 + 4, i * 8 + 8],
                    [0.3, 1.0, 0.3],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  );
                  return (
                    <div
                      key={i}
                      style={{
                        width: isVertical ? 10 : 8,
                        height: isVertical ? 10 : 8,
                        borderRadius: '50%',
                        backgroundColor: style.secondary_color,
                        opacity: dotOpacity,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                opacity: revealOpacity,
                transform: `scale(${revealScale})`,
              }}
            >
              {/* Reveal label */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: `${REVEAL_COLOR}18`,
                  border: `1.5px solid ${REVEAL_COLOR}50`,
                  borderRadius: 8,
                  padding: '5px 16px',
                  marginBottom: 20,
                  transform: `translateY(${labelSlide}px)`,
                }}
              >
                <span
                  style={{
                    fontFamily: getFontFamily(style.font_body),
                    fontSize: labelSize,
                    fontWeight: 700,
                    color: REVEAL_COLOR,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {content.reveal_label ?? '→ HERE IT IS'}
                </span>
              </div>
              <p
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize,
                  fontWeight: 800,
                  color: style.primary_color,
                  margin: 0,
                  lineHeight: 1.2,
                  textShadow: glow.textShadow,
                }}
              >
                {content.reveal}
              </p>
            </div>
          )}
        </AbsoluteFill>

        {/* Tension "?" overlay just before switch */}
        {isSetupPhase && (
          <AbsoluteFill
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize: isVertical ? 200 : 160,
                fontWeight: 900,
                color: REVEAL_COLOR,
                opacity: tensionOpacity,
                transform: `scale(${tensionScale})`,
                lineHeight: 1,
              }}
            >
              ?
            </span>
          </AbsoluteFill>
        )}
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default CuriosityGapScene;
