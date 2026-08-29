import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from 'remotion';
import { AnimatedCaptions, WordTiming, generateTranscriptFromText } from '../components/AnimatedCaptions';

// ============================================================================
// IsaiahStyleReel
// ============================================================================
// Reverse-engineered from @the_isaiah_dupree top-performing reels
//
// Style DNA (extracted from 3 top videos):
//   - Format: 720×1280 9:16 vertical @ 30fps
//   - Colors: warm muted tones (#817676, #706560) — dark bg, warm overlay
//   - Duration: 20–48s sweet spot
//   - Structure: hook text (0–2s) → voiceover + captions → numbered points
//   - Captions: white, bold, centered, 2–4 words at a time, pop animation
//   - Color grade: warm tint, slightly desaturated
//   - Pacing: cuts at silence gaps (~0.3–0.7s), tight edits
// ============================================================================

export interface IsaiahStyleReelProps {
  // Exact composition length selected from the immutable audio/caption timeline.
  durationInFrames?: number;
  // Background video from iPhone (put in public/ or use staticFile path)
  backgroundVideoPath?: string;
  // Background color fallback (warm dark)
  backgroundColor?: string;
  // Hook text shown at start
  hook: string;
  // Main script / body lines (shown as text overlays between captions)
  scriptLines?: string[];
  // Full voiceover audio
  audioPath?: string;
  // Exact first body-word onset after the on-screen hook.
  captionStartSeconds?: number;
  // Word-level transcript for animated captions (if available)
  transcript?: WordTiming[];
  // Fallback: plain text for auto-timing captions
  captionText?: string;
  // Numbered points to display (e.g. "3 steps")
  points?: string[];
  // CTA shown at end
  cta?: string;
  // Exact first-word onset for the CTA in the decoded voice timeline.
  ctaStartSeconds?: number;
  // Brand watermark text (e.g. "@the_isaiah_dupree")
  watermark?: string;
  // Color grade preset
  grade?: 'warm' | 'cool' | 'clean' | 'moody';
  // Caption style
  captionAnimation?: 'pop' | 'highlight' | 'karaoke' | 'bounce';
  // Evidence-shaped visual story. Generic preserves the reusable legacy layout.
  visualMode?: 'generic' | 'lead_handoff';
  // Platform-safe lower caption boundary in pixels.
  safeCaptionBottom?: number;
}

// Color grade presets based on Isaiah's actual video colors
const GRADE_PRESETS = {
  warm: 'saturate(0.85) brightness(0.92) sepia(0.12)',      // #817676 avg
  cool: 'saturate(0.8) brightness(0.95) hue-rotate(10deg)',
  clean: 'saturate(1.0) brightness(1.0)',
  moody: 'saturate(0.7) brightness(0.85) contrast(1.1) sepia(0.08)',
};

// Hook text overlay — animated entrance
const HookOverlay: React.FC<{ hook: string; frame: number; fps: number; endFrame: number }> = ({
  hook, frame, fps, endFrame,
}) => {
  const fadeIn = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const opacity = interpolate(fadeIn, [0, 1], [0, 1]);
  const translateY = interpolate(fadeIn, [0, 1], [30, 0]);

  const fadeOut = interpolate(frame, [Math.max(0, endFrame - fps * 0.35), endFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const finalOpacity = opacity * fadeOut;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 48px',
        opacity: finalOpacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
          fontWeight: 800,
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: '-0.5px',
          textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          maxWidth: 580,
        }}
      >
        {hook}
      </div>
    </div>
  );
};

