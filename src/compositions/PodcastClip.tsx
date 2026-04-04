import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';
import { noise2D } from '@remotion/noise';
import { TikTokCaptions } from '../components/TikTokCaptions';
import type { WordTiming } from '../components/TikTokCaptions';

// ─── Data contract ─────────────────────────────────────────────────────────────

export interface VoiceSegmentTiming {
  startFrame: number;
  endFrame: number;
  text: string;
}

export interface PodcastClipBrief {
  // Show identity
  podcast_name: string;          // "Build in Public"
  episode_label?: string;        // "EP. 12" or "CLIP"
  // Speaker
  speaker_name: string;          // "Isaiah Dupree"
  speaker_title: string;         // "AI Automation Engineer"
  // Audio
  voiceover_path: string;        // 'audio/podcast-vo-combined.wav'
  voiceover_segments: VoiceSegmentTiming[];
  music_path?: string;           // Background lo-fi (optional)
  // CTA
  cta_handle: string;            // "@isaiahdupree"
  cta_display?: string;          // "Follow for more →"
  // Accent color theme
  accent?: string;               // hex, default purple
  // Meta
  totalFrames?: number;
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const BG        = '#0a0712';
const BG_CARD   = '#13102a';
const BORDER    = '#2a2547';
const TEXT      = '#f1f5f9';
const TEXT_DIM  = '#64748b';
const SANS      = 'Inter, system-ui, -apple-system, sans-serif';
const MONO      = '"JetBrains Mono", "Fira Code", monospace';

// Accent fallback (purple)
const DEFAULT_ACCENT  = '#a78bfa';
const DEFAULT_SECOND  = '#f0abfc';  // light pink
const DEFAULT_THIRD   = '#38bdf8';  // sky blue

// ─── Audio sidechain ───────────────────────────────────────────────────────────

const DUCK   = 0.08;
const FULL   = 0.45;
const ATTACK = 6;
const RELEASE = 18;

function sidechain(frame: number, segs: VoiceSegmentTiming[]): number {
  for (const s of segs) {
    const atk = s.startFrame - ATTACK;
    const rel = s.endFrame + RELEASE;
    if (frame >= atk && frame < s.startFrame) {
      return interpolate(frame, [atk, s.startFrame], [FULL, DUCK], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: (t) => t * t,
      });
    }
    if (frame >= s.startFrame && frame <= s.endFrame) return DUCK;
    if (frame > s.endFrame && frame <= rel) {
      return interpolate(frame, [s.endFrame, rel], [DUCK, FULL], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: (t) => 1 - Math.pow(1 - t, 2),
      });
    }
  }
  return FULL;
}

// ─── Motion primitives ─────────────────────────────────────────────────────────

