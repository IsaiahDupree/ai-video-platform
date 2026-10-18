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
const ASSET_ROOT = 'isaiah-dubstep-movement-fresh-2026-09-19';

type StorySection = 'departure' | 'build' | 'presence' | 'release';

type Cut = {
  clip: number;
  from: number;
  duration: number;
  section: StorySection;
  sectionBreak?: boolean;
  direction: -1 | 1;
};

const CUTS: Cut[] = [
  {clip: 0, from: 0, duration: 32, section: 'departure', sectionBreak: true, direction: 1},
  {clip: 1, from: 32, duration: 30, section: 'departure', direction: -1},
  {clip: 2, from: 62, duration: 28, section: 'departure', direction: 1},
  {clip: 3, from: 90, duration: 32, section: 'departure', direction: -1},
  {clip: 4, from: 122, duration: 24, section: 'departure', direction: 1},
  {clip: 5, from: 146, duration: 22, section: 'departure', direction: -1},
  {clip: 6, from: 168, duration: 28, section: 'departure', direction: 1},
  {clip: 7, from: 196, duration: 28, section: 'departure', direction: -1},

  {clip: 8, from: 224, duration: 24, section: 'build', sectionBreak: true, direction: 1},
  {clip: 9, from: 248, duration: 28, section: 'build', direction: -1},
  {clip: 10, from: 276, duration: 28, section: 'build', direction: 1},
  {clip: 11, from: 304, duration: 30, section: 'build', direction: -1},

  {clip: 12, from: 334, duration: 30, section: 'presence', sectionBreak: true, direction: 1},
  {clip: 13, from: 364, duration: 32, section: 'presence', direction: -1},
  {clip: 11, from: 396, duration: 28, section: 'presence', direction: 1},

  {clip: 14, from: 424, duration: 24, section: 'release', sectionBreak: true, direction: -1},
  {clip: 15, from: 448, duration: 24, section: 'release', direction: 1},
  {clip: 16, from: 472, duration: 24, section: 'release', direction: -1},
  {clip: 14, from: 496, duration: 20, section: 'release', direction: 1},
  {clip: 15, from: 516, duration: 20, section: 'release', direction: -1},
  {clip: 16, from: 536, duration: 20, section: 'release', direction: 1},

  {clip: 13, from: 556, duration: 44, section: 'presence', sectionBreak: true, direction: -1},
];

const gradeFor = (section: StorySection) => {
  if (section === 'departure') return 'contrast(1.15) saturate(1.12) brightness(.98)';
  if (section === 'build') return 'contrast(1.2) saturate(1.04) brightness(.99)';
  if (section === 'presence') return 'contrast(1.14) saturate(1.1) brightness(1.02)';
  return 'contrast(1.22) saturate(1.42) brightness(.95)';
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: 0.09,
        mixBlendMode: 'overlay',
        transform: `translate(${(frame * 13) % 7 - 3}px, ${(frame * 19) % 9 - 4}px)`,
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(255,255,255,.075) 0px, rgba(255,255,255,.075) 1px, transparent 1px, transparent 4px)',
      }}
    />
  );
};

const CutLayer: React.FC<{cut: Cut; index: number}> = ({cut, index}) => {
  const frame = useCurrentFrame();
  const local = frame - cut.from;
  const zoom = interpolate(local, [0, cut.duration], [1.025, 1.095], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const impact = interpolate(local, [0, 2, 6], [cut.sectionBreak ? 1.13 : 1.07, 1.025, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = interpolate(local, [0, cut.duration], [cut.direction * -8, cut.direction * 8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flashStrength = cut.sectionBreak ? 0.66 : index % 2 === 0 ? 0.3 : 0.1;
  const flash = interpolate(local, [0, 1, cut.sectionBreak ? 6 : 4], [flashStrength, 0.08, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const src = staticFile(`${ASSET_ROOT}/clip${String(cut.clip).padStart(2, '0')}.mp4`);
  const transform = `translateX(${drift}px) scale(${zoom * impact * 1.025}) rotate(${cut.direction * 0.1}deg)`;

  return (
    <Sequence from={cut.from} durationInFrames={cut.duration} premountFor={FPS}>
      <AbsoluteFill style={{backgroundColor: '#020207', overflow: 'hidden'}}>
        <OffthreadVideo
          src={src}
          muted
          playbackRate={cut.section === 'departure' ? 1.06 : cut.section === 'release' ? 1.04 : 1}
          style={{width: '100%', height: '100%', objectFit: 'cover', transform, filter: gradeFor(cut.section)}}
        />

        {cut.sectionBreak && local < 4 ? (
          <OffthreadVideo
            src={src}
            muted
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.2,
              mixBlendMode: 'screen',
              transform: `translateX(${cut.direction * 10}px) scale(${zoom * impact})`,
              filter: cut.section === 'release' ? 'saturate(3) hue-rotate(300deg)' : 'saturate(2) hue-rotate(150deg)',
            }}
          />
        ) : null}

        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,.1), transparent 24%, transparent 72%, rgba(0,0,0,.4)), radial-gradient(circle at center, transparent 52%, rgba(0,0,0,.4) 100%)',
          }}
        />
        <AbsoluteFill style={{backgroundColor: '#fff', opacity: flash}} />
      </AbsoluteFill>
    </Sequence>
  );
};

export const IsaiahDubstepMovementFresh: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#020207'}}>
    <Audio src={staticFile(`${ASSET_ROOT}/music.m4a`)} volume={0.8} />
    {CUTS.map((cut, index) => (
      <CutLayer key={`${cut.from}-${cut.clip}`} cut={cut} index={index} />
    ))}
    <Grain />
  </AbsoluteFill>
);

export const ISAIAH_DUBSTEP_MOVEMENT_FRESH_FRAMES = 20 * FPS;
