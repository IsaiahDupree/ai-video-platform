import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';
import {VideoData} from './legacy/types';
import {TopicGrid} from './legacy/components/TopicGrid';
import {TopicScene} from './legacy/components/TopicScene';

interface MainCompositionProps extends VideoData {}

export const MainComposition: React.FC<MainCompositionProps> = ({
  title,
  topics,
  backgroundColor = '#0a0a0a',
  textColor = '#ffffff',
  accentColor = '#3b82f6',
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const gridDuration = 2 * fps; // 2 seconds for grid overview
  const transitionDuration = 0.5 * fps; // 0.5 seconds for transitions

  // Calculate when each topic starts
  let currentTime = gridDuration;
  const topicTimings = topics.map((topic, index) => {
    const start = currentTime;
    const duration = topic.seconds * fps;
    currentTime += duration + transitionDuration;
    return {topic, start, duration, index};
  });

  return (
    <AbsoluteFill style={{backgroundColor}}>
      {/* Grid Overview - shown at the beginning */}
      <Sequence from={0} durationInFrames={gridDuration}>
        <TopicGrid
          topics={topics}
          title={title}
          textColor={textColor}
          accentColor={accentColor}
        />
      </Sequence>

      {/* Individual Topic Scenes */}
      {topicTimings.map(({topic, start, duration, index}) => (
        <Sequence key={index} from={start} durationInFrames={duration}>
          <TopicScene
            topic={topic}
            title={title}
            textColor={textColor}
            accentColor={accentColor}
            backgroundColor={backgroundColor}
            isFirst={index === 0}
            isLast={index === topics.length - 1}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};






