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

// ─── Scene Types ──────────────────────────────────────────────────────────────

export type SceneType =
  | 'title_card'       // Large chapter title entrance
  | 'fact_reveal'      // Animated stat or key fact
  | 'quote'            // Pull quote from narration
  | 'character'        // Full character image frame
  | 'timeline'         // Horizontal year timeline
  | 'transition'       // Chapter-to-chapter wipe
  | 'image_reveal';    // Full-bleed concept image + caption

export interface Scene {
  type: SceneType;
  durationSecs: number;  // 2.5–5.0
  startSecs?: number;    // Whisper-exact start time within chapter audio
  endSecs?: number;      // Whisper-exact end time within chapter audio
  content: string;
  subContent?: string;
  accentColor?: string;
  characterFile?: string;
  imageFile?: string;    // path for image_reveal scenes
  year?: string;
}

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

export interface SEOChapterV2 {
  id: string;
  title: string;
  era: string;
  color: string;
  audioFile: string;
  characterImageFile: string;
  audioDurationSecs: number;  // actual audio file duration — drives chapter length
  scenes: Scene[];            // 2.5–5s each; cycle/loop to fill audioDurationSecs
  words?: WhisperWord[];      // Whisper word-level timestamps for caption overlay
}

export interface SEODocumentaryV2Props {
  chapters: SEOChapterV2[];
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#050a14';
const BG2     = '#0a1020';
const TEXT    = '#e8edf5';
const TEXT_DIM = '#5a6480';
const MONO    = '"JetBrains Mono", "Courier New", monospace';
const SANS    = '"Inter", system-ui, sans-serif';
const FPS     = 30;
const sec     = (s: number) => Math.round(s * FPS);

// ─── Enhancement constants ──────────────────────────────────────────────────
const CROSSFADE_FRAMES = 8;  // frames of overlap for scene-to-scene crossfade

// ─── Whisper Caption Overlay ─────────────────────────────────────────────────
// Karaoke-style captions: shows current spoken word highlighted, surrounded by
// recent context. Tight window prevents words appearing before they're spoken.
const CaptionOverlay: React.FC<{
  words: WhisperWord[];
  color: string;
}> = ({ words, color }) => {
  const frame = useCurrentFrame();
  const timeSecs = frame / FPS;

  if (!words || words.length === 0) return null;

  // Tight window: 1.5s of past context, only 0.1s lookahead (avoids future words)
  const PAST_WINDOW  = 1.5;
  const FWD_WINDOW   = 0.1;
  const MAX_WORDS    = 8;

  const captionWords = words.filter(
    w => w.start <= timeSecs + FWD_WINDOW && w.end >= timeSecs - PAST_WINDOW
  ).slice(-MAX_WORDS);

  if (captionWords.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 52,
      left: '8%',
      right: '8%',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      zIndex: 100,
      // Semi-transparent pill backing for readability
      background: 'rgba(5,10,20,0.72)',
      borderRadius: 14,
      padding: '10px 20px',
    }}>
      {captionWords.map((w, i) => {
        const isActive = w.start <= timeSecs && w.end >= timeSecs;
        const isPast   = w.end < timeSecs;
        return (
          <span
            key={`${w.start}-${i}`}
            style={{
              fontFamily: SANS,
              fontSize: 30,
              fontWeight: isActive ? 800 : 500,
              color: isActive ? '#ffffff' : isPast ? TEXT_DIM : `${TEXT_DIM}88`,
              background: isActive ? `${color}dd` : 'transparent',
              padding: isActive ? '3px 12px' : '3px 4px',
              borderRadius: 8,
              lineHeight: 1.4,
            }}
          >
            {w.word.trim()}
          </span>
        );
      })}
    </div>
  );
};

// ─── Seeded pseudo-random (reproducible) ─────────────────────────────────────
const seededRandom = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

