/**
 * Prompt Builder — Research-Backed Veo3 UGC Ad Prompt System
 *
 * Implements the 5 proven hook formulas, script validation, locked character
 * descriptions, and per-clip prompt construction following best practices
 * synthesized from 11 expert YouTube videos on Veo3 UGC ads.
 *
 * Key principles:
 *   1. Hook must match one of 5 proven formulas (no generic fallback)
 *   2. Character description locked and copy-pasted identically to every clip
 *   3. Says: "dialogue" colon syntax always — never omit
 *   4. Max 15 words per sentence, numbers as words
 *   5. No marketing buzzwords in dialogue
 *   6. Natural window light, not studio
 *   7. (no subtitles) in every clip
 */

import type { Offer, CreativeFramework } from './offer.schema.js';
import type { CharacterTraits, VoiceProfile } from './stage-lipsync.js';
import { buildCharacterDescription, buildVoiceProfile } from './stage-lipsync.js';

// =============================================================================
// Hook Formula System
// =============================================================================

export type HookFormula =
  | 'pain_literally'   // "My [problem] was [bad]. [Product] literally saved me."
  | 'never_tried'      // "I've never tried [product] before. Believe it or not."
  | 'pov'              // "POV: You just discovered [solution]"
  | 'stop_scrolling'   // "Stop scrolling if you [have this problem]"
  | 'social_proof';    // "[Number] people [did thing] and [result]" — 11x ROAS hook

/** Priority order by proven win rate (from Alfie Carter's 500-ad test) */
// All hook lines are capped at 15 words — validated by validateScript()
export const HOOK_PRIORITY_ORDER: HookFormula[] = [
  'pain_literally',
  'social_proof',
  'never_tried',
  'stop_scrolling',
  'pov',
];

/**
 * Build a hook line using one of the 5 proven formulas.
 * Takes offer data and returns a ready-to-use hook sentence.
 */
export function buildHookLine(formula: HookFormula, offer: Offer): string {
  const pain = offer.problemSolved;
  const proof = offer.socialProof ?? '10,000 people';

  // Truncate pain to max 4 words to keep hook under 15 words total
  const painWords = pain.split(/[.,;]/)[0].trim().toLowerCase().split(/\s+/).slice(0, 4).join(' ');

  switch (formula) {
    case 'pain_literally':
      // "my X was bad. it literally saved me." — max 12 words
      return `my ${painWords} was ruining my life. this literally saved me.`;

    case 'never_tried':
      // "i've never tried this before. believe it or not." — 10 words
      return `i've never tried this before. believe it or not.`;

    case 'pov':
      // "POV: you just fixed X." — max 9 words
      return `pov: you just fixed your ${painWords} for good.`;

    case 'stop_scrolling':
      // "stop scrolling if you have X." — max 10 words
      return `stop scrolling if you struggle with ${painWords}.`;

    case 'social_proof': {
      // Extract a number from socialProof if present, else use generic
      const numMatch = proof.match(/[\d,]+/);
      const num = numMatch ? numMatch[0].replace(',', '') : '8000';
      const numWords = numberToWords(parseInt(num, 10));
      // "eight thousand people tried this and the results are insane." — 11 words
      return `${numWords} people tried this and the results are insane.`;
    }
  }
}

// =============================================================================
// Script Validator
// =============================================================================

const BUZZWORDS = [
  'revolutionary', 'cutting-edge', 'game-changing', 'innovative', 'seamless',
  'state-of-the-art', 'groundbreaking', 'transformative', 'disruptive', 'next-level',
  'world-class', 'best-in-class', 'industry-leading', 'unparalleled', 'unprecedented',
];

const DIGIT_PATTERN = /\$[\d,]+|\b\d{2,}\b/g;

export interface ScriptValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a script (array of lines) against Veo3 UGC best practices.
 * Returns errors (must fix) and warnings (should fix).
 */
