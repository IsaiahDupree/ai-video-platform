/**
 * Trend-Driven Autonomous Content Engine — Orchestrator
 *
 * State machine:
 *   DISCOVERED → NORMALIZED → FEATURE_EXTRACTED → SCORED
 *   → RESEARCH_EXPANDED → ANGLE_SELECTED → BRIEF_COMPILED
 *   → ASSETS_RESOLVED → SCRIPTED → TIMELINED → RENDERING
 *   → QA_PASSED → PUBLISHED → CHECKBACK_PENDING
 *   → LEARNING_CAPTURED → PATTERN_MEMORY_UPDATED
 */

import type {
  CreatorProfile,
  ContentItem,
  TrendCluster,
  ResearchPacket,
  StrategyPacket,
  ContentBriefFull,
  TimelineBlueprint,
  TimelineBeat,
  AvatarPlacementPlan,
  AvatarPlacement,
  AssetManifest,
  RenderJob,
  PerformanceLearningRecord,
  PatternMemoryEntry,
  PatternMemoryStore,
  ContentOpportunityScore,
  AutonomousContentJob,
  OutlierScoringWeights,
  OutlierMinimumBaselines,
  PostingFrequencyInference,
  ContentStrategyInference,
  QueryExpansionSet,
  OrchestratorState,
  Platform,
  ContentFormat,
} from "../types/ContentIntelligenceSchema";

import {
  DEFAULT_OUTLIER_WEIGHTS,
  DEFAULT_OUTLIER_BASELINES,
} from "../types/ContentIntelligenceSchema";

// ─── Type for AI call injection ───────────────────────────────────────────────

export interface EngineConfig {
  workspaceId: string;
  /** Inject Claude or any LLM via callAI */
  callAI: (prompt: string, systemPrompt?: string) => Promise<string>;
  /** Brave Search API — returns JSON array of results */
  callBraveSearch?: (query: string, type?: "web" | "news" | "videos") => Promise<BraveResult[]>;
  /** Perplexity — returns grounded answer with citations */
  callPerplexity?: (query: string) => Promise<PerplexityResult>;
  /** YouTube Data API wrapper */
  callYouTube?: (endpoint: string, params: Record<string, string>) => Promise<unknown>;
  /** Supabase client for persistence */
  supabase?: SupabaseClientLike;
  outlierWeights?: OutlierScoringWeights;
  outlierBaselines?: OutlierMinimumBaselines;
  /** PostHog or similar for event tracking */
  emitEvent?: (event: string, properties: Record<string, unknown>) => Promise<void>;
}

interface BraveResult {
  title: string;
  url: string;
  description: string;
  published?: string;
  type: "web" | "news" | "video";
}

interface PerplexityResult {
  answer: string;
  citations: Array<{ url: string; title: string }>;
}

interface SupabaseClientLike {
  from: (table: string) => {
    insert: (data: unknown) => Promise<{ error: unknown }>;
    upsert: (data: unknown) => Promise<{ error: unknown }>;
    select: (cols?: string) => {
      eq: (col: string, val: string) => Promise<{ data: unknown[]; error: unknown }>;
    };
  };
}

// ─── 1. Intelligence Engine ───────────────────────────────────────────────────

/**
 * Infer posting frequency patterns from a set of content items.
 */
export function inferPostingFrequency(
  creator: CreatorProfile,
  items: ContentItem[]
): PostingFrequencyInference {
  const sorted = [...items].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff =
      (new Date(sorted[i].publishedAt).getTime() -
        new Date(sorted[i - 1].publishedAt).getTime()) /
      3600000;
    intervals.push(diff);
  }

  const avgInterval = intervals.length > 0
    ? intervals.reduce((a, b) => a + b, 0) / intervals.length
    : 24;

  const hourCounts = new Array(24).fill(0);
  const dayCounts: Record<string, number> = {};
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  for (const item of sorted) {
    const d = new Date(item.publishedAt);
    hourCounts[d.getUTCHours()]++;
    const day = days[d.getUTCDay()];
    dayCounts[day] = (dayCounts[day] ?? 0) + 1;
  }

  const topHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((x) => x.hour);

  const topDays = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day]) => day);

  return {
    creatorId: creator.creatorId,
    inferredAt: new Date().toISOString(),
    avgIntervalHours: avgInterval,
    dominantDays: topDays,
    dominantHours: topHours,
    burstDayPattern: avgInterval < 8 ? "multiple_per_day" : "spread",
    seriesPatterns: creator.postingProfile.seriesPatterns,
    topicRotation: creator.postingProfile.topicRotation,
    repostingBehavior: creator.postingProfile.repostingBehavior,
    timeOfDayClusters: topHours.map((h) => ({
      window: `${String(h).padStart(2, "0")}:00`,
      avgPerformanceMultiple: 1.0, // computed in a later pass with metrics
    })),
  };
}

/**
 * Infer content strategy patterns from a ranked set of content items.
 */
