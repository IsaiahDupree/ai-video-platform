import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  Series,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { UTMLowerThird, OFFER_CTA_MAP } from '../components/UTMLowerThird';
import { noise2D } from '@remotion/noise';

// ─── Google Fonts ─────────────────────────────────────────────────────────────
// Loaded dynamically via @remotion/google-fonts
// Fallback to system fonts if not available in render environment

// ─── Data contract ────────────────────────────────────────────────────────────

export interface DevVlogRepo {
  name: string;
  emoji: string;
  commitCount: number;
  featCount: number;
  topFeat: string | null;
}

export interface DevVlogBrief {
  days: number;
  period: string;
  totalCommits: number;
  totalFeats: number;
  totalFixes: number;
  hook: string;
  script: string;
  highlights: string[];
  title: string;
  repos: DevVlogRepo[];
  metrics: Record<string, number>;
  voiceover_path?: string;
  music_path?: string;
  music_title?: string;
  hashtags?: string[];
  generatedAt?: string;
  /** Offer type drives the lower-third CTA: 'audit' | 'social_growth' | 'preset_store' */
  offer_mapped?: 'audit' | 'social_growth' | 'preset_store' | string;
  /** Explicit CTA text — overrides offer_mapped if set */
  cta_text?: string;
  /** UTM tag for attribution tracking */
  utm_tag?: string;
}

export interface DevVlogProps {
  brief?: DevVlogBrief;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG        = '#0d1117';   // GitHub Dark
const BG_CARD   = '#161b22';
const BG_CARD2  = '#1c2128';
const GREEN     = '#00ff88';
const GREEN_DIM = '#00cc66';
const CYAN      = '#58d9fa';
const YELLOW    = '#ffd700';
const RED       = '#ff4d6a';
const PURPLE    = '#bc8cff';
const TEXT      = '#e6edf3';
const TEXT_DIM  = '#6e7681';
const BORDER    = '#21262d';

const MONO = '"JetBrains Mono", "Fira Code", "SF Mono", monospace';
const SANS = 'Inter, system-ui, -apple-system, sans-serif';

// ─── Scale helper ─────────────────────────────────────────────────────────────

const useScale = () => {
  const { width, height } = useVideoConfig();
  const isShorts = height > width;
  const unit = (isShorts ? width : height) / 100;
  return { unit, isShorts, width, height };
};

// ─── Motion primitives (Fireship-style snap-in) ───────────────────────────────

const snapIn = (frame: number, delay = 0, fps = 30) =>
  spring({ frame: frame - delay, fps, config: { stiffness: 280, damping: 18 } });

const snapScale = (frame: number, delay = 0, fps = 30) =>
  spring({ frame: frame - delay, fps, config: { stiffness: 320, damping: 20 } });

const fadeIn = (frame: number, delay = 0, dur = 12) =>
  interpolate(frame - delay, [0, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const slideUp = (frame: number, delay = 0, dist = 50) =>
  interpolate(frame - delay, [0, 18], [dist, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const slideRight = (frame: number, delay = 0) =>
  interpolate(frame - delay, [0, 18], [-80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const counterAnim = (frame: number, target: number, delay = 0) => {
  const p = interpolate(frame - delay, [0, 50], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3), // cubic ease-out
  });
  return Math.round(p * target);
};

// ─── Typewriter effect ────────────────────────────────────────────────────────

const Typewriter: React.FC<{
  text: string;
  frame: number;
  delay?: number;
  charsPerFrame?: number;
  style?: React.CSSProperties;
}> = ({ text, frame, delay = 0, charsPerFrame = 2, style }) => {
  const visible = Math.max(0, Math.floor((frame - delay) * charsPerFrame));
  const shown = text.slice(0, visible);
  const showCursor = visible < text.length || Math.floor(frame / 15) % 2 === 0;
  return (
    <span style={style}>
      {shown}
      {showCursor && <span style={{ opacity: 0.8, marginLeft: 1 }}>█</span>}
    </span>
  );
};

// ─── Word-by-word reveal ──────────────────────────────────────────────────────

const WordReveal: React.FC<{
  text: string;
  startFrame?: number;
  wordsPerBeat?: number;
  style?: React.CSSProperties;
  wordStyle?: React.CSSProperties;
}> = ({ text, startFrame = 0, wordsPerBeat = 3, style, wordStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');
  return (
    <span style={style}>
      {words.map((word, i) => {
        const wordDelay = startFrame + i * wordsPerBeat;
        const s = spring({ frame: frame - wordDelay, fps, config: { stiffness: 260, damping: 22 } });
        const op = interpolate(frame - wordDelay, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <span key={i} style={{
            display: 'inline-block',
            opacity: op,
            transform: `translateY(${interpolate(s, [0, 1], [12, 0])}px)`,
            marginRight: '0.28em',
            ...wordStyle,
          }}>
            {word}
          </span>
        );
      })}
    </span>
  );
};

// ─── Noise particle field ─────────────────────────────────────────────────────

const ParticleField: React.FC<{ count?: number; color?: string; opacity?: number }> = ({
  count = 25, color = GREEN, opacity = 0.12,
}) => {
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
        const y = ((by + 1) / 2) * height + drift * 80;
        const a = noise2D(`pa-${i}`, i * 0.3, frame * 0.008) * 0.5 + 0.5;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: x, top: ((y % height) + height) % height,
            width: size, height: size,
            borderRadius: '50%',
            background: color,
            opacity: a * opacity,
            boxShadow: `0 0 ${size * 2}px ${color}`,
          }} />
        );
      })}
    </div>
  );
};

