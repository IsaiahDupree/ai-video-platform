import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Img,
  interpolate,
  spring,
} from 'remotion';
import { AnimatedCaptions, WordTiming, generateTranscriptFromText } from '../components/AnimatedCaptions';
import { AICharacter, CharacterPresets } from '../components/AICharacter';

// =============================================================================
// Full Video Demo - Shows All Remotion Capabilities
// =============================================================================
// Features: Captions, Characters, SFX, Transitions, Effects

export interface FullVideoDemoProps {
  title: string;
  script: string;
  voiceoverPath?: string;
  characterImage?: string;
  sfxEvents?: Array<{ frame: number; sfxId: string; volume?: number }>;
  captionStyle?: 'highlight' | 'bounce' | 'typewriter' | 'pop' | 'karaoke';
  theme?: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  [key: string]: unknown;
}

// Scene transition component
const SceneTransition: React.FC<{
  type: 'fade' | 'slide' | 'zoom' | 'wipe';
  direction?: 'in' | 'out';
}> = ({ type, direction = 'in' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const value = direction === 'in' ? progress : 1 - progress;

  switch (type) {
    case 'fade':
      return (
        <AbsoluteFill
          style={{
            backgroundColor: '#000',
            opacity: 1 - value,
          }}
        />
      );
    case 'slide':
      return (
        <AbsoluteFill
          style={{
            backgroundColor: '#000',
            transform: `translateX(${(1 - value) * 100}%)`,
          }}
        />
      );
    case 'zoom':
      return (
        <AbsoluteFill
          style={{
            backgroundColor: '#000',
            transform: `scale(${1 + (1 - value) * 2})`,
            opacity: 1 - value,
          }}
        />
      );
    case 'wipe':
      return (
        <AbsoluteFill
          style={{
            background: `linear-gradient(90deg, transparent ${value * 100}%, #000 ${value * 100}%)`,
          }}
        />
      );
    default:
      return null;
  }
};

// Animated title component
const AnimatedTitle: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        fontSize: 64,
        fontWeight: 700,
        color,
        transform: `scale(${scale})`,
        opacity,
        textAlign: 'center',
        textShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {text}
    </div>
  );
};

// SFX Layer component
const SfxLayer: React.FC<{
  events: Array<{ frame: number; sfxId: string; volume?: number }>;
}> = ({ events }) => {
  const sfxMap: Record<string, string> = {
    'whoosh': 'assets/sfx/transitions/whoosh_cinematic.mp3',
    'pop': 'assets/sfx/ui/meme_sfx_pack_iconic.wav',
    'impact': 'assets/sfx/impacts/fahhh_tiktok.wav',
    'meme_sfx_pack_iconic': 'assets/sfx/ui/meme_sfx_pack_iconic.wav',
    'whoosh_cinematic': 'assets/sfx/transitions/whoosh_cinematic.mp3',
    'fahhh_tiktok': 'assets/sfx/impacts/fahhh_tiktok.wav',
  };

  return (
    <>
      {events.map((event, i) => {
        const src = sfxMap[event.sfxId];
        if (!src) return null;

        return (
          <Sequence key={i} from={event.frame} durationInFrames={90}>
            <Audio src={staticFile(src)} volume={event.volume ?? 0.6} />
          </Sequence>
        );
      })}
    </>
  );
};

// Main composition
export const FullVideoDemo: React.FC<FullVideoDemoProps> = ({
  title,
  script,
  voiceoverPath,
  characterImage,
  sfxEvents = [],
  captionStyle = 'highlight',
  theme = {
    backgroundColor: '#0f0f23',
    textColor: '#ffffff',
    accentColor: '#6366f1',
  },
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Generate word timings from script
  const transcript = generateTranscriptFromText(script, 1.5, 140);

  // Calculate section timing
  const introFrames = 45;
  const outroFrames = 45;
  const contentFrames = durationInFrames - introFrames - outroFrames;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.backgroundColor }}>
      {/* Background gradient */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${theme.accentColor}22 0%, transparent 70%)`,
        }}
      />

      {/* Intro section */}
      <Sequence from={0} durationInFrames={introFrames}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <AnimatedTitle text={title} color={theme.textColor} />
        </AbsoluteFill>
        <SceneTransition type="fade" direction="in" />
      </Sequence>

      {/* Main content section */}
      <Sequence from={introFrames} durationInFrames={contentFrames}>
        <AbsoluteFill>
          {/* Character (if provided) */}
          {characterImage && (
            <AICharacter
              src={characterImage}
              {...CharacterPresets.narrator}
              animation={{ type: 'talk', intensity: 0.6 }}
              enterFrame={0}
            />
          )}

          {/* Animated captions */}
          <AnimatedCaptions
            transcript={transcript}
            style={{
              animation: captionStyle,
              fontSize: 42,
              highlightColor: theme.accentColor,
              position: 'bottom',
            }}
            maxWordsPerLine={5}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Outro section */}
      <Sequence from={introFrames + contentFrames} durationInFrames={outroFrames}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              padding: '20px 50px',
              backgroundColor: theme.accentColor,
              borderRadius: 16,
              fontSize: 48,
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Subscribe →
          </div>
        </AbsoluteFill>
        <SceneTransition type="fade" direction="out" />
      </Sequence>

      {/* Voiceover audio */}
      {voiceoverPath && (
        <Sequence from={introFrames}>
          <Audio src={staticFile(voiceoverPath)} volume={1} />
        </Sequence>
      )}

      {/* SFX events */}
      <SfxLayer events={sfxEvents} />

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 4,
          width: `${(frame / durationInFrames) * 100}%`,
          backgroundColor: theme.accentColor,
        }}
      />
    </AbsoluteFill>
  );
};

// Default props
export const fullVideoDemoDefaultProps: FullVideoDemoProps = {
  title: 'AI Video Production',
  script: 'This is a demo of Remotion capabilities. We have animated captions, AI characters, sound effects, and smooth transitions. All controlled programmatically.',
  captionStyle: 'highlight',
  sfxEvents: [
    { frame: 0, sfxId: 'whoosh', volume: 0.5 },
    { frame: 45, sfxId: 'pop', volume: 0.6 },
    { frame: 120, sfxId: 'pop', volume: 0.6 },
    { frame: 180, sfxId: 'impact', volume: 0.7 },
  ],
  theme: {
    backgroundColor: '#0f0f23',
    textColor: '#ffffff',
    accentColor: '#6366f1',
  },
};
