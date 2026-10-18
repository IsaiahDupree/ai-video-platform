import React from 'react';
import { SilentScene } from './SilentScene';
import type { SilentReelProps } from './types';
export { silentReelDefaultProps, silentReelDurationInFrames } from './types';
export type { SilentReelProps } from './types';

/** deekeej-style: dark blueprint grid, before/after states, payoff word */
export const BlueprintExplainer: React.FC<SilentReelProps> = (p) => <SilentScene {...p} style="blueprint" />;
/** krishna-style: neon machine metaphor, monospace, persistent scene with state readouts */
export const MachineMetaphor: React.FC<SilentReelProps> = (p) => <SilentScene {...p} style="machine" />;
