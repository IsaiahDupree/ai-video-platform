/**
 * Isaiah Reel Pipeline — Canonical Schema v1.2
 * Single source of truth for: source analysis → AI decisions → Remotion render → QA → Blotato publish
 */

// ─── IDs & Project ────────────────────────────────────────────────────────────

export interface ReelJobIds {
  assetId: string;
  analysisId: string;
  briefId: string;
  renderJobId: string;
  publishJobId: string;
  sourceHash: string;
  transcriptHash: string;
}

// ─── Source Video ──────────────────────────────────────────────────────────────

export interface SourceQuality {
  audioLevelScore: number;       // 0–1
  sharpnessScore: number;
  stabilityScore: number;
  lightingScore: number;
  backgroundNoiseScore: number;  // lower is better
  usableForPrimaryTemplate: boolean;
}

export interface SourceVideo {
  sourceType: "iphone_video" | "screen_recording" | "b_roll" | "external";
  sourcePath: string;
  localMirrorPath?: string;
  durationMs: number;
  width: number;
  height: number;
  fps: number;
  orientation: "portrait" | "landscape";
  hasSpeaker: boolean;
  primarySpeakerCount: number;
  sourceQuality: SourceQuality;
}

// ─── Content Brief ─────────────────────────────────────────────────────────────

export type HookType =
  | "contrarian_reframe"
  | "builder_confession"
  | "system_explanation"
  | "future_shift_claim"
  | "problem_callout"
  | "identity_reframe"
  | "trend_to_offer";

export type CtaType =
  | "comment_keyword"
  | "dm_keyword"
  | "follow_for_part_2"
  | "newsletter_or_link_in_bio"
  | "product_soft_pitch"
  | "book_call"
  | "download_app"
  | "watch_demo";

export interface ContentBriefSuccessCriteria {
  minimumTranscriptFidelity: number;  // 0–1
  minimumStyleMatch: number;
  minimumBriefAlignment: number;
  maximumFaceOverlapRatio: number;    // 0 = never allowed
}

export interface ContentBrief {
  briefSource: "manual" | "ai_generated";
  objective: string;
  audience: string;
  topic: string;
  coreTakeaway: string;
  hookType: HookType;
  emotion: string;
  ctaType: CtaType;
  ctaValue: string;
  bannedPhrases: string[];
  languageToUse: string[];
  languageToAvoid: string[];
  successCriteria: ContentBriefSuccessCriteria;
}

// ─── Source Analysis ────────────────────────────────────────────────────────────

export interface TranscriptWord {
  word: string;
  normalized: string;
  startMs: number;
  endMs: number;
  confidence: number;
  speakerId: string;
}

export interface SpeechSegment {
  segmentId: string;
  startMs: number;
  endMs: number;
  text: string;
  energyScore: number;
  hookLikelihood: number;
  clarityScore: number;
  silenceBeforeMs: number;
  silenceAfterMs: number;
}

export interface FaceBox {
  timeMs: number;
  x: number;   // normalized 0–1
  y: number;
  w: number;
  h: number;
}

export interface TextZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SafeZones {
  forbiddenRegions: Array<{ name: string; dynamic: boolean }>;
  recommendedTextZones: {
    topHeaderZone: TextZone;
    topSummaryZone: TextZone;
    bottomCaptionZone: TextZone;
  };
}

export interface SourceAnalysis {
  analysisProvider: {
    transcriptEngine: string;
    visionEngine: string;
    llmEngine: string;
  };
  transcript: {
    fullText: string;
    language: string;
    overallConfidence: number;
    words: TranscriptWord[];
  };
  speechSegments: SpeechSegment[];
  sceneCuts: Array<{ atMs: number }>;
  faceTracking: {
    primaryFaceDetected: boolean;
    trackedFramesCoverage: number;
    boxes: FaceBox[];
  };
  objectTracking: {
    objects: Array<{ type: string; confidence: number }>;
  };
  safeZones: SafeZones;
  sourceFit: {
    talkingHeadFitScore: number;
    transcriptFitScore: number;
    layoutFitScore: number;
    overallSourceFitScore: number;
  };
}

// ─── Style Profile ──────────────────────────────────────────────────────────────

export type CaptionAnimationMode = "pop_in" | "karaoke_pop" | "subtle_slide" | "word_highlight";