// ─── Dynamic Ken Burns (pan + zoom with direction variation) ─────────────────
// Returns { scale, translateX, translateY } based on scene index seed
const dynamicKenBurns = (localFrame: number, totalFrames: number, seed: number) => {
  const r = seededRandom(seed);
  const r2 = seededRandom(seed + 42);
  // Zoom: 1.0 → 1.08–1.14 (more than the old 1.06)
  const zoomEnd = 1.08 + r * 0.06;
  const scale = interpolate(localFrame, [0, totalFrames], [1.0, zoomEnd], { extrapolateRight: 'clamp' });
  // Pan direction varies by seed: -3% to +3% drift
  const panX = interpolate(localFrame, [0, totalFrames], [0, (r - 0.5) * 6], { extrapolateRight: 'clamp' });
  const panY = interpolate(localFrame, [0, totalFrames], [0, (r2 - 0.5) * 4], { extrapolateRight: 'clamp' });
  return { scale, translateX: panX, translateY: panY };
};

// ─── Crossfade wrapper ──────────────────────────────────────────────────────
// Fades in at scene start, fades out at scene end for smooth transitions
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

// ─── Lower Third ────────────────────────────────────────────────────────────
// Semi-transparent attribution bar for sources/dates/names
const LowerThird: React.FC<{
  label: string;
  color: string;
  localFrame: number;
}> = ({ label, color, localFrame }) => {
  const { fps } = useVideoConfig();
  const slideIn = spring({ frame: localFrame - 20, fps, config: { damping: 25, stiffness: 60 } });
  if (!label) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 100, left: 40, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 0,
      opacity: slideIn,
      transform: `translateX(${interpolate(slideIn, [0, 1], [-80, 0])}px)`,
    }}>
      <div style={{
        width: 4, height: 36, background: color, borderRadius: 2,
      }} />
      <div style={{
        background: 'rgba(5,10,20,0.82)', padding: '8px 20px 8px 14px',
        borderRadius: '0 8px 8px 0',
      }}>
        <span style={{
          fontFamily: MONO, fontSize: 13, color: TEXT_DIM,
          letterSpacing: '0.08em',
        }}>
          {label}
        </span>
      </div>
    </div>
  );
};

// ─── Animated Fact Callout ──────────────────────────────────────────────────
// Pop-in callout for key stats overlaid on image scenes
const FactCallout: React.FC<{
  text: string;
  color: string;
  localFrame: number;
  position?: 'top-right' | 'top-left';
}> = ({ text, color, localFrame, position = 'top-right' }) => {
  const { fps } = useVideoConfig();
  const popIn = spring({ frame: localFrame - 25, fps, config: { damping: 14, stiffness: 80, mass: 0.8 } });
  if (!text) return null;
  const posStyle = position === 'top-right'
    ? { top: 80, right: 60 }
    : { top: 80, left: 60 };
  return (
    <div style={{
      position: 'absolute', ...posStyle, zIndex: 50,
      opacity: popIn,
      transform: `scale(${interpolate(popIn, [0, 1], [0.6, 1])})`,
    }}>
      <div style={{
        background: `${color}ee`, borderRadius: 12, padding: '14px 24px',
        boxShadow: `0 4px 30px ${color}44`,
      }}>
        <span style={{
          fontFamily: SANS, fontSize: 22, fontWeight: 800, color: '#ffffff',
          letterSpacing: '-0.01em',
        }}>
          {text}
        </span>
      </div>
    </div>
  );
};

