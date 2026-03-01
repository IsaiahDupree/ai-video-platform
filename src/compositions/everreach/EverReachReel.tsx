import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from 'remotion';
import {
  EVERREACH_COLORS,
  EVERREACH_FONTS,
  AwarenessLevel,
  BeliefCluster,
} from './config';

// =============================================================================
// Types
// =============================================================================

export interface EverReachReelProps {
  // Beat content
  hookText?: string;            // Beat 1: Hook (0-2s) — pattern break
  mirrorText?: string;          // Beat 2: Mirror (2-5s) — "you've felt this"
  enemyText?: string;           // Beat 3: Enemy (5-8s) — name the problem
  mechanismText?: string;       // Beat 4: Mechanism (8-12s) — the system
  proofScreenshots?: string[];  // Beat 5: Proof (12-18s) — app screenshots
  ctaText?: string;             // Beat 6: CTA (last 3s) — single action

  // Awareness & Belief (for tracking)
  awareness?: AwarenessLevel;
  belief?: BeliefCluster;

  // Duration variant
  duration?: 15 | 20 | 25 | 30;

  // Brand
  brandName?: string;
  logoSrc?: string;
  accentColor?: string;

  // Visual
  theme?: 'dark' | 'warmGradient';
  showCaptions?: boolean;       // Sound-off captions (default true)
}

// =============================================================================
// Default Props
// =============================================================================

export const everReachReelDefaultProps: EverReachReelProps = {
  hookText: 'most friendships don\'t end — they drift',
  mirrorText: 'you care. you just get busy. and time disappears.',
  enemyText: 'the problem isn\'t effort. it\'s that you have no system.',
  mechanismText: 'a tiny daily rhythm — pick one person, get a message, send in 60 seconds.',
  proofScreenshots: [
    'everreach/screenshots/01-contacts-list.png',
    'everreach/screenshots/05-warmth-score.png',
    'everreach/screenshots/06-goal-compose.png',
  ],
  ctaText: 'Start free trial',
  awareness: 'unaware',
  belief: 'too_busy',
  duration: 20,
  brandName: 'EverReach',
  logoSrc: 'everreach/branding/logo-no-bg.png',
  accentColor: EVERREACH_COLORS.hot,
  theme: 'dark',
  showCaptions: true,
};

// =============================================================================
// Duration → beat timing maps (in frames @ 30fps)
// =============================================================================

interface BeatTiming {
  hook:      [number, number];
  mirror:    [number, number];
  enemy:     [number, number];
  mechanism: [number, number];
  proof:     [number, number];
  cta:       [number, number];
  total:     number;
}

function getBeatTimings(duration: number): BeatTiming {
  const fps = 30;
  switch (duration) {
    case 15: return {
      hook:      [0,       2 * fps],     // 0-2s
      mirror:    [2 * fps, 4 * fps],     // 2-4s
      enemy:     [4 * fps, 6 * fps],     // 4-6s
      mechanism: [6 * fps, 10 * fps],    // 6-10s
      proof:     [10 * fps, 13 * fps],   // 10-13s
      cta:       [13 * fps, 15 * fps],   // 13-15s
      total:     15 * fps,
    };
    case 25: return {
      hook:      [0,       2 * fps],
      mirror:    [2 * fps, 5 * fps],
      enemy:     [5 * fps, 8 * fps],
      mechanism: [8 * fps, 15 * fps],
      proof:     [15 * fps, 22 * fps],
      cta:       [22 * fps, 25 * fps],
      total:     25 * fps,
    };
    case 30: return {
      hook:      [0,       2 * fps],
      mirror:    [2 * fps, 5 * fps],
      enemy:     [5 * fps, 8 * fps],
      mechanism: [8 * fps, 15 * fps],
      proof:     [15 * fps, 25 * fps],
      cta:       [25 * fps, 30 * fps],
      total:     30 * fps,
    };
    default: return { // 20s (default)
      hook:      [0,       2 * fps],
      mirror:    [2 * fps, 5 * fps],
      enemy:     [5 * fps, 8 * fps],
      mechanism: [8 * fps, 13 * fps],
      proof:     [13 * fps, 18 * fps],
      cta:       [18 * fps, 20 * fps],
      total:     20 * fps,
    };
  }
}

// =============================================================================
// Beat Components
// =============================================================================

