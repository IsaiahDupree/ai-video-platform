import {VideoData} from '../types';

/**
 * Calculates the total duration of a video in seconds
 * Includes: grid overview + all topics + transitions
 */
export function calculateDuration(data: VideoData): number {
  const gridDuration = 2; // Overview grid shown for 2 seconds
  const transitionDuration = 0.5; // Zoom transition between topics
  const topicsDuration = data.topics.reduce(
    (sum, topic) => sum + topic.seconds,
    0
  );
  const transitionsDuration = transitionDuration * (data.topics.length - 1);
  return Math.ceil(gridDuration + topicsDuration + transitionsDuration);
}

/**
 * Calculates the duration in frames (for Remotion)
 */
export function calculateDurationInFrames(data: VideoData, fps: number = 30): number {
  return calculateDuration(data) * fps;
}






