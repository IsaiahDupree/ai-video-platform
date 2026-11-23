/**
 * PrintPackLaunch — vertical 1080x1920 launch reel for a 3D print library
 * release wave. Hook card → one beat per release (image with slow zoom/pan,
 * name, one-line benefit, status or credit line) → CTA card.
 * All copy comes from props (src/props.json); remix credits are always drawn.
 */
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import type { PrintPackProps, Release } from './types';

const { fontFamily } = loadFont('normal', { weights: ['400', '600', '700', '800'], subsets: ['latin'] });

const C = {
  bg: '#18191e',
  // Matches the cover-card background (rgb 24,26,30) so cropped cover images blend into the card.
  card: '#181a1e',
  line: 'rgba(255,255,255,0.10)',
  ink: '#f3f5f7',
  body: '#c7ccd4',
  muted: '#8b919a',
  accent: '#78beff',
  amber: '#fac45a',
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Fade + rise for a text element that enters at `start`. */
const useEnter = (start: number, dist = 36) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: { damping: 200 }, durationInFrames: 16 });
  return { opacity: s, transform: `translateY(${(1 - s) * dist}px)` };
};

/** Scene-level fade out over the final `len` frames. */
const useExit = (duration: number, len = 8) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [duration - len, duration], [1, 0], clamp);
};

const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.accent }) => (
  <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 5, textTransform: 'uppercase', color }}>{children}</div>
);

const Thumb: React.FC<{ src: string; w: number; h: number; radius: number; pad: number; style?: React.CSSProperties }> = ({ src, w, h, radius, pad, style }) => (
  <div style={{
    width: w, height: h, borderRadius: radius, background: C.card, border: `1px solid ${C.line}`,
    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
  }}>
    <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: pad }} />
  </div>
);

// ── hook ──────────────────────────────────────────────────────────────────────
const Hook: React.FC<{ p: PrintPackProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = useExit(p.timing.hook);
  const eyebrow = useEnter(0);
  const t1 = useEnter(3);
  const t2 = useEnter(7);
  const note = useEnter(20);
  const TW = 300, TH = 225, GAP = 24;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={{ position: 'absolute', top: 390, left: 80, right: 80 }}>
        <div style={eyebrow}><Eyebrow>{p.hook.eyebrow}</Eyebrow></div>
        <div style={{ ...t1, marginTop: 28, fontSize: 124, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3, color: C.ink }}>
          <span style={{ color: C.accent }}>{p.hook.titleNumber}</span> {p.hook.titleRest}
        </div>
        <div style={{ ...t2, fontSize: 124, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3, color: C.ink }}>
          {p.hook.titleLine2}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 850, left: (1080 - (TW * 3 + GAP * 2)) / 2, width: TW * 3 + GAP * 2, display: 'flex', flexWrap: 'wrap', gap: GAP }}>
        {p.releases.map((r, i) => {
          const s = spring({ frame: frame - (8 + i * 3), fps, config: { damping: 14, mass: 0.6 }, durationInFrames: 20 });
          return (
            <Thumb key={r.id} src={r.image} w={TW} h={TH} radius={22} pad={14}
              style={{ opacity: interpolate(s, [0, 1], [0, 1], clamp), transform: `scale(${0.85 + 0.15 * s})` }} />
          );
        })}
      </div>
      <div style={{ ...note, position: 'absolute', top: 1400, left: 80, right: 80, fontSize: 42, fontWeight: 700, color: C.amber }}>
        {p.hook.note}
      </div>
    </AbsoluteFill>
  );
};

