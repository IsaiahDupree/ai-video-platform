/**
 * UGCTitleStyles.tsx — UGC-native hook/title overlay styles for vertical video.
 *
 * Styles included:
 *   sticker       — Colored pill label, slightly rotated, like a physical sticker
 *   neon-bar      — Dark translucent bar with neon glow text, top or bottom
 *   mega-title    — Full-width Anton bold, huge centered text, black stroke
 *   minimal-top   — Clean small text, top-left, editorial (no decoration)
 *   ig-badge      — Instagram rounded-rect badge overlay (bottom-left corner style)
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export type UGCTitleStyle = 'sticker' | 'neon-bar' | 'mega-title' | 'minimal-top' | 'ig-badge';

interface Props {
  text: string;
  subtext?: string;
  style?: UGCTitleStyle;
  accentColor?: string;
  /** 0 = animate in at frame 0; positive = delay */
  delayFrames?: number;
}

// ─── Sticker ──────────────────────────────────────────────────────────────────
// Yellow (or accent) pill, uppercase black bold text, tilted ~−2°.
// Inspired by: @alexhormozi offer callouts, GaryVee keyword highlights

const Sticker: React.FC<{ text: string; accentColor: string; delay: number }> = ({ text, accentColor, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localF = Math.max(0, frame - delay);
  const pop = spring({ frame: localF, fps, config: { damping: 7, stiffness: 240 } });
  const scale = interpolate(pop, [0, 1], [0, 1.0]);
  const opacity = interpolate(localF, [0, 3], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', top: 110, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      transform: `scale(${scale}) rotate(-2.5deg)`, opacity,
    }}>
      <div style={{
        backgroundColor: accentColor,
        color: '#000000',
        fontFamily: "'Archivo Black', 'Anton', sans-serif",
        fontWeight: 900, fontSize: 44,
        paddingInline: 32, paddingBlock: 14,
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '-0.01em', lineHeight: 1.1,
        boxShadow: '4px 6px 0 rgba(0,0,0,0.35)',
        maxWidth: '86%', textAlign: 'center',
      }}>
        {text}
      </div>
    </div>
  );
};

// ─── Neon Bar ─────────────────────────────────────────────────────────────────
// Dark semi-transparent bar spanning full width, neon colored text inside.
// Inspired by: dark IG stories, @levelsio vibes, tech creator intros

const NeonBar: React.FC<{ text: string; subtext?: string; accentColor: string; delay: number }> = ({
  text, subtext, accentColor, delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localF = Math.max(0, frame - delay);
  const opacity = interpolate(localF, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const glowIntensity = 18 + Math.sin(frame * 0.12) * 6;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      paddingBlock: 28, paddingInline: 48,
      display: 'flex', flexDirection: 'column', gap: 6,
      borderBottom: `2px solid ${accentColor}`,
      opacity,
    }}>
      <div style={{
        fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        fontWeight: 800, fontSize: 40,
        color: accentColor,
        textShadow: `0 0 ${glowIntensity}px ${accentColor}, 0 0 ${glowIntensity * 2}px ${accentColor}44`,
        letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.1,
      }}>{text}</div>
      {subtext && (
        <div style={{
          fontFamily: "'Sora', 'Inter', sans-serif",
          fontWeight: 400, fontSize: 26, color: 'rgba(255,255,255,0.72)',
          letterSpacing: '0.01em',
        }}>{subtext}</div>
      )}
    </div>
  );
};

// ─── Mega Title ───────────────────────────────────────────────────────────────
// Anton/Archivo Black, massive, centered, black stroke. High-impact opener.
// Inspired by: motivational TikToks, @tombilyeu clips, gym content

const MegaTitle: React.FC<{ text: string; subtext?: string; accentColor: string; delay: number }> = ({
  text, subtext, accentColor, delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localF = Math.max(0, frame - delay);
  const enter = spring({ frame: localF, fps, config: { damping: 9, stiffness: 200, mass: 0.8 } });
  const translateY = interpolate(enter, [0, 1], [60, 0]);
  const opacity = interpolate(localF, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  const words = text.split(' ');

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 140,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '0 32px',
      transform: `translateY(${translateY}px)`, opacity,
    }}>
      {/* Line 1 (first 2-3 words) */}
      <div style={{
        fontFamily: "'Anton', 'Archivo Black', sans-serif",
        fontWeight: 900,
        fontSize: 96,
        lineHeight: 1.0,
        color: '#ffffff',
        WebkitTextStroke: '4px #000000',
        textAlign: 'center', textTransform: 'uppercase',
        letterSpacing: '-0.02em', wordBreak: 'break-word',
        width: '100%',
      }}>
        {words.slice(0, Math.ceil(words.length / 2)).join(' ')}
      </div>
      {/* Line 2 (remainder) in accent color */}
      {words.length > 1 && (
        <div style={{
          fontFamily: "'Anton', 'Archivo Black', sans-serif",
          fontWeight: 900, fontSize: 88, lineHeight: 1.0,
          color: accentColor, WebkitTextStroke: '3px #000000',
          textAlign: 'center', textTransform: 'uppercase', letterSpacing: '-0.02em',
          width: '100%',
        }}>
          {words.slice(Math.ceil(words.length / 2)).join(' ')}
        </div>
      )}
      {subtext && (
        <div style={{
          fontFamily: "'Sora', 'Inter', sans-serif", fontWeight: 500,
          fontSize: 30, color: 'rgba(255,255,255,0.78)',
          marginTop: 12, textAlign: 'center', letterSpacing: '0.04em',
        }}>{subtext}</div>
      )}
    </div>
  );
};

