import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from 'remotion';
import { UGCBeforeAfter, type UGCBeforeAfterProps } from './UGCBeforeAfter';
import { UGCTestimonial, type UGCTestimonialProps } from './UGCTestimonial';
import { UGCProductDemo, type UGCProductDemoProps } from './UGCProductDemo';
import { UGCProblemSolution, type UGCProblemSolutionProps } from './UGCProblemSolution';
import { UGCStatCounter, type UGCStatCounterProps } from './UGCStatCounter';
import { UGCFeatureList, type UGCFeatureListProps } from './UGCFeatureList';
import { UGCUrgency, type UGCUrgencyProps } from './UGCUrgency';

// =============================================================================
// UGC Video Ad Wrapper
//
// Wraps any UGC template composition with:
//   - Intro sequence (brand logo reveal, 1.5s)
//   - Main template content (4s of animated composition)
//   - Outro end card (CTA pulse + brand lockup, 2.5s)
//   - Optional background music & SFX
//   - Smooth transitions between sections
//
// Total duration: 8 seconds (240 frames @ 30fps)
// =============================================================================

type TemplateType =
  | 'before_after'
  | 'testimonial'
  | 'product_demo'
  | 'problem_solution'
  | 'stat_counter'
  | 'feature_list'
  | 'urgency';

export interface UGCVideoAdWrapperProps {
  // Template selection
  template?: TemplateType;
  templateProps?: Record<string, unknown>;

  // Brand
  brandName?: string;
  brandLogoSrc?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;

  // Outro / End card
  outroHeadline?: string;
  outroCtaText?: string;
  outroSubtext?: string;

  // Audio
  bgMusicSrc?: string;
  bgMusicVolume?: number;
  enableSfx?: boolean;
  sfxWhooshSrc?: string;
  sfxImpactSrc?: string;

  // Layout
  colorScheme?: 'dark' | 'light';
  showIntro?: boolean;
  showOutro?: boolean;
}

export const ugcVideoAdWrapperDefaultProps: UGCVideoAdWrapperProps = {
  template: 'before_after',
  templateProps: {},
  brandName: 'YourBrand',
  primaryColor: '#6366f1',
  accentColor: '#22c55e',
  fontFamily: 'Inter, system-ui, sans-serif',
  outroHeadline: 'Try It Free',
  outroCtaText: 'Get Started →',
  outroSubtext: 'Link in bio',
  bgMusicVolume: 0.15,
  enableSfx: true,
  sfxWhooshSrc: 'assets/sfx/transitions/whoosh_cinematic.mp3',
  sfxImpactSrc: 'assets/sfx/ui/meme_sfx_pack_iconic.wav',
  colorScheme: 'dark',
  showIntro: true,
  showOutro: true,
};

// Timeline constants (frames @ 30fps)
const INTRO_DURATION = 45;    // 1.5s
const MAIN_DURATION = 120;    // 4.0s
const OUTRO_DURATION = 75;    // 2.5s
const TOTAL_DURATION = INTRO_DURATION + MAIN_DURATION + OUTRO_DURATION; // 240 frames = 8s
const TRANSITION_OVERLAP = 15; // 0.5s crossfade

export const VIDEO_AD_DURATION = TOTAL_DURATION;
export const VIDEO_AD_FPS = 30;

// =============================================================================
// Template Renderer — renders the selected inner composition
// =============================================================================

const TemplateRenderer: React.FC<{
  template: TemplateType;
  templateProps: Record<string, unknown>;
}> = ({ template, templateProps }) => {
  switch (template) {
    case 'before_after':
      return <UGCBeforeAfter {...(templateProps as UGCBeforeAfterProps)} />;
    case 'testimonial':
      return <UGCTestimonial {...(templateProps as UGCTestimonialProps)} />;
    case 'product_demo':
      return <UGCProductDemo {...(templateProps as UGCProductDemoProps)} />;
    case 'problem_solution':
      return <UGCProblemSolution {...(templateProps as UGCProblemSolutionProps)} />;
    case 'stat_counter':
      return <UGCStatCounter {...(templateProps as UGCStatCounterProps)} />;
    case 'feature_list':
      return <UGCFeatureList {...(templateProps as UGCFeatureListProps)} />;
    case 'urgency':
      return <UGCUrgency {...(templateProps as UGCUrgencyProps)} />;
    default:
      return <UGCBeforeAfter {...(templateProps as UGCBeforeAfterProps)} />;
  }
};

