import React from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { EVERREACH_FONTS } from './config';
import { COPY_ANGLES, AngleKey } from './copyAngles';

// =============================================================================
// Shared primitives
// =============================================================================

const ACCENT = '#FF6B6B';
const BG_DEEP  = 'linear-gradient(160deg, #05050f 0%, #0d0820 35%, #120a2a 60%, #05050f 100%)';
const BG_WARM  = 'linear-gradient(160deg, #0f0505 0%, #1f0808 40%, #0f0f05 100%)';
const BG_COOL  = 'linear-gradient(160deg, #030810 0%, #060d1f 40%, #030a15 100%)';
const BG_TRUST = 'linear-gradient(160deg, #050505 0%, #0f0f0f 50%, #050505 100%)';

const W = EVERREACH_FONTS.weights;
const F = EVERREACH_FONTS.heading;
const FB = EVERREACH_FONTS.body;

// =============================================================================
// Shared UI primitives
// =============================================================================

const Phone: React.FC<{ src: string; width: number; rotate?: number; translateY?: number }> = ({
  src, width, rotate = 0, translateY = 0,
}) => {
  const height = Math.round(width * 2.16);
  const r = Math.round(width * 0.115);
  const nw = Math.round(width * 0.34);
  const nh = Math.round(width * 0.075);
  const nt = Math.round(width * 0.035);
  return (
    <div style={{ width, height, position: 'relative', borderRadius: r, border: '2px solid rgba(255,255,255,0.18)', background: '#000', overflow: 'hidden', flexShrink: 0, transform: `rotate(${rotate}deg) translateY(${translateY}px)`, boxShadow: '0 48px 96px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)' }}>
      <div style={{ position: 'absolute', top: nt, left: '50%', transform: 'translateX(-50%)', width: nw, height: nh, borderRadius: nh, background: '#000', zIndex: 10 }} />
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: r - 2 }} />
    </div>
  );
};

const Callout: React.FC<{ text: string; fontSize?: number; accentColor?: string }> = ({
  text, fontSize = 24, accentColor = ACCENT,
}) => (
  <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 10, padding: '14px 20px', borderRadius: 14, background: `${accentColor}18`, border: `1.5px solid ${accentColor}55` }}>
    <div style={{ width: 8, height: 8, borderRadius: 4, background: accentColor, flexShrink: 0, marginTop: 5 }} />
    <span style={{ fontSize, fontFamily: FB, fontWeight: W.semibold, color: 'rgba(255,255,255,0.9)', lineHeight: 1.35, whiteSpace: 'pre-line' }}>{text}</span>
  </div>
);