export function inferContentStrategy(
  creator: CreatorProfile,
  items: ContentItem[]
): ContentStrategyInference {
  const hookTally: Record<string, number> = {};
  const formatTally: Record<string, number> = {};
  const topicTally: Record<string, number> = {};
  const ctaTally: Record<string, number> = {};
  const proofTally: Record<string, number> = {};

  for (const item of items) {
    const hook = item.hookAnalysis.hookType;
    hookTally[hook] = (hookTally[hook] ?? 0) + 1;
    formatTally[item.format] = (formatTally[item.format] ?? 0) + 1;
    for (const h of item.hashtags.slice(0, 3)) {
      topicTally[h] = (topicTally[h] ?? 0) + 1;
    }
    ctaTally[item.ctaType] = (ctaTally[item.ctaType] ?? 0) + 1;
    for (const p of item.proofType) {
      proofTally[p] = (proofTally[p] ?? 0) + 1;
    }
  }

  const topHooks = Object.entries(hookTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  const topFormats = Object.entries(formatTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k as ContentFormat);

  const topTopics = Object.entries(topicTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  // Average duration by topic (simplified)
  const avgDurationByTopic: Record<string, number> = {};
  for (const item of items) {
    for (const h of item.hashtags.slice(0, 2)) {
      if (!avgDurationByTopic[h]) avgDurationByTopic[h] = item.durationSec;
      else avgDurationByTopic[h] = (avgDurationByTopic[h] + item.durationSec) / 2;
    }
  }

  const winningItems = items.filter(
    (i) => i.normalizedMetrics.outlierScore > 0.7
  );
  const weakItems = items.filter(
    (i) => i.normalizedMetrics.outlierScore < 0.3
  );

  return {
    creatorId: creator.creatorId,
    inferredAt: new Date().toISOString(),
    topHookFamilies: topHooks,
    topFormats,
    topEmotions: ["confident", "authoritative"],
    topTopics,
    avgDurationByTopic,
    ctaDistribution: ctaTally,
    proofDistribution: proofTally,
    winningPatterns: winningItems.map(
      (i) => `hook:${i.hookAnalysis.hookType}+cta:${i.ctaType}+duration:${Math.round(i.durationSec)}s`
    ),
    weakPatterns: weakItems.map(
      (i) => `hook:${i.hookAnalysis.hookType}+cta:${i.ctaType}`
    ),
  };
}

// ─── 2. Outlier Detection Engine ─────────────────────────────────────────────

/**
 * Compute outlier z-score for a single metric against a baseline array.
 */
function zScore(value: number, baseline: number[]): number {
  if (baseline.length === 0) return 0;
  const mean = baseline.reduce((a, b) => a + b, 0) / baseline.length;
  const variance = baseline.reduce((s, x) => s + (x - mean) ** 2, 0) / baseline.length;
  const sd = Math.sqrt(variance) || 1;
  return (value - mean) / sd;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Score a ContentItem for outlier potential relative to creator baselines.
 * Pass creatorItems = all items from same creator for baseline computation.
 */
export function scoreOutlier(
  item: ContentItem,
  creatorItems: ContentItem[],
  weights: OutlierScoringWeights = DEFAULT_OUTLIER_WEIGHTS,
  noveltyScore = 0.5,
  crossPlatformEchoScore = 0.3
): number {
  const velocities = creatorItems.map((i) => i.normalizedMetrics.vph);
  const retentions = creatorItems.map((i) => i.normalizedMetrics.retentionScore);
  const shareRates = creatorItems.map((i) => i.normalizedMetrics.shareRate);
  const commentRates = creatorItems.map((i) => i.normalizedMetrics.qualityCommentRatio);
  const saveRates = creatorItems.map((i) => i.normalizedMetrics.saveRate);

  const velocityZ = clamp01(zScore(item.normalizedMetrics.vph, velocities) / 3 + 0.5);
  const retentionZ = clamp01(zScore(item.normalizedMetrics.retentionScore, retentions) / 3 + 0.5);
  const shareZ = clamp01(zScore(item.normalizedMetrics.shareRate, shareRates) / 3 + 0.5);
  const commentZ = clamp01(zScore(item.normalizedMetrics.qualityCommentRatio, commentRates) / 3 + 0.5);
  const saveZ = clamp01(zScore(item.normalizedMetrics.saveRate, saveRates) / 3 + 0.5);

  return (
    velocityZ * weights.velocityZscore +
    retentionZ * weights.retentionZscore +
    shareZ * weights.shareRateZscore +
    commentZ * weights.commentQualityZscore +
    saveZ * weights.saveRateZscore +
    noveltyScore * weights.noveltyScore +
    crossPlatformEchoScore * weights.crossPlatformEchoScore
  );
}

/**
 * Check if a content item meets all minimum outlier baselines.
 */
export function meetsOutlierBaselines(
  item: ContentItem,
  creatorAvgViews: number,
  topicAvgViews: number,
  baselines: OutlierMinimumBaselines = DEFAULT_OUTLIER_BASELINES
): boolean {
  return (
    item.metrics.views >= creatorAvgViews * baselines.performanceAboveCreatorBaselineMultiple &&
    item.metrics.views >= topicAvgViews * baselines.performanceAboveTopicBaselineMultiple &&
    item.normalizedMetrics.qualityCommentRatio >= baselines.minimumCommentQualityScore
  );
}

/**
 * Score content opportunity for whether to replicate this trend.
 * Returns a 0–1 score across all dimensions.
 */
export function scoreOpportunity(
  item: ContentItem,
  cluster: TrendCluster,
  businessRelevance: number,
  productionFeasibility: number
): ContentOpportunityScore {
  const s = {
    nicheRelevance: clamp01(businessRelevance),
    monetizationFit: clamp01(cluster.businessRelevanceScore),
    audienceUrgency: clamp01(cluster.trajectory.audienceReactionIntensity),
    novelty: clamp01(cluster.trajectory.noveltyScore),
    proofAvailability: item.proofType.length > 0 ? 0.8 : 0.4,
    platformSuitability:
      cluster.trajectory.crossPlatformPresence.instagram_reels ? 0.9 : 0.6,
    productionFeasibility: clamp01(productionFeasibility),
    businessScore: clamp01(businessRelevance * 0.6 + cluster.businessRelevanceScore * 0.4),
    overallScore: 0,
  };

  s.overallScore =
    s.nicheRelevance * 0.18 +
    s.monetizationFit * 0.15 +
    s.audienceUrgency * 0.13 +
    s.novelty * 0.12 +
    s.proofAvailability * 0.10 +
    s.platformSuitability * 0.10 +
    s.productionFeasibility * 0.12 +
    s.businessScore * 0.10;

  const recommendation =
    s.overallScore > 0.75 ? "double_down"
    : s.overallScore > 0.55 ? "test"
    : s.overallScore > 0.35 ? "monitor"
    : "skip";

  return {
    contentId: item.contentId,
    trendClusterId: cluster.trendClusterId,
    computedAt: new Date().toISOString(),
    scores: s,
    recommendation,
    confidence: clamp01(s.overallScore * 1.2),
    reasonCodes: [
      s.novelty > 0.7 ? "high_novelty" : "",
      s.audienceUrgency > 0.7 ? "high_urgency" : "",
      s.monetizationFit > 0.7 ? "strong_monetization_fit" : "",
      s.productionFeasibility < 0.4 ? "low_feasibility_risk" : "",
    ].filter(Boolean),
  };
}

// ─── 3. Research Engine ───────────────────────────────────────────────────────

/** Build query expansion set from a trend cluster label and keywords */
export function buildQueryExpansion(
  cluster: TrendCluster
): QueryExpansionSet {
  const base = cluster.label;
  const kw = cluster.keywords.slice(0, 3).join(" ");

  return {
    baseQuery: base,
    expansions: {
      whyNowQueries: [
        `why is ${base} trending right now`,
        `${base} 2026 why people care`,
        `${kw} recent news`,
      ],
      howToQueries: [
        `how to ${base} step by step`,
        `${base} tutorial for beginners`,
        `best way to ${kw}`,
      ],
      controversyQueries: [
        `${base} controversy`,
        `${base} wrong misconception`,
        `${kw} debate`,
      ],
      caseStudyQueries: [
        `${base} case study results`,
        `${kw} success story`,
        `${base} before after`,
      ],
      videoQueries: [
        `${base} video`,
        `${kw} explained video`,
        `best ${base} YouTube`,
      ],
      redditQueries: [
        `site:reddit.com ${base}`,
        `reddit ${kw} discussion`,
        `reddit ${base} community`,
      ],
      newsQueries: [
        `${base} latest news`,
        `${kw} news 2026`,
        `${base} announcement`,
      ],
      audienceLanguageQueries: [
        `"${base}" people saying`,
        `${kw} comments reactions`,
        `what people think about ${base}`,
      ],
    },
  };
}

/**
 * Run the full research expansion for a trend cluster.
 * Calls Perplexity + Brave in sequence, merges, dedupes.
 */
export async function expandResearch(
  cluster: TrendCluster,
  config: EngineConfig
): Promise<ResearchPacket> {
  const queryExpansion = buildQueryExpansion(cluster);
  const packetId = `rp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const webFindings: ResearchPacket["webFindings"] = [];
  const videoReferences: ResearchPacket["videoReferences"] = [];
  const audienceLanguage: string[] = [];

  // 1. Perplexity — grounded synthesis
  if (config.callPerplexity) {
    const questions = [
      `What is happening with "${cluster.label}" right now and why does it matter?`,
      `What are the strongest audience reactions and misconceptions about "${cluster.label}"?`,
      `What is a unique angle on "${cluster.label}" that most creators have not covered?`,
    ];
    for (const q of questions) {
      try {
        const result = await config.callPerplexity(q);
        webFindings.push({
          sourceType: "blog",
          url: result.citations[0]?.url ?? "",
          title: q,
          summary: result.answer,
          relevanceScore: 0.9,
          trustScore: 0.85,
          claimsExtracted: [result.answer.slice(0, 200)],
        });
        for (const c of result.citations) {
          webFindings.push({
            sourceType: "news",
            url: c.url,
            title: c.title,
            summary: "",
            relevanceScore: 0.7,
            trustScore: 0.75,
            claimsExtracted: [],
          });
        }
      } catch (_) {
        // continue on API failure
      }
    }
  }

  // 2. Brave — retrieval breadth
  if (config.callBraveSearch) {
    const queries = [
      ...queryExpansion.expansions.whyNowQueries.slice(0, 2),
      ...queryExpansion.expansions.controversyQueries.slice(0, 1),
      ...queryExpansion.expansions.redditQueries.slice(0, 1),
    ];

    for (const q of queries) {
      try {
        const results = await config.callBraveSearch(q, "web");
        for (const r of results.slice(0, 3)) {
          webFindings.push({
            sourceType: r.type === "video" ? "video" : r.url.includes("reddit") ? "forum" : "blog",
            url: r.url,
            title: r.title,
            summary: r.description,
            publishedAt: r.published,
            relevanceScore: 0.65,
            trustScore: 0.6,
            claimsExtracted: [],
          });
        }
      } catch (_) {}
    }

    // Video search
    try {
      const videoResults = await config.callBraveSearch(
        queryExpansion.expansions.videoQueries[0],
        "videos"
      );
      for (const v of videoResults.slice(0, 5)) {
        videoReferences.push({
          url: v.url,
          platform: v.url.includes("youtube") ? "youtube" : "instagram_reels",
          title: v.title,
          whyItMatters: `Top search result for: ${v.description?.slice(0, 80)}`,
          patternExtracted: "unknown — requires viewing",
          hookType: "unknown",
          durationSec: 0,
        });
      }
    } catch (_) {}
  }

  // 3. AI synthesis of audience language
  if (config.callAI && webFindings.length > 0) {
    const findingsSummary = webFindings
      .slice(0, 5)
      .map((f) => f.summary)
      .join("\n\n");

    const languagePrompt = `Extract 10–15 exact phrases that a real audience member would say about this topic.

Topic: ${cluster.label}

Context:
${findingsSummary}

Return a JSON array of strings only. No explanation.`;

    try {
      const raw = await config.callAI(languagePrompt);
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) audienceLanguage.push(...parsed);
    } catch (_) {}
  }

  // 4. Dedup web findings by URL
  const seen = new Set<string>();
  const deduped = webFindings.filter((f) => {
    if (seen.has(f.url)) return false;
    seen.add(f.url);
    return true;
  });

  return {
    researchPacketId: packetId,
    trendClusterId: cluster.trendClusterId,
    createdAt: new Date().toISOString(),
    questionSet: [
      "What exactly is happening?",
      "Why now?",
      "Who is talking about it?",
      "What are the strongest audience reactions?",
      "What misconceptions exist?",
      "What new angle can we own?",
    ],
    queryExpansion,
    webFindings: deduped,
    videoReferences,
    audienceLanguageBank: audienceLanguage,
    claimsToVerify: [],
    opportunities: [],
    risks: [],
    controversialAspects: [],
    consensusPoints: [],
    disagreementPoints: [],
    researchCompleteness: Math.min(1, deduped.length / 10),
    researchProvider: {
      webSearch: config.callBraveSearch ? "brave" : "none",
      newsSearch: config.callBraveSearch ? "brave_news" : "none",
      videoSearch: config.callBraveSearch ? "brave_video" : "none",
      aiGrounding: config.callPerplexity ? "perplexity" : "none",
    },
  };
}

// ─── 4. Strategy Engine ───────────────────────────────────────────────────────

/** Build the AI prompt to generate strategy packet angles */
export function buildAngleGenerationPrompt(
  cluster: TrendCluster,
  research: ResearchPacket,
  icpPains: string[],
  offerPromise: string,
  existingContent: ContentItem[]
): string {
  const topFinding = research.webFindings[0]?.summary ?? "";
  const audienceLang = research.audienceLanguageBank.slice(0, 5).join(", ");
  const existingHooks = existingContent
    .filter((i) => i.normalizedMetrics.outlierScore > 0.6)
    .map((i) => i.hookAnalysis.hookText)
    .slice(0, 3)
    .join("\n");

  return `You are a content strategist. Generate 5 angles for a short-form video on this trend.

TREND: ${cluster.label}
KEYWORDS: ${cluster.keywords.join(", ")}
TOPIC STAGE: ${cluster.topicStage}

TOP RESEARCH FINDING:
${topFinding}

AUDIENCE LANGUAGE:
${audienceLang}

AUDIENCE PAINS:
${icpPains.join(", ")}

OFFER PROMISE:
${offerPromise}

WINNING HOOKS FROM SIMILAR CONTENT:
${existingHooks || "none yet"}

RULES:
- Do NOT copy existing content. Transform wording, order, framing.
- Each angle must be distinct in approach.
- Prefer contrarian, confession, and system-explanation hooks.
- Score each angle on: noveltyScore (0-1), fitScore (0-1), overallAngleScore (0-1)

Return JSON array:
[
  {
    "angleName": "short name",
    "angleSummary": "1 sentence summary",
    "whyNow": "why this timing matters",
    "differentiator": "how this is different from what others are saying",
    "noveltyScore": 0.0,
    "fitScore": 0.0,
    "overallAngleScore": 0.0
  }
]
Only return valid JSON.`;
}

/** Generate content script from a strategy packet */
export function buildScriptPrompt(
  strategy: StrategyPacket,
  research: ResearchPacket,
  targetDurationSec: number
): string {
  const angle = strategy.selectedAngle;
  const hook = strategy.messageArchitecture.hookFamily;
  const cta = strategy.messageArchitecture.ctaFamily;
  const audienceLang = research.audienceLanguageBank.slice(0, 8).join(", ");

  return `Write a short-form video script for this content.

ANGLE: ${angle.angleName}
SUMMARY: ${angle.angleSummary}
WHY NOW: ${angle.whyNow}
DIFFERENTIATOR: ${angle.differentiator}
HOOK FAMILY: ${hook}
CTA FAMILY: ${cta}
TARGET DURATION: ${targetDurationSec} seconds
AUDIENCE LANGUAGE: ${audienceLang}

STRUCTURE:
- Hook (0–${Math.round(targetDurationSec * 0.07)}s): pattern interrupt
- Setup (${Math.round(targetDurationSec * 0.07)}–${Math.round(targetDurationSec * 0.22)}s): establish context
- Value (${Math.round(targetDurationSec * 0.22)}–${Math.round(targetDurationSec * 0.75)}s): deliver insight + proof
- Payoff (${Math.round(targetDurationSec * 0.75)}–${Math.round(targetDurationSec * 0.9)}s): resolve tension
- CTA (${Math.round(targetDurationSec * 0.9)}–${targetDurationSec}s): desired action

RULES:
- No fluff, no filler words
- Hook must land within first ${Math.round(targetDurationSec * 0.07)} seconds
- Use plain spoken English
- End with a specific, measurable CTA

Return JSON:
{
  "hook": { "lines": [], "targetSec": 0, "goal": "pattern_interrupt" },
  "setup": { "lines": [], "targetSec": 0, "goal": "establish_context" },
  "value": { "lines": [], "targetSec": 0, "goal": "deliver_insight_and_proof" },
  "payoff": { "lines": [], "targetSec": 0, "goal": "resolve_tension" },
  "cta": { "lines": [], "targetSec": 0, "goal": "desired_action" }
}
Only return valid JSON.`;
}

// ─── 5. Timeline Builder ──────────────────────────────────────────────────────

/**
 * Convert a content brief script into a timestamped beat sheet.
 * Each beat maps to a Remotion Sequence.
 */
export function buildTimelineFromScript(
  brief: ContentBriefFull,
  script: ContentBriefFull["script"]
): TimelineBlueprint {
  const blueprintId = `tb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const beats: TimelineBeat[] = [];
  let cursor = 0;

  const beatDefs = [
    { key: "hook", section: script.hook, purpose: "hook" as const, energy: 0.95, visualType: "avatar_talking" as const },
    { key: "setup", section: script.setup, purpose: "setup" as const, energy: 0.65, visualType: "broll" as const },
    { key: "value", section: script.value, purpose: "value" as const, energy: 0.75, visualType: "screencap" as const },
    { key: "payoff", section: script.payoff, purpose: "payoff" as const, energy: 0.85, visualType: "avatar_talking" as const },
    { key: "cta", section: script.cta, purpose: "cta" as const, energy: 0.90, visualType: "avatar_talking" as const },
  ];

  for (const def of beatDefs) {
    const durationSec = def.section.targetSec > 0 ? def.section.targetSec : 5;
    beats.push({
      beatId: `beat_${def.key}`,
      startSec: cursor,
      endSec: cursor + durationSec,
      purpose: def.purpose,
      voiceover: def.section.lines.join(" "),
      onScreenText: def.section.lines[0] ?? "",
      visualType: def.visualType,
      assetRefs: [],
      cameraNotes: def.energy > 0.85 ? "tight medium, no movement" : "slow zoom or stable",
      captionStyle: "isaiah_phrase_blocks_v1",
      sfx: [],
      transitionOut: def.key === "hook" ? "cut" : "cut",
      energyLevel: def.energy,
      avatarPresent: def.visualType === "avatar_talking",
    });
    cursor += durationSec;
  }

  return {
    timelineBlueprintId: blueprintId,
    contentBriefId: brief.contentBriefId,
    createdAt: new Date().toISOString(),
    fps: 30,
    resolution: "1080x1920",
    totalDurationSec: cursor,
    beats,
    exportPreset: brief.primaryPlatform === "youtube" ? "youtube_short" : "instagram_reels" as any,
  };
}

/**
 * Build avatar placement from timeline beats.
 * Avatar appears on hook, payoff, and CTA beats by default.
 */
export function buildAvatarPlan(
  brief: ContentBriefFull,
  timeline: TimelineBlueprint,
  avatarId: string
): AvatarPlacementPlan {
  const planId = `ap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const avatarBeats = timeline.beats.filter((b) => b.avatarPresent);

  const placements: AvatarPlacement[] = avatarBeats.map((beat) => ({
    beatId: beat.beatId,
    startSec: beat.startSec,
    endSec: beat.endSec,
    screenPosition: "center",
    framing: "medium",
    emotion: beat.purpose === "hook" ? "urgent" : beat.purpose === "cta" ? "confident" : "calm",
    lipSyncRequired: true,
    gazeDirection: "camera",
    scriptLines: [beat.voiceover],
    backgroundType: "broll",
    zoomEffect: beat.energyLevel > 0.85,
  }));

  const totalAvatarSec = placements.reduce((s, p) => s + p.endSec - p.startSec, 0);

  return {
    avatarPlanId: planId,
    contentBriefId: brief.contentBriefId,
    createdAt: new Date().toISOString(),
    avatarModel: {
      type: "HNUGC",
      avatarId,
      voiceProfile: "isaiah_primary",
      personaRules: [
        "direct and confident",
        "no filler words",
        "builder operator tone",
        "natural pauses only",
      ],
      lipSyncEnabled: true,
      faceReplaceEnabled: false,
    },
    placements,
    totalAvatarTimeSec: totalAvatarSec,
    avatarCoverage: totalAvatarSec / timeline.totalDurationSec,
    voiceoverProvider: "heygen",
    voiceoverScript: avatarBeats.map((b) => b.voiceover).join(" "),
    audioQualityTarget: "broadcast",
  };
}

// ─── 6. Learning Engine ───────────────────────────────────────────────────────

/**
 * Update pattern memory with new performance data.
 * Call this 24h and 72h after publish.
 */
export function updatePatternMemory(
  store: PatternMemoryStore,
  learning: PerformanceLearningRecord,
  brief: ContentBriefFull
): PatternMemoryStore {
  const now = new Date().toISOString();
  const strategy = brief.script;

  // Build the pattern key from hook + proof + CTA
  const hook = strategy.hook.lines[0]?.split(" ").slice(0, 3).join("_") ?? "unknown";
  const patternKey = `hook:${hook}+cta:${brief.cta.primary.slice(0, 20)}`;

  const existing = store.patterns.find((p) => p.patternKey === patternKey);
  const observed = learning.observedMetrics;
  const isWin = observed.views24h > (learning.expectedMetrics.views24h ?? 0) * 1.2;

  const newEntry: PatternMemoryEntry = {
    patternKey,
    contexts: [],
    winRate: existing
      ? (existing.winRate * existing.sampleSize + (isWin ? 1 : 0)) / (existing.sampleSize + 1)
      : isWin ? 1 : 0,
    avgRetention: existing
      ? (existing.avgRetention * existing.sampleSize + observed.retention3s) / (existing.sampleSize + 1)
      : observed.retention3s,
    avgShareRate: existing
      ? (existing.avgShareRate * existing.sampleSize + observed.shareRate) / (existing.sampleSize + 1)
      : observed.shareRate,
    avgEngagementRate: observed.completionRate,
    sampleSize: (existing?.sampleSize ?? 0) + 1,
    confidence: Math.min(1, ((existing?.sampleSize ?? 0) + 1) / 20),
    recommendedUse:
      ((existing?.winRate ?? 0) + (isWin ? 1 : 0)) / 2 > 0.6
        ? "use"
        : ((existing?.winRate ?? 0) + (isWin ? 1 : 0)) / 2 > 0.4
        ? "test"
        : "avoid",
    lastUpdatedAt: now,
    createdAt: existing?.createdAt ?? now,
    exampleContentIds: [...(existing?.exampleContentIds ?? []), brief.contentBriefId].slice(-5),
  };

  const updatedPatterns = existing
    ? store.patterns.map((p) => (p.patternKey === patternKey ? newEntry : p))
    : [...store.patterns, newEntry];

  return {
    ...store,
    updatedAt: now,
    patterns: updatedPatterns,
  };
}

// ─── 7. Full Orchestrator ─────────────────────────────────────────────────────

/**
 * Run the full autonomous content pipeline from trend cluster to render job.
 * Each step persists to Supabase if config.supabase is provided.
 */
export async function runAutonomousPipeline(
  cluster: TrendCluster,
  creators: CreatorProfile[],
  items: ContentItem[],
  config: EngineConfig,
  options: {
    targetPlatform: Platform;
    primaryOfferId: string;
    icpId: string;
    icpPains: string[];
    offerPromise: string;
    avatarId?: string;
    forcedFunnelStage?: string;
  }
): Promise<AutonomousContentJob> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const stateHistory: AutonomousContentJob["stateHistory"] = [];

  function transition(state: OrchestratorState, notes?: string) {
    stateHistory.push({ state, at: new Date().toISOString(), notes });
    config.emitEvent?.(`pipeline_${state.toLowerCase()}`, {
      jobId,
      workspaceId: config.workspaceId,
      state,
      trendLabel: cluster.label,
    });
  }

  transition("DISCOVERED");

  // 1. Score opportunity
  const topItem = items[0];
  const opportunityScore = topItem
    ? scoreOpportunity(topItem, cluster, cluster.businessRelevanceScore, 0.8)
    : undefined;

  transition("SCORED");

  if (opportunityScore?.recommendation === "skip") {
    return {
      jobId,
      workspaceId: config.workspaceId,
      createdAt: now,
      updatedAt: new Date().toISOString(),
      state: "SCORED",
      triggerType: "outlier_detected",
      sourceCreatorIds: creators.map((c) => c.creatorId),
      sourceTrendClusterIds: [cluster.trendClusterId],
      discoveredContentIds: items.map((i) => i.contentId),
      trendClusters: [cluster],
      opportunityScore,
      stateHistory,
      errors: [],
      humanOverridePoints: [],
    };
  }

  // 2. Research expansion
  let research: ResearchPacket | undefined;
  try {
    research = await expandResearch(cluster, config);
    transition("RESEARCH_EXPANDED");
  } catch (err) {
    stateHistory.push({ state: "RESEARCH_EXPANDED", at: new Date().toISOString(), notes: `FAILED: ${err}` });
  }

  // 3. Strategy + angle generation
  let strategy: StrategyPacket | undefined;
  if (research) {
    try {
      const anglePrompt = buildAngleGenerationPrompt(
        cluster,
        research,
        options.icpPains,
        options.offerPromise,
        items
      );
      const raw = await config.callAI(anglePrompt);
      const angles = JSON.parse(raw);
      const selectedAngle = angles.sort((a: any, b: any) => b.overallAngleScore - a.overallAngleScore)[0];

      strategy = {
        strategyPacketId: `sp_${Date.now()}`,
        trendClusterId: cluster.trendClusterId,
        researchPacketId: research.researchPacketId,
        createdAt: new Date().toISOString(),
        targetAvatar: {
          name: "HNUGC primary avatar",
          avatarType: "HNUGC",
          awarenessLevel: (options.forcedFunnelStage as any) ?? "problem_aware",
          painPoints: options.icpPains,
          desiredOutcomes: [],
          languageToUse: research.audienceLanguageBank.slice(0, 5),
          languageToAvoid: [],
          icpId: options.icpId,
        },
        contentGoal: "engagement",
        primaryOfferId: options.primaryOfferId,
        selectedAngle,
        alternativeAngles: angles.slice(1),
        messageArchitecture: {
          hookFamily: "contrarian",
          corePromises: [],
          proofPoints: [],
          ctaFamily: "comment",
          emotionalTrigger: "relief",
          narrativeShape: "open_loop",
        },
        platformAdaptations: {},
        competitorReferenceIds: items.slice(0, 3).map((i) => i.contentId),
        differentiationInstructions: [
          "Reframe the core insight — do not use the same opener as competitors",
          "Use different proof format",
          "End with a different CTA mechanic",
        ],
        brandVoiceRules: ["direct", "builder", "no filler"],
        legalNotes: [],
      };

      transition("ANGLE_SELECTED");
    } catch (err) {
      stateHistory.push({ state: "ANGLE_SELECTED", at: new Date().toISOString(), notes: `FAILED: ${err}` });
    }
  }

  // 4. Script + content brief
  let brief: ContentBriefFull | undefined;
  if (strategy && research) {
    try {
      const targetDuration = options.targetPlatform === "tiktok" ? 25 : 35;
      const scriptPrompt = buildScriptPrompt(strategy, research, targetDuration);
      const raw = await config.callAI(scriptPrompt);
      const script = JSON.parse(raw);

      const briefId = `brief_${Date.now()}`;
      brief = {
        contentBriefId: briefId,
        strategyPacketId: strategy.strategyPacketId,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        briefSummary: strategy.selectedAngle.angleSummary,
        titleCandidates: [strategy.selectedAngle.angleName],
        thumbnailConcepts: [],
        deliverables: ["9:16 short-form video", "caption", "thumbnail"],
        primaryPlatform: options.targetPlatform,
        altPlatforms: ["tiktok", "youtube_shorts"] as Platform[],
        timing: {
          targetDurationSec: targetDuration,
          publishWindow: new Date(Date.now() + 3600000 * 2).toISOString(),
          checkbackOffsetsMins: [15, 60, 180, 1440],
        },
        keyClaims: strategy.messageArchitecture.corePromises,
        supportingEvidence: strategy.messageArchitecture.proofPoints,
        audienceLanguage: research.audienceLanguageBank.slice(0, 6),
        cta: {
          primary: `Comment ${strategy.messageArchitecture.ctaFamily.toUpperCase()} and I'll send you details`,
          secondary: "Follow for more",
        },
        script,
        constraints: {
          mustNotCopy: true,
          mustIncludeCitationNotes: true,
          brandVoice: strategy.brandVoiceRules,
          visualConstraints: ["high contrast captions", "face-safe zones", "no text over face"],
          factChecked: false,
          claimsReviewed: false,
          rightsReviewed: true,
        },
        kpiTargets: {
          views24h: 500,
          retention3s: 0.7,
          completionRate: 0.35,
          engagementRate: 0.05,
          shareRate: 0.01,
        },
        state: "BRIEF_COMPILED",
      };

      transition("BRIEF_COMPILED");
    } catch (err) {
      stateHistory.push({ state: "BRIEF_COMPILED", at: new Date().toISOString(), notes: `FAILED: ${err}` });
    }
  }

  // 5. Timeline + avatar plan
  let timeline: TimelineBlueprint | undefined;
  let avatarPlan: AvatarPlacementPlan | undefined;

  if (brief) {
    try {
      timeline = buildTimelineFromScript(brief, brief.script);
      avatarPlan = buildAvatarPlan(brief, timeline, options.avatarId ?? "default_heygen_avatar");
      brief.timelineBlueprintId = timeline.timelineBlueprintId;
      brief.avatarPlanId = avatarPlan.avatarPlanId;
      transition("TIMELINED");
    } catch (err) {
      stateHistory.push({ state: "TIMELINED", at: new Date().toISOString(), notes: `FAILED: ${err}` });
    }
  }

  // 6. Render job (queued — actual render happens via MCP remotion_render)
  let renderJob: RenderJob | undefined;
  if (brief && timeline && avatarPlan) {
    renderJob = {
      renderJobId: `render_${Date.now()}`,
      contentBriefId: brief.contentBriefId,
      createdAt: new Date().toISOString(),
      renderer: "remotion",
      compositionId: "IsaiahTalkingHeadV1",
      inputProps: {
        timelineBlueprintId: timeline.timelineBlueprintId,
        avatarPlanId: avatarPlan.avatarPlanId,
        assetManifestId: "",
        captionTheme: "isaiah_phrase_blocks_v1",
        brandTheme: "isaiah_house_style_v1",
        fps: 30,
      },
      outputTargets: [
        {
          platform: options.targetPlatform,
          aspectRatio: "9:16",
          codec: "h264",
          crf: 18,
          resolution: "1080x1920",
          outputPath: `renders/intel/${brief.contentBriefId}.mp4`,
        },
      ],
      qaChecks: [
        "captions_inside_safe_zone",
        "cta_present",
        "hook_visible_under_1_second",
        "brand_name_present",
        "render_quality_ok",
      ],
      renderStatus: "queued",
    };
    brief.renderJobId = renderJob.renderJobId;
    transition("RENDERING");
  }

  // 7. Persist to Supabase
  if (config.supabase && brief) {
    await config.supabase.from("content_intel_briefs").upsert(brief);
    if (timeline) await config.supabase.from("content_intel_timeline_blueprints").upsert(timeline);
    if (avatarPlan) await config.supabase.from("content_intel_avatar_plans").upsert(avatarPlan);
    if (renderJob) await config.supabase.from("content_intel_render_jobs").upsert(renderJob);
    if (research) await config.supabase.from("content_intel_research_packets").upsert(research);
    if (strategy) await config.supabase.from("content_intel_strategy_packets").upsert(strategy);
  }

  return {
    jobId,
    workspaceId: config.workspaceId,
    createdAt: now,
    updatedAt: new Date().toISOString(),
    state: renderJob ? "RENDERING" : brief ? "BRIEF_COMPILED" : "SCORED",
    triggerType: "outlier_detected",
    sourceCreatorIds: creators.map((c) => c.creatorId),
    sourceTrendClusterIds: [cluster.trendClusterId],
    discoveredContentIds: items.map((i) => i.contentId),
    trendClusters: [cluster],
    researchPacket: research,
    strategyPacket: strategy,
    contentBrief: brief,
    timelineBlueprint: timeline,
    avatarPlan,
    renderJob,
    opportunityScore,
    stateHistory,
    errors: [],
    humanOverridePoints: [],
  };
}