const fadeIn = (frame: number, delay = 0, dur = 12) =>
  interpolate(frame - delay, [0, dur], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

const slideUp = (frame: number, delay = 0, dist = 40) =>
  interpolate(frame - delay, [0, 20], [dist, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

const snap = (frame: number, delay = 0, fps = 30) =>
  spring({ frame: frame - delay, fps, config: { stiffness: 300, damping: 22 } });

// ─── Word timing builder ────────────────────────────────────────────────────────
// Distributes words evenly across each segment's time range.

function buildWordTimings(segments: VoiceSegmentTiming[], fps: number): WordTiming[] {
  const timings: WordTiming[] = [];
  for (const seg of segments) {
    const startSec = seg.startFrame / fps;
    const endSec   = seg.endFrame   / fps;
    const words = seg.text.split(/\s+/).filter(Boolean);
    const duration = endSec - startSec;
    const timePerWord = duration / words.length;
    words.forEach((word, i) => {
      timings.push({
        word,
        start: startSec + i * timePerWord,
        end:   startSec + (i + 1) * timePerWord,
      });
    });
  }
  return timings;
}

// ─── Reactive waveform ─────────────────────────────────────────────────────────

const WaveBar: React.FC<{
  index: number;
  total: number;
  frame: number;
  voSegs: VoiceSegmentTiming[];
  accent: string;
  speaking: boolean;
}> = ({ index, total, frame, voSegs, accent, speaking }) => {
  // Noise-driven height — more energetic when voice is active
  const vol = sidechain(frame, voSegs);
  const isDucked = vol < FULL * 0.7;       // music ducked = voice active
  const baseNoise = noise2D(`wbar-${index}`, index * 0.28, frame * 0.07) * 0.5 + 0.5;
  const energyNoise = noise2D(`wen-${index}`, index * 0.2, frame * 0.15);

  // Voice bars: tall and animated; music bars: shorter, calm
  const voiceHeight = 80 + energyNoise * 50;
  const musicHeight = 12 + baseNoise * 20;
  const barHeight = interpolate(
    isDucked ? 1 : 0,
    [0, 1],
    [musicHeight, voiceHeight],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Color: accent when speaking, dim otherwise
  const color = isDucked ? accent : `rgba(100,116,139,0.4)`;

  // Slight horizontal mirror symmetry
  const mirrorIdx = Math.abs(index - total / 2) / (total / 2);
  const shapeH = barHeight * (1 - mirrorIdx * 0.3);

  return (
    <div style={{
      width: 4,
      height: Math.max(4, shapeH),
      borderRadius: 3,
      background: color,
      alignSelf: 'center',
      boxShadow: isDucked ? `0 0 8px ${accent}66` : 'none',
      transition: 'height 0.02s linear',
    }} />
  );
};

// ─── Pulsing avatar ring ───────────────────────────────────────────────────────

const AvatarRing: React.FC<{
  frame: number;
  voSegs: VoiceSegmentTiming[];
  accent: string;
  second: string;
  size: number;
}> = ({ frame, voSegs, accent, second, size }) => {
  const vol = sidechain(frame, voSegs);
  const speaking = vol < FULL * 0.7;
  const pulse = 0.5 + Math.sin(frame * 0.18) * 0.5;
  const ringSize = speaking ? size + 10 + pulse * 8 : size + 2;
  const ringOpacity = speaking ? 0.8 + pulse * 0.2 : 0.25;
  const initScale = snap(frame, 5);

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      transform: `scale(${interpolate(initScale, [0, 1], [0.5, 1])})`,
    }}>
      {/* Outer pulse ring */}
      <div style={{
        position: 'absolute',
        top: -(ringSize - size) / 2,
        left: -(ringSize - size) / 2,
        width: ringSize,
        height: ringSize,
        borderRadius: '50%',
        border: `2px solid ${accent}`,
        opacity: ringOpacity,
        boxShadow: speaking ? `0 0 20px ${accent}55` : 'none',
        transition: 'all 0.05s linear',
      }} />
      {/* Inner avatar circle */}
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${accent}33 0%, ${second}22 100%)`,
        border: `2px solid ${accent}66`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Initials placeholder */}
        <span style={{
          color: accent,
          fontSize: size * 0.38,
          fontWeight: 800,
          fontFamily: SANS,
          letterSpacing: '-0.02em',
          textShadow: `0 0 20px ${accent}`,
        }}>
          ID
        </span>
      </div>
    </div>
  );
};

// ─── Episode badge ─────────────────────────────────────────────────────────────

const EpisodeBadge: React.FC<{
  podcastName: string;
  episodeLabel: string;
  frame: number;
  accent: string;
}> = ({ podcastName, episodeLabel, frame, accent }) => {
  const op = fadeIn(frame, 0, 12);
  const y  = slideUp(frame, 0, 16);
  return (
    <div style={{
      opacity: op,
      transform: `translateY(${y}px)`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      {/* Mic icon */}
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 0 12px ${accent}88`,
      }}>
        <span style={{ fontSize: 14 }}>🎙</span>
      </div>
      <span style={{
        color: TEXT,
        fontFamily: SANS,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.01em',
      }}>
        {podcastName}
      </span>
      <div style={{
        background: `${accent}22`,
        border: `1px solid ${accent}44`,
        borderRadius: 6,
        padding: '2px 8px',
        color: accent,
        fontFamily: MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}>
        {episodeLabel}
      </div>
    </div>
  );
};

