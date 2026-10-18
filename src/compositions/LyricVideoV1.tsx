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
  Easing,
} from 'remotion';

// ─── LyricVideoV1 ───────────────────────────────────────────────────────────
// Forked from SEODocumentaryV2 for the Venom Valentine music catalog.
//
// Differences vs the documentary fork:
//   • Plays the SONG as the Audio track (not a narration voiceover).
//   • Karaoke-style lyric captions driven by per-line timings (startMs/endMs),
//     reusing SEODocumentaryV2's word-highlight approach split into words.
//   • Moody neon / gothic / dark-romance / cosmic backplates with Ken-Burns
//     reveal; animated gradient fallback when no backplates are provided.
//   • Documentary-only scene types (title_card chapters, timeline) are dropped.
//
// Matches the repo's Remotion 4.x import/style conventions exactly (inline
// CSS font-family strings, staticFile(), useCurrentFrame, AbsoluteFill, Audio,
// Sequence, interpolate, spring, useVideoConfig, Easing).

// ─── Prop Schema ──────────────────────────────────────────────────────────────
export interface LyricLine {
  text: string;
  startMs: number;  // line start time in milliseconds (relative to song start)
  endMs: number;    // line end time in milliseconds
}

export type LyricVisualStyle = 'neon' | 'gothic' | 'dark_romance' | 'cosmic';

export interface LyricVideoV1Props {
  audioSrc: string;            // staticFile-relative path to the song audio
  lyrics: LyricLine[];         // timed lyric lines (ms)
  backplates?: string[];       // staticFile-relative image paths; cycled across the song
  title: string;
  artist: string;
  visualStyle?: LyricVisualStyle;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const FPS  = 30;
const SANS = '"Inter", system-ui, sans-serif';
const MONO = '"JetBrains Mono", "Courier New", monospace';
const sec  = (s: number) => Math.round(s * FPS);
const ms   = (m: number) => Math.round((m / 1000) * FPS);

// Crossfade overlap between backplate scenes (frames)
const CROSSFADE_FRAMES = 12;
// Trailing pad after the final lyric so the song/outro can breathe (frames)
const OUTRO_PAD_FRAMES = sec(4);

// ─── Visual-style palettes (moody neon / gothic / dark-romance / cosmic) ──────
interface StylePalette {
  bg: string;
  bg2: string;
  accent: string;
  accent2: string;
  glow: string;
}

const STYLE_PALETTES: Record<LyricVisualStyle, StylePalette> = {
  // Moody neon — electric magenta + cyan over near-black
  neon: { bg: '#070010', bg2: '#12001f', accent: '#ff2bd6', accent2: '#22e0ff', glow: '#ff2bd6' },
  // Gothic — deep crimson + bone over charcoal
  gothic: { bg: '#0a0608', bg2: '#170a0e', accent: '#c01e3c', accent2: '#e8d6c8', glow: '#c01e3c' },
  // Dark romance — wine + rose-gold over plum-black
  dark_romance: { bg: '#0c0610', bg2: '#1a0c18', accent: '#e0608a', accent2: '#d8a06a', glow: '#e0608a' },
  // Cosmic — violet + teal nebula over space-black
  cosmic: { bg: '#04060f', bg2: '#0a0c24', accent: '#8a5cff', accent2: '#2effc6', glow: '#8a5cff' },
};

const resolvePalette = (style?: LyricVisualStyle): StylePalette =>
  STYLE_PALETTES[style ?? 'neon'] ?? STYLE_PALETTES.neon;

// ─── Seeded pseudo-random (reproducible) ─────────────────────────────────────
const seededRandom = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

// ─── Dynamic Ken Burns (pan + zoom with direction variation) ─────────────────
// Identical math to SEODocumentaryV2 so backplate motion matches the house look.
const dynamicKenBurns = (localFrame: number, totalFrames: number, seed: number) => {
  const r = seededRandom(seed);
  const r2 = seededRandom(seed + 42);
  const zoomEnd = 1.08 + r * 0.06;
  const scale = interpolate(localFrame, [0, totalFrames], [1.0, zoomEnd], { extrapolateRight: 'clamp' });
  const panX = interpolate(localFrame, [0, totalFrames], [0, (r - 0.5) * 6], { extrapolateRight: 'clamp' });
  const panY = interpolate(localFrame, [0, totalFrames], [0, (r2 - 0.5) * 4], { extrapolateRight: 'clamp' });
  return { scale, translateX: panX, translateY: panY };
};

// ─── Crossfade wrapper (reused from SEODocumentaryV2) ─────────────────────────
const SceneCrossfade: React.FC<{
  localFrame: number;
  totalFrames: number;
  children: React.ReactNode;
}> = ({ localFrame, totalFrames, children }) => {
  const fadeIn = interpolate(localFrame, [0, CROSSFADE_FRAMES], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(localFrame, [totalFrames - CROSSFADE_FRAMES, totalFrames], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: Math.min(fadeIn, fadeOut) }}>
      {children}
    </div>
  );
};

