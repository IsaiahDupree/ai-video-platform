/**
 * Shared engine for silent explainer reels. One persistent 1080x1920 scene;
 * `states` crossfade into each other, edges flow, nodes glide to their new
 * positions, the metric/footers swap, and the payoff word springs in at the
 * end. Two themes: 'blueprint' (deekeej: dark grid, Inter, red→teal) and
 * 'machine' (krishna: black, JetBrains Mono, neon glow, gears/gauges).
 */
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import type { SceneEdge, SceneNode, SceneState, SilentReelProps, Tone } from './types';

const inter = loadInter('normal', { weights: ['400', '600', '800'], subsets: ['latin'] });
const mono = loadMono('normal', { weights: ['400', '700'], subsets: ['latin'] });

// ── theme ────────────────────────────────────────────────────────────────────
interface Theme {
  bg: string; grid: string | null; font: string; ink: string; muted: string;
  tone: Record<Tone, string>; glow: boolean; titleWeight: number; caps: boolean;
}
const THEMES: Record<SilentReelProps['style'], Theme> = {
  blueprint: {
    bg: '#0f1316', grid: 'rgba(255,255,255,0.045)', font: inter.fontFamily, ink: '#f2f4f5',
    muted: '#8d979e', glow: false, titleWeight: 800, caps: false,
    tone: { neutral: '#9aa4ab', bad: '#e5533c', good: '#2fc4b2', accent: '#4f8ff7' },
  },
  machine: {
    bg: '#07080a', grid: null, font: mono.fontFamily, ink: '#eef0f2', muted: '#8a9099',
    glow: true, titleWeight: 700, caps: true,
    tone: { neutral: '#c9b46a', bad: '#ff5c8a', good: '#5ee0b0', accent: '#b48cff' },
  },
};

// ── geometry ─────────────────────────────────────────────────────────────────
const W = 1080, H = 1920;
const BOX = { x: 90, y: 470, w: 900, h: 640 }; // diagram area
const px = (n: SceneNode) => ({ x: BOX.x + n.x * BOX.w, y: BOX.y + n.y * BOX.h });

