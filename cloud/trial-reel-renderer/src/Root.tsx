import React from 'react';
import { Composition } from 'remotion';
import {
  TrialReelVariant,
  type TrialReelVariantProps,
} from './TrialReelVariant';

const defaults: TrialReelVariantProps = {
  videoUrl: 'https://example.com/source.mp4',
  durationSec: 3,
  onScreenText: 'TRIAL REEL',
  onScreenSubtext: 'Controlled creative variation',
  accentColor: '#38EF7D',
  visualFilter: 'none',
  overlayColor: '#000000',
  overlayOpacity: 0,
  brandId: 'the_isaiah_dupree',
};

export const TrialReelRoot: React.FC = () => (
  <Composition<any, TrialReelVariantProps>
    id="TrialReelVariant"
    component={TrialReelVariant}
    durationInFrames={90}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={defaults}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.max(1, Math.round(Number(props.durationSec) * 30)),
    })}
  />
);