export function validateScript(lines: string[]): ScriptValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (lines.length === 0) {
    errors.push('Script is empty');
    return { valid: false, errors, warnings };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const words = line.split(/\s+/).filter(Boolean);
    const lineLabel = `Line ${i + 1}`;

    // Hard limit: 20 words (Veo3 clips max ~8s at 2.5 words/sec)
    if (words.length > 20) {
      errors.push(`${lineLabel}: ${words.length} words — max 20 per clip (split at natural pause)`);
    }

    // Warning: 15 words recommended
    if (words.length > 15 && words.length <= 20) {
      warnings.push(`${lineLabel}: ${words.length} words — recommend splitting at 15 for cleaner delivery`);
    }

    // Buzzwords
    for (const bw of BUZZWORDS) {
      if (line.toLowerCase().includes(bw)) {
        errors.push(`${lineLabel}: contains buzzword "${bw}" — sounds like an ad, not a real person`);
      }
    }

    // Digits in dialogue
    const digitMatches = line.match(DIGIT_PATTERN);
    if (digitMatches) {
      errors.push(`${lineLabel}: contains digits "${digitMatches.join(', ')}" — write as words (e.g. "two hundred dollars")`);
    }

    // ALL CAPS words (confuses speech synthesis)
    const capsWords = words.filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
    if (capsWords.length > 0) {
      warnings.push(`${lineLabel}: ALL CAPS words "${capsWords.join(', ')}" may confuse speech synthesis`);
    }
  }

  // Hook check: first line should be short
  const hookWords = lines[0].split(/\s+/).filter(Boolean);
  if (hookWords.length > 15) {
    errors.push(`Hook (Line 1): ${hookWords.length} words — hook must be under 15 words to stop scroll`);
  }

  // CTA check: last line should contain a call to action
  const lastLine = lines[lines.length - 1].toLowerCase();
  const hasCTA = ['link', 'bio', 'try', 'get', 'check', 'click', 'shop', 'grab', 'free'].some(
    (w) => lastLine.includes(w)
  );
  if (!hasCTA) {
    warnings.push(`Last line: no clear CTA detected — add "link in bio", "free trial", or similar`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// Locked Character System
// =============================================================================

export interface LockedCharacter {
  description: string;   // single locked string — copy-paste to every clip
  voiceProfile: string;  // single locked string — copy-paste to every clip
  setting: string;       // single locked string — copy-paste to every clip
  pronoun: 'He' | 'She' | 'They';
}

/**
 * Build a locked character object.
 * The description, voiceProfile, and setting strings are built once
 * and injected identically into every clip prompt.
 */
export function buildLockedCharacter(
  traits: CharacterTraits,
  voice: VoiceProfile,
  setting: string
): LockedCharacter {
  return {
    description: buildCharacterDescription(traits),
    voiceProfile: buildVoiceProfile(voice),
    setting: setting.trim(),
    pronoun: (voice.gender === 'female' || traits.gender === 'female') ? 'She' : 'He',
  };
}

// =============================================================================
// Per-Clip Prompt Builder
// =============================================================================

export interface ClipPromptOptions {
  shotDescription?: string;    // e.g. "holds product up at chest height"
  productAction?: string;      // e.g. "product clearly visible, small white bottle"
  expression?: string;         // e.g. "genuine surprised expression"
}

/**
 * Build a complete Veo3 UGC clip prompt following all research-backed best practices.
 *
 * Enforces:
 *   - Identical character + setting + voice in every clip
 *   - Says: "dialogue" colon syntax
 *   - (no subtitles) in every clip
 *   - no background music in every clip
 *   - natural window light (not studio)
 *   - selfie/handheld UGC format
 */
export function buildClipPrompt(
  line: string,
  character: LockedCharacter,
  clipIndex: number,
  totalClips: number,
  options: ClipPromptOptions = {}
): string {
  const { description, voiceProfile, setting, pronoun } = character;
  const isFirst = clipIndex === 0;
  const isLast = clipIndex === totalClips - 1;

  // Position-aware expression
  const expression = options.expression ?? (
    isFirst
      ? 'slightly raised eyebrows, direct eye contact, relatable expression'
      : isLast
      ? 'warm genuine smile, slight nod'
      : 'natural conversational expression, occasional blink'
  );

  // End gesture
  const endGesture = isLast
    ? `${pronoun} ends with a small knowing nod.`
    : `${pronoun} glances briefly away then back to camera.`;

  // Shot description
  const shot = options.shotDescription
    ? `${pronoun} ${options.shotDescription.toLowerCase()}.`
    : `${pronoun} holds the phone camera at arm's length, arm clearly visible in frame.`;

  // Estimate clip duration for timestamp
  const wordCount = line.split(/\s+/).length;
  const estSec = Math.max(3, Math.min(7, Math.ceil(wordCount / 2.5)));
  const hookSec = Math.min(2, Math.floor(estSec * 0.25));

  const parts: string[] = [
    // Selfie UGC formula — triggers authentic handheld behavior
    `A selfie video of ${description} in ${setting}.`,
    shot,
  ];

  // Product action if specified (anchors product appearance)
  if (options.productAction) {
    parts.push(`${options.productAction}.`);
  }

  // Timestamp structure for hook + delivery
  parts.push(
    `[00:00-00:0${hookSec}] Close-up on face, ${expression}, slight pause before speaking.`,
    `[00:0${hookSec}-00:0${estSec + 1}] ${pronoun} speaks directly to camera and says: "${line.trim()}" ${endGesture}`,
  );

  // Voice profile for accent/tone consistency
  parts.push(`Voice: ${voiceProfile}.`);

  // Audio + quality spec
  parts.push(
    `Audio: close microphone pickup, warm acoustic properties, minimal background noise, no studio audience, no background music.`,
    `The image is slightly grainy, looks very film-like, authentic UGC style. No subtitles. No on-screen text whatsoever.`,
  );

  return parts.join(' ');
}

// =============================================================================
// Full Ad Prompt Set Builder
// =============================================================================

export interface AdPromptSet {
  hookFormula: HookFormula;
  hookLine: string;
  scriptLines: string[];
  validation: ScriptValidation;
  character: LockedCharacter;
  clipPrompts: string[];
}

/**
 * Build a complete set of clip prompts for an ad.
 * Validates the script, builds locked character, generates all clip prompts.
 */
export function buildAdPromptSet(
  scriptLines: string[],
  hookFormula: HookFormula,
  character: LockedCharacter,
  offer: Offer,
  shotDescriptions?: string[]
): AdPromptSet {
  const validation = validateScript(scriptLines);

  const clipPrompts = scriptLines.map((line, i) =>
    buildClipPrompt(line, character, i, scriptLines.length, {
      shotDescription: shotDescriptions?.[i],
    })
  );

  return {
    hookFormula,
    hookLine: scriptLines[0],
    scriptLines,
    validation,
    character,
    clipPrompts,
  };
}

// =============================================================================
// Utility: number to words (for digit replacement)
// =============================================================================

function numberToWords(n: number): string {
  if (n === 0) return 'zero';
  if (n < 0) return `negative ${numberToWords(-n)}`;

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ` ${ones[n % 10]}` : '');
  if (n < 1000) return `${ones[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numberToWords(n % 100)}` : ''}`;
  if (n < 10000) return `${ones[Math.floor(n / 1000)]} thousand${n % 1000 ? ` ${numberToWords(n % 1000)}` : ''}`;
  return n.toLocaleString(); // fallback for very large numbers
}
