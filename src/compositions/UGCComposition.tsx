import React from 'react';
import {
  AbsoluteFill,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  staticFile,
} from 'remotion';

// UGC Video Composition Props
export interface UGCCompositionProps {
  videoSrc?: string;
  captions?: CaptionWord[];
  hookText?: string;
  showHookOverlay?: boolean;
  captionStyle?: 'karaoke' | 'subtitle' | 'bounce';
}

interface CaptionWord {
  word: string;
  start: number;
  end: number;
}

// Default props for preview
export const ugcDefaultProps: UGCCompositionProps = {
  videoSrc: 'media/TABL2182.MOV',
  hookText: "I'ma take my eyes in my graveyard",
  showHookOverlay: true,
  captionStyle: 'karaoke',
  captions: [
    { word: "I'ma", start: 0.5, end: 0.8 },
    { word: "take", start: 0.8, end: 1.0 },
    { word: "my", start: 1.0, end: 1.2 },
    { word: "eyes", start: 1.2, end: 1.5 },
    { word: "in", start: 1.5, end: 1.6 },
    { word: "my", start: 1.6, end: 1.8 },
    { word: "graveyard", start: 1.8, end: 2.5 },
  ],
};

// Hook overlay component
const HookOverlay: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animate in during first 30 frames
  const opacity = interpolate(frame, [0, 15, 90, 120], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [0, 15], [20, 0], {
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(frame, [0, 15], [0.9, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '15%',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 40px',
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: 16,
          padding: '20px 32px',
          maxWidth: '90%',
        }}
      >
        <p
          style={{
            color: '#fff',
            fontSize: 42,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.3,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};

// Karaoke-style captions
const KaraokeCaptions: React.FC<{ captions: CaptionWord[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find current and nearby words
  const currentWordIndex = captions.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  // Get words to display (context window)
  const startIndex = Math.max(0, currentWordIndex - 2);
  const endIndex = Math.min(captions.length, currentWordIndex + 4);
  const visibleWords = captions.slice(startIndex, endIndex);

  if (visibleWords.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12%',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          maxWidth: '95%',
        }}
      >
        {visibleWords.map((word, i) => {
          const globalIndex = startIndex + i;
          const isActive = globalIndex === currentWordIndex;
          const isPast = globalIndex < currentWordIndex;

          // Animation for active word
          const wordProgress = isActive
            ? interpolate(
                currentTime,
                [word.start, word.end],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              )
            : isPast
            ? 1
            : 0;

          const scale = isActive ? interpolate(wordProgress, [0, 0.5, 1], [1, 1.15, 1]) : 1;

          return (
            <span
              key={`${word.word}-${globalIndex}`}
              style={{
                fontSize: 48,
                fontWeight: 800,
                fontFamily: 'Inter, sans-serif',
                color: isActive ? '#FFD700' : isPast ? '#fff' : 'rgba(255,255,255,0.5)',
                textShadow: isActive
                  ? '0 0 20px rgba(255,215,0,0.8), 0 4px 8px rgba(0,0,0,0.5)'
                  : '0 2px 4px rgba(0,0,0,0.5)',
                transform: `scale(${scale})`,
                transition: 'color 0.1s ease',
              }}
            >
              {word.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Main UGC Composition
export const UGCComposition: React.FC<UGCCompositionProps> = ({
  videoSrc = ugcDefaultProps.videoSrc,
  captions = [],
  hookText,
  showHookOverlay = true,
  captionStyle = 'karaoke',
}) => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Resolve video source - always use staticFile for public folder assets
  const resolvedVideoSrc = videoSrc || 'media/TABL2182.MOV';

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background video - scaled to fill 9:16 */}
      <AbsoluteFill>
        <Video
          src={staticFile(resolvedVideoSrc)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>

      {/* Gradient overlay at bottom for caption readability */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          pointerEvents: 'none',
        }}
      />

      {/* Hook text overlay (first few seconds) */}
      {showHookOverlay && hookText && (
        <Sequence from={0} durationInFrames={150}>
          <HookOverlay text={hookText} />
        </Sequence>
      )}

      {/* Captions */}
      {captionStyle === 'karaoke' && captions.length > 0 && (
        <KaraokeCaptions captions={captions} />
      )}
    </AbsoluteFill>
  );
};

export default UGCComposition;
