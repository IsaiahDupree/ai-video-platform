import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface YouTubeThumbnailBrief {
  /** Main headline — keep ≤ 6 words for readability */
  title: string;
  /** Subtitle / supporting text */
  subtitle?: string;
  /** Big bold stat/number displayed prominently (e.g. "$6.5K", "159 Jobs") */
  highlight?: string;
  /** Label under the highlight number (e.g. "avg budget") */
  highlight_label?: string;
  /** Show name shown in top badge */
  podcast_name?: string;
  /** Episode badge text (e.g. "EP. 1") */
  episode_label?: string;
  /** Speaker display name */
  speaker_name?: string;
  /** Speaker role/title */
  speaker_title?: string;
  /** "@handle" shown in corner */
  cta_handle?: string;
  /** Hex accent color — matches video */
  accent?: string;
  /** Optional background image path (relative to /public or absolute file:// url) */
  background_image?: string;
  /** Layout variant */
  style?: 'podcast' | 'data' | 'bold';
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const BG       = '#0a0712';
const BG_CARD  = 'rgba(19,16,42,0.92)';
const TEXT     = '#f1f5f9';
const TEXT_DIM = '#94a3b8';
const SANS     = 'Inter, system-ui, -apple-system, sans-serif';
const DEFAULT_ACCENT = '#00ff88';

// ─── Sub-components ────────────────────────────────────────────────────────────

const AvatarRing: React.FC<{ accent: string; size: number }> = ({ accent, size }) => {
  const r = size / 2;
  const glows = [0.3, 0.18, 0.08];
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Glow halos */}
      {glows.map((o, i) => (
        <div key={i} style={{
          position: 'absolute',
          inset: -(i + 1) * 14,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}${Math.round(o * 255).toString(16).padStart(2,'0')} 0%, transparent 70%)`,
        }} />
      ))}
      {/* Ring */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `4px solid ${accent}`,
        boxShadow: `0 0 24px ${accent}88, 0 0 48px ${accent}44`,
      }} />
      {/* Avatar fill */}
      <div style={{
        position: 'absolute', inset: 6, borderRadius: '50%',
        background: `linear-gradient(135deg, #1e1b4b 0%, #0a0712 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: SANS, fontWeight: 900,
          fontSize: r * 0.55, color: accent,
          letterSpacing: '-1px',
          textShadow: `0 0 20px ${accent}`,
        }}>ID</span>
      </div>
    </div>
  );
};

// Static waveform bars (decorative)
const WaveformDecor: React.FC<{ accent: string; count?: number }> = ({ accent, count = 28 }) => {
  const bars = Array.from({ length: count }, (_, i) => {
    const h = 20 + Math.sin(i * 0.8) * 30 + Math.cos(i * 1.3) * 20 + Math.abs(Math.sin(i * 0.4)) * 40;
    return Math.max(12, Math.min(100, h));
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 100 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 8, height: `${h}%`, borderRadius: 4,
          background: `linear-gradient(to top, ${accent}, ${accent}55)`,
          opacity: 0.5 + (h / 200),
        }} />
      ))}
    </div>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────────

