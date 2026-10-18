/**
 * isaiahFonts.ts — Remotion font loading for Isaiah house style.
 *
 * Uses @remotion/google-fonts for render-time font injection.
 * Call loadIsaiahFonts() once at composition mount.
 */

import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export type IsaiahFont =
  | "archivo_black"
  | "anton_bold"
  | "sora_extrabold"
  | "sora_bold"
  | "space_grotesk_semibold"
  | "inter_bold";

/**
 * CSS font-family strings matching the FONT_MAP in IsaiahTalkingHeadV1.tsx.
 */
export const FONT_FAMILIES: Record<IsaiahFont, string> = {
  archivo_black: "'Archivo Black', sans-serif",
  anton_bold: "'Anton', sans-serif",
  sora_extrabold: "'Sora', sans-serif",
  sora_bold: "'Sora', sans-serif",
  space_grotesk_semibold: "'Space Grotesk', sans-serif",
  inter_bold: "'Inter', sans-serif",
};

let _loaded = false;

/**
 * Load all Isaiah house-style fonts via @remotion/google-fonts.
 * Safe to call multiple times — only loads once.
 */
export function loadIsaiahFonts(): void {
  if (_loaded) return;
  _loaded = true;

  loadArchivoBlack("normal");
  loadAnton("normal");
  loadSora("normal");
  loadSpaceGrotesk("normal");
  loadInter("normal");
}
