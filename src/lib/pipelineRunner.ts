/**
 * pipelineRunner.ts — End-to-end pipeline: Supabase → DecisionEngine → Remotion props
 *
 * 1. Queries media-vault Supabase for the top analyzed iPhone video
 * 2. Builds OrchestrationInput from the media-vault AI analysis fields
 * 3. Runs orchestrateReelJob() to generate render-ready props
 * 4. Returns IsaiahTalkingHeadV1Props + job metadata
 *
 * Usage (server / scripts):
 *   const { props, job } = await runIsaiahPipeline();
 *   // Then: npx remotion render IsaiahTalkingHeadV1 --props <json>
 */

import * as fs from "fs";
import * as path from "path";
import { orchestrateReelJob, type OrchestrationInput } from "./IsaiahReelDecisionEngine";
import { makeCallAI } from "./callAI";
import type { IsaiahTalkingHeadV1Props, BrollAsset, AudioTrack } from "../types/IsaiahReelSchema";
import { ISAIAH_HOUSE_STYLE } from "../types/IsaiahReelSchema";

// ─── Blotato account map ────────────────────────────────────────────────────
// From GET https://backend.blotato.com/v2/users/me/accounts
export const BLOTATO_ACCOUNT_MAP: Record<string, number> = {
  youtube: 228,
  tiktok: 710,
  instagram: 807,
  twitter: 571,
  facebook: 786,
};

// ─── Supabase client (lightweight fetch-based — no SDK needed) ──────────────

const SUPABASE_URL = "https://ivhfuhxorppptyuofbgq.supabase.co";
// Lazy getter so env vars set after module import are picked up
function getSupabaseKey(): string {
  return typeof process !== "undefined"
    ? process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ""
    : "";
}