// ─── Scene: Title Card ───────────────────────────────────────────────────────
const TitleCardScene: React.FC<{ scene: Scene; chapter: SEOChapterV2; localFrame: number }> = ({
  scene, chapter, localFrame,
}) => {
  const { fps } = useVideoConfig();
  const color = scene.accentColor ?? chapter.color;

  const titleIn = spring({ frame: localFrame, fps, config: { damping: 20, stiffness: 70 } });
  const subIn   = spring({ frame: localFrame - 12, fps, config: { damping: 22, stiffness: 65 } });
  const lineIn  = spring({ frame: localFrame - 8, fps, config: { damping: 25, stiffness: 80 } });

  return (
    <AbsoluteFill style={{ background: BG, justifyContent: 'center', padding: '0 120px' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '10%',
        width: 600, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
      }} />

      {/* Era label */}
      <div style={{
        fontFamily: MONO, fontSize: 15, color, letterSpacing: '0.2em',
        textTransform: 'uppercase', marginBottom: 20,
        opacity: subIn,
      }}>
        {chapter.era}
      </div>

      {/* Title */}
      <div style={{
        fontFamily: SANS, fontSize: 88, fontWeight: 900, color: TEXT,
        lineHeight: 1.05, letterSpacing: '-0.03em',
        transform: `translateX(${interpolate(titleIn, [0, 1], [-50, 0])}px)`,
        opacity: titleIn,
      }}>
        {scene.content}
      </div>

      {/* Accent line */}
      <div style={{
        height: 3, width: interpolate(lineIn, [0, 1], [0, 100]),
        background: color, borderRadius: 2, marginTop: 28, marginBottom: 28,
      }} />

      {/* Sub content */}
      {scene.subContent && (
        <div style={{
          fontFamily: SANS, fontSize: 26, color: TEXT_DIM, lineHeight: 1.6,
          maxWidth: 760, opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0, 1], [15, 0])}px)`,
        }}>
          {scene.subContent}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Scene: Fact Reveal ───────────────────────────────────────────────────────
const FactRevealScene: React.FC<{ scene: Scene; chapter: SEOChapterV2; localFrame: number; sceneIndex?: number; totalFrames?: number }> = ({
  scene, chapter, localFrame, sceneIndex = 0, totalFrames = 150,
}) => {
  const { fps } = useVideoConfig();
  const color = scene.accentColor ?? chapter.color;
  const hasImage = !!scene.imageFile;

  const countIn  = spring({ frame: localFrame - 5, fps, config: { damping: 15, stiffness: 60 } });
  const labelIn  = spring({ frame: localFrame - 20, fps, config: { damping: 20, stiffness: 70 } });
  const kb = dynamicKenBurns(localFrame, totalFrames, sceneIndex + 100);

  return (
    <AbsoluteFill style={{ background: BG2 }}>
      {/* Background image */}
      {hasImage && (
        <>
          <div style={{
            position: 'absolute', inset: 0, overflow: 'hidden',
            transform: `scale(${kb.scale}) translate(${kb.translateX}%, ${kb.translateY}%)`, transformOrigin: 'center',
          }}>
            <img src={staticFile(scene.imageFile!)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,16,32,0.65)' }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        {/* Corner accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }} />

        {/* Big fact number/stat */}
        <div style={{
          fontFamily: MONO, fontSize: 140, fontWeight: 900,
          color, lineHeight: 1,
          transform: `scale(${interpolate(countIn, [0, 1], [0.7, 1])})`,
          opacity: countIn,
          textShadow: `0 0 80px ${color}44`,
        }}>
          {scene.content}
        </div>

        {/* Label */}
        <div style={{
          fontFamily: SANS, fontSize: 28, color: hasImage ? '#ffffffcc' : TEXT_DIM,
          textAlign: 'center', marginTop: 24,
          maxWidth: 700, lineHeight: 1.5,
          opacity: labelIn,
          textShadow: hasImage ? '0 2px 16px rgba(0,0,0,0.8)' : 'none',
        }}>
          {scene.subContent ?? ''}
        </div>

        {/* Year badge */}
        {scene.year && (
          <div style={{
            position: 'absolute', bottom: 60, right: 80,
            fontFamily: MONO, fontSize: 14, color: TEXT_DIM,
            letterSpacing: '0.15em',
          }}>
            {scene.year}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: Quote ─────────────────────────────────────────────────────────────
const QuoteScene: React.FC<{ scene: Scene; chapter: SEOChapterV2; localFrame: number; sceneIndex?: number; totalFrames?: number }> = ({
  scene, chapter, localFrame, sceneIndex = 0, totalFrames = 150,
}) => {
  const { fps } = useVideoConfig();
  const color = scene.accentColor ?? chapter.color;
  const hasImage = !!scene.imageFile;

  const quoteIn = spring({ frame: localFrame, fps, config: { damping: 22, stiffness: 60 } });
  const kb = dynamicKenBurns(localFrame, totalFrames, sceneIndex + 200);

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Background image with dark overlay */}
      {hasImage && (
        <>
          <div style={{
            position: 'absolute', inset: 0, overflow: 'hidden',
            transform: `scale(${kb.scale}) translate(${kb.translateX}%, ${kb.translateY}%)`, transformOrigin: 'center',
          }}>
            <img src={staticFile(scene.imageFile!)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,20,0.6)' }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 160px', height: '100%' }}>
        {/* Quote mark */}
        <div style={{
          fontFamily: SANS, fontSize: 180, fontWeight: 900,
          color: `${color}22`,
          position: 'absolute', top: 30, left: 80,
          lineHeight: 1, userSelect: 'none',
        }}>
          "
        </div>

        <div style={{
          fontFamily: SANS, fontSize: 42, fontWeight: 600,
          color: '#ffffff', lineHeight: 1.45,
          opacity: quoteIn,
          transform: `translateY(${interpolate(quoteIn, [0, 1], [30, 0])}px)`,
          textShadow: hasImage ? '0 2px 20px rgba(0,0,0,0.8)' : 'none',
        }}>
          {scene.content}
        </div>

        {scene.subContent && (
          <div style={{
            fontFamily: MONO, fontSize: 15, color,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginTop: 32, opacity: interpolate(quoteIn, [0, 1], [0, 0.8]),
          }}>
            — {scene.subContent}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: Character ─────────────────────────────────────────────────────────
const CharacterScene: React.FC<{ scene: Scene; chapter: SEOChapterV2; localFrame: number }> = ({
  scene, chapter, localFrame,
}) => {
  const { fps } = useVideoConfig();
  const color = scene.accentColor ?? chapter.color;

  const imgIn  = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 55 } });
  const textIn = spring({ frame: localFrame - 15, fps, config: { damping: 20, stiffness: 65 } });

  const imgFile = scene.imageFile ?? scene.characterFile ?? chapter.characterImageFile;

  return (
    <AbsoluteFill style={{ background: BG, flexDirection: 'row' }}>
      {/* Character image — right half */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%',
        opacity: imgIn,
        transform: `translateX(${interpolate(imgIn, [0, 1], [60, 0])}px)`,
      }}>
        <img
          src={staticFile(imgFile)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Fade left edge */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 200,
          background: `linear-gradient(90deg, ${BG}, transparent)`,
        }} />
      </div>

      {/* Text — left half */}
      <div style={{
        position: 'absolute', left: 80, top: 0, bottom: 0, width: '45%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        opacity: textIn,
      }}>
        <div style={{
          fontFamily: MONO, fontSize: 13, color, letterSpacing: '0.18em',
          textTransform: 'uppercase', marginBottom: 16,
        }}>
          {chapter.era}
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 52, fontWeight: 800, color: TEXT,
          lineHeight: 1.1, letterSpacing: '-0.02em',
        }}>
          {scene.content}
        </div>
        {scene.subContent && (
          <div style={{
            fontFamily: SANS, fontSize: 22, color: TEXT_DIM,
            lineHeight: 1.6, marginTop: 20, maxWidth: 440,
          }}>
            {scene.subContent}
          </div>
        )}
      </div>

      {/* Accent bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, transparent 60%)`,
      }} />
    </AbsoluteFill>
  );
};

