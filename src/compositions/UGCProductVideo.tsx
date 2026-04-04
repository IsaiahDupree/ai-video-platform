/**
 * UGCProductVideo.tsx — Standalone publishable end-product composition.
 *
 * A fully self-contained 15-second vertical video (1080×1920, 30fps) that
 * combines a UGC caption style + UGC title style + background music at 1-2%.
 *
 * This IS the final deliverable — ready to upload to Instagram/TikTok.
 *
 * Props:
 *   captionText   — The spoken/caption text (split into word timings)
 *   titleText     — Hook/title shown at top
 *   titleSubtext  — Optional smaller subtitle line
 *   captionStyle  — Which caption animation style to use
 *   titleStyle    — Which title overlay style to use
 *   accentColor   — Brand accent color (hex)
 *   bgGradient    — CSS gradient for background
 *   musicFile     — Absolute path to background music file
 *   musicVolume   — Music volume 0.0–1.0 (default 0.015 = 1.5%)
 *   brandId       — Used for style label in corner
 */

import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { UGCCaptions, UGCCaptionStyle } from '../components/UGCCaptionStyles';
import { UGCTitle, UGCTitleStyle } from '../components/UGCTitleStyles';
import { TikTokCaptions, TikTokStyle } from '../components/TikTokCaptions';
import { generateTranscriptFromText } from '../components/AnimatedCaptions';

export type UGCComboStyle =
  | UGCCaptionStyle
  | 'tiktok-bouncy'
  | 'tiktok-glow'
  | 'tiktok-zoom'
  | 'tiktok-wave'
  | 'tiktok-shake';

export interface UGCProductVideoProps {
  captionText: string;
  titleText: string;
  titleSubtext?: string;
  captionStyle: UGCComboStyle;
  titleStyle: UGCTitleStyle;
  accentColor: string;
  bgGradient: string;
  musicFile?: string;
  musicVolume?: number;
  brandId?: string;
  [key: string]: unknown;
}

// ─── Default music (upbeat motivational) ─────────────────────────────────────
// All paths are relative to public/ so staticFile() resolves them correctly.

const DEFAULT_MUSIC = staticFile("music/downloads/yt-znLgt9JIMfI.mp3");

// ─── Fade in/out overlay (smooth entry + exit) ────────────────────────────────

const FadeOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 15, durationInFrames],
    [1, 0, 0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: '#000000', opacity, pointerEvents: 'none',
    }} />
  );
};

// ─── Brand watermark ──────────────────────────────────────────────────────────

const BrandWatermark: React.FC<{ brandId: string; accentColor: string }> = ({ brandId, accentColor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [20, 30], [0, 0.5], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', bottom: 40, right: 32, opacity,
      fontFamily: "'Space Grotesk', monospace, sans-serif",
      fontSize: 18, fontWeight: 600,
      color: accentColor, letterSpacing: '0.06em',
    }}>
      @{brandId}
    </div>
  );
};

// ─── Caption dispatcher ───────────────────────────────────────────────────────

const CaptionLayer: React.FC<{
  captionText: string;
  captionStyle: UGCComboStyle;
  accentColor: string;
}> = ({ captionText, captionStyle, accentColor }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const transcript = generateTranscriptFromText(captionText, 0.8, durationInFrames / fps - 0.8);

  if (captionStyle.startsWith('tiktok-')) {
    const ttStyle = captionStyle.replace('tiktok-', '') as TikTokStyle;
    return (
      <TikTokCaptions
        transcript={transcript}
        style={ttStyle}
        fontSize={54}
        primaryColor="#ffffff"
        accentColor={accentColor}
        position="bottom"
        maxWordsVisible={4}
      />
    );
  }
  return (
    <UGCCaptions
      transcript={transcript}
      style={captionStyle as UGCCaptionStyle}
      accentColor={accentColor}
      fontSize={52}
    />
  );
};

// ─── Main Composition ─────────────────────────────────────────────────────────

