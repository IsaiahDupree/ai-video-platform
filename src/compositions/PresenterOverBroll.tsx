/**
 * PresenterOverBroll — the foundry's presenter-over-b-roll timeline, rendered here.
 *
 * Driven entirely by props written by foundry/production/compose.py
 * (`presenter_timeline_v1` → `PresenterOverBrollProps`). Nothing is decided in
 * this file: which footage plays when, where the presenter sits, which lane a
 * caption uses and which word is lit are all in the timeline. This component
 * only draws it.
 *
 * Layers, bottom to top:
 *   plate        full-frame opaque presenter (hold_frame) or a blurred plate — always on
 *   background   verified footage segments, each cropped to its action region
 *   presenter    transparent VP9 layer cropped to its stable bounds, placed in the box;
 *                only during footage when hold_frame is on
 *   captions     one phrase at a time, the spoken word highlighted, in the phrase's lane
 *   audio        the presenter master's own track, nothing else
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';

const montserrat = loadMontserrat('normal', { weights: ['800'], subsets: ['latin'] });

/** props carry paths relative to the render's public dir; URLs pass through */
const asset = (src: string): string =>
  /^(https?:|blob:|data:)/.test(src) ? src : staticFile(src);

export type Box = { x: number; y: number; w: number; h: number };

export type PobBackground = {
  out_start: number;
  out_end: number;
  src: string;
  src_start: number;
  clip_w: number;
  clip_h: number;
  crop: Box;
  /** "cover" crops to the action region; "contain_blur" keeps the clip whole with a blurred copy behind */
  fit?: 'cover' | 'contain_blur';
  /** text a provider's terms require on screen while this clip plays (e.g. "Powered by GIPHY") */
  attribution?: string;
};

export type PobWord = { text: string; start: number; end: number };
export type PobPhrase = {
  start: number;
  end: number;
  words: PobWord[];
  lane: Box;
  /** index of the word to light for the whole phrase (emphasis_mode "stressed") */
  emphasis?: number;
};

export type PresenterOverBrollProps = {
  duration: number;
  fps: number;
  presenter: {
    src: string;
    bounds: Box;
    placement: Box;
    hold_frame: boolean;
    windows: [number, number][];
  };
  plate: { src: string };
  background: PobBackground[];
  captions: {
    style: 'boxed' | 'outline' | 'bb';
    size: number;
    phrases: PobPhrase[];
    uppercase?: boolean;
    /** "spoken": light the word being said; "stressed": light phrase.emphasis for the whole phrase */
    emphasis_mode?: 'spoken' | 'stressed';
    highlight?: string;
  };
  music?: { src: string; volume: number; fade_in?: number; fade_out?: number } | null;
};

const CANVAS_W = 1080;
const CANVAS_H = 1920;

export const presenterOverBrollDefaultProps: PresenterOverBrollProps = {
  duration: 5,
  fps: 25,
  presenter: {
    src: '',
    bounds: { x: 0, y: 0, w: 720, h: 1280 },
    placement: { x: 64, y: 920, w: 315, h: 560 },
    hold_frame: true,
    windows: [],
  },
  plate: { src: '' },
  background: [],
  captions: { style: 'boxed', size: 60, phrases: [] },
};

// ─── footage segment, cropped to its action region and scaled to fill ────────

const Footage: React.FC<{ seg: PobBackground }> = ({ seg }) => {
  const { fps } = useVideoConfig();
  const startFrom = Math.round(seg.src_start * fps);
  if (seg.fit === 'contain_blur') {
    // the whole clip, letterboxed into the frame, over a blurred cover copy of itself
    const s = Math.min(CANVAS_W / seg.clip_w, CANVAS_H / seg.clip_h);
    const w = seg.clip_w * s;
    const h = seg.clip_h * s;
    return (
      <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}>
        <OffthreadVideo
          src={asset(seg.src)}
          startFrom={startFrom}
          muted
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: CANVAS_W,
            height: CANVAS_H,
            objectFit: 'cover',
            filter: 'blur(28px) brightness(0.7)',
            transform: 'scale(1.1)',
          }}
        />
        <OffthreadVideo
          src={asset(seg.src)}
          startFrom={startFrom}
          muted
          style={{ position: 'absolute', left: (CANVAS_W - w) / 2, top: (CANVAS_H - h) / 2 - 120, width: w, height: h }}
        />
      </AbsoluteFill>
    );
  }
  const scale = Math.max(CANVAS_W / seg.crop.w, CANVAS_H / seg.crop.h);
  const vw = seg.clip_w * scale;
  const vh = seg.clip_h * scale;
  // centre the crop region inside the canvas
  const left = -seg.crop.x * scale + (CANVAS_W - seg.crop.w * scale) / 2;
  const top = -seg.crop.y * scale + (CANVAS_H - seg.crop.h * scale) / 2;
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <OffthreadVideo
        src={asset(seg.src)}
        startFrom={startFrom}
        muted
        style={{ position: 'absolute', left, top, width: vw, height: vh }}
      />
    </AbsoluteFill>
  );
};

const Attribution: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: 'absolute',
      left: 40,
      top: 1430,
      padding: '6px 12px',
      borderRadius: 8,
      background: 'rgba(0,0,0,0.55)',
      color: '#fff',
      fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
      fontSize: 26,
      fontWeight: 600,
      letterSpacing: 0.5,
    }}
  >
    {text}
  </div>
);

// ─── the presenter layer in its box ───────────────────────────────────────────

