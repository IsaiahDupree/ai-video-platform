import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Series,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ─── Data contract ─────────────────────────────────────────────────────────

export interface TrendTweet {
  screenshotPath: string; // absolute path OR relative to public/
  author: string;
  handle: string;
  text: string;
  likes: string;
  retweets: string;
  replies: string;
  views?: string;
}

export interface TrendBrief {
  topic: string;           // e.g. "Claude 4 just dropped — AI coding goes autonomous"
  hook: string;            // 1-liner opener for the intro card
  summary: string;         // 2-3 sentence context
  script: string;          // full narrated script (for reference / caption)
  insights: string[];      // 3-5 key takeaways
  tweets: TrendTweet[];    // 4-8 tweets with screenshots
  voiceover_path?: string; // absolute path to WAV/MP3
  hashtags?: string[];
  cta?: string;            // e.g. "Follow @isaiahdupree for daily AI trends"
}

export interface TrendVideoProps {
  brief?: TrendBrief;
  format?: 'youtube' | 'shorts' | 'linkedin'; // controls aspect handled in Root.tsx
}

// ─── Design constants ───────────────────────────────────────────────────────

const BG_DARK    = '#0a0a0f';
const BG_CARD    = '#111118';
const ACCENT     = '#1d9bf0'; // Twitter blue
const ACCENT_HOT = '#ff4d4d'; // trending red
const TEXT_PRI   = '#ffffff';
const TEXT_SEC   = '#8899aa';
const BORDER     = '#1e2a3a';
const FONT       = 'Inter, system-ui, sans-serif';

// ─── Motion primitives ──────────────────────────────────────────────────────

const fadeIn = (frame: number, delay = 0, dur = 20) =>
  interpolate(frame - delay, [0, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const slideUp = (frame: number, delay = 0) =>
  interpolate(frame - delay, [0, 24], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const springScale = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { stiffness: 90, damping: 14 } });

// ─── Sub-components ─────────────────────────────────────────────────────────

const TrendingBadge: React.FC<{ topic: string }> = ({ topic }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = springScale(frame, fps, 0);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'linear-gradient(135deg, #1d9bf015, #ff4d4d15)',
      border: `1px solid ${ACCENT_HOT}44`,
      borderRadius: 100, padding: '8px 20px',
      transform: `scale(${scale})`,
    }}>
      <span style={{ fontSize: 22 }}>🔥</span>
      <span style={{ color: ACCENT_HOT, fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: 1 }}>
        TRENDING
      </span>
      <span style={{ color: TEXT_SEC, fontFamily: FONT, fontSize: 18 }}>·</span>
      <span style={{ color: TEXT_PRI, fontFamily: FONT, fontSize: 20, fontWeight: 600 }}>
        {topic}
      </span>
    </div>
  );
};

// Intro scene — 90 frames (3s)
const IntroScene: React.FC<{ brief: TrendBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity  = fadeIn(frame, 10, 20);
  const titleY        = slideUp(frame, 10);
  const hookOpacity   = fadeIn(frame, 30, 20);
  const hookY         = slideUp(frame, 30);
  const badgeOpacity  = fadeIn(frame, 55, 20);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 30%, #0d1f33 0%, ${BG_DARK} 65%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 80px', gap: 32,
    }}>
      {/* Animated grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(29,155,240,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(29,155,240,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        opacity: fadeIn(frame, 0, 30),
      }} />

      {/* Main headline */}
      <div style={{
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        textAlign: 'center',
        zIndex: 1,
      }}>
        <div style={{
          fontFamily: FONT,
          fontSize: brief.topic.length > 60 ? 48 : brief.topic.length > 40 ? 60 : 72,
          fontWeight: 900,
          color: TEXT_PRI, lineHeight: 1.1, letterSpacing: -2,
          maxWidth: 1600, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        }}>
          {brief.topic}
        </div>
      </div>

      {/* Hook sub-line */}
      <div style={{
        opacity: hookOpacity,
        transform: `translateY(${hookY}px)`,
        textAlign: 'center', zIndex: 1,
        fontFamily: FONT, fontSize: 30, fontWeight: 400, color: TEXT_SEC,
        maxWidth: 900, lineHeight: 1.5,
      }}>
        {brief.hook}
      </div>

      {/* Trending badge */}
      <div style={{ opacity: badgeOpacity, zIndex: 1 }}>
        <TrendingBadge topic={brief.topic} />
      </div>
    </AbsoluteFill>
  );
};

