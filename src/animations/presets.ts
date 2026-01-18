/**
 * Animation Presets Library
 * 
 * Reusable animation configurations for VideoStudio
 * Use with Remotion's interpolate() and spring() functions
 */

import { interpolate, spring, Easing } from 'remotion';

// =============================================================================
// Types
// =============================================================================

export interface AnimationConfig {
  name: string;
  duration: number; // in frames
  description: string;
}

export interface TransformAnimation {
  opacity?: number;
  scale?: number;
  translateX?: number;
  translateY?: number;
  rotate?: number;
  blur?: number;
}

// =============================================================================
// Easing Presets
// =============================================================================

export const EASINGS = {
  // Smooth & Professional
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  smoothOut: Easing.bezier(0, 0, 0.2, 1),
  smoothIn: Easing.bezier(0.4, 0, 1, 1),
  
  // Snappy & Energetic
  snappy: Easing.bezier(0.68, -0.6, 0.32, 1.6),
  bounce: Easing.bezier(0.34, 1.56, 0.64, 1),
  elastic: Easing.bezier(0.68, -0.55, 0.27, 1.55),
  
  // Dramatic
  dramatic: Easing.bezier(0.19, 1, 0.22, 1),
  slowMo: Easing.bezier(0.16, 1, 0.3, 1),
  
  // Sharp
  sharp: Easing.bezier(0.4, 0, 0.6, 1),
  linear: Easing.linear,
};

// =============================================================================
// Entrance Animations
// =============================================================================

