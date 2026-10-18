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
  Series,
} from 'remotion';
import { noise2D } from '@remotion/noise';
import type { VoiceSegmentTiming } from './PodcastClip';

// ─── Data contract ─────────────────────────────────────────────────────────────

export interface PresetCard {
  name: string;         // "Podcast Clip"
  category: string;     // "AUDIO"
  accent: string;       // "#a78bfa"
  emoji: string;        // "🎙"
  price: string;        // "$19" | "FREE"
  tag?: string;         // "NEW" | "POPULAR"
}

export interface PresetStoreBrief {
  tagline: string;
  headline: string;
  subheadline: string;
  install_cmd: string;           // "npx add-preset podcast-clip"
  presets: PresetCard[];
  stats: { label: string; value: string }[];
  cta_line: string;              // "Follow to watch it ship →"
  cta_handle: string;
  voiceover_path: string;
  voiceover_segments: VoiceSegmentTiming[];
  music_path?: string;
  totalFrames?: number;
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const BG        = '#060918';
const BG_CARD   = '#0e1628';
const BG_CARD2  = '#111827';
const BORDER    = '#1e293b';
const TEXT      = '#f8fafc';
const TEXT_DIM  = '#64748b';
const BLUE      = '#3b82f6';
const AMBER     = '#f59e0b';
const GREEN     = '#10b981';
const SANS      = 'Inter, system-ui, -apple-system, sans-serif';
const MONO      = '"JetBrains Mono", "Fira Code", monospace';

// ─── Sidechain ─────────────────────────────────────────────────────────────────

function sidechain(frame: number, segs: VoiceSegmentTiming[]): number {
  const DUCK = 0.07, FULL = 0.40, ATK = 6, REL = 18;
  for (const s of segs) {
    const a = s.startFrame - ATK, r = s.endFrame + REL;
    if (frame >= a && frame < s.startFrame)
      return interpolate(frame, [a, s.startFrame], [FULL, DUCK], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: t => t * t });
    if (frame >= s.startFrame && frame <= s.endFrame) return DUCK;
    if (frame > s.endFrame && frame <= r)
      return interpolate(frame, [s.endFrame, r], [DUCK, FULL], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: t => 1 - (1-t)**2 });
  }
  return FULL;
}

// ─── Motion primitives ─────────────────────────────────────────────────────────

