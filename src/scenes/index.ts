import React from 'react';

// Scenes barrel export
export { IntroScene } from './IntroScene';
export { TopicScene } from './TopicScene';
export { OutroScene } from './OutroScene';
export { TransitionScene } from './TransitionScene';
export { ListItemScene } from './ListItemScene';
export { HookScene } from './HookScene';
export { StatScene } from './StatScene';
export { KineticCaptionScene } from './KineticCaptionScene';
export { TestimonialScene } from './TestimonialScene';
export { CompareScene } from './CompareScene';
export { CTAScene } from './CTAScene';
export { ChapterCardScene } from './ChapterCardScene';
export { LowerThirdScene } from './LowerThirdScene';
export { EndScreenScene } from './EndScreenScene';
export { CodeScene } from './CodeScene';
export { QuoteCardScene } from './QuoteCardScene';
export { PhoneFrameScene } from './PhoneFrameScene';

// Scene registry for dynamic loading
import { IntroScene } from './IntroScene';
import { TopicScene } from './TopicScene';
import { OutroScene } from './OutroScene';
import { TransitionScene } from './TransitionScene';
import { ListItemScene } from './ListItemScene';
import { HookScene } from './HookScene';
import { StatScene } from './StatScene';
import { KineticCaptionScene } from './KineticCaptionScene';
import { TestimonialScene } from './TestimonialScene';
import { CompareScene } from './CompareScene';
import { CTAScene } from './CTAScene';
import { ChapterCardScene } from './ChapterCardScene';
import { LowerThirdScene } from './LowerThirdScene';
import { EndScreenScene } from './EndScreenScene';
import { CodeScene } from './CodeScene';
import { QuoteCardScene } from './QuoteCardScene';
import { PhoneFrameScene } from './PhoneFrameScene';

export const SceneRegistry: Record<string, React.ComponentType<any>> = {
  // Original
  intro: IntroScene,
  topic: TopicScene,
  outro: OutroScene,
  transition: TransitionScene,
  list_item: ListItemScene,
  // Aliases (backwards compat)
  hook: HookScene,
  content: TopicScene,
  cta: CTAScene,
  comparison: CompareScene,
  compare: CompareScene,
  // New universal scenes
  stat: StatScene,
  testimonial: TestimonialScene,
  kinetic_caption: KineticCaptionScene,
  // YouTube-specific
  chapter_card: ChapterCardScene,
  lower_third: LowerThirdScene,
  end_screen: EndScreenScene,
  code: CodeScene,
  // Twitter/social
  quote_card: QuoteCardScene,
  // Device mockup
  phone_frame: PhoneFrameScene,
};

export function getSceneComponent(type: string): React.ComponentType<any> | undefined {
  return SceneRegistry[type];
}
