import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {RangeOpsOnboarding} from './RangeOpsOnboarding';
import {validateProps} from './contract';
const Root = () => <Composition id="RangeOpsOnboarding" component={RangeOpsOnboarding}
  width={1080} height={1920} fps={30} durationInFrames={2700}
  calculateMetadata={({props}) => {
    validateProps(props);
    return {durationInFrames: Math.ceil(props.duration * 30)};
  }}/>;
registerRoot(Root);