const TimedCaption: React.FC<{
  text: string;
  fontSize?: number;
  color?: string;
  bottom?: number;
  maxWidth?: string;
}> = ({ text, fontSize = 28, color = EVERREACH_COLORS.white, bottom = 120, maxWidth = '85%' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 8], [15, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        bottom,
        left: '50%',
        transform: `translateX(-50%) translateY(${slideUp}px)`,
        opacity: fadeIn,
        maxWidth,
        textAlign: 'center',
        zIndex: 20,
      }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: 12,
          padding: '12px 24px',
          display: 'inline-block',
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: EVERREACH_FONTS.weights.bold,
            color,
            fontFamily: EVERREACH_FONTS.heading,
            lineHeight: 1.3,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// Beat 1: Hook — Bold text slam, pattern break
const HookBeat: React.FC<{ text: string; accentColor: string }> = ({ text, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 8, stiffness: 120 } });
  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        <h1
          style={{
            fontSize: 56,
            fontWeight: EVERREACH_FONTS.weights.black,
            color: EVERREACH_COLORS.white,
            fontFamily: EVERREACH_FONTS.heading,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {text}
        </h1>
        <div
          style={{
            width: 60,
            height: 4,
            background: accentColor,
            borderRadius: 2,
            margin: '20px auto 0',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Beat 2: Mirror — Empathy, calm, "you've felt this"
const MirrorBeat: React.FC<{ text: string; showCaptions: boolean }> = ({ text, showCaptions }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
      }}
    >
      <p
        style={{
          fontSize: 36,
          fontWeight: EVERREACH_FONTS.weights.medium,
          color: EVERREACH_COLORS.lightGray,
          fontFamily: EVERREACH_FONTS.body,
          lineHeight: 1.5,
          textAlign: 'center',
          opacity: fadeIn,
          maxWidth: '85%',
        }}
      >
        {text}
      </p>
      {showCaptions && <TimedCaption text={text} fontSize={22} />}
    </AbsoluteFill>
  );
};

// Beat 3: Enemy — Name the problem, red accent
const EnemyBeat: React.FC<{ text: string; accentColor: string; showCaptions: boolean }> = ({
  text, accentColor, showCaptions,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const barWidth = interpolate(frame, [10, 30], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          width: `${barWidth}%`,
          maxWidth: 200,
          height: 4,
          background: accentColor,
          borderRadius: 2,
          marginBottom: 30,
        }}
      />

      <h2
        style={{
          fontSize: 40,
          fontWeight: EVERREACH_FONTS.weights.extrabold,
          color: EVERREACH_COLORS.white,
          fontFamily: EVERREACH_FONTS.heading,
          lineHeight: 1.2,
          textAlign: 'center',
          maxWidth: '85%',
          transform: `translateY(${(1 - slideIn) * 30}px)`,
          opacity: slideIn,
        }}
      >
        {text}
      </h2>
      {showCaptions && <TimedCaption text={text} fontSize={22} />}
    </AbsoluteFill>
  );
};

// Beat 4: Mechanism — The system reveal
const MechanismBeat: React.FC<{ text: string; accentColor: string; showCaptions: boolean }> = ({
  text, accentColor, showCaptions,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Split text into steps if it contains commas or dashes
  const steps = text.includes('—')
    ? text.split('—').map(s => s.trim())
    : text.includes(',')
      ? text.split(',').map(s => s.trim())
      : [text];

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
        gap: 20,
      }}
    >
      {steps.length > 1 ? (
        steps.map((step, i) => {
          const delay = i * 15;
          const stepOpacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: 'clamp' });
          const stepSlide = interpolate(frame, [delay, delay + 12], [20, 0], { extrapolateRight: 'clamp' });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: stepOpacity,
                transform: `translateY(${stepSlide}px)`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: accentColor,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: 16,
                  fontWeight: EVERREACH_FONTS.weights.bold,
                  color: EVERREACH_COLORS.dark,
                  fontFamily: EVERREACH_FONTS.heading,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: EVERREACH_FONTS.weights.semibold,
                  color: EVERREACH_COLORS.white,
                  fontFamily: EVERREACH_FONTS.body,
                  maxWidth: '80%',
                }}
              >
                {step}
              </span>
            </div>
          );
        })
      ) : (
        <p
          style={{
            fontSize: 32,
            fontWeight: EVERREACH_FONTS.weights.semibold,
            color: EVERREACH_COLORS.white,
            fontFamily: EVERREACH_FONTS.body,
            lineHeight: 1.4,
            textAlign: 'center',
            opacity: fadeIn,
            maxWidth: '85%',
          }}
        >
          {text}
        </p>
      )}
      {showCaptions && <TimedCaption text={steps.join(' → ')} fontSize={20} />}
    </AbsoluteFill>
  );
};

