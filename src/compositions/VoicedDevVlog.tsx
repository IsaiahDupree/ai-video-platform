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
import { sidechain as sharedSidechain } from '../lib/sidechain';

// ─── Data contract ────────────────────────────────────────────────────────────

export interface VoiceSegmentTiming {
  startFrame: number;
  endFrame: number;
  text: string;
}

export interface UTMParams {
  source: string;       // e.g. 'instagram'
  medium: string;       // e.g. 'reel'
  campaign: string;     // e.g. 'ai_pipe_2026'
  content: string;      // e.g. 'voice_v1'
}

export interface VoicedDevVlogBrief {
  // Content
  hook: string;
  script: string;
  highlights: string[];
  metrics: Record<string, number | string>;
  // Audio
  music_path: string;
  voiceover_path: string;
  voiceover_segments: VoiceSegmentTiming[];
  music_title?: string;
  // UTM tracking
  utm: UTMParams;
  cta_base_url: string;  // e.g. 'isaiahdupree.com/automate'
  cta_display: string;   // short label e.g. 'Link in bio →'
  // Meta
  totalFrames?: number;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG      = '#0d1117';
const BG_CARD = '#161b22';
const GREEN   = '#00ff88';
const CYAN    = '#58d9fa';
const YELLOW  = '#ffd700';
const TEXT    = '#e6edf3';
const TEXT_DIM = '#6e7681';
const BORDER  = '#21262d';
const MONO = '"JetBrains Mono", "Fira Code", monospace';
const SANS = 'Inter, system-ui, sans-serif';

// ─── Sidechaining (using shared utility) ──────────────────────────────────────

const DUCK_LEVEL = 0.10;
const FULL_LEVEL = 0.55;

function sidechain(frame: number, voSegments: VoiceSegmentTiming[]): number {
  return sharedSidechain(frame, voSegments, {
    duckLevel: DUCK_LEVEL,
    fullLevel: FULL_LEVEL,
  });
}

// ─── Motion primitives ────────────────────────────────────────────────────────

const fadeIn = (frame: number, delay = 0, dur = 12) =>
  interpolate(frame - delay, [0, dur], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

const slideUp = (frame: number, delay = 0, dist = 40) =>
  interpolate(frame - delay, [0, 20], [dist, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

const snapScale = (frame: number, delay = 0, fps = 30) =>
  spring({ frame: frame - delay, fps, config: { stiffness: 300, damping: 22 } });

// ─── Particle background ──────────────────────────────────────────────────────

const ParticleField: React.FC<{ count?: number }> = ({ count = 20 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => {
        const bx = noise2D(`px-${i}`, i * 0.15, 0);
        const by = noise2D(`py-${i}`, 0, i * 0.18);
        const drift = noise2D(`pd-${i}`, i * 0.1, frame * 0.004);
        const size = noise2D(`ps-${i}`, i * 0.2, 0) * 3 + 2;
        const x = ((bx + 1) / 2) * width;
        const y = ((by + 1) / 2) * height + drift * 60;
        const a = noise2D(`pa-${i}`, i * 0.3, frame * 0.008) * 0.4 + 0.4;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: x, top: ((y % height) + height) % height,
            width: size, height: size,
            borderRadius: '50%',
            background: GREEN,
            opacity: a * 0.15,
          }} />
        );
      })}
    </div>
  );
};

// ─── Word-by-word reveal ──────────────────────────────────────────────────────

