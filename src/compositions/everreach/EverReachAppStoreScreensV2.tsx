import React from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig } from 'remotion';
import { EVERREACH_FONTS } from './config';
import { COPY_ANGLES, AngleKey } from './copyAngles';

// =============================================================================
// V2 — Spec-driven rebuild. One thing per screen. Nothing wasted.
// Spec: /Users/isaiahdupree/Documents/Software/EverReachOrganized/marketing/SCREENSHOT_SPEC.md
// =============================================================================

const ACCENT  = '#FF6B6B';
const BG      = '#09090f'; // off-black — never pure black

const W  = EVERREACH_FONTS.weights;
const F  = EVERREACH_FONTS.heading;
const FB = EVERREACH_FONTS.body;

export interface V2ScreenProps { angleKey?: AngleKey }

// -----------------------------------------------------------------------------
// Primitives
// -----------------------------------------------------------------------------

const Badge: React.FC<{ label: string; color?: string }> = ({ label, color = ACCENT }) => (
  <div style={{
    padding: '6px 22px', borderRadius: 100,
    background: `${color}18`, border: `1px solid ${color}40`,
    color, fontSize: 28, fontFamily: F, fontWeight: W.bold, letterSpacing: 2,
  }}>
    {label}
  </div>
);

const Phone: React.FC<{ src: string; width: number }> = ({ src, width }) => {
  const height = Math.round(width * 2.16);
  const r = Math.round(width * 0.115);
  const nw = Math.round(width * 0.34);
  const nh = Math.round(width * 0.075);
  const nt = Math.round(width * 0.035);
  return (
    <div style={{
      width, height, position: 'relative', borderRadius: r,
      border: '1.5px solid rgba(255,255,255,0.12)', background: '#000',
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
    }}>
      <div style={{
        position: 'absolute', top: nt, left: '50%', transform: 'translateX(-50%)',
        width: nw, height: nh, borderRadius: nh, background: '#000', zIndex: 10,
      }} />
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: r - 2 }} />
    </div>
  );
};

const Glow: React.FC<{ color: string; opacity?: number; top?: string }> = ({
  color, opacity = 0.12, top = '45%',
}) => (
  <div style={{
    position: 'absolute', top, left: '50%', transform: 'translate(-50%, -50%)',
    width: '140%', height: '55%',
    background: `radial-gradient(ellipse, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 65%)`,
    pointerEvents: 'none',
  }} />
);

