/**
 * UGCCaptionStyles.tsx — UGC-native caption styles inspired by viral IG/TikTok content.
 *
 * Styles included:
 *   ig-story      — Black pill background, 2-3 bold white words, center (IG Stories native)
 *   karaoke-box   — 3-4 words shown; active word gets a colored highlight BOX behind it
 *   word-slam     — ONE word at a time, slams to center huge with spring physics
 *   clean-stroke  — White text, heavy black outline only, no background (creator POV style)
 *   reel-lower    — Full sentence lower-third, thin white underline, like IG Reels auto-captions
 *   minimal-fade  — Small clean text fades in, no decoration, soft and editorial
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export type UGCCaptionStyle =
  | 'ig-story'
  | 'karaoke-box'
  | 'word-slam'
  | 'clean-stroke'
  | 'reel-lower'
  | 'minimal-fade';

export interface WordTiming {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

interface Props {
  transcript: WordTiming[];
  style?: UGCCaptionStyle;
  accentColor?: string;
  fontSize?: number;
}

// ─── Helper: find current word index ──────────────────────────────────────────

function useCurrentWordIndex(transcript: WordTiming[], frame: number, fps: number) {
  const t = frame / fps;
  return transcript.findIndex((w) => t >= w.start && t < w.end);
}

// ─── IG Story Style ────────────────────────────────────────────────────────────
// Black pill bg, 2-3 bold white words at a time, centered mid-screen.
// Inspired by: @garyvee, @khaby.lame, @bravovince

const IGStory: React.FC<{ transcript: WordTiming[]; accentColor: string; fontSize: number }> = ({
  transcript, accentColor, fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentIdx = useCurrentWordIndex(transcript, frame, fps);
  const WORDS_PER_GROUP = 3;
  const groupStart = Math.max(0, currentIdx - (currentIdx % WORDS_PER_GROUP));
  const group = transcript.slice(groupStart, groupStart + WORDS_PER_GROUP);

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 260,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '0 40px',
    }}>
      {group.map((w, i) => {
        const isActive = groupStart + i === currentIdx;
        return (
          <div key={i} style={{
            backgroundColor: isActive ? accentColor : 'rgba(0,0,0,0.82)',
            color: isActive ? '#000000' : '#ffffff',
            fontFamily: "'Archivo Black', 'Anton', 'Inter', sans-serif",
            fontWeight: 900,
            fontSize,
            paddingInline: 28, paddingBlock: 10,
            borderRadius: 16,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            textTransform: 'uppercase',
            boxShadow: isActive ? `0 0 24px ${accentColor}66` : 'none',
          }}>
            {w.word}
          </div>
        );
      })}
    </div>
  );
};

// ─── Karaoke Box Style ─────────────────────────────────────────────────────────
// 4 words visible; active word gets a solid highlight rect BEHIND it.
// Inspired by: @milliondollarshortcuts, @jasonwachob, most viral TikTok auto-captions

const KaraokeBox: React.FC<{ transcript: WordTiming[]; accentColor: string; fontSize: number }> = ({
  transcript, accentColor, fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const currentIdx = useCurrentWordIndex(transcript, frame, fps);
  const VISIBLE = 4;
  const groupStart = Math.max(0, currentIdx - (currentIdx % VISIBLE));
  const group = transcript.slice(groupStart, groupStart + VISIBLE);

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 200,
      display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
      gap: 10, padding: '0 48px',
    }}>
      {group.map((w, i) => {
        const isActive = groupStart + i === currentIdx;
        return (
          <span key={i} style={{
            position: 'relative', display: 'inline-block',
            fontFamily: "'Sora', 'Inter', sans-serif",
            fontWeight: 800, fontSize,
            color: isActive ? '#000000' : '#ffffff',
            backgroundColor: isActive ? accentColor : 'transparent',
            paddingInline: isActive ? 14 : 4, paddingBlock: isActive ? 6 : 0,
            borderRadius: 10,
            WebkitTextStroke: isActive ? '0px' : '2px #000000',
            textShadow: isActive ? 'none' : '2px 2px 0 #000, -1px -1px 0 #000',
            letterSpacing: '-0.01em',
            transition: 'all 0.05s',
          }}>
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// ─── Word Slam Style ───────────────────────────────────────────────────────────
// One word at a time, huge, slams into center with spring physics.
// Inspired by: @alexhormozi clips, @basedandy, high-energy motivational TikToks

const WordSlam: React.FC<{ transcript: WordTiming[]; accentColor: string; fontSize: number }> = ({
  transcript, accentColor, fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentIdx = useCurrentWordIndex(transcript, frame, fps);
  if (currentIdx < 0 || currentIdx >= transcript.length) return null;
  const wordTiming = transcript[currentIdx];
  const wordStartFrame = Math.round(wordTiming.start * fps);
  const localFrame = Math.max(0, frame - wordStartFrame);

  const scale = spring({ frame: localFrame, fps, config: { damping: 8, stiffness: 280, mass: 0.6 } });
  const scalePx = interpolate(scale, [0, 1], [2.2, 1.0]);
  const opacity = interpolate(localFrame, [0, 4], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: '38%',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
    }}>
      <span style={{
        fontFamily: "'Anton', 'Archivo Black', sans-serif",
        fontWeight: 900, fontSize: fontSize * 1.8,
        color: '#ffffff',
        WebkitTextStroke: `4px ${accentColor}`,
        textShadow: `0 0 40px ${accentColor}88, 4px 4px 0 #000`,
        textTransform: 'uppercase', letterSpacing: '-0.03em',
        lineHeight: 1,
        transform: `scale(${scalePx})`, opacity,
        display: 'inline-block',
      }}>
        {wordTiming.word}
      </span>
    </div>
  );
};

// ─── Clean Stroke Style ────────────────────────────────────────────────────────
// White text, thick black outline, no background. Clean creator POV look.
// Inspired by: @zaidleppelin, @noah_kagan, @justinwelsh

const CleanStroke: React.FC<{ transcript: WordTiming[]; accentColor: string; fontSize: number }> = ({
  transcript, accentColor, fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentIdx = useCurrentWordIndex(transcript, frame, fps);
  const VISIBLE = 5;
  const groupStart = Math.max(0, currentIdx - (currentIdx % VISIBLE));
  const group = transcript.slice(groupStart, groupStart + VISIBLE);

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 180,
      display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
      gap: '8px 14px', padding: '0 52px',
    }}>
      {group.map((w, i) => {
        const isActive = groupStart + i === currentIdx;
        return (
          <span key={i} style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontWeight: 700, fontSize,
            color: isActive ? accentColor : '#ffffff',
            WebkitTextStroke: '3px #000000',
            paintOrder: 'stroke fill',
            textShadow: 'none',
            letterSpacing: '0.01em',
          }}>
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// ─── Reel Lower Third ──────────────────────────────────────────────────────────
// Full sentence shown at once, lower third, thin white underline grows in.
// Inspired by: IG Reels auto-captions default style (clean, readable)

const ReelLower: React.FC<{ transcript: WordTiming[]; accentColor: string; fontSize: number }> = ({
  transcript, accentColor, fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentIdx = useCurrentWordIndex(transcript, frame, fps);
  const SENTENCE_SIZE = 6;
  const groupStart = Math.max(0, currentIdx - (currentIdx % SENTENCE_SIZE));
  const group = transcript.slice(groupStart, groupStart + SENTENCE_SIZE);

  // Underline grows from 0 to full width when group changes
  const groupFrame = frame - Math.round((transcript[groupStart]?.start ?? 0) * fps);
  const underlineW = interpolate(groupFrame, [0, 12], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', left: 52, right: 52, bottom: 200,
    }}>
      <div style={{
        fontFamily: "'Sora', 'Inter', sans-serif",
        fontWeight: 600, fontSize: fontSize * 0.88,
        lineHeight: 1.4, color: '#ffffff',
        textAlign: 'center',
        textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,1)',
      }}>
        {group.map((w, i) => {
          const isActive = groupStart + i === currentIdx;
          return (
            <span key={i} style={{
              color: isActive ? accentColor : '#ffffff',
              fontWeight: isActive ? 800 : 600,
              marginRight: 6,
            }}>{w.word}</span>
          );
        })}
      </div>
      {/* Growing underline */}
      <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${underlineW}%`, background: accentColor, borderRadius: 2, transition: 'none' }} />
      </div>
    </div>
  );
};

// ─── Minimal Fade ──────────────────────────────────────────────────────────────
// Editorial, soft — small weight-600 text, just fades in word by word.
// Inspired by: documentary-style IG, @nathanbaugh, @joerogan clips

const MinimalFade: React.FC<{ transcript: WordTiming[]; accentColor: string; fontSize: number }> = ({
  transcript, accentColor, fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentIdx = useCurrentWordIndex(transcript, frame, fps);
  const VISIBLE = 6;
  const groupStart = Math.max(0, currentIdx - (currentIdx % VISIBLE));
  const group = transcript.slice(groupStart, groupStart + VISIBLE);

  return (
    <div style={{
      position: 'absolute', left: 48, right: 48, bottom: 220,
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 12px',
    }}>
      {group.map((w, i) => {
        const wordFrame = Math.round((transcript[groupStart + i]?.start ?? 0) * fps);
        const localF = Math.max(0, frame - wordFrame);
        const opacity = interpolate(localF, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
        const isActive = groupStart + i === currentIdx;
        return (
          <span key={i} style={{
            fontFamily: "'Sora', 'Space Grotesk', sans-serif",
            fontWeight: isActive ? 700 : 400,
            fontSize: fontSize * 0.8,
            color: isActive ? accentColor : 'rgba(255,255,255,0.9)',
            letterSpacing: '0.03em',
            opacity,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}>
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────

export const UGCCaptions: React.FC<Props> = ({
  transcript,
  style = 'karaoke-box',
  accentColor = '#FFE600',
  fontSize = 52,
}) => {
  switch (style) {
    case 'ig-story':      return <IGStory transcript={transcript} accentColor={accentColor} fontSize={fontSize} />;
    case 'karaoke-box':   return <KaraokeBox transcript={transcript} accentColor={accentColor} fontSize={fontSize} />;
    case 'word-slam':     return <WordSlam transcript={transcript} accentColor={accentColor} fontSize={fontSize} />;
    case 'clean-stroke':  return <CleanStroke transcript={transcript} accentColor={accentColor} fontSize={fontSize} />;
    case 'reel-lower':    return <ReelLower transcript={transcript} accentColor={accentColor} fontSize={fontSize} />;
    case 'minimal-fade':  return <MinimalFade transcript={transcript} accentColor={accentColor} fontSize={fontSize} />;
    default:              return null;
  }
};