export interface CaptionStylePreset {
  presetId: string;
  description: string;
  lineMode: "phrase" | "phrase_plus_word_focus" | "two_line" | "single_word";
  emphasisMode: "active_phrase" | "active_word" | "current_line" | "none";
  animationMode: CaptionAnimationMode;
}

export interface StyleProfile {
  styleId: string;
  creatorName: string;
  templateFamily: "talking_head" | "broll_narration" | "screenshot_explainer";
  visualRules: {
    alwaysShowTopName: boolean;
    topNameText: string;
    alwaysShowTopSummaryStrap: boolean;
    summaryStrapTextColor: string;  // hex
    summaryStrapBgColor: string;
    captionsTextColor: string;
    captionsBgColor: string;
    avoidFaceOverlap: boolean;
    centerOverlayAllowed: boolean;
    bulletPointsOverFaceAllowed: boolean;
    maxCaptionLines: number;
    maxWordsPerCaptionPage: number;
    preferredCutCadenceSecondsMin: number;
    preferredCutCadenceSecondsMax: number;
    deadAirMaxMs: number;
  };
  fontSystem: {
    defaultHeadlinePreset: string;
    defaultCaptionPreset: string;
    approvedHeadlinePresets: string[];
    approvedCaptionPresets: string[];
    uppercaseSummaryAllowed: boolean;
    letterSpacingMode: "tight" | "normal" | "wide";
  };
  captionStyleLibrary: {
    defaultPreset: string;
    presets: CaptionStylePreset[];
  };
}

// Default house style — never change without explicit instruction
export const ISAIAH_HOUSE_STYLE: StyleProfile = {
  styleId: "isaiah_house_style_v1",
  creatorName: "Isaiah Dupree",
  templateFamily: "talking_head",
  visualRules: {
    alwaysShowTopName: true,
    topNameText: "Isaiah Dupree",
    alwaysShowTopSummaryStrap: true,
    summaryStrapTextColor: "#000000",
    summaryStrapBgColor: "#7DFF63",
    captionsTextColor: "#000000",
    captionsBgColor: "#7DFF63",
    avoidFaceOverlap: true,
    centerOverlayAllowed: false,
    bulletPointsOverFaceAllowed: false,
    maxCaptionLines: 2,
    maxWordsPerCaptionPage: 6,
    preferredCutCadenceSecondsMin: 0.8,
    preferredCutCadenceSecondsMax: 1.8,
    deadAirMaxMs: 180,
  },
  fontSystem: {
    defaultHeadlinePreset: "archivo_black",
    defaultCaptionPreset: "space_grotesk_semibold",
    approvedHeadlinePresets: ["archivo_black", "anton_bold", "sora_extrabold"],
    approvedCaptionPresets: ["space_grotesk_semibold", "inter_bold", "sora_bold"],
    uppercaseSummaryAllowed: true,
    letterSpacingMode: "tight",
  },
  captionStyleLibrary: {
    defaultPreset: "isaiah_phrase_blocks_v1",
    presets: [
      {
        presetId: "isaiah_phrase_blocks_v1",
        description: "Phrase blocks — black on green, active phrase emphasis, pop-in animation",
        lineMode: "phrase",
        emphasisMode: "active_phrase",
        animationMode: "pop_in",
      },
      {
        presetId: "isaiah_karaoke_pop_v1",
        description: "Karaoke-style word highlight with phrase container",
        lineMode: "phrase_plus_word_focus",
        emphasisMode: "active_word",
        animationMode: "karaoke_pop",
      },
      {
        presetId: "isaiah_clean_stack_v1",
        description: "Clean two-line stacked captions, minimal motion",
        lineMode: "two_line",
        emphasisMode: "current_line",
        animationMode: "subtle_slide",
      },
    ],
  },
};

// ─── AI Decisions ───────────────────────────────────────────────────────────────

export interface SummaryStrapCandidate {
  text: string;
  transcriptFaithfulness: number;  // 0–1
  curiosityScore: number;
  styleMatchScore: number;
  briefAlignmentScore: number;
  overallScore: number;
}

export interface EditPlan {
  cutPlan: {
    removeDeadAir: boolean;
    silenceThresholdMs: number;
    targetCadenceSeconds: number;
  };
  zoomPlan: {
    enabled: boolean;
    triggerMoments: Array<{ atMs: number; reason: string }>;
  };
  brollPlan: {
    enabled: boolean;
    insertionMoments: Array<{ atMs: number; brollId: string; durationMs: number }>;
  };
  screenshotPlan: {
    enabled: boolean;
    insertionMoments: Array<{ atMs: number; imagePath: string; durationMs: number }>;
  };
}

