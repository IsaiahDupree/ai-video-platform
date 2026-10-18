// =============================================================================
// Visual Reveals Recorder
// Captures visual element appearances during render for SFX sync
// =============================================================================

import { VisualReveal, VisualReveals, VisualRevealKind, Beat } from './audio-types';

/**
 * RevealRecorder tracks visual element appearances during video rendering.
 * Used to record the exact timing of keyword reveals, bullet points, code blocks, etc.
 *
 * Usage in Remotion component:
 * ```tsx
 * const reveals = RevealRecorder.getInstance();
 *
 * // Record when a keyword appears (call in useEffect or on animation trigger)
 * reveals.record(frameNumber, 'keyword', 'intro-hook');
 * reveals.record(frameNumber, 'bullet', 'point-1');
 * ```
 */
export class RevealRecorder {
  private static instance: RevealRecorder;
  private reveals: VisualReveal[] = [];
  private fps: number = 30;

  private constructor(fps: number = 30) {
    this.fps = fps;
  }

  static getInstance(fps: number = 30): RevealRecorder {
    if (!RevealRecorder.instance) {
      RevealRecorder.instance = new RevealRecorder(fps);
    } else {
      RevealRecorder.instance.fps = fps;
    }
    return RevealRecorder.instance;
  }

  /**
   * Record a visual element appearance
   * @param frame - Frame number when element appears
   * @param kind - Type of visual element
   * @param key - Optional identifier for the element
   * @param beatId - Optional reference to beat
   */
  record(frame: number, kind: VisualRevealKind, key?: string, beatId?: string): void {
    const t = frame / this.fps;
    const reveal: VisualReveal = {
      t,
      kind,
      key,
      beatId,
    };

    this.reveals.push(reveal);
  }

  /**
   * Clear all recorded reveals
   */
  clear(): void {
    this.reveals = [];
  }

  /**
   * Get all recorded reveals sorted by time
   */
  getReveals(): VisualReveal[] {
    return [...this.reveals].sort((a, b) => a.t - b.t);
  }

  /**
   * Export reveals as VisualReveals object
   */
  export(): VisualReveals {
    return {
      version: '1.0.0',
      fps: this.fps,
      reveals: this.getReveals(),
    };
  }

  /**
   * Generate seed reveals from beats using WPM timing model
   * @param beats - Beat array
   * @param wpm - Words per minute for pacing (default 150)
   * @returns Seeded VisualReveals
   */
  static generateSeedReveals(beats: Beat[], wpm: number = 150): VisualReveals {
    const reveals: VisualReveal[] = [];
    const avgWordsPerBeat = (wpm / 60) / 2; // Assume ~2 beats per word

    for (const beat of beats) {
      const t = beat.frame / 30; // Assume 30fps
      const action = beat.action || 'reveal';

      // Map beat action to visual reveal kind
      let kind: VisualRevealKind = 'keyword';
      switch (action) {
        case 'hook':
          kind = 'keyword';
          break;
        case 'problem':
        case 'explain':
          kind = 'bullet';
          break;
        case 'code':
          kind = 'code';
          break;
        case 'error':
          kind = 'error';
          break;
        case 'success':
          kind = 'success';
          break;
        case 'cta':
          kind = 'cta';
          break;
        default:
          kind = 'keyword';
      }

      reveals.push({
        t,
        kind,
        key: beat.beatId,
        beatId: beat.beatId,
      });
    }

    return {
      version: '1.0.0',
      fps: 30,
      reveals: reveals.sort((a, b) => a.t - b.t),
    };
  }
}

/**
 * React hook for using RevealRecorder in Remotion components
 * @param fps - Frames per second
 * @returns RevealRecorder instance
 */
export function useRevealRecorder(fps: number = 30): RevealRecorder {
  return RevealRecorder.getInstance(fps);
}
