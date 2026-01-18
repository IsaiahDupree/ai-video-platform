/**
 * Visual Effects Components
 * 
 * Reusable overlay effects, decorations, and theatrical elements
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// =============================================================================
// Particle Effects
// =============================================================================

interface ParticleProps {
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
  direction?: 'up' | 'down' | 'random';
}

export const FloatingParticles: React.FC<ParticleProps> = ({
  count = 20,
  color = '#ffffff',
  size = 4,
  speed = 1,
  direction = 'up',
}) => {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();
  
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      startY: Math.random() * height,
      size: size * (0.5 + Math.random() * 0.5),
      speed: speed * (0.5 + Math.random() * 0.5),
      opacity: 0.2 + Math.random() * 0.6,
      delay: Math.random() * 100,
    }));
  }, [count, width, height, size, speed]);
  
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map((p) => {
        const yOffset = ((frame + p.delay) * p.speed) % (height + 100);
        const y = direction === 'up' 
          ? height - yOffset 
          : direction === 'down' 
            ? yOffset - 100 
            : p.startY + Math.sin(frame * 0.05) * 50;
        
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x + Math.sin((frame + p.delay) * 0.02) * 20,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: p.opacity,
              filter: `blur(${p.size * 0.3}px)`,
            }}
          />
        );
      })}
    </div>
  );
};

// =============================================================================
// Glow Effects
// =============================================================================

interface GlowProps {
  color?: string;
  intensity?: number;
  size?: number;
  pulse?: boolean;
  position?: { x: number; y: number };
}

export const GlowOrb: React.FC<GlowProps> = ({
  color = '#3b82f6',
  intensity = 1,
  size = 300,
  pulse = true,
  position = { x: 50, y: 50 },
}) => {
  const frame = useCurrentFrame();
  const scale = pulse ? 1 + Math.sin(frame * 0.05) * 0.1 : 1;
  const opacity = intensity * (pulse ? 0.3 + Math.sin(frame * 0.03) * 0.1 : 0.4);
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: size * scale,
        height: size * scale,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${color}88 0%, ${color}00 70%)`,
        opacity,
        filter: `blur(${size * 0.1}px)`,
        pointerEvents: 'none',
      }}
    />
  );
};

export const NeonGlow: React.FC<{ color?: string; children: React.ReactNode }> = ({
  color = '#00ff88',
  children,
}) => {
  const frame = useCurrentFrame();
  const glowIntensity = 10 + Math.sin(frame * 0.1) * 3;
  
  return (
    <div
      style={{
        filter: `drop-shadow(0 0 ${glowIntensity}px ${color}) drop-shadow(0 0 ${glowIntensity * 2}px ${color}40)`,
      }}
    >
      {children}
    </div>
  );
};

// =============================================================================
// Overlay Effects
// =============================================================================

interface OverlayProps {
  opacity?: number;
}

export const VignetteOverlay: React.FC<OverlayProps> = ({ opacity = 0.5 }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
      opacity,
      pointerEvents: 'none',
    }}
  />
);

export const GradientOverlay: React.FC<{
  colors?: string[];
  direction?: number;
  opacity?: number;
}> = ({
  colors = ['#000000', 'transparent'],
  direction = 180,
  opacity = 0.5,
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(${direction}deg, ${colors.join(', ')})`,
      opacity,
      pointerEvents: 'none',
    }}
  />
);

export const NoiseOverlay: React.FC<OverlayProps> = ({ opacity = 0.05 }) => {
  const frame = useCurrentFrame();
  
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' seed='${Math.floor(frame / 2)}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }}
    />
  );
};

export const ScanlineOverlay: React.FC<OverlayProps & { lineHeight?: number }> = ({
  opacity = 0.1,
  lineHeight = 4,
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      opacity,
      pointerEvents: 'none',
      background: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent ${lineHeight / 2}px,
        rgba(0, 0, 0, 0.3) ${lineHeight / 2}px,
        rgba(0, 0, 0, 0.3) ${lineHeight}px
      )`,
    }}
  />
);

// =============================================================================
// Decorative Elements
// =============================================================================

interface ShapeProps {
  color?: string;
  size?: number;
  position?: { x: number; y: number };
  rotation?: number;
  animate?: boolean;
}

export const DecorativeCircle: React.FC<ShapeProps> = ({
  color = '#3b82f6',
  size = 100,
  position = { x: 80, y: 20 },
  animate = true,
}) => {
  const frame = useCurrentFrame();
  const scale = animate ? 1 + Math.sin(frame * 0.03) * 0.1 : 1;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        opacity: 0.3,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    />
  );
};

export const DecorativeLine: React.FC<{
  color?: string;
  width?: number;
  thickness?: number;
  position?: { x: number; y: number };
  rotation?: number;
}> = ({
  color = '#ffffff',
  width = 100,
  thickness = 2,
  position = { x: 10, y: 50 },
  rotation = 0,
}) => (
  <div
    style={{
      position: 'absolute',
      left: `${position.x}%`,
      top: `${position.y}%`,
      width,
      height: thickness,
      backgroundColor: color,
      opacity: 0.3,
      transform: `rotate(${rotation}deg)`,
    }}
  />
);

export const GridPattern: React.FC<{
  color?: string;
  spacing?: number;
  opacity?: number;
}> = ({
  color = '#ffffff',
  spacing = 50,
  opacity = 0.05,
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      opacity,
      pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(${color} 1px, transparent 1px),
        linear-gradient(90deg, ${color} 1px, transparent 1px)
      `,
      backgroundSize: `${spacing}px ${spacing}px`,
    }}
  />
);

// =============================================================================
// Progress & Indicators
// =============================================================================

interface ProgressProps {
  progress: number; // 0-1
  color?: string;
  backgroundColor?: string;
  height?: number;
  width?: number;
  position?: 'top' | 'bottom';
}

export const ProgressBar: React.FC<ProgressProps> = ({
  progress,
  color = '#3b82f6',
  backgroundColor = '#ffffff20',
  height = 4,
  width = 100,
  position = 'bottom',
}) => (
  <div
    style={{
      position: 'absolute',
      [position]: 40,
      left: '50%',
      transform: 'translateX(-50%)',
      width: `${width}%`,
      height,
      backgroundColor,
      borderRadius: height / 2,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        width: `${progress * 100}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: height / 2,
        transition: 'width 0.1s ease-out',
      }}
    />
  </div>
);

export const CountdownTimer: React.FC<{
  seconds: number;
  color?: string;
  size?: number;
}> = ({
  seconds,
  color = '#ffffff',
  size = 80,
}) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: size,
        fontWeight: 'bold',
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {mins > 0 && `${mins}:`}{secs.toString().padStart(2, '0')}
    </div>
  );
};

// =============================================================================
// Text Effects
// =============================================================================

export const GradientText: React.FC<{
  children: React.ReactNode;
  colors?: string[];
  direction?: number;
}> = ({
  children,
  colors = ['#3b82f6', '#8b5cf6'],
  direction = 90,
}) => (
  <span
    style={{
      background: `linear-gradient(${direction}deg, ${colors.join(', ')})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}
  >
    {children}
  </span>
);

export const OutlineText: React.FC<{
  children: React.ReactNode;
  color?: string;
  strokeWidth?: number;
}> = ({
  children,
  color = '#ffffff',
  strokeWidth = 2,
}) => (
  <span
    style={{
      WebkitTextStroke: `${strokeWidth}px ${color}`,
      WebkitTextFillColor: 'transparent',
    }}
  >
    {children}
  </span>
);

export const AnimatedHighlight: React.FC<{
  children: React.ReactNode;
  color?: string;
  delay?: number;
}> = ({
  children,
  color = '#fbbf24',
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const width = interpolate(
    frame,
    [delay, delay + fps * 0.5],
    [0, 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: `${width}%`,
          height: '30%',
          backgroundColor: color,
          opacity: 0.3,
          zIndex: -1,
        }}
      />
      {children}
    </span>
  );
};

// =============================================================================
// Emoji/Icon Animations
// =============================================================================

interface EmojiProps {
  emoji: string;
  size?: number;
  animate?: 'bounce' | 'spin' | 'pulse' | 'shake' | 'none';
}

export const AnimatedEmoji: React.FC<EmojiProps> = ({
  emoji,
  size = 64,
  animate = 'bounce',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  let transform = '';
  
  switch (animate) {
    case 'bounce':
      const bounceY = Math.abs(Math.sin(frame * 0.15)) * 20;
      transform = `translateY(-${bounceY}px)`;
      break;
    case 'spin':
      transform = `rotate(${frame * 3}deg)`;
      break;
    case 'pulse':
      const scale = 1 + Math.sin(frame * 0.1) * 0.1;
      transform = `scale(${scale})`;
      break;
    case 'shake':
      const shakeX = Math.sin(frame * 0.5) * 5;
      transform = `translateX(${shakeX}px)`;
      break;
  }
  
  return (
    <span
      style={{
        fontSize: size,
        display: 'inline-block',
        transform,
      }}
    >
      {emoji}
    </span>
  );
};

// =============================================================================
// Lower Third
// =============================================================================

export const LowerThird: React.FC<{
  title: string;
  subtitle?: string;
  color?: string;
  accentColor?: string;
}> = ({
  title,
  subtitle,
  color = '#ffffff',
  accentColor = '#3b82f6',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  
  const barWidth = interpolate(slideIn, [0, 1], [0, 100]);
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 120,
        left: 60,
        transform: `translateX(${(1 - slideIn) * -100}px)`,
        opacity: slideIn,
      }}
    >
      <div
        style={{
          width: `${barWidth}%`,
          height: 4,
          backgroundColor: accentColor,
          marginBottom: 12,
        }}
      />
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 32,
          fontWeight: 'bold',
          color,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 20,
            color: `${color}99`,
            marginTop: 4,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Export All
// =============================================================================

export default {
  FloatingParticles,
  GlowOrb,
  NeonGlow,
  VignetteOverlay,
  GradientOverlay,
  NoiseOverlay,
  ScanlineOverlay,
  DecorativeCircle,
  DecorativeLine,
  GridPattern,
  ProgressBar,
  CountdownTimer,
  GradientText,
  OutlineText,
  AnimatedHighlight,
  AnimatedEmoji,
  LowerThird,
};
