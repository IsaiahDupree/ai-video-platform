import React from 'react';
import { Composition } from 'remotion';
import { BlueprintExplainer, MachineMetaphor, silentReelDefaultProps, silentReelDurationInFrames, type SilentReelProps } from './silent';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition<any, SilentReelProps>
      id="BlueprintExplainer"
      component={BlueprintExplainer}
      durationInFrames={silentReelDurationInFrames(silentReelDefaultProps)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={silentReelDefaultProps}
      calculateMetadata={({ props }) => ({ fps: props.fps ?? 30, durationInFrames: silentReelDurationInFrames(props) })}
    />
    <Composition<any, SilentReelProps>
      id="MachineMetaphor"
      component={MachineMetaphor}
      durationInFrames={silentReelDurationInFrames(silentReelDefaultProps)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ ...silentReelDefaultProps, style: 'machine' }}
      calculateMetadata={({ props }) => ({ fps: props.fps ?? 30, durationInFrames: silentReelDurationInFrames(props) })}
    />
  </>
);