const WarmthBadge: React.FC<{ label: string; color: string; score: number }> = ({ label, color, score }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <div style={{ width: 52, height: 52, borderRadius: 26, background: `${color}22`, border: `2px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 20, fontFamily: F, fontWeight: W.black, color }}>{score}</span>
    </div>
    <span style={{ fontSize: 16, fontFamily: FB, fontWeight: W.medium, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
  </div>
);

const StatCard: React.FC<{ number: string; label: string }> = ({ number, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '24px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', flex: 1 }}>
    <span style={{ fontSize: 44, fontFamily: F, fontWeight: W.black, color: '#fff', lineHeight: 1 }}>{number}</span>
    <span style={{ fontSize: 17, fontFamily: FB, fontWeight: W.medium, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
  </div>
);

const Quote: React.FC<{ text: string; author: string; role: string }> = ({ text, author, role }) => (
  <div style={{ padding: '28px 32px', borderRadius: 24, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
    <p style={{ fontSize: 27, fontFamily: FB, fontWeight: W.medium, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: '0 0 18px', fontStyle: 'italic' }}>"{text}"</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 20, background: `${ACCENT}33`, border: `1.5px solid ${ACCENT}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 18, color: ACCENT, fontWeight: W.bold, fontFamily: F }}>{author[0]}</span>
      </div>
      <div>
        <p style={{ fontSize: 20, fontFamily: F, fontWeight: W.bold, color: '#fff', margin: 0 }}>{author}</p>
        <p style={{ fontSize: 16, fontFamily: FB, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{role}</p>
      </div>
    </div>
  </div>
);

// =============================================================================
// Prop types
// =============================================================================

export interface AngleScreenProps {
  angleKey?: AngleKey;
}

// =============================================================================
// SCREEN 1 — HERO
// =============================================================================

export const AppStoreScreen1: React.FC<AngleScreenProps> = ({ angleKey = 'busy' }) => {
  const copy = COPY_ANGLES[angleKey];
  const { width, height } = useVideoConfig();
  const ph = Math.round(height * 0.40);
  const pw = Math.round(ph / 2.16);

  return (
    <AbsoluteFill style={{ background: BG_DEEP, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', width: width * 1.3, height: height * 0.5, background: `radial-gradient(ellipse, ${ACCENT}16 0%, transparent 68%)`, pointerEvents: 'none' }} />

      <div style={{ paddingTop: Math.round(height * 0.055), paddingBottom: Math.round(height * 0.02), zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <Img src={staticFile('everreach/branding/logo-no-bg.png')} style={{ height: Math.round(height * 0.032), objectFit: 'contain', marginBottom: Math.round(height * 0.024) }} />
        <h1 style={{ fontSize: Math.round(width * 0.092), fontFamily: F, fontWeight: W.black, color: '#fff', textAlign: 'center', lineHeight: 1.08, margin: 0, padding: `0 ${Math.round(width * 0.06)}px`, letterSpacing: -1.5, whiteSpace: 'pre-line' }}>
          {copy.s1Headline}
        </h1>
        <p style={{ fontSize: Math.round(width * 0.035), fontFamily: FB, fontWeight: W.medium, color: 'rgba(255,255,255,0.48)', textAlign: 'center', lineHeight: 1.45, margin: `${Math.round(height * 0.016)}px 0 0`, padding: `0 ${Math.round(width * 0.09)}px` }}>
          {copy.s1Sub}
        </p>
      </div>

      {/* 3-phone cascade */}
      <div style={{ position: 'relative', width: '100%', height: Math.round(height * 0.40), display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3, flexShrink: 0 }}>
        <div style={{ position: 'absolute', left: Math.round(width * 0.025), top: '50%', transform: 'translateY(-42%)', zIndex: 1 }}>
          <Phone src="everreach/screenshots/01-contacts-list.png" width={Math.round(pw * 0.9)} rotate={-9} />
        </div>
        <div style={{ position: 'absolute', top: '-8%', zIndex: 3 }}>
          <Phone src="everreach/screenshots/05-warmth-score.png" width={pw} rotate={0} />
        </div>
        <div style={{ position: 'absolute', right: Math.round(width * 0.025), top: '50%', transform: 'translateY(-42%)', zIndex: 1 }}>
          <Phone src="everreach/screenshots/02-contact-detail.png" width={Math.round(pw * 0.9)} rotate={9} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(height * 0.012), padding: `${Math.round(height * 0.016)}px ${Math.round(width * 0.06)}px`, width: '100%', marginTop: 'auto', paddingBottom: Math.round(height * 0.05) }}>
        <div style={{ padding: '6px 20px', borderRadius: 100, background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, color: ACCENT, fontSize: Math.round(width * 0.026), fontFamily: F, fontWeight: W.bold, letterSpacing: 1.5 }}>{copy.s1Badge}</div>
        <div style={{ width: '88%', padding: `${Math.round(height * 0.020)}px 0`, borderRadius: 18, background: '#fff', color: '#000', fontSize: Math.round(width * 0.042), fontFamily: F, fontWeight: W.bold, textAlign: 'center', letterSpacing: -0.3 }}>{copy.s1Cta}</div>
        <p style={{ fontSize: Math.round(width * 0.028), color: 'rgba(255,255,255,0.35)', fontFamily: FB, margin: 0 }}>No credit card · Cancel anytime</p>
        <p style={{ fontSize: Math.round(width * 0.026), color: 'rgba(255,255,255,0.22)', fontFamily: FB, margin: 0 }}>{copy.s1Proof}</p>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// SCREEN 2 — WHO
// =============================================================================

export const AppStoreScreen2: React.FC<AngleScreenProps> = ({ angleKey = 'busy' }) => {
  const copy = COPY_ANGLES[angleKey];
  const { width, height } = useVideoConfig();
  const pw = Math.round(width * 0.68);

  return (
    <AbsoluteFill style={{ background: BG_COOL, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ paddingTop: Math.round(height * 0.055), paddingBottom: Math.round(height * 0.018), zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ padding: '5px 18px', borderRadius: 100, background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.4)', color: '#4ECDC4', fontSize: Math.round(width * 0.028), fontFamily: F, fontWeight: W.bold, letterSpacing: 1, marginBottom: Math.round(height * 0.018) }}>
          {copy.s2Badge}
        </div>
        <h1 style={{ fontSize: Math.round(width * 0.092), fontFamily: F, fontWeight: W.black, color: '#fff', textAlign: 'center', lineHeight: 1.1, margin: 0, padding: `0 ${Math.round(width * 0.06)}px`, letterSpacing: -1.5, whiteSpace: 'pre-line' }}>
          {copy.s2Headline}
        </h1>
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'flex-start', paddingTop: Math.round(height * 0.01), zIndex: 3 }}>
        <Phone src="everreach/screenshots/01-contacts-list.png" width={pw} />
        <div style={{ position: 'absolute', right: Math.round(width * 0.02), top: Math.round(height * 0.04), display: 'flex', flexDirection: 'column', gap: 12 }}>
          <WarmthBadge label="Hot" color="#FF6B6B" score={92} />
          <WarmthBadge label="Warm" color="#FFB366" score={67} />
          <WarmthBadge label="Cool" color="#4ECDC4" score={41} />
        </div>
        <div style={{ position: 'absolute', left: Math.round(width * 0.02), bottom: Math.round(height * 0.06) }}>
          <Callout text={copy.s2CalloutText} fontSize={24} accentColor="#4ECDC4" />
        </div>
      </div>

      <div style={{ paddingBottom: Math.round(height * 0.048), paddingTop: Math.round(height * 0.014), textAlign: 'center', zIndex: 2 }}>
        <p style={{ fontSize: Math.round(width * 0.034), fontFamily: FB, fontWeight: W.medium, color: 'rgba(255,255,255,0.48)', margin: 0 }}>{copy.s2FooterText}</p>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// SCREEN 3 — WHAT
// =============================================================================

export const AppStoreScreen3: React.FC<AngleScreenProps> = ({ angleKey = 'busy' }) => {
  const copy = COPY_ANGLES[angleKey];
  const { width, height } = useVideoConfig();
  const pw = Math.round(width * 0.68);

  return (
    <AbsoluteFill style={{ background: BG_WARM, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ paddingTop: Math.round(height * 0.055), paddingBottom: Math.round(height * 0.018), zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ padding: '5px 18px', borderRadius: 100, background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, color: ACCENT, fontSize: Math.round(width * 0.028), fontFamily: F, fontWeight: W.bold, letterSpacing: 1, marginBottom: Math.round(height * 0.018) }}>
          {copy.s3Badge}
        </div>
        <h1 style={{ fontSize: Math.round(width * 0.092), fontFamily: F, fontWeight: W.black, color: '#fff', textAlign: 'center', lineHeight: 1.1, margin: 0, padding: `0 ${Math.round(width * 0.06)}px`, letterSpacing: -1.5, whiteSpace: 'pre-line' }}>
          {copy.s3Headline}
        </h1>
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'flex-start', paddingTop: Math.round(height * 0.01), zIndex: 3 }}>
        <Phone src="everreach/screenshots/06-goal-compose.png" width={pw} />
        <div style={{ position: 'absolute', right: Math.round(width * 0.02), top: Math.round(height * 0.08) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: Math.round(width * 0.28) }}>
            <div style={{ padding: '12px 16px', borderRadius: '16px 16px 4px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: 18, fontFamily: FB, color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.4, fontStyle: 'italic' }}>{copy.s3Before}</p>
            </div>
            <p style={{ fontSize: 16, fontFamily: FB, color: 'rgba(255,255,255,0.3)', margin: '4px 0', textAlign: 'center' }}>↓ EverReach</p>
            <div style={{ padding: '12px 16px', borderRadius: '16px 16px 4px 16px', background: `${ACCENT}18`, border: `1px solid ${ACCENT}44` }}>
              <p style={{ fontSize: 18, fontFamily: FB, color: 'rgba(255,255,255,0.88)', margin: 0, lineHeight: 1.4 }}>{copy.s3After}</p>
            </div>
            <p style={{ fontSize: 16, fontFamily: FB, color: `${ACCENT}cc`, margin: '2px 0', textAlign: 'right', fontWeight: W.semibold }}>{copy.s3AfterNote}</p>
          </div>
        </div>
        <div style={{ position: 'absolute', left: Math.round(width * 0.02), bottom: Math.round(height * 0.06) }}>
          <Callout text={copy.s3CalloutText} fontSize={24} accentColor={ACCENT} />
        </div>
      </div>

      <div style={{ paddingBottom: Math.round(height * 0.048), paddingTop: Math.round(height * 0.014), textAlign: 'center', zIndex: 2 }}>
        <p style={{ fontSize: Math.round(width * 0.034), fontFamily: FB, fontWeight: W.medium, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{copy.s3FooterText}</p>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// SCREEN 4 — WHEN
// =============================================================================

export const AppStoreScreen4: React.FC<AngleScreenProps> = ({ angleKey = 'busy' }) => {
  const copy = COPY_ANGLES[angleKey];
  const { width, height } = useVideoConfig();
  const pw = Math.round(width * 0.68);

  return (
    <AbsoluteFill style={{ background: BG_DEEP, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ paddingTop: Math.round(height * 0.055), paddingBottom: Math.round(height * 0.018), zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ padding: '5px 18px', borderRadius: 100, background: 'rgba(255,179,102,0.18)', border: '1px solid rgba(255,179,102,0.45)', color: '#FFB366', fontSize: Math.round(width * 0.028), fontFamily: F, fontWeight: W.bold, letterSpacing: 1, marginBottom: Math.round(height * 0.018) }}>
          {copy.s4Badge}
        </div>
        <h1 style={{ fontSize: Math.round(width * 0.092), fontFamily: F, fontWeight: W.black, color: '#fff', textAlign: 'center', lineHeight: 1.1, margin: 0, padding: `0 ${Math.round(width * 0.06)}px`, letterSpacing: -1.5, whiteSpace: 'pre-line' }}>
          {copy.s4Headline}
        </h1>
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'flex-start', paddingTop: Math.round(height * 0.01), zIndex: 3 }}>
        <Phone src="everreach/screenshots/05-warmth-score.png" width={pw} />
        <div style={{ position: 'absolute', right: Math.round(width * 0.02), top: Math.round(height * 0.03) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', maxWidth: Math.round(width * 0.30) }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FF6B6B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 22 }}>🔥</span>
            </div>
            <div>
              <p style={{ fontSize: 18, fontFamily: F, fontWeight: W.bold, color: '#fff', margin: '0 0 3px' }}>{copy.s4NotifTitle}</p>
              <p style={{ fontSize: 16, fontFamily: FB, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.35 }}>{copy.s4NotifBody}</p>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: Math.round(width * 0.02), bottom: Math.round(height * 0.10), display: 'flex', flexDirection: 'column', gap: 10 }}>
          {copy.s4Checks.map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: '#FFB36622', border: '1.5px solid #FFB36666', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: '#FFB366' }}>✓</span>
              </div>
              <span style={{ fontSize: 21, fontFamily: FB, fontWeight: W.medium, color: 'rgba(255,255,255,0.75)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ paddingBottom: Math.round(height * 0.048), paddingTop: Math.round(height * 0.014), textAlign: 'center', zIndex: 2 }}>
        <p style={{ fontSize: Math.round(width * 0.034), fontFamily: FB, fontWeight: W.medium, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{copy.s4FooterText}</p>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// SCREEN 5 — TRUST
// =============================================================================

export const AppStoreScreen5: React.FC<AngleScreenProps> = ({ angleKey = 'busy' }) => {
  const copy = COPY_ANGLES[angleKey];
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: BG_TRUST, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: width * 1.1, height: height * 0.4, background: `radial-gradient(ellipse, ${ACCENT}0e 0%, transparent 68%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', width: '100%', flex: 1, padding: `${Math.round(height * 0.055)}px ${Math.round(width * 0.06)}px ${Math.round(height * 0.045)}px` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: Math.round(width * 0.09), letterSpacing: 4 }}>{copy.s5Stars}</span>
          <p style={{ fontSize: Math.round(width * 0.042), fontFamily: F, fontWeight: W.bold, color: '#fff', margin: 0 }}>{copy.s5Rating}</p>
          <p style={{ fontSize: Math.round(width * 0.030), fontFamily: FB, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{copy.s5RatingNote}</p>
        </div>

        <h1 style={{ fontSize: Math.round(width * 0.092), fontFamily: F, fontWeight: W.black, color: '#fff', textAlign: 'center', lineHeight: 1.08, margin: 0, letterSpacing: -1.5, whiteSpace: 'pre-line' }}>
          {copy.s5Headline}
        </h1>

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {copy.s5Stats.map(s => <StatCard key={s.number} number={s.number} label={s.label} />)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          {copy.s5Quotes.map(q => <Quote key={q.author} text={q.text} author={q.author} role={q.role} />)}
        </div>

        {/* Feature trust row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', padding: `${Math.round(height * 0.018)}px 0`, borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {['Zero auto-sends', 'You review every message', 'Cancel anytime'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: Math.round(width * 0.032), color: ACCENT }}>✓</span>
              <span style={{ fontSize: Math.round(width * 0.028), fontFamily: FB, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
          <div style={{ width: '100%', padding: `${Math.round(height * 0.018)}px 0`, borderRadius: 18, background: '#fff', color: '#000', fontSize: Math.round(width * 0.042), fontFamily: F, fontWeight: W.bold, textAlign: 'center', letterSpacing: -0.3 }}>{copy.s5Cta}</div>
          <p style={{ fontSize: Math.round(width * 0.028), color: 'rgba(255,255,255,0.28)', fontFamily: FB, margin: 0 }}>{copy.s5Footer}</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// ANIMATED PREVIEW (15s)
// =============================================================================

export interface EverReachPreviewVideoProps {
  angleKey?: AngleKey;
}

export const everReachPreviewVideoDefaultProps: EverReachPreviewVideoProps = { angleKey: 'busy' };

export const EverReachPreviewVideo: React.FC<EverReachPreviewVideoProps> = ({ angleKey = 'busy' }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const SECTION = 90;
  const section = Math.floor(frame / SECTION);
  const localFrame = frame % SECTION;
  const fadeIn = interpolate(localFrame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(localFrame, [SECTION - 12, SECTION], [1, 0], { extrapolateLeft: 'clamp' });
  const sectionOpacity = Math.min(fadeIn, fadeOut);
  const breathe = spring({ frame: localFrame, fps, config: { stiffness: 40, damping: 20 } });
  const scale = interpolate(breathe, [0, 1], [1.02, 1.0]);

  const copy = COPY_ANGLES[angleKey];
  const screens = [
    { src: 'everreach/screenshots/01-contacts-list.png', label: copy.s1Headline.replace(/\n/g, ' ') },
    { src: 'everreach/screenshots/05-warmth-score.png', label: copy.s2Headline.replace(/\n/g, ' ') },
    { src: 'everreach/screenshots/06-goal-compose.png', label: copy.s3Headline.replace(/\n/g, ' ') },
    { src: 'everreach/screenshots/02-contact-detail.png', label: copy.s4Headline.replace(/\n/g, ' ') },
    { src: 'everreach/screenshots/07-subscription.png', label: copy.s1Cta },
  ];

  const current = screens[Math.min(section, screens.length - 1)];
  const pw = Math.round(width * 0.60);

  return (
    <AbsoluteFill style={{ background: BG_DEEP, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: width * 1.2, height: height * 0.8, background: `radial-gradient(ellipse, ${ACCENT}12 0%, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: Math.round(height * 0.05), left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
        <Img src={staticFile('everreach/branding/logo-no-bg.png')} style={{ height: Math.round(height * 0.032), objectFit: 'contain' }} />
      </div>
      <div style={{ opacity: sectionOpacity, transform: `scale(${scale})`, zIndex: 3 }}>
        <Phone src={current.src} width={pw} />
      </div>
      <div style={{ position: 'absolute', bottom: Math.round(height * 0.06), left: Math.round(width * 0.06), right: Math.round(width * 0.06), opacity: sectionOpacity, textAlign: 'center' }}>
        <p style={{ fontSize: Math.round(width * 0.044), fontFamily: F, fontWeight: W.bold, color: '#fff', margin: 0, lineHeight: 1.3 }}>{current.label}</p>
      </div>
      <div style={{ position: 'absolute', bottom: Math.round(height * 0.025), display: 'flex', gap: 8 }}>
        {screens.map((_, i) => (
          <div key={i} style={{ width: i === section ? 24 : 8, height: 8, borderRadius: 4, background: i === section ? ACCENT : 'rgba(255,255,255,0.25)' }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// OFFER CARD
// =============================================================================

export const EverReachOfferCard: React.FC = () => {
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;
  const features = [
    { icon: '🔍', title: '90-min Automation Audit', desc: 'Map every manual task bleeding your time' },
    { icon: '⚙️', title: 'Custom AI Build', desc: 'We build the automations — you just approve them' },
    { icon: '📊', title: 'ROI Report', desc: 'Hours saved per week, projected across a year' },
    { icon: '🔄', title: '30-day Support', desc: 'Tweaks and fixes included, no extra charge' },
  ];
  return (
    <AbsoluteFill style={{ background: BG_DEEP, display: 'flex', flexDirection: isPortrait ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: isPortrait ? `${Math.round(height * 0.06)}px ${Math.round(width * 0.06)}px` : `0 ${Math.round(width * 0.06)}px` }}>
      <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: width * 1.2, height: height * 0.6, background: `radial-gradient(ellipse, ${ACCENT}12 0%, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round((isPortrait ? height : width) * 0.028), width: '100%', maxWidth: isPortrait ? '100%' : Math.round(width * 0.55), zIndex: 2 }}>
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '6px 18px', borderRadius: 100, background: `${ACCENT}20`, border: `1px solid ${ACCENT}55`, color: ACCENT, fontSize: Math.round(width * 0.025), fontFamily: F, fontWeight: W.bold, letterSpacing: 1.5 }}>OFFER</div>
        <div>
          <h1 style={{ fontSize: Math.round(width * (isPortrait ? 0.092 : 0.056)), fontFamily: F, fontWeight: W.black, color: '#fff', lineHeight: 1.08, margin: '0 0 12px', letterSpacing: -1.5, whiteSpace: 'pre-line' }}>{'AI Automation\nAudit + Build'}</h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: Math.round(width * (isPortrait ? 0.12 : 0.072)), fontFamily: F, fontWeight: W.black, color: '#fff' }}>$2,500</span>
            <span style={{ fontSize: Math.round(width * 0.028), fontFamily: FB, color: 'rgba(255,255,255,0.38)' }}>one-time · saves 10+ hrs/week</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {features.map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${ACCENT}18`, border: `1.5px solid ${ACCENT}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
              </div>
              <div>
                <p style={{ fontSize: Math.round(width * 0.032), fontFamily: F, fontWeight: W.bold, color: '#fff', margin: '0 0 2px' }}>{f.title}</p>
                <p style={{ fontSize: Math.round(width * 0.026), fontFamily: FB, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          <div style={{ padding: `${Math.round(height * 0.018)}px 0`, borderRadius: 16, background: '#fff', color: '#000', fontSize: Math.round(width * 0.040), fontFamily: F, fontWeight: W.bold, textAlign: 'center', letterSpacing: -0.3 }}>Book Your Audit</div>
          <p style={{ fontSize: Math.round(width * 0.024), color: 'rgba(255,255,255,0.28)', fontFamily: FB, margin: 0, textAlign: 'center' }}>DM "audit" or visit everreach.app/audit</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
