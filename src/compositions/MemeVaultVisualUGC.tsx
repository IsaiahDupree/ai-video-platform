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

export const MEME_VAULT_VISUAL_UGC_FRAMES = 1170;

const LIME = '#C8FF39';
const INK = '#0B0B10';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const Caption: React.FC<{start: number; end: number; children: React.ReactNode; accent?: string}> = ({
  start,
  end,
  children,
  accent,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start || frame >= end) return null;
  const entered = spring({frame: frame - start, fps, config: {damping: 18, stiffness: 190}});
  const exiting = interpolate(frame, [end - 8, end], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: 42,
        right: 42,
        bottom: 72,
        zIndex: 20,
        opacity: entered * exiting,
        transform: `translateY(${(1 - entered) * 32}px)`,
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'Arial Black, -apple-system, sans-serif',
        fontWeight: 950,
        fontSize: 55,
        lineHeight: 1.02,
        letterSpacing: -1.8,
        textShadow: '0 4px 5px #000, 0 0 18px rgba(0,0,0,.9)',
      }}
    >
      {children}
      {accent ? <><br/><span style={{color: LIME}}>{accent}</span></> : null}
    </div>
  );
};

export const MemeVaultVisualUGC: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const phoneIn = spring({frame: frame - 18, fps, config: {damping: 20, stiffness: 120}});
  const scroll = interpolate(frame, [390, 900], [0, -480], clamp);
  const zoom = interpolate(frame, [0, 1170], [1, 1.055], clamp);
  const detail = frame >= 540;

  return (
    <AbsoluteFill style={{background: INK, overflow: 'hidden'}}>
      <Audio src={staticFile('meme-vault-visual-ugc/voiceover.m4a')} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 12% 10%,rgba(200,255,57,.22),transparent 34%),radial-gradient(circle at 86% 78%,rgba(64,105,255,.28),transparent 40%)'}} />

      <div style={{position: 'absolute', top: 34, left: 0, right: 0, textAlign: 'center', color: LIME, fontFamily: '-apple-system, sans-serif', fontSize: 23, fontWeight: 900, letterSpacing: 4}}>
        MEME VAULT · COMING SOON PREVIEW
      </div>

      <div
        style={{
          position: 'absolute',
          left: 170,
          top: 105,
          width: 740,
          height: 1600,
          borderRadius: 72,
          overflow: 'hidden',
          background: '#111',
          border: '12px solid #25252D',
          boxShadow: '0 45px 120px rgba(0,0,0,.62)',
          opacity: phoneIn,
          transform: `translateY(${(1 - phoneIn) * 90}px) scale(${(.92 + phoneIn * .08) * zoom})`,
        }}
      >
        <Img
          src={staticFile(detail ? 'meme-vault-visual-ugc/visual-detail.png' : 'meme-vault-visual-ugc/visual-vault.png')}
          style={{width: '100%', transform: `translateY(${detail ? 0 : scroll}px)`, objectFit: 'cover', objectPosition: 'top'}}
        />
      </div>

      {frame >= 560 && frame < 900 ? (
        <div style={{position: 'absolute', zIndex: 12, top: 250, left: 85, right: 85, display: 'flex', justifyContent: 'space-between'}}>
          {['THUMBNAILS', 'SCREENSHOTS', 'GROUP LISTS'].map((label, index) => {
            const value = spring({frame: frame - 560 - index * 18, fps, config: {damping: 15, stiffness: 210}});
            return <div key={label} style={{opacity: value, transform: `scale(${.8 + value * .2})`, padding: '14px 18px', borderRadius: 18, background: LIME, color: INK, fontFamily: 'Arial Black, sans-serif', fontSize: 21, fontWeight: 950, boxShadow: '0 12px 30px rgba(0,0,0,.35)'}}>{label}</div>;
          })}
        </div>
      ) : null}

      <Caption start={0} end={120} accent="THEN LOSE IT?">EVER SAVE A MEME...</Caption>
      <Caption start={120} end={270} accent="WALL OF LINKS">THE JOKE DISAPPEARS IN A</Caption>
      <Caption start={270} end={420} accent="ALREADY SAVES YOUR LINKS">MEME VAULT</Caption>
      <Caption start={420} end={540} accent="HARD TO SCAN">BUT LINKS ALONE ARE</Caption>
      <Caption start={540} end={900} accent="SPOT · SEARCH · ADD TO LISTS">VISUAL THUMBNAILS</Caption>
      <Caption start={900} end={1050} accent="NOT LIVE YET">COMING-SOON PREVIEW</Caption>
      <Caption start={1050} end={1170} accent="WATCH IT ROLL OUT">FOLLOW MEME VAULT</Caption>
    </AbsoluteFill>
  );
};
