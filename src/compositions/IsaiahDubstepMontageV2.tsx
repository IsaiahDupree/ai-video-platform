import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const FPS = 30;
const ASSET_ROOT = 'isaiah-dubstep-mv-v2-2026-09-19';

type Cut = {
  clip: number;
  from: number;
  duration: number;
  speed: number;
  hit: boolean;
  direction: -1 | 1;
};

const cuts: Cut[] = [];
let cursor = 0;

const addCut = (clip: number, duration: number, speed = 1, hit = false) => {
  cuts.push({
    clip,
    from: cursor,
    duration,
    speed,
    hit,
    direction: cuts.length % 2 === 0 ? -1 : 1,
  });
  cursor += duration;
};

// A restrained six-shot build lands exactly on the track's first major drop.
[0, 1, 2, 9, 3, 5].forEach((clip, index) =>
  addCut(clip, 26, index === 0 ? 0.78 : 0.94, index > 0),
);

// Hard section: fast cuts alternate Isaiah, physical motion, creation, and the crowd.
[
  6, 7, 8, 12, 3, 10, 11, 2, 17, 4, 6, 14,
  13, 5, 15, 7, 8, 12, 9, 10, 11, 16, 3, 6,
].forEach((clip, index) => addCut(clip, 11, index % 4 === 1 ? 1.3 : 1.08, index % 2 === 0));

// Six longer closing shots let the best images register instead of ending in chaos.
[7, 15, 8, 14, 5, 3].forEach((clip, index) =>
  addCut(clip, 30, index === 5 ? 0.72 : 0.96, index > 0),
);

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: 0.12,
        mixBlendMode: 'overlay',
        transform: `translate(${(frame * 13) % 7 - 3}px, ${(frame * 19) % 9 - 4}px)`,
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0px, rgba(255,255,255,.08) 1px, transparent 1px, transparent 4px)',
      }}
    />
  );
};

const CutLayer: React.FC<{cut: Cut; index: number}> = ({cut, index}) => {
  const frame = useCurrentFrame();
  const local = frame - cut.from;
  const hitPhase = Math.min(local, 6);
  const baseZoom = interpolate(local, [0, cut.duration], [1.02, 1.105], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const impactZoom = cut.hit
    ? interpolate(hitPhase, [0, 2, 6], [1.13, 1.045, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;
  const drift = interpolate(local, [0, cut.duration], [cut.direction * -9, cut.direction * 9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flash = cut.hit
    ? interpolate(local, [0, 1, 4], [0.74, 0.16, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;
  const src = staticFile(`${ASSET_ROOT}/clip${String(cut.clip).padStart(2, '0')}.mp4`);
  const transform = `translateX(${drift}px) scale(${baseZoom * impactZoom}) rotate(${cut.direction * 0.18}deg)`;

  return (
    <Sequence from={cut.from} durationInFrames={cut.duration} premountFor={FPS}>
      <AbsoluteFill style={{backgroundColor: '#020207', overflow: 'hidden'}}>
        <OffthreadVideo
          src={src}
          muted
          playbackRate={cut.speed}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform,
            filter: `contrast(1.2) saturate(1.28) brightness(${index % 5 === 0 ? 0.92 : 1.01})`,
          }}
        />

        {cut.hit && local < 3 ? (
          <OffthreadVideo
            src={src}
            muted
            playbackRate={cut.speed}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.24,
              mixBlendMode: 'screen',
              transform: `translateX(${cut.direction * 12}px) scale(${baseZoom * impactZoom})`,
              filter: `saturate(3) hue-rotate(${cut.direction > 0 ? 145 : 300}deg)`,
            }}
          />
        ) : null}

        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,.16), transparent 24%, transparent 70%, rgba(0,0,0,.46)), radial-gradient(circle at center, transparent 48%, rgba(0,0,0,.46) 100%)',
          }}
        />
        <AbsoluteFill style={{backgroundColor: '#fff', opacity: flash}} />
      </AbsoluteFill>
    </Sequence>
  );
};

export const IsaiahDubstepMontageV2: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#020207'}}>
    <Audio src={staticFile(`${ASSET_ROOT}/music.m4a`)} volume={0.8} />
    {cuts.map((cut, index) => (
      <CutLayer key={`${cut.from}-${cut.clip}`} cut={cut} index={index} />
    ))}
    <Grain />
  </AbsoluteFill>
);

export const ISAIAH_DUBSTEP_MONTAGE_V2_FRAMES = 20 * FPS;
