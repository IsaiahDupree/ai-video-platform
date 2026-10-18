export const EDITORIAL_PALETTE = {
  paper: '#f4efe5', ink: '#173b36', muted: '#4e635d', green: '#245f50',
  coral: '#b84932', line: '#ccd3c6', white: '#fffdf7', activeCaption: '#ffc39f',
};

/** WCAG sRGB relative luminance for the solid six-digit design colors. */
export function relativeLuminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error('Expected a six-digit hexadecimal color');
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
