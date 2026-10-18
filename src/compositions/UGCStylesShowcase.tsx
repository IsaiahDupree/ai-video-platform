/**
 * UGCStylesShowcase.tsx — Visual comparison of all UGC caption + title styles.
 *
 * 11 segments × 8s each = 88s total @ 30fps = 2640 frames
 * Each segment shows a caption style (bottom) + title style (top) on a dark
 * gradient background — simulating a real vertical-video phone view.
 *
 * Segments:
 *   1.  IG Story captions    + Sticker title
 *   2.  Karaoke Box          + Mega Title
 *   3.  Word Slam            + Neon Bar
 *   4.  Clean Stroke         + Minimal Top
 *   5.  Reel Lower Third     + IG Badge
 *   6.  Minimal Fade         + Sticker
 *   7.  TikTok Bouncy        + Mega Title (alt color)
 *   8.  TikTok Glow          + Neon Bar (alt color)
 *   9.  TikTok Zoom          + IG Badge (alt color)
 *  10.  TikTok Wave          + Minimal Top
 *  11.  TikTok Shake         + Sticker (alt color)
 */

import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// ─── Music ────────────────────────────────────────────────────────────────────
// Upbeat motivational track — looped at 1.5% volume (ambient, non-distracting).
// Served from public/ via staticFile so Remotion's browser sandbox can load it.
const MUSIC_PATH = staticFile("music/downloads/yt-znLgt9JIMfI.mp3");
import { UGCCaptions, UGCCaptionStyle } from '../components/UGCCaptionStyles';
import { UGCTitle, UGCTitleStyle } from '../components/UGCTitleStyles';
import { TikTokCaptions, TikTokStyle } from '../components/TikTokCaptions';
import { generateTranscriptFromText } from '../components/AnimatedCaptions';

// ─── Content ──────────────────────────────────────────────────────────────────

const CLIPS = [
  "I didn't start with answers I started with obsession building in public",
  "every video I made was me figuring it out one step at a time",
  "the blueprint phase is about finding your edge and going all in on it",
  "alignment gap sixty two percent aligned with my own vision that gap is fuel",
  "one person AI systems uncompromising discipline a fully autonomous business",
  "stop asking for permission to start just start document everything as you go",
  "the people who build in public win because they create trust before they sell",
  "automate the boring optimize the creative ship faster than anyone expects",
  "your audience doesn't want perfect they want real show your process",
  "every system you build today is compound interest you collect tomorrow",
  "obsession beats talent every single time keep going",
];

const SEGMENTS_PER_FRAME = 8 * 30; // 8 seconds per segment at 30fps

interface Segment {
  label: string;
  captionType: 'ugc' | 'tiktok';
  ugcStyle?: UGCCaptionStyle;
  ttStyle?: TikTokStyle;
  titleStyle: UGCTitleStyle;
  accentColor: string;
  bg: string; // gradient/color for background
}

