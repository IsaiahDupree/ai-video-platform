import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Video,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Easing,
} from 'remotion';
import { AnimatedCaptions, WordTiming, generateTranscriptFromText } from '../components/AnimatedCaptions';

// ============================================================================
// IsaiahStyleReel
// ============================================================================
// Reverse-engineered from @the_isaiah_dupree top-performing reels
//
// Style DNA (extracted from 3 top videos):
//   - Format: 720×1280 9:16 vertical @ 30fps
//   - Colors: warm muted tones (#817676, #706560) — dark bg, warm overlay
//   - Duration: 20–48s sweet spot
//   - Structure: hook text (0–2s) → voiceover + captions → numbered points
//   - Captions: white, bold, centered, 2–4 words at a time, pop animation
//   - Color grade: warm tint, slightly desaturated
//   - Pacing: cuts at silence gaps (~0.3–0.7s), tight edits
// ============================================================================

export interface IsaiahStyleReelProps {
  // Background video from iPhone (put in public/ or use staticFile path)
  backgroundVideoPath?: string;
  // Background color fallback (warm dark)
  backgroundColor?: string;
  // Hook text shown at start
  hook: string;
  // Main script / body lines (shown as text overlays between captions)
  scriptLines?: string[];
  // Full voiceover audio
  audioPath?: string;
  // Word-level transcript for animated captions (if available)
  transcript?: WordTiming[];
  // Fallback: plain text for auto-timing captions
  captionText?: string;
  // Numbered points to display (e.g. "3 steps")
  points?: string[];
  // CTA shown at end
  cta?: string;
  // Brand watermark text (e.g. "@the_isaiah_dupree")
  watermark?: string;
  // Color grade preset
  grade?: 'warm' | 'cool' | 'clean' | 'moody';
  // Caption style
  captionAnimation?: 'pop' | 'highlight' | 'karaoke' | 'bounce';
}

// Color grade presets based on Isaiah's actual video colors
const GRADE_PRESETS = {
  warm: 'saturate(0.85) brightness(0.92) sepia(0.12)',      // #817676 avg
  cool: 'saturate(0.8) brightness(0.95) hue-rotate(10deg)',
  clean: 'saturate(1.0) brightness(1.0)',
  moody: 'saturate(0.7) brightness(0.85) contrast(1.1) sepia(0.08)',
};

// Hook text overlay — animated entrance
const HookOverlay: React.FC<{ hook: string; frame: number; fps: number }> = ({
  hook, frame, fps,
}) => {
  const fadeIn = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const opacity = interpolate(fadeIn, [0, 1], [0, 1]);
  const translateY = interpolate(fadeIn, [0, 1], [30, 0]);

  // Fade out after 3s
  const fadeOut = interpolate(frame, [fps * 2.5, fps * 3.5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const finalOpacity = opacity * fadeOut;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 48px',
        opacity: finalOpacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
          fontWeight: 800,
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: '-0.5px',
          textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          maxWidth: 580,
        }}
      >
        {hook}
      </div>
    </div>
  );
};

// Numbered point card — slides in
const PointCard: React.FC<{
  number: number;
  text: string;
  frame: number;
  fps: number;
  startFrame: number;
}> = ({ number, text, frame, fps, startFrame }) => {
  const localFrame = frame - startFrame;
  const anim = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const translateX = interpolate(anim, [0, 1], [-60, 0]);
  const opacity = interpolate(anim, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        opacity,
        transform: `translateX(${translateX}px)`,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          fontSize: 22,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontSize: 32,
          fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
          fontWeight: 600,
          color: '#ffffff',
          lineHeight: 1.35,
          textShadow: '0 1px 8px rgba(0,0,0,0.6)',
          paddingTop: 4,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// CTA overlay at end
const CTAOverlay: React.FC<{ text: string; frame: number; fps: number; startFrame: number }> = ({
  text, frame, fps, startFrame,
}) => {
  const localFrame = frame - startFrame;
  const anim = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 100 } });
  const scale = interpolate(anim, [0, 1], [0.8, 1]);
  const opacity = interpolate(anim, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 40,
          padding: '14px 36px',
          fontSize: 28,
          fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '0.3px',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Watermark
const Watermark: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    <div
      style={{
        fontSize: 22,
        fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: '0.5px',
        textShadow: '0 1px 6px rgba(0,0,0,0.4)',
      }}
    >
      {text}
    </div>
  </div>
);