const fi = (f: number, d = 0, dur = 12) =>
  interpolate(f - d, [0, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const su = (f: number, d = 0, dist = 30) =>
  interpolate(f - d, [0, 18], [dist, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const sl = (f: number, d = 0, dist = 40) =>
  interpolate(f - d, [0, 18], [-dist, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const sn = (f: number, d = 0, fps = 30) =>
  spring({ frame: f - d, fps, config: { stiffness: 280, damping: 22 } });

// ─── Scene 1: Hook ─────────────────────────────────────────────────────────────
// "What if buying a Remotion video template was as easy as npm install?"

const SceneHook: React.FC<{ brief: PresetStoreBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isShorts = height > width;
  const u = (isShorts ? width : height) / 100;

  // Floating "npm install" terminal line
  const terminalAppear = 20;
  const termScale = sn(frame, terminalAppear, fps);

  // Tagline pulse
  const tagPulse = 0.85 + Math.sin(frame * 0.06) * 0.15;

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: u * 3, padding: `0 ${u * 5}px` }}>

      {/* Category tag */}
      <div style={{
        opacity: fi(frame, 5, 10),
        transform: `translateY(${su(frame, 5, 20)}px)`,
        background: `${BLUE}22`,
        border: `1px solid ${BLUE}55`,
        borderRadius: 99,
        padding: `${u * 0.6}px ${u * 2}px`,
        display: 'flex', alignItems: 'center', gap: u * 0.8,
      }}>
        <div style={{ width: u * 0.7, height: u * 0.7, borderRadius: '50%', background: BLUE, boxShadow: `0 0 8px ${BLUE}` }} />
        <span style={{ color: BLUE, fontFamily: MONO, fontSize: u * 1.3, fontWeight: 700, letterSpacing: '0.1em' }}>
          {brief.tagline}
        </span>
      </div>

      {/* Main headline */}
      <h1 style={{
        margin: 0,
        color: TEXT,
        fontFamily: SANS,
        fontSize: isShorts ? u * 5.5 : u * 4.2,
        fontWeight: 900,
        lineHeight: 1.1,
        textAlign: 'center',
        opacity: fi(frame, 10, 15),
        transform: `translateY(${su(frame, 10, 24)}px)`,
        letterSpacing: '-0.02em',
      }}>
        {brief.headline.split('Remotion').map((part, i) =>
          i === 0 ? <span key={i}>{part}</span> : (
            <React.Fragment key={i}>
              <span style={{ color: BLUE, textShadow: `0 0 32px ${BLUE}66` }}>Remotion</span>
              {part}
            </React.Fragment>
          )
        )}
      </h1>

      {/* Subheadline */}
      <p style={{
        margin: 0,
        color: TEXT_DIM,
        fontFamily: SANS,
        fontSize: isShorts ? u * 2.2 : u * 1.7,
        fontWeight: 400,
        textAlign: 'center',
        lineHeight: 1.6,
        maxWidth: '85%',
        opacity: fi(frame, 18, 14),
        transform: `translateY(${su(frame, 18, 16)}px)`,
      }}>
        {brief.subheadline}
      </p>

      {/* Install command */}
      <div style={{
        opacity: fi(frame, terminalAppear, 10),
        transform: `scale(${interpolate(termScale, [0, 1], [0.88, 1])})`,
        background: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: `${u * 1.2}px ${u * 2.5}px`,
        display: 'flex', alignItems: 'center', gap: u * 1.5,
        boxShadow: `0 0 40px ${BLUE}18`,
      }}>
        <span style={{ color: TEXT_DIM, fontFamily: MONO, fontSize: u * 1.4, userSelect: 'none' }}>$</span>
        <span style={{ color: GREEN, fontFamily: MONO, fontSize: isShorts ? u * 1.8 : u * 1.5, fontWeight: 700, letterSpacing: '0.02em' }}>
          {brief.install_cmd}
        </span>
        {/* Blinking cursor */}
        <span style={{
          width: u * 0.2,
          height: u * 1.8,
          background: GREEN,
          opacity: Math.sin(frame * 0.15) > 0 ? 1 : 0,
          display: 'inline-block',
          boxShadow: `0 0 8px ${GREEN}`,
        }} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Preset card grid ─────────────────────────────────────────────────

const PresetCardComp: React.FC<{
  preset: PresetCard;
  index: number;
  frame: number;
  fps: number;
}> = ({ preset, index, frame, fps }) => {
  const delay = index * 10;
  const s = sn(frame, delay, fps);
  const op = fi(frame, delay, 10);
  const hover = 0.97 + Math.sin(frame * 0.04 + index * 1.2) * 0.03;

  return (
    <div style={{
      opacity: op,
      transform: `scale(${interpolate(s, [0, 1], [0.85, 1]) * hover})`,
      background: BG_CARD2,
      border: `1px solid ${preset.accent}33`,
      borderRadius: 16,
      padding: '20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 0 30px ${preset.accent}18`,
      flex: '1 1 0',
      minWidth: 0,
    }}>
      {/* Glow top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${preset.accent}, transparent)`,
      }} />

      {/* Tag badge */}
      {preset.tag && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: preset.tag === 'NEW' ? `${GREEN}22` : `${AMBER}22`,
          border: `1px solid ${preset.tag === 'NEW' ? GREEN : AMBER}44`,
          borderRadius: 6, padding: '2px 7px',
          color: preset.tag === 'NEW' ? GREEN : AMBER,
          fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
        }}>
          {preset.tag}
        </div>
      )}

      {/* Emoji + category */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{preset.emoji}</span>
        <span style={{
          color: preset.accent, fontFamily: MONO, fontSize: 10,
          fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {preset.category}
        </span>
      </div>

      {/* Name */}
      <div style={{
        color: TEXT, fontFamily: SANS, fontSize: 15, fontWeight: 700, lineHeight: 1.2,
      }}>
        {preset.name}
      </div>

      {/* Price */}
      <div style={{
        marginTop: 'auto',
        color: preset.price === 'FREE' ? GREEN : TEXT,
        fontFamily: MONO, fontSize: 18, fontWeight: 800,
      }}>
        {preset.price}
      </div>
    </div>
  );
};

const ScenePresets: React.FC<{ brief: PresetStoreBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isShorts = height > width;
  const u = (isShorts ? width : height) / 100;

  const presets = brief.presets;
  // Layout: 2 per row for Shorts, all in one row for YouTube
  const rows = isShorts
    ? [presets.slice(0, 2), presets.slice(2, 4)]
    : [presets];

  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      padding: `${u * 6}px ${u * 4}px`,
      gap: u * 2.5, justifyContent: 'center',
    }}>
      {/* Section label */}
      <div style={{
        opacity: fi(frame, 0, 12),
        transform: `translateY(${su(frame, 0, 16)}px)`,
        display: 'flex', alignItems: 'center', gap: u * 1.2,
      }}>
        <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${BORDER}, transparent)` }} />
        <span style={{
          color: TEXT_DIM, fontFamily: MONO, fontSize: u * 1.2,
          fontWeight: 600, letterSpacing: '0.12em', whiteSpace: 'nowrap',
        }}>
          AVAILABLE PRESETS
        </span>
        <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${BORDER})` }} />
      </div>

      {/* Cards */}
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: u * 1.5 }}>
          {row.map((preset, i) => (
            <PresetCardComp
              key={preset.name}
              preset={preset}
              index={ri * 2 + i}
              frame={frame}
              fps={fps}
            />
          ))}
        </div>
      ))}

      {/* "+ more coming" line */}
      <div style={{
        opacity: fi(frame, (presets.length) * 10 + 10, 12),
        textAlign: 'center',
        color: TEXT_DIM, fontFamily: MONO, fontSize: u * 1.2,
      }}>
        + community presets coming soon
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: How it works ─────────────────────────────────────────────────────

