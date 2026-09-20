import React from 'react';
import { Composition } from 'remotion';
import {
  MemeVaultUGC,
  MEME_VAULT_CUTDOWN_FRAMES,
  MEME_VAULT_FULL_FRAMES,
} from '../../src/compositions/MemeVaultUGC';

export const MemeVaultCampaignRoot: React.FC = () => (
  <>
    <Composition
      id="MemeVaultTextingUGC"
      component={MemeVaultUGC}
      durationInFrames={MEME_VAULT_FULL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ cut: 'full' as const }}
    />
    <Composition
      id="MemeVaultTextingUGCCutdown"
      component={MemeVaultUGC}
      durationInFrames={MEME_VAULT_CUTDOWN_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ cut: 'cutdown' as const }}
    />
  </>
);
