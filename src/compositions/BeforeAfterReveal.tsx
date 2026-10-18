/**
 * Before/After Reveal Composition (TEMPLATE-BA-001/002/003)
 *
 * 8-second vertical video with whip-pan transition between
 * before and after states, plus optional handheld camera shake.
 *
 * Timeline:
 *   0.0s - 3.0s: "Before" state
 *   3.0s - 3.5s: Whip-pan transition (motion blur)
 *   3.5s - 6.5s: "After" state
 *   6.5s - 8.0s: CTA overlay
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Sequence,
} from 'remotion';

// =============================================================================
// Types
// =============================================================================

export interface BeforeAfterRevealProps {
  // Media
  beforeImageSrc?: string;
  afterImageSrc?: string;
  beforeVideoSrc?: string;
  afterVideoSrc?: string;

  // Labels
  beforeLabel?: string;
  afterLabel?: string;

  // Copy
  headline?: string;
  subheadline?: string;
  ctaText?: string;

  // Brand
  brandName?: string;
  brandLogoSrc?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;

  // Transition
  transitionStyle?: 'whip-pan' | 'morph' | 'swipe';
  transitionDuration?: number; // frames

  // Handheld camera shake
  enableCameraShake?: boolean;
  cameraShakeIntensity?: number; // 0-1

  // Style
  colorScheme?: 'dark' | 'light';
}

export const beforeAfterRevealDefaultProps: BeforeAfterRevealProps = {
  beforeLabel: 'BEFORE',
  afterLabel: 'AFTER',
  headline: 'See the Difference',
  subheadline: 'Transform your results today',
  ctaText: 'Try It Now',
  primaryColor: '#6366f1',
  accentColor: '#22c55e',
  fontFamily: 'Inter, system-ui, sans-serif',
  transitionStyle: 'whip-pan',
  transitionDuration: 15, // ~0.5s at 30fps
  enableCameraShake: true,
  cameraShakeIntensity: 0.3,
  colorScheme: 'dark',
};

// =============================================================================
// Handheld Camera Shake
// =============================================================================

function getCameraShake(
  frame: number,
  intensity: number
): { x: number; y: number; rotation: number } {
  // Use sine waves at different frequencies for organic shake
  const t = frame * 0.1;
  const x = Math.sin(t * 2.7 + 1.3) * 3 * intensity
    + Math.sin(t * 4.1 + 0.7) * 1.5 * intensity;
  const y = Math.sin(t * 3.2 + 2.1) * 2.5 * intensity
    + Math.sin(t * 5.3 + 1.9) * 1 * intensity;
  const rotation = Math.sin(t * 1.8 + 0.5) * 0.3 * intensity;

  return { x, y, rotation };
}

// =============================================================================
// Whip-Pan Transition
// =============================================================================

const WhipPanOverlay: React.FC<{
  frame: number;
  transitionStart: number;
  transitionDuration: number;
  primaryColor: string;
}> = ({ frame, transitionStart, transitionDuration, primaryColor }) => {
  const transitionEnd = transitionStart + transitionDuration;

  if (frame < transitionStart - 2 || frame > transitionEnd + 2) return null;

  // Motion blur intensity peaks in the middle of transition
  const progress = interpolate(
    frame,
    [transitionStart, transitionStart + transitionDuration / 2, transitionEnd],
    [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Horizontal streak for motion blur effect
  const streakOpacity = progress * 0.85;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
      {/* Motion blur streaks */}
      {Array.from({ length: 8 }).map((_, i) => {
        const yOffset = (i / 8) * 100;
        const delay = i * 0.05;
        const localProgress = Math.max(0, Math.min(1, progress - delay));

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${yOffset}%`,
              left: 0,
              right: 0,
              height: '14%',
              background: `linear-gradient(90deg,
                transparent 0%,
                ${primaryColor}${Math.round(localProgress * 40).toString(16).padStart(2, '0')} 20%,
                rgba(255,255,255,${localProgress * 0.3}) 50%,
                ${primaryColor}${Math.round(localProgress * 40).toString(16).padStart(2, '0')} 80%,
                transparent 100%
              )`,
              filter: `blur(${localProgress * 8}px)`,
              opacity: streakOpacity,
            }}
          />
        );
      })}

      {/* Flash at transition peak */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'white',
          opacity: interpolate(
            frame,
            [
              transitionStart + transitionDuration * 0.4,
              transitionStart + transitionDuration * 0.5,
              transitionStart + transitionDuration * 0.6,
            ],
            [0, 0.4, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          ),
        }}
      />
    </AbsoluteFill>
  );
};

// =============================================================================
// Label Component
// =============================================================================

const StateLabel: React.FC<{
  label: string;
  color: string;
  opacity: number;
  scale: number;
  fontFamily: string;
}> = ({ label, color, opacity, scale, fontFamily }) => (
  <div
    style={{
      position: 'absolute',
      top: 24,
      left: '50%',
      transform: `translateX(-50%) scale(${scale})`,
      opacity,
      background: color,
      color: '#fff',
      padding: '8px 24px',
      borderRadius: 24,
      fontSize: 16,
      fontWeight: 800,
      fontFamily,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      boxShadow: `0 4px 16px ${color}60`,
      zIndex: 10,
    }}
  >
    {label}
  </div>
);

// =============================================================================
// Main Composition
// =============================================================================

export const BeforeAfterReveal: React.FC<BeforeAfterRevealProps> = (inputProps) => {
  const props = { ...beforeAfterRevealDefaultProps, ...inputProps };
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const primaryColor = props.primaryColor!;
  const accentColor = props.accentColor!;
  const fontFamily = props.fontFamily!;
  const transitionDuration = props.transitionDuration!;

  // Timeline (in frames)
  const beforeEnd = Math.round(fps * 3); // 3 seconds
  const transitionStart = beforeEnd;
  const transitionEnd = transitionStart + transitionDuration;
  const afterEnd = Math.round(fps * 6.5);
  const ctaStart = afterEnd;

  // Dark/light colors
  const bgColor = props.colorScheme === 'light' ? '#f8fafc' : '#0a0a0f';
  const textColor = props.colorScheme === 'light' ? '#1e293b' : '#ffffff';

  // Camera shake
  const shake = props.enableCameraShake
    ? getCameraShake(frame, props.cameraShakeIntensity!)
    : { x: 0, y: 0, rotation: 0 };

  // Intensify shake during transition
  const transitionShakeMultiplier = interpolate(
    frame,
    [transitionStart, transitionStart + transitionDuration / 2, transitionEnd],
    [1, 4, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const shakeX = shake.x * transitionShakeMultiplier;
  const shakeY = shake.y * transitionShakeMultiplier;
  const shakeRot = shake.rotation * transitionShakeMultiplier;

  // Whip-pan X offset: slides left during transition
  const whipPanX = interpolate(
    frame,
    [transitionStart, transitionEnd],
    [0, -width],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  );

  // Before label animation
  const beforeLabelScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const beforeLabelOpacity = interpolate(
    frame,
    [8, 20, transitionStart - 5, transitionStart],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // After label animation
  const afterLabelDelay = transitionEnd + 5;
  const afterLabelScale = spring({
    frame: frame - afterLabelDelay,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const afterLabelOpacity = interpolate(
    frame,
    [afterLabelDelay, afterLabelDelay + 10, ctaStart - 5, ctaStart],
    [0, 1, 1, 0.6],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // CTA animation
  const ctaScale = spring({
    frame: frame - ctaStart,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const ctaOpacity = interpolate(
    frame,
    [ctaStart, ctaStart + 10],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Headline animation
  const headlineOpacity = interpolate(
    frame,
    [ctaStart + 5, ctaStart + 15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const headlineSlide = interpolate(
    frame,
    [ctaStart + 5, ctaStart + 20],
    [30, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Render media
  const renderMediaContent = (
    imageSrc?: string,
    videoSrc?: string,
  ) => {
    const mediaStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    };

    if (videoSrc) {
      return <Video src={videoSrc} style={mediaStyle} />;
    }
    if (imageSrc) {
      return <Img src={imageSrc} style={mediaStyle} />;
    }
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${bgColor}, #1a1a2e)`,
      }} />
    );
  };

  return (
    <AbsoluteFill style={{ background: bgColor, overflow: 'hidden' }}>
      {/* Camera shake wrapper */}
      <div
        style={{
          position: 'absolute',
          inset: -20, // Extra space for shake
          transform: `translate(${shakeX}px, ${shakeY}px) rotate(${shakeRot}deg)`,
        }}
      >
        {/* Sliding panel container for whip-pan */}
        <div
          style={{
            display: 'flex',
            width: width * 2 + 40, // Two panels side by side
            height: height + 40,
            transform: `translateX(${whipPanX}px)`,
          }}
        >
          {/* Before panel */}
          <div style={{ width: width + 20, height: '100%', position: 'relative', flexShrink: 0 }}>
            {renderMediaContent(props.beforeImageSrc, props.beforeVideoSrc)}
            <StateLabel
              label={props.beforeLabel!}
              color="rgba(239, 68, 68, 0.9)"
              opacity={beforeLabelOpacity}
              scale={beforeLabelScale}
              fontFamily={fontFamily}
            />
          </div>

          {/* After panel */}
          <div style={{ width: width + 20, height: '100%', position: 'relative', flexShrink: 0 }}>
            {renderMediaContent(props.afterImageSrc, props.afterVideoSrc)}
            <StateLabel
              label={props.afterLabel!}
              color="rgba(34, 197, 94, 0.9)"
              opacity={afterLabelOpacity}
              scale={afterLabelScale}
              fontFamily={fontFamily}
            />
          </div>
        </div>
      </div>

      {/* Whip-pan motion blur overlay */}
      <WhipPanOverlay
        frame={frame}
        transitionStart={transitionStart}
        transitionDuration={transitionDuration}
        primaryColor={primaryColor}
      />

      {/* CTA overlay (appears after the after state) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: ctaOpacity,
          background: `linear-gradient(to top, ${bgColor}ee 0%, ${bgColor}cc 60%, transparent 100%)`,
          zIndex: 50,
        }}
      >
        {/* Headline */}
        {props.headline && (
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: textColor,
              fontFamily,
              textAlign: 'center',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              opacity: headlineOpacity,
              transform: `translateY(${headlineSlide}px)`,
            }}
          >
            {props.headline}
          </div>
        )}

        {/* Subheadline */}
        {props.subheadline && (
          <div
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: `${textColor}aa`,
              fontFamily,
              textAlign: 'center',
              opacity: headlineOpacity,
              transform: `translateY(${headlineSlide}px)`,
            }}
          >
            {props.subheadline}
          </div>
        )}

        {/* CTA button */}
        {props.ctaText && (
          <div
            style={{
              transform: `scale(${ctaScale})`,
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              color: '#ffffff',
              padding: '14px 40px',
              borderRadius: 50,
              fontSize: 20,
              fontWeight: 700,
              fontFamily,
              letterSpacing: '0.01em',
              boxShadow: `0 4px 20px ${primaryColor}50`,
            }}
          >
            {props.ctaText}
          </div>
        )}

        {/* Brand */}
        {props.brandName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: 0.7,
              marginTop: 8,
            }}
          >
            {props.brandLogoSrc && (
              <Img
                src={props.brandLogoSrc}
                style={{ width: 20, height: 20, borderRadius: 4 }}
              />
            )}
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: textColor,
                fontFamily,
              }}
            >
              {props.brandName}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