async function supabaseGet<T = Record<string, unknown>[]>(
  table: string,
  params: Record<string, string>
): Promise<T> {
  const key = getSupabaseKey();
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const resp = await fetch(url.toString(), {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!resp.ok) throw new Error(`Supabase ${table} error ${resp.status}: ${await resp.text()}`);
  return resp.json() as Promise<T>;
}

// ─── Types matching media-vault mv_media_items table ────────────────────────

interface MvMediaItem {
  id: string;
  file_name: string;
  local_path: string | null;
  media_type: "video" | "photo";
  extension: string;
  device_udid: string;
  ingest_status: string;
  analysis_status: string;
  ai_caption: string | null;
  ai_niche: string | null;
  ai_quality_score: number | null;
  ai_hook_potential: number | null;
  ai_is_talking_head: boolean | null;
  ai_is_broll: boolean | null;
  ai_has_text_overlay: boolean | null;
  ai_face_present: boolean | null;
  ai_energy_level: string | null;
  ai_mood: string | null;
  ai_lighting: string | null;
  ai_platform_fit: Record<string, number> | null;
  ai_confidence_score: number | null;
  ai_performance_score: number | null;
  ai_content_tier: string | null;
  ai_ugc_format: string | null;
  file_size: number | null;
}

// ─── MyPassport audio scan path ──────────────────────────────────────────────

const PASSPORT_AUDIO_DIR = "/Volumes/My Passport/iPhone/audio";
const PASSPORT_MUSIC_EXTS = [".mp3", ".m4a", ".wav", ".aac"];

// ─── B-roll: fetch from Supabase ─────────────────────────────────────────────

async function fetchBrollAssets(): Promise<BrollAsset[]> {
  try {
    const items = await supabaseGet<MvMediaItem[]>("mv_media_items", {
      select: "id,file_name,local_path,ai_mood,ai_energy_level,ai_niche,ai_quality_score,ai_face_present,ai_platform_fit",
      media_type: "eq.video",
      analysis_status: "eq.done",
      ai_is_broll: "eq.true",
      "ai_quality_score": "gte.5",
      order: "ai_quality_score.desc.nullslast",
      limit: "20",
    });

    return items.map((item): BrollAsset => ({
      brollId: item.id,
      assetPath: item.local_path ?? item.file_name,
      tags: [item.ai_niche ?? "general", item.ai_mood ?? "neutral", item.ai_energy_level ?? "medium"],
      visualMood: item.ai_mood ?? "neutral",
      suitableTopics: [item.ai_niche ?? "general"],
      suitableIcps: ["founders_operators", "creators_builders"],
      facePresent: item.ai_face_present ?? false,
      textSafeZones: {
        top:    { x: 0, y: 0,    w: 1, h: 0.08 },
        center: { x: 0, y: 0.4,  w: 1, h: 0.20 },
        bottom: { x: 0, y: 0.76, w: 1, h: 0.16 },
      },
      scoreInputs: {
        aestheticScore:   (item.ai_quality_score ?? 5) / 10,
        motionScore:      item.ai_energy_level === "high" ? 0.8 : item.ai_energy_level === "medium" ? 0.5 : 0.3,
        readabilityScore: item.ai_face_present ? 0.4 : 0.8,
      },
    }));
  } catch {
    return [];
  }
}

// ─── Audio: scan MyPassport + fallback library ────────────────────────────────

function fetchAudioTracks(): AudioTrack[] {
  const tracks: AudioTrack[] = [];

  // Scan MyPassport for audio files
  if (fs.existsSync(PASSPORT_AUDIO_DIR)) {
    try {
      const files = fs.readdirSync(PASSPORT_AUDIO_DIR);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!PASSPORT_MUSIC_EXTS.includes(ext)) continue;
        const stem = path.basename(file, ext).toLowerCase();
        const mood = stem.includes("hype") || stem.includes("energy") ? "hype"
          : stem.includes("calm") || stem.includes("chill") ? "calm"
          : stem.includes("dark") || stem.includes("serious") ? "serious"
          : "neutral";
        tracks.push({
          audioId:   `passport_${stem.replace(/\W+/g, "_")}`,
          sourcePath: path.join(PASSPORT_AUDIO_DIR, file),
          mood,
          energy:    mood === "hype" ? 0.85 : mood === "calm" ? 0.25 : 0.55,
          suitablePlatforms:    ["instagram_reels", "tiktok", "youtube_shorts"],
          suitableFunnelStages: ["problem_aware", "solution_aware"],
          duckingProfile: "voice_first",
        });
      }
    } catch {
      // drive not mounted — silent fallback
    }
  }

  // Static fallback library (always present — no dependency on drive)
  if (tracks.length === 0) {
    tracks.push(
      {
        audioId: "builtin_neutral_001",
        sourcePath: "",
        mood: "neutral",
        energy: 0.55,
        suitablePlatforms: ["instagram_reels", "tiktok"],
        suitableFunnelStages: ["problem_aware", "solution_aware"],
        duckingProfile: "voice_first",
      },
      {
        audioId: "builtin_hype_001",
        sourcePath: "",
        mood: "hype",
        energy: 0.85,
        suitablePlatforms: ["tiktok", "instagram_reels"],
        suitableFunnelStages: ["problem_aware"],
        duckingProfile: "voice_first",
      }
    );
  }

  return tracks;
}

// ─── Fetch top analyzed talking-head video ───────────────────────────────────

async function fetchTopVideo(): Promise<MvMediaItem | null> {
  const items = await supabaseGet<MvMediaItem[]>("mv_media_items", {
    select: "*",
    media_type: "eq.video",
    analysis_status: "eq.done",
    ingest_status: "eq.downloaded",
    ai_is_talking_head: "eq.true",
    ai_face_present: "eq.true",
    "ai_quality_score": "gte.6",
    order: "ai_performance_score.desc.nullslast",
    limit: "1",
  });
  return items[0] ?? null;
}

// ─── Map media-vault AI fields → OrchestrationInput ─────────────────────────

