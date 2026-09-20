import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type MemeVaultUGCProps = {
  cut: 'full' | 'cutdown';
};

const BLUE = '#0A84FF';
const INK = '#111827';
const LIME = '#C8FF39';

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const appear = (frame: number, at: number, fps: number) => {
  const value = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 180 } });
  return { opacity: value, transform: `translateY(${(1 - value) * 24}px) scale(${0.96 + value * 0.04})` };
};

const Bubble: React.FC<{
  side: 'left' | 'right';
  children: React.ReactNode;
  at: number;
}> = ({ side, children, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', justifyContent: side === 'right' ? 'flex-end' : 'flex-start', ...appear(frame, at, fps) }}>
      <div
        style={{
          maxWidth: 720,
          padding: '20px 26px',
          borderRadius: side === 'right' ? '30px 30px 8px 30px' : '30px 30px 30px 8px',
          background: side === 'right' ? BLUE : '#E9E9EB',
          color: side === 'right' ? '#fff' : '#111',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif',
          fontSize: 40,
          lineHeight: 1.18,
          letterSpacing: -0.7,
          boxShadow: '0 8px 20px rgba(15,23,42,.08)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Typing: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const visible = frame >= at && frame < at + 42;
  if (!visible) return null;
  return (
    <div style={{ display: 'flex', ...appear(frame, at, fps) }}>
      <div style={{ display: 'flex', gap: 9, background: '#E9E9EB', borderRadius: '28px 28px 28px 8px', padding: '22px 28px' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 13, height: 13, borderRadius: 20, background: '#8E8E93', opacity: interpolate((frame - at - i * 5) % 28, [0, 14, 28], [.35, 1, .35], clamp) }} />
        ))}
      </div>
    </div>
  );
};