// Beat 5: Proof — Screenshot sequence with phone mockup
const ProofBeat: React.FC<{
  screenshots: string[];
  accentColor: string;
}> = ({ screenshots, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Cycle through screenshots
  const framesPerShot = Math.floor(durationInFrames / Math.max(screenshots.length, 1));
  const currentIndex = Math.min(
    Math.floor(frame / framesPerShot),
    screenshots.length - 1
  );
  const localFrame = frame - currentIndex * framesPerShot;

  const fadeIn = interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const phoneScale = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 80 } });

  const phoneWidth = 280;
  const phoneHeight = Math.round(phoneWidth * 2.16);
  const borderRadius = Math.round(phoneWidth * 0.12);

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Glow behind phone */}
      <div
        style={{
          position: 'absolute',
          width: phoneWidth * 1.5,
          height: phoneWidth * 1.5,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
          opacity: fadeIn,
        }}
      />

      {/* Phone mockup */}
      <div
        style={{
          width: phoneWidth,
          height: phoneHeight,
          borderRadius,
          border: '3px solid rgba(255,255,255,0.15)',
          background: '#000',
          overflow: 'hidden',
          transform: `scale(${phoneScale})`,
          opacity: fadeIn,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        {/* Dynamic Island */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: phoneWidth * 0.35,
            height: phoneWidth * 0.07,
            borderRadius: phoneWidth * 0.07,
            background: '#000',
            zIndex: 10,
          }}
        />
        {screenshots[currentIndex] && (
          <Img
            src={staticFile(screenshots[currentIndex])}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: borderRadius - 3,
            }}
          />
        )}
      </div>

      {/* Dot indicators */}
      {screenshots.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            display: 'flex',
            gap: 8,
          }}
        >
          {screenshots.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentIndex ? accentColor : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

// Beat 6: CTA — End card with logo + action
const CTABeat: React.FC<{
  ctaText: string;
  brandName: string;
  logoSrc?: string;
  accentColor: string;
}> = ({ ctaText, brandName, logoSrc, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });
  const ctaOpacity = interpolate(frame, [15, 25], [0, 1], { extrapolateRight: 'clamp' });
  const ctaPulse = interpolate(
    frame % 30, [0, 15, 30], [1, 1.05, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: EVERREACH_COLORS.gradientDark,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
      }}
    >
      {/* Logo */}
      {logoSrc && (
        <div style={{ transform: `scale(${logoScale})` }}>
          <Img
            src={staticFile(logoSrc)}
            style={{ height: 60, objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Brand name */}
      <h2
        style={{
          fontSize: 28,
          fontWeight: EVERREACH_FONTS.weights.medium,
          color: EVERREACH_COLORS.lightGray,
          fontFamily: EVERREACH_FONTS.heading,
          margin: 0,
          opacity: logoScale,
        }}
      >
        {brandName}
      </h2>

      {/* CTA Button */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaPulse})`,
        }}
      >
        <div
          style={{
            padding: '18px 48px',
            borderRadius: 50,
            background: accentColor,
            color: EVERREACH_COLORS.dark,
            fontSize: 22,
            fontWeight: EVERREACH_FONTS.weights.bold,
            fontFamily: EVERREACH_FONTS.heading,
          }}
        >
          {ctaText}
        </div>
      </div>

      {/* Subtext */}
      <p
        style={{
          fontSize: 16,
          color: EVERREACH_COLORS.gray,
          fontFamily: EVERREACH_FONTS.body,
          opacity: ctaOpacity,
          margin: 0,
        }}
      >
        No credit card required
      </p>
    </AbsoluteFill>
  );
};

// =============================================================================
// Main Reel Composition
// =============================================================================

export const EverReachReel: React.FC<EverReachReelProps> = (inputProps) => {
  const props = { ...everReachReelDefaultProps, ...inputProps };
  const {
    hookText,
    mirrorText,
    enemyText,
    mechanismText,
    proofScreenshots,
    ctaText,
    duration,
    brandName,
    logoSrc,
    accentColor,
    theme,
    showCaptions,
  } = props;

  const beats = getBeatTimings(duration || 20);
  const accent = accentColor || EVERREACH_COLORS.hot;
  const captions = showCaptions !== false;

  return (
    <AbsoluteFill style={{ background: EVERREACH_COLORS.dark }}>
      {/* Beat 1: Hook */}
      <Sequence from={beats.hook[0]} durationInFrames={beats.hook[1] - beats.hook[0]}>
        <HookBeat text={hookText || ''} accentColor={accent} />
      </Sequence>

      {/* Beat 2: Mirror */}
      <Sequence from={beats.mirror[0]} durationInFrames={beats.mirror[1] - beats.mirror[0]}>
        <MirrorBeat text={mirrorText || ''} showCaptions={captions} />
      </Sequence>

      {/* Beat 3: Enemy */}
      <Sequence from={beats.enemy[0]} durationInFrames={beats.enemy[1] - beats.enemy[0]}>
        <EnemyBeat text={enemyText || ''} accentColor={accent} showCaptions={captions} />
      </Sequence>

      {/* Beat 4: Mechanism */}
      <Sequence from={beats.mechanism[0]} durationInFrames={beats.mechanism[1] - beats.mechanism[0]}>
        <MechanismBeat text={mechanismText || ''} accentColor={accent} showCaptions={captions} />
      </Sequence>

      {/* Beat 5: Proof */}
      <Sequence from={beats.proof[0]} durationInFrames={beats.proof[1] - beats.proof[0]}>
        <ProofBeat screenshots={proofScreenshots || []} accentColor={accent} />
      </Sequence>

      {/* Beat 6: CTA */}
      <Sequence from={beats.cta[0]} durationInFrames={beats.cta[1] - beats.cta[0]}>
        <CTABeat
          ctaText={ctaText || 'Try it free'}
          brandName={brandName || 'EverReach'}
          logoSrc={logoSrc}
          accentColor={accent}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// =============================================================================
// Duration constants for registration
// =============================================================================

export const REEL_FPS = 30;

export function getReelDurationFrames(duration: 15 | 20 | 25 | 30 = 20): number {
  return duration * REEL_FPS;
}

export default EverReachReel;