// Dark gradient overlay to ensure text readability
const GradientOverlay: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.55) 100%)',
      pointerEvents: 'none',
    }}
  />
);

// ============================================================================
// Main Composition
// ============================================================================

export const IsaiahStyleReel: React.FC<IsaiahStyleReelProps> = ({
  backgroundVideoPath,
  backgroundColor = '#1a1512',  // warm dark, matches Isaiah's palette
  hook,
  scriptLines = [],
  audioPath,
  transcript,
  captionText,
  points = [],
  cta,
  watermark = '@the_isaiah_dupree',
  grade = 'warm',
  captionAnimation = 'pop',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Auto-generate transcript if only captionText provided
  const resolvedTranscript = transcript ??
    (captionText ? generateTranscriptFromText(captionText, 2.5) : []);

  // Points display timing: start after hook (3s), show each for ~4s
  const pointsStartFrame = fps * 4;
  const pointDuration = fps * 4;

  // CTA timing: last 5 seconds
  const ctaStartFrame = durationInFrames - fps * 5;

  const colorFilter = GRADE_PRESETS[grade];

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Background video */}
      {backgroundVideoPath && (
        <AbsoluteFill>
          <Video
            src={backgroundVideoPath.startsWith('/') || backgroundVideoPath.startsWith('http')
              ? backgroundVideoPath
              : staticFile(backgroundVideoPath)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: colorFilter,
            }}
            muted={!!audioPath}  // mute bg video if we have separate audio
          />
        </AbsoluteFill>
      )}

      {/* Fallback: warm gradient bg when no video */}
      {!backgroundVideoPath && (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(ellipse at 30% 40%, #2d1f1a 0%, #1a1512 60%, #0d0a08 100%)',
            filter: colorFilter,
          }}
        />
      )}

      {/* Gradient overlay for text contrast */}
      <GradientOverlay />

      {/* Voiceover audio */}
      {audioPath && (
        <Audio
          src={audioPath.startsWith('/') || audioPath.startsWith('http')
            ? audioPath
            : staticFile(audioPath)}
        />
      )}

      {/* Hook text (first 3.5s) */}
      {frame < fps * 4 && (
        <HookOverlay hook={hook} frame={frame} fps={fps} />
      )}

      {/* Animated captions (synced to voiceover) */}
      {resolvedTranscript.length > 0 && (
        <AnimatedCaptions
          transcript={resolvedTranscript}
          style={{
            fontSize: 44,
            fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
            color: '#ffffff',
            highlightColor: '#FFE066',
            backgroundColor: 'rgba(0,0,0,0.0)',
            position: 'bottom',
            animation: captionAnimation,
          }}
          maxWordsPerLine={4}
        />
      )}

      {/* Numbered points (slides in after hook) */}
      {points.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '30%',
            padding: '0 48px',
          }}
        >
          {points.map((point, i) => {
            const pointStart = pointsStartFrame + i * pointDuration;
            if (frame < pointStart) return null;
            return (
              <PointCard
                key={i}
                number={i + 1}
                text={point}
                frame={frame}
                fps={fps}
                startFrame={pointStart}
              />
            );
          })}
        </div>
      )}

      {/* CTA overlay */}
      {cta && frame >= ctaStartFrame && (
        <CTAOverlay text={cta} frame={frame} fps={fps} startFrame={ctaStartFrame} />
      )}

      {/* Watermark */}
      {watermark && <Watermark text={watermark} />}
    </AbsoluteFill>
  );
};

// ============================================================================
// Default props (matches Isaiah's top-performing style)
// ============================================================================

export const isaiahStyleReelDefaultProps: IsaiahStyleReelProps = {
  hook: 'the friendship fade is real…',
  captionText: 'and it usually isn\'t drama. life just gets loud. here are 3 tiny moves that keep friendships alive without making it weird.',
  points: [
    'send the unsent message',
    'react before you reply',
    'make the next message normal',
  ],
  cta: 'follow for more',
  watermark: '@the_isaiah_dupree',
  grade: 'warm',
  captionAnimation: 'pop',
  backgroundColor: '#1a1512',
};