// ── one release beat ──────────────────────────────────────────────────────────
const Beat: React.FC<{ r: Release; index: number; total: number; duration: number }> = ({ r, index, total, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = useExit(duration);
  const cardIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
  const zoom = interpolate(frame, [0, duration], [1.0, 1.09], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const panX = interpolate(frame, [0, duration], index % 2 === 0 ? [-16, 16] : [16, -16], clamp);
  const title = useEnter(5);
  const sub = useEnter(9);
  const benefit = useEnter(12);
  const note = useEnter(18);
  const isCredit = r.noteKind === 'credit';
  const chipColor = r.kind === 'Original' ? C.accent : C.amber;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {/* top bar */}
      <div style={{ position: 'absolute', top: 200, left: 72, right: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow color={C.muted}>
          New release <span style={{ color: C.accent }}>{String(index + 1).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}
        </Eyebrow>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: chipColor, border: `2px solid ${chipColor}`, borderRadius: 999, padding: '8px 22px' }}>
          {r.kind}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 274, left: 72, right: 72, display: 'flex', gap: 10 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= index ? C.accent : 'rgba(255,255,255,0.12)' }} />
        ))}
      </div>
      {/* image card */}
      <div style={{
        position: 'absolute', top: 324, left: 60, width: 960, height: 780, borderRadius: 36, overflow: 'hidden',
        background: C.card, border: `1px solid ${C.line}`, opacity: cardIn, transform: `scale(${0.96 + 0.04 * cardIn})`,
      }}>
        <Img src={staticFile(r.image)} style={{
          width: '100%', height: '100%', objectFit: 'contain', padding: 32,
          transform: `translateX(${panX}px) scale(${zoom})`,
        }} />
      </div>
      {/* copy */}
      <div style={{ position: 'absolute', top: 1148, left: 72, width: 936 }}>
        <div style={{ ...title, fontSize: 70, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5, color: C.ink }}>{r.title}</div>
        {r.subtitle ? (
          <div style={{ ...sub, marginTop: 10, fontSize: 48, fontWeight: 700, color: C.accent }}>{r.subtitle}</div>
        ) : null}
        <div style={{ ...benefit, marginTop: 22, fontSize: 44, fontWeight: 400, lineHeight: 1.28, color: r.subtitle ? C.body : C.accent }}>{r.benefit}</div>
        <div style={{ ...note, marginTop: 30, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, background: C.amber, flexShrink: 0 }} />
          <div style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.3, color: C.amber }}>
            {isCredit ? <span style={{ color: C.muted, fontWeight: 700 }}>Credit · </span> : null}
            {r.note}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── closing CTA ───────────────────────────────────────────────────────────────
const Cta: React.FC<{ p: PrintPackProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l1 = useEnter(4);
  const l2 = useEnter(9);
  const url = useEnter(16);
  const note = useEnter(22);
  const brand = useEnter(28);
  const TW = 150, TH = 112, GAP = 12;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 420, left: (1080 - (TW * 6 + GAP * 5)) / 2, display: 'flex', gap: GAP }}>
        {p.releases.map((r, i) => {
          const s = spring({ frame: frame - i * 2, fps, config: { damping: 200 }, durationInFrames: 14 });
          return <Thumb key={r.id} src={r.image} w={TW} h={TH} radius={16} pad={8} style={{ opacity: s, transform: `translateY(${(1 - s) * 20}px)` }} />;
        })}
      </div>
      <div style={{ position: 'absolute', top: 640, left: 80, right: 80 }}>
        <div style={{ ...l1, fontSize: 116, fontWeight: 800, lineHeight: 1.04, letterSpacing: -3, color: C.ink }}>{p.cta.line1}</div>
        <div style={{ ...l2, marginTop: 18, fontSize: 64, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1, color: C.accent }}>{p.cta.line2}</div>
      </div>
      <div style={{ ...url, position: 'absolute', top: 1050, left: 60, right: 60, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          fontSize: 40, fontWeight: 600, color: C.ink, background: C.card, border: `2px solid ${C.accent}`,
          borderRadius: 999, padding: '30px 40px', whiteSpace: 'nowrap',
        }}>
          {p.cta.url}
        </div>
      </div>
      <div style={{ ...note, position: 'absolute', top: 1250, left: 80, right: 80, fontSize: 60, fontWeight: 700, color: C.amber }}>
        {p.cta.note}
      </div>
      <div style={{ ...brand, position: 'absolute', top: 1360, left: 80, right: 80, fontSize: 36, fontWeight: 600, color: C.muted }}>
        {p.cta.brand}
      </div>
    </AbsoluteFill>
  );
};

export const PrintPackLaunch: React.FC<PrintPackProps> = (p) => {
  const { durationInFrames } = useVideoConfig();
  const { hook, beat, cta } = p.timing;
  const vol = p.music?.volume ?? 0;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.ink }}>
      {p.music ? (
        <Audio
          src={staticFile(p.music.src)}
          volume={(f) => interpolate(f, [0, 12, durationInFrames - 36, durationInFrames - 1], [0, vol, vol, 0], clamp)}
        />
      ) : null}
      <Sequence durationInFrames={hook} name="Hook">
        <Hook p={p} />
      </Sequence>
      {p.releases.map((r, i) => (
        <Sequence key={r.id} from={hook + i * beat} durationInFrames={beat} name={r.id}>
          <Beat r={r} index={i} total={p.releases.length} duration={beat} />
        </Sequence>
      ))}
      <Sequence from={hook + p.releases.length * beat} durationInFrames={cta} name="CTA">
        <Cta p={p} />
      </Sequence>
    </AbsoluteFill>
  );
};
