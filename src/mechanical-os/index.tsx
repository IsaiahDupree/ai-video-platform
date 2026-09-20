import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {MechanicalOSCampaign} from './MechanicalOSCampaign';

const MechanicalOSRoot: React.FC = () => (
  <>
    <Composition<any, {variant: 'hero'}>
      id="MechanicalOSHeroVertical"
      component={MechanicalOSCampaign}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{variant: 'hero' as const}}
    />
    <Composition<any, {variant: 'proof'}>
      id="MechanicalOSProofVertical"
      component={MechanicalOSCampaign}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{variant: 'proof' as const}}
    />
    <Composition<any, {variant: 'explainer'}>
      id="MechanicalOSExplainerLandscape"
      component={MechanicalOSCampaign}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{variant: 'explainer' as const}}
    />
  </>
);

registerRoot(MechanicalOSRoot);
