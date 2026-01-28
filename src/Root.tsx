/**
 * Root - Remotion entry point
 * Registers all compositions
 */

import React from 'react';
import { Composition } from 'remotion';
import { BriefComposition } from './compositions/BriefComposition';
import type { ContentBrief } from './types/brief';

// Import example brief
import exampleBrief from '../data/briefs/example-video.json';

export const RemotionRoot: React.FC = () => {
  // Calculate total duration from all sections
  const totalDuration = (exampleBrief as ContentBrief).sections.reduce(
    (acc, section) => acc + section.durationInFrames,
    0
  );

  return (
    <>
      <Composition
        id="ExampleVideo"
        component={BriefComposition}
        durationInFrames={totalDuration}
        fps={exampleBrief.settings.fps}
        width={exampleBrief.settings.width}
        height={exampleBrief.settings.height}
        defaultProps={{
          brief: exampleBrief as ContentBrief,
        }}
      />
    </>
  );
};