const PresenterBox: React.FC<{
  src: string;
  bounds: Box;
  placement: Box;
  startFrom: number;
}> = ({ src, bounds, placement, startFrom }) => {
  // the master is decoded at its own size; we know its bounds in master pixels
  const scale = placement.w / bounds.w;
  return (
    <div
      style={{
        position: 'absolute',
        left: placement.x,
        top: placement.y,
        width: placement.w,
        height: placement.h,
        overflow: 'hidden',
      }}
    >
      <OffthreadVideo
        src={asset(src)}
        transparent
        muted
        startFrom={startFrom}
        style={{
          position: 'absolute',
          left: -bounds.x * scale,
          top: -bounds.y * scale,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
};

// ─── captions: one phrase, the spoken word lit ───────────────────────────────

const Phrase: React.FC<{
  phrase: PobPhrase;
  style: 'boxed' | 'outline' | 'bb';
  size: number;
  uppercase: boolean;
  emphasisMode: 'spoken' | 'stressed';
  highlight: string;
}> = ({ phrase, style, size, uppercase, emphasisMode, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = phrase.start + frame / fps;
  let lit: number;
  if (emphasisMode === 'stressed') {
    lit = phrase.emphasis ?? -1;
  } else {
    const active = phrase.words.findIndex((w) => t >= w.start && t < w.end);
    lit = active === -1 ? (t >= phrase.end ? phrase.words.length - 1 : 0) : active;
  }
  const lane = phrase.lane;
  const bb = style === 'bb';
  const common: React.CSSProperties = {
    fontFamily: bb ? `${montserrat.fontFamily}, Montserrat, "Arial Black", sans-serif` : 'Inter, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 800,
    fontSize: size,
    lineHeight: 1.15,
    textAlign: 'center',
    letterSpacing: bb ? 0 : -0.5,
    textTransform: uppercase ? 'uppercase' : 'none',
  };
  const outlined = style === 'outline' || bb;
  return (
    <div
      style={{
        position: 'absolute',
        left: lane.x,
        top: lane.y,
        width: lane.w,
        height: lane.h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ ...common, maxWidth: lane.w - 40 }}>
        <span
          style={{
            background: style === 'boxed' ? 'rgba(0,0,0,0.78)' : 'transparent',
            padding: style === 'boxed' ? '6px 14px' : 0,
            borderRadius: 12,
            lineHeight: 1.45,
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
            WebkitTextStroke: outlined ? (bb ? '2.5px rgba(0,0,0,0.95)' : '3px rgba(0,0,0,0.9)') : undefined,
            paintOrder: 'stroke fill',
            textShadow: outlined
              ? bb
                ? '0 4px 0 rgba(0,0,0,0.85), 0 6px 18px rgba(0,0,0,0.7)'
                : '0 3px 12px rgba(0,0,0,0.8)'
              : undefined,
          }}
        >
          {phrase.words.map((w, i) => (
            <span key={i} style={{ color: i === lit ? highlight : '#FFFFFF' }}>
              {i > 0 ? ' ' : ''}
              {w.text}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

// ─── the composition ─────────────────────────────────────────────────────────

export const PresenterOverBroll: React.FC<PresenterOverBrollProps> = (props) => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const { presenter, plate, background, captions } = props;
  const windows: [number, number][] = presenter.hold_frame
    ? presenter.windows
    : [[0, props.duration]];
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b1220' }}>
      {plate.src ? (
        <OffthreadVideo
          src={asset(plate.src)}
          muted
          style={{ width: CANVAS_W, height: CANVAS_H, objectFit: 'cover' }}
        />
      ) : null}

      {background.map((seg, i) => (
        <Sequence
          key={`bg-${i}`}
          from={f(seg.out_start)}
          durationInFrames={Math.max(1, f(seg.out_end) - f(seg.out_start))}
          layout="none"
        >
          <Footage seg={seg} />
          {seg.attribution ? <Attribution text={seg.attribution} /> : null}
        </Sequence>
      ))}

      {presenter.src
        ? windows.map(([s, e], i) => (
            <Sequence key={`pres-${i}`} from={f(s)} durationInFrames={Math.max(1, f(e) - f(s))} layout="none">
              <PresenterBox
                src={presenter.src}
                bounds={presenter.bounds}
                placement={presenter.placement}
                startFrom={f(s)}
              />
            </Sequence>
          ))
        : null}

      {captions.phrases.map((ph, i) => (
        <Sequence
          key={`cap-${i}`}
          from={f(ph.start)}
          durationInFrames={Math.max(1, f(ph.end) - f(ph.start))}
          layout="none"
        >
          <Phrase
            phrase={ph}
            style={captions.style}
            size={captions.size}
            uppercase={captions.uppercase ?? captions.style === 'bb'}
            emphasisMode={captions.emphasis_mode ?? (captions.style === 'bb' ? 'stressed' : 'spoken')}
            highlight={captions.highlight ?? (captions.style === 'bb' ? '#FFE500' : '#FFD60A')}
          />
        </Sequence>
      ))}

      {presenter.src ? <Audio src={asset(presenter.src)} /> : null}
      {props.music && props.music.src ? (
        <Audio
          src={asset(props.music.src)}
          loop
          volume={(frame) => {
            const total = Math.max(1, Math.round(props.duration * fps));
            const fin = Math.max(1, Math.round((props.music?.fade_in ?? 1.0) * fps));
            const fout = Math.max(1, Math.round((props.music?.fade_out ?? 2.0) * fps));
            const up = Math.min(1, frame / fin);
            const down = Math.min(1, (total - frame) / fout);
            return props.music!.volume * Math.max(0, Math.min(up, down));
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
