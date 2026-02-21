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

function buildSystemPrompt(offer: Offer, framework: CreativeFramework, hookFormula: HookFormula, hookLine: string): string {
  const hookFormulaGuide: Record<HookFormula, string> = {
    problem_solution:  '"If you struggle with X, try this." — #1 converting UGC format. Viewer thinks "that\'s my problem" and keeps watching.',
    testimonial:       '"I didn\'t expect this to work, but I\'m actually shocked." — curiosity + honesty. Viewer wonders why you\'re shocked.',
    social_proof:      '"[Number] people tried this and the results are insane." — FOMO + credibility, specific numbers feel real.',
    founder_story:     '"I built this because I was tired of X." — founder origin story, builds trust through shared frustration.',
    curiosity_gap:     '"Here\'s what no one tells you about X." — authority + intrigue, viewer needs to know the secret.',
  };

  return `You are a world-class UGC ad scriptwriter. You write scripts that sound like a real person talking to a friend, not like an ad. Your scripts follow proven conversion frameworks used by top DTC brands.

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

== HOOK FORMULA ==
Formula: ${hookFormula}
Pattern: ${hookFormulaGuide[hookFormula]}
Required hook line (MUST be line 1 of voiceScript exactly as written): "${hookLine}"

== PROVEN UGC SCRIPT STRUCTURE ==
Every script MUST follow this 5-part structure. Each part = one line of voiceScript:

  Line 1 — HOOK (0-2s): The required hook line above. Grabs attention immediately.
  Line 2 — RELATABLE PROBLEM (2-5s): Make the viewer feel seen. "I swear I dealt with X for so long, and nothing made it easier." or "you know that feeling when X happens, and you just can't Y."
  Line 3 — PRODUCT MOMENT / SHIFT (5-8s): Introduce the solution naturally. "but then I found something that actually works." or "and here is where it gets interesting." Do NOT sound salesy.
  Line 4 — PROOF / BENEFIT (8-12s): One specific, believable result. "after two weeks, I noticed X. and the biggest difference was Y." Use real-sounding details, not vague claims.
  Line 5 — CTA (12-15s): Clear, soft call to action. "link in bio." or "comment [keyword] and i'll send you the link."

SCRIPT QUALITY RULES:
  - Write like a real person talking, not an ad. Imagine explaining this to a friend.
  - Each line must be a complete thought that makes grammatical sense on its own.
  - Use "you" and "I" — never "people" or "they" or "one".
  - Lowercase throughout. Add commas for natural breathing pauses.
  - Max 12 words per line. Period at end of each line.
  - No marketing buzzwords: revolutionary, cutting-edge, game-changing, innovative, seamless.
  - Write numbers as words (fifty thousand, not 50,000).
  - Lines must flow as a conversation — each line should follow logically from the previous one.
  - The script should tell a mini-story: problem → discovery → result → action.

BAD SCRIPT EXAMPLE (disconnected fragments, no flow):
  "my staying was ruining my life. this literally saved me."
  "you hate losing deals, every time you try to connect."
  "your prospects grow colder, while your stress level rises."
  "it's hard keeping up, with endless emails and calls."
  "link in bio."
  ^ This is TERRIBLE. Lines don't connect. "my staying" makes no sense. Sounds robotic.

GOOD SCRIPT EXAMPLE (natural flow, real person talking):
  "if you struggle with keeping up with your network, try this."
  "i used to lose track of people who mattered, clients, old friends, everyone."
  "but then i found something that actually keeps me connected without the effort."
  "after two weeks, i'd reconnected with twelve people i thought i'd lost."
  "link in bio if you want to try it."
  ^ This flows naturally. Each line builds on the last. Sounds like a real person.

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
  voiceScript       — 5 lines following the PROVEN UGC SCRIPT STRUCTURE above. Each line separated by newline. Follow ALL rules.
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
): Promise<AIGenerationResult> {
  // Select hook formula: use provided, or pick from priority order based on angleId index
  const angleIndex = parseInt(angleId.replace(/\D/g, ''), 10) || 0;
  const selectedFormula: HookFormula = hookFormula ?? HOOK_PRIORITY_ORDER[angleIndex % HOOK_PRIORITY_ORDER.length];
  const hookLine = buildHookLine(selectedFormula, offer);

  const systemPrompt = buildSystemPrompt(offer, framework, selectedFormula, hookLine);

  const userPrompt = `Generate creative inputs for:
  Angle ID: ${angleId}
  Awareness Stage: ${awarenessStage}
  Audience Category: ${audienceCategory}
  Hook Formula: ${selectedFormula}
  Required Hook Line: "${hookLine}"

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
