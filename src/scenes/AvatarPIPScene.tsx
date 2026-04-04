/**
 * AvatarPIPScene.tsx
 *
 * Picture-in-picture scene: top-performing source video as background,
 * HeyGen avatar (talking head) composited over it in configurable layout.
 *
 * Layouts:
 *   pip-br        — Avatar circle, bottom-right corner (most common TikTok pattern)
 *   pip-bl        — Avatar circle, bottom-left corner
 *   split-left    — Avatar left half, source video right half
 *   split-right   — Avatar right half, source video left half
 *   full-avatar   — Full background is the avatar video (no source video)
 *
 * Also renders:
 *   - Hook text bar at top (sliding in at start)
 *   - Word-by-word karaoke captions at bottom
 *   - Optional vignette overlay for depth
 */

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';
import { StyleConfig } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PIPLayout =
  | 'pip-br'
  | 'pip-bl'
  | 'split-left'
  | 'split-right'
  | 'full-avatar';

export interface WordTiming {
  word: string;
  start: number; // seconds
  end: number;
}

export interface AvatarPIPContent {
  type: 'avatar_pip';
  source_video_url: string;   // background: top-performing web content
  avatar_video_url: string;   // foreground: HeyGen talking head
  layout?: PIPLayout;
  pip_size?: number;          // 0.0–1.0 fraction of width (default 0.38)
  hook_text?: string;         // top bar text
  hook_subtext?: string;
  captions?: WordTiming[];
  caption_style?: 'tiktok' | 'centered' | 'lower_third';
  show_vignette?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const HookBar: React.FC<{
  text: string;
  subtext?: string;
  accentColor: string;
  frame: number;
  fps: number;
}> = ({ text, subtext, accentColor, frame, fps }) => {
  const progress = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const translateY = interpolate(progress, [0, 1], [-60, 0]);
  const opacity = interpolate(progress, [0, 0.4, 1], [0, 1, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '28px 36px 24px',
        background: `linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)`,
        transform: `translateY(${translateY}px)`,
        opacity,
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 52,
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1.15,
          textShadow: '0 2px 12px rgba(0,0,0,0.7)',
          letterSpacing: '-0.02em',
        }}
      >
        {text}
      </div>
      {subtext && (
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 32,
            fontWeight: 600,
            color: accentColor,
            marginTop: 8,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
};

const KaraokeCaptions: React.FC<{
  captions: WordTiming[];
  frame: number;
  fps: number;
  accentColor: string;
}> = ({ captions, frame, fps, accentColor }) => {
  const currentSec = frame / fps;
  // Find active word
  const activeIdx = captions.findLastIndex(
    w => w.start <= currentSec && w.end > currentSec
  );

  // Group into lines of ~5 words centered on active word
  const windowStart = Math.max(0, activeIdx - 2);
  const windowEnd = Math.min(captions.length, windowStart + 5);
  const visible = captions.slice(windowStart, windowEnd);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 40,
        right: 40,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
        zIndex: 20,
      }}
    >
      {visible.map((word, i) => {
        const globalIdx = windowStart + i;
        const isActive = globalIdx === activeIdx;
        const isPast = globalIdx < activeIdx;

        return (
          <span
            key={`${word.word}-${globalIdx}`}
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 52,
              fontWeight: 900,
              color: isActive ? accentColor : isPast ? 'rgba(255,255,255,0.5)' : '#ffffff',
              textShadow: isActive
                ? `0 0 20px ${accentColor}80, 0 2px 8px rgba(0,0,0,0.9)`
                : '0 2px 8px rgba(0,0,0,0.8)',
              transform: isActive ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.05s',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
              padding: '0 4px',
              backgroundColor: isActive ? 'rgba(0,0,0,0.4)' : 'transparent',
              borderRadius: 6,
            }}
          >
            {word.word}
          </span>
        );
      })}
    </div>
  );
};

// ─── Main scene ───────────────────────────────────────────────────────────────

