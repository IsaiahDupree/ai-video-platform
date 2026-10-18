export type ReleaseKind = 'Original' | 'Remix' | 'Mod';

export interface Release {
  id: string;
  /** Path inside public/, resolved with staticFile(). */
  image: string;
  kind: ReleaseKind;
  title: string;
  subtitle?: string;
  benefit: string;
  /** Status line for originals, credit line for remixes/mods. Always rendered. */
  note: string;
  noteKind: 'status' | 'credit';
}

// A type alias (not an interface) so it satisfies Remotion's Record<string, unknown> props constraint.
export type PrintPackProps = {
  fps: number;
  /** Scene lengths in frames. */
  timing: { hook: number; beat: number; cta: number };
  music: { src: string; volume: number } | null;
  hook: { eyebrow: string; titleNumber: string; titleRest: string; titleLine2: string; note: string };
  releases: Release[];
  cta: { line1: string; line2: string; url: string; note: string; brand: string };
};

export const printPackDurationInFrames = (p: PrintPackProps): number =>
  p.timing.hook + p.releases.length * p.timing.beat + p.timing.cta;