// ─── Noise scanline ───────────────────────────────────────────────────────────

const NoiseScanline: React.FC<{ color?: string }> = ({ color = GREEN }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const y = noise2D('scan', frame * 0.03, 0) * height * 0.4 + frame * 2;
  const opacity = noise2D('scan-op', frame * 0.02, 0) * 0.04 + 0.02;
  return (
    <div style={{
      position: 'absolute',
      top: ((y % height) + height) % height,
      left: 0, right: 0, height: 2,
      background: color, opacity,
      pointerEvents: 'none',
    }} />
  );
};

// ─── Glitch overlay ───────────────────────────────────────────────────────────

const GlitchOverlay: React.FC<{ active?: boolean; intensity?: number }> = ({
  active = true, intensity = 1,
}) => {
  const frame = useCurrentFrame();
  if (!active) return null;
  const shift = noise2D('glitch-x', frame * 0.5, 0) * 12 * intensity;
  const show  = noise2D('glitch-show', frame * 1.2, 0) > 0.7;
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      transform: `translateX(${shift}px)`,
      background: `rgba(0,255,136,0.04)`,
      mixBlendMode: 'screen',
      pointerEvents: 'none',
    }} />
  );
};

// ─── GitHub-style commit grid ─────────────────────────────────────────────────

const CommitGrid: React.FC<{ count: number; color?: string }> = ({ count, color = GREEN }) => {
  const frame = useCurrentFrame();
  const cols = 26;
  const rows = 7;
  const total = cols * rows;
  const filled = Math.min(count, total);
  const cells = Array.from({ length: total }, (_, i) => i);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 3,
    }}>
      {cells.map(i => {
        const threshold = interpolate(frame - 5, [0, 40], [total + 1, total - filled], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const isLit = i >= threshold;
        const noiseVal = noise2D(`cell-${i}`, i * 0.1, 0);
        const cellOpacity = isLit ? 0.5 + noiseVal * 0.5 : 0.08;
        return (
          <div key={i} style={{
            width: 12, height: 12,
            borderRadius: 2,
            background: color,
            opacity: cellOpacity,
            boxShadow: isLit ? `0 0 4px ${color}88` : 'none',
          }} />
        );
      })}
    </div>
  );
};

// ─── Progress ring (SVG) ──────────────────────────────────────────────────────

const ProgressRing: React.FC<{
  value: number;
  max: number;
  size: number;
  color: string;
  label: string;
  valueFontSize: number;
  labelFontSize: number;
  delay?: number;
}> = ({ value, max, size, color, label, valueFontSize, labelFontSize, delay = 0 }) => {
  const frame = useCurrentFrame();
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const pct = interpolate(frame - delay, [0, 40], [0, value / max], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const offset = circ - pct * circ;
  const displayVal = Math.round(pct * value);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BORDER} strokeWidth={8} />
        {/* Fill */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2,
      }}>
        <div style={{ color, fontFamily: MONO, fontWeight: 800, fontSize: valueFontSize, lineHeight: 1 }}>{displayVal}</div>
        <div style={{ color: TEXT_DIM, fontFamily: MONO, fontSize: labelFontSize, textAlign: 'center', lineHeight: 1.2 }}>{label}</div>
      </div>
    </div>
  );
};