export const entranceAnimations = {
  /**
   * Fade in from transparent
   */
  fadeIn: (frame: number, startFrame: number, duration: number = 15) => ({
    opacity: interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smooth,
    }),
  }),

  /**
   * Slide up from below with fade
   */
  slideUp: (frame: number, startFrame: number, duration: number = 20, distance: number = 50) => ({
    opacity: interpolate(frame, [startFrame, startFrame + duration * 0.6], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    translateY: interpolate(frame, [startFrame, startFrame + duration], [distance, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smoothOut,
    }),
  }),

  /**
   * Slide down from above with fade
   */
  slideDown: (frame: number, startFrame: number, duration: number = 20, distance: number = 50) => ({
    opacity: interpolate(frame, [startFrame, startFrame + duration * 0.6], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    translateY: interpolate(frame, [startFrame, startFrame + duration], [-distance, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smoothOut,
    }),
  }),

  /**
   * Slide in from left
   */
  slideLeft: (frame: number, startFrame: number, duration: number = 20, distance: number = 100) => ({
    opacity: interpolate(frame, [startFrame, startFrame + duration * 0.5], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    translateX: interpolate(frame, [startFrame, startFrame + duration], [-distance, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smoothOut,
    }),
  }),

  /**
   * Slide in from right
   */
  slideRight: (frame: number, startFrame: number, duration: number = 20, distance: number = 100) => ({
    opacity: interpolate(frame, [startFrame, startFrame + duration * 0.5], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    translateX: interpolate(frame, [startFrame, startFrame + duration], [distance, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smoothOut,
    }),
  }),

  /**
   * Scale up from small (pop effect)
   */
  popIn: (frame: number, startFrame: number, fps: number = 30) => {
    const springValue = spring({
      frame: frame - startFrame,
      fps,
      config: { damping: 12, stiffness: 200, mass: 0.5 },
    });
    return {
      opacity: interpolate(springValue, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' }),
      scale: springValue,
    };
  },

  /**
   * Bounce in with overshoot
   */
  bounceIn: (frame: number, startFrame: number, fps: number = 30) => {
    const springValue = spring({
      frame: frame - startFrame,
      fps,
      config: { damping: 8, stiffness: 150, mass: 0.8 },
    });
    return {
      opacity: interpolate(springValue, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
      scale: springValue,
    };
  },

  /**
   * Zoom in from large
   */
  zoomIn: (frame: number, startFrame: number, duration: number = 20) => ({
    opacity: interpolate(frame, [startFrame, startFrame + duration * 0.5], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    scale: interpolate(frame, [startFrame, startFrame + duration], [1.5, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smoothOut,
    }),
  }),

  /**
   * Flip in (3D rotation)
   */
  flipIn: (frame: number, startFrame: number, duration: number = 25) => ({
    opacity: interpolate(frame, [startFrame, startFrame + duration * 0.3], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    rotateX: interpolate(frame, [startFrame, startFrame + duration], [-90, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.bounce,
    }),
  }),

  /**
   * Typewriter reveal (for text)
   */
  typewriter: (frame: number, startFrame: number, textLength: number, fps: number = 30) => {
    const charsPerSecond = 20;
    const totalDuration = (textLength / charsPerSecond) * fps;
    const progress = interpolate(frame, [startFrame, startFrame + totalDuration], [0, textLength], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return { visibleChars: Math.floor(progress) };
  },

  /**
   * Glitch effect entrance
   */
  glitchIn: (frame: number, startFrame: number, duration: number = 15) => {
    const progress = (frame - startFrame) / duration;
    const glitchOffset = progress < 1 ? Math.sin(progress * 20) * (1 - progress) * 10 : 0;
    return {
      opacity: interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
      translateX: glitchOffset,
      scale: 1 + Math.abs(glitchOffset) * 0.01,
    };
  },
};

// =============================================================================
// Exit Animations
// =============================================================================

export const exitAnimations = {
  fadeOut: (frame: number, startFrame: number, duration: number = 15) => ({
    opacity: interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smooth,
    }),
  }),

  slideOutUp: (frame: number, startFrame: number, duration: number = 20, distance: number = 50) => ({
    opacity: interpolate(frame, [startFrame + duration * 0.4, startFrame + duration], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    translateY: interpolate(frame, [startFrame, startFrame + duration], [0, -distance], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smoothIn,
    }),
  }),

  slideOutDown: (frame: number, startFrame: number, duration: number = 20, distance: number = 50) => ({
    opacity: interpolate(frame, [startFrame + duration * 0.4, startFrame + duration], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    translateY: interpolate(frame, [startFrame, startFrame + duration], [0, distance], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smoothIn,
    }),
  }),

  popOut: (frame: number, startFrame: number, duration: number = 15) => ({
    opacity: interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    scale: interpolate(frame, [startFrame, startFrame + duration], [1, 0.5], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smoothIn,
    }),
  }),

  zoomOut: (frame: number, startFrame: number, duration: number = 20) => ({
    opacity: interpolate(frame, [startFrame + duration * 0.5, startFrame + duration], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    scale: interpolate(frame, [startFrame, startFrame + duration], [1, 1.5], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smoothIn,
    }),
  }),
};

// =============================================================================
// Continuous/Loop Animations
// =============================================================================

export const loopAnimations = {
  /**
   * Gentle floating motion
   */
  float: (frame: number, amplitude: number = 10, speed: number = 0.05) => ({
    translateY: Math.sin(frame * speed) * amplitude,
  }),

  /**
   * Pulsing scale
   */
  pulse: (frame: number, minScale: number = 0.95, maxScale: number = 1.05, speed: number = 0.1) => ({
    scale: minScale + (Math.sin(frame * speed) + 1) * 0.5 * (maxScale - minScale),
  }),

  /**
   * Gentle rotation
   */
  rotate: (frame: number, speed: number = 1) => ({
    rotate: frame * speed,
  }),

  /**
   * Shimmer/shine effect
   */
  shimmer: (frame: number, speed: number = 0.15) => ({
    shimmerX: (frame * speed * 100) % 200 - 100,
  }),

  /**
   * Breathing glow
   */
  glow: (frame: number, minOpacity: number = 0.3, maxOpacity: number = 1, speed: number = 0.08) => ({
    glowOpacity: minOpacity + (Math.sin(frame * speed) + 1) * 0.5 * (maxOpacity - minOpacity),
  }),

  /**
   * Shake/vibrate
   */
  shake: (frame: number, intensity: number = 3) => ({
    translateX: Math.sin(frame * 1.5) * intensity,
    translateY: Math.cos(frame * 1.3) * intensity * 0.5,
  }),
};

// =============================================================================
// Transition Effects (between scenes)
// =============================================================================

export const transitionEffects = {
  /**
   * Crossfade between scenes
   */
  crossfade: (frame: number, transitionStart: number, duration: number = 15) => ({
    outgoing: {
      opacity: interpolate(frame, [transitionStart, transitionStart + duration], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    },
    incoming: {
      opacity: interpolate(frame, [transitionStart, transitionStart + duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    },
  }),

  /**
   * Wipe transition (horizontal)
   */
  wipeHorizontal: (frame: number, transitionStart: number, duration: number = 20) => {
    const progress = interpolate(frame, [transitionStart, transitionStart + duration], [0, 100], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smooth,
    });
    return { clipPath: `inset(0 ${100 - progress}% 0 0)` };
  },

  /**
   * Zoom transition
   */
  zoomTransition: (frame: number, transitionStart: number, duration: number = 20) => ({
    outgoing: {
      scale: interpolate(frame, [transitionStart, transitionStart + duration], [1, 2], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: EASINGS.smoothIn,
      }),
      opacity: interpolate(frame, [transitionStart, transitionStart + duration * 0.5], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    },
    incoming: {
      scale: interpolate(frame, [transitionStart, transitionStart + duration], [0.5, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: EASINGS.smoothOut,
      }),
      opacity: interpolate(frame, [transitionStart + duration * 0.5, transitionStart + duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    },
  }),

  /**
   * Slide push transition
   */
  slidePush: (frame: number, transitionStart: number, duration: number = 20, direction: 'left' | 'right' = 'left') => {
    const sign = direction === 'left' ? -1 : 1;
    return {
      outgoing: {
        translateX: interpolate(frame, [transitionStart, transitionStart + duration], [0, sign * 100], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: EASINGS.smooth,
        }),
      },
      incoming: {
        translateX: interpolate(frame, [transitionStart, transitionStart + duration], [-sign * 100, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: EASINGS.smooth,
        }),
      },
    };
  },
};

// =============================================================================
// Text Animation Utilities
// =============================================================================

export const textAnimations = {
  /**
   * Staggered word reveal
   */
  staggerWords: (frame: number, startFrame: number, wordCount: number, staggerDelay: number = 5) => {
    return Array.from({ length: wordCount }, (_, i) => {
      const wordStart = startFrame + i * staggerDelay;
      return entranceAnimations.slideUp(frame, wordStart, 15, 30);
    });
  },

  /**
   * Character-by-character reveal
   */
  charReveal: (frame: number, startFrame: number, charCount: number, fps: number = 30) => {
    const charsPerSecond = 30;
    const visibleChars = Math.floor(
      interpolate(frame, [startFrame, startFrame + (charCount / charsPerSecond) * fps], [0, charCount], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );
    return { visibleChars };
  },

  /**
   * Highlight/emphasis animation
   */
  highlight: (frame: number, startFrame: number, duration: number = 20) => ({
    highlightWidth: interpolate(frame, [startFrame, startFrame + duration], [0, 100], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASINGS.smoothOut,
    }),
  }),
};

// =============================================================================
// Helper: Apply animation to style
// =============================================================================

export function applyAnimation(animation: TransformAnimation): React.CSSProperties {
  const transform: string[] = [];
  
  if (animation.translateX !== undefined) {
    transform.push(`translateX(${animation.translateX}px)`);
  }
  if (animation.translateY !== undefined) {
    transform.push(`translateY(${animation.translateY}px)`);
  }
  if (animation.scale !== undefined) {
    transform.push(`scale(${animation.scale})`);
  }
  if (animation.rotate !== undefined) {
    transform.push(`rotate(${animation.rotate}deg)`);
  }
  
  return {
    opacity: animation.opacity,
    transform: transform.length > 0 ? transform.join(' ') : undefined,
    filter: animation.blur !== undefined ? `blur(${animation.blur}px)` : undefined,
  };
}

// =============================================================================
// Preset Combinations
// =============================================================================

export const animationPresets = {
  // Professional/Corporate
  professional: {
    entrance: 'fadeIn',
    exit: 'fadeOut',
    duration: 20,
    easing: 'smooth',
  },
  
  // Energetic/Social Media
  energetic: {
    entrance: 'bounceIn',
    exit: 'popOut',
    duration: 15,
    easing: 'bounce',
  },
  
  // Dramatic/Cinematic
  cinematic: {
    entrance: 'zoomIn',
    exit: 'zoomOut',
    duration: 30,
    easing: 'dramatic',
  },
  
  // Playful/Fun
  playful: {
    entrance: 'popIn',
    exit: 'slideOutDown',
    duration: 18,
    easing: 'elastic',
  },
  
  // Minimal/Clean
  minimal: {
    entrance: 'slideUp',
    exit: 'fadeOut',
    duration: 25,
    easing: 'smoothOut',
  },
  
  // Tech/Glitch
  glitch: {
    entrance: 'glitchIn',
    exit: 'fadeOut',
    duration: 15,
    easing: 'sharp',
  },
};

export default {
  entranceAnimations,
  exitAnimations,
  loopAnimations,
  transitionEffects,
  textAnimations,
  EASINGS,
  applyAnimation,
  animationPresets,
};