const WordReveal: React.FC<{
  text: string;
  startFrame?: number;
  wordsPerBeat?: number;
  style?: React.CSSProperties;
  highlightWords?: string[];
}> = ({ text, startFrame = 0, wordsPerBeat = 4, style, highlightWords = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');
  return (
    <span style={style}>
      {words.map((word, i) => {
        const delay = startFrame + i * wordsPerBeat;
        const s = spring({ frame: frame - delay, fps, config: { stiffness: 280, damping: 22 } });
        const op = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const isHighlight = highlightWords.some(h => word.toLowerCase().includes(h.toLowerCase()));
        return (
          <span key={i} style={{
            display: 'inline-block',
            opacity: op,
            transform: `translateY(${interpolate(s, [0, 1], [10, 0])}px)`,
            marginRight: '0.28em',
            color: isHighlight ? GREEN : 'inherit',
            fontWeight: isHighlight ? 700 : 'inherit',
          }}>
            {word}
          </span>
        );
      })}
    </span>
  );
};

// ─── UTM lower-third ──────────────────────────────────────────────────────────

const UTMLowerThird: React.FC<{
  brief: VoicedDevVlogBrief;
  appearFrame: number;
}> = ({ brief, appearFrame }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const op = fadeIn(frame, appearFrame, 15);
  const y  = slideUp(frame, appearFrame, 30);

  if (op < 0.01) return null;

  const utmUrl = `${brief.cta_base_url}?utm_source=${brief.utm.source}&utm_medium=${brief.utm.medium}&utm_campaign=${brief.utm.campaign}&utm_content=${brief.utm.content}`;
  const displayUrl = `${brief.cta_base_url}?via=${brief.utm.source}`;

  const isShorts = height > width;
  const bottom = isShorts ? 180 : 60;
  const padH = isShorts ? 32 : 48;
  const padV = isShorts ? 14 : 10;

  return (
    <div style={{
      position: 'absolute',
      bottom,
      left: isShorts ? 24 : 60,
      right: isShorts ? 24 : 60,
      opacity: op,
      transform: `translateY(${y}px)`,
      zIndex: 100,
    }}>
      {/* Bar */}
      <div style={{
        background: 'rgba(0, 255, 136, 0.12)',
        border: `1px solid rgba(0, 255, 136, 0.3)`,
        borderRadius: 12,
        padding: `${padV}px ${padH}px`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        backdropFilter: 'blur(8px)',
      }}>
        {/* CTA label */}
        <span style={{
          color: GREEN,
          fontFamily: MONO,
          fontSize: isShorts ? 22 : 16,
          fontWeight: 700,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}>
          {brief.cta_display}
        </span>
        {/* URL */}
        <span style={{
          color: TEXT,
          fontFamily: MONO,
          fontSize: isShorts ? 18 : 14,
          opacity: 0.9,
          flex: 1,
        }}>
          {displayUrl}
        </span>
        {/* UTM badge */}
        <span style={{
          background: 'rgba(88, 217, 250, 0.15)',
          border: `1px solid rgba(88, 217, 250, 0.25)`,
          borderRadius: 6,
          padding: '2px 8px',
          color: CYAN,
          fontFamily: MONO,
          fontSize: isShorts ? 14 : 11,
          opacity: 0.8,
          whiteSpace: 'nowrap',
        }}>
          {brief.utm.campaign}
        </span>
      </div>
      {/* Full UTM URL (smaller) */}
      <div style={{
        marginTop: 4,
        paddingLeft: padH,
        color: TEXT_DIM,
        fontFamily: MONO,
        fontSize: isShorts ? 13 : 10,
        opacity: op * 0.5,
        wordBreak: 'break-all',
      }}>
        {utmUrl}
      </div>
    </div>
  );
};

// ─── Waveform visualizer (tracks music volume) ────────────────────────────────

const WaveformBar: React.FC<{
  index: number;
  totalBars: number;
  voSegments: VoiceSegmentTiming[];
}> = ({ index, totalBars, voSegments }) => {
  const frame = useCurrentFrame();
  const vol = sidechain(frame, voSegments);
  // Each bar has slight noise offset
  const noise = noise2D(`wf-${index}`, index * 0.3, frame * 0.08) * 0.5 + 0.5;
  const barHeight = vol * noise * 60 + 4;
  const centerX = (index / (totalBars - 1)) * 100;
  const isActive = vol < FULL_LEVEL * 0.8; // lit up when ducked

  return (
    <div style={{
      width: 3,
      height: barHeight,
      borderRadius: 2,
      background: isActive ? CYAN : `rgba(0,255,136,0.4)`,
      transition: 'background 0.1s',
      alignSelf: 'center',
    }} />
  );
};

// ─── Metric chip ──────────────────────────────────────────────────────────────

const MetricChip: React.FC<{
  label: string;
  value: number | string;
  delay: number;
  color?: string;
}> = ({ label, value, delay, color = GREEN }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = fadeIn(frame, delay, 10);
  const s = snapScale(frame, delay, fps);
  return (
    <div style={{
      opacity: op,
      transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
      background: BG_CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 10,
      padding: '12px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
    }}>
      <span style={{
        color,
        fontFamily: MONO,
        fontSize: 28,
        fontWeight: 700,
        lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{
        color: TEXT_DIM,
        fontFamily: SANS,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {label}
      </span>
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────

export const VoicedDevVlogComposition: React.FC<{ brief?: VoicedDevVlogBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const b = brief || DEFAULT_VOICED_BRIEF;
  const isShorts = height > width;
  const unit = (isShorts ? width : height) / 100;

  const voSegments = b.voiceover_segments || [];

  // CTA lower-third: appears after last VO segment (with buffer) or in last 110 frames, whichever is later
  const lastVoFrame = voSegments.length > 0 ? voSegments[voSegments.length - 1].endFrame : 0;
  const ctaAppearFrame = Math.max(lastVoFrame + 20, durationInFrames - 110);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: SANS }}>
      {/* Particle background */}
      <ParticleField count={18} />

      {/* ── Audio: music with true sidechain ── */}
      {b.music_path && (
        <Audio
          src={staticFile(b.music_path)}
          volume={(f) => {
            // Fade in over first 20 frames, fade out over last 20 frames
            const fadeIn = interpolate(f, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const fadeOut = interpolate(f, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const envelope = Math.min(fadeIn, fadeOut);
            return sidechain(f, voSegments) * envelope;
          }}
          loop
        />
      )}

      {/* ── Audio: voiceover ── */}
      {b.voiceover_path && (
        <Audio src={staticFile(b.voiceover_path)} />
      )}

      {/* ── Layout ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        padding: isShorts ? `${unit * 8}px ${unit * 4}px` : `${unit * 5}px ${unit * 6}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}>

        {/* Header */}
        <div style={{
          opacity: fadeIn(frame, 0, 15),
          transform: `translateY(${slideUp(frame, 0, 20)}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: GREEN,
            boxShadow: `0 0 12px ${GREEN}`,
          }} />
          <span style={{
            color: GREEN,
            fontFamily: MONO,
            fontSize: unit * 1.4,
            fontWeight: 600,
            letterSpacing: '0.1em',
          }}>
            SYSTEM ONLINE
          </span>
          <span style={{
            color: TEXT_DIM,
            fontFamily: MONO,
            fontSize: unit * 1.2,
            marginLeft: 'auto',
          }}>
            {new Date().toISOString().slice(0, 10)}
          </span>
        </div>

        {/* Main hook text */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: unit * 2,
        }}>
          <h1 style={{
            margin: 0,
            color: TEXT,
            fontSize: isShorts ? unit * 4.5 : unit * 3.5,
            fontWeight: 800,
            lineHeight: 1.2,
            fontFamily: SANS,
          }}>
            <WordReveal
              text={b.hook}
              startFrame={8}
              wordsPerBeat={3}
              highlightWords={['AI', 'automated', 'pipeline', 'music', 'trending', 'zero']}
            />
          </h1>

          {/* Script segments with timing — each exits when next begins */}
          {voSegments.map((seg, i) => {
            const segDuration = i < voSegments.length - 1
              ? voSegments[i + 1].startFrame - seg.startFrame
              : durationInFrames - seg.startFrame;
            return (
              <Sequence key={i} from={seg.startFrame} durationInFrames={segDuration}>
                <div style={{
                  opacity: fadeIn(frame - seg.startFrame, 0, 8),
                  transform: `translateX(${interpolate(frame - seg.startFrame, [0, 12], [-20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
                  background: 'rgba(0, 255, 136, 0.06)',
                  borderLeft: `3px solid ${GREEN}`,
                  borderRadius: '0 8px 8px 0',
                  padding: `${unit * 0.8}px ${unit * 1.2}px`,
                }}>
                  <span style={{
                    color: TEXT,
                    fontFamily: SANS,
                    fontSize: isShorts ? unit * 2.2 : unit * 1.8,
                    fontStyle: 'italic',
                    opacity: 0.9,
                  }}>
                    "{seg.text}"
                  </span>
                </div>
              </Sequence>
            );
          })}
        </div>

        {/* Metrics row */}
        <div style={{
          display: 'flex',
          gap: unit * 1.5,
          flexWrap: 'wrap',
          marginBottom: unit * 2,
        }}>
          {Object.entries(b.metrics).slice(0, 4).map(([label, value], i) => (
            <MetricChip
              key={label}
              label={label}
              value={value}
              delay={30 + i * 8}
              color={i === 0 ? GREEN : i === 1 ? CYAN : YELLOW}
            />
          ))}
        </div>

        {/* Waveform sidechain visualizer */}
        <div style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          height: 60,
          marginBottom: unit * 1,
          opacity: 0.7,
        }}>
          {Array.from({ length: 40 }, (_, i) => (
            <WaveformBar key={i} index={i} totalBars={40} voSegments={voSegments} />
          ))}
          <span style={{
            color: TEXT_DIM,
            fontFamily: MONO,
            fontSize: unit * 0.9,
            marginLeft: unit,
            whiteSpace: 'nowrap',
          }}>
            ◆ {b.music_title || 'trending audio'}
          </span>
        </div>
      </div>

      {/* UTM CTA lower-third */}
      <UTMLowerThird brief={b} appearFrame={ctaAppearFrame} />

      {/* Subtle vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};

// ─── Default brief (preview mode) ────────────────────────────────────────────

export const DEFAULT_VOICED_BRIEF: VoicedDevVlogBrief = {
  hook: 'I automated my entire content pipeline — music, renders, posting — from a single commit.',
  script: 'AI automation dev vlog — 47 automations this week, zero manual edits.',
  highlights: ['Music selection from 3M+ trending Reels', 'Auto-render + Telegram delivery', 'UTM-tracked CTA in every video'],
  metrics: {
    'Automations': 47,
    'Videos Rendered': 12,
    'Trending Tracks Found': 9,
    'Manual Edits': 0,
  },
  music_path: 'music/downloads/ig-702042042124440.mp3',
  voiceover_path: 'audio/devvlog-vo-combined.wav',
  voiceover_segments: [
    { startFrame: 10,  endFrame: 130, text: 'I automated my entire content pipeline — music selection, video renders, social posting — all from a single commit.' },
    { startFrame: 150, endFrame: 240, text: '47 automations this week. Zero manual edits.' },
    { startFrame: 260, endFrame: 350, text: 'Link in bio for the full breakdown.' },
  ],
  utm: {
    source: 'instagram',
    medium: 'reel',
    campaign: 'ai_pipe_2026',
    content: 'voice_v1',
  },
  cta_base_url: 'isaiahdupree.com/automate',
  cta_display: 'Link in bio →',
  music_title: 'Knockout — Adam Griffith (3.1M Reels)',
  totalFrames: 450,
};

export const VOICED_VLOG_FPS = 30;
export const VOICED_VLOG_FRAMES = 450; // 15s