// ─── Minimal Top ──────────────────────────────────────────────────────────────
// Clean, editorial — small weight-500 text top-left. Documentary/podcast look.
// Inspired by: @noah_kagan, @justinwelsh, @paulgraham style content

const MinimalTop: React.FC<{ text: string; subtext?: string; accentColor: string; delay: number }> = ({
  text, subtext, accentColor, delay,
}) => {
  const frame = useCurrentFrame();
  const localF = Math.max(0, frame - delay);
  const opacity = interpolate(localF, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', top: 80, left: 48,
      display: 'flex', flexDirection: 'column', gap: 6, opacity,
    }}>
      {/* Thin accent bar */}
      <div style={{ width: 36, height: 3, backgroundColor: accentColor, borderRadius: 2 }} />
      <div style={{
        fontFamily: "'Sora', 'Space Grotesk', sans-serif",
        fontWeight: 600, fontSize: 32, color: '#ffffff',
        textShadow: '0 2px 12px rgba(0,0,0,0.7)',
        letterSpacing: '-0.01em', lineHeight: 1.2,
        maxWidth: 440,
      }}>{text}</div>
      {subtext && (
        <div style={{
          fontFamily: "'Sora', sans-serif", fontWeight: 400, fontSize: 22,
          color: 'rgba(255,255,255,0.6)', letterSpacing: '0.01em',
        }}>{subtext}</div>
      )}
    </div>
  );
};

// ─── IG Badge ─────────────────────────────────────────────────────────────────
// Bottom-left rounded rectangle, light translucent, dark text inside.
// Exactly like Instagram's "See More" or product label overlays.

const IGBadge: React.FC<{ text: string; subtext?: string; accentColor: string; delay: number }> = ({
  text, subtext, accentColor, delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localF = Math.max(0, frame - delay);
  const enter = spring({ frame: localF, fps, config: { damping: 12, stiffness: 160 } });
  const translateX = interpolate(enter, [0, 1], [-80, 0]);
  const opacity = interpolate(localF, [0, 5], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', bottom: 360, left: 40,
      transform: `translateX(${translateX}px)`, opacity,
    }}>
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderRadius: 18, paddingInline: 24, paddingBlock: 16,
        display: 'flex', flexDirection: 'column', gap: 2,
        maxWidth: 380,
        borderLeft: `4px solid ${accentColor}`,
      }}>
        <div style={{
          fontFamily: "'Archivo Black', 'Inter', sans-serif",
          fontWeight: 900, fontSize: 30, color: '#000000',
          lineHeight: 1.1, letterSpacing: '-0.02em',
        }}>{text}</div>
        {subtext && (
          <div style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 500, fontSize: 20,
            color: 'rgba(0,0,0,0.58)', letterSpacing: '0.01em',
          }}>{subtext}</div>
        )}
      </div>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────

export const UGCTitle: React.FC<Props> = ({
  text,
  subtext,
  style = 'mega-title',
  accentColor = '#FFE600',
  delayFrames = 0,
}) => {
  switch (style) {
    case 'sticker':     return <Sticker text={text} accentColor={accentColor} delay={delayFrames} />;
    case 'neon-bar':    return <NeonBar text={text} subtext={subtext} accentColor={accentColor} delay={delayFrames} />;
    case 'mega-title':  return <MegaTitle text={text} subtext={subtext} accentColor={accentColor} delay={delayFrames} />;
    case 'minimal-top': return <MinimalTop text={text} subtext={subtext} accentColor={accentColor} delay={delayFrames} />;
    case 'ig-badge':    return <IGBadge text={text} subtext={subtext} accentColor={accentColor} delay={delayFrames} />;
    default:            return null;
  }
};