export interface AIDecisions {
  decisionVersion: string;
  summaryStrap: {
    mode: "ai_generated" | "human_override";
    sourceInputs: string[];
    candidates: SummaryStrapCandidate[];
    selected: {
      text: string;
      selectedFromCandidateIndex: number;
      selectionReason: string;
      hardcoded: false;  // MUST always be false — never hardcode
    };
  };
  segmentSelection: {
    selectedSegments: Array<{
      segmentId: string;
      startMs: number;
      endMs: number;
      reason: string;
    }>;
  };
  captionSegmentation: {
    segmentationMode: "phrase_based" | "word_based" | "sentence_based";
    combineTokensWithinMs: number;
    maxWordsPerPage: number;
    allowSingleWordPunchPages: boolean;
  };
  editPlan: EditPlan;
}

// ─── Render Plan ────────────────────────────────────────────────────────────────

export interface RenderPlan {
  engine: "remotion";
  compositionId: "IsaiahTalkingHeadV1";
  props: IsaiahTalkingHeadV1Props;
  output: {
    width: 1080;
    height: 1920;
    fps: 30;
    codec: "h264";
    audioCodec: "aac";
    pixelFormat: "yuv420p";
    crf: 18;                   // high quality — do not raise above 23
    imageFormat: "jpeg";
    preferHighQualityRender: boolean;
    exportPath: string;
  };
  posterFrame: {
    frameSelectionMode: "ai_best_frame" | "first_frame" | "manual";
    titleText: string;
  };
}

// Remotion composition props — the exact shape IsaiahTalkingHeadV1 receives
export interface IsaiahTalkingHeadV1Props {
  // Media
  sourceVideoUrl: string;

  // Transcript (from Whisper / WhisperX — must be word-accurate)
  transcriptWords: TranscriptWord[];

  // Brand identity (always "Isaiah Dupree" — programmatic, not hardcoded in component)
  brandName: string;

  // AI-generated summary strap — NEVER hardcoded, always from AIDecisions
  summaryStrapText: string;

  // Content context
  contentBrief: {
    topic: string;
    objective: string;
    audience: string;
    hookType: HookType;
    cta?: string;
  };

  // Face detection — used to avoid overlapping captions/overlays
  faceBoxes: FaceBox[];

  // Selected segments to include in the render
  selectedSegments: Array<{ startMs: number; endMs: number; reason: string }>;

  // Scoring (for QA overlay and analytics)
  styleScores: {
    transcriptFidelity: number;
    briefAlignment: number;
    styleMatch: number;
    sourceFit: number;
  };

  // Visual rules — all programmatic from house style
  layoutRules: {
    captionTextColor: string;
    captionBgColor: string;
    summaryTextColor: string;
    summaryBgColor: string;
    avoidFaceOverlap: boolean;
    captionStylePreset: string;
    headlineFontPreset: string;
    captionFontPreset: string;
  };

  // Edit behavior
  editPlan: EditPlan;
}

// ─── QA ─────────────────────────────────────────────────────────────────────────

export type QACheckId =
  | "top_name_present"
  | "summary_strap_present"
  | "summary_strap_ai_generated"
  | "captions_present"
  | "caption_transcript_fidelity"
  | "brief_alignment"
  | "style_match"
  | "face_overlap_ratio"
  | "platform_safe_zone_ok"
  | "render_quality_ok";

export type QAStatus = "pending" | "passed" | "failed";

export type PublishDecision =
  | "ready_to_post"
  | "needs_transcript_regen"
  | "needs_layout_adjust"
  | "needs_hook_rewrite"
  | "blocked";

export interface QACheck {
  checkId: QACheckId;
  required: boolean;
  threshold?: number;
  thresholdMax?: number;
  actual?: number | null;
  passed: boolean | null;
  failureReason?: string;
}

export interface QAResult {
  status: QAStatus;
  publishDecision: PublishDecision;
  checks: QACheck[];
  scores: {
    transcriptFidelity: number | null;
    briefAlignment: number | null;
    styleMatch: number | null;
    sourceFit: number | null;
    readability: number | null;
    overallEditFit: number | null;
  };
  failureReasons: string[];
}