// ─── CTA lower bar ─────────────────────────────────────────────────────────────

const CTABar: React.FC<{
  handle: string;
  display: string;
  frame: number;
  appearFrame: number;
  accent: string;
}> = ({ handle, display, frame, appearFrame, accent }) => {
  const op = fadeIn(frame, appearFrame, 12);
  const y  = slideUp(frame, appearFrame, 20);
  if (op < 0.01) return null;
  return (
    <div style={{
      opacity: op,
      transform: `translateY(${y}px)`,
      background: `${accent}18`,
      border: `1px solid ${accent}33`,
      borderRadius: 12,
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{
        color: accent,
        fontFamily: MONO,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}>
        {handle}
      </span>
      <span style={{
        color: TEXT,
        fontFamily: SANS,
        fontSize: 14,
        opacity: 0.85,
      }}>
        {display}
      </span>
    </div>
  );
};

// ─── Background ambient ────────────────────────────────────────────────────────

const AmbientBackground: React.FC<{
  frame: number;
  accent: string;
  second: string;
}> = ({ frame, accent, second }) => {
  const pulse1 = Math.sin(frame * 0.04) * 0.5 + 0.5;
  const pulse2 = Math.sin(frame * 0.03 + 1.5) * 0.5 + 0.5;
  return (
    <>
      {/* Soft color orbs */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '70%',
        height: '70%',
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${accent}${Math.round(pulse1 * 15 + 8).toString(16).padStart(2,'0')} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-15%',
        width: '60%',
        height: '60%',
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${second}${Math.round(pulse2 * 12 + 6).toString(16).padStart(2,'0')} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      {/* Subtle grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(${BORDER}22 1px, transparent 1px), linear-gradient(90deg, ${BORDER}22 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />
      {/* Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
        pointerEvents: 'none',
      }} />
    </>
  );
};

// ─── Main composition ──────────────────────────────────────────────────────────

export const PodcastClipComposition: React.FC<{ brief?: PodcastClipBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const b = brief || DEFAULT_PODCAST_BRIEF;

  const accent  = b.accent || DEFAULT_ACCENT;
  const second  = DEFAULT_SECOND;
  const third   = DEFAULT_THIRD;

  const isShorts = height > width;
  const unit     = (isShorts ? width : height) / 100;

  const voSegs = b.voiceover_segments || [];
  const transcript = buildWordTimings(voSegs, fps);

  // CTA: after last VO segment + 20 frames buffer
  const lastVoFrame = voSegs.length > 0 ? voSegs[voSegs.length - 1].endFrame : 0;
  const ctaAppearFrame = Math.max(lastVoFrame + 20, durationInFrames - 100);

  // Is voice currently active?
  const vol = sidechain(frame, voSegs);
  const speaking = vol < FULL * 0.7;

  // Waveform bar count
  const BAR_COUNT = isShorts ? 36 : 48;

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: SANS, overflow: 'hidden' }}>
      {/* Ambient background layers */}
      <AmbientBackground frame={frame} accent={accent} second={second} />

      {/* ── Audio ── */}
      {b.voiceover_path && (
        <Audio src={staticFile(b.voiceover_path)} />
      )}
      {b.music_path && (
        <Audio
          src={staticFile(b.music_path)}
          volume={(f) => {
            const fadeInVol  = interpolate(f, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const fadeOutVol = interpolate(f, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return sidechain(f, voSegs) * Math.min(fadeInVol, fadeOutVol);
          }}
          loop
        />
      )}

      {/* ── Layout ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: isShorts
          ? `${unit * 6}px ${unit * 5}px`
          : `${unit * 4}px ${unit * 7}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        gap: unit * 2,
      }}>

        {/* ── Top: Episode badge ── */}
        <EpisodeBadge
          podcastName={b.podcast_name}
          episodeLabel={b.episode_label || 'CLIP'}
          frame={frame}
          accent={accent}
        />

        {/* ── Center block: avatar + waveform + captions ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: unit * 2.5,
        }}>

          {/* Avatar ring */}
          <AvatarRing
            frame={frame}
            voSegs={voSegs}
            accent={accent}
            second={second}
            size={isShorts ? unit * 18 : unit * 14}
          />

          {/* Waveform bars */}
          <div style={{
            display: 'flex',
            gap: isShorts ? 3 : 4,
            alignItems: 'center',
            height: isShorts ? 100 : 80,
            width: '100%',
            justifyContent: 'center',
          }}>
            {Array.from({ length: BAR_COUNT }, (_, i) => (
              <WaveBar
                key={i}
                index={i}
                total={BAR_COUNT}
                frame={frame}
                voSegs={voSegs}
                accent={accent}
                speaking={speaking}
              />
            ))}
          </div>

          {/* Captions — glow style, word-by-word */}
          <div style={{
            width: '100%',
            minHeight: isShorts ? unit * 20 : unit * 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {transcript.length > 0 && (
              <TikTokCaptions
                transcript={transcript}
                style="glow"
                fontSize={isShorts ? Math.round(unit * 4.2) : Math.round(unit * 3.2)}
                fontFamily={SANS}
                primaryColor={`${TEXT}cc`}
                accentColor={accent}
                position="center"
                maxWordsVisible={5}
              />
            )}
          </div>
        </div>

        {/* ── Speaker attribution ── */}
        <div style={{
          opacity: fadeIn(frame, 15, 15),
          transform: `translateY(${slideUp(frame, 15, 20)}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: isShorts ? 'center' : 'flex-start',
          gap: 4,
        }}>
          <span style={{
            color: TEXT,
            fontFamily: SANS,
            fontSize: isShorts ? unit * 2.4 : unit * 1.8,
            fontWeight: 700,
          }}>
            {b.speaker_name}
          </span>
          <span style={{
            color: TEXT_DIM,
            fontFamily: MONO,
            fontSize: isShorts ? unit * 1.6 : unit * 1.2,
            letterSpacing: '0.04em',
          }}>
            {b.speaker_title}
          </span>
        </div>

        {/* ── CTA bar ── */}
        <CTABar
          handle={b.cta_handle}
          display={b.cta_display || 'Follow for more →'}
          frame={frame}
          appearFrame={ctaAppearFrame}
          accent={accent}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Default brief ─────────────────────────────────────────────────────────────

export const DEFAULT_PODCAST_BRIEF: PodcastClipBrief = {
  podcast_name: 'Build in Public',
  episode_label: 'EP. 01',
  speaker_name: 'Isaiah Dupree',
  speaker_title: 'AI Automation Engineer',
  voiceover_path: 'audio/podcast-vo-combined.wav',
  voiceover_segments: [
    { startFrame: 20,  endFrame: 200, text: 'The whole system runs without me touching it. Every morning the agents check my pipeline, score new prospects, and queue the best messages for approval.' },
    { startFrame: 220, endFrame: 380, text: 'I built it in three months. It generates more leads than I can handle right now.' },
    { startFrame: 400, endFrame: 510, text: 'The secret is making the boring stuff autonomous so you can focus on the work that actually moves the needle.' },
  ],
  music_path: 'music/downloads/ig-702042042124440.mp3',
  cta_handle: '@isaiahdupree',
  cta_display: 'Follow for more →',
  accent: '#a78bfa',
  totalFrames: 600,
};

export const PODCAST_CLIP_FPS    = 30;
export const PODCAST_CLIP_FRAMES = 600; // 20s default