// ── icons (simple, readable at reel size) ────────────────────────────────────
const Icon: React.FC<{ kind: SceneNode['kind']; color: string; t: Theme; frame: number; value?: number }> = ({ kind, color, t, frame, value }) => {
  const s = 64;
  const stroke = { stroke: color, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const glow = t.glow ? { filter: `drop-shadow(0 0 6px ${color})` } : {};
  switch (kind) {
    case 'user':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><circle cx="32" cy="22" r="11" fill={color} /><path d="M10 58c2-14 11-20 22-20s20 6 22 20z" fill={color} /></svg>;
    case 'db':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><ellipse cx="32" cy="16" rx="20" ry="8" {...stroke} /><path d="M12 16v32c0 4 9 8 20 8s20-4 20-8V16" {...stroke} /><path d="M12 32c0 4 9 8 20 8s20-4 20-8" {...stroke} /></svg>;
    case 'server':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><rect x="12" y="8" width="40" height="14" rx="3" {...stroke} /><rect x="12" y="26" width="40" height="14" rx="3" {...stroke} /><rect x="12" y="44" width="40" height="14" rx="3" {...stroke} /><circle cx="20" cy="15" r="2" fill={color} /><circle cx="20" cy="33" r="2" fill={color} /><circle cx="20" cy="51" r="2" fill={color} /></svg>;
    case 'api':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><rect x="8" y="12" width="48" height="40" rx="6" {...stroke} /><text x="32" y="39" textAnchor="middle" fontSize="18" fontWeight="700" fill={color} fontFamily={t.font}>{'{ }'}</text></svg>;
    case 'queue':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}>{[0, 1, 2, 3].map(i => <rect key={i} x={10 + i * 12} y="20" width="8" height="24" rx="2" fill={color} opacity={0.35 + i * 0.2} />)}</svg>;
    case 'cache':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><path d="M32 6l6 14 15 2-11 10 3 15-13-7-13 7 3-15-11-10 15-2z" {...stroke} /></svg>;
    case 'cloud':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><path d="M18 46h30a10 10 0 000-20 14 14 0 00-27-3 9 9 0 00-3 23z" {...stroke} /></svg>;
    case 'agent':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><rect x="14" y="18" width="36" height="30" rx="8" {...stroke} /><circle cx="25" cy="33" r="3" fill={color} /><circle cx="39" cy="33" r="3" fill={color} /><path d="M32 8v10" {...stroke} /></svg>;
    case 'gate':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><path d="M12 54V14h40v40" {...stroke} /><path d="M12 14h40" {...stroke} /><rect x="24" y="30" width="16" height="24" fill={color} opacity="0.8" /></svg>;
    case 'lock':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><rect x="14" y="28" width="36" height="28" rx="5" {...stroke} /><path d="M22 28v-8a10 10 0 0120 0v8" {...stroke} /></svg>;
    case 'doc':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><path d="M16 6h22l10 10v42H16z" {...stroke} /><path d="M24 30h16M24 40h16" {...stroke} /></svg>;
    case 'bank':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><path d="M8 24L32 10l24 14z" {...stroke} /><path d="M14 24v24M26 24v24M38 24v24M50 24v24M8 50h48" {...stroke} /></svg>;
    case 'shop':
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><path d="M8 24l6-12h36l6 12z" {...stroke} /><path d="M12 24v30h40V24" {...stroke} /><rect x="26" y="38" width="12" height="16" fill={color} opacity="0.8" /></svg>;
    case 'gear': {
      const rot = (frame * 1.4 * (value ?? 1)) % 360;
      return <svg width={s} height={s} viewBox="0 0 64 64" style={{ ...glow, transform: `rotate(${rot}deg)` }}>{Array.from({ length: 10 }).map((_, i) => <rect key={i} x="29" y="2" width="6" height="12" fill={color} transform={`rotate(${i * 36} 32 32)`} />)}<circle cx="32" cy="32" r="18" {...stroke} /><circle cx="32" cy="32" r="6" fill={color} /></svg>;
    }
    case 'gauge': {
      const v = Math.max(0, Math.min(1, value ?? 0));
      const a = -120 + v * 240;
      return <svg width={s} height={s} viewBox="0 0 64 64" style={glow}><path d="M10 44a24 24 0 0144 0" {...stroke} /><line x1="32" y1="44" x2={32 + 20 * Math.sin((a * Math.PI) / 180)} y2={44 - 20 * Math.cos((a * Math.PI) / 180)} stroke={color} strokeWidth="3" strokeLinecap="round" /><circle cx="32" cy="44" r="3" fill={color} /></svg>;
    }
    default:
      return <svg width={s} height={s} viewBox="0 0 64 64"><circle cx="32" cy="32" r="18" {...stroke} /></svg>;
  }
};