const SEGMENTS: Segment[] = [
  { label: '01 · IG Story + Sticker',      captionType: 'ugc',    ugcStyle: 'ig-story',    titleStyle: 'sticker',     accentColor: '#FFE600', bg: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' },
  { label: '02 · Karaoke Box + Mega Title', captionType: 'ugc',    ugcStyle: 'karaoke-box', titleStyle: 'mega-title',  accentColor: '#00E5FF', bg: 'linear-gradient(160deg, #000000 0%, #0d0d0d 60%, #1a0533 100%)' },
  { label: '03 · Word Slam + Neon Bar',     captionType: 'ugc',    ugcStyle: 'word-slam',   titleStyle: 'neon-bar',    accentColor: '#FF3CAC', bg: 'linear-gradient(160deg, #0a0a0a 0%, #1a0a1a 60%, #2a0a2a 100%)' },
  { label: '04 · Clean Stroke + Minimal',   captionType: 'ugc',    ugcStyle: 'clean-stroke', titleStyle: 'minimal-top', accentColor: '#38ef7d', bg: 'linear-gradient(160deg, #111 0%, #181818 100%)' },
  { label: '05 · Reel Lower + IG Badge',    captionType: 'ugc',    ugcStyle: 'reel-lower',  titleStyle: 'ig-badge',    accentColor: '#4776E6', bg: 'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { label: '06 · Minimal Fade + Sticker',   captionType: 'ugc',    ugcStyle: 'minimal-fade', titleStyle: 'sticker',    accentColor: '#f7971e', bg: 'linear-gradient(160deg, #141414 0%, #1e1e1e 100%)' },
  { label: '07 · TikTok Bouncy + Mega',     captionType: 'tiktok', ttStyle: 'bouncy',        titleStyle: 'mega-title',  accentColor: '#00ff88', bg: 'linear-gradient(160deg, #0a0a0a 0%, #002a1a 100%)' },
  { label: '08 · TikTok Glow + Neon Bar',   captionType: 'tiktok', ttStyle: 'glow',          titleStyle: 'neon-bar',    accentColor: '#ff00ff', bg: 'linear-gradient(160deg, #0d0015 0%, #1a002e 100%)' },
  { label: '09 · TikTok Zoom + IG Badge',   captionType: 'tiktok', ttStyle: 'zoom',          titleStyle: 'ig-badge',    accentColor: '#ffcc00', bg: 'linear-gradient(160deg, #0a0500 0%, #1a1000 100%)' },
  { label: '10 · TikTok Wave + Minimal',    captionType: 'tiktok', ttStyle: 'wave',          titleStyle: 'minimal-top', accentColor: '#00ccff', bg: 'linear-gradient(160deg, #000a10 0%, #001525 100%)' },
  { label: '11 · TikTok Shake + Sticker',   captionType: 'tiktok', ttStyle: 'shake',         titleStyle: 'sticker',     accentColor: '#ff4444', bg: 'linear-gradient(160deg, #100000 0%, #1e0000 100%)' },
];

// ─── Style Label Overlay ──────────────────────────────────────────────────────

const StyleLabel: React.FC<{ label: string; accentColor: string }> = ({ label, accentColor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, SEGMENTS_PER_FRAME - 8, SEGMENTS_PER_FRAME], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', bottom: 52, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', opacity,
    }}>
      <div style={{
        fontFamily: "'Space Grotesk', monospace, sans-serif",
        fontSize: 20, fontWeight: 600, letterSpacing: '0.06em',
        color: 'rgba(255,255,255,0.55)',
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingInline: 20, paddingBlock: 8, borderRadius: 20,
        border: `1px solid ${accentColor}44`,
      }}>
        {label}
      </div>
    </div>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ segmentIndex: number; total: number; accentColor: string }> = ({
  segmentIndex, total, accentColor,
}) => {
  const frame = useCurrentFrame();
  const segPct = (frame / SEGMENTS_PER_FRAME) * 100;
  const totalPct = ((segmentIndex + frame / SEGMENTS_PER_FRAME) / total) * 100;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}>
      <div style={{ height: '100%', width: `${totalPct}%`, backgroundColor: accentColor, opacity: 0.8 }} />
    </div>
  );
};

// ─── Single Segment ───────────────────────────────────────────────────────────

const SegmentView: React.FC<{ seg: Segment; segIdx: number; clipText: string }> = ({
  seg, segIdx, clipText,
}) => {
  const { fps } = useVideoConfig();
  const transcript = generateTranscriptFromText(clipText, 0.5, SEGMENTS_PER_FRAME / fps - 0.5);

  return (
    <AbsoluteFill style={{ background: seg.bg }}>
      {/* Subtle film grain texture */}
      <AbsoluteFill style={{
        background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
        opacity: 0.6,
      }} />

      {/* Title / Hook overlay */}
      <UGCTitle
        text={clipText.split(' ').slice(0, 4).join(' ')}
        subtext={segIdx < 6 ? 'isaiah_personal' : undefined}
        style={seg.titleStyle}
        accentColor={seg.accentColor}
        delayFrames={4}
      />

      {/* Caption overlay */}
      {seg.captionType === 'ugc' ? (
        <UGCCaptions
          transcript={transcript}
          style={seg.ugcStyle}
          accentColor={seg.accentColor}
          fontSize={52}
        />
      ) : (
        <TikTokCaptions
          transcript={transcript}
          style={seg.ttStyle}
          fontSize={54}
          primaryColor="#ffffff"
          accentColor={seg.accentColor}
          position="bottom"
          maxWordsVisible={4}
        />
      )}

      {/* Style name label */}
      <StyleLabel label={seg.label} accentColor={seg.accentColor} />

      {/* Progress bar */}
      <ProgressBar segmentIndex={segIdx} total={SEGMENTS.length} accentColor={seg.accentColor} />
    </AbsoluteFill>
  );
};

// ─── Root Composition ─────────────────────────────────────────────────────────

export interface UGCStylesShowcaseProps {
  [key: string]: unknown;
}

export const UGCStylesShowcase: React.FC<UGCStylesShowcaseProps> = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Background music looping at 1.5% volume */}
      <Audio src={MUSIC_PATH} volume={0.015} loop />

      {SEGMENTS.map((seg, i) => (
        <Sequence
          key={i}
          from={i * SEGMENTS_PER_FRAME}
          durationInFrames={SEGMENTS_PER_FRAME}
          name={seg.label}
        >
          <SegmentView seg={seg} segIdx={i} clipText={CLIPS[i] ?? CLIPS[0]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const ugcStylesShowcaseDefaultProps: UGCStylesShowcaseProps = {};
export const UGC_SHOWCASE_FPS = 30;
export const UGC_SHOWCASE_FRAMES = SEGMENTS.length * SEGMENTS_PER_FRAME; // 2640 frames = 88s
