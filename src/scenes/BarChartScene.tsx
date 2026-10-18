import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn } from '../animations';

export interface BarChartBar {
  label: string;
  value: number;     // raw value
  color?: string;    // override color
  highlighted?: boolean;
}

export interface BarChartContent {
  type: 'bar_chart';
  title?: string;
  bars: BarChartBar[];
  unit?: string;     // e.g. "%", "x", "$K"
  max_value?: number; // override calculated max
  orientation?: 'vertical' | 'horizontal';
  show_values?: boolean;
}

export interface BarChartSceneProps {
  content: BarChartContent;
  style: StyleConfig;
}

export const BarChartScene: React.FC<BarChartSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const orientation = content.orientation ?? 'vertical';
  const showValues = content.show_values !== false;
  const maxValue = content.max_value ?? Math.max(...content.bars.map(b => b.value)) * 1.15;

  const titleOpacity = fadeIn(frame, { durationInFrames: 16, delay: 0 });

  // Bars grow in after title (delay 15 frames), staggered
  const BAR_STAGGER = 8;
  const BAR_GROW_DURATION = 35;

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const labelFontSize = isVertical ? 24 : 20;
  const valueFontSize = isVertical ? 28 : 22;
  const titleFontSize = isVertical ? 48 : 38;

  // Color palette per bar
  const barColors = [
    style.accent_color,
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  ];

  const renderVertical = () => {
    const barWidth = Math.min(120, Math.floor((width - 160) / content.bars.length) - 20);
    const maxBarHeight = isVertical ? height * 0.45 : height * 0.5;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: isVertical ? 16 : 20,
          height: maxBarHeight + 60,
        }}
      >
        {content.bars.map((bar, i) => {
          const barDelay = 15 + i * BAR_STAGGER;
          const barProgress = interpolate(frame, [barDelay, barDelay + BAR_GROW_DURATION], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          const barH = (bar.value / maxValue) * maxBarHeight * barProgress;
          const barColor = bar.color ?? (bar.highlighted ? style.accent_color : barColors[i % barColors.length]);
          const labelOpacity = fadeIn(frame, { durationInFrames: 12, delay: barDelay + BAR_GROW_DURATION - 5 });
          const valueOpacity = fadeIn(frame, { durationInFrames: 10, delay: barDelay + BAR_GROW_DURATION });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {/* Value label on top */}
              {showValues && (
                <span
                  style={{
                    opacity: valueOpacity,
                    fontFamily: getFontFamily(style.font_heading),
                    fontSize: valueFontSize,
                    fontWeight: 700,
                    color: barColor,
                  }}
                >
                  {bar.value}{content.unit ?? ''}
                </span>
              )}

              {/* Bar */}
              <div
                style={{
                  width: barWidth,
                  height: barH,
                  backgroundColor: barColor,
                  borderRadius: '6px 6px 0 0',
                  boxShadow: bar.highlighted ? `0 0 20px ${barColor}60` : undefined,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Shine overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '30%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                    borderRadius: '6px 6px 0 0',
                  }}
                />
              </div>

              {/* Bottom label */}
              <span
                style={{
                  opacity: labelOpacity,
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: labelFontSize,
                  fontWeight: 500,
                  color: style.secondary_color,
                  textAlign: 'center',
                  maxWidth: barWidth + 20,
                }}
              >
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHorizontal = () => {
    const maxBarWidth = isVertical ? width * 0.65 : width * 0.55;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isVertical ? 20 : 16,
        }}
      >
        {content.bars.map((bar, i) => {
          const barDelay = 15 + i * BAR_STAGGER;
          const barProgress = interpolate(frame, [barDelay, barDelay + BAR_GROW_DURATION], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          const barW = (bar.value / maxValue) * maxBarWidth * barProgress;
          const barColor = bar.color ?? (bar.highlighted ? style.accent_color : barColors[i % barColors.length]);
          const labelOpacity = fadeIn(frame, { durationInFrames: 12, delay: barDelay });
          const valueOpacity = fadeIn(frame, { durationInFrames: 10, delay: barDelay + BAR_GROW_DURATION });

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Label */}
              <div style={{ opacity: labelOpacity, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: getFontFamily(style.font_body),
                    fontSize: labelFontSize + 2,
                    fontWeight: 500,
                    color: bar.highlighted ? style.primary_color : style.secondary_color,
                  }}
                >
                  {bar.label}
                </span>
                {showValues && (
                  <span
                    style={{
                      opacity: valueOpacity,
                      fontFamily: getFontFamily(style.font_heading),
                      fontSize: valueFontSize,
                      fontWeight: 700,
                      color: barColor,
                    }}
                  >
                    {bar.value}{content.unit ?? ''}
                  </span>
                )}
              </div>

              {/* Bar track + fill */}
              <div
                style={{
                  height: isVertical ? 28 : 22,
                  backgroundColor: `${barColor}20`,
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: barW,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: 6,
                    boxShadow: bar.highlighted ? `0 0 15px ${barColor}60` : undefined,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, height: '40%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isVertical ? '50px 44px' : '60px 80px',
          }}
        >
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
            </div>
          )}

          {orientation === 'horizontal' ? renderHorizontal() : renderVertical()}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default BarChartScene;
