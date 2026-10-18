// Real LLM calls for the duration-constrained script engine.
// Reuses the proven cheap-real-call pattern from this session's own reliability work:
// intel-node/connectors/content_crosspost.py's repurpose() — model "gpt-5.4-nano",
// reasoning_effort "low", chat.completions.create. No mock/template fallback for the
// script content itself — if the LLM call fails, this throws (per the ecosystem's
// "never fake a success" rule), the caller decides whether to retry or abort the run.
import OpenAI from 'openai';
import type { RetentionSection, SectionShapeEntry } from './types.ts';

const DRAFT_MODEL = 'gpt-5.4-nano';

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set — cannot draft real script content.');
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

function extractJson(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`LLM response did not contain a JSON object: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

/** gpt-5.4-nano at reasoning_effort "low" occasionally returns empty content on longer
 * prompts (reasoning tokens can consume the completion budget before any visible output
 * — a known low-reasoning-effort flakiness, not a script bug). Retry the SAME real call
 * once; never fabricate a fallback body — a second failure still throws. */
async function callDraftModel(systemPrompt: string, userPrompt: string): Promise<any> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await client().chat.completions.create({
        model: DRAFT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 1500,
        reasoning_effort: 'low',
      });
      const raw = resp.choices[0]?.message?.content || '';
      return extractJson(raw);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export interface DraftSectionInput {
  topic: string;
  audience: string;
  shape: SectionShapeEntry;
  targetWords: number;
  priorSummary: string; // short summary of prior sections, to keep narrative coherent + non-repetitive
  isFirst: boolean;
  isLast: boolean;
}

const SYSTEM_PROMPT = `You write retention-optimized YouTube narration for a technical/AI-automation
explainer channel. Voice: concrete, proof-driven, no filler, no generic AI phrasing
(never say things like "in today's fast-paced world", "let's dive in", "unlock the power of",
"game changer", "delve into"). Every section must advance the argument — never restate a
prior section's point. Return ONLY a single JSON object, no markdown fences, no preamble.`;

export async function draftSection(input: DraftSectionInput): Promise<RetentionSection> {
  const userPrompt = `Topic: "${input.topic}"
Audience: ${input.audience}
This section's narrative purpose: ${input.shape.purpose}
This section's retention device to use: ${input.shape.retention_device}
Target spoken-word count for THIS section: ${input.targetWords} words (aim close to this; this
maps directly to a time budget via measured narration speed, so word count matters).
${input.isFirst ? 'This is the OPENING section — it must state a concrete value promise within the first two sentences (what the viewer will walk away able to do/understand), not a generic greeting.' : ''}
${input.isLast ? 'This is the CLOSING section — resolve any open loop from earlier and give one concrete next action (not a generic subscribe plea).' : ''}
What has already been said in prior sections (do not repeat these points, build on them):
${input.priorSummary || '(nothing yet — this is the first section)'}

Return a single JSON object with exactly these fields:
{
  "spoken_text": "the actual narration text to be read aloud, ~${input.targetWords} words",
  "visual_promise": "one sentence describing what should be ON SCREEN while this is spoken (concrete: a dashboard, a diagram, a before/after, a stat — not decorative)",
  "open_loop": "one sentence naming a curiosity gap this section opens or resolves (empty string if none)",
  "energy": 0.0
}
"energy" is a 0-1 estimate of this section's intended pacing/intensity (hook/proof-reveal sections run high 0.7-0.9, context/setup sections run lower 0.3-0.5).`;

  const parsed = await callDraftModel(SYSTEM_PROMPT, userPrompt);

  return {
    scene_id: input.shape.id,
    purpose: input.shape.purpose,
    spoken_text: String(parsed.spoken_text || '').trim(),
    visual_promise: String(parsed.visual_promise || '').trim(),
    retention_device: input.shape.retention_device,
    open_loop: String(parsed.open_loop || '').trim(),
    energy: typeof parsed.energy === 'number' ? parsed.energy : 0.5,
    target_seconds: 0, // filled by caller
    flexible: input.shape.flexible,
  };
}

export interface ReviseSectionInput extends DraftSectionInput {
  previousText: string;
  previousActualSeconds: number;
  targetSeconds: number;
  // The next word-count target, computed by the caller (script-engine.ts) from a
  // real (words, measured-seconds) history for THIS section — see
  // estimateWordsForTarget's two-point linear fit, which accounts for ElevenLabs'
  // fixed per-clip overhead instead of assuming duration is proportional to word
  // count through the origin (a naive wpm-ratio model systematically undershoots
  // compression on short sections because of that fixed overhead).
  newTargetWords: number;
}

export async function reviseSection(input: ReviseSectionInput): Promise<RetentionSection> {
  const direction = input.previousActualSeconds > input.targetSeconds ? 'COMPRESS' : 'EXPAND';
  const deltaSeconds = Math.abs(input.previousActualSeconds - input.targetSeconds);
  const newTargetWords = input.newTargetWords;

  const userPrompt = `Topic: "${input.topic}"
This section's narrative purpose: ${input.shape.purpose}
This section's retention device: ${input.shape.retention_device}

Previous draft of this section's spoken_text (measured at ${input.previousActualSeconds.toFixed(
    2
  )}s of real synthesized audio against a target of ${input.targetSeconds.toFixed(2)}s —
that's ${deltaSeconds.toFixed(2)}s too ${direction === 'COMPRESS' ? 'long' : 'short'}):
"""
${input.previousText}
"""

${direction} this section to approximately ${newTargetWords} words (this word count was computed
from THIS section's own measured narration speed, not a generic estimate). Preserve the same
narrative purpose, retention device, and core content/claims — ${
    direction === 'COMPRESS'
      ? 'cut filler and redundant clauses, keep every concrete claim/proof point'
      : 'add one more concrete detail, example, or clarifying clause — do not pad with filler'
  }. Do not introduce generic AI phrasing.

Return a single JSON object with exactly these fields:
{
  "spoken_text": "the revised narration text, ~${newTargetWords} words",
  "visual_promise": "one sentence describing what should be ON SCREEN",
  "open_loop": "one sentence naming a curiosity gap (empty string if none)",
  "energy": 0.0
}`;

  const parsed = await callDraftModel(SYSTEM_PROMPT, userPrompt);

  return {
    scene_id: input.shape.id,
    purpose: input.shape.purpose,
    spoken_text: String(parsed.spoken_text || '').trim(),
    visual_promise: String(parsed.visual_promise || '').trim(),
    retention_device: input.shape.retention_device,
    open_loop: String(parsed.open_loop || '').trim(),
    energy: typeof parsed.energy === 'number' ? parsed.energy : 0.5,
    target_seconds: 0,
    flexible: input.shape.flexible,
  };
}

export function summarizeForContext(sections: RetentionSection[]): string {
  return sections
    .filter((s) => s.spoken_text)
    .map((s) => `- [${s.scene_id}] ${s.spoken_text.slice(0, 160)}`)
    .join('\n');
}