const Quote: React.FC<{ text: string; author: string; role: string }> = ({ text, author, role }) => (
  <div style={{
    padding: '28px 32px', borderRadius: 20,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  }}>
    <p style={{
      fontSize: 26, fontFamily: FB, fontWeight: W.medium,
      color: 'rgba(255,255,255,0.82)', lineHeight: 1.5, margin: '0 0 14px', fontStyle: 'italic',
    }}>"{text}"</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 18,
        background: `${ACCENT}28`, border: `1.5px solid ${ACCENT}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 16, color: ACCENT, fontWeight: W.bold, fontFamily: F }}>{author[0]}</span>
      </div>
      <div>
        <p style={{ fontSize: 18, fontFamily: F, fontWeight: W.bold, color: '#fff', margin: 0 }}>{author}</p>
        <p style={{ fontSize: 15, fontFamily: FB, color: 'rgba(255,255,255,0.38)', margin: 0 }}>{role}</p>
      </div>
    </div>
  </div>
);

// =============================================================================
// SCREEN 1 — HOOK
// Layout: Logo → Headline → Sub → 3-phone cascade → CTA → Proof
// =============================================================================

export const V2Screen1: React.FC<V2ScreenProps> = ({ angleKey = 'founder' }) => {
  const copy = COPY_ANGLES[angleKey];
  const { width, height } = useVideoConfig();
  const ph = Math.round(height * 0.36);
  const pw = Math.round(ph / 2.16);

  return (
    <AbsoluteFill style={{ background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <Glow color={ACCENT} opacity={0.10} top="46%" />

      {/* Top: logo + headline + sub */}
      <div style={{
        paddingTop: Math.round(height * 0.052),
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', zIndex: 2, gap: Math.round(height * 0.016),
      }}>
        <Img
          src={staticFile('everreach/branding/logo-no-bg.png')}
          style={{ height: Math.round(height * 0.030), objectFit: 'contain' }}
        />
        <h1 style={{
          fontSize: Math.round(width * 0.095), fontFamily: F, fontWeight: W.black,
          color: '#fff', textAlign: 'center', lineHeight: 1.06, margin: 0,
          padding: `0 ${Math.round(width * 0.06)}px`, letterSpacing: -1.5, whiteSpace: 'pre-line',
        }}>
          {copy.s1Headline}
        </h1>
        <p style={{
          fontSize: Math.round(width * 0.034), fontFamily: FB, fontWeight: W.medium,
          color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.4, margin: 0,
          padding: `0 ${Math.round(width * 0.10)}px`,
        }}>
          {copy.s1Sub}
        </p>
      </div>

      {/* 3-phone cascade — hero screen only */}
      <div style={{
        position: 'relative', width: '100%', height: Math.round(height * 0.38),
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 3, flexShrink: 0, marginTop: Math.round(height * 0.010),
      }}>
        <div style={{ position: 'absolute', left: Math.round(width * 0.02), top: '50%', transform: 'translateY(-44%)', zIndex: 1, filter: 'brightness(0.82)' }}>
          <Phone src="everreach/screenshots/01-contacts-list.png" width={Math.round(pw * 0.88)} />
        </div>
        <div style={{ position: 'absolute', top: '-6%', zIndex: 3 }}>
          <Phone src="everreach/screenshots/05-warmth-score.png" width={pw} />
        </div>
        <div style={{ position: 'absolute', right: Math.round(width * 0.02), top: '50%', transform: 'translateY(-44%)', zIndex: 1, filter: 'brightness(0.82)' }}>
          <Phone src="everreach/screenshots/02-contact-detail.png" width={Math.round(pw * 0.88)} />
        </div>
      </div>

      {/* Bottom: badge + CTA + proof */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: Math.round(height * 0.014),
        padding: `${Math.round(height * 0.014)}px ${Math.round(width * 0.06)}px ${Math.round(height * 0.048)}px`,
        width: '100%', marginTop: 'auto', zIndex: 2,
      }}>
        <Badge label={copy.s1Badge} />
        <div style={{
          width: '88%', padding: `${Math.round(height * 0.020)}px 0`,
          borderRadius: 18, background: '#fff', color: '#000',
          fontSize: Math.round(width * 0.042), fontFamily: F, fontWeight: W.bold,
          textAlign: 'center', letterSpacing: -0.3,
        }}>
          {copy.s1Cta}
        </div>
        <p style={{ fontSize: Math.round(width * 0.026), color: 'rgba(255,255,255,0.25)', fontFamily: FB, margin: 0 }}>
          {copy.s1Proof}
        </p>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// SCREEN 2 — WHO
// Layout: Badge → Headline → Sub → Phone (centered, large)
// =============================================================================

export const V2Screen2: React.FC<V2ScreenProps> = ({ angleKey = 'founder' }) => {
  const copy = COPY_ANGLES[angleKey];
  const { width, height } = useVideoConfig();
  const pw = Math.round(width * 0.72);

  return (
    <AbsoluteFill style={{ background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <Glow color="#4ECDC4" opacity={0.09} top="62%" />

      <div style={{
        paddingTop: Math.round(height * 0.055),
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', zIndex: 2, gap: Math.round(height * 0.018),
        padding: `${Math.round(height * 0.055)}px ${Math.round(width * 0.06)}px 0`,
      }}>
        <Badge label={copy.s2Badge} color="#4ECDC4" />
        <h1 style={{
          fontSize: Math.round(width * 0.095), fontFamily: F, fontWeight: W.black,
          color: '#fff', textAlign: 'center', lineHeight: 1.06, margin: 0,
          letterSpacing: -1.5, whiteSpace: 'pre-line',
        }}>
          {copy.s2Headline}
        </h1>
        <p style={{
          fontSize: Math.round(width * 0.034), fontFamily: FB, fontWeight: W.medium,
          color: 'rgba(255,255,255,0.42)', textAlign: 'center', lineHeight: 1.4, margin: 0,
          padding: `0 ${Math.round(width * 0.04)}px`,
        }}>
          {copy.s2FooterText}
        </p>
      </div>

      <div style={{
        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        paddingTop: Math.round(height * 0.024), zIndex: 3, width: '100%',
      }}>
        <Phone src="everreach/screenshots/01-contacts-list.png" width={pw} />
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// SCREEN 3 — WHAT (MAGIC MOMENT)
// Layout: Badge → Headline → Sub → Phone (centered, large)
// =============================================================================

export const V2Screen3: React.FC<V2ScreenProps> = ({ angleKey = 'founder' }) => {
  const copy = COPY_ANGLES[angleKey];
  const { width, height } = useVideoConfig();
  const pw = Math.round(width * 0.72);

  return (
    <AbsoluteFill style={{ background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <Glow color={ACCENT} opacity={0.09} top="62%" />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', zIndex: 2, gap: Math.round(height * 0.018),
        padding: `${Math.round(height * 0.055)}px ${Math.round(width * 0.06)}px 0`,
      }}>
        <Badge label={copy.s3Badge} color={ACCENT} />
        <h1 style={{
          fontSize: Math.round(width * 0.095), fontFamily: F, fontWeight: W.black,
          color: '#fff', textAlign: 'center', lineHeight: 1.06, margin: 0,
          letterSpacing: -1.5, whiteSpace: 'pre-line',
        }}>
          {copy.s3Headline}
        </h1>
        <p style={{
          fontSize: Math.round(width * 0.034), fontFamily: FB, fontWeight: W.medium,
          color: 'rgba(255,255,255,0.42)', textAlign: 'center', lineHeight: 1.4, margin: 0,
          padding: `0 ${Math.round(width * 0.04)}px`,
        }}>
          {copy.s3FooterText}
        </p>
      </div>

      <div style={{
        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        paddingTop: Math.round(height * 0.024), zIndex: 3, width: '100%',
      }}>
        <Phone src="everreach/screenshots/06-goal-compose.png" width={pw} />
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// SCREEN 4 — WHEN (TRUST SIGNAL)
// Layout: Badge → Headline → Sub → Phone (centered, large) — NO glow, let it breathe
// =============================================================================

export const V2Screen4: React.FC<V2ScreenProps> = ({ angleKey = 'founder' }) => {
  const copy = COPY_ANGLES[angleKey];
  const { width, height } = useVideoConfig();
  const pw = Math.round(width * 0.72);

  return (
    <AbsoluteFill style={{ background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      {/* No glow — let this screen breathe */}

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', zIndex: 2, gap: Math.round(height * 0.018),
        padding: `${Math.round(height * 0.055)}px ${Math.round(width * 0.06)}px 0`,
      }}>
        <Badge label={copy.s4Badge} color="#FFB366" />
        <h1 style={{
          fontSize: Math.round(width * 0.095), fontFamily: F, fontWeight: W.black,
          color: '#fff', textAlign: 'center', lineHeight: 1.06, margin: 0,
          letterSpacing: -1.5, whiteSpace: 'pre-line',
        }}>
          {copy.s4Headline}
        </h1>
        <p style={{
          fontSize: Math.round(width * 0.034), fontFamily: FB, fontWeight: W.medium,
          color: 'rgba(255,255,255,0.42)', textAlign: 'center', lineHeight: 1.4, margin: 0,
          padding: `0 ${Math.round(width * 0.04)}px`,
        }}>
          {copy.s4FooterText}
        </p>
      </div>

      <div style={{
        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        paddingTop: Math.round(height * 0.024), zIndex: 3, width: '100%',
      }}>
        <Phone src="everreach/screenshots/05-warmth-score.png" width={pw} />
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// SCREEN 5 — CLOSE
// Layout: Stars → Headline → 2 Quotes → Trust row → CTA
// NO stat cards — they were noise
// =============================================================================

export const V2Screen5: React.FC<V2ScreenProps> = ({ angleKey = 'founder' }) => {
  const copy = COPY_ANGLES[angleKey];
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <Glow color={ACCENT} opacity={0.06} top="35%" />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%', flex: 1,
        padding: `${Math.round(height * 0.058)}px ${Math.round(width * 0.06)}px ${Math.round(height * 0.048)}px`,
      }}>
        {/* Stars + rating */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: Math.round(width * 0.088), letterSpacing: 3 }}>{copy.s5Stars}</span>
          <p style={{ fontSize: Math.round(width * 0.040), fontFamily: F, fontWeight: W.bold, color: '#fff', margin: 0 }}>
            {copy.s5Rating}
          </p>
          <p style={{ fontSize: Math.round(width * 0.028), fontFamily: FB, color: 'rgba(255,255,255,0.32)', margin: 0 }}>
            {copy.s5RatingNote}
          </p>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: Math.round(width * 0.092), fontFamily: F, fontWeight: W.black,
          color: '#fff', textAlign: 'center', lineHeight: 1.08, margin: 0,
          letterSpacing: -1.5, whiteSpace: 'pre-line',
        }}>
          {copy.s5Headline}
        </h1>

        {/* 2 quotes — no stat cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          {copy.s5Quotes.map(q => (
            <Quote key={q.author} text={q.text} author={q.author} role={q.role} />
          ))}
        </div>

        {/* Trust row */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', width: '100%',
          padding: `${Math.round(height * 0.016)}px 0`,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          {['Zero auto-sends', 'You approve every message', 'Cancel anytime'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: Math.round(width * 0.030), color: ACCENT }}>✓</span>
              <span style={{ fontSize: Math.round(width * 0.026), fontFamily: FB, color: 'rgba(255,255,255,0.50)' }}>{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
          <div style={{
            width: '100%', padding: `${Math.round(height * 0.018)}px 0`,
            borderRadius: 18, background: '#fff', color: '#000',
            fontSize: Math.round(width * 0.040), fontFamily: F, fontWeight: W.bold,
            textAlign: 'center', letterSpacing: -0.3,
          }}>
            {copy.s5Cta}
          </div>
          <p style={{ fontSize: Math.round(width * 0.026), color: 'rgba(255,255,255,0.25)', fontFamily: FB, margin: 0 }}>
            {copy.s5Footer}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
