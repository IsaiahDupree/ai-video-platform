/**
 * Pipeline Ad Composition
 *
 * Sequences AI-generated lipsync clips with Remotion-powered overlays,
 * before/after image reveals, animated captions, and branded CTA cards.
 *
 * Timeline (30s default at 30fps):
 *   0.0s - 2.0s:  Hook frame — before.png + animated headline
 *   2.0s - ~24s:  Lipsync clips sequenced with cross-dissolve transitions
 *   ~24s - ~27s:  After reveal — after.png with whip-pan transition
 *   ~27s - 30s:   CTA card with pulsing button
 *
 * Props accept paths relative to public/ (use staticFile) or absolute paths.
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  staticFile,
  Easing,
} from 'remotion';

// =============================================================================
// Types
// =============================================================================

export interface PipelineClip {
  src: string;       // path to clip_XX.mp4 (relative to public/ or absolute)
  line: string;      // script line spoken in this clip
  durationSec: number;
}

export interface PipelineAdProps {
  // Session metadata
  headline?: string;
  subheadline?: string;
  voiceScript?: string;
  hookFormula?: string;
  commentKeyword?: string;

  // Asset paths (relative to public/)
  beforeImageSrc?: string;
  afterImageSrc?: string;
  characterSheetSrc?: string;
  clips?: PipelineClip[];

  // Brand
  brandName?: string;
  brandLogoSrc?: string;
  primaryColor?: string;
  accentColor?: string;
  ctaText?: string;

  // Timing overrides
  hookDurationSec?: number;
  afterRevealDurationSec?: number;
  ctaDurationSec?: number;

  // Style
  captionStyle?: 'karaoke' | 'subtitle';
  showHookOverlay?: boolean;
  showProgressBar?: boolean;
  colorScheme?: 'dark' | 'light';
}

// =============================================================================
// Default props — best session: 2026-02-22T00-05-40
// =============================================================================

// Assets copied to public/pipeline-ad/ (14MB) to avoid bundling the full 2.8GB public dir
const AD_ASSETS = 'pipeline-ad';

export const pipelineAdDefaultProps: PipelineAdProps = {
  headline: 'Stay Close with Friends Again',
  subheadline: 'Discover an effortless way to reconnect and nurture friendships.',
  voiceScript: [
    'if you struggle with keeping up with important relationships, try this.',
    'you know that feeling when you see an old friend\'s name, and the real problem is life gets in the way.',
    'but then i found something that helps me stay in touch, without stress.',
    'after two weeks, i\'d reconnected with twelve people i thought i\'d lost.',
    'link in bio if you want to try it.',
  ].join('\n'),
  hookFormula: 'problem_solution',
  commentKeyword: 'reconnect',

  beforeImageSrc: `${AD_ASSETS}/before.png`,
  afterImageSrc: `${AD_ASSETS}/after.png`,
  characterSheetSrc: `${AD_ASSETS}/character_sheet.png`,
  clips: [
    { src: `${AD_ASSETS}/clips/clip_01.mp4`, line: 'if you struggle with keeping up with important relationships, try this.', durationSec: 5.79 },
    { src: `${AD_ASSETS}/clips/clip_02.mp4`, line: 'you know that feeling when you see an old friend\'s name,', durationSec: 5.79 },
    { src: `${AD_ASSETS}/clips/clip_03.mp4`, line: 'and the real problem is life gets in the way.', durationSec: 5.79 },
    { src: `${AD_ASSETS}/clips/clip_04.mp4`, line: 'but then i found something that helps me stay in touch, without stress.', durationSec: 5.79 },
  ],

  brandName: 'EverReach',
  primaryColor: '#6366f1',
  accentColor: '#22c55e',
  ctaText: 'Link in Bio',

  hookDurationSec: 2.5,
  afterRevealDurationSec: 3,
  ctaDurationSec: 3,

  captionStyle: 'karaoke',
  showHookOverlay: true,
  showProgressBar: true,
  colorScheme: 'dark',
};

// =============================================================================
// Sub-components
// =============================================================================

/** Animated hook text overlay */
const HookOverlay: React.FC<{
  headline: string;
  subheadline: string;
  primaryColor: string;
}> = ({ headline, subheadline, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({ frame: frame - 5, fps, config: { damping: 14, stiffness: 100 } });
  const headlineOpacity = interpolate(frame, [3, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subY = interpolate(frame, [20, 35], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Fade out at end
  const totalFrames = fps * 2.5;
  const fadeOut = interpolate(frame, [totalFrames - 15, totalFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 60px',
        opacity: fadeOut,
      }}
    >
      {/* Dark gradient overlay for readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.3) 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* Headline */}
        <h1 style={{
          fontSize: 64,
          fontWeight: 900,
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#fff',
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          opacity: headlineOpacity,
          transform: `scale(${headlineScale})`,
        }}>
          {headline}
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: 28,
          fontWeight: 500,
          fontFamily: 'Inter, system-ui, sans-serif',
          color: 'rgba(255,255,255,0.85)',
          margin: '16px 0 0 0',
          lineHeight: 1.4,
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
        }}>
          {subheadline}
        </p>

        {/* Accent line */}
        <div style={{
          width: interpolate(frame, [10, 30], [0, 120], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          height: 4,
          background: primaryColor,
          borderRadius: 2,
          margin: '20px auto 0',
          opacity: headlineOpacity,
          boxShadow: `0 0 20px ${primaryColor}80`,
        }} />
      </div>
    </AbsoluteFill>
  );
};

/** Karaoke-style caption overlay for lipsync clips */
const LipsyncCaption: React.FC<{
  line: string;
  primaryColor: string;
}> = ({ line, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const words = line.split(/\s+/);
  const wordsPerSec = 2.8;
  const totalDuration = durationInFrames / fps;

  return (
    <div style={{
      position: 'absolute',
      bottom: '12%',
      left: 0, right: 0,
      display: 'flex',
      justifyContent: 'center',
      padding: '0 40px',
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: 16,
        padding: '14px 24px',
        maxWidth: '90%',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
      }}>
        {words.map((word, i) => {
          const wordStart = (i / wordsPerSec) * fps;
          const wordEnd = ((i + 1) / wordsPerSec) * fps;
          const isActive = frame >= wordStart && frame < wordEnd;
          const isPast = frame >= wordEnd;

          const scale = isActive
            ? interpolate(frame, [wordStart, wordStart + fps * 0.15], [1, 1.12], { extrapolateRight: 'clamp' })
            : 1;

          return (
            <span
              key={`${word}-${i}`}
              style={{
                fontSize: 38,
                fontWeight: 800,
                fontFamily: 'Inter, system-ui, sans-serif',
                color: isActive ? '#FFD700' : isPast ? '#fff' : 'rgba(255,255,255,0.45)',
                textShadow: isActive
                  ? '0 0 16px rgba(255,215,0,0.7), 0 3px 6px rgba(0,0,0,0.5)'
                  : '0 2px 4px rgba(0,0,0,0.4)',
                transform: `scale(${scale})`,
                transition: 'color 0.08s ease',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** Cross-dissolve transition between clips */
const CrossDissolve: React.FC<{
  durationFrames: number;
  children: React.ReactNode;
}> = ({ durationFrames, children }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {children}
    </AbsoluteFill>
  );
};

/** After image reveal with whip-pan */
const AfterReveal: React.FC<{
  afterImageSrc: string;
  headline: string;
  primaryColor: string;
  accentColor: string;
}> = ({ afterImageSrc, headline, primaryColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Whip-pan in from right
  const slideX = interpolate(frame, [0, 12], [width, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Flash at start
  const flash = interpolate(frame, [0, 5, 10], [0, 0.6, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Label animation
  const labelScale = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 120 } });
  const labelOpacity = interpolate(frame, [12, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {/* After image */}
      <AbsoluteFill style={{ transform: `translateX(${slideX}px)` }}>
        <Img
          src={staticFile(afterImageSrc)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }} />

        {/* AFTER label */}
        <div style={{
          position: 'absolute', top: 40, left: '50%',
          transform: `translateX(-50%) scale(${labelScale})`,
          opacity: labelOpacity,
          background: accentColor,
          color: '#fff',
          padding: '10px 28px',
          borderRadius: 24,
          fontSize: 18,
          fontWeight: 800,
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          boxShadow: `0 4px 20px ${accentColor}60`,
        }}>
          AFTER
        </div>

        {/* Bottom text */}
        <div style={{
          position: 'absolute', bottom: 120, left: 0, right: 0,
          textAlign: 'center', padding: '0 40px',
        }}>
          <p style={{
            fontSize: 36, fontWeight: 700,
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#fff', margin: 0,
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
            opacity: labelOpacity,
          }}>
            {headline}
          </p>
        </div>
      </AbsoluteFill>

      {/* Flash overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#fff', opacity: flash, pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};

/** CTA card with pulsing button */
const CTACard: React.FC<{
  brandName: string;
  ctaText: string;
  commentKeyword?: string;
  primaryColor: string;
  accentColor: string;
}> = ({ brandName, ctaText, commentKeyword, primaryColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const buttonPulse = 1 + Math.sin(frame * 0.15) * 0.04;
  const arrowBounce = Math.sin(frame * 0.2) * 4;

  return (
    <AbsoluteFill style={{
      justifyContent: 'center', alignItems: 'center',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
    }}>
      <div style={{
        transform: `scale(${cardScale})`,
        textAlign: 'center',
        padding: '0 60px',
      }}>
        {/* Brand */}
        <p style={{
          fontSize: 24, fontWeight: 600,
          fontFamily: 'Inter, system-ui, sans-serif',
          color: 'rgba(255,255,255,0.6)',
          margin: '0 0 12px 0',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
        }}>
          {brandName}
        </p>

        {/* CTA Button */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          color: '#fff',
          padding: '20px 48px',
          borderRadius: 60,
          fontSize: 36,
          fontWeight: 800,
          fontFamily: 'Inter, system-ui, sans-serif',
          transform: `scale(${buttonPulse})`,
          boxShadow: `0 8px 32px ${primaryColor}40, 0 0 60px ${primaryColor}20`,
          letterSpacing: '-0.01em',
        }}>
          {ctaText}
          <span style={{ transform: `translateX(${arrowBounce}px)`, fontSize: 32 }}>→</span>
        </div>

        {/* Comment keyword */}
        {commentKeyword && (
          <p style={{
            fontSize: 22, fontWeight: 500,
            fontFamily: 'Inter, system-ui, sans-serif',
            color: 'rgba(255,255,255,0.5)',
            margin: '24px 0 0 0',
          }}>
            Comment "<span style={{ color: primaryColor, fontWeight: 700 }}>{commentKeyword}</span>" to get started
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Thin progress bar at top */
const ProgressBar: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = (frame / durationInFrames) * 100;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 4, background: 'rgba(255,255,255,0.15)', zIndex: 50,
    }}>
      <div style={{
        width: `${progress}%`, height: '100%',
        background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}cc)`,
        boxShadow: `0 0 8px ${primaryColor}60`,
      }} />
    </div>
  );
};

// =============================================================================
// Main Composition
// =============================================================================

export const PipelineAdComposition: React.FC<PipelineAdProps> = (inputProps) => {
  const merged = { ...pipelineAdDefaultProps, ...inputProps };
  const { fps, durationInFrames } = useVideoConfig();

  // Guaranteed non-optional values
  const headline = merged.headline ?? 'Stay Close with Friends Again';
  const subheadline = merged.subheadline ?? '';
  const beforeImageSrc = merged.beforeImageSrc ?? '';
  const afterImageSrc = merged.afterImageSrc ?? '';
  const clips = merged.clips ?? pipelineAdDefaultProps.clips!;
  const primaryColor = merged.primaryColor ?? '#6366f1';
  const accentColor = merged.accentColor ?? '#22c55e';
  const brandName = merged.brandName ?? 'EverReach';
  const ctaText = merged.ctaText ?? 'Link in Bio';
  const commentKeyword = merged.commentKeyword;
  const captionStyle = merged.captionStyle ?? 'karaoke';
  const showProgressBar = merged.showProgressBar ?? true;

  const hookFrames = Math.round((merged.hookDurationSec ?? 2.5) * fps);
  const afterFrames = Math.round((merged.afterRevealDurationSec ?? 3) * fps);
  const ctaFrames = Math.round((merged.ctaDurationSec ?? 3) * fps);

  // Calculate clip durations (in frames)
  const clipFrames = clips.map(c => Math.round(c.durationSec * fps));
  const totalClipFrames = clipFrames.reduce((a, b) => a + b, 0);

  // Dissolve overlap between clips (frames)
  const dissolveFrames = 6;

  // Timeline positions
  const clipsStart = hookFrames;
  const afterStart = clipsStart + totalClipFrames;
  const ctaStart = afterStart + afterFrames;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* ── Hook Frame: before.png + animated headline ── */}
      <Sequence from={0} durationInFrames={hookFrames + dissolveFrames}>
        <AbsoluteFill>
          <Img
            src={staticFile(beforeImageSrc)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* BEFORE label */}
          <Sequence from={5} durationInFrames={hookFrames - 5}>
            <div style={{
              position: 'absolute', top: 40, left: '50%',
              transform: 'translateX(-50%)',
              background: '#ef4444',
              color: '#fff',
              padding: '8px 24px',
              borderRadius: 24,
              fontSize: 16,
              fontWeight: 800,
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
              zIndex: 10,
            }}>
              BEFORE
            </div>
          </Sequence>
        </AbsoluteFill>
        <HookOverlay
          headline={headline}
          subheadline={subheadline}
          primaryColor={primaryColor}
        />
      </Sequence>

      {/* ── Lipsync Clips: sequenced with captions ── */}
      {clips.map((clip, i) => {
        const clipStart = clipsStart + clipFrames.slice(0, i).reduce((a, b) => a + b, 0);
        const clipDuration = clipFrames[i];

        return (
          <Sequence key={`clip-${i}`} from={clipStart} durationInFrames={clipDuration}>
            <AbsoluteFill>
              {/* Cross-dissolve for clips after the first */}
              {i > 0 ? (
                <CrossDissolve durationFrames={dissolveFrames}>
                  <OffthreadVideo
                    src={staticFile(clip.src)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </CrossDissolve>
              ) : (
                <OffthreadVideo
                  src={staticFile(clip.src)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}

              {/* Gradient for caption readability */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '35%',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                pointerEvents: 'none',
              }} />

              {/* Karaoke caption */}
              {captionStyle === 'karaoke' && (
                <LipsyncCaption line={clip.line} primaryColor={primaryColor} />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* ── After Reveal ── */}
      <Sequence from={afterStart} durationInFrames={afterFrames}>
        <AfterReveal
          afterImageSrc={afterImageSrc}
          headline={headline}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      </Sequence>

      {/* ── CTA Card ── */}
      <Sequence from={ctaStart} durationInFrames={ctaFrames}>
        <CTACard
          brandName={brandName}
          ctaText={ctaText}
          commentKeyword={commentKeyword}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      </Sequence>

      {/* ── Progress bar ── */}
      {showProgressBar && (
        <ProgressBar primaryColor={primaryColor} />
      )}
    </AbsoluteFill>
  );
};

export default PipelineAdComposition;