// ─── Scene: Timeline ──────────────────────────────────────────────────────────
const TimelineScene: React.FC<{ scene: Scene; chapter: SEOChapterV2; localFrame: number; sceneIndex?: number; totalFrames?: number }> = ({
  scene, chapter, localFrame, sceneIndex = 0, totalFrames = 150,
}) => {
  const { fps } = useVideoConfig();
  const color = scene.accentColor ?? chapter.color;
  const hasImage = !!scene.imageFile;

  const lineIn = interpolate(localFrame, [0, 40], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const kb = dynamicKenBurns(localFrame, totalFrames, sceneIndex + 300);

  const events = (scene.subContent ?? '').split('|').map(e => e.trim()).filter(Boolean);

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Background image */}
      {hasImage && (
        <>
          <div style={{
            position: 'absolute', inset: 0, overflow: 'hidden',
            transform: `scale(${kb.scale}) translate(${kb.translateX}%, ${kb.translateY}%)`, transformOrigin: 'center',
          }}>
            <img src={staticFile(scene.imageFile!)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,20,0.7)' }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 100px', height: '100%' }}>
      <div style={{
        fontFamily: SANS, fontSize: 24, fontWeight: 700, color: hasImage ? '#ffffffaa' : TEXT_DIM,
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 50,
      }}>
        {scene.content}
      </div>

      {/* Timeline bar */}
      <div style={{ position: 'relative', height: 4, background: `${color}20`, borderRadius: 2, marginBottom: 40 }}>
        <div style={{
          height: '100%', width: `${lineIn * 100}%`,
          background: color, borderRadius: 2,
        }} />

        {/* Event markers */}
        {events.map((ev, i) => {
          const pos = (i + 1) / (events.length + 1);
          const markerIn = interpolate(localFrame, [i * 8 + 15, i * 8 + 35], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const [year, ...rest] = ev.split(':');
          return (
            <div key={i} style={{
              position: 'absolute', left: `${pos * 100}%`,
              transform: 'translateX(-50%)',
              opacity: markerIn,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: color, marginBottom: 14,
                transform: 'translateX(-50%) translateY(-4px)',
                boxShadow: `0 0 16px ${color}`,
              }} />
              <div style={{
                fontFamily: MONO, fontSize: 12, color,
                textAlign: 'center', whiteSpace: 'nowrap',
                transform: 'translateX(-50%)',
              }}>
                {year}
              </div>
              <div style={{
                fontFamily: SANS, fontSize: 11, color: TEXT_DIM,
                textAlign: 'center', maxWidth: 100,
                transform: 'translateX(-50%)',
              }}>
                {rest.join(':')}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: Transition ───────────────────────────────────────────────────────
const TransitionScene: React.FC<{ scene: Scene; chapter: SEOChapterV2; localFrame: number; totalFrames: number }> = ({
  scene, chapter, localFrame, totalFrames,
}) => {
  const color = scene.accentColor ?? chapter.color;
  const progress = localFrame / totalFrames;

  return (
    <AbsoluteFill style={{ background: BG, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        width: `${interpolate(progress, [0, 0.5, 1], [0, 100, 0])}%`,
        height: 2, background: color, borderRadius: 1,
        boxShadow: `0 0 20px ${color}`,
      }} />
    </AbsoluteFill>
  );
};

// ─── Scene: Image Reveal ─────────────────────────────────────────────────────
// Full-bleed concept image with dynamic Ken Burns + lower third + fact callout.
const ImageRevealScene: React.FC<{ scene: Scene; chapter: SEOChapterV2; localFrame: number; sceneIndex?: number; totalFrames?: number }> = ({
  scene, chapter, localFrame, sceneIndex = 0, totalFrames = 150,
}) => {
  const { fps } = useVideoConfig();
  const color = scene.accentColor ?? chapter.color;

  const imgIn  = spring({ frame: localFrame, fps, config: { damping: 25, stiffness: 50 } });
  const textIn = spring({ frame: localFrame - 12, fps, config: { damping: 22, stiffness: 65 } });

  // Dynamic Ken Burns — pan + zoom with direction variation per scene
  const kb = dynamicKenBurns(localFrame, totalFrames, sceneIndex);

  const imgFile = scene.imageFile ?? chapter.characterImageFile;

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
          src={staticFile(imgFile)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Cinematic gradient overlay — dark at top and bottom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.82) 100%)',
      }} />

      {/* Color accent line at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, transparent 70%)`,
        opacity: textIn,
      }} />

      {/* Fact callout for year badge */}
      {scene.year && (
        <FactCallout text={scene.year} color={color} localFrame={localFrame} />
      )}

      {/* Caption box at bottom */}
      {scene.content && (
        <div style={{
          position: 'absolute', bottom: 80, left: 80, right: 80,
          opacity: textIn,
          transform: `translateY(${interpolate(textIn, [0, 1], [20, 0])}px)`,
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 13, color, letterSpacing: '0.18em',
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            {chapter.era}
          </div>
          <div style={{
            fontFamily: SANS, fontSize: 38, fontWeight: 700, color: '#ffffff',
            lineHeight: 1.25, letterSpacing: '-0.01em',
            textShadow: '0 2px 24px rgba(0,0,0,0.8)',
            maxWidth: 900,
          }}>
            {scene.content}
          </div>
          {scene.subContent && (
            <div style={{
              fontFamily: SANS, fontSize: 20, color: 'rgba(255,255,255,0.75)',
              marginTop: 12, lineHeight: 1.5, maxWidth: 700,
              textShadow: '0 1px 12px rgba(0,0,0,0.9)',
            }}>
              {scene.subContent}
            </div>
          )}
        </div>
      )}

      {/* Lower third for sub-attribution */}
      {scene.subContent && scene.type === 'image_reveal' && (
        <LowerThird label={scene.subContent.slice(0, 60)} color={color} localFrame={localFrame} />
      )}
    </AbsoluteFill>
  );
};

// ─── Scene Dispatcher ─────────────────────────────────────────────────────────
const SceneRenderer: React.FC<{
  scene: Scene;
  chapter: SEOChapterV2;
  localFrame: number;
  totalFrames: number;
  sceneIndex: number;
}> = ({ scene, chapter, localFrame, totalFrames, sceneIndex }) => {
  const inner = (() => {
    switch (scene.type) {
      case 'title_card':   return <TitleCardScene scene={scene} chapter={chapter} localFrame={localFrame} />;
      case 'fact_reveal':  return <FactRevealScene scene={scene} chapter={chapter} localFrame={localFrame} sceneIndex={sceneIndex} totalFrames={totalFrames} />;
      case 'quote':        return <QuoteScene scene={scene} chapter={chapter} localFrame={localFrame} sceneIndex={sceneIndex} totalFrames={totalFrames} />;
      case 'character':    return <CharacterScene scene={scene} chapter={chapter} localFrame={localFrame} />;
      case 'timeline':     return <TimelineScene scene={scene} chapter={chapter} localFrame={localFrame} sceneIndex={sceneIndex} totalFrames={totalFrames} />;
      case 'transition':    return <TransitionScene scene={scene} chapter={chapter} localFrame={localFrame} totalFrames={totalFrames} />;
      case 'image_reveal':  return <ImageRevealScene scene={scene} chapter={chapter} localFrame={localFrame} sceneIndex={sceneIndex} totalFrames={totalFrames} />;
      default:              return <TitleCardScene scene={scene} chapter={chapter} localFrame={localFrame} />;
    }
  })();

  // Wrap non-transition scenes in crossfade for smooth scene-to-scene transitions
  if (scene.type === 'transition' || scene.type === 'title_card') return inner;
  return (
    <SceneCrossfade localFrame={localFrame} totalFrames={totalFrames}>
      {inner}
    </SceneCrossfade>
  );
};

// ─── Chapter renderer ────────────────────────────────────────────────────────
// When scenes carry Whisper startSecs, they are placed at exact timestamps so
// scene cuts align with speech boundaries. Without startSecs, scenes tile to fill.
const ChapterRenderer: React.FC<{ chapter: SEOChapterV2 }> = ({ chapter }) => {
  const frame = useCurrentFrame();
  const totalFrames = sec(chapter.audioDurationSecs);

  type SceneSlot = { scene: Scene; from: number; durationFrames: number };
  const slots: SceneSlot[] = [];

  const hasTimestamps = chapter.scenes.some(s => s.startSecs !== undefined);

  if (hasTimestamps) {
    // Whisper-synced: place each scene at its exact startSecs timestamp.
    // Duration = gap to next scene's startSecs (capped at totalFrames).
    for (let i = 0; i < chapter.scenes.length; i++) {
      const scene = chapter.scenes[i];
      const fromFrame = sec(scene.startSecs ?? 0);
      const nextStart = chapter.scenes[i + 1]?.startSecs ?? chapter.audioDurationSecs;
      const durationFrames = Math.max(1, Math.min(sec(nextStart) - fromFrame, totalFrames - fromFrame));
      if (fromFrame < totalFrames) {
        slots.push({ scene, from: fromFrame, durationFrames });
      }
    }
  } else {
    // Fallback: tile scenes by durationSecs to fill audioDurationSecs
    let cursor = 0;
    let sceneIdx = 0;
    while (cursor < totalFrames) {
      const scene = chapter.scenes[sceneIdx % chapter.scenes.length];
      const d = Math.min(sec(scene.durationSecs), totalFrames - cursor);
      slots.push({ scene, from: cursor, durationFrames: d });
      cursor += d;
      sceneIdx++;
    }
  }

  return (
    <AbsoluteFill>
      {/* Audio for this chapter — full duration */}
      <Audio src={staticFile(chapter.audioFile)} volume={1} />

      {/* Render tiled scenes */}
      {slots.map((slot, i) => (
        <Sequence key={i} from={slot.from} durationInFrames={slot.durationFrames}>
          <SceneRenderer
            scene={slot.scene}
            chapter={chapter}
            localFrame={frame - slot.from}
            totalFrames={slot.durationFrames}
            sceneIndex={i}
          />
        </Sequence>
      ))}

      {/* Enhanced chapter progress bar — more prominent with glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
        background: 'rgba(255,255,255,0.08)',
        zIndex: 90,
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min((frame / totalFrames) * 100, 100)}%`,
          background: `linear-gradient(90deg, ${chapter.color}88, ${chapter.color})`,
          boxShadow: `0 0 12px ${chapter.color}66, 0 -2px 8px ${chapter.color}33`,
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* Chapter label — top left with better styling */}
      <div style={{
        position: 'absolute', top: 20, left: 32,
        display: 'flex', alignItems: 'center', gap: 8,
        zIndex: 80,
      }}>
        <div style={{
          width: 3, height: 18, background: chapter.color, borderRadius: 2,
        }} />
        <div style={{
          fontFamily: MONO, fontSize: 11,
          color: `${chapter.color}aa`,
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          {chapter.era} — {chapter.title}
        </div>
      </div>

      {/* Whisper caption overlay — synced word-by-word captions */}
      {chapter.words && chapter.words.length > 0 && (
        <CaptionOverlay
          words={chapter.words}
          color={chapter.color}
        />
      )}
    </AbsoluteFill>
  );
};

// ─── Main V2 Composition ─────────────────────────────────────────────────────
// Chapter duration = audioDurationSecs. Scenes tile/cycle to fill it.
export const SEODocumentaryV2: React.FC<SEODocumentaryV2Props> = ({ chapters }) => {
  const offsets: number[] = [];
  let total = 0;
  for (const ch of chapters) {
    offsets.push(total);
    total += sec(ch.audioDurationSecs);
  }

  return (
    <AbsoluteFill style={{ background: BG }}>
      {chapters.map((chapter, i) => (
        <Sequence key={chapter.id} from={offsets[i]} durationInFrames={sec(chapter.audioDurationSecs)}>
          <ChapterRenderer chapter={chapter} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ─── Default Props — Minimal placeholder ────────────────────────────────────
// Real props are always loaded from a JSON file (--props=seo_v2_props.json).
// This minimal default exists only to satisfy Remotion's composition registration.
export const seoDocumentaryV2DefaultProps: SEODocumentaryV2Props = {
  chapters: [
    {
      id: 'placeholder',
      title: 'Documentary',
      era: '',
      color: '#00ff88',
      audioFile: 'seo_audio/01_intro.mp3',
      audioDurationSecs: 10,
      characterImageFile: 'seo_characters/placeholder.png',
      scenes: [
        { type: 'title_card', durationSecs: 5, content: 'Loading...', subContent: 'Provide --props JSON to render' },
        { type: 'transition', durationSecs: 5, content: '' },
      ],
    },
  ],
};

// ─── Total frame calculator ───────────────────────────────────────────────────
export const getSEODocumentaryV2TotalFrames = (chapters: SEOChapterV2[]): number =>
  chapters.reduce((total, ch) => total + sec(ch.audioDurationSecs), 0);

export const seoDocumentaryV2TotalFrames = getSEODocumentaryV2TotalFrames(
  seoDocumentaryV2DefaultProps.chapters
);
