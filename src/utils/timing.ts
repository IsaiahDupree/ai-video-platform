// Timing and duration calculation utilities

export interface TimingConfig {
  fps: number;
  totalDurationSec: number;
}

export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

export function calculateSectionFrames(
  sections: { duration_sec: number }[],
  fps: number
): { startFrame: number; durationInFrames: number }[] {
  let currentFrame = 0;
  
  return sections.map((section) => {
    const startFrame = currentFrame;
    const durationInFrames = secondsToFrames(section.duration_sec, fps);
    currentFrame += durationInFrames;
    
    return { startFrame, durationInFrames };
  });
}

export function calculateTotalFrames(
  sections: { duration_sec: number }[],
  fps: number
): number {
  const totalSeconds = sections.reduce((sum, s) => sum + s.duration_sec, 0);
  return secondsToFrames(totalSeconds, fps);
}

export function distributeTime(
  totalSeconds: number,
  percentages: number[]
): number[] {
  return percentages.map((p) => (totalSeconds * p) / 100);
}

export function createTimeline(
  sections: { id: string; duration_sec: number }[],
  fps: number
): Map<string, { startFrame: number; endFrame: number; durationInFrames: number }> {
  const timeline = new Map();
  let currentFrame = 0;
  
  for (const section of sections) {
    const durationInFrames = secondsToFrames(section.duration_sec, fps);
    timeline.set(section.id, {
      startFrame: currentFrame,
      endFrame: currentFrame + durationInFrames,
      durationInFrames,
    });
    currentFrame += durationInFrames;
  }
  
  return timeline;
}

// Animation timing helpers
export function stagger(
  index: number,
  delayPerItem: number,
  fps: number
): number {
  return secondsToFrames(index * delayPerItem, fps);
}

export function delayedStart(
  baseDelay: number,
  additionalDelay: number,
  fps: number
): number {
  return secondsToFrames(baseDelay + additionalDelay, fps);
}
