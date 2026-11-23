/** Picture-only windows in measured-master seconds. Audio stays continuous. */
export type PresenterVisibilityWindow = [number, number];

export function validatePresenterVisibilityWindows(
  windows: unknown, duration: number, fps: number,
): PresenterVisibilityWindow[] {
  if (!Number.isFinite(duration) || duration <= 0 || duration > 43200 || !Number.isInteger(fps) || fps <= 0 || fps > 120) {
    throw new Error('Presenter visibility requires measured duration and positive integer fps');
  }
  if (!Array.isArray(windows) || windows.length > 128) {
    throw new Error('Presenter visibility windows require at most 128 pairs');
  }
  let previousEnd = 0;
  return windows.map((pair: unknown): PresenterVisibilityWindow => {
    if (!Array.isArray(pair) || pair.length !== 2) {
      throw new Error('Presenter visibility windows require start/end pairs');
    }
    const [start, end] = pair;
    if (typeof start !== 'number' || typeof end !== 'number'
        || !Number.isFinite(start) || !Number.isFinite(end) || Math.abs(start) > 43200 || Math.abs(end) > 43200) {
      throw new Error('Presenter visibility windows require finite numeric seconds');
    }
    if (start < previousEnd || start < 0 || end <= start || end > duration) {
      throw new Error('Presenter visibility windows must be ordered, nonoverlapping and within measured duration');
    }
    if (Math.round(end * fps) <= Math.round(start * fps)) {
      throw new Error('Presenter visibility window must contain at least one rendered frame');
    }
    previousEnd = end;
    return [start, end];
  });
}

export function presenterPictureWindows(
  presenter: {hold_frame: boolean; windows: PresenterVisibilityWindow[]; visibility_windows?: PresenterVisibilityWindow[]},
  duration: number, fps: number,
): PresenterVisibilityWindow[] {
  if (presenter.visibility_windows !== undefined) {
    if (presenter.hold_frame) {
      throw new Error('Explicit presenter visibility requires hold_frame=false; an opaque presenter plate would remain visible');
    }
    return validatePresenterVisibilityWindows(presenter.visibility_windows, duration, fps);
  }
  return presenter.hold_frame ? presenter.windows : [[0, duration]];
}
