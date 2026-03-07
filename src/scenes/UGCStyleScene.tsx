import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, slideIn } from '../animations';

// Research-backed: UGC-style content converts 3-5x better than polished ads
// Raw, authentic feel — overlaid text on "captured" content
export interface UGCStyleContent {
  type: 'ugc_style';
  caption: string;
  subtext?: string;
  platform?: 'tiktok' | 'instagram' | 'youtube';
  overlay_style?: 'raw' | 'clean' | 'branded';
  emoji?: string;
}

export interface UGCStyleSceneProps {
  content: UGCStyleContent;
  style: StyleConfig;
}

export const UGCStyleScene: React.FC<UGCStyleSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const platform = content.platform ?? 'tiktok';
  const overlayStyle = content.overlay_style ?? 'raw';

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  // Platform color accents
  const PLATFORM_COLORS: Record<string, string> = {
    tiktok: '#fe2c55',
    instagram: '#e1306c',
    youtube: '#ff0000',
  };
  const platformColor = PLATFORM_COLORS[platform] ?? style.accent_color;

  // UGC: slightly imperfect scaling — feels hand-held
  const handHeldWobble = interpolate(
    frame,
    [0, 20, 45, 70, 100],
    [0, 0.8, -0.5, 0.3, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Caption text animation — staggered word-by-word feel
  const captionOpacity = fadeIn(frame, { durationInFrames: 12, delay: 4 });
  const captionY = interpolate(frame, [4, 16], [20, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const subtextOpacity = fadeIn(frame, { durationInFrames: 12, delay: 18 });

  const fontSize = isVertical ? 54 : 44;
  const subtextSize = isVertical ? 32 : 26;

  // Raw style: thicker stroke, looser feel. Clean: tight, centered.
  const isRaw = overlayStyle === 'raw';
  const textStroke = isRaw ? `3px ${style.background_value}` : 'none';

  // Emoji bounce
  const emojiScale = interpolate(frame, [0, 8, 14], [0, 1.3, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(3)),
  });
  const emojiOpacity = fadeIn(frame, { durationInFrames: 8, delay: 0 });

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        {/* Slight vignette overlay for UGC feel */}
        {isRaw && (
          <AbsoluteFill
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}

        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: isVertical ? 'flex-end' : 'center',
            padding: isVertical ? '60px 40px 100px' : '60px 80px',
            textAlign: 'center',
            transform: isRaw ? `rotate(${handHeldWobble * 0.15}deg)` : 'none',
          }}
        >
          {/* Emoji */}
          {content.emoji && (
            <div
              style={{
                opacity: emojiOpacity,
                transform: `scale(${emojiScale})`,
                fontSize: isVertical ? 80 : 64,
                marginBottom: 20,
                lineHeight: 1,
              }}
            >
              {content.emoji}
            </div>
          )}

          {/* Main caption */}
          <div
            style={{
              opacity: captionOpacity,
              transform: `translateY(${captionY}px)`,
              marginBottom: content.subtext ? 16 : 0,
            }}
          >
            <p
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize,
                fontWeight: 900,
                color: style.primary_color,
                margin: 0,
                lineHeight: 1.15,
                WebkitTextStroke: textStroke,
                textShadow: isRaw
                  ? `2px 2px 8px rgba(0,0,0,0.8), -1px -1px 4px rgba(0,0,0,0.6)`
                  : `0 2px 20px rgba(0,0,0,0.4)`,
                letterSpacing: isRaw ? '-0.01em' : '0',
              }}
            >
              {content.caption}
            </p>
          </div>

          {/* Subtext */}
          {content.subtext && (
            <div style={{ opacity: subtextOpacity }}>
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: subtextSize,
                  fontWeight: 500,
                  color: style.secondary_color,
                  margin: 0,
                  lineHeight: 1.4,
                  textShadow: isRaw ? '1px 1px 4px rgba(0,0,0,0.8)' : 'none',
                }}
              >
                {content.subtext}
              </p>
            </div>
          )}

          {/* Platform indicator dot (raw style only) */}
          {isRaw && (
            <div
              style={{
                marginTop: 24,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: platformColor,
                opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                boxShadow: `0 0 10px ${platformColor}80`,
              }}
            />
          )}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default UGCStyleScene;
