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

type Cut = {
  clip: number;
  from: number;
  duration: number;
  speed: number;
  hit: boolean;
  section: StorySection;
  sectionBreak: boolean;
  direction: -1 | 1;
};

const cuts: Cut[] = [];
let cursor = 0;

const addCut = (
  clip: number,
  duration: number,
  section: StorySection,
  options: {speed?: number; hit?: boolean; sectionBreak?: boolean} = {},
) => {
  cuts.push({
    clip,
    from: cursor,
    duration,
    speed: options.speed ?? 1,
    hit: options.hit ?? false,
    section,
    sectionBreak: options.sectionBreak ?? false,
    direction: cuts.length % 2 === 0 ? -1 : 1,
  });
  cursor += duration;
};

// MOVE — establish place, board, rider, and forward motion before changing worlds.
[0, 1, 17, 7, 2, 9].forEach((clip, index) =>
  addCut(clip, 26, 'move', {
    speed: index === 0 ? 0.78 : index === 3 ? 1.12 : 0.94,
    hit: index > 0,
    sectionBreak: index === 0,
  }),
);

// MAKE — stay inside one cause-and-effect sequence: code, input, prototype, result.
[2, 15, 8, 13, 10, 4, 16, 9].forEach((clip, index) =>
  addCut(clip, 16, 'make', {
    speed: index === 1 || index === 5 ? 1.18 : 1.04,
    hit: index % 2 === 0,
    sectionBreak: index === 0,
  }),
);

// HERO — reveal the person behind the work, then carry his motion toward the venue.
[9, 3, 14, 17, 7, 5].forEach((clip, index) =>
  addCut(clip, 17, 'hero', {
    speed: index === 4 ? 1.16 : 0.98,
    hit: index % 2 === 0,
    sectionBreak: index === 0,
  }),
);

// RELEASE — the festival is now the payoff, not a random interruption.
[5, 12, 11, 6, 12, 5].forEach((clip, index) =>
  addCut(clip, 17, 'release', {
    speed: 1.04,
    hit: index % 2 === 0,
    sectionBreak: index === 0,
  }),
);

// Final four-shot recap: motion, work, reward, identity.
[7, 15, 5, 3].forEach((clip, index) =>
  addCut(clip, 28, index === 2 ? 'release' : index === 3 ? 'hero' : index === 1 ? 'make' : 'move', {
    speed: index === 3 ? 0.76 : 0.98,
    hit: true,
    sectionBreak: false,
  }),
);

const gradeFor = (section: StorySection) => {
  if (section === 'move') return 'contrast(1.16) saturate(1.12) brightness(.95)';
  if (section === 'make') return 'contrast(1.2) saturate(1.02) brightness(.98)';
  if (section === 'hero') return 'contrast(1.15) saturate(1.1) brightness(1.02)';
  return 'contrast(1.22) saturate(1.38) brightness(.96)';
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

const CutLayer: React.FC<{cut: Cut}> = ({cut}) => {
  const frame = useCurrentFrame();
  const local = frame - cut.from;
  const baseZoom = interpolate(local, [0, cut.duration], [1.018, 1.085], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const impactZoom = cut.hit
    ? interpolate(local, [0, 2, 6], [1.105, 1.035, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;
  const drift = interpolate(local, [0, cut.duration], [cut.direction * -7, cut.direction * 7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flash = interpolate(
    local,
    [0, 1, cut.sectionBreak ? 6 : 4],
    [cut.sectionBreak ? 0.78 : cut.hit ? 0.5 : 0.16, 0.12, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const src = staticFile(`${ASSET_ROOT}/clip${String(cut.clip).padStart(2, '0')}.mp4`);
  const transform = `translateX(${drift}px) scale(${baseZoom * impactZoom}) rotate(${cut.direction * 0.12}deg)`;

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
            filter: gradeFor(cut.section),
          }}
        />

        {cut.sectionBreak && local < 4 ? (
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
              opacity: 0.2,
              mixBlendMode: 'screen',
              transform: `translateX(${cut.direction * 10}px) scale(${baseZoom * impactZoom})`,
              filter: cut.section === 'release' ? 'saturate(3) hue-rotate(300deg)' : 'saturate(2) hue-rotate(150deg)',
            }}
          />
        ) : null}

        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,.13), transparent 25%, transparent 72%, rgba(0,0,0,.42)), radial-gradient(circle at center, transparent 50%, rgba(0,0,0,.42) 100%)',
          }}
        />
        <AbsoluteFill style={{backgroundColor: '#fff', opacity: flash}} />
      </AbsoluteFill>
    </Sequence>
  );
};

export const IsaiahDubstepMontageV3: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#020207'}}>
    <Audio src={staticFile(`${ASSET_ROOT}/music.m4a`)} volume={0.8} />
    {cuts.map((cut) => (
      <CutLayer key={`${cut.from}-${cut.clip}`} cut={cut} />
    ))}
    <Grain />
  </AbsoluteFill>
);

export const ISAIAH_DUBSTEP_MONTAGE_V3_FRAMES = 20 * FPS;