export const YouTubeThumbnailComposition: React.FC<{ brief?: YouTubeThumbnailBrief }> = ({ brief }) => {
  if (!brief) return null;

  const accent = brief.accent || DEFAULT_ACCENT;
  const variant = brief.style || 'podcast';

  // Split title into lines for large display
  const words = brief.title.split(' ');
  const mid = Math.ceil(words.length / 2);
  const titleLine1 = words.slice(0, mid).join(' ');
  const titleLine2 = words.slice(mid).join(' ');

  // Background image src
  const bgSrc = brief.background_image
    ? (brief.background_image.startsWith('/') ? `file://${brief.background_image}` : staticFile(brief.background_image))
    : null;

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: SANS, overflow: 'hidden' }}>

      {/* ── Background layers ── */}
      {bgSrc && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${bgSrc})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.25,
        }} />
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${BG} 0%, rgba(10,7,18,0.85) 40%, rgba(20,12,40,0.7) 100%)`,
      }} />

      {/* Accent glow bottom-right */}
      <div style={{
        position: 'absolute', bottom: -120, right: -80,
        width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}1a 0%, transparent 65%)`,
      }} />

      {/* Top-left accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 6, height: '100%',
        background: `linear-gradient(to bottom, ${accent}, ${accent}00)`,
      }} />

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: 32, left: 52, right: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Podcast name badge */}
        {brief.podcast_name && (
          <div style={{
            background: `${accent}22`, border: `1.5px solid ${accent}55`,
            borderRadius: 8, padding: '6px 18px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
            <span style={{ color: accent, fontSize: 20, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {brief.podcast_name}
            </span>
          </div>
        )}
        {/* Episode badge */}
        {brief.episode_label && (
          <div style={{
            background: `${accent}33`, borderRadius: 8, padding: '6px 16px',
            color: accent, fontSize: 20, fontWeight: 800, letterSpacing: '0.1em',
          }}>
            {brief.episode_label}
          </div>
        )}
      </div>

      {/* ── Main content area ── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center',
        padding: '80px 52px 80px 52px',
        gap: 60,
      }}>

        {/* Left: text column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Big title */}
          <div>
            <div style={{
              fontSize: 94, fontWeight: 900, lineHeight: 1.0,
              color: TEXT,
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              letterSpacing: '-2px',
            }}>
              {titleLine1}
            </div>
            <div style={{
              fontSize: 94, fontWeight: 900, lineHeight: 1.0,
              color: accent,
              textShadow: `0 0 30px ${accent}66`,
              letterSpacing: '-2px',
            }}>
              {titleLine2}
            </div>
          </div>

          {/* Subtitle */}
          {brief.subtitle && (
            <div style={{
              fontSize: 30, fontWeight: 500, color: TEXT_DIM,
              lineHeight: 1.4, maxWidth: 580,
            }}>
              {brief.subtitle}
            </div>
          )}

          {/* Waveform decoration */}
          <div style={{ marginTop: 8 }}>
            <WaveformDecor accent={accent} count={24} />
          </div>
        </div>

        {/* Right: visual panel */}
        <div style={{
          width: 340, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 28,
        }}>

          {/* Avatar ring */}
          <AvatarRing accent={accent} size={200} />

          {/* Highlight stat */}
          {brief.highlight && (
            <div style={{
              background: BG_CARD,
              border: `1.5px solid ${accent}33`,
              borderRadius: 16, padding: '20px 32px',
              textAlign: 'center', width: '100%',
              boxShadow: `0 0 30px ${accent}11`,
            }}>
              <div style={{
                fontSize: 64, fontWeight: 900, color: accent,
                textShadow: `0 0 20px ${accent}88`,
                lineHeight: 1, letterSpacing: '-1px',
              }}>
                {brief.highlight}
              </div>
              {brief.highlight_label && (
                <div style={{ fontSize: 18, color: TEXT_DIM, fontWeight: 500, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {brief.highlight_label}
                </div>
              )}
            </div>
          )}

          {/* Speaker info */}
          {brief.speaker_name && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>{brief.speaker_name}</div>
              {brief.speaker_title && (
                <div style={{ fontSize: 16, color: TEXT_DIM, marginTop: 3 }}>{brief.speaker_title}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        position: 'absolute', bottom: 28, left: 52, right: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          height: 2, flex: 1, marginRight: 24,
          background: `linear-gradient(to right, ${accent}88, transparent)`,
        }} />
        {brief.cta_handle && (
          <span style={{ fontSize: 22, fontWeight: 700, color: accent, letterSpacing: '0.04em' }}>
            {brief.cta_handle}
          </span>
        )}
      </div>

    </AbsoluteFill>
  );
};

// ─── Default props ──────────────────────────────────────────────────────────────

export const DEFAULT_YT_THUMBNAIL_BRIEF: YouTubeThumbnailBrief = {
  title: 'Upwork AI Jobs Report',
  subtitle: 'The AI automation opportunity hiding in plain sight',
  highlight: '$6.5K',
  highlight_label: 'avg budget',
  podcast_name: 'Build in Public',
  episode_label: 'EP. 1',
  speaker_name: 'Isaiah Dupree',
  speaker_title: 'AI Automation Engineer',
  cta_handle: '@isaiahdupree',
  accent: '#00ff88',
  style: 'podcast',
};

export default YouTubeThumbnailComposition;
