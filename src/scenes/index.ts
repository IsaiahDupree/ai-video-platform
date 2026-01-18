// Scenes barrel export
export { IntroScene } from './IntroScene';
export { TopicScene } from './TopicScene';
export { OutroScene } from './OutroScene';
export { TransitionScene } from './TransitionScene';
export { ListItemScene } from './ListItemScene';

// Scene registry for dynamic loading
import { IntroScene } from './IntroScene';
import { TopicScene } from './TopicScene';
import { OutroScene } from './OutroScene';
import { TransitionScene } from './TransitionScene';
import { ListItemScene } from './ListItemScene';

export const SceneRegistry: Record<string, React.ComponentType<any>> = {
  intro: IntroScene,
  topic: TopicScene,
  outro: OutroScene,
  transition: TransitionScene,
  list_item: ListItemScene,
  // Aliases
  hook: IntroScene,
  content: TopicScene,
  cta: OutroScene,
  comparison: TopicScene,
};

export function getSceneComponent(type: string): React.ComponentType<any> | undefined {
  return SceneRegistry[type];
}