// Numbered point card — slides in
const PointCard: React.FC<{
  number: number;
  text: string;
  frame: number;
  fps: number;
  startFrame: number;
}> = ({ number, text, frame, fps, startFrame }) => {
  const localFrame = frame - startFrame;
  const anim = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const translateX = interpolate(anim, [0, 1], [-60, 0]);
  const opacity = interpolate(anim, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        opacity,
        transform: `translateX(${translateX}px)`,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          fontSize: 22,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontSize: 32,
          fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
          fontWeight: 600,
          color: '#ffffff',
          lineHeight: 1.35,
          textShadow: '0 1px 8px rgba(0,0,0,0.6)',
          paddingTop: 4,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// CTA overlay at end
const CTAOverlay: React.FC<{
  text: string;
  points: string[];
  frame: number;
  fps: number;
  startFrame: number;
  durationInFrames: number;
}> = ({
  text, points, frame, fps, startFrame, durationInFrames,
}) => {
  const localFrame = frame - startFrame;
  const anim = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 100 } });
  const translateY = interpolate(anim, [0, 1], [34, 0]);
  const opacity = interpolate(anim, [0, 1], [0, 1]);
  const progress = Math.min(
    1,
    Math.max(0, localFrame / Math.max(1, durationInFrames - startFrame - 1)),
  );
  const sweepX = -160 + progress * 1040;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '140px 62px 210px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(12,9,8,1), rgba(12,9,8,0.985) 48%)',
        zIndex: 40,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 160,
          transform: `translateX(${sweepX}px) skewX(-12deg)`,
          background: 'linear-gradient(90deg, transparent, rgba(255,224,102,0.14), transparent)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          color: '#FFE066',
          fontSize: 19,
          fontWeight: 800,
          letterSpacing: '3px',
          marginBottom: 24,
          fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        TRY THIS TODAY
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: 50,
          fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.12,
          letterSpacing: '-1px',
          textAlign: 'center',
          maxWidth: 600,
          textShadow: '0 4px 30px rgba(0,0,0,0.9)',
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {text}
      </div>
      {points.length > 0 && (
        <div style={{position: 'relative', zIndex: 1, display: 'flex', gap: 10, marginTop: 34, flexWrap: 'wrap', justifyContent: 'center', opacity, transform: `translateY(${translateY}px)`}}>
          {points.slice(0, 3).map((point) => (
            <div
              key={point}
              style={{
                border: '1px solid rgba(255,224,102,0.5)',
                background: 'rgba(255,224,102,0.08)',
                borderRadius: 999,
                padding: '10px 16px',
                color: '#FFEFB0',
                fontSize: 18,
                fontWeight: 700,
                fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
              }}
            >
              {point}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Watermark
const Watermark: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: 'absolute',
      top: 52,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    <div
      style={{
        fontSize: 18,
        fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: '0.5px',
        textShadow: '0 1px 6px rgba(0,0,0,0.4)',
      }}
    >
      {text}
    </div>
  </div>
);

// Dark gradient overlay to ensure text readability
const GradientOverlay: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.55) 100%)',
      pointerEvents: 'none',
    }}
  />
);

const sceneOpacity = (time: number, start: number, end: number, fade = 0.28) =>
  interpolate(time, [start, start + fade, end - fade, end], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const AmbientBackground: React.FC<{frame: number}> = ({frame}) => {
  const driftX = Math.sin(frame / 42) * 34;
  const driftY = Math.cos(frame / 55) * 42;
  return (
    <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,224,102,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,224,102,0.055) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          backgroundPosition: `${(frame * 0.32) % 44}px ${(frame * 0.18) % 44}px`,
          maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          left: -250 + driftX,
          top: 120 + driftY,
          borderRadius: '50%',
          background: 'rgba(255,107,74,0.16)',
          filter: 'blur(90px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 560,
          height: 560,
          right: -310 - driftX,
          bottom: 120 - driftY,
          borderRadius: '50%',
          background: 'rgba(255,224,102,0.12)',
          filter: 'blur(100px)',
        }}
      />
    </AbsoluteFill>
  );
};

const StoryProgress: React.FC<{frame: number; durationInFrames: number}> = ({
  frame,
  durationInFrames,
}) => {
  const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames - 1)));
  return (
    <div
      style={{
        position: 'absolute',
        left: 54,
        right: 54,
        top: 102,
        height: 4,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.12)',
        overflow: 'hidden',
        zIndex: 20,
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #FF6B4A, #FFE066)',
          boxShadow: '0 0 16px rgba(255,224,102,0.8)',
        }}
      />
    </div>
  );
};

