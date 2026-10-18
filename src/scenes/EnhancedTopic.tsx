/**
 * Enhanced Topic Scene with Animations and Effects
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, Img } from 'remotion';
import { entranceAnimations, exitAnimations, loopAnimations, applyAnimation } from '../animations/presets';
import {
  FloatingParticles,
  GlowOrb,
  VignetteOverlay,
  AnimatedHighlight,
  DecorativeCircle,
  DecorativeLine,
  ProgressBar,
} from '../components/effects';

interface EnhancedTopicProps {
  heading: string;
  bodyText: string;
  number?: number;
  totalTopics?: number;
  style: {
    theme: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_type: string;
    background_value: string;
  };
  animation?: 'slide' | 'pop' | 'fade' | 'zoom';
  iconUrl?: string;
  showProgress?: boolean;
  layout?: 'centered' | 'left' | 'split';
}

export const EnhancedTopic: React.FC<EnhancedTopicProps> = ({
  heading,
  bodyText,
  number,
  totalTopics,
  style,
  animation = 'slide',
  iconUrl,
  showProgress = true,
  layout = 'centered',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Animation timings
  const numberDelay = 5;
  const headingDelay = 15;
  const bodyDelay = 30;
  const iconDelay = 10;
  const exitStart = durationInFrames - 20;

  // Get entrance animation
  const getEntrance = (delay: number, type: string = animation) => {
    switch (type) {
      case 'slide':
        return entranceAnimations.slideUp(frame, delay, 20, 60);
      case 'pop':
        return entranceAnimations.popIn(frame, delay, fps);
      case 'fade':
        return entranceAnimations.fadeIn(frame, delay, 20);
      case 'zoom':
        return entranceAnimations.zoomIn(frame, delay, 25);
      default:
        return entranceAnimations.slideUp(frame, delay, 20);
    }
  };

  // Exit animation
  const getExit = () => {
    if (frame < exitStart) return { opacity: 1 };
    return exitAnimations.fadeOut(frame, exitStart, 15);
  };

  // Number animation with bounce
  const numberAnim = entranceAnimations.bounceIn(frame, numberDelay, fps);
  const numberStyle = applyAnimation(numberAnim);

  // Heading animation
  const headingAnim = getEntrance(headingDelay);
  const headingStyle = applyAnimation(headingAnim);

  // Body animation
  const bodyAnim = getEntrance(bodyDelay);
  const bodyStyle = applyAnimation(bodyAnim);

  // Icon animation with float
  const iconEntrance = entranceAnimations.popIn(frame, iconDelay, fps);
  const iconFloat = loopAnimations.float(frame, 8, 0.04);
  const iconStyle = {
    ...applyAnimation(iconEntrance),
    transform: `${applyAnimation(iconEntrance).transform || ''} translateY(${iconFloat.translateY}px)`,
  };

  // Exit
  const exitAnim = getExit();

  // Progress calculation
  const progress = number && totalTopics ? number / totalTopics : 0;

  // Background
  const backgroundStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: style.background_type === 'gradient'
      ? style.background_value
      : style.background_value,
  };

  // Layout positioning
  const getContentStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: 60,
      ...applyAnimation(exitAnim as any),
    };

    switch (layout) {
      case 'left':
        return { ...base, alignItems: 'flex-start', justifyContent: 'center' };
      case 'split':
        return { ...base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' };
      default:
        return { ...base, alignItems: 'center', justifyContent: 'center' };
    }
  };

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      {/* Background */}
      <div style={backgroundStyle} />

      {/* Decorative elements */}
      <DecorativeCircle
        color={style.accent_color}
        size={200}
        position={{ x: 85, y: 15 }}
        animate
      />
      <DecorativeCircle
        color={style.accent_color}
        size={150}
        position={{ x: 10, y: 80 }}
        animate
      />
      <DecorativeLine
        color={style.accent_color}
        width={200}
        position={{ x: 5, y: 30 }}
        rotation={-45}
      />

      {/* Glow */}
      <GlowOrb
        color={style.accent_color}
        intensity={0.6}
        size={350}
        position={{ x: 50, y: 50 }}
        pulse
      />

      {/* Vignette */}
      <VignetteOverlay opacity={0.4} />

      {/* Content */}
      <div style={getContentStyle()}>
        {layout === 'split' ? (
          <>
            {/* Left: Text content */}
            <div style={{ flex: 1, paddingRight: 40 }}>
              {/* Number badge */}
              {number !== undefined && (
                <div style={{ ...numberStyle, marginBottom: 20 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: style.accent_color,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 40,
                      fontWeight: 800,
                      color: style.theme === 'dark' ? '#000' : '#fff',
                    }}
                  >
                    {number}
                  </div>
                </div>
              )}

              {/* Heading */}
              <div style={headingStyle}>
                <h2
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 56,
                    fontWeight: 700,
                    color: style.primary_color,
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {heading}
                </h2>
              </div>

              {/* Body */}
              <div style={{ ...bodyStyle, marginTop: 24 }}>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 28,
                    fontWeight: 400,
                    color: style.secondary_color,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {bodyText}
                </p>
              </div>
            </div>

            {/* Right: Icon */}
            {iconUrl && (
              <div style={{ ...iconStyle, flex: 0 }}>
                <Img
                  src={iconUrl}
                  style={{
                    width: 300,
                    height: 300,
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Icon */}
            {iconUrl && (
              <div style={{ ...iconStyle, marginBottom: 30 }}>
                <Img
                  src={iconUrl}
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}

            {/* Number badge */}
            {number !== undefined && (
              <div style={{ ...numberStyle, marginBottom: 24 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    backgroundColor: style.accent_color,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 48,
                    fontWeight: 800,
                    color: style.theme === 'dark' ? '#000' : '#fff',
                  }}
                >
                  {number}
                </div>
              </div>
            )}

            {/* Heading */}
            <div style={headingStyle}>
              <h2
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: layout === 'left' ? 64 : 56,
                  fontWeight: 700,
                  color: style.primary_color,
                  textAlign: layout === 'left' ? 'left' : 'center',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {heading}
              </h2>
            </div>

            {/* Body */}
            <div style={{ ...bodyStyle, marginTop: 24, maxWidth: 800 }}>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 28,
                  fontWeight: 400,
                  color: style.secondary_color,
                  textAlign: layout === 'left' ? 'left' : 'center',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {bodyText}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && number && totalTopics && (
        <ProgressBar
          progress={progress}
          color={style.accent_color}
          backgroundColor={`${style.primary_color}20`}
          height={6}
          width={80}
          position="bottom"
        />
      )}
    </div>
  );
};

export default EnhancedTopic;
