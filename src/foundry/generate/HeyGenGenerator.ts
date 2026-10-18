// HeyGen A-roll generator — the request builder + cost model. The builder is
// pure & testable (no network); execution reuses the working call in
// scripts/resolve-video-source.ts (POST /v2/video/generate → poll → Supabase).
//
// v3 migration compliance: the `engine` property is now an OBJECT ({type:"avatar_v"}),
// not a string — a breaking change (May 2026). Omitting it defaults to Avatar IV.
// v1/v2 endpoints are supported only through Oct 31, 2026. This builder always
// emits the object shape so we don't ship the deprecated string form.

import type { ShotAssignment, GeneratedAsset } from "./Generator";

// Isaiah digital-twin defaults (see /heygen skill + ContentBrief.video_source.heygen).
export const ISAIAH_AVATAR_ID = "d9af08b6f80349aaa56096443f91d19e";
export const ISAIAH_VOICE_ID = "e40f41c567924222a60ed3e1d557fc77";

export const HEYGEN_USD_PER_SEC: Record<string, number> = { v3: 0.0333, v4: 0.10 };

export interface HeyGenRequestOptions {
  avatarId?: string;
  voiceId?: string;
  /** Engine object type — "avatar_v" (explicit high quality) is the default. */
  engineType?: string;
  width?: number;
  height?: number;
  /** test:true → cheap watermarked preview. Default TRUE (never spend by accident). */
  test?: boolean;
  avatarStyle?: string;
}

export interface HeyGenRequest {
  video_inputs: Array<{
    character: { type: "avatar"; avatar_id: string; avatar_style: string; engine: { type: string } };
    voice: { type: "text"; input_text: string; voice_id: string };
  }>;
  dimension: { width: number; height: number };
  test: boolean;
}

/** Build the /v2/video/generate payload for one A-roll shot. Pure. */
export function buildHeyGenRequest(script: string, opts: HeyGenRequestOptions = {}): HeyGenRequest {
  return {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: opts.avatarId ?? ISAIAH_AVATAR_ID,
          avatar_style: opts.avatarStyle ?? "normal",
          engine: { type: opts.engineType ?? "avatar_v" }, // OBJECT, per v3 breaking change
        },
        voice: { type: "text", input_text: script, voice_id: opts.voiceId ?? ISAIAH_VOICE_ID },
      },
    ],
    dimension: { width: opts.width ?? 1080, height: opts.height ?? 1920 },
    test: opts.test ?? true,
  };
}

/** HeyGen A-roll cost for `seconds` at the given engine label ("v3" | "v4"). */
export function estimateHeyGenCost(seconds: number, engine = "v3"): number {
  return +(seconds * (HEYGEN_USD_PER_SEC[engine] ?? HEYGEN_USD_PER_SEC.v3)).toFixed(4);
}

/**
 * A-roll generator. `generate()` is intentionally a thin, injectable seam: the
 * real HeyGen call lives in scripts/resolve-video-source.ts (already working);
 * pass it in as `ctx.submit` so this stays unit-testable and side-effect-free by
 * default. Defaults to test mode so it can never silently burn credits.
 */
export const heyGenGenerator = {
  kind: "heygen_avatar" as const,
  async generate(shot: ShotAssignment, ctx: {
    submit?: (req: HeyGenRequest) => Promise<{ assetRef: string; durationSec?: number }>;
    options?: HeyGenRequestOptions;
  } = {}): Promise<GeneratedAsset> {
    const req = buildHeyGenRequest(shot.script, { test: true, ...ctx.options });
    if (!ctx.submit) {
      // Dry run — no network. Returns a planned (not produced) asset marker.
      return { clipId: shot.clipId, assetRef: `(dry-run:heygen:${shot.clipId})`, generator: "heygen_avatar", test: req.test };
    }
    const out = await ctx.submit(req);
    return { clipId: shot.clipId, assetRef: out.assetRef, actualDurationSec: out.durationSec, generator: "heygen_avatar", test: req.test };
  },
};
