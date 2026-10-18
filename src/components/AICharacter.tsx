import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  spring,
  staticFile,
} from 'remotion';

// =============================================================================
// AI Character Component
// =============================================================================
// Renders AI-generated images with animations and background removal

export interface CharacterAnimation {
  type: 'float' | 'bounce' | 'wave' | 'talk' | 'idle' | 'entrance' | 'exit';
  intensity?: number;  // 0-1, affects animation magnitude
  speed?: number;      // multiplier for animation speed
}

export interface AICharacterProps {
  src: string;  // Path to image (already generated/downloaded)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
  animation?: CharacterAnimation;
  enterFrame?: number;  // Frame when character appears
  exitFrame?: number;   // Frame when character exits
  flipX?: boolean;
  shadow?: boolean;
  glow?: { color: string; blur: number };
}

export const AICharacter: React.FC<AICharacterProps> = ({
  src,
  x = 0,
  y = 0,
  width,
  height,
  scale = 1,
  rotation = 0,
  animation = { type: 'idle' },
  enterFrame = 0,
  exitFrame,
  flipX = false,
  shadow = true,
  glow,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const effectiveExitFrame = exitFrame ?? durationInFrames;
  const isVisible = frame >= enterFrame && frame < effectiveExitFrame;

  if (!isVisible) return null;

  const localFrame = frame - enterFrame;
  const intensity = animation.intensity ?? 0.5;
  const speed = animation.speed ?? 1;

  // Calculate animation transforms
  let animX = 0;
  let animY = 0;
  let animScale = scale;
  let animRotation = rotation;
  let opacity = 1;

  switch (animation.type) {
    case 'float':
      // Gentle floating up and down
      animY = Math.sin((localFrame * speed * 0.1)) * 15 * intensity;
      animRotation = rotation + Math.sin((localFrame * speed * 0.05)) * 3 * intensity;
      break;

    case 'bounce':
      // Bouncy motion
      const bouncePhase = (localFrame * speed * 0.15) % (Math.PI * 2);
      animY = -Math.abs(Math.sin(bouncePhase)) * 30 * intensity;
      animScale = scale * (1 + Math.abs(Math.sin(bouncePhase)) * 0.1 * intensity);
      break;

    case 'wave':
      // Side-to-side wave
      animX = Math.sin((localFrame * speed * 0.1)) * 20 * intensity;
      animRotation = rotation + Math.sin((localFrame * speed * 0.1)) * 10 * intensity;
      break;

    case 'talk':
      // Subtle talking motion (slight scale pulse)
      const talkPulse = Math.sin((localFrame * speed * 0.5)) * 0.5 + 0.5;
      animScale = scale * (1 + talkPulse * 0.03 * intensity);
      animY = -talkPulse * 5 * intensity;
      break;

    case 'idle':
      // Very subtle breathing motion
      animScale = scale * (1 + Math.sin((localFrame * speed * 0.05)) * 0.02 * intensity);
      break;

    case 'entrance':
      // Spring entrance animation
      const entranceProgress = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 100 },
      });
      animScale = scale * interpolate(entranceProgress, [0, 1], [0, 1]);
      opacity = entranceProgress;
      animY = interpolate(entranceProgress, [0, 1], [50, 0]);
      break;

    case 'exit':
      // Fade out exit
      const exitLocalFrame = frame - (effectiveExitFrame - 15);
      if (exitLocalFrame > 0) {
        opacity = interpolate(exitLocalFrame, [0, 15], [1, 0], {
          extrapolateRight: 'clamp',
        });
        animY = interpolate(exitLocalFrame, [0, 15], [0, -30]);
        animScale = scale * interpolate(exitLocalFrame, [0, 15], [1, 0.8]);
      }
      break;
  }

  const transform = [
    `translate(${x + animX}px, ${y + animY}px)`,
    `scale(${flipX ? -animScale : animScale}, ${animScale})`,
    `rotate(${animRotation}deg)`,
  ].join(' ');

  const shadowStyle = shadow
    ? '0 10px 30px rgba(0,0,0,0.3), 0 5px 15px rgba(0,0,0,0.2)'
    : 'none';

  const glowStyle = glow
    ? `0 0 ${glow.blur}px ${glow.color}, 0 0 ${glow.blur * 2}px ${glow.color}`
    : undefined;

  return (
    <div
      style={{
        position: 'absolute',
        transform,
        opacity,
        transformOrigin: 'center bottom',
        filter: glowStyle ? `drop-shadow(${glowStyle})` : undefined,
      }}
    >
      <Img
        src={src.startsWith('http') ? src : staticFile(src)}
        style={{
          width: width ?? 'auto',
          height: height ?? 'auto',
          boxShadow: shadowStyle,
          borderRadius: 8,
        }}
      />
    </div>
  );
};

// =============================================================================
// Character Presets
// =============================================================================

export const CharacterPresets = {
  narrator: {
    animation: { type: 'idle' as const, intensity: 0.3 },
    x: -300,
    y: 100,
    scale: 0.8,
  },
  sidekick: {
    animation: { type: 'bounce' as const, intensity: 0.6 },
    x: 300,
    y: 150,
    scale: 0.6,
  },
  floating: {
    animation: { type: 'float' as const, intensity: 0.7 },
    x: 0,
    y: -100,
    scale: 0.5,
  },
  talking: {
    animation: { type: 'talk' as const, intensity: 0.8 },
    x: 0,
    y: 200,
    scale: 1,
  },
};

// =============================================================================
// Helper: Generate character with AI (script to call externally)
// =============================================================================

export interface GenerateCharacterConfig {
  prompt: string;
  provider: 'replicate' | 'openai' | 'stability';
  removeBackground?: boolean;
  outputPath: string;
}

// This would be called from a script, not at render time
export const generateCharacterPrompt = (config: GenerateCharacterConfig): string => {
  return `
Generate character image:
  Prompt: ${config.prompt}
  Provider: ${config.provider}
  Remove BG: ${config.removeBackground ?? true}
  Output: ${config.outputPath}

Run: npx tsx scripts/generate-character.ts --prompt "${config.prompt}" --output "${config.outputPath}"
`;
};
