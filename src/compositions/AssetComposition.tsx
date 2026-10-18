/**
 * Asset-Enhanced Composition
 * 
 * Renders videos with AI-generated assets (icons, props, emojis)
 */

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Img,
  staticFile,
  spring,
  interpolate,
} from 'remotion';
import { ContentBrief } from '../types/ContentBrief';
import {
  FloatingParticles,
  GlowOrb,
  VignetteOverlay,
  GradientText,
  NeonGlow,
  ProgressBar,
  DecorativeCircle,
} from '../components/effects';
import { entranceAnimations, loopAnimations, applyAnimation } from '../animations/presets';

// =============================================================================
// Types
// =============================================================================

interface AssetBrief extends ContentBrief {
  assets?: {
    icons?: Record<string, string>;
    emojis?: Record<string, string>;
    props?: Record<string, string>;
    backgrounds?: Record<string, string>;
  };
}

interface SectionWithAssets {
  id: string;
  type: string;
  duration_sec: number;
  start_time_sec: number;
  content: {
    type: string;
    title?: string;
    subtitle?: string;
    hook_text?: string;
    heading?: string;
    body_text?: string;
    number?: number;
    call_to_action?: string;
  };
  assets?: {
    icon?: string;
    emoji?: string;
    prop?: string;
    background?: string;
  };
  animation?: string;
}

// =============================================================================
// Asset Scene Component
// =============================================================================