export const UGCProductVideo: React.FC<UGCProductVideoProps> = ({
  captionText,
  titleText,
  titleSubtext,
  captionStyle,
  titleStyle,
  accentColor,
  bgGradient,
  musicFile = DEFAULT_MUSIC,
  musicVolume = 0.015,
  brandId = 'isaiah_personal',
}) => {
  return (
    <AbsoluteFill style={{ background: bgGradient, backgroundColor: '#0a0a0a' }}>
      {/* Subtle noise texture for depth */}
      <AbsoluteFill style={{
        backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAAANxM8mAAAABnRSTlMAGBgYGBiB/NbpAAAALElEQVQ4y2NgGAWjgB6AkYFBgIGBgYuBgYGJgYGBkYGBgZGBgYGBkYGBAQALsAA3B4AAAAAABJRU5ErkJggg==")',
        opacity: 0.03,
      }} />

      {/* Background music at 1-2% volume */}
      {musicFile && <Audio src={musicFile} volume={musicVolume} loop />}

      {/* Title / Hook overlay */}
      <UGCTitle
        text={titleText}
        subtext={titleSubtext}
        style={titleStyle}
        accentColor={accentColor}
        delayFrames={6}
      />

      {/* Caption layer */}
      <CaptionLayer
        captionText={captionText}
        captionStyle={captionStyle}
        accentColor={accentColor}
      />

      {/* Brand watermark */}
      <BrandWatermark brandId={brandId} accentColor={accentColor} />

      {/* Smooth fade in/out */}
      <FadeOverlay />
    </AbsoluteFill>
  );
};

// ─── 5 pre-configured product variants ───────────────────────────────────────
// Each represents a distinct platform-native style.

export const PRODUCT_VARIANTS: Array<{
  id: string;
  label: string;
  props: UGCProductVideoProps;
}> = [
  {
    id: 'ig-story-sticker',
    label: 'IG Story + Sticker (TikTok/IG native)',
    props: {
      captionText: "I didn't start with answers I started with obsession building systems that run without me one piece at a time",
      titleText: "No System = No Growth",
      titleSubtext: "here's what changed everything",
      captionStyle: 'ig-story',
      titleStyle: 'sticker',
      accentColor: '#FFE600',
      bgGradient: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
      musicFile: DEFAULT_MUSIC,
      musicVolume: 0.015,
      brandId: 'the_isaiah_dupree',
    },
  },
  {
    id: 'karaoke-mega',
    label: 'Karaoke Box + Mega Title (viral TikTok)',
    props: {
      captionText: "the people who build in public win because they create trust before they ever try to sell anything",
      titleText: "Build In Public",
      titleSubtext: "the unfair advantage",
      captionStyle: 'karaoke-box',
      titleStyle: 'mega-title',
      accentColor: '#00E5FF',
      bgGradient: 'linear-gradient(160deg, #000000 0%, #0d0d0d 60%, #001a2e 100%)',
      musicFile: staticFile("music/downloads/yt-32FeS721yM0.mp3"),
      musicVolume: 0.012,
      brandId: 'the_isaiah_dupree',
    },
  },
  {
    id: 'word-slam-neon',
    label: 'Word Slam + Neon Bar (high energy)',
    props: {
      captionText: "automate the boring optimize the creative ship faster than anyone expects and never stop compounding",
      titleText: "Automate Everything",
      titleSubtext: "AI systems for founders",
      captionStyle: 'word-slam',
      titleStyle: 'neon-bar',
      accentColor: '#FF3CAC',
      bgGradient: 'linear-gradient(160deg, #0a0a0a 0%, #1a0a1a 60%, #2a0a2a 100%)',
      musicFile: staticFile("music/downloads/yt-ZOOmTRUTWUU.mp3"),
      musicVolume: 0.018,
      brandId: 'the_isaiah_dupree',
    },
  },
  {
    id: 'clean-stroke-minimal',
    label: 'Clean Stroke + Minimal (creator POV)',
    props: {
      captionText: "your audience doesn't want polished they want real show your process document everything build with them",
      titleText: "Show Your Process",
      titleSubtext: "the creator's edge",
      captionStyle: 'clean-stroke',
      titleStyle: 'minimal-top',
      accentColor: '#38ef7d',
      bgGradient: 'linear-gradient(160deg, #111 0%, #181818 100%)',
      musicFile: staticFile("music/downloads/yt--UfI1X-MSig.mp3"),
      musicVolume: 0.015,
      brandId: 'the_isaiah_dupree',
    },
  },
  {
    id: 'tiktok-glow-ig-badge',
    label: 'TikTok Glow + IG Badge (neon energy)',
    props: {
      captionText: "every system you build today is compound interest you collect tomorrow obsession plus consistency wins always",
      titleText: "Compound Systems",
      titleSubtext: "obsession × consistency",
      captionStyle: 'tiktok-glow',
      titleStyle: 'ig-badge',
      accentColor: '#ff00ff',
      bgGradient: 'linear-gradient(160deg, #0d0015 0%, #1a002e 100%)',
      musicFile: staticFile("music/downloads/yt-h3TVZA_rYQc.mp3"),
      musicVolume: 0.015,
      brandId: 'the_isaiah_dupree',
    },
  },
];

export const UGC_PRODUCT_FPS = 30;
export const UGC_PRODUCT_FRAMES = 450; // 15 seconds
