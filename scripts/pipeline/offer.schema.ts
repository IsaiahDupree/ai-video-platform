/**
 * Offer-agnostic pipeline schema.
 *
 * Drop any product offer + creative framework into this shape
 * and the pipeline will generate stage inputs, voiceovers, and
 * composed videos automatically.
 */

// =============================================================================
// Offer — the product being advertised
// =============================================================================

export interface Offer {
  /** Short product name used in product-aware scripts */
  productName: string;
  /** One-line tagline */
  tagline: string;
  /** The core problem the product solves */
  problemSolved: string;
  /** Who the ad is targeting */
  targetAudience: string;
  /** Key features / benefits (3–6 bullets) */
  keyFeatures: string[];
  /** Optional social proof line */
  socialProof?: string;
  /** Final CTA text */
  cta: string;
  /** Optional app/product URL */
  productUrl?: string;
  /** Optional price context */
  pricePoint?: string;
}

// =============================================================================
// CreativeFramework — how ads for this offer should be structured
// =============================================================================

export interface CreativeFramework {
  /**
   * Awareness stages to generate angles for.
   * Each entry is a label + description used in the AI prompt.
   * Standard: unaware | problem-aware | solution-aware | product-aware
   */
  awarenessStages: Array<{ id: string; description: string }>;

  /**
   * Relationship/audience categories to generate angles for.
   * Each entry is a label used in scene and script generation.
   */
  audienceCategories: string[];

  /**
   * Rules the AI must follow when writing voice scripts.
   * Injected verbatim into the system prompt.
   */
  scriptRules: string[];

  /** Voice tone description for TTS and script generation */
  voiceTone: string;

  /** Visual style description for image/video prompts */
  visualStyle: string;

  /**
   * ElevenLabs voice ID to use for TTS.
   * Defaults to 'charlie' (IKne3meq5aSn9XLyUdCD) if omitted.
   */
  elevenLabsVoiceId?: string;

  /**
   * Aspect ratio for video output.
   * Defaults to '9:16' (vertical/Reels) if omitted.
   */
  aspectRatio?: string;
}

// =============================================================================
// Generated angle inputs — output of the AI input generator
// =============================================================================

export interface AngleInputs {
  /** Unique angle identifier (set by the runner) */
  angleId: string;
  awarenessStage: string;
  audienceCategory: string;
  /** Short punchy headline (5–8 words) */
  headline: string;
  /** Supporting subheadline (10–15 words) */
  subheadline: string;
  /** Imagen 4 prompt for the BEFORE (problem) scene */
  beforeScenePrompt: string;
  /** Imagen 4 prompt for the AFTER (solution) scene */
  afterScenePrompt: string;
  /** Veo 3.1 motion + audio prompt */
  motionPrompt: string;
  /** Full TTS voice script — newline-delimited caption lines */
  voiceScript: string;
  /**
   * Veo 3 lip-sync prompts — one per script line.
   * Each prompt generates an 8s clip with native speech baked in.
   * Only present when AI was asked to generate lip-sync mode inputs.
   */
  lipsyncPrompts?: string[];
  /** 1–2 word comment CTA keyword */
  commentKeyword: string;
  /** Brief rationale for this angle */
  rationale: string;
}

// =============================================================================
// Pipeline run options
// =============================================================================

export interface RunOptions {
  /** Path to offer JSON file, or inline Offer object */
  offer: Offer;
  /** Creative framework to use */
  framework: CreativeFramework;
  /** Number of angles to generate in this run */
  count: number;
  /** Index into ANGLE_COMBOS to start from (for batching) */
  startIndex: number;
  /** Aspect ratio override (e.g. '9:16', '1:1', '16:9') */
  aspectRatio: string;
  /** Run only specific stages */
  stages: {
    images: boolean;
    video: boolean;
    voice: boolean;
    compose: boolean;
  };
  /** Force re-run even if outputs exist */
  force: boolean;
  /** Output base directory (default: output/pipeline/<sessionId>) */
  outputBase?: string;
}

// =============================================================================
// Tracing — per-angle generation record
// =============================================================================

export interface StageResult {
  status: 'pending' | 'done' | 'skipped' | 'failed';
  outputs: string[];
  durationMs?: number;
  error?: string;
}

export interface GenerationRecord {
  runId: string;
  angleId: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  offer: Offer;
  aiGeneration: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    inputs: AngleInputs;
  };
  pipeline: {
    stage1_images: StageResult;
    stage2_video: StageResult;
    stage3_voice: StageResult;
    stage4_compose: StageResult;
  };
  outputs: {
    outputDir: string;
    finalVideo?: string;
    assFile?: string;
    scriptFile?: string;
  };
  errors: string[];
}

export interface SessionSummary {
  sessionId: string;
  productName: string;
  mode: string;
  aspectRatio: string;
  startedAt: string;
  updatedAt: string;
  totalAngles: number;
  completed: number;
  failed: number;
  totalTokensUsed: number;
  estimatedCostUsd: number;
  angles: Array<{
    angleId: string;
    stage: string;
    category: string;
    headline: string;
    pipeline: Record<string, string>;
    finalVideo: string | null;
    errors: string[];
    durationMs?: number;
  }>;
}
