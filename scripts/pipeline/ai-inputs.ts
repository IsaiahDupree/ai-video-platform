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
    pain_literally:  '"My [problem] was [bad]. [Product] literally saved me." — leads with pain, word "literally" makes it feel real',
    never_tried:     '"I\'ve never tried [product] before. Believe it or not." — removes sales pressure, creates curiosity gap',
    pov:             '"POV: You just discovered [solution to their pain]" — native TikTok/Reels format, puts viewer in experience',
    stop_scrolling:  '"Stop scrolling if you [have this exact problem]" — pattern interrupt, immediately qualifies viewer',
    social_proof:    '"[Number] people [did thing] and [result]" — FOMO + social proof, specific numbers feel credible (11x ROAS hook)',
  };

  return `You are a world-class direct response copywriter and UGC ad creative director.

You generate complete creative inputs for a 4-stage AI video ad pipeline:
  Stage 1: Imagen 4 — photorealistic before/after images
  Stage 2: Veo 3.1 — animated video with native audio
  Stage 3: ElevenLabs TTS — voiceover from script
  Stage 4: ffmpeg — final video with burned-in captions

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

HOOK FORMULA TO USE: ${hookFormula}
Formula pattern: ${hookFormulaGuide[hookFormula]}
Required hook line (MUST be the first line of voiceScript): "${hookLine}"

SCRIPT RULES (follow exactly):
${framework.scriptRules.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}
  ${framework.scriptRules.length + 1}. First line of voiceScript MUST be the hook line above — do not change it
  ${framework.scriptRules.length + 2}. No marketing buzzwords: revolutionary, cutting-edge, game-changing, innovative, seamless
  ${framework.scriptRules.length + 3}. Write numbers as words (two hundred dollars, not $200)
  ${framework.scriptRules.length + 4}. Max 15 words per line — split longer lines at natural comma/period
  ${framework.scriptRules.length + 5}. Last line must contain a clear CTA (link in bio, free trial, etc.)

Return a JSON object with EXACTLY these fields — no extras, no nesting changes:
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
  headline         — 5–8 words, punchy, no product name unless product-aware
  subheadline      — 10–15 words, supporting context
  beforeScenePrompt — Imagen 4 prompt: photorealistic UGC, real human (not celebrity), specific emotional state, phone in hand, authentic everyday setting, no text overlays, 3–4 sentences
  afterScenePrompt  — same character transformed: confident/relieved, using phone, warm lighting, 3–4 sentences
  motionPrompt      — Veo 3.1: camera movement, character action, NO audio/sound descriptions (stripped by pipeline), 2–3 sentences
  voiceScript       — lowercase throughout, commas for breathing pauses, period at end of each line, newline between lines, max 5 lines (important for lip-sync: fewer lines = fewer clips), each line is a standalone caption, follow ALL script rules exactly, FIRST LINE must be the required hook line
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
