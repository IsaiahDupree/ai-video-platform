/**
 * IPhoneUGCVideo.tsx — iPhone footage → UGC-native vertical video.
 *
 * Takes raw iPhone video as background, overlays:
 *   - Clean-stroke captions (lower third, the preferred style)
 *   - Minimal-top title hook (if no existing title detected)
 *   - Background music at 1-2% volume
 *   - Bottom gradient for caption legibility
 *
 * Props:
 *   videoSrc      — path relative to public/ (e.g. "iphone/clip.mp4")
 *   captionText   — transcribed speech for caption overlay (skip if hasCaptions=true)
 *   titleText     — hook title (skip if hasTitle=true)
 *   titleSubtext  — optional subtitle
 *   hasCaptions   — true = existing captions detected, skip overlay
 *   hasTitle      — true = existing title detected, skip overlay
 *   accentColor   — brand accent (default: #38ef7d — Isaiah green)
 *   musicFile     — staticFile() path to background track
 *   musicVolume   — default 0.015 (1.5%)
 *   brandId       — watermark handle
 *   durationSec   — source video duration (used to set composition frames)
 */

import React from 'react';
import {
  AbsoluteFill, Audio, Video, staticFile,
  useCurrentFrame, useVideoConfig, interpolate,
} from 'remotion';
import { UGCCaptions } from '../components/UGCCaptionStyles';
import { UGCTitle } from '../components/UGCTitleStyles';
import { generateTranscriptFromText } from '../components/AnimatedCaptions';

const DEFAULT_MUSIC = 'music/downloads/yt--UfI1X-MSig.mp3'; // lofi — matches clean/personal style

export interface WordTimestamp {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface IPhoneUGCVideoProps {
  videoSrc: string;
  captionText?: string;
  wordTimestamps?: WordTimestamp[];  // real Whisper word-level timestamps
  titleText?: string;
  titleSubtext?: string;
  hasCaptions?: boolean;
  hasTitle?: boolean;
  accentColor?: string;
  musicFile?: string;
  musicVolume?: number;
  brandId?: string;
  [key: string]: unknown;
}

// ─── Fade overlay ─────────────────────────────────────────────────────────────

const FadeOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 10, durationInFrames - 12, durationInFrames],
    [1, 0, 0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: '#000', opacity, pointerEvents: 'none',
    }} />
  );
};

// ─── Brand watermark ──────────────────────────────────────────────────────────

const Watermark: React.FC<{ brandId: string; accentColor: string }> = ({ brandId, accentColor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [20, 30], [0, 0.45], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', bottom: 36, right: 28, opacity,
      fontFamily: "'Space Grotesk', monospace, sans-serif",
      fontSize: 17, fontWeight: 600, color: accentColor, letterSpacing: '0.06em',
    }}>
      @{brandId}
    </div>
  );
};

// ─── Caption layer (fallback: evenly-spaced text) ────────────────────────────

const CaptionLayer: React.FC<{ captionText: string; accentColor: string }> = ({ captionText, accentColor }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const transcript = generateTranscriptFromText(captionText, 0.8, durationInFrames / fps - 0.8);
  return (
    <UGCCaptions
      transcript={transcript}
      style="clean-stroke"
      accentColor={accentColor}
      fontSize={52}
    />
  );
};

// ─── Word-sync caption layer (karaoke-style, uses real Whisper timestamps) ───

const WordSyncCaptionLayer: React.FC<{
  wordTimestamps: WordTimestamp[];
  accentColor: string;
}> = ({ wordTimestamps, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  if (wordTimestamps.length === 0) return null;

  // Find which word is currently being spoken
  let activeIdx = -1;
  for (let i = 0; i < wordTimestamps.length; i++) {
    const w = wordTimestamps[i];
    if (currentSec >= w.start - 0.05 && currentSec <= w.end + 0.1) {
      activeIdx = i;
      break;
    }
    if (w.start > currentSec) {
      // Between words — show last completed
      activeIdx = i > 0 ? i - 1 : -1;
      break;
    }
    // Past this word
    activeIdx = i;
  }

  if (activeIdx < 0) return null;

  // Group into fixed chunks of 4 words; show the chunk containing activeIdx
  const CHUNK = 4;
  const chunkIdx   = Math.floor(activeIdx / CHUNK);
  const chunkStart = chunkIdx * CHUNK;
  const chunkEnd   = Math.min(wordTimestamps.length, chunkStart + CHUNK);
  const chunk      = wordTimestamps.slice(chunkStart, chunkEnd);

  // Fade chunk in at its first word, fade out at its last word
  const chunkOpacity = interpolate(
    currentSec,
    [chunk[0].start - 0.1, chunk[0].start + 0.08],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <div style={{
      position: 'absolute',
      bottom: 185,
      left: 30,
      right: 30,
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px 8px',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: chunkOpacity,
    }}>
      {chunk.map((w, i) => {
        const wordIdx  = chunkStart + i;
        const isActive = wordIdx === activeIdx;
        const isPast   = wordIdx < activeIdx;
        return (
          <span
            key={`word-${wordIdx}`}
            style={{
              fontFamily: "'Space Grotesk', 'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize:    52,
              fontWeight:  800,
              color:       isActive ? accentColor : isPast ? 'rgba(255,255,255,0.55)' : '#ffffff',
              textShadow:  '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 10px rgba(0,0,0,0.9)',
              lineHeight:  1.2,
              letterSpacing: '0.02em',
              display:     'inline-block',
              transform:   isActive ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────

export const IPhoneUGCVideo: React.FC<IPhoneUGCVideoProps> = ({
  videoSrc,
  captionText,
  wordTimestamps,
  titleText,
  titleSubtext,
  hasCaptions = false,
  hasTitle = false,
  accentColor = '#38ef7d',
  musicFile = DEFAULT_MUSIC,
  musicVolume = 0.015,
  brandId = 'the_isaiah_dupree',
}) => {
  const hasWordSync = Array.isArray(wordTimestamps) && wordTimestamps.length > 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
      {/* iPhone video background — cropped/centered to fill portrait frame */}
      <Video
        src={staticFile(videoSrc)}
        onError={() => { /* silently skip if video fails to load in preview */ }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />

      {/* Bottom gradient for caption readability */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '45%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 70%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Top gradient to keep title readable */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '25%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Background music at 1-2% volume */}
      {musicFile && <Audio src={staticFile(musicFile)} volume={musicVolume} loop />}

      {/* UGC title hook — only if no existing title */}
      {!hasTitle && titleText && (
        <UGCTitle
          text={titleText}
          subtext={titleSubtext}
          style="minimal-top"
          accentColor={accentColor}
          delayFrames={8}
        />
      )}

      {/* Captions — word-sync (karaoke) if timestamps provided, else evenly-spaced fallback */}
      {!hasCaptions && hasWordSync && (
        <WordSyncCaptionLayer wordTimestamps={wordTimestamps!} accentColor={accentColor} />
      )}
      {!hasCaptions && !hasWordSync && captionText && (
        <CaptionLayer captionText={captionText} accentColor={accentColor} />
      )}

      {/* Brand watermark */}
      <Watermark brandId={brandId} accentColor={accentColor} />

      {/* Fade in/out */}
      <FadeOverlay />
    </AbsoluteFill>
  );
};

export const IPHONE_UGC_FPS = 30;
// Duration is dynamic — set via --duration flag at render time or registered per-clip
export const IPHONE_UGC_DEFAULT_FRAMES = 450; // 15s fallback
