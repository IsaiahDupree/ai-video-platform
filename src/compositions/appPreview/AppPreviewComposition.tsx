/**
 * AppPreviewComposition - App Store Preview Video Generator
 *
 * Creates App Store preview videos with device frames, captions, and overlays.
 * Feature: APP-023 - App Preview Video Generator
 *
 * @example
 * ```tsx
 * <AppPreviewComposition
 *   config={{
 *     id: 'my-app-preview',
 *     title: 'My App Preview',
 *     device: { model: 'iphone-16-pro-max', orientation: 'portrait', showFrame: true },
 *     scenes: [...]
 *   }}
 * />
 * ```
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Img,
  Video,
  interpolate,
  spring,
} from 'remotion';
import { DeviceFrame } from '../../components/DeviceFrame';
import { CaptionOverlay } from '../../components/CaptionOverlay';
import type { AppPreviewConfig, AppPreviewScene, AnimationTiming } from '../../types/appPreview';

export interface AppPreviewCompositionProps {
  config: AppPreviewConfig;
}

/**
 * Calculate animation progress for a scene
 */
function useAnimationProgress(
  sceneStartFrame: number,
  sceneDuration: number,
  animationDuration: number = 30,
  animationDelay: number = 0
): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - sceneStartFrame - animationDelay;

  if (localFrame < 0 || localFrame > sceneDuration) {
    return 1; // Animation complete or not started
  }

  if (animationDuration === 0) {
    return 1; // No animation
  }

  return Math.min(1, localFrame / animationDuration);
}

/**
 * Apply animation transform based on type and progress
 */
function getAnimationTransform(
  animationType: string,
  progress: number,
  easing: string = 'ease-out'
): React.CSSProperties {
  const style: React.CSSProperties = {};

  // Apply easing
  let easedProgress = progress;

  if (easing === 'ease-in') {
    easedProgress = progress * progress;
  } else if (easing === 'ease-out') {
    easedProgress = 1 - (1 - progress) * (1 - progress);
  } else if (easing === 'ease-in-out') {
    easedProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  }

  // Apply animation based on type
  switch (animationType) {
    case 'slide-up':
      style.transform = `translateY(${(1 - easedProgress) * 100}%)`;
      style.opacity = easedProgress;
      break;
    case 'slide-down':
      style.transform = `translateY(${-(1 - easedProgress) * 100}%)`;
      style.opacity = easedProgress;
      break;
    case 'slide-left':
      style.transform = `translateX(${-(1 - easedProgress) * 100}%)`;
      style.opacity = easedProgress;
      break;
    case 'slide-right':
      style.transform = `translateX(${(1 - easedProgress) * 100}%)`;
      style.opacity = easedProgress;
      break;
    case 'zoom-in':
      style.transform = `scale(${0.5 + easedProgress * 0.5})`;
      style.opacity = easedProgress;
      break;
    case 'zoom-out':
      style.transform = `scale(${1.5 - easedProgress * 0.5})`;
      style.opacity = easedProgress;
      break;
    case 'rotate':
      style.transform = `rotate(${(1 - easedProgress) * 180}deg)`;
      style.opacity = easedProgress;
      break;
    case 'none':
    default:
      style.opacity = 1;
      break;
  }

  return style;
}

/**
 * Scene component - renders a single scene with device frame and content
 */
