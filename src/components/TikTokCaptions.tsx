import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

// =============================================================================
// TikTok-Style Captions
// =============================================================================
// Viral caption styles: bouncy, shake, glow, split, emoji-burst

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export type TikTokStyle = 
  | 'bouncy'      // Words bounce in one by one
  | 'shake'       // Active word shakes
  | 'glow'        // Neon glow on active word
  | 'split'       // Words split and rejoin
  | 'zoom'        // Zoom in on active word
  | 'wave'        // Wave effect across words
  | 'color-cycle' // Colors cycle through
  | 'stack'       // Words stack vertically with pop
  | 'explode';    // Words explode outward

interface TikTokCaptionsProps {
  transcript: WordTiming[];
  style?: TikTokStyle;
  fontSize?: number;
  fontFamily?: string;
  primaryColor?: string;
  accentColor?: string;
  position?: 'top' | 'center' | 'bottom';
  maxWordsVisible?: number;
}

// =============================================================================
// Individual Word Components by Style
// =============================================================================

const BouncyWord: React.FC<{
  word: string;
  isActive: boolean;
  index: number;
  frame: number;
  fps: number;
  startFrame: number;
  color: string;
  accentColor: string;
  fontSize: number;
}> = ({ word, isActive, index, frame, fps, startFrame, color, accentColor, fontSize }) => {
  const localFrame = frame - startFrame;
  
  let y = 0;
  let scale = 1;
  let rotation = 0;

  if (isActive && localFrame >= 0) {
    const bounce = spring({
      frame: localFrame,
      fps,
      config: { damping: 6, stiffness: 200, mass: 0.5 },
    });
    y = interpolate(bounce, [0, 1], [-60, 0]);
    scale = interpolate(bounce, [0, 0.3, 1], [0.3, 1.4, 1]);
    rotation = interpolate(bounce, [0, 0.5, 1], [-10, 5, 0]);
  }

  return (
    <span
      style={{
        display: 'inline-block',
        transform: `translateY(${y}px) scale(${scale}) rotate(${rotation}deg)`,
        color: isActive ? accentColor : color,
        fontWeight: isActive ? 900 : 700,
        fontSize: isActive ? fontSize * 1.2 : fontSize,
        marginRight: 12,
        textShadow: isActive ? `0 0 20px ${accentColor}` : 'none',
        transition: 'color 0.1s',
      }}
    >
      {word}
    </span>
  );
};

const ShakeWord: React.FC<{
  word: string;
  isActive: boolean;
  frame: number;
  color: string;
  accentColor: string;
  fontSize: number;
}> = ({ word, isActive, frame, color, accentColor, fontSize }) => {
  let x = 0;
  let y = 0;
  let rotation = 0;

  if (isActive) {
    const shake = Math.sin(frame * 2) * 3;
    x = shake;
    y = Math.cos(frame * 2.5) * 2;
    rotation = Math.sin(frame * 3) * 2;
  }

  return (
    <span
      style={{
        display: 'inline-block',
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
        color: isActive ? accentColor : color,
        fontWeight: 800,
        fontSize,
        marginRight: 12,
        textShadow: isActive ? `2px 2px 0 #000, -2px -2px 0 #000` : 'none',
      }}
    >
      {word}
    </span>
  );
};

const GlowWord: React.FC<{
  word: string;
  isActive: boolean;
  frame: number;
  color: string;
  accentColor: string;
  fontSize: number;
}> = ({ word, isActive, frame, color, accentColor, fontSize }) => {
  const glowIntensity = isActive ? 20 + Math.sin(frame * 0.3) * 10 : 0;

  return (
    <span
      style={{
        display: 'inline-block',
        color: isActive ? accentColor : color,
        fontWeight: 800,
        fontSize: isActive ? fontSize * 1.1 : fontSize,
        marginRight: 12,
        textShadow: isActive
          ? `0 0 ${glowIntensity}px ${accentColor}, 0 0 ${glowIntensity * 2}px ${accentColor}, 0 0 ${glowIntensity * 3}px ${accentColor}`
          : '2px 2px 4px rgba(0,0,0,0.5)',
        transition: 'all 0.15s ease',
      }}
    >
      {word}
    </span>
  );
};

