import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, slideIn, stagger, pulseGlow } from '../animations';

export interface ChecklistContent {
  type: 'checklist';
  title?: string;
  items: Array<{
    text: string;
    checked?: boolean;  // if false, renders as ✗ (problem state)
    emoji?: string;
  }>;
  reveal_mode?: 'stagger' | 'sequential';  // stagger=all enter spaced, sequential=one at a time
  frames_per_item?: number;  // for sequential mode
}

export interface ChecklistSceneProps {
  content: ChecklistContent;
  style: StyleConfig;
}

export const ChecklistScene: React.FC<ChecklistSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const revealMode = content.reveal_mode ?? 'stagger';
  const framesPerItem = content.frames_per_item
    ?? Math.floor((durationInFrames - 20) / content.items.length);
  const STAGGER_FRAMES = 12;

  const titleOpacity = fadeIn(frame, { durationInFrames: 16, delay: 0 });

  // Determine visible items
  const visibleCount = revealMode === 'sequential'
    ? Math.floor((frame - 10) / framesPerItem) + 1
    : content.items.length;

  const glow = pulseGlow(frame, { color: '#22c55e', cycleDuration: 40, minBlur: 5, maxBlur: 20, minOpacity: 0.3, maxOpacity: 0.8 });

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const itemFontSize = isVertical
    ? (content.items.length > 5 ? 32 : 40)
    : (content.items.length > 5 ? 26 : 32);
  const titleFontSize = isVertical ? 52 : 40;
  const checkSize = isVertical ? 44 : 36;

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isVertical ? '60px 52px' : '60px 80px',
          }}
        >
          {/* Title */}
          {content.title && (
            <div style={{ opacity: titleOpacity, marginBottom: 36 }}>
              <h2
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: titleFontSize,
                  fontWeight: 800,
                  color: style.primary_color,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {content.title}
              </h2>
              <div
                style={{
                  width: interpolate(frame, [0, 20], [0, 80], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                  height: 3,
                  backgroundColor: style.accent_color,
                  marginTop: 10,
                  borderRadius: 2,
                }}
              />
            </div>
          )}

          {/* Checklist items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isVertical ? 20 : 16 }}>
            {content.items.map((item, i) => {
              const isVisible = i < visibleCount;
              if (!isVisible) return null;

              const itemDelay = revealMode === 'stagger'
                ? 10 + i * STAGGER_FRAMES
                : i === 0 ? 10 : 5; // sequential: appears quickly once its turn comes

              const frameOffset = revealMode === 'sequential'
                ? frame - (i * framesPerItem + 10)
                : frame;

              const anim = slideIn(frameOffset, {
                durationInFrames: 16,
                delay: revealMode === 'stagger' ? itemDelay : 2,
                direction: 'left',
                distance: 60,
              });

              const isChecked = item.checked !== false;
              const checkColor = isChecked ? '#22c55e' : '#ef4444';
              const checkSymbol = isChecked ? '✓' : '✗';

              // Checkmark pops in slightly after text
              const checkDelay = revealMode === 'stagger' ? itemDelay + 6 : 8;
              const checkScale = interpolate(
                revealMode === 'stagger' ? frame : frameOffset,
                [checkDelay, checkDelay + 8],
                [0, 1.2],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(3)) }
              );
              const checkScaleFinal = checkScale > 1.2
                ? interpolate(revealMode === 'stagger' ? frame : frameOffset, [checkDelay + 8, checkDelay + 12], [1.2, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
                : checkScale;

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    opacity: anim.opacity,
                    transform: `translateX(${anim.x}px)`,
                  }}
                >
                  {/* Check circle */}
                  <div
                    style={{
                      width: checkSize + 8,
                      height: checkSize + 8,
                      borderRadius: '50%',
                      backgroundColor: `${checkColor}20`,
                      border: `2px solid ${checkColor}60`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transform: `scale(${checkScaleFinal})`,
                      boxShadow: isChecked ? glow.boxShadow : undefined,
                    }}
                  >
                    <span
                      style={{
                        fontSize: checkSize * 0.6,
                        color: checkColor,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {checkSymbol}
                    </span>
                  </div>

                  {/* Item text */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    {item.emoji && (
                      <span style={{ fontSize: itemFontSize }}>{item.emoji}</span>
                    )}
                    <p
                      style={{
                        fontFamily: getFontFamily(style.font_body),
                        fontSize: itemFontSize,
                        fontWeight: isChecked ? 600 : 400,
                        color: isChecked ? style.primary_color : style.secondary_color,
                        margin: 0,
                        lineHeight: 1.3,
                        textDecoration: isChecked ? 'none' : 'none',
                      }}
                    >
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default ChecklistScene;