// Context scene — 90 frames (3s)
const ContextScene: React.FC<{ brief: TrendBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const lineOpacity  = fadeIn(frame, 0, 15);
  const textOpacity  = fadeIn(frame, 15, 25);
  const textY        = slideUp(frame, 15);

  return (
    <AbsoluteFill style={{
      background: BG_DARK,
      display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', justifyContent: 'center',
      padding: '0 120px',
    }}>
      {/* Accent bar */}
      <div style={{
        width: interpolate(frame, [0, 20], [0, 80], { extrapolateRight: 'clamp' }),
        height: 5, background: ACCENT,
        borderRadius: 99, marginBottom: 32,
        opacity: lineOpacity,
      }} />

      <div style={{
        fontFamily: FONT, fontSize: 24, fontWeight: 500, color: TEXT_SEC,
        letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20,
        opacity: lineOpacity,
      }}>
        What's happening
      </div>

      <div style={{
        opacity: textOpacity,
        transform: `translateY(${textY}px)`,
        fontFamily: FONT, fontSize: 38, fontWeight: 600,
        color: TEXT_PRI, lineHeight: 1.55, maxWidth: 1400,
      }}>
        {brief.summary}
      </div>
    </AbsoluteFill>
  );
};

// Tweet screenshot slide — 150 frames (5s) each
const TweetSlide: React.FC<{ tweet: TrendTweet; index: number }> = ({ tweet, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale   = spring({ frame, fps, config: { stiffness: 80, damping: 16 } });
  const cardOpacity = fadeIn(frame, 0, 12);
  const statsOpacity = fadeIn(frame, 30, 20);
  const statsY      = slideUp(frame, 30);

  // screenshotPath is a relative public/ path (set by prepareAssetsForRemotion)
  const hasScreenshot = !!tweet.screenshotPath;
  const imgSrc = hasScreenshot ? staticFile(tweet.screenshotPath) : null;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 40%, #0d1a2a 0%, ${BG_DARK} 70%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 80px', gap: 32,
    }}>
      {/* Tweet number indicator */}
      <div style={{
        position: 'absolute', top: 40, left: 60,
        fontFamily: FONT, fontSize: 18, color: TEXT_SEC, fontWeight: 600,
        letterSpacing: 1,
      }}>
        <span style={{ color: ACCENT }}>#{index + 1}</span> TOP POST
      </div>

      {/* Screenshot card */}
      <div style={{
        opacity: cardOpacity,
        transform: `scale(${cardScale})`,
        border: `1px solid ${BORDER}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        maxWidth: 1200, width: '100%',
        maxHeight: 600,
        background: BG_CARD,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {imgSrc ? (
          <Img
            src={imgSrc}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          // Text-only fallback when screenshot wasn't captured
          <div style={{
            padding: '40px 48px',
            fontFamily: FONT, fontSize: 26, fontWeight: 500,
            color: TEXT_PRI, lineHeight: 1.6, textAlign: 'left',
          }}>
            <div style={{ color: TEXT_SEC, fontSize: 18, marginBottom: 16 }}>
              @{tweet.handle} · {tweet.author}
            </div>
            {tweet.text}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={{
        opacity: statsOpacity,
        transform: `translateY(${statsY}px)`,
        display: 'flex', gap: 48, alignItems: 'center',
        background: BG_CARD, border: `1px solid ${BORDER}`,
        borderRadius: 99, padding: '14px 40px',
      }}>
        {[
          { icon: '❤️', label: tweet.likes, name: 'Likes' },
          { icon: '🔁', label: tweet.retweets, name: 'Retweets' },
          { icon: '💬', label: tweet.replies, name: 'Replies' },
          ...(tweet.views ? [{ icon: '👁️', label: tweet.views, name: 'Views' }] : []),
        ].map(({ icon, label, name }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: TEXT_PRI }}>{label}</span>
            <span style={{ fontFamily: FONT, fontSize: 16, color: TEXT_SEC }}>{name}</span>
          </div>
        ))}

        <div style={{ width: 1, height: 28, background: BORDER }} />

        <div style={{ fontFamily: FONT, fontSize: 18, color: TEXT_SEC }}>
          <span style={{ color: TEXT_PRI, fontWeight: 600 }}>@{tweet.handle}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Insights scene — 150 frames (5s)
const InsightsScene: React.FC<{ insights: string[]; topic: string }> = ({ insights, topic }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(160deg, #0a0a0f 0%, #0d1520 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', justifyContent: 'center',
      padding: '0 120px',
    }}>
      <div style={{
        fontFamily: FONT, fontSize: 20, fontWeight: 700, color: ACCENT,
        letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16,
        opacity: fadeIn(frame, 0, 15),
      }}>
        Key Takeaways · {topic}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {insights.slice(0, 5).map((insight, i) => {
          const delay = i * 18;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 20,
              opacity: fadeIn(frame, delay, 18),
              transform: `translateX(${interpolate(frame - delay, [0, 18], [-24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `${ACCENT}22`, border: `2px solid ${ACCENT}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 3,
                fontFamily: FONT, fontSize: 16, fontWeight: 700, color: ACCENT,
              }}>
                {i + 1}
              </div>
              <div style={{
                fontFamily: FONT, fontSize: 32, fontWeight: 500,
                color: TEXT_PRI, lineHeight: 1.4,
              }}>
                {insight}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Outro scene — 90 frames (3s)
const OutroScene: React.FC<{ cta: string; hashtags?: string[] }> = ({ cta, hashtags }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = springScale(frame, fps, 5);
  const opacity = fadeIn(frame, 0, 20);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 50%, #0d1a2e 0%, ${BG_DARK} 70%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 32, padding: '0 80px',
    }}>
      <div style={{
        opacity,
        transform: `scale(${scale})`,
        textAlign: 'center',
        fontFamily: FONT, fontSize: 52, fontWeight: 900,
        color: TEXT_PRI, lineHeight: 1.2,
      }}>
        {cta}
      </div>

      {hashtags && hashtags.length > 0 && (
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
          opacity: fadeIn(frame, 30, 20),
        }}>
          {hashtags.map(tag => (
            <span key={tag} style={{
              fontFamily: FONT, fontSize: 22, color: ACCENT, fontWeight: 600,
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Twitter X logo watermark */}
      <div style={{
        position: 'absolute', bottom: 40, right: 60,
        fontFamily: FONT, fontSize: 16, color: TEXT_SEC,
        opacity: fadeIn(frame, 40, 20),
      }}>
        Trends sourced from X/Twitter
      </div>
    </AbsoluteFill>
  );
};

// ─── Main composition ────────────────────────────────────────────────────────

const INTRO_FRAMES   = 90;  // 3s
const CONTEXT_FRAMES = 90;  // 3s
const TWEET_FRAMES   = 150; // 5s each
const INSIGHTS_FRAMES = 150; // 5s
const OUTRO_FRAMES   = 90;  // 3s

export const getTrendVideoDuration = (tweetCount: number) =>
  INTRO_FRAMES + CONTEXT_FRAMES + Math.min(tweetCount, 8) * TWEET_FRAMES + INSIGHTS_FRAMES + OUTRO_FRAMES;

export const TrendVideoComposition: React.FC<TrendVideoProps> = ({ brief: briefProp }) => {
  const brief = briefProp ?? trendVideoDefaultBrief;
  const tweets = brief.tweets.slice(0, 8); // cap at 8
  const cta = brief.cta ?? 'Follow for daily AI + tech trends';

  return (
    <AbsoluteFill style={{ background: BG_DARK }}>
      {/* Voiceover — path is relative to public/ after prepareAssetsForRemotion copies it */}
      {brief.voiceover_path && (
        <Audio src={staticFile(brief.voiceover_path)} />
      )}

      <Series>
        <Series.Sequence durationInFrames={INTRO_FRAMES}>
          <IntroScene brief={brief} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={CONTEXT_FRAMES}>
          <ContextScene brief={brief} />
        </Series.Sequence>

        {tweets.map((tweet, i) => (
          <Series.Sequence key={i} durationInFrames={TWEET_FRAMES}>
            <TweetSlide tweet={tweet} index={i} />
          </Series.Sequence>
        ))}

        <Series.Sequence durationInFrames={INSIGHTS_FRAMES}>
          <InsightsScene insights={brief.insights} topic={brief.topic} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={OUTRO_FRAMES}>
          <OutroScene cta={cta} hashtags={brief.hashtags} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export const trendVideoDefaultBrief: TrendBrief = {
  topic: 'AI Coding Goes Autonomous',
  hook: 'Developers are shipping 10x faster — here\'s what\'s actually happening.',
  summary: 'Claude 4 dropped this week and the dev community exploded. Autonomous coding agents are going from experiment to production, and the discourse on X tells the real story.',
  script: 'This week in AI: Claude 4 shipped and the reaction from developers was immediate...',
  insights: [
    'Autonomous agents now handle full PR cycles without human review',
    'Speed gains are real — but context window limits still bite',
    'The biggest unlock: agents that can spawn other agents',
  ],
  tweets: [
    {
      screenshotPath: 'trend-screenshots/tweet-01.png',
      author: 'Example Author',
      handle: 'examplehandle',
      text: 'Just shipped a feature using only Claude agents — zero manual code',
      likes: '4.2K', retweets: '890', replies: '312', views: '180K',
    },
  ],
  hashtags: ['AI', 'Claude', 'Coding', 'AITrends'],
  cta: 'Follow @isaiahdupree for daily AI trends',
};
