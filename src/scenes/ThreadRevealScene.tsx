import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, slideIn } from '../animations';

// Research-backed: Twitter/Threads "thread" format drives 3-5x engagement
// Sequential post reveals — recreates the "reading a thread" feel
export interface ThreadRevealContent {
  type: 'thread_reveal';
  posts: Array<{
    text: string;
    number?: number;
  }>;
  handle?: string;
  avatar_initial?: string;
  reveal_mode?: 'sequential' | 'stack';
}

export interface ThreadRevealSceneProps {
  content: ThreadRevealContent;
  style: StyleConfig;
}

export const ThreadRevealScene: React.FC<ThreadRevealSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const revealMode = content.reveal_mode ?? 'sequential';
  const posts = content.posts;
  const handle = content.handle ?? '@user';
  const avatarInitial = content.avatar_initial ?? handle.charAt(1).toUpperCase();

  // In sequential mode: one post at a time; in stack: all stack up
  const framesPerPost = Math.floor(durationInFrames / posts.length);
  const visibleCount = revealMode === 'sequential'
    ? Math.min(posts.length, Math.floor(frame / framesPerPost) + 1)
    : posts.length;

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const fontSize = isVertical
    ? (posts.length > 3 ? 28 : 34)
    : (posts.length > 3 ? 22 : 28);

  const THREAD_COLOR = '#1d9bf0';
  const LINE_COLOR = `${THREAD_COLOR}40`;

  const renderPost = (post: { text: string; number?: number }, i: number) => {
    const postFrame = revealMode === 'sequential'
      ? frame - i * framesPerPost
      : frame;

    const anim = slideIn(postFrame, {
      durationInFrames: 18,
      delay: revealMode === 'stack' ? 8 + i * 10 : 4,
      direction: 'left',
      distance: 50,
    });

    const isActive = revealMode === 'sequential'
      ? Math.floor(frame / framesPerPost) === i
      : true;

    return (
      <div
        key={i}
        style={{
          display: 'flex',
          gap: 14,
          opacity: anim.opacity,
          transform: `translateX(${anim.x}px)`,
          position: 'relative',
        }}
      >
        {/* Left: avatar + thread line */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          {/* Avatar */}
          <div
            style={{
              width: isVertical ? 44 : 36,
              height: isVertical ? 44 : 36,
              borderRadius: '50%',
              backgroundColor: isActive ? THREAD_COLOR : `${THREAD_COLOR}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.3s',
              boxShadow: isActive ? `0 0 12px ${THREAD_COLOR}50` : 'none',
            }}
          >
            <span
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize: isVertical ? 18 : 14,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {avatarInitial}
            </span>
          </div>
          {/* Thread line (not on last post) */}
          {i < posts.length - 1 && (
            <div
              style={{
                width: 2,
                flex: 1,
                minHeight: isVertical ? 24 : 18,
                backgroundColor: LINE_COLOR,
                marginTop: 6,
                borderRadius: 1,
              }}
            />
          )}
        </div>

        {/* Right: post content */}
        <div style={{ flex: 1, paddingBottom: i < posts.length - 1 ? (isVertical ? 20 : 16) : 0 }}>
          {/* Handle + post number */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontFamily: getFontFamily(style.font_body),
                fontSize: isVertical ? 20 : 16,
                fontWeight: 700,
                color: style.primary_color,
              }}
            >
              {handle}
            </span>
            {post.number !== undefined && (
              <span
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: isVertical ? 16 : 13,
                  color: style.secondary_color,
                }}
              >
                {post.number}/{posts.length}
              </span>
            )}
          </div>

          {/* Post text */}
          <p
            style={{
              fontFamily: getFontFamily(style.font_body),
              fontSize,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? style.primary_color : style.secondary_color,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {post.text}
          </p>
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isVertical ? '60px 40px' : '60px 80px',
            overflowY: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {posts.slice(0, visibleCount).map((post, i) => renderPost(post, i))}
          </div>
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default ThreadRevealScene;
