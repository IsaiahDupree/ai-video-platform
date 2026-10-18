/**
 * RevealRecorder Component
 * Tracks visual element appearances in Remotion compositions
 *
 * Usage:
 * ```tsx
 * import { RevealRecorder } from './components/RevealRecorder';
 *
 * function MyScene() {
 *   const reveals = useRevealRecorder();
 *
 *   return (
 *     <>
 *       <RevealRecorder
 *         isVisible={true}
 *         kind="keyword"
 *         frame={frame}
 *         recorder={reveals}
 *         beatId="intro-hook"
 *       >
 *         <h1>This reveals at current frame</h1>
 *       </RevealRecorder>
 *     </>
 *   );
 * }
 * ```
 */

import React, { useEffect, ReactNode } from 'react';
import { useCurrentFrame } from 'remotion';
import { RevealRecorder, useRevealRecorder } from '../audio/reveal-recorder';
import { VisualRevealKind } from '../audio/audio-types';

interface RevealRecorderProps {
  /** If true, element is visible and reveal should be recorded */
  isVisible: boolean;
  /** Type of visual reveal */
  kind: VisualRevealKind;
  /** Optional identifier for this reveal */
  key?: string;
  /** Reference to beat (optional) */
  beatId?: string;
  /** Frame number to record reveal at (defaults to current frame) */
  frame?: number;
  /** RevealRecorder instance (defaults to global) */
  recorder?: RevealRecorder;
  /** Child element to wrap */
  children: ReactNode;
}

export const RevealRecorderComponent: React.FC<RevealRecorderProps> = ({
  isVisible,
  kind,
  key: elementKey,
  beatId,
  frame,
  recorder,
  children,
}) => {
  const currentFrame = useCurrentFrame();
  const defaultRecorder = useRevealRecorder();
  const activeRecorder = recorder || defaultRecorder;
  const activeFrame = frame !== undefined ? frame : currentFrame;

  // Track when element becomes visible
  useEffect(() => {
    if (isVisible) {
      activeRecorder.record(activeFrame, kind, elementKey, beatId);
    }
  }, [isVisible, activeFrame, kind, elementKey, beatId, activeRecorder]);

  return <>{children}</>;
};

/**
 * HOC for wrapping elements that should record reveals
 * @param Component - React component to wrap
 * @param kind - Type of visual reveal
 * @param beatId - Optional beat ID
 */
export function withRevealRecorder(
  Component: React.ComponentType<any>,
  kind: VisualRevealKind,
  beatId?: string
): React.ComponentType<any> {
  return (props: any) => {
    const recorder = useRevealRecorder();
    const currentFrame = useCurrentFrame();

    useEffect(() => {
      recorder.record(currentFrame, kind, props.key || props.id, beatId);
    }, [currentFrame, recorder, props.key, props.id]);

    return <Component {...props} />;
  };
}

/**
 * RevealBoundary component - Records when any child element appears
 * Useful for tracking entire sections
 */
interface RevealBoundaryProps {
  isVisible: boolean;
  kind: VisualRevealKind;
  beatId?: string;
  children: ReactNode;
}

export const RevealBoundary: React.FC<RevealBoundaryProps> = ({
  isVisible,
  kind,
  beatId,
  children,
}) => {
  const recorder = useRevealRecorder();
  const currentFrame = useCurrentFrame();

  useEffect(() => {
    if (isVisible) {
      recorder.record(currentFrame, kind, beatId, beatId);
    }
  }, [isVisible, currentFrame, kind, beatId, recorder]);

  return <>{children}</>;
};