const StepItem: React.FC<{
  num: string; label: string; detail: string;
  accent: string; delay: number; frame: number; fps: number;
  isShorts: boolean; u: number;
}> = ({ num, label, detail, accent, delay, frame, fps, isShorts, u }) => {
  const s = sn(frame, delay, fps);
  return (
    <div style={{
      opacity: fi(frame, delay, 10),
      transform: `translateX(${sl(frame, delay, 30)}px)`,
      display: 'flex', alignItems: 'flex-start', gap: u * 1.8,
    }}>
      {/* Step number circle */}
      <div style={{
        width: u * 4, height: u * 4, borderRadius: '50%',
        background: `${accent}22`, border: `2px solid ${accent}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transform: `scale(${interpolate(s, [0, 1], [0.7, 1])})`,
        boxShadow: `0 0 16px ${accent}33`,
      }}>
        <span style={{
          color: accent, fontFamily: MONO,
          fontSize: u * 1.6, fontWeight: 800,
        }}>{num}</span>
      </div>
      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: u * 0.4, paddingTop: u * 0.5 }}>
        <span style={{
          color: TEXT, fontFamily: SANS,
          fontSize: isShorts ? u * 2.2 : u * 1.7, fontWeight: 700,
        }}>{label}</span>
        <span style={{
          color: TEXT_DIM, fontFamily: MONO,
          fontSize: isShorts ? u * 1.5 : u * 1.2,
        }}>{detail}</span>
      </div>
    </div>
  );
};

const SceneHowItWorks: React.FC<{ brief: PresetStoreBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isShorts = height > width;
  const u = (isShorts ? width : height) / 100;

  const steps = [
    { num: '01', label: 'Browse the store',   detail: 'Pick a template category — podcast, launch, social', accent: BLUE },
    { num: '02', label: 'Install in one line', detail: brief.install_cmd, accent: GREEN },
    { num: '03', label: 'Drop in your brief',  detail: 'JSON content spec → Claude Code handles the rest', accent: AMBER },
    { num: '04', label: 'Render & ship',       detail: 'Professional MP4 out in under 60 seconds', accent: '#a78bfa' },
  ];

  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      padding: `${u * 6}px ${u * 5}px`,
      gap: isShorts ? u * 3 : u * 2, justifyContent: 'center',
    }}>
      {/* Title */}
      <div style={{
        opacity: fi(frame, 0, 12), transform: `translateY(${su(frame, 0)}px)`,
        marginBottom: u * 1,
      }}>
        <span style={{
          color: TEXT, fontFamily: SANS,
          fontSize: isShorts ? u * 3.5 : u * 2.8, fontWeight: 800,
          letterSpacing: '-0.01em',
        }}>
          How it works
        </span>
      </div>

      {steps.map((step, i) => (
        <StepItem
          key={step.num}
          {...step}
          delay={8 + i * 14}
          frame={frame}
          fps={fps}
          isShorts={isShorts}
          u={u}
        />
      ))}
    </AbsoluteFill>
  );
};

// ─── Scene 4: Stats + CTA ──────────────────────────────────────────────────────

const SceneCTA: React.FC<{ brief: PresetStoreBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isShorts = height > width;
  const u = (isShorts ? width : height) / 100;

  const ctaPulse = 0.95 + Math.sin(frame * 0.08) * 0.05;

  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: `${u * 6}px ${u * 5}px`,
      gap: u * 3,
    }}>
      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: isShorts ? u * 4 : u * 6,
        opacity: fi(frame, 0, 15),
        transform: `translateY(${su(frame, 0, 20)}px)`,
      }}>
        {brief.stats.map((stat, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u * 0.5,
          }}>
            <span style={{
              color: [BLUE, AMBER, GREEN][i % 3],
              fontFamily: MONO,
              fontSize: isShorts ? u * 5 : u * 4,
              fontWeight: 800,
              lineHeight: 1,
              textShadow: `0 0 24px ${[BLUE, AMBER, GREEN][i % 3]}66`,
            }}>
              {stat.value}
            </span>
            <span style={{
              color: TEXT_DIM, fontFamily: SANS,
              fontSize: isShorts ? u * 1.5 : u * 1.1,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{
        width: '80%', height: 1,
        background: `linear-gradient(90deg, transparent, ${BORDER}, transparent)`,
        opacity: fi(frame, 10, 10),
      }} />

      {/* Main CTA text */}
      <div style={{
        opacity: fi(frame, 14, 14),
        transform: `translateY(${su(frame, 14, 20)}px)`,
        textAlign: 'center',
      }}>
        <div style={{
          color: TEXT, fontFamily: SANS,
          fontSize: isShorts ? u * 4 : u * 3,
          fontWeight: 800, lineHeight: 1.2,
          letterSpacing: '-0.02em', marginBottom: u * 1.5,
        }}>
          Building this live.
        </div>
        <div style={{
          color: TEXT_DIM, fontFamily: SANS,
          fontSize: isShorts ? u * 2 : u * 1.6,
          lineHeight: 1.5,
        }}>
          {brief.cta_line}
        </div>
      </div>

      {/* Handle button */}
      <div style={{
        opacity: fi(frame, 22, 12),
        transform: `scale(${ctaPulse}) translateY(${su(frame, 22, 16)}px)`,
        background: BLUE,
        borderRadius: 99,
        padding: `${u * 1.2}px ${u * 3.5}px`,
        boxShadow: `0 0 30px ${BLUE}55, 0 0 60px ${BLUE}22`,
      }}>
        <span style={{
          color: TEXT, fontFamily: SANS,
          fontSize: isShorts ? u * 2.2 : u * 1.8, fontWeight: 700,
        }}>
          {brief.cta_handle}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ─── Shared background ─────────────────────────────────────────────────────────

const Background: React.FC<{ frame: number }> = ({ frame }) => {
  const drift = noise2D('bg', 0, frame * 0.003);
  return (
    <>
      {/* Animated gradient orb */}
      <div style={{
        position: 'absolute',
        top: `${30 + drift * 10}%`, left: `${40 + drift * 8}%`,
        width: '50%', height: '50%',
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${BLUE}0f 0%, transparent 70%)`,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%', right: '5%',
        width: '40%', height: '40%',
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${'#a78bfa'}0a 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(${BORDER}88 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        opacity: 0.5,
        pointerEvents: 'none',
      }} />
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(6,9,24,0.65) 100%)',
        pointerEvents: 'none',
      }} />
    </>
  );
};