// ─── Shared components ────────────────────────────────────────────────────────

const GlowLine: React.FC<{ color?: string; opacity?: number }> = ({ color = GREEN, opacity = 0.5 }) => (
  <div style={{ height: 2, background: color, boxShadow: `0 0 16px ${color}`, opacity, width: '100%', marginTop: 10 }} />
);

// ─── Scene 1: Intro ───────────────────────────────────────────────────────────

const SceneIntro: React.FC<{ brief: DevVlogBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { unit, isShorts, width, height } = useScale();

  const commits = counterAnim(frame, brief.totalCommits, 5);
  const feats   = counterAnim(frame, brief.totalFeats,   8);
  const fixes   = counterAnim(frame, brief.totalFixes,   11);

  const statNum   = unit * (isShorts ? 16 : 13);
  const statLabel = unit * (isShorts ? 3.0 : 2.4);
  const hookSize  = unit * (isShorts ? 5.2 : 4.0);
  const termSize  = unit * (isShorts ? 3.0 : 2.4);
  const topLabel  = unit * (isShorts ? 2.2 : 1.7);
  const pad       = unit * (isShorts ? 7 : 5.5);
  const gridUnit  = unit * (isShorts ? 8 : 6.5);

  const termText = `git log --since="${brief.period}" --oneline | wc -l`;

  // Slam scale for stats (hard snap in)
  const statScale = snapScale(frame, 3);

  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      {/* Particle background */}
      <ParticleField count={30} color={GREEN} opacity={0.10} />
      <NoiseScanline color={GREEN} />
      <GlitchOverlay intensity={0.6} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`,
        backgroundSize: `${gridUnit}px ${gridUnit}px`, opacity: 0.25,
      }} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: `${pad * 0.65}px ${pad}px ${pad * 0.35}px`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        opacity: fadeIn(frame, 0),
      }}>
        <div style={{ color: GREEN, fontSize: topLabel, fontFamily: MONO, letterSpacing: unit * 0.5 }}>◉ DEV VLOG</div>
        <div style={{ color: TEXT_DIM, fontSize: topLabel * 0.9, fontFamily: MONO }}>{brief.period}</div>
      </div>
      <div style={{ position: 'absolute', top: pad * 1.5, left: 0, right: 0 }}>
        <GlowLine color={GREEN} opacity={0.3} />
      </div>

      {/* Center content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: `0 ${pad}px`,
        gap: unit * (isShorts ? 5 : 4),
      }}>

        {/* Big stats — snap in */}
        <div style={{
          display: 'flex', gap: unit * (isShorts ? 8 : 11),
          transform: `scale(${statScale})`,
        }}>
          {[
            { label: 'COMMITS', value: commits, color: GREEN  },
            { label: 'SHIPPED', value: feats,   color: CYAN   },
            { label: 'FIXES',   value: fixes,   color: YELLOW },
          ].map(({ label, value, color }, i) => (
            <div key={label} style={{
              opacity: fadeIn(frame, i * 6),
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: unit * 0.5,
            }}>
              <div style={{
                fontSize: statNum, fontWeight: 900, fontFamily: MONO, color,
                textShadow: `0 0 ${unit * 4}px ${color}66`, lineHeight: 1,
              }}>
                {value}
              </div>
              <div style={{ fontSize: statLabel, color: TEXT_DIM, fontFamily: MONO, letterSpacing: unit * 0.4, textTransform: 'uppercase' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Commit grid */}
        <div style={{ opacity: fadeIn(frame, 20) }}>
          <CommitGrid count={brief.totalCommits} color={GREEN} />
        </div>

        {/* Hook — word by word */}
        <div style={{
          textAlign: 'center', maxWidth: width * 0.88,
          opacity: fadeIn(frame, 25),
        }}>
          <div style={{ fontSize: hookSize, color: TEXT, fontFamily: SANS, fontWeight: 700, lineHeight: 1.35 }}>
            <WordReveal text={brief.hook} startFrame={28} wordsPerBeat={3} />
          </div>
        </div>

        {/* Terminal typewriter */}
        <div style={{
          opacity: fadeIn(frame, 52),
          fontFamily: MONO, fontSize: termSize, color: TEXT_DIM,
          display: 'flex', alignItems: 'center', gap: unit * 0.8,
          background: `${BG_CARD}cc`, border: `1px solid ${BORDER}`,
          borderRadius: unit * 0.8, padding: `${unit * 1.2}px ${unit * 2}px`,
        }}>
          <span style={{ color: GREEN }}>~/dev</span>
          <span style={{ color: TEXT_DIM }}>$</span>
          <Typewriter
            text={termText}
            frame={frame}
            delay={55}
            charsPerFrame={2.5}
            style={{ color: TEXT }}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <GlowLine color={GREEN} opacity={0.25} />
        <div style={{ padding: `${unit * 1.4}px ${pad}px`, opacity: fadeIn(frame, 62), textAlign: 'center' }}>
          <div style={{ color: TEXT_DIM, fontSize: topLabel, fontFamily: MONO, letterSpacing: unit * 0.4 }}>
            BUILDING IN PUBLIC · @isaiahdupree
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Repos ───────────────────────────────────────────────────────────

const SceneRepos: React.FC<{ brief: DevVlogBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { unit, isShorts } = useScale();

  const pad        = unit * (isShorts ? 6 : 5);
  const headerTag  = unit * (isShorts ? 2.5 : 1.9);
  const headerMain = unit * (isShorts ? 6.2 : 4.8);
  const repoName   = unit * (isShorts ? 4.8 : 3.8);
  const repoFeat   = unit * (isShorts ? 3.0 : 2.4);
  const repoStat   = unit * (isShorts ? 7.5 : 5.8);
  const repoStatL  = unit * (isShorts ? 2.0 : 1.6);

  const repos = brief.repos.slice(0, 3);

  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      <ParticleField count={15} color={GREEN} opacity={0.08} />
      <GlitchOverlay intensity={0.4} />

      {/* Header */}
      <div style={{ padding: `${pad}px ${pad}px ${pad * 0.4}px`, opacity: fadeIn(frame, 0) }}>
        <div style={{ color: GREEN, fontSize: headerTag, fontFamily: MONO, letterSpacing: unit * 0.4, marginBottom: unit * 0.8 }}>
          &gt; WHAT SHIPPED
        </div>
        <div style={{ color: TEXT, fontFamily: SANS, fontWeight: 800, fontSize: headerMain, lineHeight: 1.1 }}>
          Active repos this week
        </div>
        <GlowLine color={GREEN} opacity={0.4} />
      </div>

      {/* Cards */}
      <div style={{ padding: `${unit * 1.5}px ${pad}px`, display: 'flex', flexDirection: 'column', gap: unit * 2 }}>
        {repos.map((repo, i) => {
          const delay = i * 12;
          const s = snapIn(frame, delay);
          const tx = interpolate(s, [0, 1], [-60, 0]);
          return (
            <div key={repo.name} style={{
              opacity: fadeIn(frame, delay),
              transform: `translateX(${tx}px)`,
              background: BG_CARD,
              border: `1px solid ${BORDER}`,
              borderLeft: `6px solid ${GREEN}`,
              borderRadius: unit * 1,
              padding: `${unit * 2.8}px ${unit * 3}px`,
              display: 'flex', alignItems: 'center', gap: unit * 3,
              boxShadow: `inset 0 0 ${unit * 3}px ${GREEN}08`,
            }}>
              <div style={{ fontSize: unit * (isShorts ? 7.5 : 6), flexShrink: 0 }}>{repo.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: TEXT, fontFamily: SANS, fontWeight: 700, fontSize: repoName, lineHeight: 1.2 }}>
                  {repo.name}
                </div>
                {repo.topFeat && (
                  <div style={{
                    color: GREEN_DIM, fontFamily: MONO, fontSize: repoFeat,
                    marginTop: unit * 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    ✨ {repo.topFeat}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: unit * 3, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: repoStat, lineHeight: 1 }}>{repo.featCount}</div>
                  <div style={{ color: TEXT_DIM, fontSize: repoStatL, letterSpacing: unit * 0.2, marginTop: unit * 0.3 }}>FEAT</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: CYAN, fontFamily: MONO, fontWeight: 800, fontSize: repoStat, lineHeight: 1 }}>{repo.commitCount}</div>
                  <div style={{ color: TEXT_DIM, fontSize: repoStatL, letterSpacing: unit * 0.2, marginTop: unit * 0.3 }}>CMTS</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Highlights ──────────────────────────────────────────────────────

const SceneHighlights: React.FC<{ brief: DevVlogBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { unit, isShorts } = useScale();

  const pad        = unit * (isShorts ? 6 : 5);
  const headerTag  = unit * (isShorts ? 2.5 : 1.9);
  const headerMain = unit * (isShorts ? 6.2 : 4.8);
  const cardText   = unit * (isShorts ? 4.5 : 3.5);
  const numSize    = unit * (isShorts ? 7 : 5.5);

  const highlights = brief.highlights.slice(0, 3);

  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      <ParticleField count={20} color={CYAN} opacity={0.09} />
      <NoiseScanline color={CYAN} />

      <div style={{ padding: `${pad}px ${pad}px ${pad * 0.4}px`, opacity: fadeIn(frame, 0) }}>
        <div style={{ color: CYAN, fontSize: headerTag, fontFamily: MONO, letterSpacing: unit * 0.4, marginBottom: unit * 0.8 }}>
          &gt; TOP HIGHLIGHTS
        </div>
        <div style={{ color: TEXT, fontFamily: SANS, fontWeight: 800, fontSize: headerMain, lineHeight: 1.1 }}>
          The coolest things
        </div>
        <GlowLine color={CYAN} opacity={0.4} />
      </div>

      <div style={{ padding: `${unit * 1.5}px ${pad}px`, display: 'flex', flexDirection: 'column', gap: unit * (isShorts ? 2.2 : 1.8) }}>
        {highlights.map((h, i) => {
          const delay = i * 14;
          const s = snapIn(frame, delay);
          const ty = interpolate(s, [0, 1], [40, 0]);
          return (
            <div key={i} style={{
              opacity: fadeIn(frame, delay),
              transform: `translateY(${ty}px)`,
              background: BG_CARD2,
              border: `1px solid ${CYAN}33`,
              borderLeft: `6px solid ${CYAN}`,
              borderRadius: unit * 1,
              padding: `${unit * 3}px ${unit * 3.5}px`,
              display: 'flex', gap: unit * 3, alignItems: 'center',
            }}>
              <div style={{
                width: unit * (isShorts ? 9 : 7), height: unit * (isShorts ? 9 : 7),
                background: `${CYAN}18`, borderRadius: unit * 0.8,
                border: `2px solid ${CYAN}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: CYAN, fontWeight: 900, fontFamily: MONO, fontSize: numSize, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ color: TEXT, fontFamily: SANS, fontSize: cardText, fontWeight: 600, lineHeight: 1.4 }}>
                {h}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Metrics (progress rings) ───────────────────────────────────────

