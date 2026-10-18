import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from 'remotion';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadBebasNeue } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadPoppins } from '@remotion/google-fonts/Poppins';
import { loadFont as loadOswald } from '@remotion/google-fonts/Oswald';
import { loadFont as loadDMSans } from '@remotion/google-fonts/DMSans';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

// ============================================================================
// IsaiahReelV2 — Standard layout baseline
// ============================================================================
//
// Three required elements — validated every render:
//   1. @the_isaiah_dupree handle — always top center
//   2. Green badge tagline — directly below handle, black text on #00C853 green
//      → AI-generated catchy summary of the whole video
//   3. Whisper-accurate captions — bottom, in face-safe zone only
//      → Word timings from openai-whisper (word_timestamps=True)
//
// Face-safe: captions positioned BELOW face bottom Y (from OpenCV detection)
// No text ever overlaps the face zone.
// ============================================================================

// ─── Font variants ────────────────────────────────────────────────────────────
export type FontVariant =
  | 'default'       // SF Pro / system-ui (original)
  | 'montserrat'    // Rounded modern — clean social media feel
  | 'bebas'         // Bold condensed all-caps — high impact
  | 'poppins'       // Friendly geometric — viral reel style
  | 'oswald'        // Condensed athletic — punchy
  | 'dm-sans'       // DM Sans — clean minimal tech
  | 'inter';        // Inter — ultra-clean, editor-style

// Load all fonts once at module level (Remotion best practice)
const montserrat = loadMontserrat('normal', { weights: ['600', '700', '800', '900'] });
const bebasNeue  = loadBebasNeue('normal',  { weights: ['400'] });
const poppins    = loadPoppins('normal',    { weights: ['600', '700', '800'] });
const oswald     = loadOswald('normal',     { weights: ['500', '600', '700'] });
const dmSans     = loadDMSans('normal',     { weights: ['600', '700', '800'] });
const inter      = loadInter('normal',      { weights: ['600', '700', '800'] });

function getFontFamily(variant: FontVariant): string {
  switch (variant) {
    case 'montserrat': return montserrat.fontFamily;
    case 'bebas':      return bebasNeue.fontFamily;
    case 'poppins':    return poppins.fontFamily;
    case 'oswald':     return oswald.fontFamily;
    case 'dm-sans':    return dmSans.fontFamily;
    case 'inter':      return inter.fontFamily;
    default:           return '"SF Pro Display", "Inter", system-ui, sans-serif';
  }
}

// Bebas is all-caps display — needs slightly larger size and no bold (it's already heavy)
function getFontWeight(variant: FontVariant, level: 'handle' | 'badge' | 'caption-active' | 'caption-normal'): number {
  if (variant === 'bebas') return 400;
  if (variant === 'oswald') return level === 'caption-normal' ? 500 : 700;
  const map: Record<string, number> = {
    'handle': 700, 'badge': 800, 'caption-active': 800, 'caption-normal': 600,
  };
  return map[level];
}

function getFontSize(variant: FontVariant, base: number, role: 'handle' | 'badge' | 'caption'): number {
  if (variant === 'bebas') {
    // Bebas is naturally large — scale up slightly for handles/badges
    if (role === 'handle') return Math.round(base * 1.2);
    if (role === 'badge')  return Math.round(base * 1.1);
    return Math.round(base * 1.15);
  }
  if (variant === 'oswald') return Math.round(base * 1.05);
  return base;
}