async function buildOrchestrationInput(
  item: MvMediaItem,
  callAI: (p: string) => Promise<string>
): Promise<OrchestrationInput> {
  const [brollAssets, audioTracks] = await Promise.all([
    fetchBrollAssets(),
    Promise.resolve(fetchAudioTracks()),
  ]);
  const topic = item.ai_niche ?? "ai_automation";
  const captionText = item.ai_caption ?? "";
  const qualityScore = item.ai_quality_score ?? 7;
  const hookPotential = item.ai_hook_potential ?? 6;
  const energyLevel = (item.ai_energy_level ?? "medium") as "low" | "medium" | "high";
  const performanceScore = item.ai_performance_score ?? 50;

  return {
    brandId: "isaiah_personal",
    sourceClipPath: item.local_path ?? item.file_name,
    sourceAnalysis: {
      analysisProvider: {
        transcriptEngine: "media_vault_ai",
        visionEngine: "media_vault_ai",
        llmEngine: "claude-haiku",
      },
      transcript: {
        fullText: captionText,
        language: "en",
        overallConfidence: (item.ai_confidence_score ?? 70) / 100,
        words: [],   // no word-level timestamps from media-vault yet
      },
      speechSegments:
        captionText.length > 0
          ? [
              {
                segmentId: "seg_0",
                startMs: 0,
                endMs: 30_000,
                text: captionText,
                energyScore: hookPotential / 10,
                hookLikelihood: hookPotential / 10,
                clarityScore: qualityScore / 10,
                silenceBeforeMs: 0,
                silenceAfterMs: 0,
              },
            ]
          : [],
      sceneCuts: [],
      faceTracking: {
        primaryFaceDetected: item.ai_face_present ?? false,
        trackedFramesCoverage: item.ai_face_present ? 0.8 : 0,
        boxes: [],
      },
      objectTracking: { objects: [] },
      safeZones: {
        forbiddenRegions: [],
        recommendedTextZones: {
          topHeaderZone: { x: 0, y: 0, w: 1, h: 0.08 },
          topSummaryZone: { x: 0, y: 0.08, w: 1, h: 0.12 },
          bottomCaptionZone: { x: 0, y: 0.76, w: 1, h: 0.16 },
        },
      },
      sourceFit: {
        talkingHeadFitScore: item.ai_is_talking_head ? 0.9 : 0.3,
        transcriptFitScore: captionText.length > 20 ? 0.8 : 0.4,
        layoutFitScore: qualityScore / 10,
        overallSourceFitScore: performanceScore / 100,
      },
    },
    // sourceVideo is separate from sourceAnalysis in the schema
    // (pipelineRunner builds OrchestrationInput, not IsaiahReelJob directly)
    contentBrief: {
      briefSource: "ai_generated",
      objective: "grow audience and generate DM leads",
      audience: "software founders $500K–$5M ARR",
      topic,
      coreTakeaway: captionText.slice(0, 120) || "AI automation changes everything",
      hookType: "contrarian_reframe",
      emotion: item.ai_mood ?? "confident",
      ctaType: "dm_keyword",
      ctaValue: "AUTOMATE",
      bannedPhrases: ["just", "simply", "obviously"],
      languageToUse: ["founders", "pipeline", "leverage", "system"],
      languageToAvoid: ["hustle", "grind", "passive income"],
      successCriteria: {
        minimumTranscriptFidelity: 0.7,
        minimumStyleMatch: 0.7,
        minimumBriefAlignment: 0.6,
        maximumFaceOverlapRatio: 0,
      },
    },
    availableBroll: brollAssets,
    availableAudio: audioTracks,
    trendTopics: [topic, "ai_automation", "saas_growth"],
    trendFit: hookPotential / 10,
    callAI,
    blotatoAccountMap: BLOTATO_ACCOUNT_MAP,
  };
}

// ─── Map completed job → IsaiahTalkingHeadV1Props ───────────────────────────

