import React from 'react';
import {
  AbsoluteFill,
  Video,
  Audio,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  staticFile,
  OffthreadVideo,
} from 'remotion';
import { TikTokCaptions, WordTiming, TikTokStyle } from '../components/TikTokCaptions';

// =============================================================================
// Safe Zones for Social Media
// =============================================================================
// TikTok/Reels: Bottom 20% reserved for UI, Top 10% for status bar
// Safe area: 10% padding on sides

const SAFE_ZONES = {
  top: 120,      // Status bar + room
  bottom: 400,   // TikTok UI (like, comment, share buttons)
  sides: 60,     // Side padding
  captionArea: { top: '55%', bottom: 180 }, // Where captions go
};

// =============================================================================
// Types
// =============================================================================

interface NarrationSegment {
  id: string;
  text: string;
  audioSrc: string;
  duration: number;
  wordTimestamps: WordTiming[];
}

interface ClipSegment {
  id: string;
  videoSrc: string;
  duration: number;
  creator: string;
  transcript?: string;
  wordTimestamps?: WordTiming[];
}

interface TimelineSegment {
  type: 'title' | 'narration' | 'clip' | 'cta';
  startFrame: number;
  durationFrames: number;
  data: any;
}

export interface EverReachCompilationProps {
  title?: string;
  subtitle?: string;
  narrations?: NarrationSegment[];
  clips?: ClipSegment[];
  ctaText?: string;
  ctaUrl?: string;
  outroAudioSrc?: string;
  captionStyle?: TikTokStyle;
  theme?: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
}

// =============================================================================
// Title Card Component
// =============================================================================

