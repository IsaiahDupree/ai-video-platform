/**
 * Enhanced Intro Scene with Animations and Effects
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, Img } from 'remotion';
import { entranceAnimations, applyAnimation, EASINGS } from '../animations/presets';
import {
  FloatingParticles,
  GlowOrb,
  VignetteOverlay,
  GradientText,
  NeonGlow,
} from '../components/effects';

interface EnhancedIntroProps {
  title: string;
  subtitle?: string;
  hookText?: string;
  style: {
    theme: string;
    primary_color: string;
    accent_color: string;
    background_type: string;
    background_value: string;
  };
  animation?: 'cinematic' | 'energetic' | 'minimal' | 'glitch' | 'neon';
  showParticles?: boolean;
  iconUrl?: string;
}

export const EnhancedIntro: React.FC<EnhancedIntroProps> = ({
  title,
  subtitle,
  hookText,
  style,
  animation = 'energetic',
  showParticles = true,
  iconUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation timings
  const titleDelay = 10;
  const subtitleDelay = 25;
  const hookDelay = 40;
  const iconDelay = 5;

  // Get animation based on type
  const getEntrance = (delay: number) => {
    switch (animation) {
      case 'cinematic':
        return entranceAnimations.zoomIn(frame, delay, 30);
      case 'energetic':
        return entranceAnimations.bounceIn(frame, delay, fps);
      case 'minimal':
        return entranceAnimations.fadeIn(frame, delay, 25);
      case 'glitch':
        return entranceAnimations.glitchIn(frame, delay, 20);
      case 'neon':
        return entranceAnimations.popIn(frame, delay, fps);
      default:
        return entranceAnimations.slideUp(frame, delay, 20);
    }
  };

  // Background
  const backgroundStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: style.background_type === 'gradient' 
      ? style.background_value 
      : style.background_value,
  };

  // Title animation
  const titleAnim = getEntrance(titleDelay);
  const titleStyle = applyAnimation(titleAnim);

  // Subtitle animation
  const subtitleAnim = getEntrance(subtitleDelay);
  const subtitleStyle = applyAnimation(subtitleAnim);

  // Hook animation
  const hookAnim = getEntrance(hookDelay);
  const hookStyle = applyAnimation(hookAnim);

  // Icon animation
  const iconAnim = entranceAnimations.popIn(frame, iconDelay, fps);
  const iconStyle = applyAnimation(iconAnim);

  // Neon wrapper for neon style
  const TextWrapper = animation === 'neon' ? NeonGlow : React.Fragment;
  const textWrapperProps = animation === 'neon' ? { color: style.accent_color } : {};

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      {/* Background */}
      <div style={backgroundStyle} />

      {/* Effects Layer */}
      {showParticles && (
        <FloatingParticles
          count={30}
          color={style.accent_color}
          size={6}
          speed={0.5}
          direction="up"
        />
      )}

      {/* Glow orbs */}
      <GlowOrb
        color={style.accent_color}
        intensity={0.8}
        size={400}
        position={{ x: 20, y: 30 }}
        pulse
      />
      <GlowOrb
        color={style.primary_color}
        intensity={0.5}
        size={300}
        position={{ x: 80, y: 70 }}
        pulse
      />

      {/* Vignette */}
      <VignetteOverlay opacity={0.6} />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Icon */}
        {iconUrl && (
          <div style={{ ...iconStyle, marginBottom: 40 }}>
            <Img
              src={iconUrl}
              style={{
                width: 120,
                height: 120,
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Title */}
        <div style={titleStyle}>
          <TextWrapper {...textWrapperProps}>
            <h1
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 72,
                fontWeight: 800,
                color: style.primary_color,
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.1,
                textTransform: 'uppercase',
                letterSpacing: '-2px',
              }}
            >
              {animation === 'neon' ? (
                <GradientText colors={[style.accent_color, style.primary_color]}>
                  {title}
                </GradientText>
              ) : (
                title
              )}
            </h1>
          </TextWrapper>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div style={{ ...subtitleStyle, marginTop: 20 }}>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 36,
                fontWeight: 500,
                color: `${style.primary_color}cc`,
                textAlign: 'center',
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          </div>
        )}

        {/* Hook text */}
        {hookText && (
          <div style={{ ...hookStyle, marginTop: 40 }}>
            <div
              style={{
                padding: '16px 32px',
                backgroundColor: `${style.accent_color}20`,
                borderRadius: 12,
                border: `2px solid ${style.accent_color}40`,
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 24,
                  fontWeight: 600,
                  color: style.accent_color,
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                {hookText}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedIntro;