const MemeCard: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', ...appear(frame, at, fps) }}>
      <div style={{ width: 650, borderRadius: 28, overflow: 'hidden', background: '#fff', boxShadow: '0 18px 50px rgba(15,23,42,.18)', border: '1px solid rgba(15,23,42,.08)' }}>
        <div style={{ height: 280, background: 'linear-gradient(145deg,#151728,#35255a 58%,#7645e7)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: .22, backgroundImage: 'radial-gradient(circle at 20% 20%, #fff 0 2px, transparent 3px)', backgroundSize: '38px 38px' }} />
          <div style={{ position: 'absolute', left: 34, right: 34, top: 33, fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: 49, lineHeight: .96, color: '#fff', textTransform: 'uppercase', textShadow: '0 5px 0 rgba(0,0,0,.25)' }}>
            WHEN PROD BREAKS
            <br />
            AT 4:59 PM
          </div>
          <div style={{ position: 'absolute', right: 28, bottom: 16, fontSize: 88, transform: 'rotate(-8deg)' }}>🫠</div>
        </div>
        <div style={{ padding: '18px 22px 21px', fontFamily: '-apple-system, BlinkMacSystemFont, Arial, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: INK, display: 'grid', placeItems: 'center', color: LIME, fontSize: 21, fontWeight: 900 }}>M</div>
            <div>
              <div style={{ color: INK, fontWeight: 800, fontSize: 23 }}>Meme Vault</div>
              <div style={{ color: '#6B7280', fontSize: 19 }}>Saved original link</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VaultOverlay: React.FC<{ start: number; end: number }> = ({ start, end }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < start || frame > end) return null;
  const inValue = spring({ frame: frame - start, fps, config: { damping: 20, stiffness: 150 } });
  const out = interpolate(frame, [end - 12, end], [1, 0], clamp);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 12, display: 'grid', placeItems: 'center', background: `rgba(8,12,22,${.22 * inValue * out})` }}>
      <div style={{ width: 670, height: 1220, borderRadius: 68, overflow: 'hidden', border: '12px solid #111827', background: '#111827', boxShadow: '0 40px 100px rgba(0,0,0,.45)', transform: `translateY(${(1 - inValue) * 90}px) scale(${.88 + inValue * .12})`, opacity: inValue * out }}>
        <Img src={staticFile('meme-vault-ugc/images/vault-screen.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        <div style={{ position: 'absolute', left: '50%', top: 250, width: 570, transform: 'translateX(-50%)', background: '#fff', border: `5px solid ${LIME}`, borderRadius: 22, padding: '16px 20px', boxShadow: '0 14px 40px rgba(0,0,0,.23)', fontFamily: '-apple-system, BlinkMacSystemFont, Arial, sans-serif', fontSize: 27, fontWeight: 800, color: INK }}>
          🔎 friday deploy
        </div>
      </div>
    </div>
  );
};

type Caption = { start: number; end: number; text: string; accent?: string };

const fullCaptions: Caption[] = [
  { start: 0, end: 91, text: 'A FRIEND ASKED FOR A MEME', accent: 'THREE MONTHS AGO' },
  { start: 91, end: 195, text: 'I WAS STUCK SCROLLING', accent: 'THROUGH SCREENSHOTS' },
  { start: 195, end: 295, text: 'BUT NOW I SAVE THEM', accent: 'IN MEME VAULT' },
  { start: 295, end: 430, text: 'ORIGINAL LINK. SEARCHABLE.', accent: 'ORGANIZED INTO LISTS.' },
  { start: 430, end: 585, text: 'THE GROUP CHAT NEEDS IT?', accent: 'SEARCH. ADD. SEND.' },
  { start: 585, end: 720, text: 'NO MORE CAMERA-ROLL CHAOS.', accent: 'SAVE THE NEXT ONE.' },
  { start: 720, end: 840, text: 'YOUR MEMES.', accent: 'ACTUALLY ORGANIZED.' },
];

const cutCaptions: Caption[] = [
  { start: 0, end: 92, text: 'A THREE-MONTH-OLD MEME?', accent: 'I WAS STUCK.' },
  { start: 92, end: 212, text: 'MEME VAULT FOUND IT.', accent: 'ORIGINAL LINK INCLUDED.' },
  { start: 212, end: 308, text: 'ADD TO THE GROUP LIST.', accent: 'SEND IT BACK.' },
  { start: 308, end: 390, text: 'TRY IT WITH', accent: 'YOUR NEXT SAVE.' },
];

const CaptionLayer: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const active = captions.find((caption) => frame >= caption.start && frame < caption.end);
  if (!active) return null;
  const local = frame - active.start;
  const opacity = interpolate(local, [0, 6], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', zIndex: 30, left: 42, right: 42, bottom: 58, textAlign: 'center', opacity, fontFamily: 'Arial Black, -apple-system, Arial, sans-serif', fontSize: 48, fontWeight: 950, lineHeight: 1.02, letterSpacing: -1.1, color: '#fff', textShadow: '0 3px 3px #000, 0 0 12px rgba(0,0,0,.8)' }}>
      {active.text}
      <br />
      <span style={{ color: LIME }}>{active.accent}</span>
    </div>
  );
};

const PhoneHeader: React.FC = () => (
  <>
    <div style={{ height: 72, padding: '18px 34px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: '-apple-system, BlinkMacSystemFont, Arial, sans-serif', fontSize: 25, fontWeight: 700, color: '#111' }}>
      <span>9:41</span><span style={{ letterSpacing: 5 }}>● ◒ ▰</span>
    </div>
    <div style={{ height: 190, display: 'grid', placeItems: 'center', borderBottom: '1px solid #D8D8DC', background: 'rgba(250,250,252,.94)' }}>
      <div style={{ textAlign: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, Arial, sans-serif' }}>
        <div style={{ width: 84, height: 84, margin: '0 auto 9px', borderRadius: 50, background: 'linear-gradient(135deg,#FFB347,#FF5F6D)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: 38, boxShadow: '0 5px 18px rgba(255,95,109,.28)' }}>M</div>
        <div style={{ color: '#111', fontSize: 29, fontWeight: 650 }}>Maya  ›</div>
      </div>
    </div>
  </>
);

export const MemeVaultUGC: React.FC<MemeVaultUGCProps> = ({ cut }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const isCut = cut === 'cutdown';
  const times = isCut
    ? { ask: 14, typing: 76, overlayStart: 92, overlayEnd: 206, card: 206, reaction: 260, add: 286, receipt: 324 }
    : { ask: 18, typing: 122, overlayStart: 196, overlayEnd: 375, card: 380, reaction: 480, add: 548, receipt: 626 };
  const chatFade = times.overlayStart <= frame && frame <= times.overlayEnd ? .2 : 1;
  const endCard = frame >= durationInFrames - 105;
  const endOpacity = interpolate(frame, [durationInFrames - 105, durationInFrames - 88], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: '#10131D' }}>
      <Audio src={staticFile(isCut ? 'meme-vault-ugc/audio/cutdown.m4a' : 'meme-vault-ugc/audio/full.m4a')} volume={1} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 10%,rgba(200,255,57,.13),transparent 35%),radial-gradient(circle at 85% 80%,rgba(10,132,255,.18),transparent 38%)' }} />
      <div style={{ position: 'absolute', left: 56, right: 56, top: 50, bottom: 185, borderRadius: 68, overflow: 'hidden', background: '#fff', boxShadow: '0 40px 120px rgba(0,0,0,.42)', border: '4px solid rgba(255,255,255,.3)' }}>
        <PhoneHeader />
        <div style={{ padding: '34px 32px', display: 'flex', flexDirection: 'column', gap: 22, opacity: chatFade, transition: 'opacity .1s linear' }}>
          <Bubble side="left" at={times.ask}>please tell me you still have that Friday deploy meme 😭</Bubble>
          <Typing at={times.typing} />
          {frame >= times.card && <MemeCard at={times.card} />}
          {frame >= times.reaction && <Bubble side="left" at={times.reaction}>HOW did you find that so fast</Bubble>}
          {frame >= times.add && <Bubble side="right" at={times.add}>Meme Vault. Saved it months ago.</Bubble>}
          {frame >= times.receipt && (
            <div style={{ ...appear(frame, times.receipt, 30), textAlign: 'center', color: '#6B7280', fontFamily: '-apple-system, BlinkMacSystemFont, Arial, sans-serif', fontSize: 24, fontWeight: 700 }}>
              ✓ Added to “Dev Friends”
            </div>
          )}
        </div>
        <VaultOverlay start={times.overlayStart} end={times.overlayEnd} />
      </div>
      <CaptionLayer captions={isCut ? cutCaptions : fullCaptions} />
      <div style={{ position: 'absolute', top: 12, left: 0, right: 0, textAlign: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, Arial, sans-serif', fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,.75)', letterSpacing: 2.5 }}>MEME VAULT · CONCEPT DEMO</div>
      {endCard && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 24, display: 'grid', placeItems: 'center', background: '#111827', opacity: endOpacity }}>
          <div style={{ textAlign: 'center', transform: `scale(${.94 + .06 * endOpacity})`, fontFamily: '-apple-system, BlinkMacSystemFont, Arial, sans-serif' }}>
            <div style={{ width: 160, height: 160, margin: '0 auto 34px', borderRadius: 45, display: 'grid', placeItems: 'center', background: LIME, color: INK, fontSize: 84, fontWeight: 950, boxShadow: '0 20px 60px rgba(200,255,57,.28)' }}>M</div>
            <div style={{ color: '#fff', fontSize: 80, fontWeight: 950, letterSpacing: -4 }}>Meme Vault</div>
            <div style={{ marginTop: 14, color: LIME, fontSize: 38, fontWeight: 800 }}>Save it. Find it. Send it.</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const MEME_VAULT_FULL_FRAMES = 840;
export const MEME_VAULT_CUTDOWN_FRAMES = 390;