// =============================================================================
// Intro Section — brand logo reveal with gradient sweep
// =============================================================================

const IntroSection: React.FC<{
  brandName?: string;
  brandLogoSrc?: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  colorScheme: string;
}> = ({ brandName, brandLogoSrc, primaryColor, accentColor, fontFamily, colorScheme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgColor = colorScheme === 'light' ? '#f8fafc' : '#0a0a0f';
  const textColor = colorScheme === 'light' ? '#1e293b' : '#ffffff';

  // Logo scale-up with spring
  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });
  // Logo opacity
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  // Brand name slide-up
  const nameY = interpolate(frame, [10, 25], [20, 0], { extrapolateRight: 'clamp' });
  const nameOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });
  // Exit fade for crossfade into main content
  const exitOpacity = interpolate(frame, [30, 45], [1, 0], { extrapolateRight: 'clamp' });

  // Gradient sweep background
  const sweepX = interpolate(frame, [0, 40], [-100, 100], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: bgColor, fontFamily, opacity: exitOpacity }}>
      {/* Animated gradient sweep */}
      <AbsoluteFill style={{
        background: `linear-gradient(${sweepX + 135}deg, ${primaryColor}15 0%, transparent 50%, ${accentColor}10 100%)`,
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 16,
      }}>
        {/* Logo */}
        {brandLogoSrc ? (
          <Img src={brandLogoSrc} style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            boxShadow: `0 8px 32px ${primaryColor}40`,
          }} />
        ) : (
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            fontWeight: 800,
            color: '#fff',
            boxShadow: `0 8px 32px ${primaryColor}40`,
          }}>
            {(brandName || 'B')[0].toUpperCase()}
          </div>
        )}

        {/* Brand name */}
        {brandName && (
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            color: textColor,
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
            letterSpacing: '-0.01em',
          }}>
            {brandName}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// Outro Section — CTA end card with pulsing button
// =============================================================================

