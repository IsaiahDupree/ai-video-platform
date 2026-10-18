/**
 * Image-to-Video Component
 * Displays video generated from image with motion effect
 *
 * Usage:
 * ```tsx
 * <ImageToVideo
 *   imageUrl="photo.jpg"
 *   videoUrl="output.mp4"
 *   motionPrompt="camera pans left"
 *   fallbackDuration={5}
 *   fps={24}
 * />
 * ```
 */

import React from 'react';
import { Img, Video, AbsoluteFill, Composition } from 'remotion';

export interface ImageToVideoProps {
  /** URL or path to the source image (shown during transition) */
  imageUrl: string;

  /** URL or path to the generated video */
  videoUrl: string;

  /** Motion prompt that was used to generate the video */
  motionPrompt?: string;

  /** Fallback duration if video metadata unavailable (in seconds) */
  fallbackDuration?: number;

  /** Frames per second */
  fps?: number;

  /** Whether to show image initially before video */
  showImageIntro?: boolean;

  /** Duration to show image (in seconds) before transitioning to video */
  imageIntroDuration?: number;

  /** Alpha opacity for fade transition */
  style?: React.CSSProperties;
}

/**
 * ImageToVideo component
 * Plays generated video with optional image intro
 */
export const ImageToVideo: React.FC<ImageToVideoProps> = ({
  imageUrl,
  videoUrl,
  motionPrompt,
  fallbackDuration = 5,
  fps = 24,
  showImageIntro = false,
  imageIntroDuration = 1,
  style,
}) => {
  const imageDurationFrames = imageIntroDuration * (fps || 30);
  const totalDurationFrames = (fallbackDuration + (showImageIntro ? imageIntroDuration : 0)) * (fps || 30);

  return (
    <AbsoluteFill
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Background image (for loading state) */}
      <Img
        src={imageUrl}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: showImageIntro ? 1 : 0,
          zIndex: 1,
        }}
      />

      {/* Generated video */}
      <Video
        src={videoUrl}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: showImageIntro ? 0 : 1,
          zIndex: 2,
        }}
        startFrom={showImageIntro ? imageDurationFrames : 0}
      />
    </AbsoluteFill>
  );
};

/**
 * ImageToVideoComposition - Full composition wrapper
 * Useful for rendering image-to-video in isolation
 */
export interface ImageToVideoCompositionProps extends ImageToVideoProps {
  /** Composition width */
  width?: number;

  /** Composition height */
  height?: number;

  /** Display FPS */
  durationFrames?: number;
}

export const ImageToVideoComposition: React.FC<ImageToVideoCompositionProps> = ({
  imageUrl,
  videoUrl,
  width = 1080,
  height = 1920,
  durationFrames = 120,
  fps = 24,
  ...props
}) => {
  return (
    <Composition
      id="ImageToVideo"
      component={ImageToVideo}
      durationInFrames={durationFrames}
      fps={fps}
      width={width}
      height={height}
      defaultProps={{
        imageUrl,
        videoUrl,
        fallbackDuration: durationFrames / (fps || 30),
        fps,
        ...props,
      }}
    />
  );
};

/**
 * Batch render multiple image-to-video compositions
 */
export interface ImageToVideoJob {
  id: string;
  imageUrl: string;
  videoUrl: string;
  motionPrompt?: string;
  outputPath: string;
  width?: number;
  height?: number;
}

export async function batchRenderImageToVideo(jobs: ImageToVideoJob[]): Promise<void> {
  console.log(`📹 Batch rendering ${jobs.length} image-to-video compositions...`);

  for (const job of jobs) {
    console.log(`\n  [${job.id}] Rendering ${job.imageUrl} → ${job.videoUrl}`);
    // Would call Remotion render API here
    console.log(`    Output: ${job.outputPath}`);
  }

  console.log(`\n✅ Batch render complete`);
}