const LeadHandoffVisuals: React.FC<{
  frame: number;
  fps: number;
  durationInFrames: number;
  ctaStartFrame: number;
  points: string[];
}> = ({frame, fps, durationInFrames, ctaStartFrame, points}) => {
  // The evidence story was art-directed on a 40-second reference timeline.
  // Stretch that visual timeline to the exact audio-bound composition length
  // without changing the real word timestamps used by the captions.
  const storyTime = Math.min(35.5, (frame / Math.max(1, ctaStartFrame)) * 35.5);
  const pulse = 0.75 + 0.25 * Math.sin(frame / 5);
  const cardFont = '"SF Pro Display", "Inter", system-ui, sans-serif';
  const scorePoints = points.length >= 3 ? points.slice(0, 3) : ['Frequency', 'Waiting time', 'Proof'];

  return (
    <AbsoluteFill style={{pointerEvents: 'none', zIndex: 10}}>
      <StoryProgress frame={frame} durationInFrames={durationInFrames} />

      <div
        style={{
          position: 'absolute',
          left: 74,
          right: 74,
          top: 790,
          opacity: sceneOpacity(storyTime, 0, 3.45),
          transform: `translateY(${Math.sin(frame / 8) * 4}px)`,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(20,16,14,0.78)',
          borderRadius: 24,
          padding: '22px 24px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div>
            <div style={{fontFamily: cardFont, fontSize: 15, color: '#AFA8A4', letterSpacing: '2px', fontWeight: 800}}>
              NEW QUOTE REQUEST
            </div>
            <div style={{fontFamily: cardFont, fontSize: 29, color: '#FFFFFF', marginTop: 7, fontWeight: 750}}>
              Lead awaiting response
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 9, color: '#FFB29F', fontFamily: cardFont, fontWeight: 800, fontSize: 16}}>
            <span style={{width: 11, height: 11, borderRadius: '50%', background: '#FF6B4A', opacity: pulse, boxShadow: '0 0 16px #FF6B4A'}} />
            WAITING
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 54,
          right: 54,
          top: 250,
          opacity: sceneOpacity(storyTime, 3.1, 8.1),
        }}
      >
        <div style={{fontFamily: cardFont, fontSize: 18, color: '#CFC7C1', letterSpacing: '2px', fontWeight: 800, marginBottom: 18}}>
          WHAT TEAMS OPTIMIZE
        </div>
        <div style={{display: 'flex', gap: 16}}>
          <div style={{flex: 1, minHeight: 330, borderRadius: 28, padding: '26px 24px', background: 'linear-gradient(155deg, rgba(92,70,255,0.23), rgba(92,70,255,0.05))', border: '1px solid rgba(154,136,255,0.38)'}}>
            <div style={{fontSize: 46}}>✦</div>
            <div style={{fontFamily: cardFont, fontSize: 28, color: '#FFFFFF', fontWeight: 800, marginTop: 28}}>Futuristic demo</div>
            <div style={{fontFamily: cardFont, fontSize: 19, color: '#BEB3FF', lineHeight: 1.35, marginTop: 12}}>Looks impressive</div>
          </div>
          <div style={{flex: 1, minHeight: 330, borderRadius: 28, padding: '26px 24px', background: 'linear-gradient(155deg, rgba(255,107,74,0.24), rgba(255,107,74,0.05))', border: '1px solid rgba(255,140,112,0.45)', transform: `translateY(${Math.sin(frame / 6) * 4}px)`}}>
            <div style={{fontSize: 46}}>◷</div>
            <div style={{fontFamily: cardFont, fontSize: 28, color: '#FFFFFF', fontWeight: 800, marginTop: 28}}>Customer waiting</div>
            <div style={{fontFamily: cardFont, fontSize: 19, color: '#FFB7A5', lineHeight: 1.35, marginTop: 12}}>Delay still here</div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          top: 250,
          opacity: sceneOpacity(storyTime, 7.8, 13.7),
        }}
      >
        <div style={{fontFamily: cardFont, fontSize: 51, color: '#FFFFFF', fontWeight: 850, lineHeight: 1.05, letterSpacing: '-1px'}}>
          MORE SOFTWARE
          <br />
          <span style={{color: '#FF7658'}}>≠ LESS WAIT</span>
        </div>
        <div style={{marginTop: 42, display: 'grid', gap: 14}}>
          {['New tool added', 'Handoff still manual', 'Customer feels the delay'].map((label, index) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                borderRadius: 18,
                padding: '18px 20px',
                background: index === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,107,74,0.10)',
                border: `1px solid ${index === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(255,107,74,0.28)'}`,
                transform: `translateX(${Math.sin((frame + index * 7) / 10) * 3}px)`,
              }}
            >
              <span style={{fontSize: 24, color: index === 0 ? '#CFC7C1' : '#FF8D72'}}>{index === 0 ? '+' : '!'}</span>
              <span style={{fontFamily: cardFont, fontSize: 24, color: '#FFFFFF', fontWeight: 700}}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 48,
          right: 48,
          top: 220,
          opacity: sceneOpacity(storyTime, 13.3, 22.6),
        }}
      >
        <div style={{fontFamily: cardFont, fontSize: 18, color: '#FFE066', letterSpacing: '2px', fontWeight: 800}}>
          FOLLOW THE HANDOFF
        </div>
        <div style={{marginTop: 24, display: 'grid', gap: 12}}>
          {[
            ['01', 'Quote form', 'incoming lead'],
            ['02', 'Response time', 'measure the wait'],
            ['03', 'Routing decision', 'see where it goes'],
            ['04', 'Meeting booked', 'verify the output'],
          ].map(([number, title, detail], index) => {
            const active = storyTime >= 14.2 + index * 1.65;
            return (
              <div
                key={title}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '54px 1fr auto',
                  alignItems: 'center',
                  gap: 14,
                  padding: '17px 20px',
                  borderRadius: 19,
                  background: active ? 'rgba(121,242,181,0.11)' : 'rgba(255,255,255,0.055)',
                  border: `1px solid ${active ? 'rgba(121,242,181,0.42)' : 'rgba(255,255,255,0.12)'}`,
                  transform: `translateX(${active ? 0 : 16}px)`,
                  opacity: active ? 1 : 0.48,
                }}
              >
                <div style={{fontFamily: cardFont, fontSize: 16, color: active ? '#79F2B5' : '#827C78', fontWeight: 850}}>{number}</div>
                <div>
                  <div style={{fontFamily: cardFont, fontSize: 25, color: '#FFFFFF', fontWeight: 780}}>{title}</div>
                  <div style={{fontFamily: cardFont, fontSize: 16, color: '#AAA19C', marginTop: 3}}>{detail}</div>
                </div>
                <div style={{fontSize: 24, color: active ? '#79F2B5' : '#5F5A57'}}>{active ? '✓' : '○'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          top: 235,
          opacity: sceneOpacity(storyTime, 22.2, 30.8),
        }}
      >
        <div style={{fontFamily: cardFont, fontSize: 18, color: '#CFC7C1', letterSpacing: '2px', fontWeight: 800}}>
          THE FIRST-AUTOMATION TEST
        </div>
        <div style={{marginTop: 24, display: 'grid', gap: 15}}>
          {scorePoints.map((point, index) => {
            const labels = ['How often does it arrive?', 'How long does a person wait?', 'Can you verify the output?'];
            const active = storyTime >= 23.0 + index * 1.75;
            return (
              <div
                key={point}
                style={{
                  padding: '24px',
                  borderRadius: 24,
                  background: active ? 'linear-gradient(100deg, rgba(255,224,102,0.17), rgba(255,224,102,0.04))' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active ? 'rgba(255,224,102,0.48)' : 'rgba(255,255,255,0.12)'}`,
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
                  <div style={{width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: active ? '#FFE066' : 'rgba(255,255,255,0.1)', color: active ? '#1A1512' : '#8A837F', fontWeight: 900}}>{index + 1}</div>
                  <div>
                    <div style={{fontFamily: cardFont, fontSize: 28, color: '#FFFFFF', fontWeight: 820}}>{point}</div>
                    <div style={{fontFamily: cardFont, fontSize: 16, color: '#B8B0AB', marginTop: 4}}>{labels[index]}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 54,
          right: 54,
          top: 255,
          opacity: sceneOpacity(storyTime, 30.3, 35.65),
        }}
      >
        <div style={{fontFamily: cardFont, fontSize: 18, color: '#79F2B5', letterSpacing: '2px', fontWeight: 850}}>
          BETTER FIRST CANDIDATE
        </div>
        <div style={{marginTop: 26, borderRadius: 30, padding: '32px 30px', background: 'rgba(121,242,181,0.09)', border: '1px solid rgba(121,242,181,0.36)'}}>
          <div style={{fontFamily: cardFont, fontSize: 39, lineHeight: 1.22, color: '#FFFFFF', fontWeight: 850}}>
            Frequent <span style={{color: '#79F2B5'}}>+</span><br />
            Slow <span style={{color: '#79F2B5'}}>+</span><br />
            Verifiable
          </div>
          <div style={{height: 1, background: 'rgba(255,255,255,0.14)', margin: '27px 0'}} />
          <div style={{fontFamily: cardFont, fontSize: 25, color: '#DFFCEC', fontWeight: 750}}>Choose the wait it removes.</div>
        </div>
        <div style={{fontFamily: cardFont, fontSize: 23, color: '#8B8581', marginTop: 24, textDecoration: 'line-through', textDecorationColor: '#FF6B4A', textDecorationThickness: 3}}>
          Choose the flashiest demo
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// Main Composition
// ============================================================================

export const IsaiahStyleReel: React.FC<IsaiahStyleReelProps> = ({
  backgroundVideoPath,
  backgroundColor = '#1a1512',  // warm dark, matches Isaiah's palette
  hook,
  scriptLines = [],
  audioPath,
  captionStartSeconds,
  transcript,
  captionText,
  points = [],
  cta,
  ctaStartSeconds,
  watermark = '@the_isaiah_dupree',
  grade = 'warm',
  captionAnimation = 'pop',
  visualMode = 'generic',
  safeCaptionBottom = 230,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Auto-generate transcript if only captionText provided
  const resolvedTranscript = transcript ??
    (captionText ? generateTranscriptFromText(captionText, 2.5) : []);

  // Points display timing: start after hook (3s), show each for ~4s
  const pointsStartFrame = fps * 4;
  const pointDuration = fps * 4;

  // CTA timing: final 4.5 seconds. It becomes the sole text surface so the
  // spoken final instruction never collides with live captions.
  const ctaStartFrame = ctaStartSeconds === undefined
    ? durationInFrames - fps * 4.5
    : Math.floor(ctaStartSeconds * fps);
  const captionStartFrame = Math.floor((captionStartSeconds ?? 3.05) * fps);

  const colorFilter = GRADE_PRESETS[grade];

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Background video */}
      {backgroundVideoPath && (
        <AbsoluteFill>
          <Video
            src={backgroundVideoPath.startsWith('/') || backgroundVideoPath.startsWith('http')
              ? backgroundVideoPath
              : staticFile(backgroundVideoPath)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: colorFilter,
            }}
            muted={!!audioPath}  // mute bg video if we have separate audio
          />
        </AbsoluteFill>
      )}

      {/* Fallback: warm gradient bg when no video */}
      {!backgroundVideoPath && (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(ellipse at 30% 40%, #36231d 0%, #1a1512 58%, #0d0a08 100%)',
            filter: colorFilter,
          }}
        />
      )}

      <AmbientBackground frame={frame} />

      {/* Gradient overlay for text contrast */}
      <GradientOverlay />

      {/* Voiceover audio */}
      {audioPath && (
        <Audio
          src={audioPath.startsWith('/') || audioPath.startsWith('http')
            ? audioPath
            : staticFile(audioPath)}
        />
      )}

      {visualMode === 'lead_handoff' && (
        <LeadHandoffVisuals
          frame={frame}
          fps={fps}
          durationInFrames={durationInFrames}
          ctaStartFrame={ctaStartFrame}
          points={points}
        />
      )}

      {/* Hook text ends exactly as the first body caption begins. */}
      {frame < captionStartFrame && (
        <HookOverlay hook={hook} frame={frame} fps={fps} endFrame={captionStartFrame} />
      )}

      {/* Animated captions (synced to voiceover) */}
      {resolvedTranscript.length > 0 && frame >= captionStartFrame && frame < ctaStartFrame && (
        <AnimatedCaptions
          transcript={resolvedTranscript}
          style={{
            fontSize: 38,
            fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
            color: '#ffffff',
            highlightColor: '#FFE066',
            backgroundColor: 'rgba(12,9,8,0.68)',
            position: 'bottom',
            animation: captionAnimation,
            safeBottom: safeCaptionBottom,
          }}
          maxWordsPerLine={4}
          maxCharactersPerLine={24}
          gapHoldSeconds={0.12}
        />
      )}

      {/* Numbered points (slides in after hook) */}
      {visualMode === 'generic' && points.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '30%',
            padding: '0 48px',
          }}
        >
          {points.map((point, i) => {
            const pointStart = pointsStartFrame + i * pointDuration;
            if (frame < pointStart) return null;
            return (
              <PointCard
                key={i}
                number={i + 1}
                text={point}
                frame={frame}
                fps={fps}
                startFrame={pointStart}
              />
            );
          })}
        </div>
      )}

      {/* CTA overlay */}
      {cta && frame >= ctaStartFrame && (
        <CTAOverlay
          text={cta}
          points={points}
          frame={frame}
          fps={fps}
          startFrame={ctaStartFrame}
          durationInFrames={durationInFrames}
        />
      )}

      {/* Watermark */}
      {watermark && <Watermark text={watermark} />}
    </AbsoluteFill>
  );
};

// ============================================================================
// Default props (matches Isaiah's top-performing style)
// ============================================================================

export const isaiahStyleReelDefaultProps: IsaiahStyleReelProps = {
  hook: 'the friendship fade is real…',
  captionText: 'and it usually isn\'t drama. life just gets loud. here are 3 tiny moves that keep friendships alive without making it weird.',
  points: [
    'send the unsent message',
    'react before you reply',
    'make the next message normal',
  ],
  cta: 'follow for more',
  watermark: '@the_isaiah_dupree',
  grade: 'warm',
  captionAnimation: 'pop',
  visualMode: 'generic',
  safeCaptionBottom: 230,
  backgroundColor: '#1a1512',
};
