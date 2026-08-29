export const LEAD_HANDOFF_SCENE_BOUNDARIES = [
  0,
  3.275,
  7.95,
  13.5,
  22.4,
  30.55,
  35.5,
] as const;

/**
 * Fade a scene inside an exclusive [start, end) window.
 *
 * Adjacent scenes share a boundary but never share a visible frame. This
 * prevents two information-dense cards from becoming unreadable during a
 * crossfade while retaining a short fade through the ambient background.
 */
export const resolveExclusiveSceneOpacity = (
  time: number,
  start: number,
  end: number,
  fade = 0.12,
): number => {
  if (
    !Number.isFinite(time)
    || !Number.isFinite(start)
    || !Number.isFinite(end)
    || !Number.isFinite(fade)
    || end <= start
    || fade <= 0
    || time < start
    || time >= end
  ) {
    return 0;
  }

  const fadeIn = Math.min(1, (time - start) / fade);
  const fadeOut = Math.min(1, (end - time) / fade);
  return Math.max(0, Math.min(fadeIn, fadeOut));
};