const AssetScene: React.FC<{
  section: SectionWithAssets;
  brief: AssetBrief;
  sceneIndex: number;
  totalScenes: number;
}> = ({ section, brief, sceneIndex, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const style = brief.style;

  // Get asset URLs
  const getAssetUrl = (type: 'icons' | 'emojis' | 'props' | 'backgrounds', key?: string) => {
    if (!key || !brief.assets?.[type]?.[key]) return null;
    return staticFile(brief.assets[type][key]);
  };

  const iconUrl = getAssetUrl('icons', section.assets?.icon);
  const emojiUrl = getAssetUrl('emojis', section.assets?.emoji);
  const propUrl = getAssetUrl('props', section.assets?.prop);

  // Animation timings
  const iconDelay = 5;
  const titleDelay = 15;
  const bodyDelay = 25;
  const emojiDelay = 20;
  const propDelay = 30;

  // Animations
  const getEntrance = (delay: number, type: string = section.animation || 'slide') => {
    switch (type) {
      case 'pop':
        return entranceAnimations.popIn(frame, delay, fps);
      case 'bounce':
        return entranceAnimations.bounceIn(frame, delay, fps);
      case 'slide':
        return entranceAnimations.slideUp(frame, delay, 20, 50);
      case 'zoom':
        return entranceAnimations.zoomIn(frame, delay, 25);
      case 'neon':
        return entranceAnimations.popIn(frame, delay, fps);
      default:
        return entranceAnimations.fadeIn(frame, delay, 20);
    }
  };

  // Float animation for assets
  const floatAnim = loopAnimations.float(frame, 10, 0.04);
  const pulseAnim = loopAnimations.pulse(frame, 0.98, 1.02, 0.08);

  // Background
  const bgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: style.background_type === 'gradient'
      ? style.background_value
      : style.background_value,
  };

  // Content based on section type
  const isIntro = section.type === 'intro';
  const isOutro = section.type === 'outro';
  const isTopic = section.type === 'topic';

  const content = section.content;
  const progress = isTopic && content.number && totalScenes 
    ? (sceneIndex + 1) / totalScenes 
    : 0;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      {/* Background */}
      <div style={bgStyle} />

      {/* Particles */}
      <FloatingParticles
        count={25}
        color={style.accent_color}
        size={5}
        speed={0.4}
        direction="up"
      />

      {/* Glow orbs */}
      <GlowOrb
        color={style.accent_color}
        intensity={0.7}
        size={400}
        position={{ x: 30, y: 40 }}
        pulse
      />
      <GlowOrb
        color={style.primary_color}
        intensity={0.4}
        size={300}
        position={{ x: 70, y: 60 }}
        pulse
      />

      {/* Decorative circles */}
      <DecorativeCircle color={style.accent_color} size={180} position={{ x: 85, y: 15 }} />
      <DecorativeCircle color={style.accent_color} size={120} position={{ x: 10, y: 85 }} />

      {/* Vignette */}
      <VignetteOverlay opacity={0.5} />

      {/* Content Container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
          gap: 20,
        }}
      >
        {/* Main Icon */}
        {iconUrl && (
          <div
            style={{
              ...applyAnimation(getEntrance(iconDelay)),
              transform: `${applyAnimation(getEntrance(iconDelay)).transform || ''} translateY(${floatAnim.translateY}px)`,
              marginBottom: 20,
            }}
          >
            <Img
              src={iconUrl}
              style={{
                width: isIntro ? 180 : 150,
                height: isIntro ? 180 : 150,
                objectFit: 'contain',
                filter: section.animation === 'neon' 
                  ? `drop-shadow(0 0 20px ${style.accent_color}) drop-shadow(0 0 40px ${style.accent_color}50)`
                  : undefined,
              }}
            />
          </div>
        )}

        {/* Number Badge (for topics) */}
        {isTopic && content.number !== undefined && (
          <div style={applyAnimation(entranceAnimations.bounceIn(frame, 10, fps))}>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                backgroundColor: style.accent_color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
                fontSize: 44,
                fontWeight: 800,
                color: '#000',
                boxShadow: `0 0 30px ${style.accent_color}60`,
              }}
            >
              {content.number}
            </div>
          </div>
        )}

        {/* Title/Heading */}
        <div style={applyAnimation(getEntrance(titleDelay))}>
          {section.animation === 'neon' ? (
            <NeonGlow color={style.accent_color}>
              <h1
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: isIntro ? 72 : 56,
                  fontWeight: 800,
                  color: style.primary_color,
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: 1.1,
                  textTransform: isIntro ? 'uppercase' : 'none',
                }}
              >
                <GradientText colors={[style.accent_color, style.primary_color]}>
                  {content.title || content.heading}
                </GradientText>
              </h1>
            </NeonGlow>
          ) : (
            <h1
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: isIntro ? 72 : 56,
                fontWeight: 800,
                color: style.primary_color,
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {content.title || content.heading}
            </h1>
          )}
        </div>

        {/* Subtitle/Body */}
        {(content.subtitle || content.body_text) && (
          <div style={{ ...applyAnimation(getEntrance(bodyDelay)), maxWidth: 800 }}>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: isIntro ? 32 : 26,
                fontWeight: 400,
                color: `${style.primary_color}cc`,
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {content.subtitle || content.body_text}
            </p>
          </div>
        )}

        {/* Hook text */}
        {content.hook_text && (
          <div style={{ ...applyAnimation(getEntrance(35)), marginTop: 20 }}>
            <div
              style={{
                padding: '14px 28px',
                backgroundColor: `${style.accent_color}20`,
                borderRadius: 12,
                border: `2px solid ${style.accent_color}50`,
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 22,
                  fontWeight: 600,
                  color: style.accent_color,
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                {content.hook_text}
              </p>
            </div>
          </div>
        )}

        {/* Call to action */}
        {content.call_to_action && (
          <div style={{ ...applyAnimation(getEntrance(30)), marginTop: 30 }}>
            <div
              style={{
                padding: '18px 36px',
                backgroundColor: style.accent_color,
                borderRadius: 16,
                boxShadow: `0 0 40px ${style.accent_color}60`,
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#000',
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                {content.call_to_action}
              </p>
            </div>
          </div>
        )}

        {/* Emoji decoration */}
        {emojiUrl && (
          <div
            style={{
              position: 'absolute',
              right: 80,
              top: '30%',
              ...applyAnimation(getEntrance(emojiDelay, 'bounce')),
              transform: `${applyAnimation(getEntrance(emojiDelay, 'bounce')).transform || ''} scale(${pulseAnim.scale}) rotate(${frame * 0.3}deg)`,
            }}
          >
            <Img
              src={emojiUrl}
              style={{
                width: 100,
                height: 100,
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Prop decoration */}
        {propUrl && (
          <div
            style={{
              position: 'absolute',
              left: 60,
              bottom: '20%',
              ...applyAnimation(getEntrance(propDelay, 'slide')),
              transform: `${applyAnimation(getEntrance(propDelay, 'slide')).transform || ''} translateY(${floatAnim.translateY}px) rotate(-5deg)`,
            }}
          >
            <Img
              src={propUrl}
              style={{
                width: 180,
                height: 180,
                objectFit: 'contain',
                opacity: 0.9,
              }}
            />
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isTopic && content.number && (
        <ProgressBar
          progress={progress}
          color={style.accent_color}
          backgroundColor={`${style.primary_color}20`}
          height={6}
          width={70}
          position="bottom"
        />
      )}
    </div>
  );
};

// =============================================================================
// Main Composition
// =============================================================================

export interface AssetCompositionProps {
  brief?: AssetBrief;
}

export const AssetComposition: React.FC<AssetCompositionProps> = ({ brief: inputBrief }) => {
  const { fps } = useVideoConfig();

  // Default brief if none provided
  const brief = inputBrief || ({
    id: 'default',
    format: 'explainer_v1',
    version: '1.0',
    created_at: new Date().toISOString(),
    settings: {
      resolution: { width: 1080, height: 1920 },
      fps: 30,
      duration_sec: 30,
      aspect_ratio: '9:16',
    },
    style: {
      theme: 'dark',
      primary_color: '#ffffff',
      secondary_color: '#a1a1aa',
      accent_color: '#8b5cf6',
      font_heading: 'Inter',
      font_body: 'Inter',
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    },
    sections: [],
  } as AssetBrief);

  const sections = (brief.sections || []) as SectionWithAssets[];
  const topicSections = sections.filter(s => s.type === 'topic');

  return (
    <>
      {sections.map((section, index) => {
        const startFrame = Math.round(section.start_time_sec * fps);
        const durationFrames = Math.round(section.duration_sec * fps);

        return (
          <Sequence
            key={section.id}
            from={startFrame}
            durationInFrames={durationFrames}
            name={`${section.type}-${section.id}`}
          >
            <AssetScene
              section={section}
              brief={brief}
              sceneIndex={index}
              totalScenes={topicSections.length}
            />
          </Sequence>
        );
      })}
    </>
  );
};

export default AssetComposition;
