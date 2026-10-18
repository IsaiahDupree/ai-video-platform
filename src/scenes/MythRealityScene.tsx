import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, slideIn, glitchReveal } from '../animations';

export interface MythRealityContent {
  type: 'myth_reality';
  myth: string;
  reality: string;
  myth_label?: string;    // default "❌ MYTH"
  reality_label?: string; // default "✅ REALITY"
  // Timing: how long to show myth before revealing reality
  myth_hold_percent?: number; // 0-1, default 0.45
}

export interface MythRealitySceneProps {
  content: MythRealityContent;
  style: StyleConfig;
}

export const MythRealityScene: React.FC<MythRealitySceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const mythHoldPercent = content.myth_hold_percent ?? 0.45;
  const mythHoldFrame = Math.floor(durationInFrames * mythHoldPercent);
  const mythLabel = content.myth_label ?? '❌ MYTH';
  const realityLabel = content.reality_label ?? '✅ REALITY';

  // Phase 1: Myth comes in (stamp-in)
  const mythScale = interpolate(frame, [0, 10, 14], [1.4, 0.95, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2)),
  });
  const mythOpacity = interpolate(frame, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // Myth exits with glitch + strikethrough grows
  const mythExitOpacity = interpolate(frame, [mythHoldFrame - 8, mythHoldFrame], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const strikeWidth = interpolate(frame, [mythHoldFrame - 12, mythHoldFrame - 4], [0, 110], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Phase 2: Reality slams in
  const realityDelay = mythHoldFrame + 4;
  const realityScale = interpolate(frame, [realityDelay, realityDelay + 10, realityDelay + 14], [1.4, 0.95, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2)),
  });
  const realityOpacity = interpolate(frame, [realityDelay, realityDelay + 4], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const realityLabelOpacity = fadeIn(frame, { durationInFrames: 12, delay: realityDelay });

  // Glitch effect during transition
  const glitch = glitchReveal(frame - (mythHoldFrame - 6), 10, 0.8);

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const textSize = isVertical ? 56 : 44;
  const labelSize = isVertical ? 32 : 26;
  const BAD_COLOR = '#ef4444';
  const GOOD_COLOR = '#22c55e';

  const isMythPhase = frame < mythHoldFrame;

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        {/* Color flash on transition */}
        {frame >= mythHoldFrame - 2 && frame <= mythHoldFrame + 6 && (
          <AbsoluteFill
            style={{
              backgroundColor: '#ff0000',
              opacity: interpolate(frame, [mythHoldFrame - 2, mythHoldFrame, mythHoldFrame + 6], [0, 0.15, 0], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              }),
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
          {isMythPhase ? (
            // MYTH phase
            <div
              style={{
                opacity: mythOpacity * mythExitOpacity,
                transform: `scale(${mythScale}) ${glitch.transform}`,
                textShadow: glitch.textShadow,
              }}
            >
              {/* MYTH label */}
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: `${BAD_COLOR}20`,
                  border: `2px solid ${BAD_COLOR}60`,
                  borderRadius: 10,
                  padding: '8px 24px',
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    fontFamily: getFontFamily(style.font_body),
                    fontSize: labelSize,
                    fontWeight: 800,
                    color: BAD_COLOR,
                    letterSpacing: '0.1em',
                  }}
                >
                  {mythLabel}
                </span>
              </div>

              {/* Myth text */}
              <div style={{ position: 'relative' }}>
                <p
                  style={{
                    fontFamily: getFontFamily(style.font_heading),
                    fontSize: textSize,
                    fontWeight: 700,
                    color: style.primary_color,
                    margin: 0,
                    lineHeight: 1.2,
                    maxWidth: isVertical ? '90%' : 800,
                  }}
                >
                  {content.myth}
                </p>
                {/* Strikethrough line */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${strikeWidth}%`,
                    height: 4,
                    backgroundColor: BAD_COLOR,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ) : (
            // REALITY phase
            <div
              style={{
                opacity: realityOpacity,
                transform: `scale(${realityScale})`,
              }}
            >
              {/* REALITY label */}
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: `${GOOD_COLOR}20`,
                  border: `2px solid ${GOOD_COLOR}60`,
                  borderRadius: 10,
                  padding: '8px 24px',
                  marginBottom: 24,
                  opacity: realityLabelOpacity,
                }}
              >
                <span
                  style={{
                    fontFamily: getFontFamily(style.font_body),
                    fontSize: labelSize,
                    fontWeight: 800,
                    color: GOOD_COLOR,
                    letterSpacing: '0.1em',
                  }}
                >
                  {realityLabel}
                </span>
              </div>

              {/* Reality text */}
              <p
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: textSize,
                  fontWeight: 700,
                  color: style.primary_color,
                  margin: 0,
                  lineHeight: 1.2,
                  textShadow: `0 0 30px ${GOOD_COLOR}40`,
                  maxWidth: isVertical ? '90%' : 800,
                }}
              >
                {content.reality}
              </p>
            </div>
          )}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default MythRealityScene;
