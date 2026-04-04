/**
 * Trend-Driven Autonomous Content Engine — Canonical TypeScript Schema
 *
 * Four cooperating engines:
 *   1. Intelligence  — creators, patterns, cadence, outliers
 *   2. Research      — Perplexity + Brave + web + video expansion
 *   3. Production    — briefs → scripts → timelines → Remotion renders
 *   4. Learning      — post-publish measurement + pattern memory updates
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export type Platform =
  | "youtube"
  | "instagram_reels"
  | "tiktok"
  | "twitter_x"
  | "threads"
  | "linkedin"
  | "blog"
  | "reddit"
  | "podcast";

export type ContentFormat =
  | "short_form_vertical"
  | "long_form_horizontal"
  | "carousel"
  | "text_post"
  | "thread"
  | "blog"
  | "podcast_clip";

export type ContentMood =
  | "urgent"
  | "excited"
  | "calm"
  | "confident"
  | "empathetic"
  | "authoritative"
  | "playful";

export type FunnelStage =
  | "unaware"
  | "problem_aware"
  | "solution_aware"
  | "product_aware"
  | "most_aware";

export type TopicStage = "emerging" | "rising" | "peaking" | "mature" | "declining";

export type RecommendedAction = "monitor" | "test" | "double_down" | "skip";

export type Renderer = "remotion" | "premiere" | "hybrid";

export type RightsStatus = "owned" | "licensed" | "restricted" | "review_required";

export type ClaimVerification = "verified" | "plausible_unverified" | "opinion" | "anecdotal";

export type OrchestratorState =
  | "DISCOVERED"
  | "NORMALIZED"
  | "FEATURE_EXTRACTED"
  | "SCORED"
  | "RESEARCH_EXPANDED"
  | "ANGLE_SELECTED"
  | "BRIEF_COMPILED"
  | "ASSETS_RESOLVED"
  | "SCRIPTED"
  | "TIMELINED"
  | "RENDERING"
  | "QA_PASSED"
  | "PUBLISHED"
  | "CHECKBACK_PENDING"
  | "LEARNING_CAPTURED"
  | "PATTERN_MEMORY_UPDATED";

// ─── A. Creator Profile ───────────────────────────────────────────────────────

export interface AudienceSignals {
  estimatedSegments: string[];          // e.g. ["creators_builders", "founders"]
  likelyPainPoints: string[];
  desiredOutcomes: string[];
  languageStyle: string[];              // e.g. ["direct", "no-fluff", "builder-speak"]
  ctaStyle: string[];                   // e.g. ["comment keyword", "DM me", "link in bio"]
  awarenessLevelDistribution: Partial<Record<FunnelStage, number>>;
}

export interface PostingProfile {
  avgPostsPerDay: number;
  avgPostsPerWeek: number;
  dominantPublishWindows: string[];     // "HH:mm" in creator's apparent TZ
  seriesPatterns: string[];            // e.g. ["daily tips", "weekly deep dive"]
  burstDayFrequency: number;           // how often they post 3+ times/day
  contentMix: {
    educational: number;
    story: number;
    opinion: number;
    trendReaction: number;
    ugc: number;
    promo: number;
  };
  formatMix: Partial<Record<ContentFormat, number>>;
  topicRotation: string[];
  avgIntervalHours: number;
  repostingBehavior: "never" | "rare" | "moderate" | "frequent";
}

export interface VisualStyle {
  captionStyle: string[];              // e.g. ["phrase blocks", "karaoke", "subtitles only"]
  cameraPatterns: string[];           // e.g. ["tight medium", "wide B-roll", "screen recording"]
  editingPatterns: string[];          // e.g. ["jump cuts", "zoom punch", "slide transitions"]
  colorPalette: string[];
  fontStyle: string;
  textPlacement: string[];
  overlayTypes: string[];
  hookWindowSec: number;             // time to first strong claim
  avgShotLengthSec: number;
  brollDensity: number;              // 0–1
  textDensity: number;               // 0–1 (how much text on screen)
}

export interface CreatorProfile {
  creatorId: string;
  discoveredAt: string;
  updatedAt: string;
  platform: Platform;
  handle: string;
  displayName: string;
  profileUrl: string;
  niche: string[];
  followerCount: number;
  subscriberCount?: number;           // YouTube
  avgViewsPerPost: number;
  audienceSignals: AudienceSignals;
  postingProfile: PostingProfile;
  visualStyle: VisualStyle;
  competitiveRank: number;            // 1 = most important to track
  trackingEnabled: boolean;
  lastIngestedAt?: string;
}

// ─── B. Content Item ──────────────────────────────────────────────────────────

export interface FrameSample {
  tsSec: number;
  imageUrl: string;
  notes: string;
  textOnScreen: string[];
  facePresent: boolean;
  brollType?: string;
}

export interface RawMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  ctr: number | null;
  avgWatchTimeSec: number | null;
  retention3s: number | null;
  retention30s: number | null;
  completionRate: number | null;
  impressions?: number;
  reach?: number;
  profileVisitsFromPost?: number;
  linkClicksFromPost?: number;
}

export interface NormalizedMetrics {
  vph: number;                         // views per hour (velocity)
  engagementRate: number;
  shareRate: number;
  saveRate: number;
  commentRate: number;
  velocityScore: number;               // vph vs creator baseline
  retentionScore: number;
  outlierScore: number;                // computed by outlier engine
  qualityCommentRatio: number;         // substantive comments / total comments
}

export interface HookAnalysis {
  hookType:
    | "contrarian"
    | "how_to"
    | "trend_explainer"
    | "myth_bust"
    | "checklist"
    | "story"
    | "challenge"
    | "social_proof"
    | "question"
    | "bold_claim";
  hookText: string;
  hookWindowSec: number;
  firstClaimAtSec: number;
  patternInterruptType: string;
}

export interface ContentItem {
  contentId: string;
  creatorId: string;
  platform: Platform;
  url: string;
  publishedAt: string;                 // ISO-8601
  collectedAt: string;
  format: ContentFormat;
  durationSec: number;
  title: string;
  caption: string;
  hashtags: string[];
  transcript: string;
  transcriptConfidence: number;
  thumbnailUrl: string;
  frameSamples: FrameSample[];
  hookAnalysis: HookAnalysis;
  ctaType: string;
  ctaText: string;
  proofType: string[];                 // e.g. ["screenshot", "data", "testimonial"]
  narrativeShape: string;              // e.g. "open_loop", "listicle", "mini_story"
  metrics: RawMetrics;
  normalizedMetrics: NormalizedMetrics;
  claimVerifications: Array<{
    claim: string;
    status: ClaimVerification;
  }>;
  inspirationOnly: boolean;            // true = for research reference, not copying
  state: OrchestratorState;
}

// ─── C. Trend Cluster ─────────────────────────────────────────────────────────

export interface OutlierFlags {
  creatorRelativeOutlier: boolean;
  topicRelativeOutlier: boolean;
  crossPlatformOutlier: boolean;
  engagementQualityOutlier: boolean;
  retentionOutlier: boolean;
  monetizationOpportunity: boolean;
  noveltyFlag: boolean;
  fatigueRisk: boolean;
}

export interface TrendTrajectory {
  mentionsVelocity: number;           // mentions per hour
  contentVelocity: number;            // new posts per hour across tracked creators
  creatorAdoptionRate: number;        // % of tracked creators posting on this topic
  audienceReactionIntensity: number;  // avg engagement quality score
  noveltyScore: number;               // 0–1 (1 = never seen before)
  fatigueScore: number;               // 0–1 (1 = audience is bored)
  crossPlatformPresence: Partial<Record<Platform, boolean>>;
}

export interface TrendCluster {
  trendClusterId: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  keywords: string[];
  entities: string[];                  // people, products, companies, concepts
  exampleContentIds: string[];
  trajectory: TrendTrajectory;
  outlierScore: number;                // 0–1 composite
  outlierFlags: OutlierFlags;
  topicStage: TopicStage;
  recommendedAction: RecommendedAction;
  relatedClusterIds: string[];
  businessRelevanceScore: number;      // 0–1 vs your offers/ICPs
  monetizationFit: string[];           // which offers this cluster supports
}

// ─── D. Outlier Detection ─────────────────────────────────────────────────────

export interface OutlierScoringWeights {
  velocityZscore: number;       // 0.25
  retentionZscore: number;      // 0.20
  shareRateZscore: number;      // 0.15
  commentQualityZscore: number; // 0.10
  saveRateZscore: number;       // 0.10
  noveltyScore: number;         // 0.10
  crossPlatformEchoScore: number; // 0.10
}

export const DEFAULT_OUTLIER_WEIGHTS: OutlierScoringWeights = {
  velocityZscore: 0.25,
  retentionZscore: 0.20,
  shareRateZscore: 0.15,
  commentQualityZscore: 0.10,
  saveRateZscore: 0.10,
  noveltyScore: 0.10,
  crossPlatformEchoScore: 0.10,
};

export interface OutlierMinimumBaselines {
  performanceAboveCreatorBaselineMultiple: number;   // e.g. 2.0 = 2× creator avg
  performanceAboveTopicBaselineMultiple: number;
  growthSlopePositiveForIntervals: number;
  minimumCommentQualityScore: number;
  minimumCrossPlatformAccounts: number;
}

export const DEFAULT_OUTLIER_BASELINES: OutlierMinimumBaselines = {
  performanceAboveCreatorBaselineMultiple: 2.0,
  performanceAboveTopicBaselineMultiple: 1.5,
  growthSlopePositiveForIntervals: 3,
  minimumCommentQualityScore: 0.6,
  minimumCrossPlatformAccounts: 2,
};

// ─── E. Research Packet ───────────────────────────────────────────────────────

export interface WebFinding {
  sourceType: "news" | "blog" | "forum" | "video" | "paper" | "tweet" | "reddit";
  url: string;
  title: string;
  summary: string;
  publishedAt?: string;
  relevanceScore: number;    // 0–1
  trustScore: number;        // 0–1
  claimsExtracted: string[];
}

export interface VideoReference {
  url: string;
  platform: Platform;
  title: string;
  whyItMatters: string;
  patternExtracted: string;
  hookType: string;
  durationSec: number;
  estimatedViews?: number;
  thumbnailUrl?: string;
}

export interface QueryExpansionSet {
  baseQuery: string;
  expansions: {
    whyNowQueries: string[];
    howToQueries: string[];
    controversyQueries: string[];
    caseStudyQueries: string[];
    videoQueries: string[];
    redditQueries: string[];
    newsQueries: string[];
    audienceLanguageQueries: string[];
  };
}

export interface ResearchPacket {
  researchPacketId: string;
  trendClusterId: string;
  createdAt: string;
  questionSet: string[];
  queryExpansion: QueryExpansionSet;
  webFindings: WebFinding[];
  videoReferences: VideoReference[];
  audienceLanguageBank: string[];      // exact phrases audience uses
  claimsToVerify: string[];
  opportunities: string[];             // new angles the research revealed
  risks: string[];                     // things to avoid
  controversialAspects: string[];
  consensusPoints: string[];
  disagreementPoints: string[];
  researchCompleteness: number;       // 0–1
  researchProvider: {
    webSearch: "brave" | "serper" | "google_cse" | "none";
    newsSearch: "brave_news" | "newsapi" | "none";
    videoSearch: "youtube_api" | "brave_video" | "none";
    aiGrounding: "perplexity" | "none";
  };
}

// ─── F. Strategy Packet ───────────────────────────────────────────────────────

export interface TargetAvatar {
  name: string;                        // e.g. "HNUGC primary avatar"
  avatarType: "HNUGC" | "human" | "faceless_voiceover";
  awarenessLevel: FunnelStage;
  painPoints: string[];
  desiredOutcomes: string[];
  languageToUse: string[];
  languageToAvoid: string[];
  icpId?: string;                      // link to IsaiahReelSchema ICP
}

export interface ContentAngle {
  angleName: string;
  angleSummary: string;
  whyNow: string;
  differentiator: string;
  noveltyScore: number;
  fitScore: number;
  overallAngleScore: number;
}

export interface MessageArchitecture {
  hookFamily:
    | "contrarian"
    | "how_to"
    | "trend_explainer"
    | "myth_bust"
    | "checklist"
    | "story"
    | "challenge"
    | "social_proof"
    | "question"
    | "bold_claim";
  corePromises: string[];
  proofPoints: string[];
  ctaFamily: "comment" | "click" | "follow" | "download" | "subscribe" | "reply" | "dm";
  emotionalTrigger: string;           // e.g. "fear of missing out", "relief"
  narrativeShape:
    | "open_loop"
    | "listicle"
    | "mini_story"
    | "explainer"
    | "reaction"
    | "tutorial"
    | "comparison";
}

export interface PlatformAdaptation {
  enabled: boolean;
  durationSec: number;
  hookVariant: string;
  captionVariant: string;
  hashtags: string[];
  coverFrameStrategy: string;
}

export interface StrategyPacket {
  strategyPacketId: string;
  trendClusterId: string;
  researchPacketId: string;
  createdAt: string;
  targetAvatar: TargetAvatar;
  contentGoal: "reach" | "engagement" | "lead_gen" | "app_install" | "newsletter" | "sale";
  primaryOfferId?: string;
  selectedAngle: ContentAngle;
  alternativeAngles: ContentAngle[];
  messageArchitecture: MessageArchitecture;
  platformAdaptations: Partial<Record<Platform, PlatformAdaptation>>;
  competitorReferenceIds: string[];    // content_ids used as structural references
  differentiationInstructions: string[];
  brandVoiceRules: string[];
  legalNotes: string[];
}

// ─── G. Content Brief ─────────────────────────────────────────────────────────

export interface BriefScript {
  hook: {
    lines: string[];
    targetSec: number;
    goal: "pattern_interrupt";
  };
  setup: {
    lines: string[];
    targetSec: number;
    goal: "establish_context";
  };
  value: {
    lines: string[];
    targetSec: number;
    goal: "deliver_insight_and_proof";
  };
  payoff: {
    lines: string[];
    targetSec: number;
    goal: "resolve_tension";
  };
  cta: {
    lines: string[];
    targetSec: number;
    goal: "desired_action";
  };
}

export interface BriefConstraints {
  mustNotCopy: boolean;
  mustIncludeCitationNotes: boolean;
  brandVoice: string[];
  visualConstraints: string[];
  factChecked: boolean;
  claimsReviewed: boolean;
  rightsReviewed: boolean;
}

export interface ContentBriefFull {
  contentBriefId: string;
  strategyPacketId: string;
  status: "draft" | "approved" | "rendering" | "published" | "learning";
  createdAt: string;
  updatedAt: string;

  // Overview
  briefSummary: string;
  titleCandidates: string[];
  thumbnailConcepts: string[];

  // Deliverables
  deliverables: string[];              // e.g. ["9:16 short-form video", "caption", "thumbnail"]
  primaryPlatform: Platform;
  altPlatforms: Platform[];

  // Timing
  timing: {
    targetDurationSec: number;
    publishWindow: string;             // ISO-8601
    checkbackOffsetsMins: number[];   // e.g. [15, 60, 180, 1440]
  };

  // Content
  keyClaims: string[];
  supportingEvidence: string[];
  audienceLanguage: string[];
  cta: {
    primary: string;
    secondary: string;
    keyword?: string;                  // for comment keyword CTAs
  };

  // Script
  script: BriefScript;

  // Constraints
  constraints: BriefConstraints;

  // KPI expectations
  kpiTargets: {
    views24h: number;
    retention3s: number;
    completionRate: number;
    engagementRate: number;
    shareRate: number;
    leadConversions?: number;
  };

  // Links to downstream objects
  timelineBlueprintId?: string;
  avatarPlanId?: string;
  assetManifestId?: string;
  renderJobId?: string;
  learningRecordId?: string;

  state: OrchestratorState;
}

// ─── H. Timeline Blueprint ────────────────────────────────────────────────────

export type VisualType =
  | "avatar_talking"
  | "broll"
  | "screencap"
  | "ugc_clip"
  | "motion_graphic"
  | "static_image"
  | "text_only"
  | "split_screen"
  | "pip";

export type TransitionType = "cut" | "swipe" | "zoom" | "flash" | "dissolve" | "slide";

export interface TimelineBeat {
  beatId: string;
  startSec: number;
  endSec: number;
  purpose:
    | "hook"
    | "setup"
    | "proof"
    | "value"
    | "demo"
    | "social_proof"
    | "objection_handle"
    | "payoff"
    | "cta"
    | "transition"
    | "intro"
    | "outro";
  voiceover: string;                   // exact lines to speak
  onScreenText: string;                // caption or overlay text shown
  visualType: VisualType;
  assetRefs: string[];                 // asset_ids from AssetManifest
  cameraNotes: string;
  captionStyle: string;                // preset from CaptionStyleLibrary
  sfx: string[];
  transitionOut: TransitionType;
  energyLevel: number;                 // 0–1 (drives zoom/cut intensity in Remotion)
  avatarPresent: boolean;
  avatarNotes?: string;
}

export interface TimelineBlueprint {
  timelineBlueprintId: string;
  contentBriefId: string;
  createdAt: string;
  fps: 30;
  resolution: "1080x1920" | "1920x1080" | "1080x1080";
  totalDurationSec: number;
  beats: TimelineBeat[];
  musicBedRef?: string;
  sfxMasterRef?: string;
  exportPreset: "instagram_reels" | "tiktok" | "youtube_shorts" | "youtube_long";
}

// ─── I. Avatar Placement Plan ─────────────────────────────────────────────────

export type ScreenPosition =
  | "center"
  | "left"
  | "right"
  | "pip_bottom_right"
  | "pip_bottom_left"
  | "pip_top_right"
  | "fullscreen";

export type AvatarFraming = "close" | "medium" | "wide";

export interface AvatarModel {
  type: "HNUGC" | "human" | "faceless_voiceover";
  avatarId?: string;                  // HeyGen avatar ID or custom model ID
  voiceProfile: string;
  personaRules: string[];
  lipSyncEnabled: boolean;
  faceReplaceEnabled: boolean;
}

export interface AvatarPlacement {
  beatId: string;
  startSec: number;
  endSec: number;
  screenPosition: ScreenPosition;
  framing: AvatarFraming;
  emotion: ContentMood;
  lipSyncRequired: boolean;
  gazeDirection: "camera" | "screen_left" | "screen_right" | "down";
  scriptLines: string[];              // exact lines spoken here
  backgroundType: "transparent" | "blurred" | "broll" | "solid_color";
  zoomEffect: boolean;
}

export interface AvatarPlacementPlan {
  avatarPlanId: string;
  contentBriefId: string;
  createdAt: string;
  avatarModel: AvatarModel;
  placements: AvatarPlacement[];
  totalAvatarTimeSec: number;
  avatarCoverage: number;             // 0–1 of total video duration
  voiceoverProvider: "heygen" | "elevenlabs" | "local_whisper" | "recorded";
  voiceoverScript: string;            // full concatenated voiceover text
  audioQualityTarget: "broadcast" | "social" | "web";
}

// ─── J. Asset Manifest ────────────────────────────────────────────────────────

export type AssetType = "video" | "image" | "audio" | "caption" | "svg" | "json" | "font";
export type AssetSource = "internal" | "licensed" | "generated" | "captured" | "api";

export interface AssetItem {
  assetId: string;
  type: AssetType;
  source: AssetSource;
  path: string;                        // local or cloud URL
  rightsStatus: RightsStatus;
  tags: string[];
  beatIds: string[];                   // which beats reference this asset
  startTrimSec?: number;
  endTrimSec?: number;
  transformInstructions?: string;
  alternateAssetIds: string[];         // fallbacks if primary not available
}

export interface AssetManifest {
  assetManifestId: string;
  contentBriefId: string;
  createdAt: string;
  assets: AssetItem[];
  allRightsCleared: boolean;
  missingAssets: string[];
  assetResolutionStatus: "pending" | "resolved" | "partial" | "failed";
}

// ─── K. Render Job ────────────────────────────────────────────────────────────

export type QACheck =
  | "audio_peak_under_threshold"
  | "captions_inside_safe_zone"
  | "cta_present"
  | "no_missing_assets"
  | "hook_visible_under_1_second"
  | "avatar_not_covering_text"
  | "face_safe_zones_respected"
  | "brand_name_present"
  | "summary_strap_present"
  | "render_quality_ok"
  | "duration_within_target"
  | "no_copyright_music";

export interface RenderOutputTarget {
  platform: Platform;
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:5";
  codec: "h264" | "h265" | "vp9";
  crf: number;
  resolution: string;
  outputPath: string;
}

export interface RenderJob {
  renderJobId: string;
  contentBriefId: string;
  createdAt: string;
  renderer: Renderer;
  compositionId: string;               // Remotion composition ID
  inputProps: {
    timelineBlueprintId: string;
    avatarPlanId: string;
    assetManifestId: string;
    captionTheme: string;
    brandTheme: string;
    fps: 30;
    experimentArm?: string;
  };
  outputTargets: RenderOutputTarget[];
  qaChecks: QACheck[];
  qaResults?: Partial<Record<QACheck, boolean>>;
  qaStatus?: "pending" | "passed" | "failed";
  renderStatus: "queued" | "rendering" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  outputUrls?: Partial<Record<Platform, string>>;
  premiereProjectPath?: string;        // optional Premiere finishing lane
  errorMessage?: string;
}

// ─── L. Performance Learning Record ──────────────────────────────────────────

export interface ObservedMetrics {
  views1h: number;
  views24h: number;
  views72h: number;
  views7d: number;
  retention3s: number;
  retention50pct: number;
  completionRate: number;
  shareRate: number;
  saveRate: number;
  commentRate: number;
  commentQualityScore: number;
  ctr: number;
  conversionRate: number;
  profileVisits: number;
  leads?: number;
  appInstalls?: number;
}

export interface DeltaAnalysis {
  hookGap: string;
  pacingGap: string;
  topicFitGap: string;
  ctaGap: string;
  visualGap: string;
  avatarPlacementGap: string;
  captionGap: string;
  overallAssessment: "better_than_expected" | "as_expected" | "underperformed";
}

export interface PatternUpdate {
  patternKey: string;
  outcome: "promote" | "deprioritize" | "test_again";
  confidence: number;
  sampleSize: number;
  winRate: number;
  avgRetention: number;
  avgShareRate: number;
}

export interface PerformanceLearningRecord {
  learningId: string;
  contentBriefId: string;
  renderJobId: string;
  publishedAt: string;
  capturedAt: string;
  expectedMetrics: Partial<ObservedMetrics>;
  observedMetrics: ObservedMetrics;
  deltaAnalysis: DeltaAnalysis;
  patternUpdates: PatternUpdate[];
  newHypotheses: string[];
  shouldReplicate: boolean;
  replicationInstructions?: string;
}

// ─── M. Pattern Memory ────────────────────────────────────────────────────────

export interface PatternMemoryEntry {
  patternKey: string;                  // e.g. "hook:contrarian+proof:screenshot+cta:comment"
  contexts: string[];                  // niches/topics where pattern works
  winRate: number;                     // 0–1
  avgRetention: number;
  avgShareRate: number;
  avgEngagementRate: number;
  sampleSize: number;
  confidence: number;                  // 0–1 (low at start, rises with data)
  recommendedUse: "use" | "test" | "avoid";
  lastUpdatedAt: string;
  createdAt: string;
  exampleContentIds: string[];
}

export interface PatternMemoryStore {
  storeId: string;
  workspaceId: string;
  updatedAt: string;
  patterns: PatternMemoryEntry[];
  hookWinRates: Partial<Record<string, number>>;
  formatWinRates: Partial<Record<ContentFormat, number>>;
  durationWinRates: Record<string, number>;  // key: "0-15s", "15-30s", etc.
  platformBestTimes: Partial<Record<Platform, string[]>>;
  ctaConversionRates: Partial<Record<string, number>>;
  visualMotifRetentionScores: Record<string, number>;
  trendCategoryFatigueScores: Record<string, number>;
}

// ─── N. Content Opportunity Score ────────────────────────────────────────────

export interface ContentOpportunityScore {
  contentId?: string;
  trendClusterId?: string;
  computedAt: string;
  scores: {
    nicheRelevance: number;
    monetizationFit: number;
    audienceUrgency: number;
    novelty: number;
    proofAvailability: number;
    platformSuitability: number;
    productionFeasibility: number;
    businessScore: number;
    overallScore: number;
  };
  recommendation: RecommendedAction;
  confidence: number;
  reasonCodes: string[];
}

// ─── O. Posting Frequency Strategy ───────────────────────────────────────────

export interface PostingFrequencyInference {
  creatorId: string;
  inferredAt: string;
  avgIntervalHours: number;
  dominantDays: string[];              // e.g. ["monday", "wednesday", "friday"]
  dominantHours: number[];             // 0–23
  burstDayPattern: string;
  seriesPatterns: string[];
  topicRotation: string[];
  repostingBehavior: CreatorProfile["postingProfile"]["repostingBehavior"];
  timeOfDayClusters: Array<{
    window: string;
    avgPerformanceMultiple: number;
  }>;
}

export interface ContentStrategyInference {
  creatorId: string;
  inferredAt: string;
  topHookFamilies: string[];
  topFormats: ContentFormat[];
  topEmotions: ContentMood[];
  topTopics: string[];
  avgDurationByTopic: Record<string, number>;
  ctaDistribution: Record<string, number>;
  proofDistribution: Record<string, number>;
  winningPatterns: string[];
  weakPatterns: string[];
}

// ─── P. Top-Level Orchestration Job ──────────────────────────────────────────

export interface AutonomousContentJob {
  jobId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  state: OrchestratorState;

  // Source trigger
  triggerType: "scheduled" | "manual" | "outlier_detected" | "creator_post_detected";
  sourceCreatorIds: string[];
  sourceTrendClusterIds: string[];

  // Linked objects (built progressively)
  discoveredContentIds: string[];
  trendClusters: TrendCluster[];
  researchPacket?: ResearchPacket;
  strategyPacket?: StrategyPacket;
  contentBrief?: ContentBriefFull;
  timelineBlueprint?: TimelineBlueprint;
  avatarPlan?: AvatarPlacementPlan;
  assetManifest?: AssetManifest;
  renderJob?: RenderJob;
  learningRecord?: PerformanceLearningRecord;

  // Tracking
  stateHistory: Array<{ state: OrchestratorState; at: string; notes?: string }>;
  errors: Array<{ state: OrchestratorState; error: string; at: string }>;
  humanOverridePoints: string[];

  // Scoring
  opportunityScore?: ContentOpportunityScore;

  // Experiment
  experimentArmId?: string;
}

// ─── Q. API Source Registry ───────────────────────────────────────────────────

export interface DataSourceConfig {
  sourceId: string;
  sourceType:
    | "youtube_data_api"
    | "youtube_analytics_api"
    | "instagram_graph_api"
    | "tiktok_display_api"
    | "perplexity_api"
    | "brave_search_api"
    | "reddit_api"
    | "browser_agent"
    | "internal_database";
  enabled: boolean;
  rateLimit: {
    requestsPerDay: number;
    requestsPerMinute: number;
    costPerRequest?: number;           // in quota units or USD
  };
  capabilities: string[];             // what this source can fetch
  requiresAuth: boolean;
  credentialRef: string;              // env var name
  notes: string;
}

export const DATA_SOURCES: DataSourceConfig[] = [
  {
    sourceId: "youtube_data_api",
    sourceType: "youtube_data_api",
    enabled: true,
    rateLimit: { requestsPerDay: 10000, requestsPerMinute: 100 },
    capabilities: [
      "channel_metadata",
      "video_metadata",
      "search_videos",
      "playlist_items",
      "comment_threads",
      "video_categories",
    ],
    requiresAuth: true,
    credentialRef: "YOUTUBE_API_KEY",
    notes: "search.list costs 100 units; videos.list costs 1 unit — prefer videos.list",
  },
  {
    sourceId: "perplexity_api",
    sourceType: "perplexity_api",
    enabled: true,
    rateLimit: { requestsPerDay: 500, requestsPerMinute: 5 },
    capabilities: [
      "web_grounded_answers",
      "news_grounded_answers",
      "trend_analysis",
      "claim_verification",
      "entity_research",
    ],
    requiresAuth: true,
    credentialRef: "PERPLEXITY_API_KEY",
    notes: "Best for deep research expansion; returns cited grounded answers",
  },
  {
    sourceId: "brave_search_api",
    sourceType: "brave_search_api",
    enabled: true,
    rateLimit: { requestsPerDay: 2000, requestsPerMinute: 20 },
    capabilities: [
      "web_search",
      "news_search",
      "video_search",
      "image_search",
      "discussion_search",
    ],
    requiresAuth: true,
    credentialRef: "BRAVE_SEARCH_API_KEY",
    notes: "Retrieval breadth; use alongside Perplexity for synthesis",
  },
  {
    sourceId: "instagram_graph_api",
    sourceType: "instagram_graph_api",
    enabled: true,
    rateLimit: { requestsPerDay: 200, requestsPerMinute: 10 },
    capabilities: [
      "own_account_insights",
      "own_media_metrics",
      "publishing",
      "hashtag_search",
      "business_discovery",
    ],
    requiresAuth: true,
    credentialRef: "INSTAGRAM_ACCESS_TOKEN",
    notes: "Only full metrics for own accounts; limited competitor data",
  },
  {
    sourceId: "browser_agent",
    sourceType: "browser_agent",
    enabled: true,
    rateLimit: { requestsPerDay: 100, requestsPerMinute: 2 },
    capabilities: [
      "public_page_cadence_sampling",
      "creator_profile_capture",
      "visible_posting_frequency",
      "landing_page_capture",
    ],
    requiresAuth: false,
    credentialRef: "",
    notes: "Use only for publicly visible data; stay within platform terms of service",
  },
];

// ─── R. Remotion Composition Props for Intelligence Engine ────────────────────

export interface TrendVideoCompositionProps {
  timelineBlueprintId: string;
  beats: TimelineBeat[];
  avatarPlan: AvatarPlacementPlan;
  assetManifest: AssetManifest;
  captionTheme: string;
  brandTheme: string;
  fps: 30;
  resolution: "1080x1920";
  platform: Platform;
  experimentArmId?: string;
  // Runtime-resolved at render time:
  resolvedAssets?: Record<string, string>;  // assetId → local/cloud path
}

// Remotion component hierarchy (for documentation):
//
// <VideoRoot>
//   <GlobalBackground />
//   <BeatSequenceMap beats={beats}>
//     <HookScene />
//     <SetupScene />
//     <ProofScene />
//     <DemoScene />
//     <PayoffScene />
//     <CTASection />
//   </BeatSequenceMap>
//   <CaptionLayer />
//   <AvatarLayer avatarPlan={avatarPlan} />
//   <SFXLayer />
//   <BrandOverlay />
// </VideoRoot>

// ─── S. Database Table Definitions (for Supabase) ────────────────────────────

// Maps each schema object to its Supabase table
export const SUPABASE_TABLE_MAP = {
  creatorProfile: "content_intel_creator_profiles",
  contentItem: "content_intel_content_items",
  trendCluster: "content_intel_trend_clusters",
  researchPacket: "content_intel_research_packets",
  strategyPacket: "content_intel_strategy_packets",
  contentBrief: "content_intel_briefs",
  timelineBlueprint: "content_intel_timeline_blueprints",
  avatarPlan: "content_intel_avatar_plans",
  assetManifest: "content_intel_asset_manifests",
  renderJob: "content_intel_render_jobs",
  learningRecord: "content_intel_learning_records",
  patternMemory: "content_intel_pattern_memory",
  autonomousJob: "content_intel_autonomous_jobs",
  opportunityScore: "content_intel_opportunity_scores",
} as const;
