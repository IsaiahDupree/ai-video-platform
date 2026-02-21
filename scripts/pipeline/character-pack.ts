/**
 * Character Pack Loader — Reads AD_CHARACTER_PACK.json and provides
 * character selection, prompt block assembly, and identity locking
 * for consistent character generation across all pipeline stages.
 *
 * Research basis: docs/research/FAL_CHARACTER_CONSISTENCY_DEEP_DIVE.md
 * Character data: docs/research/AD_CHARACTER_PACK.json
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// Types matching AD_CHARACTER_PACK.json schema
// =============================================================================

export interface CharacterPackGlobals {
  consistency_block: string;
  negative_block: string;
  prompt_assembly: {
    base_template: string;
    video_clip_template: string;
  };
}

export interface AngleDefinition {
  id: string;
  name: string;
  bucket: string;
  prompt_block: string;
}

export interface UnghostingContext {
  id: string;
  name: string;
  prompt_block: string;
}

export interface PackCharacter {
  id: string;
  name: string;
  gender: string;
  role: string;
  archetype: string;
  ethnicity: string;
  age_vibe: string;
  identity_prompt_block: string;
  hair_lock: {
    default_style: string;
    allowed_variants: string[];
    color: string;
  };
  grooming_makeup_lock: {
    style: string;
    rules: string[];
  };
  primary_angles: string[];
  secondary_angles: string[];
  unghosting_roles: string[];
  wardrobe_refs: string[];
  background_refs: string[];
  expression_set_ref: string;
  use_case_fit: Record<string, string>;
  notes: string;
}

export interface CharacterPack {
  schema_version: string;
  brand: { name: string; product: string; goal: string; notes: string };
  globals: CharacterPackGlobals;
  libraries: {
    angles: AngleDefinition[];
    unghosting_contexts: UnghostingContext[];
  };
  characters: PackCharacter[];
}

// =============================================================================
// Loading
// =============================================================================

const DEFAULT_PACK_PATH = path.join(process.cwd(), 'docs', 'research', 'AD_CHARACTER_PACK.json');

let _cachedPack: CharacterPack | null = null;

/**
 * Load the character pack from JSON. Caches after first load.
 * Returns null if file doesn't exist (graceful fallback).
 */
export function loadCharacterPack(packPath?: string): CharacterPack | null {
  if (_cachedPack) return _cachedPack;

  const filePath = packPath ?? DEFAULT_PACK_PATH;
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    _cachedPack = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CharacterPack;
    return _cachedPack;
  } catch {
    return null;
  }
}

// =============================================================================
// Character Selection
// =============================================================================

/**
 * Map an audience category (from offer.json) to an AD_CHARACTER_PACK angle ID.
 * This bridges the pipeline's awareness×category combos to the character pack's angle system.
 */
function mapCategoryToAngleIds(category: string): string[] {
  const mapping: Record<string, string[]> = {
    'friend':     ['A1', 'A7'],       // Forgotten Follow-Up, Before/After
    'old friend': ['A1', 'A7'],       // Same personal angles
    'family':     ['A1', 'A7'],       // Personal reconnect
    'crush':      ['A1', 'A7'],       // Personal + emotional
    'coworker':   ['A5', 'A6', 'A8'], // Card Scan, Network=Net Worth, Switcher
    'client':     ['A3', 'A4', 'A8'], // 3-Min Routine, AI Sounds Like You, Switcher
    'mentor':     ['A3', 'A4', 'A6'], // Business/professional angles
  };
  return mapping[category.toLowerCase()] ?? ['A1'];
}

/**
 * Select the best character for a given audience category and awareness stage.
 * Priority: primary_angles match > secondary_angles match > Maya (default hero).
 */
export function selectCharacter(
  pack: CharacterPack,
  category: string,
  awarenessStage?: string,
  preferredGender?: string,
): PackCharacter {
  const targetAngles = mapCategoryToAngleIds(category);

  // Filter by gender preference if specified
  let candidates = pack.characters;
  if (preferredGender) {
    const genderMatch = candidates.filter(c => c.gender === preferredGender);
    if (genderMatch.length > 0) candidates = genderMatch;
  }

  // Score each character: primary match = 3pts, secondary = 1pt
  const scored = candidates.map(c => {
    let score = 0;
    for (const angleId of targetAngles) {
      if (c.primary_angles.includes(angleId)) score += 3;
      else if (c.secondary_angles.includes(angleId)) score += 1;
    }
    // Bonus for unghosting role match
    const ugId = mapCategoryToUnghostingId(category);
    if (ugId && c.unghosting_roles.includes(ugId)) score += 2;
    return { character: c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return highest-scoring character, or Maya Brooks as default
  if (scored[0]?.score > 0) return scored[0].character;
  return pack.characters.find(c => c.id === 'CHR_MAYA_BROOKS') ?? pack.characters[0];
}

function mapCategoryToUnghostingId(category: string): string | null {
  const mapping: Record<string, string> = {
    'friend':     'UG_FRIEND',
    'old friend': 'UG_OLD_FRIEND',
    'family':     'UG_FAMILY',
    'crush':      'UG_CRUSH',
    'coworker':   'UG_COWORKER',
    'client':     'UG_CLIENT',
    'mentor':     'UG_MENTOR',
  };
  return mapping[category.toLowerCase()] ?? null;
}

// =============================================================================
// Prompt Block Assembly
// =============================================================================

/**
 * Build the full prompt for image generation using character pack blocks.
 * Follows the assembly order: [CONSISTENCY] + [CHARACTER] + [CONTEXT] + [NEGATIVE]
 */
export function buildCharacterImagePrompt(
  character: PackCharacter,
  globals: CharacterPackGlobals,
  sceneDescription: string,
  poseDescription?: string,
): string {
  const parts = [
    globals.consistency_block,
    character.identity_prompt_block,
    sceneDescription,
    poseDescription ?? '',
    `No subtitles. No on-screen text. No captions. No burned-in text of any kind.`,
    globals.negative_block,
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Build the consistency + negative blocks to inject into any video prompt.
 * These should be appended to every buildLipsyncPrompt() call.
 */
export function getConsistencyBlocks(globals: CharacterPackGlobals): {
  consistencyBlock: string;
  negativeBlock: string;
} {
  return {
    consistencyBlock: globals.consistency_block,
    negativeBlock: globals.negative_block,
  };
}

/**
 * Get the unghosting context prompt block for a given audience category.
 */
export function getUnghostingContext(
  pack: CharacterPack,
  category: string,
): string {
  const ugId = mapCategoryToUnghostingId(category);
  if (!ugId) return '';
  const ctx = pack.libraries.unghosting_contexts.find(c => c.id === ugId);
  return ctx?.prompt_block ?? '';
}

/**
 * Get the angle prompt block for the best matching angle.
 */
export function getAnglePromptBlock(
  pack: CharacterPack,
  category: string,
): string {
  const angleIds = mapCategoryToAngleIds(category);
  const angle = pack.libraries.angles.find(a => a.id === angleIds[0]);
  return angle?.prompt_block ?? '';
}

/**
 * Build a complete character identity string for use in buildLipsyncPrompt's
 * characterDescription parameter. Combines identity_prompt_block with
 * hair_lock and grooming details for maximum visual consistency.
 */
export function buildPackCharacterDescription(character: PackCharacter): string {
  const parts = [
    character.identity_prompt_block,
    `hair: ${character.hair_lock.default_style}, ${character.hair_lock.color}`,
    `grooming: ${character.grooming_makeup_lock.style}`,
  ];
  return parts.join('. ');
}