// ─── Main composition ──────────────────────────────────────────────────────────

// Scene durations (frames at 30fps)
const SCENE_HOOK     = 270;  // 9s
const SCENE_PRESETS  = 240;  // 8s
const SCENE_HOW      = 270;  // 9s
const SCENE_CTA      = 210;  // 7s

export const PresetStoreLaunchComposition: React.FC<{ brief?: PresetStoreBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const b = brief || DEFAULT_PRESET_STORE_BRIEF;
  const voSegs = b.voiceover_segments || [];

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: SANS, overflow: 'hidden' }}>
      <Background frame={frame} />

      {/* ── Audio ── */}
      {b.voiceover_path && <Audio src={staticFile(b.voiceover_path)} />}
      {b.music_path && (
        <Audio
          src={staticFile(b.music_path)}
          volume={(f) => {
            const fIn  = interpolate(f, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const fOut = interpolate(f, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return sidechain(f, voSegs) * Math.min(fIn, fOut);
          }}
          loop
        />
      )}

      {/* ── Scene sequence ── */}
      <Series>
        <Series.Sequence durationInFrames={SCENE_HOOK}>
          <SceneHook brief={b} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_PRESETS}>
          <ScenePresets brief={b} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_HOW}>
          <SceneHowItWorks brief={b} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_CTA}>
          <SceneCTA brief={b} />
        </Series.Sequence>
      </Series>

      {/* Scene progress indicator */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 6,
      }}>
        {[SCENE_HOOK, SCENE_PRESETS, SCENE_HOW, SCENE_CTA].map((dur, i) => {
          const sceneStart = [0, SCENE_HOOK, SCENE_HOOK + SCENE_PRESETS, SCENE_HOOK + SCENE_PRESETS + SCENE_HOW][i];
          const isActive = frame >= sceneStart && frame < sceneStart + dur;
          const progress = isActive ? (frame - sceneStart) / dur : frame >= sceneStart + dur ? 1 : 0;
          return (
            <div key={i} style={{
              width: isActive ? 24 : 6, height: 4, borderRadius: 2,
              background: isActive ? BLUE : `${BORDER}`,
              overflow: 'hidden',
              transition: 'width 0.2s',
            }}>
              {isActive && (
                <div style={{
                  height: '100%',
                  width: `${progress * 100}%`,
                  background: BLUE,
                  boxShadow: `0 0 6px ${BLUE}`,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Default brief ─────────────────────────────────────────────────────────────

export const DEFAULT_PRESET_STORE_BRIEF: PresetStoreBrief = {
  tagline: 'LAUNCHING SOON',
  headline: 'A marketplace for Remotion video presets',
  subheadline: 'Install a template. Drop in your content brief. Ship a professional video in 60 seconds.',
  install_cmd: 'npx add-preset podcast-clip',
  presets: [
    { name: 'Podcast Clip',     category: 'AUDIO',   accent: '#a78bfa', emoji: '🎙', price: '$19',  tag: 'NEW' },
    { name: 'Dev Vlog',         category: 'DEV',     accent: '#00ff88', emoji: '⚡', price: '$24',  tag: 'POPULAR' },
    { name: 'Product Launch',   category: 'PRODUCT', accent: '#3b82f6', emoji: '🚀', price: '$29' },
    { name: 'Social Ad',        category: 'ADS',     accent: '#f59e0b', emoji: '📢', price: 'FREE' },
  ],
  stats: [
    { label: 'presets', value: '12+' },
    { label: 'formats', value: '4' },
    { label: 'setup time', value: '60s' },
  ],
  cta_line: 'First 50 presets drop when this reaches 1K followers.',
  cta_handle: '@isaiahdupree',
  voiceover_path: 'audio/preset-store-vo-combined.wav',
  voiceover_segments: [],
  music_path: 'music/downloads/ig-702042042124440.mp3',
  totalFrames: SCENE_HOOK + SCENE_PRESETS + SCENE_HOW + SCENE_CTA,
};

export const PRESET_STORE_FRAMES = SCENE_HOOK + SCENE_PRESETS + SCENE_HOW + SCENE_CTA;
export const PRESET_STORE_FPS    = 30;