const ZoomWord: React.FC<{
  word: string;
  isActive: boolean;
  frame: number;
  fps: number;
  startFrame: number;
  color: string;
  accentColor: string;
  fontSize: number;
}> = ({ word, isActive, frame, fps, startFrame, color, accentColor, fontSize }) => {
  const localFrame = frame - startFrame;
  let scale = 1;

  if (isActive && localFrame >= 0) {
    scale = spring({
      frame: localFrame,
      fps,
      config: { damping: 10, stiffness: 150 },
    });
    scale = interpolate(scale, [0, 1], [0.5, 1.3]);
  }

  return (
    <span
      style={{
        display: 'inline-block',
        transform: `scale(${scale})`,
        color: isActive ? accentColor : color,
        fontWeight: 800,
        fontSize,
        marginRight: 12,
        textShadow: '3px 3px 0 #000',
      }}
    >
      {word}
    </span>
  );
};

const WaveWord: React.FC<{
  word: string;
  index: number;
  frame: number;
  color: string;
  accentColor: string;
  fontSize: number;
}> = ({ word, index, frame, color, accentColor, fontSize }) => {
  const waveOffset = Math.sin((frame * 0.15) + (index * 0.5)) * 15;
  const hue = ((frame * 2) + (index * 30)) % 360;

  return (
    <span
      style={{
        display: 'inline-block',
        transform: `translateY(${waveOffset}px)`,
        color: `hsl(${hue}, 100%, 60%)`,
        fontWeight: 800,
        fontSize,
        marginRight: 12,
        textShadow: '2px 2px 0 #000',
      }}
    >
      {word}
    </span>
  );
};

const ColorCycleWord: React.FC<{
  word: string;
  isActive: boolean;
  index: number;
  frame: number;
  fontSize: number;
}> = ({ word, isActive, index, frame, fontSize }) => {
  const hue = isActive ? (frame * 10) % 360 : ((index * 40) + 200) % 360;
  const saturation = isActive ? 100 : 70;
  const lightness = isActive ? 60 : 50;

  return (
    <span
      style={{
        display: 'inline-block',
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        fontWeight: isActive ? 900 : 700,
        fontSize: isActive ? fontSize * 1.15 : fontSize,
        marginRight: 12,
        textShadow: '2px 2px 0 #000, -1px -1px 0 #000',
        transition: 'font-size 0.1s',
      }}
    >
      {word}
    </span>
  );
};

const StackWord: React.FC<{
  word: string;
  isActive: boolean;
  isPast: boolean;
  index: number;
  totalVisible: number;
  frame: number;
  fps: number;
  startFrame: number;
  accentColor: string;
  fontSize: number;
}> = ({ word, isActive, isPast, index, totalVisible, frame, fps, startFrame, accentColor, fontSize }) => {
  const localFrame = frame - startFrame;
  
  let y = 0;
  let opacity = isPast || isActive ? 1 : 0;
  let scale = 1;

  if (isActive && localFrame >= 0 && localFrame < 15) {
    const pop = spring({
      frame: localFrame,
      fps,
      config: { damping: 8, stiffness: 200 },
    });
    scale = interpolate(pop, [0, 1], [2, 1]);
    opacity = pop;
  }

  // Stack vertically
  const stackIndex = isPast ? index : (isActive ? index : -1);
  y = stackIndex * (fontSize + 10);

  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        opacity,
        color: isActive ? accentColor : '#ffffff',
        fontWeight: 800,
        fontSize,
        textShadow: '3px 3px 0 #000',
        whiteSpace: 'nowrap',
      }}
    >
      {word}
    </div>
  );
};

// =============================================================================
// Main TikTok Captions Component
// =============================================================================

