import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';
import { TradingChapter, WordTimestamp, TradingDocumentaryProps, tradingDocumentaryDefaultProps } from './TradingDocumentary';

// ─── Config ───────────────────────────────────────────────────────────────────
const FPS = 30;
const SECS_PER_CHAPTER = 7; // seconds shown per chapter
const FRAMES_PER_CHAPTER = SECS_PER_CHAPTER * FPS;
const TOTAL_CHAPTERS = tradingDocumentaryDefaultProps.chapters.length; // 12
export const REELS_TOTAL_FRAMES = TOTAL_CHAPTERS * FRAMES_PER_CHAPTER; // 2520 = 84s

const BG = '#020914';
const SANS = '"Inter", system-ui, sans-serif';
const MONO = '"JetBrains Mono", "Courier New", monospace';

// ─── Captions ─────────────────────────────────────────────────────────────────
const ReelsCaptions: React.FC<{
  words: WordTimestamp[];
  localFrame: number;
  accentColor: string;
}> = ({ words, localFrame, accentColor }) => {
  if (!words || words.length === 0) return null;
  const currentSec = localFrame / FPS;

  let activeIdx = -1;
  for (let i = 0; i < words.length; i++) {
    if (words[i].start <= currentSec) activeIdx = i;
    if (words[i].start > currentSec) break;
  }
  if (activeIdx < 0) return null;

  // 6-word window for vertical format
  const WINDOW = 6;
  const lineStart = Math.floor(activeIdx / WINDOW) * WINDOW;
  const lineWords = words.slice(lineStart, lineStart + WINDOW);
  const lineAge = activeIdx - lineStart;
  const lineOpacity = interpolate(lineAge, [0, 1], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <div style={{
      position: 'absolute',
      bottom: 160,
      left: 40,
      right: 40,
      textAlign: 'center',
      opacity: lineOpacity,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'inline-block',
        background: 'rgba(0,0,0,0.75)',
        borderRadius: 10,
        padding: '10px 24px 12px',
        backdropFilter: 'blur(8px)',
      }}>
        {lineWords.map((w, i) => {
          const globalIdx = lineStart + i;
          const isActive = globalIdx === activeIdx;
          const isPast = w.end < currentSec;
          return (
            <span key={`${globalIdx}-${w.word}`} style={{
              fontFamily: SANS,
              fontSize: 46,
              fontWeight: isActive ? 800 : 500,
              color: isActive ? accentColor : isPast ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
              marginRight: 10,
              textShadow: isActive ? `0 0 28px ${accentColor}66` : '0 2px 8px rgba(0,0,0,0.9)',
              letterSpacing: '-0.01em',
            }}>
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ─── Single Chapter Slide (vertical 9:16) ────────────────────────────────────
const ReelsSlide: React.FC<{
  chapter: TradingChapter;
  localFrame: number;
  chapterIndex: number;
}> = ({ chapter, localFrame, chapterIndex }) => {
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(localFrame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(localFrame, [FRAMES_PER_CHAPTER - 12, FRAMES_PER_CHAPTER], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);

  const titleSlide = spring({ frame: localFrame - 4,  fps, config: { damping: 20, stiffness: 90 } });
  const factSlide  = spring({ frame: localFrame - 10, fps, config: { damping: 22, stiffness: 80 } });

  const sceneScale = interpolate(localFrame, [0, FRAMES_PER_CHAPTER], [1.0, 1.08], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const accent = chapter.color;

  return (
    <AbsoluteFill style={{ background: BG, opacity }}>
      {/* Full-screen scene image */}
      {chapter.sceneImageFile && (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={staticFile(chapter.sceneImageFile)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${sceneScale})`,
              transformOrigin: 'center center',
            }}
          />
          {/* Heavy vignette for readability on vertical */}
          <AbsoluteFill style={{
            background: `linear-gradient(
              to bottom,
              rgba(2,9,20,0.70) 0%,
              rgba(2,9,20,0.20) 35%,
              rgba(2,9,20,0.20) 55%,
              rgba(2,9,20,0.85) 100%
            )`,
          }} />
        </AbsoluteFill>
      )}

      {/* Top: chapter badge + era */}
      <div style={{
        position: 'absolute',
        top: 80,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        opacity: titleSlide,
        transform: `translateY(${interpolate(titleSlide, [0, 1], [-16, 0])}px)`,
      }}>
        <div style={{
          fontFamily: MONO,
          fontSize: 22,
          color: accent,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          border: `1px solid ${accent}55`,
          padding: '6px 18px',
          borderRadius: 6,
          background: `${accent}18`,
          backdropFilter: 'blur(8px)',
        }}>
          CHAPTER {String(chapterIndex + 1).padStart(2, '0')}
        </div>
        <div style={{
          fontFamily: MONO,
          fontSize: 18,
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '0.1em',
        }}>
          {chapter.era}
        </div>
      </div>

      {/* Center: big title */}
      <div style={{
        position: 'absolute',
        top: '38%',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 48px',
        opacity: titleSlide,
        transform: `translateY(${interpolate(titleSlide, [0, 1], [20, 0])}px) translateX(-50%) translateX(50%)`,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: SANS,
          fontSize: chapter.title.length > 20 ? 58 : 68,
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          textShadow: '0 4px 32px rgba(0,0,0,0.7)',
        }}>
          {chapter.title}
        </div>

        {/* Accent bar */}
        <div style={{
          height: 4,
          width: interpolate(titleSlide, [0, 1], [0, 100]),
          background: `linear-gradient(90deg, ${accent}, ${accent}44)`,
          borderRadius: 2,
          marginTop: 18,
        }} />
      </div>

      {/* Bottom: key fact */}
      <div style={{
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        padding: '0 44px',
        opacity: factSlide,
        transform: `translateY(${interpolate(factSlide, [0, 1], [20, 0])}px)`,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          padding: '16px 22px',
          borderLeft: `3px solid ${accent}`,
        }}>
          <div style={{
            fontFamily: MONO,
            fontSize: 14,
            color: `${accent}cc`,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            KEY FACT
          </div>
          <div style={{
            fontFamily: SANS,
            fontSize: 22,
            color: '#ffffff',
            lineHeight: 1.4,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}>
            {chapter.keyFact}
          </div>
        </div>
      </div>

      {/* Captions */}
      <ReelsCaptions words={chapter.words ?? []} localFrame={localFrame} accentColor={accent} />

      {/* Progress dots at very bottom */}
      <div style={{
        position: 'absolute',
        bottom: 52,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 7,
      }}>
        {Array.from({ length: TOTAL_CHAPTERS }).map((_, i) => (
          <div key={i} style={{
            width: i === chapterIndex ? 22 : 6,
            height: 6,
            borderRadius: 3,
            background: i === chapterIndex ? accent : 'rgba(255,255,255,0.25)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Chapter progress bar at bottom edge */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          height: '100%',
          width: `${(localFrame / FRAMES_PER_CHAPTER) * 100}%`,
          background: accent,
        }} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Reels Composition ───────────────────────────────────────────────────
export const TradingDocumentaryReels: React.FC<TradingDocumentaryProps> = ({ chapters }) => {
  const frame = useCurrentFrame();

  // Detect if all chapters share the same audioFile (single continuous file)
  const singleAudio = chapters.length > 1 && chapters[0].audioFile === chapters[1].audioFile;

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Single continuous audio for the whole reel */}
      {singleAudio && (
        <Audio src={staticFile(chapters[0].audioFile)} volume={1} />
      )}

      {chapters.map((chapter, i) => (
        <Sequence
          key={chapter.id}
          from={i * FRAMES_PER_CHAPTER}
          durationInFrames={FRAMES_PER_CHAPTER}
        >
          <ReelsSlide
            chapter={chapter}
            localFrame={frame - i * FRAMES_PER_CHAPTER}
            chapterIndex={i}
          />
          {/* Per-chapter audio only if not single shared file */}
          {!singleAudio && (
            <Audio
              src={staticFile(chapter.audioFile)}
              startFrom={0}
              endAt={FRAMES_PER_CHAPTER}
              volume={1}
            />
          )}
        </Sequence>
      ))}

      {/* Watermark */}
      <div style={{
        position: 'absolute',
        top: 28,
        right: 28,
        fontFamily: MONO,
        fontSize: 14,
        color: 'rgba(255,255,255,0.18)',
        letterSpacing: '0.1em',
      }}>
        MONEY · MARKETS · MANKIND
      </div>
    </AbsoluteFill>
  );
};