// ─── Strategy — Brands, Offers, ICPs, Platform Accounts ────────────────────────

export type BrandId = "isaiah_personal" | "everreach" | "portal_copy_co" | "techmestuff";

export type OfferId =
  | "everreach_app"
  | "automation_services"
  | "content_system_offer"
  | "email_marketing_course"
  | "engineering_tools";

export type IcpId =
  | "creators_builders"
  | "founders_operators"
  | "relationship_driven_networkers"
  | "solopreneurs_women_business_owners"
  | "engineers_tech_learners";

export type NarrativeId =
  | "operator_proof"
  | "pain_to_shift"
  | "identity_reframe"
  | "demo_with_context"
  | "trend_to_offer"
  | "relationship_truth";

export type Platform =
  | "instagram_reels"
  | "tiktok"
  | "youtube_shorts"
  | "threads"
  | "linkedin";

export type FunnelStage = "problem_aware" | "solution_aware" | "product_aware" | "most_aware";

export interface FunnelMix {
  problemAware: number;
  solutionAware: number;
  productAware: number;
  mostAware: number;
}

export interface IcpProfile {
  icpId: IcpId;
  label: string;
  pains: string[];
  desiredOutcomes: string[];
  languageToUse: string[];
  languageToAvoid?: string[];
  funnelBias: FunnelMix;
}

export interface Offer {
  offerId: OfferId;
  brandId: BrandId;
  offerName: string;
  offerType: "app_subscription" | "service" | "service_or_productized_service" | "course" | "tool";
  corePromise: string;
  primaryOutcome: string;
  ctaTypes: CtaType[];
  targetIcps: IcpId[];
  preferredPlatforms: Platform[];
  funnelStages: FunnelStage[];
}

export interface PlatformAccount {
  accountId: string;
  brandId: BrandId;
  platform: Platform;
  handle: string;
  blotatoAccountId?: number;  // set at runtime from Blotato API
  primaryGoal: string;
  preferredNarratives: NarrativeId[];
  preferredOffers: OfferId[];
  targetIcps: IcpId[];
  preferredFunnelMix: FunnelMix;
  contentPillars: string[];
}

// ─── B-Roll & Audio ─────────────────────────────────────────────────────────────

export interface BrollAsset {
  brollId: string;
  assetPath: string;
  tags: string[];
  visualMood: string;
  suitableTopics: string[];
  suitableIcps: IcpId[];
  facePresent: boolean;
  textSafeZones: {
    top: TextZone;
    center: TextZone;
    bottom: TextZone;
  };
  scoreInputs: {
    aestheticScore: number;
    motionScore: number;
    readabilityScore: number;
  };
}

export interface AudioTrack {
  audioId: string;
  sourcePath: string;
  mood: string;
  energy: number;  // 0–1
  suitablePlatforms: Platform[];
  suitableFunnelStages: FunnelStage[];
  duckingProfile: "voice_first" | "balanced" | "music_forward";
  bpm?: number;
}

// ─── Selection Engine Output ─────────────────────────────────────────────────────

export interface SelectionDecision {
  selectedAccountId: string;
  selectedPlatform: Platform;
  selectedOfferId: OfferId;
  selectedIcpId: IcpId;
  selectedFunnelStage: FunnelStage;
  selectedNarrativeId: NarrativeId;
  selectedBrollIds: string[];
  selectedAudioId: string;
  selectionScores: {
    offerFit: number;
    icpFit: number;
    platformFit: number;
    trendFit: number;
    brollFit: number;
    audioFit: number;
    styleMatch: number;
    overallScore: number;
  };
}

// ─── Generated Copy ──────────────────────────────────────────────────────────────

export interface GeneratedCopy {
  summaryStrapText: string;       // black text on green — AI-generated, 4–10 words
  onScreenHookText: string;       // first hook line shown in video
  ctaText: string;                // end-card or spoken CTA
  platformCaption: string;        // post caption for selected platform
  platformHashtags: string[];
  firstComment?: string;
  allPlatformVariants?: Partial<Record<Platform, { caption: string; hashtags: string[] }>>;
}

// ─── Experiment ──────────────────────────────────────────────────────────────────