const AppPreviewSceneComponent: React.FC<{
  scene: AppPreviewScene;
  config: AppPreviewConfig;
  sceneStartFrame: number;
}> = ({ scene, config, sceneStartFrame }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Calculate animation progress
  const animationProgress = useAnimationProgress(
    sceneStartFrame,
    scene.durationInFrames,
    scene.animation?.duration || 30,
    scene.animation?.delay || 0
  );

  // Get animation styles
  const animationStyle = scene.animation
    ? getAnimationTransform(
        scene.animation.type || 'none',
        animationProgress,
        scene.animation.easing || 'ease-out'
      )
    : {};

  // Background style
  const backgroundStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
  };

  if (scene.background || config.background) {
    const bg = scene.background || config.background;

    if (bg?.gradient) {
      const { type, colors, angle = 90 } = bg.gradient;
      if (type === 'linear') {
        backgroundStyle.background = `linear-gradient(${angle}deg, ${colors.join(', ')})`;
      } else {
        backgroundStyle.background = `radial-gradient(circle, ${colors.join(', ')})`;
      }
    } else if (bg?.color) {
      backgroundStyle.backgroundColor = bg.color;
    }

    if (bg?.opacity !== undefined) {
      backgroundStyle.opacity = bg.opacity;
    }

    if (bg?.blur) {
      backgroundStyle.backdropFilter = `blur(${bg.blur}px)`;
    }
  } else {
    // Default background
    backgroundStyle.backgroundColor = '#000000';
  }

  // Device frame dimensions (centered)
  const deviceWidth = config.dimensions?.width || width * 0.6;
  const deviceHeight = config.dimensions?.height || height * 0.8;

  // Content for device frame
  const renderContent = () => {
    if (scene.content.type === 'video') {
      return (
        <Video
          src={staticFile(scene.content.src)}
          startFrom={scene.content.startFrom || 0}
          playbackRate={scene.content.playbackRate || 1}
          style={{
            width: '100%',
            height: '100%',
            objectFit: scene.content.fit || 'cover',
          }}
        />
      );
    } else {
      return (
        <Img
          src={staticFile(scene.content.src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: scene.content.fit || 'cover',
          }}
        />
      );
    }
  };

  return (
    <AbsoluteFill>
      {/* Background */}
      <div style={backgroundStyle} />

      {/* Device frame with content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          ...animationStyle,
        }}
      >
        {config.device.showFrame ? (
          <DeviceFrame
            device={config.device.model}
            orientation={config.device.orientation}
            content={renderContent()}
            width={deviceWidth}
            height={deviceHeight}
            style={{
              frameColor: config.device.frameColor,
              shadow: config.device.shadow !== false,
            }}
          />
        ) : (
          <div
            style={{
              width: deviceWidth,
              height: deviceHeight,
              position: 'relative',
            }}
          >
            {renderContent()}
          </div>
        )}
      </AbsoluteFill>

      {/* Captions/Overlays */}
      {scene.captions && scene.captions.length > 0 && (
        <AbsoluteFill>
          {scene.captions.map((caption) => (
            <CaptionOverlay
              key={caption.id}
              caption={caption}
              locale={config.metadata?.locale}
              containerWidth={width}
              containerHeight={height}
            />
          ))}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/**
 * Scene transition component
 */
const SceneTransitionComponent: React.FC<{
  progress: number;
  type: string;
}> = ({ progress, type }) => {
  let opacity = 0;

  if (type === 'fade') {
    opacity = progress < 0.5 ? progress * 2 : 2 - progress * 2;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

/**
 * Main AppPreviewComposition component
 */
export const AppPreviewComposition: React.FC<AppPreviewCompositionProps> = ({ config }) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Calculate cumulative frame positions for each scene
  let cumulativeFrame = 0;
  const scenePositions: number[] = [];

  config.scenes.forEach((scene) => {
    scenePositions.push(cumulativeFrame);
    cumulativeFrame += scene.durationInFrames;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Background music */}
      {config.audio?.music && (
        <Audio
          src={staticFile(config.audio.music)}
          volume={config.audio.musicVolume || 0.3}
        />
      )}

      {/* Voiceover */}
      {config.audio?.voiceover && (
        <Audio
          src={staticFile(config.audio.voiceover)}
          volume={config.audio.voiceoverVolume || 1}
        />
      )}

      {/* Render scenes */}
      {config.scenes.map((scene, index) => {
        const startFrame = scenePositions[index];
        const transitionDuration = scene.transition?.duration || 0;

        return (
          <React.Fragment key={scene.id}>
            {/* Scene content */}
            <Sequence from={startFrame} durationInFrames={scene.durationInFrames}>
              <AppPreviewSceneComponent
                scene={scene}
                config={config}
                sceneStartFrame={startFrame}
              />
            </Sequence>

            {/* Transition to next scene */}
            {scene.transition && scene.transition.type !== 'none' && index < config.scenes.length - 1 && (
              <Sequence
                from={startFrame + scene.durationInFrames - transitionDuration}
                durationInFrames={transitionDuration}
              >
                <SceneTransitionComponent
                  progress={interpolate(
                    frame - (startFrame + scene.durationInFrames - transitionDuration),
                    [0, transitionDuration],
                    [0, 1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  )}
                  type={scene.transition.type}
                />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

export default AppPreviewComposition;
