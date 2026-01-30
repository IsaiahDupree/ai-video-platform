/**
 * EverReach Template Dispatcher
 * Routes ad templates to their respective component implementations
 */

import React from 'react';
import { EverReachAds, EverReachAdProps } from './EverReachAds';
import { HeadlineAd } from './EverReachAds';
import { PainPointAd } from './EverReachAds';
import { ListicleAd } from './EverReachAds';
import { TestimonialAd } from './EverReachAds';
import { ComparisonAd } from './EverReachAds';
import { StatAd } from './EverReachAds';
import { QuestionAd } from './EverReachAds';
import { ObjectionKillerAd } from './EverReachAds';
import { AdAngle } from './angles';
import { COPY_BANK } from './config';

/**
 * Render an ad based on its angle/template type
 */
export function renderAdByTemplate(
  angle: AdAngle,
  props?: Partial<EverReachAdProps>
): React.ReactNode {
  const baseProps: EverReachAdProps = {
    headline: angle.headline,
    subheadline: angle.subheadline,
    ctaText: angle.ctaText,
    awareness: angle.awareness,
    belief: angle.belief,
    ...props,
  };

  switch (angle.template) {
    case 'headline':
      return <HeadlineAd {...baseProps} />;

    case 'painpoint':
      return <PainPointAd {...baseProps} />;

    case 'listicle':
      return <ListicleAd {...baseProps} />;

    case 'testimonial':
      return <TestimonialAd {...baseProps} />;

    case 'comparison':
      return <ComparisonAd {...baseProps} />;

    case 'stat':
      return <StatAd {...baseProps} />;

    case 'question':
      return <QuestionAd {...baseProps} />;

    case 'objection':
      return (
        <ObjectionKillerAd
          {...baseProps}
          objections={COPY_BANK.objectionCounters}
        />
      );

    default:
      // Fallback to generic headline
      return <HeadlineAd {...baseProps} />;
  }
}

/**
 * Component wrapper for template dispatching
 */
export interface TemplateDispatcherProps extends EverReachAdProps {
  angle: AdAngle;
}

export const TemplateDispatcher: React.FC<TemplateDispatcherProps> = ({
  angle,
  ...props
}) => {
  return <>{renderAdByTemplate(angle, props)}</>;
};

export default TemplateDispatcher;