const OutroSection: React.FC<{
  headline?: string;
  ctaText?: string;
  subtext?: string;
  brandName?: string;
  brandLogoSrc?: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  colorScheme: string;
}> = ({ headline, ctaText, subtext, brandName, brandLogoSrc, primaryColor, accentColor, fontFamily, colorScheme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgColor = colorScheme === 'light' ? '#f8fafc' : '#0a0a0f';
  const textColor = colorScheme === 'light' ? '#1e293b' : '#ffffff';
  const subtextColor = colorScheme === 'light' ? '#64748b' : '#a1a1aa';

  // Entry
  const enterOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Headline spring
  const headlineScale = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 80 } });

  // CTA button spring + pulse
  const ctaScale = spring({ frame: frame - 15, fps, config: { damping: 10, stiffness: 90 } });
  const ctaPulse = interpolate(
    (frame - 30) % 20, [0, 10, 20], [1, 1.06, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );
  const ctaFinalScale = frame > 30 ? ctaScale * ctaPulse : ctaScale;

  // Subtext
  const subtextOpacity = interpolate(frame, [25, 35], [0, 1], { extrapolateRight: 'clamp' });

  // Brand lockup
  const brandOpacity = interpolate(frame, [35, 45], [0, 0.7], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: bgColor, fontFamily, opacity: enterOpacity }}>
      {/* Radial glow */}
      <AbsoluteFill style={{
        background: `radial-gradient(circle at 50% 50%, ${primaryColor}12 0%, transparent 60%)`,
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 20,
        padding: 40,
      }}>
        {/* Headline */}
        {headline && (
          <div style={{
            fontSize: 48,
            fontWeight: 800,
            color: textColor,
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            transform: `scale(${headlineScale})`,
          }}>
            {headline}
          </div>
        )}

        {/* CTA Button */}
        {ctaText && (
          <div style={{
            transform: `scale(${ctaFinalScale})`,
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            color: '#ffffff',
            padding: '18px 48px',
            borderRadius: 50,
            fontSize: 22,
            fontWeight: 700,
            boxShadow: `0 6px 24px ${primaryColor}50`,
          }}>
            {ctaText}
          </div>
        )}

        {/* Subtext */}
        {subtext && (
          <div style={{
            fontSize: 16,
            fontWeight: 500,
            color: subtextColor,
            opacity: subtextOpacity,
          }}>
            {subtext}
          </div>
        )}

        {/* Brand lockup */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          opacity: brandOpacity,
          marginTop: 16,
        }}>
          {brandLogoSrc ? (
            <Img src={brandLogoSrc} style={{ width: 24, height: 24, borderRadius: 6 }} />
          ) : null}
          {brandName && (
            <span style={{ fontSize: 14, fontWeight: 600, color: subtextColor }}>
              {brandName}
            </span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// Main Video Ad Wrapper
// =============================================================================

export const UGCVideoAdWrapper: React.FC<UGCVideoAdWrapperProps> = (inputProps) => {
  const props = { ...ugcVideoAdWrapperDefaultProps, ...inputProps };

  const primaryColor = props.primaryColor || '#6366f1';
  const accentColor = props.accentColor || '#22c55e';
  const fontFamily = props.fontFamily || 'Inter, system-ui, sans-serif';
  const colorScheme = props.colorScheme || 'dark';

  const template: TemplateType = props.template || 'before_after';
  const templateProps = props.templateProps || {};

  const introStart = 0;
  const mainStart = props.showIntro ? INTRO_DURATION - TRANSITION_OVERLAP : 0;
  const mainDuration = MAIN_DURATION;
  const outroStart = mainStart + mainDuration - TRANSITION_OVERLAP;

  // Merge brand props into template props
  const fullTemplateProps: Record<string, unknown> = {
    brandName: props.brandName,
    brandLogoSrc: props.brandLogoSrc,
    primaryColor,
    accentColor,
    fontFamily,
    colorScheme,
    ...props.templateProps,
  };

  return (
    <AbsoluteFill>
      {/* ── Intro ── */}
      {props.showIntro && (
        <Sequence from={introStart} durationInFrames={INTRO_DURATION}>
          <IntroSection
            brandName={props.brandName}
            brandLogoSrc={props.brandLogoSrc}
            primaryColor={primaryColor}
            accentColor={accentColor}
            fontFamily={fontFamily}
            colorScheme={colorScheme}
          />
        </Sequence>
      )}

      {/* ── Main Template Content ── */}
      <Sequence from={mainStart} durationInFrames={mainDuration}>
        <TemplateRenderer
          template={template}
          templateProps={fullTemplateProps}
        />
      </Sequence>

      {/* ── Outro End Card ── */}
      {props.showOutro && (
        <Sequence from={outroStart} durationInFrames={OUTRO_DURATION}>
          <OutroSection
            headline={props.outroHeadline}
            ctaText={props.outroCtaText}
            subtext={props.outroSubtext}
            brandName={props.brandName}
            brandLogoSrc={props.brandLogoSrc}
            primaryColor={primaryColor}
            accentColor={accentColor}
            fontFamily={fontFamily}
            colorScheme={colorScheme}
          />
        </Sequence>
      )}

      {/* ── Audio Layer ── */}
      {props.bgMusicSrc && (
        <Audio
          src={staticFile(props.bgMusicSrc)}
          volume={props.bgMusicVolume ?? 0.15}
        />
      )}

      {/* ── Transition SFX ── */}
      {props.enableSfx && props.sfxWhooshSrc && (
        <>
          {/* Intro → Main transition whoosh */}
          {props.showIntro && (
            <Sequence from={INTRO_DURATION - 10} durationInFrames={30}>
              <Audio src={staticFile(props.sfxWhooshSrc)} volume={0.3} />
            </Sequence>
          )}
          {/* Main → Outro transition impact */}
          {props.showOutro && props.sfxImpactSrc && (
            <Sequence from={outroStart} durationInFrames={30}>
              <Audio src={staticFile(props.sfxImpactSrc)} volume={0.2} />
            </Sequence>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};
