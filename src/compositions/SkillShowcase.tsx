/**
 * SkillShowcase — demonstrates advanced Remotion techniques
 *
 * Uses: spring(), interpolateColors(), noise2D(), Sequence, Series, Loop
 * Renders as a 9:16 card (1080×1920) — great for Telegram preview stills.
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Series,
  Loop,
} from 'remotion';
import { noise2D } from '@remotion/noise';

// ── Scene 1: Spring logo reveal + interpolateColors background ────────────────

const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background pulses from deep blue → purple over 90 frames
  const bg = interpolateColors(frame, [0, 90], ['#0a0a1e', '#1a0a2e']);

  // Title scales in with spring bounce
  const titleScale = spring({ frame, fps, config: { stiffness: 80, damping: 12 } });
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Subtitle slides up with delayed spring
  const subSlide = spring({ frame: frame - 15, fps, config: { stiffness: 120, damping: 18 } });
  const subY = interpolate(subSlide, [0, 1], [40, 0]);
  const subOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Accent line grows width
  const lineWidth = spring({ frame: frame - 25, fps, config: { stiffness: 60, damping: 15 } });
  const lineWidthPx = interpolate(lineWidth, [0, 1], [0, 320]);

  // Accent color shifts: electric blue → violet
  const accent = interpolateColors(frame, [0, 90], ['#3b82f6', '#a855f7']);

  return (
    <AbsoluteFill style={{ background: bg, justifyContent: 'center', alignItems: 'center' }}>
      {/* Noise-animated floating dots */}
      {[0, 1, 2, 3, 4].map((i) => {
        const nx = noise2D(`dot-x-${i}`, i * 0.3, frame * 0.008) * 120;
        const ny = noise2D(`dot-y-${i}`, i * 0.7, frame * 0.008) * 200;
        const dotOpacity = interpolate(frame, [0, 20], [0, 0.4], { extrapolateRight: 'clamp' });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 12 + i * 8,
              height: 12 + i * 8,
              borderRadius: '50%',
              background: accent,
              opacity: dotOpacity,
              left: `${20 + i * 15}%`,
              top: `${25 + i * 8}%`,
              transform: `translate(${nx}px, ${ny}px)`,
            }}
          />
        );
      })}

      {/* Main card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          padding: '80px 60px',
          background: 'rgba(255,255,255,0.04)',
          border: `2px solid ${accent}`,
          borderRadius: 32,
          width: 880,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Icon */}
        <div style={{
          fontSize: 96,
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
        }}>🎬</div>

        {/* Title */}
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 72,
          fontWeight: 800,
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: 1.1,
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
        }}>
          Advanced
          <br />
          <span style={{ color: accent }}>Remotion</span>
          <br />
          Skills
        </div>

        {/* Accent line */}
        <div style={{
          height: 4,
          width: lineWidthPx,
          background: accent,
          borderRadius: 2,
        }} />

        {/* Subtitle */}
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 36,
          color: '#a1a1aa',
          textAlign: 'center',
          transform: `translateY(${subY}px)`,
          opacity: subOpacity,
        }}>
          spring · noise · interpolateColors
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 2: Technique cards with Series ─────────────────────────────────────

const TechCard: React.FC<{ icon: string; name: string; desc: string; color: string; delay: number }> = ({
  icon, name, desc, color, delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slide = spring({ frame: frame - delay, fps, config: { stiffness: 100, damping: 16 } });
  const x = interpolate(slide, [0, 1], [80, 0]);
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      padding: '28px 40px',
      background: 'rgba(255,255,255,0.06)',
      border: `1.5px solid ${color}40`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 16,
      transform: `translateX(${x}px)`,
      opacity,
      width: '100%',
    }}>
      <span style={{ fontSize: 52 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 36, fontWeight: 700, color: '#ffffff' }}>{name}</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, color: '#a1a1aa', marginTop: 4 }}>{desc}</div>
      </div>
    </div>
  );
};

const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const bg = interpolateColors(frame, [0, 60], ['#1a0a2e', '#0a1e0a']);

  const cards = [
    { icon: '🌊', name: 'spring()', desc: 'Physics-based motion', color: '#3b82f6', delay: 0 },
    { icon: '🎨', name: 'interpolateColors', desc: 'Smooth color transitions', color: '#a855f7', delay: 12 },
    { icon: '🌀', name: 'noise2D()', desc: 'Organic perlin motion', color: '#10b981', delay: 24 },
    { icon: '🔁', name: '<Loop>', desc: 'Cyclic animations', color: '#f59e0b', delay: 36 },
    { icon: '🎬', name: '<Series>', desc: 'Scene sequencing', color: '#ef4444', delay: 48 },
  ];

  const headOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const accent = interpolateColors(frame, [0, 90], ['#3b82f6', '#10b981']);

  return (
    <AbsoluteFill style={{ background: bg, padding: '80px 60px', gap: 0 }}>
      <div style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 52,
        fontWeight: 800,
        color: '#ffffff',
        marginBottom: 48,
        opacity: headOpacity,
      }}>
        <span style={{ color: accent }}>5 Techniques</span>
        <br />to Master
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {cards.map((c) => <TechCard key={c.name} {...c} />)}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 3: CTA with Loop pulse ──────────────────────────────────────────────

const PulseDot: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(Math.sin((frame / 30) * Math.PI * 2), [-1, 1], [0.85, 1.15]);
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      background: color,
      transform: `scale(${scale})`,
      boxShadow: `0 0 ${20 * scale}px ${color}`,
    }} />
  );
};

const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bg = interpolateColors(frame, [0, 60], ['#0a1e0a', '#0a0a1e']);
  const accent = interpolateColors(frame, [0, 60], ['#10b981', '#a855f7']);

  const cardScale = spring({ frame, fps, config: { stiffness: 90, damping: 14 } });
  const cardOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: bg, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40,
        transform: `scale(${cardScale})`, opacity: cardOpacity,
        padding: '80px 60px', textAlign: 'center',
      }}>
        <Loop durationInFrames={60}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <PulseDot color="#3b82f6" />
            <PulseDot color="#a855f7" />
            <PulseDot color="#10b981" />
            <PulseDot color="#f59e0b" />
            <PulseDot color="#ef4444" />
          </div>
        </Loop>

        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 80, fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
          Build Videos
          <br />
          <span style={{ color: accent }}>With Code</span>
        </div>

        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 36, color: '#a1a1aa' }}>
          remotion.dev · @remotion_dev
        </div>

        <div style={{
          padding: '24px 60px',
          background: accent,
          borderRadius: 100,
          fontFamily: 'Inter, sans-serif',
          fontSize: 40,
          fontWeight: 700,
          color: '#ffffff',
        }}>
          Start Building →
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Root Composition ──────────────────────────────────────────────────────────

export interface SkillShowcaseProps {
  scene?: 1 | 2 | 3;
}

export const SkillShowcase: React.FC<SkillShowcaseProps> = ({ scene = 1 }) => {
  return (
    <AbsoluteFill>
      {scene === 1 && <Scene1 />}
      {scene === 2 && <Scene2 />}
      {scene === 3 && <Scene3 />}
    </AbsoluteFill>
  );
};

export const skillShowcaseDefaultProps: SkillShowcaseProps = { scene: 1 };

// Full video — all 3 scenes via Series
export const SkillShowcaseFull: React.FC = () => (
  <AbsoluteFill>
    <Series>
      <Series.Sequence durationInFrames={90}><Scene1 /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><Scene2 /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><Scene3 /></Series.Sequence>
    </Series>
  </AbsoluteFill>
);
