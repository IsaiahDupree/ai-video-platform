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
const ASSET_ROOT = 'isaiah-dubstep-mv-2026-09-19';

type Cut = {
  clip: number;
  from: number;
  duration: number;
  speed?: number;
  flash?: boolean;
};

const buildCuts = (): Cut[] => {
  const cuts: Cut[] = [];
  let cursor = 0;
  const add = (clip: number, duration: number, flash = false, speed = 1) => {
    cuts.push({clip, from: cursor, duration, flash, speed});
    cursor += duration;
  };

  // Six half-beat setup shots land the first heavy cut at frame 156.
  [15, 0, 7, 13, 2, 9].forEach((clip, index) => add(clip, 26, index > 0));

  // Drop section: roughly 140 BPM eighth-note cuts.
  [
    3, 10, 4, 11, 6, 5, 12, 8, 1, 14,
    16, 17, 18, 19, 20, 21, 2, 9, 7, 15,
  ].forEach((clip, index) => add(clip, 13, index % 2 === 0));

  // Let the strongest worlds breathe before the final hero frame.
  [5, 3, 12, 0, 10, 16, 8, 18].forEach((clip, index) => add(clip, 26, index % 2 === 1));

  add(21, 96, true, 0.55);
  return cuts;
};

const CUTS = buildCuts();

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: 0.16,
        mixBlendMode: 'overlay',
        transform: `translate(${(frame * 17) % 9 - 4}px, ${(frame * 11) % 7 - 3}px)`,
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(255,255,255,.09) 0px, rgba(255,255,255,.09) 1px, transparent 1px, transparent 4px)',
      }}
    />
  );
};

const CutLayer: React.FC<{cut: Cut; index: number}> = ({cut, index}) => {
  const frame = useCurrentFrame();
  const local = frame - cut.from;
  const scale = interpolate(local, [0, cut.duration], [1.035, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rotate = index % 2 === 0 ? -0.35 : 0.35;
  const src = staticFile(`${ASSET_ROOT}/clip${String(cut.clip).padStart(2, '0')}.mp4`);
  const flashOpacity = cut.flash
    ? interpolate(local, [0, 1, 4], [0.88, 0.28, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <Sequence from={cut.from} durationInFrames={cut.duration} premountFor={FPS}>
      <AbsoluteFill style={{backgroundColor: '#030305', overflow: 'hidden'}}>
        <OffthreadVideo
          src={src}
          muted
          playbackRate={cut.speed ?? 1}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale}) rotate(${rotate}deg)`,
            filter: `contrast(1.16) saturate(1.26) brightness(${index % 3 === 0 ? 0.92 : 1})`,
          }}
        />

        {local < 3 && (
          <>
            <OffthreadVideo
              src={src}
              muted
              playbackRate={cut.speed ?? 1}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.2,
                mixBlendMode: 'screen',
                transform: `translateX(-9px) scale(${scale})`,
                filter: 'sepia(1) saturate(9) hue-rotate(300deg)',
              }}
            />
            <OffthreadVideo
              src={src}
              muted
              playbackRate={cut.speed ?? 1}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.18,
                mixBlendMode: 'screen',
                transform: `translateX(9px) scale(${scale})`,
                filter: 'sepia(1) saturate(9) hue-rotate(135deg)',
              }}
            />
          </>
        )}

        <AbsoluteFill
          style={{
            background:
              'radial-gradient(circle at center, transparent 42%, rgba(0,0,0,.64) 100%)',
          }}
        />
        <AbsoluteFill style={{backgroundColor: 'white', opacity: flashOpacity}} />
      </AbsoluteFill>
    </Sequence>
  );
};

export const IsaiahDubstepMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const endOpacity = interpolate(frame, [650, 675, 712, 719], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#020204'}}>
      <Audio src={staticFile(`${ASSET_ROOT}/music.m4a`)} />
      {CUTS.map((cut, index) => (
        <CutLayer key={`${cut.from}-${cut.clip}`} cut={cut} index={index} />
      ))}
      <Grain />

      <div
        style={{
          position: 'absolute',
          left: 42,
          right: 42,
          bottom: 76,
          color: 'white',
          opacity: endOpacity,
          fontFamily: 'Arial Black, Helvetica, sans-serif',
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: 4,
          textTransform: 'uppercase',
          textShadow: '0 4px 22px rgba(0,0,0,.9)',
        }}
      >
        BUILT DIFFERENT.
      </div>
    </AbsoluteFill>
  );
};

export const ISAIAH_DUBSTEP_MONTAGE_FRAMES = 24 * FPS;

