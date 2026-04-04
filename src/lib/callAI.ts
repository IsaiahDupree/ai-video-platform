/**
 * callAI.ts — Claude API wrapper for IsaiahReelDecisionEngine.
 *
 * Signature matches: (prompt: string) => Promise<string>
 * Uses Anthropic API directly via fetch — no SDK dependency required.
 *
 * Usage:
 *   import { makeCallAI } from './callAI';
 *   const callAI = makeCallAI();
 *   await orchestrateReelJob({ ..., callAI });
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001"; // fast + cheap for caption/strap generation

export interface CallAIOptions {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Returns a callAI function wired to the Anthropic API.
 * apiKey falls back to ANTHROPIC_API_KEY env var (for Node/server contexts)
 * or can be injected explicitly.
 */
export function makeCallAI(options: CallAIOptions = {}): (prompt: string) => Promise<string> {
  const apiKey =
    options.apiKey ??
    (typeof process !== "undefined" ? process.env.ANTHROPIC_API_KEY : undefined);

  if (!apiKey) {
    // Return a no-op that returns empty string — composition still renders,
    // just without AI-generated strap/captions.
    console.warn("[callAI] No ANTHROPIC_API_KEY found — AI text generation disabled");
    return async (_prompt: string) => "";
  }

  const model = options.model ?? MODEL;
  const maxTokens = options.maxTokens ?? 512;
  const systemPrompt =
    options.systemPrompt ??
    "You are a short-form video content writer. Reply with the requested text only — no preamble, no quotes, no markdown.";

  return async (prompt: string): Promise<string> => {
    const resp = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Anthropic API error ${resp.status}: ${body.slice(0, 200)}`);
    }

    const data = await resp.json() as {
      content: Array<{ type: string; text: string }>;
    };
    return data.content.find((b) => b.type === "text")?.text?.trim() ?? "";
  };
}
