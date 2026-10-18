import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, slideIn, pulseGlow } from '../animations';

// Research-backed: Hook → Problem → Solution → Validation is #1 UGC pattern
export interface ProblemSolutionContent {
  type: 'problem_solution';
  problem: string;
  solution: string;
  problem_label?: string;   // default "THE PROBLEM"
  solution_label?: string;  // default "THE SOLUTION"
  // Optional: show side-by-side (landscape) or stacked sequential (vertical)
  layout?: 'sequential' | 'split';
  // For sequential: hold problem for this % of duration, then switch
  problem_hold_percent?: number;
}

export interface ProblemSolutionSceneProps {
  content: ProblemSolutionContent;
  style: StyleConfig;
}

export const ProblemSolutionScene: React.FC<ProblemSolutionSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const layout = content.layout ?? (isVertical ? 'sequential' : 'split');
  const problemHoldPercent = content.problem_hold_percent ?? 0.5;
  const switchFrame = Math.floor(durationInFrames * problemHoldPercent);
  const BAD_COLOR = '#ef4444';
  const GOOD_COLOR = '#22c55e';
  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const textSize = isVertical ? 52 : 40;
  const labelSize = isVertical ? 26 : 22;

  const glow = pulseGlow(frame, { color: GOOD_COLOR, cycleDuration: 40 });

  const renderLabel = (text: string, color: string) => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: `${color}18`,
        border: `1.5px solid ${color}50`,
        borderRadius: 8,
        padding: '6px 18px',
        marginBottom: 20,
      }}
    >
      <span
        style={{
          fontFamily: getFontFamily(style.font_body),
          fontSize: labelSize,
          fontWeight: 700,
          color,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {text}
      </span>
    </div>
  );

  if (layout === 'split') {
    // Both panels visible simultaneously — side by side
    const leftAnim = slideIn(frame, { durationInFrames: 20, delay: 0, direction: 'left', distance: 80 });
    const rightAnim = slideIn(frame, { durationInFrames: 20, delay: 8, direction: 'right', distance: 80 });

    return (
      <AbsoluteFill>
        <BackgroundGradient colors={bgColors}>
          <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
            {/* Problem side */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '60px 50px 60px 70px',
                opacity: leftAnim.opacity,
                transform: `translateX(${leftAnim.x}px)`,
                borderRight: `2px solid ${style.accent_color}30`,
              }}
            >
              {renderLabel(content.problem_label ?? 'THE PROBLEM', BAD_COLOR)}
              <p
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: textSize,
                  fontWeight: 700,
                  color: style.secondary_color,
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {content.problem}
              </p>
            </div>

            {/* Solution side */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '60px 70px 60px 50px',
                opacity: rightAnim.opacity,
                transform: `translateX(${rightAnim.x}px)`,
              }}
            >
              {renderLabel(content.solution_label ?? 'THE SOLUTION', GOOD_COLOR)}
              <p
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: textSize,
                  fontWeight: 700,
                  color: style.primary_color,
                  margin: 0,
                  lineHeight: 1.3,
                  textShadow: `0 0 20px ${GOOD_COLOR}30`,
                }}
              >
                {content.solution}
              </p>
            </div>
          </AbsoluteFill>
        </BackgroundGradient>
      </AbsoluteFill>
    );
  }

  // Sequential mode — problem then solution
  const isProblemPhase = frame < switchFrame;
  const transitionProgress = interpolate(frame, [switchFrame - 4, switchFrame + 4], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const problemOpacity = isProblemPhase
    ? fadeIn(frame, { durationInFrames: 14, delay: 0 })
    : interpolate(frame, [switchFrame - 4, switchFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const problemScale = isProblemPhase
    ? interpolate(frame, [0, 10], [0.95, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [switchFrame - 4, switchFrame], [1, 0.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const solutionDelay = switchFrame + 6;
  const solutionScale = interpolate(frame, [solutionDelay, solutionDelay + 10, solutionDelay + 14], [1.3, 0.95, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2)),
  });
  const solutionOpacity = interpolate(frame, [solutionDelay, solutionDelay + 6], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        {/* Background color shift on transition */}
        <AbsoluteFill
          style={{
            backgroundColor: GOOD_COLOR,
            opacity: interpolate(transitionProgress, [0, 0.5, 1], [0, 0.08, 0], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            }),
          }}
        />

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
          {isProblemPhase ? (
            <div
              style={{
                opacity: problemOpacity,
                transform: `scale(${problemScale})`,
              }}
            >
              {renderLabel(content.problem_label ?? 'THE PROBLEM', BAD_COLOR)}
              <p
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: textSize,
                  fontWeight: 700,
                  color: style.secondary_color,
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {content.problem}
              </p>
            </div>
          ) : (
            <div
              style={{
                opacity: solutionOpacity,
                transform: `scale(${solutionScale})`,
              }}
            >
              {renderLabel(content.solution_label ?? 'THE SOLUTION', GOOD_COLOR)}
              <p
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: textSize,
                  fontWeight: 700,
                  color: style.primary_color,
                  margin: 0,
                  lineHeight: 1.3,
                  textShadow: glow.textShadow,
                }}
              >
                {content.solution}
              </p>
            </div>
          )}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default ProblemSolutionScene;
