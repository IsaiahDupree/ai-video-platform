import React from 'react';
import { Composition } from 'remotion';
import { PrintPackLaunch } from './PrintPackLaunch';
import defaults from './props.json';
import { printPackDurationInFrames, type PrintPackProps } from './types';

const defaultProps = defaults as PrintPackProps;

export const RemotionRoot: React.FC = () => (
  <Composition<any, PrintPackProps>
    id="PrintPackLaunch"
    component={PrintPackLaunch}
    durationInFrames={printPackDurationInFrames(defaultProps)}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={defaultProps}
    calculateMetadata={({ props }) => ({ fps: props.fps ?? 30, durationInFrames: printPackDurationInFrames(props) })}
  />
);