// ── edge path ────────────────────────────────────────────────────────────────
const edgePath = (a: { x: number; y: number }, b: { x: number; y: number }, bend = 0) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const cx = mx + nx * bend * len * 0.6, cy = my + ny * bend * len * 0.6;
  return { d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`, mid: { x: (a.x + 2 * cx + b.x) / 4, y: (a.y + 2 * cy + b.y) / 4 } };
};

// ── one state, rendered with an opacity/offset ───────────────────────────────
const StateLayer: React.FC<{ state: SceneState; t: Theme; frame: number; opacity: number; slide: number; nodePos: Map<string, { x: number; y: number }> }> = ({ state, t, frame, opacity, slide, nodePos }) => {
  const toneColor = (tone?: Tone) => t.tone[tone ?? 'neutral'];
  return (
    <AbsoluteFill style={{ opacity, transform: `translateX(${slide}px)` }}>
      <div style={{ position: 'absolute', left: 60, top: 300, fontFamily: t.font, fontSize: 30, letterSpacing: 2, color: toneColor(state.tone), fontWeight: 600, textTransform: 'uppercase' }}>{state.subtitle}</div>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {state.edges.map((e: SceneEdge, i) => {
          const a = nodePos.get(e.from), b = nodePos.get(e.to);
          if (!a || !b) return null;
          const { d, mid } = edgePath(a, b, e.bend ?? 0);
          const color = toneColor(e.tone ?? (e.mode === 'off' ? 'neutral' : 'accent'));
          const mode = e.mode ?? 'flow';
          return (
            <g key={i}>
              <path d={d} stroke={color} strokeWidth={mode === 'off' ? 1.5 : 2.5} fill="none" opacity={mode === 'off' ? 0.25 : mode === 'static' ? 0.35 : 0.9}
                strokeDasharray={mode === 'flow' ? '10 14' : undefined}
                strokeDashoffset={mode === 'flow' ? -frame * 3 : undefined}
                style={t.glow && mode === 'flow' ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined} />
              {e.label && (
                <g>
                  <rect x={mid.x - 6 - e.label.length * 6.2} y={mid.y - 16} width={12 + e.label.length * 12.4} height={30} rx={6} fill={t.bg} stroke={color} strokeWidth={1.5} />
                  <text x={mid.x} y={mid.y + 5} textAnchor="middle" fontSize={18} fontWeight={700} fill={color} fontFamily={t.font} letterSpacing={1}>{e.label}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {state.nodes.map((n: SceneNode) => {
        const p = nodePos.get(n.id)!;
        const color = toneColor(n.tone ?? 'accent');
        return (
          <div key={n.id} style={{ position: 'absolute', left: p.x - 90, top: p.y - 40, width: 180, textAlign: 'center', fontFamily: t.font }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Icon kind={n.kind} color={color} t={t} frame={frame} value={n.value} /></div>
            <div style={{ color: t.ink, fontSize: 24, fontWeight: 700, letterSpacing: t.caps ? 2 : 1, marginTop: 4, textTransform: t.caps ? 'uppercase' : undefined }}>{n.label}</div>
            {n.badge && <div style={{ display: 'inline-block', marginTop: 4, padding: '2px 10px', border: `1.5px solid ${color}`, color, borderRadius: 5, fontSize: 17, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{n.badge}</div>}
            {n.sub && <div style={{ color: t.muted, fontSize: 18, marginTop: 3 }}>{n.sub}</div>}
            {n.readout && <div style={{ marginTop: 6, padding: '6px 10px', border: `2px solid ${color}`, borderRadius: 8, color, fontSize: 22, fontWeight: 700, background: t.bg, boxShadow: t.glow ? `0 0 14px ${color}66` : undefined }}>{n.readout}</div>}
          </div>
        );
      })}
      {state.metric && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: state.metric.big ? 1140 : 1160, textAlign: 'center', fontFamily: t.font }}>
          <div style={{ fontSize: state.metric.big ? 120 : 92, fontWeight: 800, color: toneColor(state.metric.tone ?? 'good'), letterSpacing: -1, textShadow: t.glow ? `0 0 24px ${toneColor(state.metric.tone ?? 'good')}88` : undefined }}>{state.metric.value}</div>
          {state.metric.sub && <div style={{ fontSize: 28, color: t.muted, marginTop: 4 }}>{state.metric.sub}</div>}
        </div>
      )}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1420, fontFamily: t.font }}>
        <div style={{ color: t.ink, fontSize: 30, fontWeight: 700, lineHeight: 1.3 }}>{state.footer}</div>
        {state.footerSub && <div style={{ color: t.muted, fontSize: 25, marginTop: 8, lineHeight: 1.35 }}>{state.footerSub}</div>}
      </div>
    </AbsoluteFill>
  );
};

// ── main ─────────────────────────────────────────────────────────────────────
export const SilentScene: React.FC<SilentReelProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = THEMES[props.style];
  const XF = Math.round(fps * 0.45); // crossfade length

  // state boundaries in frames
  const bounds: { start: number; end: number }[] = [];
  let acc = 0;
  for (const s of props.states) { bounds.push({ start: acc, end: acc + Math.round(s.seconds * fps) }); acc += Math.round(s.seconds * fps); }
  const total = acc;
  let idx = bounds.findIndex(b => frame < b.end);
  if (idx < 0) idx = bounds.length - 1;
  const cur = props.states[idx];
  const prev = idx > 0 ? props.states[idx - 1] : null;
  const into = frame - bounds[idx].start; // frames into current state
  const xf = prev ? interpolate(into, [0, XF], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }) : 1;

  // node positions glide between states for ids that persist
  const posFor = (s: SceneState) => new Map(s.nodes.map(n => [n.id, px(n)]));
  const curPos = posFor(cur);
  const prevPos = prev ? posFor(prev) : null;
  const blended = new Map<string, { x: number; y: number }>();
  for (const [id, p] of curPos) {
    const q = prevPos?.get(id);
    blended.set(id, q ? { x: q.x + (p.x - q.x) * xf, y: q.y + (p.y - q.y) * xf } : p);
  }

  // payoff word: last 40% of final state
  const last = bounds[bounds.length - 1];
  const payoffStart = last.start + Math.round((last.end - last.start) * 0.55);
  const payoffOn = props.payoff && frame >= payoffStart;
  const pop = payoffOn ? spring({ frame: frame - payoffStart, fps, config: { damping: 12, stiffness: 160 } }) : 0;
  const titleTone = t.tone[cur.tone] ?? t.tone.accent;

  return (
    <AbsoluteFill style={{ background: t.bg, fontFamily: t.font, color: t.ink }}>
      {t.grid && <AbsoluteFill style={{ backgroundImage: `linear-gradient(${t.grid} 1px, transparent 1px), linear-gradient(90deg, ${t.grid} 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />}
      {/* title */}
      <div style={{ position: 'absolute', left: 60, top: 215, fontSize: props.style === 'machine' ? 58 : 64, fontWeight: t.titleWeight, letterSpacing: props.style === 'machine' ? 1 : -1, width: props.style === 'machine' ? W - 120 : undefined, textAlign: props.style === 'machine' ? 'center' : 'left' }}>
        <span style={{ color: t.ink }}>{props.title.lead} </span>
        <span style={{ color: titleTone, textShadow: t.glow ? `0 0 18px ${titleTone}88` : undefined }}>{props.title.accent}</span>
      </div>
      {props.question && (
        <div style={{ position: 'absolute', left: 120, right: 120, top: 300, textAlign: 'center' }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 8, background: '#ffffff12', color: t.muted, fontSize: 22, fontStyle: 'italic' }}>{props.question}</span>
        </div>
      )}
      {/* states */}
      {prev && xf < 1 && <StateLayer state={prev} t={t} frame={frame} opacity={1 - xf} slide={-40 * xf} nodePos={prevPos!} />}
      <StateLayer state={cur} t={t} frame={frame} opacity={xf} slide={40 * (1 - xf)} nodePos={blended} />
      {/* payoff */}
      {payoffOn && props.payoff && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1130, textAlign: 'center', transform: `scale(${0.6 + 0.4 * pop})`, opacity: pop }}>
          <div style={{ fontSize: 132, fontWeight: 800, letterSpacing: 4, color: t.tone[props.payoff.tone ?? 'good'], textShadow: t.glow ? `0 0 30px ${t.tone[props.payoff.tone ?? 'good']}` : undefined }}>{props.payoff.word}</div>
          {props.payoff.sub && <div style={{ fontSize: 30, color: t.muted, marginTop: 2 }}>{props.payoff.sub}</div>}
        </div>
      )}
      {props.formula && frame > total - Math.round(fps * 3) && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1570, textAlign: 'center', fontSize: 22, letterSpacing: 2, color: t.tone.neutral, textTransform: 'uppercase' }}>{props.formula}</div>
      )}
      {/* watermark */}
      <div style={{ position: 'absolute', right: 60, bottom: 130, fontSize: 22, color: t.muted, letterSpacing: 1 }}>{props.handle}</div>
      {props.music && <Audio src={staticFile(props.music.file)} volume={props.music.volume ?? 0.35} loop />}
    </AbsoluteFill>
  );
};
