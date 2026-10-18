// =============================================================================
// Reveal Recorder for Motion Canvas
// =============================================================================
// Captures visual element appearances at runtime for SFX sync

export type RevealKind = 
  | 'keyword'
  | 'bullet'
  | 'code'
  | 'chart'
  | 'cta'
  | 'error'
  | 'success';

export interface VisualReveal {
  t: number;
  kind: RevealKind;
  key?: string;
}

// Runtime reveal storage
let revealLog: VisualReveal[] = [];
let startTime = 0;

/**
 * Reset reveals at the start of a scene render
 */
export function resetReveals(): void {
  revealLog = [];
  startTime = performance.now();
  
  // Also expose to window for Playwright capture
  if (typeof window !== 'undefined') {
    (window as any).__MC_REVEALS__ = revealLog;
  }
}

/**
 * Record a reveal event
 */
export function reveal(kind: RevealKind, key?: string): void {
  const t = (performance.now() - startTime) / 1000;
  const entry = { t: Number(t.toFixed(3)), kind, key };
  revealLog.push(entry);
  
  // Also call window function if Playwright injected it
  if (typeof window !== 'undefined' && (window as any).__MC_REVEAL__) {
    (window as any).__MC_REVEAL__(kind, key);
  }
}

/**
 * Get all recorded reveals
 */
export function getReveals(): VisualReveal[] {
  return [...revealLog];
}

/**
 * Reveal at a specific time event (for use with waitUntil)
 */
export function* revealAt(
  eventName: string,
  kind: RevealKind,
  key?: string
): Generator<void, void, unknown> {
  reveal(kind, key);
  // This is a no-op generator that just records the reveal
  // The actual waitUntil should be called separately
}

/**
 * Flush reveals to console (for debugging)
 */
export function flushRevealsToLog(): void {
  console.log('[Reveals]', JSON.stringify({ reveals: revealLog }, null, 2));
}

/**
 * Helper to create a reveal-on-show signal
 */
export function createRevealSignal(kind: RevealKind, key?: string) {
  let didReveal = false;
  
  return {
    onShow: () => {
      if (!didReveal) {
        reveal(kind, key);
        didReveal = true;
      }
    },
    reset: () => {
      didReveal = false;
    },
  };
}