export interface ExperimentArm {
  experimentId: string;
  armId: string;
  variables: {
    hookStyle: "contrarian" | "confession" | "system_shift" | "identity";
    captionStylePreset: string;
    brollTheme: string;
    audioMood: string;
    funnelStage: FunnelStage;
    narrativeId: NarrativeId;
    offerAngle: string;
  };
}

// ─── Tracking Events ─────────────────────────────────────────────────────────────

export type TrackingEvent =
  | "video_source_selected"
  | "iphone_analysis_loaded"
  | "transcript_generated"
  | "transcript_regenerated"
  | "brief_extracted"
  | "style_profile_loaded"
  | "account_selected"
  | "offer_selected"
  | "icp_selected"
  | "funnel_stage_selected"
  | "narrative_selected"
  | "broll_ranked"
  | "broll_selected"
  | "audio_selected"
  | "summary_strap_candidates_generated"
  | "summary_strap_selected"
  | "face_safe_regions_computed"
  | "captions_chunked"
  | "experiment_arm_assigned"
  | "render_started"
  | "render_completed"
  | "qa_check_completed"
  | "qa_passed"
  | "qa_failed"
  | "publish_queued"
  | "publish_confirmation_received"
  | "publish_succeeded"
  | "publish_failed"
  | "telegram_notification_sent"
  | "post_performance_ingested";

export interface TrackingPayload {
  event: TrackingEvent;
  properties: {
    workspaceId: string;
    brandId: BrandId;
    assetId: string;
    analysisId?: string;
    renderJobId?: string;
    templateId: string;
    styleId: string;
    accountId?: string;
    platform?: Platform;
    offerId?: OfferId;
    icpId?: IcpId;
    funnelStage?: FunnelStage;
    narrativeId?: NarrativeId;
    summaryStrapText?: string;
    captionStylePreset?: string;
    headlineFontPreset?: string;
    experimentArmId?: string;
    transcriptConfidence?: number;
    briefAlignmentScore?: number;
    styleMatchScore?: number;
    faceOverlapDetected?: boolean;
    captionAccuracyScore?: number;
    publishReady?: boolean;
    postUrl?: string;
    [key: string]: unknown;
  };
}

// ─── Distribution ────────────────────────────────────────────────────────────────

export interface DistributionPlan {
  engine: "blotato";
  enabled: boolean;
  targets: Array<{
    platform: Platform;
    blotatoAccountId: number;
    enabled: boolean;
    priority: number;
  }>;
  publishPolicy: {
    requireQaPass: boolean;
    requireManualApproval: boolean;
    scheduleMode: "immediate" | "queue" | "scheduled";
    scheduledAt?: string;  // ISO 8601
  };
  telegramNotification: {
    enabled: boolean;
    messageTemplate: string;  // use {{platform}}, {{accountKey}}, {{postUrl}}
  };
  result?: {
    postSubmissionId: string;
    postUrl: string | null;
    status: "pending" | "published" | "failed";
    publishedAt?: string;
  };
}

// ─── Post-Publish Feedback ────────────────────────────────────────────────────────

export interface FeedbackLoop {
  postPublishMetrics: {
    collectAtHours: number[];
    snapshots: Array<{
      collectedAt: string;
      views: number | null;
      avgWatchTimeMs: number | null;
      retention3sPct: number | null;
      retention50Pct: number | null;
      likes: number | null;
      comments: number | null;
      shares: number | null;
      saves: number | null;
      profileClicks: number | null;
    }>;
  };
  learningSignals: {
    compareRenderedVideoToBrief: boolean;
    compareRenderedVideoToStyleProfile: boolean;
    comparePerformanceBySummaryStrap: boolean;
    comparePerformanceByCaptionStylePreset: boolean;
    comparePerformanceByFontPreset: boolean;
  };
}

// ─── Top-Level Reel Job ───────────────────────────────────────────────────────────

export interface IsaiahReelJob {
  schemaVersion: "1.2.0";
  jobId: string;
  createdAt: string;
  updatedAt: string;

  ids: ReelJobIds;
  sourceVideo: SourceVideo;
  contentBrief: ContentBrief;
  sourceAnalysis: SourceAnalysis;
  styleProfile: StyleProfile;
  aiDecisions: AIDecisions;
  selectionDecision: SelectionDecision;
  generatedCopy: GeneratedCopy;
  experimentArm: ExperimentArm;
  renderPlan: RenderPlan;
  qa: QAResult;
  distribution: DistributionPlan;
  feedback: FeedbackLoop;
}
