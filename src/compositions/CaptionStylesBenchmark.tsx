import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Audio,
} from 'remotion';
import { TikTokCaptions, TikTokStyle, TikTokStylePresets } from '../components/TikTokCaptions';
import { AICharacter } from '../components/AICharacter';
import { generateTranscriptFromText } from '../components/AnimatedCaptions';

// =============================================================================
// Caption Styles Benchmark
// =============================================================================
// Tests all TikTok caption styles + AI character integration

const STYLES: Array<{ name: string; style: TikTokStyle; color: string }> = [
  { name: 'BOUNCY', style: 'bouncy', color: '#00ff88' },
  { name: 'SHAKE', style: 'shake', color: '#ff4444' },
  { name: 'GLOW', style: 'glow', color: '#ff00ff' },
  { name: 'ZOOM', style: 'zoom', color: '#ffcc00' },
  { name: 'WAVE', style: 'wave', color: '#00ccff' },
  { name: 'COLOR CYCLE', style: 'color-cycle', color: '#ff8800' },
];

const DEMO_TEXT = 'This is a TikTok style caption test';

interface CaptionStylesBenchmarkProps {
  characterImage?: string;
  [key: string]: unknown;
}

export const CaptionStylesBenchmark: React.FC<CaptionStylesBenchmarkProps> = ({
  characterImage = 'assets/characters/robot_mascot.png',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const framesPerStyle = Math.floor(durationInFrames / STYLES.length);
  const currentStyleIndex = Math.min(
    Math.floor(frame / framesPerStyle),
    STYLES.length - 1
  );
  const currentStyle = STYLES[currentStyleIndex];

  // Generate transcript for current segment
  const segmentStartTime = (currentStyleIndex * framesPerStyle) / fps;
  const transcript = generateTranscriptFromText(DEMO_TEXT, segmentStartTime, 120);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      {/* Background gradient based on style color */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${currentStyle.color}33 0%, transparent 70%)`,
        }}
      />

      {/* Style label */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 32,
          fontWeight: 700,
          color: currentStyle.color,
          fontFamily: 'Inter, system-ui, sans-serif',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        Style: {currentStyle.name}
      </div>

      {/* AI Character */}
      <AICharacter
        src={characterImage}
        x={0}
        y={50}
        scale={0.4}
        animation={{ type: 'talk', intensity: 0.7 }}
      />

      {/* TikTok Captions */}
      <TikTokCaptions
        transcript={transcript}
        style={currentStyle.style}
        fontSize={52}
        accentColor={currentStyle.color}
        position="bottom"
        maxWordsVisible={5}
      />

      {/* Progress indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 40,
          right: 40,
          height: 4,
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 2,
        }}
      >
        <div
          style={{
            width: `${(frame / durationInFrames) * 100}%`,
            height: '100%',
            backgroundColor: currentStyle.color,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Style counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          right: 40,
          fontSize: 18,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'monospace',
        }}
      >
        {currentStyleIndex + 1} / {STYLES.length}
      </div>
    </AbsoluteFill>
  );
};

export const captionStylesBenchmarkDefaultProps: CaptionStylesBenchmarkProps = {
  characterImage: 'assets/characters/robot_mascot.png',
};