export interface WhisperWord {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface IsaiahReelV2Props {
  backgroundVideoPath: string;
  audioPath?: string;
  tagline: string;                   // Green badge text — catchy AI summary
  words: WhisperWord[];              // From Whisper word_timestamps
  handle?: string;                   // Default: @the_isaiah_dupree
  faceSafeBottomY?: number;          // 0-1 normalized — captions start below this
  captionFontSize?: number;
  captionMaxWords?: number;
  fontVariant?: FontVariant;         // Custom font for all text elements
  // ── Music / audio mix ─────────────────────────────────────────────────────
  musicPath?: string;                // Background music track (optional)
  musicVolumeBase?: number;          // Base music volume when nobody is talking (0–1, default 0.02)
  musicVolumeDucked?: number;        // Ducked music volume during speech (0–1, default 0.01)
  voiceVolume?: number;              // Voiceover volume (0–1, default 1.0)
}

// ─── Handle Bar ─────────────────────────────────────────────────────────────
const HandleBar: React.FC<{ handle: string; fontFamily: string; fontVariant: FontVariant }> = ({
  handle, fontFamily, fontVariant,
}) => (
  <div
    style={{
      position: 'absolute',
      top: 52,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 10,
    }}
  >
    <div
      style={{
        fontFamily,
        fontSize: getFontSize(fontVariant, 28, 'handle'),
        fontWeight: getFontWeight(fontVariant, 'handle'),
        color: '#ffffff',
        letterSpacing: fontVariant === 'bebas' ? 2 : 0.3,
        textShadow: '0 1px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.4)',
        textTransform: fontVariant === 'bebas' ? 'uppercase' : 'none',
      }}
    >
      {handle}
    </div>
  </div>
);

// ─── Green Badge Tagline ─────────────────────────────────────────────────────
const TaglineBadge: React.FC<{
  tagline: string;
  frame: number;
  fps: number;
  fontFamily: string;
  fontVariant: FontVariant;
}> = ({ tagline, frame, fps, fontFamily, fontVariant }) => {
  const fadeIn = spring({ frame, fps, config: { damping: 16, stiffness: 140 } });
  const opacity = interpolate(fadeIn, [0, 1], [0, 1]);
  const translateY = interpolate(fadeIn, [0, 1], [-12, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 90,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${translateY}px)`,
        zIndex: 10,
      }}
    >
      <div
        style={{
          backgroundColor: '#00C853',
          borderRadius: 100,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 22,
          paddingRight: 22,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: getFontSize(fontVariant, 22, 'badge'),
            fontWeight: getFontWeight(fontVariant, 'badge'),
            color: '#000000',
            letterSpacing: fontVariant === 'bebas' ? 1.5 : 0.2,
            lineHeight: 1,
            textTransform: fontVariant === 'bebas' ? 'uppercase' : 'none',
          }}
        >
          {tagline}
        </span>
      </div>
    </div>
  );
};

// ─── Whisper Captions ────────────────────────────────────────────────────────
const WhisperCaptions: React.FC<{
  words: WhisperWord[];
  faceSafeBottomY: number;
  fontSize: number;
  maxWords: number;
  frame: number;
  fps: number;
  videoHeight: number;
  fontFamily: string;
  fontVariant: FontVariant;
}> = ({ words, faceSafeBottomY, fontSize, maxWords, frame, fps, videoHeight, fontFamily, fontVariant }) => {
  if (!words.length) return null;

  const currentTime = frame / fps;

  const currentIdx = words.findIndex(
    (w) => currentTime >= w.start && currentTime < w.end
  );
  const activeIdx = currentIdx >= 0 ? currentIdx : words.filter(w => w.end < currentTime).length - 1;

  const half = Math.floor(maxWords / 2);
  const windowStart = Math.max(0, activeIdx - half);
  const windowEnd = Math.min(words.length, windowStart + maxWords);
  const visibleWords = words.slice(windowStart, windowEnd);

  if (visibleWords.length === 0) return null;

  const COMP_HEIGHT = 1280;
  const captionTopPx = Math.round(faceSafeBottomY * COMP_HEIGHT) + 20;
  const effectiveFontSize = getFontSize(fontVariant, fontSize, 'caption');

  return (
    <div
      style={{
        position: 'absolute',
        top: captionTopPx,
        left: 0,
        right: 0,
        padding: '0 36px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 0,
        zIndex: 10,
        minHeight: effectiveFontSize * 1.6,
      }}
    >
      {visibleWords.map((w, i) => {
        const globalIdx = windowStart + i;
        const isActive = globalIdx === activeIdx;
        const isPast = globalIdx < activeIdx;

        return (
          <span
            key={`${globalIdx}-${w.word}`}
            style={{
              fontFamily,
              fontSize: effectiveFontSize,
              fontWeight: getFontWeight(fontVariant, isActive ? 'caption-active' : 'caption-normal'),
              // ── Green background, black text — Isaiah caption standard ──
              backgroundColor: isActive ? '#00C853' : 'rgba(0,0,0,0.72)',
              color: isActive ? '#000000' : '#ffffff',
              borderRadius: 6,
              paddingTop: Math.round(effectiveFontSize * 0.12),
              paddingBottom: Math.round(effectiveFontSize * 0.12),
              paddingLeft: Math.round(effectiveFontSize * 0.2),
              paddingRight: Math.round(effectiveFontSize * 0.2),
              opacity: isPast ? 0.65 : 1,
              marginRight: Math.round(effectiveFontSize * 0.15),
              marginBottom: Math.round(effectiveFontSize * 0.18),
              lineHeight: 1.25,
              display: 'inline-block',
              transform: isActive ? 'scale(1.06)' : 'scale(1)',
              textTransform: fontVariant === 'bebas' ? 'uppercase' : 'none',
              letterSpacing: fontVariant === 'bebas' ? 1 : 0,
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// ─── Gradient overlay ────────────────────────────────────────────────────────
const GradientOverlay: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.60) 100%)',
      pointerEvents: 'none',
    }}
  />
);

// ─── Main Composition ────────────────────────────────────────────────────────
export const IsaiahReelV2: React.FC<IsaiahReelV2Props> = ({
  backgroundVideoPath,
  audioPath,
  tagline,
  words,
  handle = '@the_isaiah_dupree',
  faceSafeBottomY = 0.64,
  captionFontSize = 40,
  captionMaxWords = 5,
  fontVariant = 'default',
  musicPath,
  musicVolumeBase = 0.02,
  musicVolumeDucked = 0.01,
  voiceVolume = 1.0,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const fontFamily = getFontFamily(fontVariant);

  const bgSrc = backgroundVideoPath.startsWith('/')
    ? backgroundVideoPath
    : staticFile(backgroundVideoPath);

  const audioSrc = audioPath
    ? (audioPath.startsWith('/') ? audioPath : staticFile(audioPath))
    : undefined;

  const musicSrc = musicPath
    ? (musicPath.startsWith('/') ? musicPath : staticFile(musicPath))
    : undefined;

  // ── Sidechain ducking ─────────────────────────────────────────────────────
  // Music volume: ducks under the voice whenever a word is being spoken.
  // Adds 100ms pre-roll and 150ms tail so ducking feels smooth, not choppy.
  const musicVolumeAtFrame = (f: number): number => {
    if (!words.length) return musicVolumeBase;
    const t = f / fps;
    const isSpeaking = words.some(
      (w) => t >= w.start - 0.1 && t < w.end + 0.15
    );
    return isSpeaking ? musicVolumeDucked : musicVolumeBase;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill>
        <Video
          src={bgSrc}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          muted={!!audioSrc}
        />
      </AbsoluteFill>

      <GradientOverlay />

      {/* Voiceover — full volume */}
      {audioSrc && <Audio src={audioSrc} volume={voiceVolume} />}

      {/* Background music — sidechained under voice */}
      {musicSrc && (
        <Audio
          src={musicSrc}
          volume={(f) => musicVolumeAtFrame(f)}
          startFrom={0}
        />
      )}

      <HandleBar handle={handle} fontFamily={fontFamily} fontVariant={fontVariant} />

      <TaglineBadge tagline={tagline} frame={frame} fps={fps} fontFamily={fontFamily} fontVariant={fontVariant} />

      <WhisperCaptions
        words={words}
        faceSafeBottomY={faceSafeBottomY}
        fontSize={captionFontSize}
        maxWords={captionMaxWords}
        frame={frame}
        fps={fps}
        videoHeight={height}
        fontFamily={fontFamily}
        fontVariant={fontVariant}
      />
    </AbsoluteFill>
  );
};

// ─── Default props ────────────────────────────────────────────────────────────
export const isaiahReelV2DefaultProps: IsaiahReelV2Props = {
  backgroundVideoPath: 'reel-bg-placeholder.mp4',
  tagline: 'stop overthinking the text',
  faceSafeBottomY: 0.64,
  captionFontSize: 40,
  captionMaxWords: 5,
  fontVariant: 'poppins',
  words: [
    { word: 'The', start: 0.0, end: 0.34 },
    { word: 'longer', start: 0.34, end: 0.68 },
    { word: 'you', start: 0.68, end: 0.90 },
    { word: 'wait,', start: 0.90, end: 1.28 },
    { word: 'the', start: 1.28, end: 1.60 },
    { word: 'more', start: 1.60, end: 1.78 },
    { word: 'awkward', start: 1.78, end: 2.08 },
    { word: 'it', start: 2.08, end: 2.48 },
    { word: 'feels.', start: 2.48, end: 3.0 },
  ],
};
