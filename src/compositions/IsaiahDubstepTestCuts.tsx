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

type StorySection = 'move' | 'make' | 'hero' | 'release';
type Variant = 'maker-first' | 'movement-first' | 'energy-first';

type PlanBlock = {
  section: StorySection;
  clips: number[];
  duration: number;
};

type Cut = {
  clip: number;
  from: number;
  duration: number;
  section: StorySection;
  sectionBreak: boolean;
  direction: -1 | 1;
};

const PLANS: Record<Variant, PlanBlock[]> = {
  'maker-first': [
    {section: 'make', clips: [2, 15, 8, 13, 4, 16], duration: 26},
    {section: 'move', clips: [0, 14, 17, 1, 7, 0], duration: 20},
    {section: 'hero', clips: [9, 3, 14, 17, 7, 3], duration: 18},
    {section: 'release', clips: [5, 12, 11, 6, 12, 5, 11, 6], duration: 18},
    {section: 'make', clips: [15], duration: 24},
    {section: 'move', clips: [7], duration: 24},
    {section: 'hero', clips: [3], duration: 24},
  ],
  'movement-first': [
    {section: 'move', clips: [0, 14, 17, 1, 7, 0], duration: 26},
    {section: 'move', clips: [17, 1, 7, 14], duration: 18},
    {section: 'make', clips: [2, 15, 8, 13, 10, 4, 16, 9], duration: 18},
    {section: 'release', clips: [5, 12, 11, 6, 12, 5, 11, 6], duration: 18},
    {section: 'make', clips: [8], duration: 28},
    {section: 'release', clips: [5], duration: 28},
    {section: 'hero', clips: [3], duration: 28},
  ],
  'energy-first': [
    {section: 'release', clips: [5, 12, 11, 6, 12, 5], duration: 26},
    {section: 'hero', clips: [3, 14, 9, 17, 7, 3], duration: 18},
    {section: 'make', clips: [2, 15, 8, 13, 10, 4, 16, 9], duration: 18},
    {section: 'move', clips: [0, 14, 17, 1, 7, 0], duration: 20},
    {section: 'release', clips: [5], duration: 24},
    {section: 'move', clips: [7], duration: 24},
    {section: 'hero', clips: [3], duration: 24},
  ],
};

const makeCuts = (variant: Variant): Cut[] => {
  let cursor = 0;
  let index = 0;
  const cuts: Cut[] = [];
  for (const block of PLANS[variant]) {
    block.clips.forEach((clip, blockIndex) => {
      cuts.push({
        clip,
        from: cursor,
        duration: block.duration,
        section: block.section,
        sectionBreak: blockIndex === 0,
        direction: index % 2 === 0 ? -1 : 1,
      });
      cursor += block.duration;
      index += 1;
    });
  }
  if (cursor !== 600) {
    throw new Error(`${variant} cut plan must total 600 frames; got ${cursor}`);
  }
  return cuts;
};

const gradeFor = (section: StorySection) => {
  if (section === 'move') return 'contrast(1.16) saturate(1.14) brightness(.96)';
  if (section === 'make') return 'contrast(1.2) saturate(1.04) brightness(.99)';
  if (section === 'hero') return 'contrast(1.15) saturate(1.12) brightness(1.02)';
  return 'contrast(1.22) saturate(1.4) brightness(.96)';
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: 0.1,
        mixBlendMode: 'overlay',
        transform: `translate(${(frame * 13) % 7 - 3}px, ${(frame * 19) % 9 - 4}px)`,
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(255,255,255,.075) 0px, rgba(255,255,255,.075) 1px, transparent 1px, transparent 4px)',
      }}
    />
  );
};

const CutLayer: React.FC<{cut: Cut; variant: Variant; index: number}> = ({cut, variant, index}) => {
  const frame = useCurrentFrame();
  const local = frame - cut.from;
  const kineticScale = variant === 'movement-first' ? 1.025 : variant === 'energy-first' ? 1.018 : 1;
  const zoom = interpolate(local, [0, cut.duration], [1.018, 1.082], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const impact = interpolate(local, [0, 2, 6], [cut.sectionBreak ? 1.12 : 1.07, 1.025, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = interpolate(local, [0, cut.duration], [cut.direction * -7, cut.direction * 7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flashStrength = cut.sectionBreak ? 0.68 : index % 2 === 0 ? 0.34 : 0.12;
  const flash = interpolate(local, [0, 1, cut.sectionBreak ? 6 : 4], [flashStrength, 0.1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const src = staticFile(`${ASSET_ROOT}/clip${String(cut.clip).padStart(2, '0')}.mp4`);
  const transform = `translateX(${drift}px) scale(${zoom * impact * kineticScale}) rotate(${cut.direction * 0.12}deg)`;

  return (
    <Sequence from={cut.from} durationInFrames={cut.duration} premountFor={FPS}>
      <AbsoluteFill style={{backgroundColor: '#020207', overflow: 'hidden'}}>
        <OffthreadVideo
          src={src}
          muted
          playbackRate={cut.section === 'move' ? 1.06 : cut.section === 'release' ? 1.04 : 1}
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
              'linear-gradient(180deg, rgba(0,0,0,.12), transparent 25%, transparent 72%, rgba(0,0,0,.42)), radial-gradient(circle at center, transparent 50%, rgba(0,0,0,.42) 100%)',
          }}
        />
        <AbsoluteFill style={{backgroundColor: '#fff', opacity: flash}} />
      </AbsoluteFill>
    </Sequence>
  );
};

const TestCut: React.FC<{variant: Variant}> = ({variant}) => {
  const cuts = makeCuts(variant);
  return (
    <AbsoluteFill style={{backgroundColor: '#020207'}}>
      <Audio src={staticFile(`${ASSET_ROOT}/music.m4a`)} volume={0.8} />
      {cuts.map((cut, index) => (
        <CutLayer key={`${cut.from}-${cut.clip}`} cut={cut} variant={variant} index={index} />
      ))}
      <Grain />
    </AbsoluteFill>
  );
};

export const IsaiahDubstepMakerFirst: React.FC = () => <TestCut variant="maker-first" />;
export const IsaiahDubstepMovementFirst: React.FC = () => <TestCut variant="movement-first" />;
export const IsaiahDubstepEnergyFirst: React.FC = () => <TestCut variant="energy-first" />;

export const ISAIAH_DUBSTEP_TEST_FRAMES = 20 * FPS;
