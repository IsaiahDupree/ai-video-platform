import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Easing,
} from 'remotion';

// =============================================================================
// Remotion Controllability Benchmark Test
// =============================================================================
// Tests: Animation, Audio, Effects, Programmatic Control

export interface BenchmarkProps {
  title: string;
  bullets: string[];
  sfxEvents: Array<{ frame: number; sfxId: string; volume?: number }>;
  style?: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  [key: string]: unknown;
}

// Animation test: Staggered bullet reveals with spring physics
const AnimatedBullet: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - delay;
  if (localFrame < 0) return null;

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const translateX = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const x = interpolate(translateX, [0, 1], [-50, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        fontSize: 36,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ color: '#6366f1' }}>●</span>
      <span>{text}</span>
    </div>
  );
};

// Effects test: Animated gradient background
const AnimatedBackground: React.FC<{ color1: string; color2: string }> = ({
  color1,
  color2,
}) => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, 300], [0, 360], {
    extrapolateRight: 'extend',
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
      }}
    />
  );
};

// Title with scale-in animation
const AnimatedTitle: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        fontSize: 72,
        fontWeight: 700,
        color,
        transform: `scale(${scale})`,
        opacity,
        textAlign: 'center',
        textShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {text}
    </div>
  );
};

// SFX Layer - plays audio at specified frames
const SfxLayer: React.FC<{
  events: Array<{ frame: number; sfxId: string; volume?: number }>;
}> = ({ events }) => {
  // Map sfxId to actual file path
  const sfxMap: Record<string, string> = {
    'meme_sfx_pack_iconic': 'assets/sfx/ui/meme_sfx_pack_iconic.wav',
    'whoosh_cinematic': 'assets/sfx/transitions/whoosh_cinematic.mp3',
    'impact': 'assets/sfx/impacts/fahhh_tiktok.wav',
  };

  return (
    <>
      {events.map((event, i) => {
        const src = sfxMap[event.sfxId];
        if (!src) return null;

        return (
          <Sequence key={i} from={event.frame} durationInFrames={90}>
            <Audio src={staticFile(src)} volume={event.volume ?? 0.7} />
          </Sequence>
        );
      })}
    </>
  );
};

// Main Benchmark Composition
export const BenchmarkTest: React.FC<BenchmarkProps> = ({
  title,
  bullets,
  sfxEvents,
  style = {
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#6366f1',
  },
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Progress indicator
  const progress = (frame / durationInFrames) * 100;

  return (
    <AbsoluteFill style={{ backgroundColor: style.backgroundColor }}>
      {/* Animated gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
        <AnimatedBackground color1={style.accentColor} color2="#000" />
      </div>

      {/* Content container */}
      <AbsoluteFill
        style={{
          padding: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: style.textColor,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Title - appears first */}
        <Sequence from={0} durationInFrames={durationInFrames}>
          <AnimatedTitle text={title} color={style.textColor} />
        </Sequence>

        {/* Bullets - staggered appearance */}
        <div style={{ marginTop: 60 }}>
          {bullets.map((bullet, i) => (
            <Sequence key={i} from={30 + i * 25} durationInFrames={durationInFrames - 30 - i * 25}>
              <AnimatedBullet text={bullet} delay={0} />
            </Sequence>
          ))}
        </div>

        {/* CTA - appears at end */}
        <Sequence from={30 + bullets.length * 25 + 30} durationInFrames={90}>
          <div
            style={{
              marginTop: 60,
              padding: '16px 40px',
              backgroundColor: style.accentColor,
              borderRadius: 12,
              fontSize: 32,
              fontWeight: 600,
              textAlign: 'center',
              alignSelf: 'center',
            }}
          >
            Get Started →
          </div>
        </Sequence>
      </AbsoluteFill>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 4,
          width: `${progress}%`,
          backgroundColor: style.accentColor,
        }}
      />

      {/* Frame counter (debug) */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          fontSize: 14,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'monospace',
        }}
      >
        Frame: {frame} / {durationInFrames}
      </div>

      {/* SFX Layer - audio events */}
      <SfxLayer events={sfxEvents} />
    </AbsoluteFill>
  );
};

// Default props for testing
export const benchmarkDefaultProps: BenchmarkProps = {
  title: 'Remotion Controllability Test',
  bullets: [
    'Spring-based animations',
    'Frame-precise audio sync',
    'Data-driven content',
    'Programmatic rendering',
  ],
  sfxEvents: [
    { frame: 0, sfxId: 'whoosh_cinematic', volume: 0.5 },
    { frame: 30, sfxId: 'meme_sfx_pack_iconic', volume: 0.6 },
    { frame: 55, sfxId: 'meme_sfx_pack_iconic', volume: 0.6 },
    { frame: 80, sfxId: 'meme_sfx_pack_iconic', volume: 0.6 },
    { frame: 105, sfxId: 'meme_sfx_pack_iconic', volume: 0.6 },
    { frame: 160, sfxId: 'impact', volume: 0.7 },
  ],
  style: {
    backgroundColor: '#0f0f23',
    textColor: '#ffffff',
    accentColor: '#6366f1',
  },
};