const SceneMetrics: React.FC<{ brief: DevVlogBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { unit, isShorts, width } = useScale();

  const pad        = unit * (isShorts ? 6 : 5);
  const headerTag  = unit * (isShorts ? 2.5 : 1.9);
  const headerMain = unit * (isShorts ? 6.2 : 4.8);
  const ringSize   = unit * (isShorts ? 22 : 17);
  const valFont    = unit * (isShorts ? 5.5 : 4.2);
  const lFont      = unit * (isShorts ? 2.0 : 1.6);
  const handleSize = unit * (isShorts ? 5.5 : 4.2);
  const ctaSize    = unit * (isShorts ? 3.0 : 2.4);

  const entries = Object.entries(brief.metrics).filter(([, v]) => v > 0).slice(0, 4);
  const maxVal  = Math.max(...entries.map(([, v]) => v), 1);
  const colors  = [GREEN, CYAN, YELLOW, PURPLE];

  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      <ParticleField count={20} color={YELLOW} opacity={0.07} />
      <NoiseScanline color={YELLOW} />

      <div style={{ padding: `${pad}px ${pad}px ${pad * 0.4}px`, opacity: fadeIn(frame, 0) }}>
        <div style={{ color: YELLOW, fontSize: headerTag, fontFamily: MONO, letterSpacing: unit * 0.4, marginBottom: unit * 0.8 }}>
          &gt; SYSTEM METRICS
        </div>
        <div style={{ color: TEXT, fontFamily: SANS, fontWeight: 800, fontSize: headerMain, lineHeight: 1.1 }}>
          While we were building...
        </div>
        <GlowLine color={YELLOW} opacity={0.35} />
      </div>

      {/* Progress rings grid */}
      <div style={{
        padding: `${unit * 2}px ${pad}px`,
        display: 'flex', flexWrap: 'wrap',
        gap: unit * (isShorts ? 4 : 5),
        justifyContent: 'center',
        opacity: fadeIn(frame, 8),
      }}>
        {entries.map(([label, value], i) => (
          <div key={label} style={{
            opacity: fadeIn(frame, i * 12),
            transform: `scale(${snapScale(frame, i * 12)})`,
          }}>
            <ProgressRing
              value={value}
              max={maxVal}
              size={ringSize}
              color={colors[i % colors.length]}
              label={label.replace(' queued', '\nqueued').replace(' running', '\nrunning')}
              valueFontSize={valFont}
              labelFontSize={lFont}
              delay={i * 12}
            />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        position: 'absolute', bottom: unit * 5, left: 0, right: 0,
        textAlign: 'center', opacity: fadeIn(frame, 55),
      }}>
        <div style={{ color: TEXT_DIM, fontFamily: MONO, fontSize: ctaSize, letterSpacing: unit * 0.35 }}>
          BUILDING IN PUBLIC · EVERY WEEK
        </div>
        <div style={{ color: GREEN, fontFamily: SANS, fontWeight: 800, fontSize: handleSize, marginTop: unit * 0.8 }}>
          @isaiahdupree
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Outro ───────────────────────────────────────────────────────────

const SceneOutro: React.FC<{ brief: DevVlogBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { unit, isShorts, width, height } = useScale();

  const pad      = unit * (isShorts ? 7 : 5.5);
  const bigNum   = unit * (isShorts ? 28 : 22);
  const bigLabel = unit * (isShorts ? 3.8 : 3.0);
  const ctaText  = unit * (isShorts ? 4.2 : 3.4);
  const handle   = unit * (isShorts ? 9 : 7);
  const tagSize  = unit * (isShorts ? 2.6 : 2.0);

  const numScale = snapScale(frame, 4);

  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      <ParticleField count={40} color={GREEN} opacity={0.12} />
      <NoiseScanline color={GREEN} />
      <GlitchOverlay intensity={0.5} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`,
        backgroundSize: `${unit * 7}px ${unit * 7}px`, opacity: 0.22,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: unit * (isShorts ? 4 : 3.5),
        padding: `0 ${pad}px`,
      }}>
        {/* Exploding feat count */}
        <div style={{
          opacity: fadeIn(frame, 0),
          transform: `scale(${numScale})`,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: bigNum, fontWeight: 900, fontFamily: MONO, color: GREEN, lineHeight: 1,
            textShadow: `0 0 ${unit * 6}px ${GREEN}66, 0 0 ${unit * 12}px ${GREEN}22`,
          }}>
            {brief.totalFeats}
          </div>
          <div style={{ fontSize: bigLabel, color: TEXT_DIM, fontFamily: MONO, letterSpacing: unit * 0.6, marginTop: unit * 1.5 }}>
            FEATURES SHIPPED
          </div>
        </div>

        <div style={{ width: '75%' }}><GlowLine color={GREEN} opacity={0.5} /></div>

        {/* CTA — driven by offer_mapped */}
        <div style={{ opacity: fadeIn(frame, 22), textAlign: 'center' }}>
          <div style={{ color: TEXT, fontFamily: SANS, fontSize: ctaText, fontWeight: 500, lineHeight: 1.45 }}>
            <WordReveal
              text={
                brief.cta_text ||
                (brief.offer_mapped ? (OFFER_CTA_MAP[brief.offer_mapped] || OFFER_CTA_MAP['audit']) : 'Follow along — building in public every week.')
              }
              startFrame={25}
              wordsPerBeat={4}
            />
          </div>
          <div style={{ color: GREEN, fontFamily: SANS, fontWeight: 900, fontSize: handle, marginTop: unit * 1.5,
            textShadow: `0 0 ${unit * 3}px ${GREEN}55`,
          }}>
            @isaiahdupree
          </div>
        </div>

        {/* Hashtags */}
        <div style={{
          opacity: fadeIn(frame, 42),
          display: 'flex', gap: unit * 1.5, flexWrap: 'wrap', justifyContent: 'center',
          maxWidth: width * 0.9,
        }}>
          {(brief.hashtags || ['devvlog', 'buildinpublic']).map(tag => (
            <div key={tag} style={{
              padding: `${unit * 0.7}px ${unit * 1.8}px`,
              border: `1px solid ${GREEN}44`, borderRadius: unit * 3,
              color: GREEN_DIM, fontFamily: MONO, fontSize: tagSize,
              background: `${GREEN}08`,
            }}>
              #{tag}
            </div>
          ))}
        </div>
      </div>

      {/* Music credit */}
      {brief.music_title && (
        <div style={{
          position: 'absolute', bottom: unit * 1.5, right: unit * 2.5,
          opacity: fadeIn(frame, 50) * 0.5,
          color: TEXT_DIM, fontFamily: MONO, fontSize: unit * 1.4,
          display: 'flex', alignItems: 'center', gap: unit * 0.5,
        }}>
          <span>♪</span>
          <span>{brief.music_title}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Composition ──────────────────────────────────────────────────────────────

const SCENE_DURATIONS = {
  intro:      90,   // 3s — stat counter + hook
  repos:      90,   // 3s — active repos
  highlights: 90,   // 3s — top highlights
  metrics:    90,   // 3s — progress rings
  outro:      75,   // 2.5s — feat count + CTA
};

export const getTotalDuration = () =>
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0);

// Default brief for Remotion Studio preview
const DEFAULT_BRIEF: DevVlogBrief = {
  days: 14, period: 'Last 14 days',
  totalCommits: 500, totalFeats: 217, totalFixes: 59,
  hook: '500 commits. 217 features shipped. This is what building in public looks like.',
  script: '',
  highlights: [
    'ACTP Worker: 185 commits, 103 features in 14 days',
    'BlogCanvas Coding: 26/26 features — fully shipped',
    'Reddit MCP + Claude skill for autonomous research',
  ],
  title: 'EP1: 217 Features Shipped in 14 Days',
  repos: [
    { name: 'ACD Dashboard',    emoji: '🤖', commitCount: 145, featCount: 72,  topFeat: 'reddit-mcp server + Claude skill' },
    { name: 'ACTP Worker',      emoji: '⚙️', commitCount: 185, featCount: 103, topFeat: 'prospect scoring for $500K-$5M ARR founders' },
    { name: 'Safari Automation',emoji: '🌐', commitCount: 120, featCount: 35,  topFeat: 'LinkedIn + TikTok + Instagram automation' },
  ],
  metrics: {
    'LinkedIn DMs': 131,
    'Videos published': 68,
    'Daemons running': 11,
    'IG DMs': 45,
  },
  music_path: 'music/lystro-imanu-destiny.aac',
  music_title: 'Its Our Destiny (LYSTRO Remix) — IMANU & KUČKA / LYSTRO',
  hashtags: ['devvlog', 'buildinpublic', 'aiautomation', 'indiehacker'],
};

export const DevVlogComposition: React.FC<DevVlogProps> = ({ brief }) => {
  const b = brief || DEFAULT_BRIEF;
  const totalFrames = getTotalDuration();

  return (
    <AbsoluteFill>
      {/* Background music — ducked under voiceover */}
      {b.music_path && (
        <Audio
          src={staticFile(b.music_path)}
          volume={(f) =>
            interpolate(
              f,
              [0, 20, totalFrames - 20, totalFrames],
              [0, b.voiceover_path ? 0.18 : 0.6, b.voiceover_path ? 0.18 : 0.6, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )
          }
          loop
        />
      )}
      {/* Voiceover on top */}
      {b.voiceover_path && <Audio src={staticFile(b.voiceover_path)} />}
      <Series>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.intro}>
          <SceneIntro brief={b} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.repos}>
          <SceneRepos brief={b} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.highlights}>
          <SceneHighlights brief={b} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.metrics}>
          <SceneMetrics brief={b} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.outro}>
          <SceneOutro brief={b} />
        </Series.Sequence>
      </Series>

      {/* UTM Lower Third — appears in last 3s of video, driven by offer_mapped */}
      {(b.offer_mapped || b.cta_text) && (
        <UTMLowerThird
          offer_mapped={b.offer_mapped}
          cta_text={b.cta_text}
          utm_tag={b.utm_tag}
          startFrame={totalFrames - 90}
          durationFrames={90}
        />
      )}
    </AbsoluteFill>
  );
};
