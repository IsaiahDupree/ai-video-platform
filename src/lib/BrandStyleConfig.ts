/**
 * BrandStyleConfig.ts — Brand color, font, and safe-zone specs per brand.
 *
 * Used by VideoQAInspector to validate text styling matches the brand system,
 * and by the Remotion compositions to pick fonts and colors at render time.
 */

export interface BrandSafeZone {
  topPct: number;    // fraction from top where text is safe to place (e.g. 0.08)
  bottomPct: number; // fraction from bottom that is safe
  leftPct: number;
  rightPct: number;
}

export interface TextStyleSpec {
  fontFamilyPool: string[];    // acceptable font families (case-insensitive match)
  fontWeightMin: number;       // e.g. 600
  fontWeightMax: number;       // e.g. 900
  casePreference: "sentence" | "title" | "upper" | "lower" | "any";
  stroke: boolean;
  shadow: boolean;
  ugcFeel: number;             // 0–1 — how native/organic the style should look
  maxWordsPerLine?: number;    // for caption style
  highlightKeywords?: boolean;
}

export interface BrandStyleConfig {
  brandId: string;
  displayName: string;

  /** Primary + accent colors (hex). QA checks rendered text uses one of these. */
  primaryColors: string[];

  /** High-contrast text colors guaranteed to be readable on brand backgrounds. */
  textColors: string[];

  /** Background/overlay colors used behind captions/hooks. */
  overlayColors: string[];

  /** Style spec for the top hook / summary strap. */
  hookStyle: TextStyleSpec;

  /** Style spec for word-by-word captions in the lower third. */
  captionStyle: TextStyleSpec;

  /** Safe placement zones (percentages of frame height/width). */
  safeZone: BrandSafeZone;

  /** UGC feel target for overall composition. 0=polished, 1=raw creator */
  ugcFeel: number;
}

// ─── Brand configs ────────────────────────────────────────────────────────────

export const BRAND_CONFIGS: Record<string, BrandStyleConfig> = {
  isaiah_personal: {
    brandId: "isaiah_personal",
    displayName: "Isaiah Dupree — Personal",
    primaryColors: ["#FFFFFF", "#000000", "#1A1A2E", "#E94560", "#16213E"],
    textColors: ["#FFFFFF", "#F5F5F5"],
    overlayColors: ["rgba(0,0,0,0.7)", "rgba(26,26,46,0.85)"],
    hookStyle: {
      fontFamilyPool: ["Archivo Black", "Anton", "Space Grotesk"],
      fontWeightMin: 700,
      fontWeightMax: 900,
      casePreference: "sentence",
      stroke: true,
      shadow: true,
      ugcFeel: 0.75,
      maxWordsPerLine: 7,
    },
    captionStyle: {
      fontFamilyPool: ["Sora", "Inter", "Space Grotesk"],
      fontWeightMin: 600,
      fontWeightMax: 800,
      casePreference: "sentence",
      stroke: true,
      shadow: false,
      ugcFeel: 0.70,
      maxWordsPerLine: 4,
      highlightKeywords: true,
    },
    safeZone: {
      topPct: 0.07,
      bottomPct: 0.10,
      leftPct: 0.04,
      rightPct: 0.04,
    },
    ugcFeel: 0.75,
  },

  everreach: {
    brandId: "everreach",
    displayName: "EverReach",
    primaryColors: ["#FFFFFF", "#000000", "#0A84FF", "#5AC8FA", "#30D158"],
    textColors: ["#FFFFFF", "#F2F2F7"],
    overlayColors: ["rgba(0,0,0,0.75)", "rgba(10,132,255,0.15)"],
    hookStyle: {
      fontFamilyPool: ["Space Grotesk", "Inter", "Sora"],
      fontWeightMin: 700,
      fontWeightMax: 900,
      casePreference: "title",
      stroke: false,
      shadow: true,
      ugcFeel: 0.60,
      maxWordsPerLine: 6,
    },
    captionStyle: {
      fontFamilyPool: ["Inter", "Space Grotesk"],
      fontWeightMin: 600,
      fontWeightMax: 700,
      casePreference: "sentence",
      stroke: false,
      shadow: true,
      ugcFeel: 0.55,
      maxWordsPerLine: 4,
      highlightKeywords: true,
    },
    safeZone: {
      topPct: 0.08,
      bottomPct: 0.12,
      leftPct: 0.05,
      rightPct: 0.05,
    },
    ugcFeel: 0.60,
  },

  portal_copy_co: {
    brandId: "portal_copy_co",
    displayName: "Portal Copy Co.",
    primaryColors: ["#FFFFFF", "#000000", "#E5D4B2", "#4B6B4D", "#5B78C7", "#9B8CDC"],
    textColors: ["#FFFFFF", "#000000", "#E5D4B2"],
    overlayColors: [
      "rgba(0,0,0,0.72)",
      "rgba(75,107,77,0.80)",
      "rgba(91,120,199,0.75)",
    ],
    hookStyle: {
      fontFamilyPool: ["Archivo Black", "Anton", "Sora"],
      fontWeightMin: 700,
      fontWeightMax: 900,
      casePreference: "sentence",
      stroke: true,
      shadow: true,
      ugcFeel: 0.82,
      maxWordsPerLine: 7,
    },
    captionStyle: {
      fontFamilyPool: ["Sora", "Space Grotesk", "Inter"],
      fontWeightMin: 600,
      fontWeightMax: 800,
      casePreference: "sentence",
      stroke: true,
      shadow: false,
      ugcFeel: 0.78,
      maxWordsPerLine: 4,
      highlightKeywords: true,
    },
    safeZone: {
      topPct: 0.08,
      bottomPct: 0.12,
      leftPct: 0.05,
      rightPct: 0.05,
    },
    ugcFeel: 0.82,
  },

  techmestuff: {
    brandId: "techmestuff",
    displayName: "TechMeStuff",
    primaryColors: ["#FFFFFF", "#000000", "#00D4FF", "#7B2FBE", "#FF6B35"],
    textColors: ["#FFFFFF", "#00D4FF"],
    overlayColors: ["rgba(0,0,0,0.80)", "rgba(123,47,190,0.75)"],
    hookStyle: {
      fontFamilyPool: ["Anton", "Archivo Black", "Space Grotesk"],
      fontWeightMin: 700,
      fontWeightMax: 900,
      casePreference: "upper",
      stroke: true,
      shadow: true,
      ugcFeel: 0.65,
      maxWordsPerLine: 5,
    },
    captionStyle: {
      fontFamilyPool: ["Inter", "Space Grotesk", "Sora"],
      fontWeightMin: 600,
      fontWeightMax: 800,
      casePreference: "sentence",
      stroke: true,
      shadow: false,
      ugcFeel: 0.62,
      maxWordsPerLine: 4,
      highlightKeywords: true,
    },
    safeZone: {
      topPct: 0.07,
      bottomPct: 0.10,
      leftPct: 0.04,
      rightPct: 0.04,
    },
    ugcFeel: 0.65,
  },
};

/** Get brand config by ID, with fallback to isaiah_personal. */
export function getBrandConfig(brandId: string): BrandStyleConfig {
  return BRAND_CONFIGS[brandId] ?? BRAND_CONFIGS["isaiah_personal"];
}