// ─── Animated gradient fallback (no backplate) ────────────────────────────────
// Slow rotating dual-radial nebula in the style's palette. Pure CSS transform
// driven by useCurrentFrame so it renders deterministically.
const AnimatedGradient: React.FC<{ palette: StylePalette }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const drift = (frame / FPS) * 6; // ~6deg/sec slow rotation
  const breathe = 0.5 + 0.5 * Math.sin(frame / FPS / 4); // ~8s breathe cycle
  const blobScale = interpolate(breathe, [0, 1], [1.0, 1.15]);

  return (
    <AbsoluteFill style={{ background: palette.bg, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: '-20%',
        transform: `rotate(${drift}deg) scale(${blobScale})`,
        transformOrigin: 'center',
        background: `radial-gradient(circle at 30% 35%, ${palette.accent}33 0%, transparent 45%),`
          + ` radial-gradient(circle at 72% 68%, ${palette.accent2}2e 0%, transparent 50%),`
          + ` radial-gradient(circle at 50% 50%, ${palette.bg2} 0%, ${palette.bg} 80%)`,
      }} />
      {/* Subtle vignette for caption legibility */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
      }} />
    </AbsoluteFill>
  );
};

// ─── Backplate scene (image_reveal / Ken-Burns) ───────────────────────────────
const BackplateScene: React.FC<{
  imageFile: string;
  palette: StylePalette;
  localFrame: number;
  totalFrames: number;
  sceneIndex: number;
}> = ({ imageFile, palette, localFrame, totalFrames, sceneIndex }) => {
  const { fps } = useVideoConfig();
  const imgIn = spring({ frame: localFrame, fps, config: { damping: 25, stiffness: 50 } });
  const kb = dynamicKenBurns(localFrame, totalFrames, sceneIndex);

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {/* Full-bleed image with dynamic Ken Burns */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${kb.scale}) translate(${kb.translateX}%, ${kb.translateY}%)`,
        transformOrigin: 'center center',
        opacity: imgIn,
      }}>
        <img
          src={staticFile(imageFile)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Color-graded wash in the style's accent for cohesion */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, ${palette.bg}aa 0%, transparent 30%, transparent 55%, ${palette.bg}dd 100%)`,
        mixBlendMode: 'multiply',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 60%, transparent 35%, ${palette.bg}cc 100%)`,
      }} />
    </AbsoluteFill>
  );
};

// ─── Backplate layer ──────────────────────────────────────────────────────────
// Cycles provided backplates across the full song length with crossfades.
// Falls back to the animated gradient when no backplates exist.
const BackplateLayer: React.FC<{
  backplates: string[] | undefined;
  palette: StylePalette;
  totalFrames: number;
}> = ({ backplates, palette, totalFrames }) => {
  const frame = useCurrentFrame();

  if (!backplates || backplates.length === 0) {
    return <AnimatedGradient palette={palette} />;
  }

  // Evenly divide the song across backplates so each gets equal screen time.
  const perPlate = Math.max(1, Math.floor(totalFrames / backplates.length));

  return (
    <AbsoluteFill>
      {/* Base gradient sits under crossfade gaps for safety */}
      <AnimatedGradient palette={palette} />
      {backplates.map((img, i) => {
        const from = i * perPlate;
        const dur = i === backplates.length - 1 ? totalFrames - from : perPlate + CROSSFADE_FRAMES;
        if (from >= totalFrames) return null;
        return (
          <Sequence key={`${img}-${i}`} from={from} durationInFrames={dur}>
            <SceneCrossfade localFrame={frame - from} totalFrames={dur}>
              <BackplateScene
                imageFile={img}
                palette={palette}
                localFrame={frame - from}
                totalFrames={dur}
                sceneIndex={i}
              />
            </SceneCrossfade>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Karaoke lyric caption ──────────────────────────────────────────────────
// Reuses SEODocumentaryV2's word-highlight idea: the active line is split into
// words and the "spoken so far" portion is highlighted by linear progress
// through the line's [startMs, endMs] window. The previous line ghosts above
// and the next line previews below for sing-along readability.
const LyricCaption: React.FC<{
  lyrics: LyricLine[];
  palette: StylePalette;
}> = ({ lyrics, palette }) => {
  const frame = useCurrentFrame();
  const timeMs = (frame / FPS) * 1000;

  if (!lyrics || lyrics.length === 0) return null;

  // Find the active line (current time falls inside its window). If between
  // lines, anchor to the most recent line that has started.
  let activeIdx = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (timeMs >= lyrics[i].startMs && timeMs <= lyrics[i].endMs) { activeIdx = i; break; }
    if (timeMs > lyrics[i].endMs) activeIdx = i;
  }
  if (activeIdx === -1) return null; // song hasn't reached the first line yet

  const active = lyrics[activeIdx];
  const prev = lyrics[activeIdx - 1];
  const next = lyrics[activeIdx + 1];

  const isSinging = timeMs >= active.startMs && timeMs <= active.endMs;
  const lineProgress = isSinging
    ? interpolate(timeMs, [active.startMs, active.endMs], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 1;

  // Word-level highlight: distribute progress across the active line's words.
  const words = active.text.trim().split(/\s+/).filter(Boolean);
  const sungCount = Math.round(lineProgress * words.length);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', left: '8%', right: '8%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
        zIndex: 100,
      }}>
        {/* Previous line — ghosted above */}
        {prev && (
          <div style={{
            fontFamily: SANS, fontSize: 34, fontWeight: 500,
            color: `${palette.accent2}66`, textAlign: 'center', lineHeight: 1.3,
            textShadow: '0 2px 16px rgba(0,0,0,0.85)',
          }}>
            {prev.text}
          </div>
        )}

        {/* Active line — karaoke word highlight */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12,
        }}>
          {words.map((w, i) => {
            const sung = i < sungCount;
            return (
              <span
                key={`${i}-${w}`}
                style={{
                  fontFamily: SANS, fontSize: 60, fontWeight: 800,
                  letterSpacing: '-0.01em', lineHeight: 1.25,
                  color: sung ? '#ffffff' : `${palette.accent2}99`,
                  textShadow: sung
                    ? `0 0 28px ${palette.glow}cc, 0 2px 20px rgba(0,0,0,0.9)`
                    : '0 2px 18px rgba(0,0,0,0.9)',
                  transition: 'none',
                }}
              >
                {w}
              </span>
            );
          })}
        </div>

        {/* Next line — preview below */}
        {next && (
          <div style={{
            fontFamily: SANS, fontSize: 34, fontWeight: 500,
            color: `${palette.accent2}44`, textAlign: 'center', lineHeight: 1.3,
            textShadow: '0 2px 16px rgba(0,0,0,0.85)',
          }}>
            {next.text}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── Title / artist plate (entrance + outro) ──────────────────────────────────
// Shown before the first lyric and again over the outro pad. Replaces the
// documentary's title_card chapter scene with a single song header.
const TitlePlate: React.FC<{
  title: string;
  artist: string;
  palette: StylePalette;
  visible: boolean;
}> = ({ title, artist, palette, visible }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame, fps, config: { damping: 22, stiffness: 60 } });
  const opacity = visible ? appear : interpolate(appear, [0, 1], [1, 0]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
      <div style={{ textAlign: 'center', opacity }}>
        <div style={{
          fontFamily: MONO, fontSize: 18, color: palette.accent,
          letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 18,
        }}>
          {artist}
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 96, fontWeight: 900, color: '#ffffff',
          lineHeight: 1.04, letterSpacing: '-0.03em',
          textShadow: `0 0 60px ${palette.glow}88`,
          transform: `translateY(${interpolate(appear, [0, 1], [24, 0])}px)`,
        }}>
          {title}
        </div>
        <div style={{
          height: 3, width: interpolate(appear, [0, 1], [0, 180]),
          background: palette.accent, borderRadius: 2, margin: '28px auto 0',
          boxShadow: `0 0 18px ${palette.glow}`,
        }} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Total-frame calculator ───────────────────────────────────────────────────
// Duration = end of the last lyric line + outro pad. Falls back to a sane
// placeholder (8s) when no lyrics are provided so the composition still mounts.
export const getLyricVideoV1TotalFrames = (props: LyricVideoV1Props): number => {
  const lyrics = props?.lyrics ?? [];
  if (lyrics.length === 0) return sec(8);
  const endMs = lyrics.reduce((max, l) => Math.max(max, l.endMs), 0);
  return ms(endMs) + OUTRO_PAD_FRAMES;
};

// ─── Main composition ─────────────────────────────────────────────────────────
export const LyricVideoV1: React.FC<LyricVideoV1Props> = ({
  audioSrc, lyrics, backplates, title, artist, visualStyle,
}) => {
  const frame = useCurrentFrame();
  const palette = resolvePalette(visualStyle);
  const totalFrames = getLyricVideoV1TotalFrames({ audioSrc, lyrics, backplates, title, artist, visualStyle });

  const firstLyricFrame = lyrics.length > 0 ? ms(lyrics[0].startMs) : sec(2);
  const TITLE_HOLD = sec(3); // title plate lingers a touch into the first line
  const showIntroTitle = frame < firstLyricFrame + TITLE_HOLD;
  const showOutroTitle = frame >= totalFrames - OUTRO_PAD_FRAMES;

  return (
    <AbsoluteFill style={{ background: palette.bg }}>
      {/* The SONG itself — full-length audio track */}
      <Audio src={staticFile(audioSrc)} volume={1} />

      {/* Backplate layer: Ken-Burns images or animated gradient fallback */}
      <BackplateLayer backplates={backplates} palette={palette} totalFrames={totalFrames} />

      {/* Karaoke lyric captions driven by line timings */}
      <LyricCaption lyrics={lyrics} palette={palette} />

      {/* Song header on entrance and over the outro */}
      {showIntroTitle && <TitlePlate title={title} artist={artist} palette={palette} visible={true} />}
      {showOutroTitle && <TitlePlate title={title} artist={artist} palette={palette} visible={false} />}

      {/* Song progress bar (mirrors the documentary's chapter bar) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
        background: 'rgba(255,255,255,0.08)', zIndex: 90,
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min((frame / totalFrames) * 100, 100)}%`,
          background: `linear-gradient(90deg, ${palette.accent}88, ${palette.accent})`,
          boxShadow: `0 0 12px ${palette.glow}66, 0 -2px 8px ${palette.glow}33`,
          borderRadius: '0 2px 2px 0',
        }} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Default Props — Minimal placeholder ────────────────────────────────────
// Real props are always loaded from a JSON file (--props=lyric_props.json).
// This minimal default exists only to satisfy Remotion's composition registration.
export const lyricVideoV1DefaultProps: LyricVideoV1Props = {
  audioSrc: 'venom_audio/placeholder.mp3',
  title: 'Untitled',
  artist: 'Venom Valentine',
  visualStyle: 'neon',
  backplates: [],
  lyrics: [
    { text: 'Provide --props JSON to render', startMs: 0, endMs: 4000 },
  ],
};

export const lyricVideoV1TotalFrames = getLyricVideoV1TotalFrames(lyricVideoV1DefaultProps);