export const TikTokCaptions: React.FC<TikTokCaptionsProps> = ({
  transcript,
  style = 'bouncy',
  fontSize = 56,
  fontFamily = "'Montserrat', 'Inter', sans-serif",
  primaryColor = '#ffffff',
  accentColor = '#ffff00',
  position = 'center',
  maxWordsVisible = 4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find current word
  const currentWordIndex = transcript.findIndex(
    (w) => currentTime >= w.start && currentTime < w.end
  );

  // Get visible words (current and nearby)
  const startIdx = Math.max(0, currentWordIndex - Math.floor(maxWordsVisible / 2));
  const endIdx = Math.min(transcript.length, startIdx + maxWordsVisible);
  const visibleWords = transcript.slice(startIdx, endIdx);

  // Position styling
  const positionStyle: React.CSSProperties = {
    top: position === 'top' ? 100 : position === 'center' ? '50%' : undefined,
    bottom: position === 'bottom' ? 150 : undefined,
    transform: position === 'center' ? 'translateY(-50%)' : undefined,
  };

  // Stack style needs different layout
  if (style === 'stack') {
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 300,
          fontFamily,
          ...positionStyle,
        }}
      >
        {visibleWords.map((wordTiming, i) => {
          const globalIndex = startIdx + i;
          const isActive = globalIndex === currentWordIndex;
          const isPast = globalIndex < currentWordIndex;
          const startFrame = Math.round(wordTiming.start * fps);

          return (
            <StackWord
              key={`${globalIndex}-${wordTiming.word}`}
              word={wordTiming.word}
              isActive={isActive}
              isPast={isPast}
              index={i}
              totalVisible={visibleWords.length}
              frame={frame}
              fps={fps}
              startFrame={startFrame}
              accentColor={accentColor}
              fontSize={fontSize}
            />
          );
        })}
      </div>
    );
  }

  // Inline styles for other modes
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '0 40px',
        fontFamily,
        ...positionStyle,
      }}
    >
      {visibleWords.map((wordTiming, i) => {
        const globalIndex = startIdx + i;
        const isActive = globalIndex === currentWordIndex;
        const isPast = globalIndex < currentWordIndex;
        const startFrame = Math.round(wordTiming.start * fps);

        const commonProps = {
          word: wordTiming.word,
          isActive,
          index: globalIndex,
          frame,
          fps,
          startFrame,
          color: primaryColor,
          accentColor,
          fontSize,
        };

        switch (style) {
          case 'bouncy':
            return <BouncyWord key={`${globalIndex}-${wordTiming.word}`} {...commonProps} />;
          case 'shake':
            return <ShakeWord key={`${globalIndex}-${wordTiming.word}`} {...commonProps} />;
          case 'glow':
            return <GlowWord key={`${globalIndex}-${wordTiming.word}`} {...commonProps} />;
          case 'zoom':
            return <ZoomWord key={`${globalIndex}-${wordTiming.word}`} {...commonProps} />;
          case 'wave':
            return <WaveWord key={`${globalIndex}-${wordTiming.word}`} {...commonProps} />;
          case 'color-cycle':
            return <ColorCycleWord key={`${globalIndex}-${wordTiming.word}`} {...commonProps} />;
          default:
            return <BouncyWord key={`${globalIndex}-${wordTiming.word}`} {...commonProps} />;
        }
      })}
    </div>
  );
};

// =============================================================================
// Style Presets
// =============================================================================

export const TikTokStylePresets = {
  viral: {
    style: 'bouncy' as TikTokStyle,
    fontSize: 64,
    primaryColor: '#ffffff',
    accentColor: '#00ff88',
  },
  neon: {
    style: 'glow' as TikTokStyle,
    fontSize: 56,
    primaryColor: '#ffffff',
    accentColor: '#ff00ff',
  },
  energetic: {
    style: 'shake' as TikTokStyle,
    fontSize: 60,
    primaryColor: '#ffffff',
    accentColor: '#ff4444',
  },
  rainbow: {
    style: 'color-cycle' as TikTokStyle,
    fontSize: 58,
    primaryColor: '#ffffff',
    accentColor: '#ffff00',
  },
  dramatic: {
    style: 'zoom' as TikTokStyle,
    fontSize: 62,
    primaryColor: '#ffffff',
    accentColor: '#ffcc00',
  },
  wave: {
    style: 'wave' as TikTokStyle,
    fontSize: 54,
    primaryColor: '#ffffff',
    accentColor: '#00ccff',
  },
};