export const AvatarPIPScene: React.FC<{
  content: AvatarPIPContent;
  style: StyleConfig;
  index: number;
}> = ({ content, style: briefStyle, index }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const {
    source_video_url,
    avatar_video_url,
    layout = 'pip-br',
    pip_size = 0.38,
    hook_text,
    hook_subtext,
    captions = [],
    show_vignette = true,
  } = content;

  const accentColor = briefStyle.accent_color || '#6366f1';
  const pipWidth = width * pip_size;
  const pipHeight = pipWidth * (9 / 16); // avatar is 9:16 portrait

  // PiP entrance animation — spring in from bottom
  const pipProgress = spring({
    frame: Math.max(0, frame - 10), // slight delay after scene start
    fps,
    config: { damping: 16, stiffness: 200 },
  });
  const pipSlide = interpolate(pipProgress, [0, 1], [pipHeight + 40, 0]);
  const pipOpacity = interpolate(pipProgress, [0, 0.3, 1], [0, 1, 1]);

  // Layout calculations
  const pipPositions: Record<PIPLayout, React.CSSProperties> = {
    'pip-br': {
      bottom: 120 + captions.length ? 80 : 40,
      right: 28,
      width: pipWidth,
      height: pipHeight,
      borderRadius: '50% / 45%',
      transform: `translateY(${pipSlide}px)`,
      opacity: pipOpacity,
    },
    'pip-bl': {
      bottom: captions.length ? 160 : 40,
      left: 28,
      width: pipWidth,
      height: pipHeight,
      borderRadius: '50% / 45%',
      transform: `translateY(${pipSlide}px)`,
      opacity: pipOpacity,
    },
    'split-left': { left: 0, top: 0, width: '50%', height: '100%', borderRadius: 0 },
    'split-right': { right: 0, top: 0, width: '50%', height: '100%', borderRadius: 0 },
    'full-avatar': { inset: 0, borderRadius: 0 },
  };

  const isFullOrSplit = layout === 'full-avatar' || layout.startsWith('split');
  const sourceFillsFull = layout === 'pip-br' || layout === 'pip-bl';

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>

      {/* ── Background: source video or half-frame ─────────────────────── */}
      {source_video_url && layout !== 'full-avatar' && (
        <AbsoluteFill
          style={
            layout === 'split-left'
              ? { left: '50%', right: 0 }
              : layout === 'split-right'
              ? { left: 0, right: '50%' }
              : undefined
          }
        >
          <OffthreadVideo
            src={source_video_url}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            muted
          />
        </AbsoluteFill>
      )}

      {/* Vignette for depth */}
      {show_vignette && sourceFillsFull && (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* ── Avatar video ───────────────────────────────────────────────── */}
      {avatar_video_url && (
        <div
          style={{
            position: 'absolute',
            overflow: 'hidden',
            boxShadow: isFullOrSplit ? 'none' : `0 8px 40px rgba(0,0,0,0.65), 0 0 0 3px ${accentColor}`,
            zIndex: 5,
            ...pipPositions[layout],
          }}
        >
          <OffthreadVideo
            src={avatar_video_url}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Subtle inner shadow for blending */}
          {!isFullOrSplit && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      )}

      {/* ── Hook text bar (top) ─────────────────────────────────────────── */}
      {hook_text && (
        <HookBar
          text={hook_text}
          subtext={hook_subtext}
          accentColor={accentColor}
          frame={frame}
          fps={fps}
        />
      )}

      {/* ── Karaoke captions (bottom) ───────────────────────────────────── */}
      {captions.length > 0 && (
        <KaraokeCaptions
          captions={captions}
          frame={frame}
          fps={fps}
          accentColor={accentColor}
        />
      )}

      {/* Bottom gradient for captions legibility */}
      {(captions.length > 0 || hook_text) && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 280,
            background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
            zIndex: 8,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export default AvatarPIPScene;