const TitleCard: React.FC<{
  title: string;
  subtitle?: string;
  primaryColor: string;
}> = ({ title, subtitle, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const subtitleSpring = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 100 } });

  const titleScale = interpolate(titleSpring, [0, 1], [0.5, 1]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleSpring, [0, 1], [30, 0]);
  const subtitleOpacity = interpolate(subtitleSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, #1a0a2e 50%, #0a1a2e 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SAFE_ZONES.sides,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            marginBottom: 20,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 36,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
              fontFamily: "'Inter', sans-serif",
              transform: `translateY(${subtitleY}px)`,
              opacity: subtitleOpacity,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// Tip Number Overlay
// =============================================================================

const TipNumberOverlay: React.FC<{
  tipNumber: number;
  accentColor: string;
}> = ({ tipNumber, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const popSpring = spring({ frame, fps, config: { damping: 8, stiffness: 200 } });
  const scale = interpolate(popSpring, [0, 1], [0, 1]);
  const rotation = interpolate(popSpring, [0, 0.5, 1], [-15, 5, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        top: SAFE_ZONES.top,
        left: SAFE_ZONES.sides,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: 'top left',
      }}
    >
      <div
        style={{
          background: accentColor,
          borderRadius: 16,
          padding: '12px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#000',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          TIP #{tipNumber}
        </span>
      </div>
    </div>
  );
};

// =============================================================================
// Narration Segment with Background
// =============================================================================

const NarrationSegment: React.FC<{
  narration: NarrationSegment;
  tipNumber?: number;
  accentColor: string;
  backgroundColor: string;
  captionStyle: TikTokStyle;
}> = ({ narration, tipNumber, accentColor, backgroundColor, captionStyle }) => {
  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      {/* Audio */}
      <Audio src={staticFile(narration.audioSrc)} />

      {/* Tip number badge */}
      {tipNumber && <TipNumberOverlay tipNumber={tipNumber} accentColor={accentColor} />}

      {/* Animated captions in safe zone */}
      <TikTokCaptions
        transcript={narration.wordTimestamps}
        style={captionStyle}
        fontSize={56}
        primaryColor="#ffffff"
        accentColor={accentColor}
        position="center"
        maxWordsVisible={5}
      />
    </AbsoluteFill>
  );
};

// =============================================================================
// Video Clip Segment
// =============================================================================

const ClipSegment: React.FC<{
  clip: ClipSegment;
  tipNumber: number;
  accentColor: string;
  captionStyle: TikTokStyle;
}> = ({ clip, tipNumber, accentColor, captionStyle }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {/* Background video - using OffthreadVideo for better performance */}
      <OffthreadVideo
        src={staticFile(clip.videoSrc)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Gradient overlay for text readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '25%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '35%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
        }}
      />

      {/* Tip number badge */}
      <TipNumberOverlay tipNumber={tipNumber} accentColor={accentColor} />

      {/* Creator credit - in safe zone */}
      <div
        style={{
          position: 'absolute',
          bottom: SAFE_ZONES.bottom,
          right: SAFE_ZONES.sides,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: 8,
          padding: '8px 16px',
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          @{clip.creator}
        </span>
      </div>

      {/* Clip captions if available */}
      {clip.wordTimestamps && clip.wordTimestamps.length > 0 && (
        <TikTokCaptions
          transcript={clip.wordTimestamps}
          style={captionStyle}
          fontSize={48}
          primaryColor="#ffffff"
          accentColor={accentColor}
          position="bottom"
          maxWordsVisible={6}
        />
      )}
    </AbsoluteFill>
  );
};

// =============================================================================
// CTA Card
// =============================================================================

const CTACard: React.FC<{
  ctaText: string;
  ctaUrl: string;
  audioSrc?: string;
  wordTimestamps?: WordTiming[];
  accentColor: string;
  backgroundColor: string;
}> = ({ ctaText, ctaUrl, audioSrc, wordTimestamps, accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const buttonSpring = spring({ frame: frame - 30, fps, config: { damping: 10, stiffness: 150 } });
  const buttonScale = interpolate(buttonSpring, [0, 1], [0.8, 1]);
  const buttonOpacity = interpolate(buttonSpring, [0, 1], [0, 1]);

  // Pulse animation for CTA
  const pulse = Math.sin(frame * 0.15) * 0.05 + 1;

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      {/* Audio */}
      {audioSrc && <Audio src={staticFile(audioSrc)} />}

      {/* Captions */}
      {wordTimestamps && wordTimestamps.length > 0 && (
        <TikTokCaptions
          transcript={wordTimestamps}
          style="glow"
          fontSize={48}
          primaryColor="#ffffff"
          accentColor={accentColor}
          position="center"
          maxWordsVisible={6}
        />
      )}

      {/* CTA Button */}
      <div
        style={{
          position: 'absolute',
          bottom: SAFE_ZONES.bottom + 50,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          transform: `scale(${buttonScale * pulse})`,
          opacity: buttonOpacity,
        }}
      >
        <div
          style={{
            background: accentColor,
            borderRadius: 16,
            padding: '20px 48px',
            boxShadow: `0 0 30px ${accentColor}80`,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#000',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {ctaText}
          </span>
        </div>
        <span
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            opacity: 0.9,
          }}
        >
          {ctaUrl}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// Main Composition
// =============================================================================

export const EverReachCompilation: React.FC<EverReachCompilationProps> = (props) => {
  // Use defaults from everReachDefaultProps
  const {
    title = everReachDefaultProps.title,
    subtitle = everReachDefaultProps.subtitle,
    narrations = everReachDefaultProps.narrations,
    clips = everReachDefaultProps.clips,
    ctaText = everReachDefaultProps.ctaText,
    ctaUrl = everReachDefaultProps.ctaUrl,
    outroAudioSrc,
    captionStyle = 'bouncy',
    theme = {
      primaryColor: '#8B5CF6',
      accentColor: '#00ff88',
      backgroundColor: 'linear-gradient(135deg, #1a0a2e 0%, #0a1a2e 100%)',
    },
  } = props;
  const { fps } = useVideoConfig();

  // Build timeline
  let currentFrame = 0;
  const timeline: TimelineSegment[] = [];

  // 1. Title card (3 seconds)
  const titleDuration = 3 * fps;
  timeline.push({
    type: 'title',
    startFrame: currentFrame,
    durationFrames: titleDuration,
    data: { title, subtitle },
  });
  currentFrame += titleDuration;

  // 2. Intro narration
  if (narrations.length > 0) {
    const intro = narrations[0];
    const introDuration = Math.round(intro.duration * fps);
    timeline.push({
      type: 'narration',
      startFrame: currentFrame,
      durationFrames: introDuration,
      data: { narration: intro },
    });
    currentFrame += introDuration;
  }

  // 3. Tips: narration -> clip pairs
  const tipNarrations = narrations.slice(1, -1); // Exclude intro and outro
  const numTips = Math.min(tipNarrations.length, clips.length);

  for (let i = 0; i < numTips; i++) {
    // Tip narration
    const tipNarration = tipNarrations[i];
    const narrationDuration = Math.round(tipNarration.duration * fps);
    timeline.push({
      type: 'narration',
      startFrame: currentFrame,
      durationFrames: narrationDuration,
      data: { narration: tipNarration, tipNumber: i + 1 },
    });
    currentFrame += narrationDuration;

    // Video clip
    const clip = clips[i];
    const clipDuration = Math.round(clip.duration * fps);
    timeline.push({
      type: 'clip',
      startFrame: currentFrame,
      durationFrames: clipDuration,
      data: { clip, tipNumber: i + 1 },
    });
    currentFrame += clipDuration;
  }

  // 4. Outro CTA
  const outro = narrations[narrations.length - 1];
  const outroDuration = Math.round((outro?.duration || 5) * fps) + 2 * fps;
  timeline.push({
    type: 'cta',
    startFrame: currentFrame,
    durationFrames: outroDuration,
    data: {
      ctaText,
      ctaUrl,
      audioSrc: outro?.audioSrc || outroAudioSrc,
      wordTimestamps: outro?.wordTimestamps,
    },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {timeline.map((segment, index) => (
        <Sequence
          key={`${segment.type}-${index}`}
          from={segment.startFrame}
          durationInFrames={segment.durationFrames}
        >
          {segment.type === 'title' && (
            <TitleCard
              title={segment.data.title}
              subtitle={segment.data.subtitle}
              primaryColor={theme.primaryColor}
            />
          )}
          {segment.type === 'narration' && (
            <NarrationSegment
              narration={segment.data.narration}
              tipNumber={segment.data.tipNumber}
              accentColor={theme.accentColor}
              backgroundColor={theme.backgroundColor}
              captionStyle={captionStyle}
            />
          )}
          {segment.type === 'clip' && (
            <ClipSegment
              clip={segment.data.clip}
              tipNumber={segment.data.tipNumber}
              accentColor={theme.accentColor}
              captionStyle={captionStyle}
            />
          )}
          {segment.type === 'cta' && (
            <CTACard
              ctaText={segment.data.ctaText}
              ctaUrl={segment.data.ctaUrl}
              audioSrc={segment.data.audioSrc}
              wordTimestamps={segment.data.wordTimestamps}
              accentColor={theme.accentColor}
              backgroundColor={theme.backgroundColor}
            />
          )}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// =============================================================================
// Default Props for Preview
// =============================================================================

export const everReachDefaultProps: EverReachCompilationProps = {
  title: '5 Networking Tips',
  subtitle: 'That Will Change Your Life',
  ctaText: 'Join the Waitlist',
  ctaUrl: 'everreach.app',
  captionStyle: 'bouncy',
  narrations: [
    {
      id: 'intro',
      text: 'Here are 5 networking tips that will change how you build relationships.',
      audioSrc: 'audio/intro.mp3',
      duration: 4,
      wordTimestamps: [
        { word: 'Here', start: 0.1, end: 0.3 },
        { word: 'are', start: 0.3, end: 0.5 },
        { word: '5', start: 0.5, end: 0.7 },
        { word: 'networking', start: 0.7, end: 1.1 },
        { word: 'tips', start: 1.1, end: 1.4 },
      ],
    },
  ],
  clips: [
    {
      id: 'clip1',
      videoSrc: 'media/sample.mp4',
      duration: 6,
      creator: 'sample_creator',
    },
  ],
  theme: {
    primaryColor: '#8B5CF6',
    accentColor: '#00ff88',
    backgroundColor: 'linear-gradient(135deg, #1a0a2e 0%, #0a1a2e 100%)',
  },
};

export default EverReachCompilation;
