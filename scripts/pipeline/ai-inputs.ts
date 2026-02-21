/**
 * AI Input Generator
 *
 * Uses OpenAI GPT-4o to convert an Offer + CreativeFramework
 * into fully-specified AngleInputs for all 4 pipeline stages.
 */

import * as https from 'https';
import type { Offer, CreativeFramework, AngleInputs } from './offer.schema.js';
import { type HookFormula, HOOK_PRIORITY_ORDER, buildHookLine, validateScript } from './prompt-builder.js';

export interface AIGenerationResult {
  inputs: AngleInputs;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// =============================================================================
// OpenAI chat completion (raw https — no SDK dependency)
// =============================================================================

async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  model = 'gpt-4o'
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');

  const body = JSON.stringify({
    model,
    messages,
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (!parsed.choices?.[0]) {
              reject(new Error(`OpenAI error: ${data.substring(0, 400)}`));
              return;
            }
            resolve({ content: parsed.choices[0].message.content, usage: parsed.usage });
          } catch {
            reject(new Error(`OpenAI parse error: ${data.substring(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// =============================================================================
// Build system prompt from offer + framework
// =============================================================================

/**
 * Get the structural framework instructions for a given awareness stage.
 * Based on Eugene Schwartz Awareness Ladder + AD_CREATIVE_FRAMEWORK.md:
 *   Unaware/Problem-Aware → PAS (Problem→Agitate→Solution)
 *   Solution-Aware → AIDA (Attention→Interest→Desire→Action)
 *   Product-Aware → 3 Features → 1 Outcome
 *   Most-Aware → 4Cs Objection Killer
 */
function getStageStructure(stage: string): { structure: string; stageRules: string } {
  const s = stage.toLowerCase();
  if (s === 'unaware' || s === 'problem-aware') {
    return {
      structure: `This is a PAS (Problem → Agitate → Solution) script for ${s} viewers.
They ${s === 'unaware' ? "don't know they have a problem yet" : 'feel the pain but don\'t know the fix'}.

  Line 1 — HOOK (0-2s): The required hook line. Pattern interrupt that qualifies the viewer.
  Line 2 — MIRROR + ENEMY (2-5s): Make them feel seen, then name the REAL cause.
    "you know that feeling when X happens, and the real problem is Y."
    Name the enemy (old habits, lack of system, wrong approach) — not just the symptom.
  Line 3 — MECHANISM (5-8s): How the solution works in one natural sentence.
    "but then i found something that does Y for me, without the effort."
    Do NOT name the product${s === 'unaware' ? '' : ' unless absolutely necessary'}.
  Line 4 — PROOF (8-12s): One specific, believable result with a timeframe.
    "after two weeks, i'd reconnected with twelve people i thought i'd lost."
  Line 5 — CTA (12-15s): Soft, curiosity-driven.
    "link in bio if you want to try it." or "comment [keyword] and i'll send it."`,
      stageRules: s === 'unaware'
        ? '- NEVER mention the product by name. The viewer doesn\'t know it exists.\n- Focus on making the pain vivid and relatable. Let curiosity drive the CTA.'
        : '- Validate the pain first. Reframe it as a systems problem, not a personal failing.\n- Product name is optional — only if it feels natural.',
    };
  }
  if (s === 'solution-aware') {
    return {
      structure: `This is an AIDA (Attention → Interest → Desire → Action) script.
The viewer knows solutions exist and is evaluating. Show WHY this one is different.

  Line 1 — ATTENTION / HOOK (0-2s): The required hook line.
  Line 2 — INTEREST (2-5s): How it works — the mechanism, not features.
    "it works by doing X, so you get Y without Z."
  Line 3 — DESIRE (5-8s): Paint the "after" life. What it feels like.
    "imagine not worrying about X anymore."
  Line 4 — PROOF (8-12s): Specific, concrete result with a timeframe.
  Line 5 — ACTION / CTA (12-15s): Clear next step.
    "start the free trial." or "link in bio to see how it works."`,
      stageRules: '- You can mention the product category but keep it natural.\n- Focus on the mechanism (how it works) — that\'s what this viewer needs to decide.',
    };
  }
  if (s === 'product-aware') {
    return {
      structure: `This is a Features → Outcome script. The viewer knows the product.
Show features, then connect them to ONE clear transformation.

  Line 1 — HOOK (0-2s): The required hook line.
  Line 2 — FEATURE 1 (2-5s): "it does X, which means Y."
  Line 3 — FEATURE 2 (5-8s): "plus, it also Z."
  Line 4 — OUTCOME (8-12s): One transformation that combines features.
    "the result? i went from A to B in [timeframe]."
  Line 5 — CTA (12-15s): Direct.
    "start your free trial today." or "link in bio."`,
      stageRules: '- Name the product. Show specific features.\n- Connect features to one clear outcome the viewer wants.',
    };
  }
  // most-aware or default
  return {
    structure: `This is a 4Cs Objection Killer script. The viewer knows the product but hasn't bought.
Every sentence must be Clear, Concise, Compelling, and Credible.

  Line 1 — HOOK (0-2s): Address the #1 objection head-on.
  Line 2 — PROOF (2-5s): Specific credibility signal (number, timeframe, guarantee).
  Line 3 — DIFFERENTIATOR (5-8s): What makes it different from alternatives.
  Line 4 — URGENCY (8-12s): Truthful scarcity or deadline (only if real).
  Line 5 — CTA (12-15s): Hardest possible. "use code X" or "offer ends friday."`,
    stageRules: '- Name the product. Be direct and specific.\n- Handle the top objection in the first line.\n- Only use urgency/scarcity if it\'s truthful.',
  };
}

function buildSystemPrompt(offer: Offer, framework: CreativeFramework, hookFormula: HookFormula, hookLine: string, awarenessStage: string): string {
  const hookFormulaGuide: Record<HookFormula, string> = {
    problem_solution:  '"If you struggle with X, try this." — #1 converting UGC format. Viewer thinks "that\'s my problem" and keeps watching.',
    testimonial:       '"I didn\'t expect this to work, but I\'m actually shocked." — curiosity + honesty. Viewer wonders why you\'re shocked.',
    social_proof:      '"[Number] people tried this and the results are insane." — FOMO + credibility, specific numbers feel real.',
    founder_story:     '"I built this because I was tired of X." — founder origin story, builds trust through shared frustration.',
    curiosity_gap:     '"Here\'s what no one tells you about X." — authority + intrigue, viewer needs to know the secret.',
  };

  const { structure, stageRules } = getStageStructure(awarenessStage);

  return `You are a world-class UGC ad scriptwriter. You write scripts that sound like a real person talking to a friend, not like an ad. Your scripts follow proven conversion frameworks (PAS, AIDA, 4Cs) mapped to the viewer's awareness stage.

You generate complete creative inputs for an AI video ad pipeline.

OFFER:
  Product: ${offer.productName}
  Tagline: ${offer.tagline}
  Problem: ${offer.problemSolved}
  Audience: ${offer.targetAudience}
  Features: ${offer.keyFeatures.join(' | ')}
  Social Proof: ${offer.socialProof ?? 'N/A'}
  CTA: ${offer.cta}
  ${offer.pricePoint ? `Price: ${offer.pricePoint}` : ''}

VISUAL STYLE: ${framework.visualStyle}
VOICE TONE: ${framework.voiceTone}

== AWARENESS STAGE: ${awarenessStage.toUpperCase()} ==
${stageRules}

== HOOK FORMULA ==
Formula: ${hookFormula}
Pattern: ${hookFormulaGuide[hookFormula]}
Required hook line (MUST be line 1 of voiceScript exactly as written): "${hookLine}"

== SCRIPT STRUCTURE (${awarenessStage.toUpperCase()}) ==
${structure}

== UNIVERSAL AD SKELETON ==
Every great UGC ad follows this 6-beat skeleton (compressed into 5 lines above):
  1. HOOK — pattern interrupt, qualify the viewer in one line
  2. MIRROR — make the viewer feel seen ("you know that feeling...")
  3. NAME ENEMY — name the real cause, not the symptom
  4. MECHANISM — how the solution works (one sentence, not a feature list)
  5. PROOF — one specific believable result with a timeframe
  6. CTA — one action step

== FATE QUALITY CHECK ==
Before writing, verify your script passes all four:
  F — FAMILIARITY: Does the viewer recognize themselves in the first 2 seconds?
  A — AUTHORITY: Is there a reason to believe this person knows what they're talking about?
  T — TRUST: Is there proof? (specific result, timeframe, social proof)
  E — EMOTION: Does the script make the viewer feel something? (relief, curiosity, hope)
If any score is 0, rewrite that part.

== SCRIPT QUALITY RULES ==
  - Write like a real person talking to a friend. Not an ad. Not a pitch.
  - Each line must be a complete thought that makes grammatical sense on its own.
  - Use "you" and "I" — never "people" or "they" or "one".
  - Lowercase throughout. Commas for natural breathing pauses. Period at end.
  - Max 12 words per line.
  - No marketing buzzwords: revolutionary, cutting-edge, game-changing, innovative, seamless.
  - Write numbers as words (fifty thousand, not 50,000).
  - Lines MUST flow as a conversation — each follows logically from the last.
  - Tell a mini-story: one pain → one shift → one result → one action.
  - Don't cram everything into one script. One transformation per ad.

== BAD vs GOOD EXAMPLES ==
BAD (disconnected, robotic, no story):
  "my staying was ruining my life. this literally saved me."
  "you hate losing deals, every time you try to connect."
  "your prospects grow colder, while your stress level rises."
  "it's hard keeping up, with endless emails and calls."
  "link in bio."

GOOD (natural flow, real person, mini-story):
  "if you struggle with keeping up with your network, try this."
  "i used to lose track of people who mattered, and the real problem was i had no system."
  "but then i found something that keeps me connected without the daily grind."
  "after two weeks, i'd reconnected with twelve people i thought i'd lost."
  "link in bio if you want to try it."

OFFER-SPECIFIC SCRIPT RULES:
${framework.scriptRules.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}
  ${framework.scriptRules.length + 1}. First line of voiceScript MUST be the hook line above — do not change it
  ${framework.scriptRules.length + 2}. Last line must contain a clear CTA

Return a JSON object with EXACTLY these fields:
{
  "angleId": string,
  "awarenessStage": string,
  "audienceCategory": string,
  "headline": string,
  "subheadline": string,
  "beforeScenePrompt": string,
  "afterScenePrompt": string,
  "motionPrompt": string,
  "voiceScript": string,
  "commentKeyword": string,
  "rationale": string
}

Field guidance:
  headline         — 5–8 words, punchy, no product name unless product-aware stage
  subheadline      — 10–15 words, supporting context
  beforeScenePrompt — Imagen 4 prompt: photorealistic UGC, real human (not celebrity), specific emotional state, phone in hand, authentic everyday setting, no text overlays, 3–4 sentences
  afterScenePrompt  — same character transformed: confident/relieved, using phone, warm lighting, 3–4 sentences. MUST be the same person as beforeScenePrompt.
  motionPrompt      — Veo 3.1: camera movement, character action, NO audio/sound descriptions (stripped by pipeline), 2–3 sentences
  voiceScript       — 5 lines following the SCRIPT STRUCTURE above. Each line separated by newline. Follow ALL rules.
  commentKeyword    — 1–2 words for comment CTA engagement`;
}

// =============================================================================
// Main export
// =============================================================================

export async function generateAngleInputs(
  offer: Offer,
  framework: CreativeFramework,
  awarenessStage: string,
  audienceCategory: string,
  angleId: string,
  hookFormula?: HookFormula,
  angleContext?: string,
): Promise<AIGenerationResult> {
  // Select hook formula: use provided, or pick from priority order based on angleId index
  const angleIndex = parseInt(angleId.replace(/\D/g, ''), 10) || 0;
  const selectedFormula: HookFormula = hookFormula ?? HOOK_PRIORITY_ORDER[angleIndex % HOOK_PRIORITY_ORDER.length];
  const hookLine = buildHookLine(selectedFormula, offer);

  const systemPrompt = buildSystemPrompt(offer, framework, selectedFormula, hookLine, awarenessStage);

  const angleContextBlock = angleContext
    ? `\n\nCREATIVE ANGLE: ${angleContext}\nThe script should be built around this specific scenario/angle. Make the pain point, proof, and CTA relevant to this angle.`
    : '';

  const userPrompt = `Generate creative inputs for:
  Angle ID: ${angleId}
  Awareness Stage: ${awarenessStage}
  Audience Category: ${audienceCategory}
  Hook Formula: ${selectedFormula}
  Required Hook Line: "${hookLine}"${angleContextBlock}

The before scene should viscerally show the pain point for a ${audienceCategory} relationship.
The after scene shows the same character transformed — same face, same setting, different emotional state.
The voice script must feel like a real person talking, not an ad. First line MUST be the required hook line. Follow ALL script rules.`;

  const { content, usage } = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  const raw = JSON.parse(content) as AngleInputs;

  // Force-inject the pre-built hook line as line 1 — GPT sometimes rewrites it longer
  let voiceScript = raw.voiceScript ?? '';
  if (voiceScript) {
    const lines = voiceScript.split('\n').map((l) => l.trim()).filter(Boolean);
    lines[0] = hookLine; // always use our validated hook, never GPT's rewrite
    voiceScript = lines.join('\n');
  }

  const inputs: AngleInputs = {
    ...raw,
    voiceScript,
    angleId,
    awarenessStage,
    audienceCategory,
  };

  // Validate generated script against Veo3 best practices
  if (inputs.voiceScript) {
    const scriptLines = inputs.voiceScript.split('\n').map((l) => l.trim()).filter(Boolean);
    const validation = validateScript(scriptLines);
    if (validation.errors.length > 0) {
      console.log(`   ⚠️  Script validation errors (${validation.errors.length}):`);
      for (const err of validation.errors) console.log(`      ✗ ${err}`);
    }
    if (validation.warnings.length > 0) {
      console.log(`   💡 Script warnings (${validation.warnings.length}):`);
      for (const w of validation.warnings) console.log(`      ⚡ ${w}`);
    }
    if (validation.valid) {
      console.log(`   ✅ Script validation passed`);
    }
  }

  // Note: lipsyncPrompts are no longer pre-generated here.
  // stage-lipsync.ts always rebuilds prompts with the locked character description
  // derived from before.png via GPT-4o vision — pre-generated prompts would use
  // a generic character description that doesn't match the actual generated image.

  return {
    inputs,
    model: 'gpt-4o',
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.prompt_tokens + usage.completion_tokens,
  };
}
