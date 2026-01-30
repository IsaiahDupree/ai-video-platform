/**
 * Root - Remotion entry point
 * Registers all compositions
 */

import React from 'react';
import { Composition, Still, registerRoot } from 'remotion';
import { BriefComposition } from './compositions/BriefComposition';
import { AdTemplate } from './compositions/ads/AdTemplate';
import { AppPreviewComposition } from './compositions/appPreview';
import type { ContentBrief } from './types/brief';
import type { AdTemplate as AdTemplateType } from './types/adTemplate';
import type { AppPreviewConfig } from './types/appPreview';

// Import example brief
import exampleBrief from '../data/briefs/example-video.json';

// Import ad templates
import heroAd from '../data/ads/example-hero-ad.json';
import quoteAd from '../data/ads/example-quote-ad.json';
import minimalAd from '../data/ads/example-minimal-ad.json';
import textOnlyAd from '../data/ads/example-text-only-ad.json';

// Import app preview
import exampleAppPreview from '../data/appPreviews/example-app-preview.json';

export const RemotionRoot: React.FC = () => {
  // Calculate total duration from all sections
  const totalDuration = (exampleBrief as ContentBrief).sections.reduce(
    (acc, section) => acc + section.durationInFrames,
    0
  );

  // Calculate app preview duration
  const appPreviewDuration = (exampleAppPreview as AppPreviewConfig).scenes.reduce(
    (acc, scene) => acc + scene.durationInFrames,
    0
  );

  return (
    <>
      {/* Video Compositions */}
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

      {/* App Preview Video (APP-023) */}
      <Composition
        id="ExampleAppPreview"
        component={AppPreviewComposition as any}
        durationInFrames={appPreviewDuration}
        fps={(exampleAppPreview as AppPreviewConfig).fps || 30}
        width={(exampleAppPreview as AppPreviewConfig).dimensions?.width || 1080}
        height={(exampleAppPreview as AppPreviewConfig).dimensions?.height || 1920}
        defaultProps={{
          config: exampleAppPreview as AppPreviewConfig,
        }}
      />

      {/* Static Ad Compositions (ADS-001) */}
      <Still
        id="HeroAd"
        component={AdTemplate as any}
        width={(heroAd as AdTemplateType).dimensions.width}
        height={(heroAd as AdTemplateType).dimensions.height}
        defaultProps={{
          template: heroAd as AdTemplateType,
        }}
      />

      <Still
        id="QuoteAd"
        component={AdTemplate as any}
        width={(quoteAd as AdTemplateType).dimensions.width}
        height={(quoteAd as AdTemplateType).dimensions.height}
        defaultProps={{
          template: quoteAd as AdTemplateType,
        }}
      />

      <Still
        id="MinimalAd"
        component={AdTemplate as any}
        width={(minimalAd as AdTemplateType).dimensions.width}
        height={(minimalAd as AdTemplateType).dimensions.height}
        defaultProps={{
          template: minimalAd as AdTemplateType,
        }}
      />

      <Still
        id="TextOnlyAd"
        component={AdTemplate as any}
        width={(textOnlyAd as AdTemplateType).dimensions.width}
        height={(textOnlyAd as AdTemplateType).dimensions.height}
        defaultProps={{
          template: textOnlyAd as AdTemplateType,
        }}
      />
    </>
  );
};

// Register root for Remotion 4.0+
registerRoot(RemotionRoot);