function jobToCompositionProps(
  job: Awaited<ReturnType<typeof orchestrateReelJob>>,
  item: MvMediaItem
): IsaiahTalkingHeadV1Props {
  const localPath = item.local_path ?? "";
  const sourceVideoUrl =
    localPath.startsWith("/")
      ? `file://${localPath}`
      : localPath;

  return {
    // Root Remotion composition parameters
    durationInFrames: 900, // 30s @ 30fps — actual duration computed by composition from sourceVideo
    fps: 30,
    width: 1080,
    height: 1920,
    sourceVideoUrl,
    transcriptWords: job.sourceAnalysis.transcript.words,
    brandName: ISAIAH_HOUSE_STYLE.visualRules.topNameText,
    summaryStrapText: job.generatedCopy.summaryStrapText,
    contentBrief: job.contentBrief,
    faceBoxes: job.sourceAnalysis.faceTracking.boxes,
    selectedSegments: job.aiDecisions.segmentSelection.selectedSegments,
    styleScores: {
      transcriptFidelity: job.qa.scores.transcriptFidelity ?? 0,
      briefAlignment: job.qa.scores.briefAlignment ?? 0,
      styleMatch: job.qa.scores.styleMatch ?? 0,
      sourceFit: job.qa.scores.sourceFit ?? 0,
    },
    layoutRules: {
      captionTextColor: ISAIAH_HOUSE_STYLE.visualRules.captionsTextColor,
      captionBgColor: ISAIAH_HOUSE_STYLE.visualRules.captionsBgColor,
      summaryTextColor: ISAIAH_HOUSE_STYLE.visualRules.summaryStrapTextColor,
      summaryBgColor: ISAIAH_HOUSE_STYLE.visualRules.summaryStrapBgColor,
      avoidFaceOverlap: true,
      captionStylePreset: ISAIAH_HOUSE_STYLE.captionStyleLibrary.defaultPreset,
      headlineFontPreset: ISAIAH_HOUSE_STYLE.fontSystem.defaultHeadlinePreset,
      captionFontPreset: ISAIAH_HOUSE_STYLE.fontSystem.defaultCaptionPreset,
    },
    editPlan: {
      cutPlan: {
        removeDeadAir: true,
        silenceThresholdMs: 180,
        targetCadenceSeconds: 1.25,
      },
      zoomPlan: {
        enabled: job.aiDecisions.editPlan?.zoomPlan?.enabled ?? true,
        triggerMoments: job.aiDecisions.editPlan?.zoomPlan?.triggerMoments ?? [],
      },
      brollPlan: {
        enabled: false,
        insertionMoments: [],
      },
      screenshotPlan: {
        enabled: false,
        insertionMoments: [],
      },
    },
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export interface PipelineResult {
  props: IsaiahTalkingHeadV1Props;
  job: Awaited<ReturnType<typeof orchestrateReelJob>>;
  sourceItem: MvMediaItem;
}

/**
 * Run the full Isaiah Reel pipeline:
 *   Supabase (best analyzed iPhone video) → DecisionEngine → IsaiahTalkingHeadV1Props
 *
 * @param apiKey - Anthropic API key. Falls back to ANTHROPIC_API_KEY env var.
 * @param overrideItemId - Force a specific mv_media_items.id instead of top scorer.
 */
export async function runIsaiahPipeline(
  apiKey?: string,
  overrideItemId?: string
): Promise<PipelineResult> {
  let item: MvMediaItem | null = null;

  if (overrideItemId) {
    const items = await supabaseGet<MvMediaItem[]>("mv_media_items", {
      select: "*",
      id: `eq.${overrideItemId}`,
      limit: "1",
    });
    item = items[0] ?? null;
  } else {
    item = await fetchTopVideo();
  }

  if (!item) {
    throw new Error(
      "No analyzed talking-head iPhone video found in Supabase. " +
      "Run media-vault ingest + analysis first."
    );
  }

  const callAI = makeCallAI({ apiKey });
  const input = await buildOrchestrationInput(item, callAI);
  const job = await orchestrateReelJob(input);
  const props = jobToCompositionProps(job, item);

  return { props, job, sourceItem: item };
}
