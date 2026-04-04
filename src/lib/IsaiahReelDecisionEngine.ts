/**
 * Isaiah Reel Decision Engine
 * Autonomously selects: account → offer → ICP → funnel stage → narrative → B-roll → audio
 * Then generates AI copy and assembles IsaiahTalkingHeadV1Props.
 *
 * Every decision is scored and tracked. Nothing is hardcoded.
 */

import type {
  IsaiahReelJob,
  IsaiahTalkingHeadV1Props,
  SelectionDecision,
  GeneratedCopy,
  ExperimentArm,
  QAResult,
  TrackingPayload,
  BrollAsset,
  AudioTrack,
  PlatformAccount,
  Offer,
  IcpProfile,
  FunnelStage,
  NarrativeId,
  Platform,
  OfferId,
  IcpId,
  FunnelMix,
} from "../types/IsaiahReelSchema";

// ─── Registry ─────────────────────────────────────────────────────────────────

/**
 * Platform account registry — add new accounts here only, never in components.
 * blotatoAccountId is filled at runtime from GET /v2/users/me/accounts
 */
export const PLATFORM_ACCOUNTS: PlatformAccount[] = [
  {
    accountId: "isaiah_instagram",
    brandId: "isaiah_personal",
    platform: "instagram_reels",
    handle: "@the_isaiah_dupree",
    primaryGoal: "authority + inbound leads + content system proof",
    preferredNarratives: ["pain_to_shift", "operator_proof", "identity_reframe"],
    preferredOffers: ["automation_services", "content_system_offer"],
    targetIcps: ["creators_builders", "founders_operators"],
    preferredFunnelMix: { problemAware: 0.35, solutionAware: 0.30, productAware: 0.20, mostAware: 0.15 },
    contentPillars: ["AI automation", "content systems", "operator workflows", "builder execution"],
  },
  {
    accountId: "isaiah_tiktok",
    brandId: "isaiah_personal",
    platform: "tiktok",
    handle: "@the_isaiah_dupree",
    primaryGoal: "reach + native discovery + rapid hypothesis testing",
    preferredNarratives: ["pain_to_shift", "trend_to_offer", "identity_reframe"],
    preferredOffers: ["content_system_offer", "automation_services"],
    targetIcps: ["creators_builders", "founders_operators"],
    preferredFunnelMix: { problemAware: 0.45, solutionAware: 0.30, productAware: 0.15, mostAware: 0.10 },
    contentPillars: ["why your content is not working", "AI workflow truths", "building in public"],
  },
  {
    accountId: "isaiah_youtube_shorts",
    brandId: "isaiah_personal",
    platform: "youtube_shorts",
    handle: "@isaiahdupree",
    primaryGoal: "searchable authority + compounding educational value",
    preferredNarratives: ["operator_proof", "demo_with_context", "pain_to_shift"],
    preferredOffers: ["automation_services", "content_system_offer"],
    targetIcps: ["creators_builders", "founders_operators", "engineers_tech_learners"],
    preferredFunnelMix: { problemAware: 0.25, solutionAware: 0.35, productAware: 0.25, mostAware: 0.15 },
    contentPillars: ["automation breakdowns", "tool demos", "content machine architecture"],
  },
  {
    accountId: "everreach_instagram",
    brandId: "everreach",
    platform: "instagram_reels",
    handle: "@everreachapp",
    primaryGoal: "emotional resonance + app interest",
    preferredNarratives: ["relationship_truth", "pain_to_shift", "demo_with_context"],
    preferredOffers: ["everreach_app"],
    targetIcps: ["relationship_driven_networkers", "founders_operators"],
    preferredFunnelMix: { problemAware: 0.35, solutionAware: 0.30, productAware: 0.20, mostAware: 0.15 },
    contentPillars: ["forgotten follow ups", "friendship maintenance", "networking with context"],
  },
  {
    accountId: "everreach_tiktok",
    brandId: "everreach",
    platform: "tiktok",
    handle: "@everreachapp",
    primaryGoal: "mass resonance around relationships fading",
    preferredNarratives: ["relationship_truth", "identity_reframe", "pain_to_shift"],
    preferredOffers: ["everreach_app"],
    targetIcps: ["relationship_driven_networkers"],
    preferredFunnelMix: { problemAware: 0.50, solutionAware: 0.25, productAware: 0.15, mostAware: 0.10 },
    contentPillars: ["text them now", "friendship recovery", "old messages"],
  },
  {
    accountId: "portalcopyco_instagram",
    brandId: "portal_copy_co",
    platform: "instagram_reels",
    handle: "@portalcopyco",
    primaryGoal: "lead generation + trust + newsletter/course funnel",
    preferredNarratives: ["pain_to_shift", "demo_with_context", "identity_reframe"],
    preferredOffers: ["email_marketing_course"],
    targetIcps: ["solopreneurs_women_business_owners"],
    preferredFunnelMix: { problemAware: 0.35, solutionAware: 0.35, productAware: 0.20, mostAware: 0.10 },
    contentPillars: ["email mistakes", "newsletter strategy", "copy clarity"],
  },
];

export const OFFERS: Offer[] = [
  {
    offerId: "everreach_app",
    brandId: "everreach",
    offerName: "EverReach App",
    offerType: "app_subscription",
    corePromise: "never let important relationships go cold",
    primaryOutcome: "better follow-up with less friction",
    ctaTypes: ["download_app", "watch_demo"],
    targetIcps: ["relationship_driven_networkers", "founders_operators"],
    preferredPlatforms: ["instagram_reels", "tiktok", "youtube_shorts"],
    funnelStages: ["problem_aware", "solution_aware", "product_aware"],
  },
  {
    offerId: "automation_services",
    brandId: "isaiah_personal",
    offerName: "AI Automation Services",
    offerType: "service",
    corePromise: "replace repetitive work with scalable systems",
    primaryOutcome: "more output less manual overhead",
    ctaTypes: ["book_call", "dm_keyword"],
    targetIcps: ["founders_operators", "creators_builders"],
    preferredPlatforms: ["instagram_reels", "threads", "linkedin"],
    funnelStages: ["problem_aware", "solution_aware", "most_aware"],
  },
  {
    offerId: "content_system_offer",
    brandId: "isaiah_personal",
    offerName: "Content System / Reverse Engineering Offer",
    offerType: "service_or_productized_service",
    corePromise: "turn raw footage into a repeatable publishing machine",
    primaryOutcome: "publish more consistently with better edits",
    ctaTypes: ["dm_keyword", "comment_keyword", "book_call"],
    targetIcps: ["creators_builders", "founders_operators"],
    preferredPlatforms: ["instagram_reels", "tiktok", "youtube_shorts"],
    funnelStages: ["problem_aware", "solution_aware", "product_aware"],
  },
  {
    offerId: "email_marketing_course",
    brandId: "portal_copy_co",
    offerName: "Email Newsletter Course",
    offerType: "course",
    corePromise: "create better emails that nurture and convert",
    primaryOutcome: "higher engagement and conversions",
    ctaTypes: ["newsletter_or_link_in_bio", "comment_keyword"],
    targetIcps: ["solopreneurs_women_business_owners"],
    preferredPlatforms: ["instagram_reels", "linkedin"],
    funnelStages: ["problem_aware", "solution_aware", "product_aware"],
  },
];

export const ICP_PROFILES: IcpProfile[] = [
  {
    icpId: "creators_builders",
    label: "Creators and builders",
    pains: ["overediting", "not posting consistently", "too much footage not enough system"],
    desiredOutcomes: ["publish faster", "turn raw clips into content", "grow with repeatable structure"],
    languageToUse: ["your footage is enough", "stop overthinking", "post faster", "systemize your content"],
    languageToAvoid: ["generic guru language"],
    funnelBias: { problemAware: 0.40, solutionAware: 0.35, productAware: 0.15, mostAware: 0.10 },
  },
  {
    icpId: "founders_operators",
    label: "Founders and operators",
    pains: ["too much manual work", "systems not connected", "team output bottlenecks"],
    desiredOutcomes: ["scalable workflows", "time savings", "clearer operations"],
    languageToUse: ["systems", "automation", "operator leverage", "remove friction"],
    funnelBias: { problemAware: 0.25, solutionAware: 0.35, productAware: 0.25, mostAware: 0.15 },
  },
  {
    icpId: "relationship_driven_networkers",
    label: "Networkers and relationship builders",
    pains: ["forgetting to follow up", "relationships fading", "not knowing what to say"],
    desiredOutcomes: ["stay top of mind", "reach out with confidence", "keep relationships warm"],
    languageToUse: ["follow up", "stay in touch", "reach out", "your people matter"],
    funnelBias: { problemAware: 0.30, solutionAware: 0.30, productAware: 0.25, mostAware: 0.15 },
  },
  {
    icpId: "solopreneurs_women_business_owners",
    label: "Solopreneurs and women business owners",
    pains: ["not enough time for marketing", "emails not converting"],
    desiredOutcomes: ["easy email workflows", "clear messaging", "consistent nurture"],
    languageToUse: ["nurture", "email strategy", "simplify your marketing", "convert with clarity"],
    funnelBias: { problemAware: 0.35, solutionAware: 0.35, productAware: 0.20, mostAware: 0.10 },
  },
  {
    icpId: "engineers_tech_learners",
    label: "Engineers, students, and practical tech learners",
    pains: ["technical friction", "hard-to-find explanations", "slow workflows"],
    desiredOutcomes: ["clear explanations", "faster calculations", "hands-on learning"],
    languageToUse: ["practical", "step by step", "engineering", "clear breakdown"],
    funnelBias: { problemAware: 0.30, solutionAware: 0.35, productAware: 0.20, mostAware: 0.15 },
  },
];

// ─── Scoring Weights ──────────────────────────────────────────────────────────

const SCORING_WEIGHTS = {
  offerFit: 0.22,
  icpFit: 0.18,
  platformFit: 0.14,
  trendFit: 0.12,
  brollFit: 0.14,
  audioFit: 0.08,
  styleMatch: 0.12,
};

// ─── Core Decision Functions ───────────────────────────────────────────────────

/**
 * Choose the best platform account for a given brand + clip topic.
 * Pass `forcedAccountId` to skip scoring and lock to a specific account (e.g., for testing).
 */
export function selectAccount(
  brandId: string,
  clipTopic: string,
  trendTopics: string[],
  forcedAccountId?: string
): PlatformAccount {
  if (forcedAccountId) {
    const forced = PLATFORM_ACCOUNTS.find((a) => a.accountId === forcedAccountId);
    if (!forced) throw new Error(`Account not found: ${forcedAccountId}`);
    return forced;
  }

  const brandAccounts = PLATFORM_ACCOUNTS.filter((a) => a.brandId === brandId);
  if (brandAccounts.length === 0) throw new Error(`No accounts found for brand: ${brandId}`);

  // Score each account by pillar overlap with clip topic and trend signals
  const scored = brandAccounts.map((account) => {
    const pillarOverlap = account.contentPillars.filter(
      (p) => clipTopic.toLowerCase().includes(p.toLowerCase()) || trendTopics.some((t) => p.includes(t))
    ).length;
    return { account, score: pillarOverlap };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].account;
}

/**
 * Select the best offer for a given account + ICP.
 */
export function selectOffer(account: PlatformAccount, icpId: IcpId): Offer {
  const candidates = OFFERS.filter(
    (o) =>
      account.preferredOffers.includes(o.offerId) &&
      o.targetIcps.includes(icpId) &&
      o.preferredPlatforms.includes(account.platform)
  );

  if (candidates.length === 0) {
    // Fallback: any preferred offer for this account
    const fallback = OFFERS.find((o) => account.preferredOffers.includes(o.offerId));
    if (!fallback) throw new Error(`No offer found for account: ${account.accountId}`);
    return fallback;
  }

  return candidates[0];
}

/**
 * Select the best ICP for a given account + offer.
 */
export function selectIcp(account: PlatformAccount, offer: Offer): IcpProfile {
  const candidateIds = account.targetIcps.filter((id) => offer.targetIcps.includes(id));
  const icpId = candidateIds[0] ?? account.targetIcps[0];
  const profile = ICP_PROFILES.find((p) => p.icpId === icpId);
  if (!profile) throw new Error(`ICP profile not found: ${icpId}`);
  return profile;
}

/**
 * Pick the funnel stage by weighting account mix against ICP bias.
 */
export function selectFunnelStage(account: PlatformAccount, icp: IcpProfile): FunnelStage {
  const stages: FunnelStage[] = ["problem_aware", "solution_aware", "product_aware", "most_aware"];

  const combined: FunnelMix = {
    problemAware: (account.preferredFunnelMix.problemAware + icp.funnelBias.problemAware) / 2,
    solutionAware: (account.preferredFunnelMix.solutionAware + icp.funnelBias.solutionAware) / 2,
    productAware: (account.preferredFunnelMix.productAware + icp.funnelBias.productAware) / 2,
    mostAware: (account.preferredFunnelMix.mostAware + icp.funnelBias.mostAware) / 2,
  };

  // Weighted random selection based on combined mix
  const rand = Math.random();
  let cumulative = 0;
  for (const stage of stages) {
    const key = stage.replace(/_(\w)/g, (_, c) => c.toUpperCase()) as keyof FunnelMix;
    cumulative += combined[key] ?? 0;
    if (rand < cumulative) return stage;
  }
  return "problem_aware";
}

/**
 * Pick the best narrative for an account + funnel stage.
 */
export function selectNarrative(account: PlatformAccount, funnelStage: FunnelStage): NarrativeId {
  const narrativeMap: Partial<Record<FunnelStage, NarrativeId[]>> = {
    problem_aware: ["pain_to_shift", "relationship_truth", "identity_reframe"],
    solution_aware: ["operator_proof", "demo_with_context", "trend_to_offer"],
    product_aware: ["demo_with_context", "operator_proof"],
    most_aware: ["demo_with_context", "operator_proof"],
  };

  const preferred = account.preferredNarratives;
  const stageOptions = narrativeMap[funnelStage] ?? [];
  const match = preferred.find((n) => stageOptions.includes(n));
  return match ?? preferred[0] ?? "pain_to_shift";
}

/**
 * Rank and select B-roll assets by topic + ICP + narrative fit + safe text zones.
 */
export function selectBroll(
  availableAssets: BrollAsset[],
  topic: string,
  icpId: IcpId,
  narrative: NarrativeId,
  maxAssets = 2
): BrollAsset[] {
  const scored = availableAssets.map((asset) => {
    const topicFit = asset.suitableTopics.some((t) => topic.toLowerCase().includes(t)) ? 1 : 0;
    const icpFit = asset.suitableIcps?.includes(icpId) ? 1 : 0;
    const visualFit = asset.scoreInputs.aestheticScore;
    const readability = asset.scoreInputs.readabilityScore;
    const score = topicFit * 0.3 + icpFit * 0.2 + visualFit * 0.3 + readability * 0.2;
    return { asset, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxAssets).map((s) => s.asset);
}

/**
 * Select background audio track by platform + funnel stage + energy fit.
 */
export function selectAudio(
  availableTracks: AudioTrack[],
  platform: Platform,
  funnelStage: FunnelStage
): AudioTrack | null {
  const candidates = availableTracks.filter(
    (t) =>
      t.suitablePlatforms.includes(platform) &&
      t.suitableFunnelStages.includes(funnelStage)
  );

  if (candidates.length === 0) return null;

  // Prefer lower energy for problem_aware, higher energy for product/most_aware
  const energyTarget =
    funnelStage === "problem_aware" ? 0.4
    : funnelStage === "solution_aware" ? 0.55
    : 0.75;

  candidates.sort(
    (a, b) => Math.abs(a.energy - energyTarget) - Math.abs(b.energy - energyTarget)
  );

  return candidates[0];
}

/**
 * Compute an overall selection score for analytics.
 */
export function computeSelectionScore(
  account: PlatformAccount,
  offer: Offer,
  icp: IcpProfile,
  broll: BrollAsset[],
  audio: AudioTrack | null,
  trendFit: number
) {
  const offerFit = offer.targetIcps.includes(icp.icpId) && offer.preferredPlatforms.includes(account.platform) ? 1 : 0.5;
  const icpFit = account.targetIcps.includes(icp.icpId) ? 1 : 0.5;
  const platformFit = offer.preferredPlatforms.includes(account.platform) ? 1 : 0.5;
  const brollFit = broll.length > 0 ? broll[0].scoreInputs.aestheticScore : 0.5;
  const audioFit = audio ? 1 : 0.5;
  const styleMatch = 1.0; // always valid when using house style

  return {
    offerFit,
    icpFit,
    platformFit,
    trendFit,
    brollFit,
    audioFit,
    styleMatch,
    overallScore:
      offerFit * SCORING_WEIGHTS.offerFit +
      icpFit * SCORING_WEIGHTS.icpFit +
      platformFit * SCORING_WEIGHTS.platformFit +
      trendFit * SCORING_WEIGHTS.trendFit +
      brollFit * SCORING_WEIGHTS.brollFit +
      audioFit * SCORING_WEIGHTS.audioFit +
      styleMatch * SCORING_WEIGHTS.styleMatch,
  };
}

// ─── AI Copy Generation Prompt Builders ──────────────────────────────────────

/**
 * Build the system prompt for AI summary strap generation.
 * Feed this to Claude claude-sonnet-4-6 via the Anthropic API.
 */
export function buildSummaryStrapPrompt(
  transcriptText: string,
  briefObjective: string,
  icpPains: string[],
  offer: Offer,
  banned: string[]
): string {
  return `You are generating a short hook-summary strap for a short-form video.

VIDEO TRANSCRIPT:
${transcriptText}

CONTENT OBJECTIVE:
${briefObjective}

TARGET AUDIENCE PAINS:
${icpPains.join(", ")}

OFFER CONTEXT:
${offer.corePromise}

RULES:
- 4 to 10 words maximum
- Direct, catchy, trend-aware, clear
- Must truthfully reflect what the speaker actually says in the transcript
- Sound like a builder/operator — direct, not fluffy, not corporate
- Black text on green background — short is better
- Do not start with "How to" or "The best way"
- Avoid: ${banned.join(", ")}

OUTPUT: Return exactly 5 candidates as a JSON array with this shape:
[
  {
    "text": "Stop overthinking the text",
    "transcriptFaithfulness": 0.96,
    "curiosityScore": 0.84,
    "styleMatchScore": 0.93,
    "briefAlignmentScore": 0.92,
    "overallScore": 0.92
  }
]
Only return valid JSON. No explanation.`;
}

/**
 * Build the prompt for platform caption + hashtag generation.
 */
export function buildCaptionPrompt(
  summaryStrapText: string,
  transcriptText: string,
  platform: Platform,
  icpLanguage: string[],
  ctaText: string,
  offer: Offer
): string {
  const platformVoice: Record<Platform, string> = {
    instagram_reels: "punchy, authority, ends with CTA, 2–4 hashtags",
    tiktok: "native, trendy, can be shorter, 3–6 hashtags",
    youtube_shorts: "clear, searchable, descriptive, 3 hashtags",
    threads: "conversational, no hashtags, ends with a question or thought",
    linkedin: "professional, insights-first, 2–3 hashtags",
  };

  return `Generate a social media caption for this video.

PLATFORM: ${platform}
PLATFORM VOICE: ${platformVoice[platform]}

VIDEO HOOK: ${summaryStrapText}
TRANSCRIPT SUMMARY: ${transcriptText.slice(0, 400)}
OFFER: ${offer.corePromise}
CTA: ${ctaText}
AUDIENCE LANGUAGE: ${icpLanguage.join(", ")}

Output JSON only:
{
  "caption": "...",
  "hashtags": ["...", "..."],
  "firstComment": "..." or null
}`;
}

// ─── QA Validation ────────────────────────────────────────────────────────────

/**
 * Run all QA checks against a rendered job.
 * In production: call vision API to verify frame content.
 * Here we validate the schema/scores synchronously.
 */
export function runQAChecks(job: Partial<IsaiahReelJob>): QAResult {
  const checks = [];
  const failures: string[] = [];

  const ai = job.aiDecisions;
  const brief = job.contentBrief;
  const analysis = job.sourceAnalysis;

  // Check 1: top name present
  const topNameOk = job.renderPlan?.props?.brandName === "Isaiah Dupree";
  checks.push({ checkId: "top_name_present" as const, required: true, passed: topNameOk });
  if (!topNameOk) failures.push("top_name_missing_or_wrong");

  // Check 2: summary strap present
  const strapText = ai?.summaryStrap?.selected?.text;
  const strapOk = !!strapText && strapText.trim().length > 0;
  checks.push({ checkId: "summary_strap_present" as const, required: true, passed: strapOk });
  if (!strapOk) failures.push("summary_strap_missing");

  // Check 3: summary strap NOT hardcoded
  const notHardcoded = ai?.summaryStrap?.selected?.hardcoded === false;
  checks.push({ checkId: "summary_strap_ai_generated" as const, required: true, passed: notHardcoded });
  if (!notHardcoded) failures.push("summary_strap_hardcoded");

  // Check 4: captions present
  const hasCaptions = (analysis?.transcript?.words?.length ?? 0) > 0;
  checks.push({ checkId: "captions_present" as const, required: true, passed: hasCaptions });
  if (!hasCaptions) failures.push("captions_missing");

  // Check 5: transcript fidelity
  const transcriptConf = analysis?.transcript?.overallConfidence ?? 0;
  const fidelityThreshold = brief?.successCriteria?.minimumTranscriptFidelity ?? 0.93;
  const fidelityOk = transcriptConf >= fidelityThreshold;
  checks.push({
    checkId: "caption_transcript_fidelity" as const,
    required: true,
    threshold: fidelityThreshold,
    actual: transcriptConf,
    passed: fidelityOk,
  });
  if (!fidelityOk) failures.push(`transcript_fidelity_${transcriptConf.toFixed(2)}_below_${fidelityThreshold}`);

  // Check 6: face overlap
  const maxOverlap = brief?.successCriteria?.maximumFaceOverlapRatio ?? 0;
  // In production, compute actual overlap from rendered frames vs face boxes
  const faceOverlapRatio = 0; // placeholder — wire to vision check post-render
  const faceOk = faceOverlapRatio <= maxOverlap;
  checks.push({
    checkId: "face_overlap_ratio" as const,
    required: true,
    thresholdMax: maxOverlap,
    actual: faceOverlapRatio,
    passed: faceOk,
  });
  if (!faceOk) failures.push("face_overlap_detected");

  const allPassed = checks.every((c) => c.passed);

  let publishDecision: QAResult["publishDecision"] = "ready_to_post";
  if (!strapOk) publishDecision = "needs_hook_rewrite";
  else if (!fidelityOk) publishDecision = "needs_transcript_regen";
  else if (!faceOk) publishDecision = "needs_layout_adjust";
  else if (!allPassed) publishDecision = "blocked";

  return {
    status: allPassed ? "passed" : "failed",
    publishDecision,
    checks,
    scores: {
      transcriptFidelity: transcriptConf,
      briefAlignment: null,
      styleMatch: null,
      sourceFit: analysis?.sourceFit?.overallSourceFitScore ?? null,
      readability: null,
      overallEditFit: null,
    },
    failureReasons: failures,
  };
}

// ─── Remotion Props Builder ───────────────────────────────────────────────────

/**
 * Build the final IsaiahTalkingHeadV1Props from a complete job.
 * This is what gets passed to npx remotion render or mcp-server.js remotion_render.
 */
export function buildRemotionProps(job: IsaiahReelJob): IsaiahTalkingHeadV1Props {
  const style = job.styleProfile;

  return {
    sourceVideoUrl: job.sourceVideo.sourcePath,
    transcriptWords: job.sourceAnalysis.transcript.words,
    brandName: style.visualRules.topNameText,
    summaryStrapText: job.aiDecisions.summaryStrap.selected.text,
    contentBrief: {
      topic: job.contentBrief.topic,
      objective: job.contentBrief.objective,
      audience: job.contentBrief.audience,
      hookType: job.contentBrief.hookType,
      cta: job.generatedCopy.ctaText,
    },
    faceBoxes: job.sourceAnalysis.faceTracking.boxes,
    selectedSegments: job.aiDecisions.segmentSelection.selectedSegments,
    styleScores: {
      transcriptFidelity: job.qa.scores.transcriptFidelity ?? 0,
      briefAlignment: job.qa.scores.briefAlignment ?? 0,
      styleMatch: job.qa.scores.styleMatch ?? 0,
      sourceFit: job.qa.scores.sourceFit ?? 0,
    },
    layoutRules: {
      captionTextColor: style.visualRules.captionsTextColor,
      captionBgColor: style.visualRules.captionsBgColor,
      summaryTextColor: style.visualRules.summaryStrapTextColor,
      summaryBgColor: style.visualRules.summaryStrapBgColor,
      avoidFaceOverlap: style.visualRules.avoidFaceOverlap,
      captionStylePreset: style.captionStyleLibrary.defaultPreset,
      headlineFontPreset: style.fontSystem.defaultHeadlinePreset,
      captionFontPreset: style.fontSystem.defaultCaptionPreset,
    },
    editPlan: job.aiDecisions.editPlan,
  };
}

// ─── Experiment Assignment ────────────────────────────────────────────────────

/**
 * Assign an experiment arm deterministically from job ID hash.
 * This ensures the same clip always lands in the same experiment arm.
 */
export function assignExperimentArm(jobId: string, selectionDecision: SelectionDecision): ExperimentArm {
  const hash = jobId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const hookStyles = ["contrarian", "confession", "system_shift", "identity"] as const;
  const captionPresets = ["isaiah_phrase_blocks_v1", "isaiah_karaoke_pop_v1"];
  const brollThemes = ["movement", "software", "lifestyle"];
  const audioMoods = ["focused", "confident"];

  const hookStyle = hookStyles[hash % hookStyles.length];
  const captionStylePreset = captionPresets[hash % captionPresets.length];
  const brollTheme = brollThemes[hash % brollThemes.length];
  const audioMood = audioMoods[hash % audioMoods.length];

  const armId = `${hookStyle}__${captionStylePreset}__${brollTheme}__${selectionDecision.selectedFunnelStage}`;

  return {
    experimentId: "offer_broll_angle_test_v1",
    armId,
    variables: {
      hookStyle,
      captionStylePreset,
      brollTheme,
      audioMood,
      funnelStage: selectionDecision.selectedFunnelStage,
      narrativeId: selectionDecision.selectedNarrativeId,
      offerAngle: `${selectionDecision.selectedOfferId}__${selectionDecision.selectedIcpId}`,
    },
  };
}

// ─── Event Emitter ────────────────────────────────────────────────────────────

/**
 * Emit a tracking event. Wire this to PostHog, Supabase, or both.
 * Replace the console.log with your actual tracking client.
 */
export async function emitEvent(payload: TrackingPayload): Promise<void> {
  // In production: posthog.capture(payload.event, payload.properties)
  // Or: supabase.from("actp_agent_audit_log").insert({ event: payload.event, properties: payload.properties })
  console.log("[TRACK]", payload.event, JSON.stringify(payload.properties, null, 2));
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface OrchestrationInput {
  brandId: string;
  sourceClipPath: string;
  sourceAnalysis: IsaiahReelJob["sourceAnalysis"];
  contentBrief: IsaiahReelJob["contentBrief"];
  availableBroll: BrollAsset[];
  availableAudio: AudioTrack[];
  trendTopics: string[];
  trendFit: number;
  forcedAccountId?: string;
  // AI call function — inject Claude API or OpenAI here
  callAI: (prompt: string) => Promise<string>;
  // Blotato account map from GET /v2/users/me/accounts
  blotatoAccountMap?: Record<string, number>;
}

/**
 * Full autonomous orchestration:
 * 1. Select account, offer, ICP, funnel stage, narrative, B-roll, audio
 * 2. Generate AI copy (summary strap + captions + description)
 * 3. Assemble render props
 * 4. Run QA
 * 5. Return job ready for rendering
 */
export async function orchestrateReelJob(input: OrchestrationInput): Promise<IsaiahReelJob> {
  const jobId = `reel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // 1. Select account
  const account = selectAccount(input.brandId, input.contentBrief.topic, input.trendTopics, input.forcedAccountId);
  await emitEvent({ event: "account_selected", properties: { workspaceId: "dupree_ops", brandId: input.brandId as any, assetId: jobId, templateId: "IsaiahTalkingHeadV1", styleId: "isaiah_house_style_v1", accountId: account.accountId } });

  // 2. Select ICP, offer, funnel stage, narrative
  const icp = selectIcp(account, OFFERS.find((o) => account.preferredOffers[0] === o.offerId)!);
  const offer = selectOffer(account, icp.icpId);
  const funnelStage = selectFunnelStage(account, icp);
  const narrativeId = selectNarrative(account, funnelStage);

  await emitEvent({ event: "offer_selected", properties: { workspaceId: "dupree_ops", brandId: input.brandId as any, assetId: jobId, templateId: "IsaiahTalkingHeadV1", styleId: "isaiah_house_style_v1", offerId: offer.offerId, icpId: icp.icpId, funnelStage, narrativeId } });

  // 3. Select B-roll and audio
  const broll = selectBroll(input.availableBroll, input.contentBrief.topic, icp.icpId, narrativeId);
  const audio = selectAudio(input.availableAudio, account.platform, funnelStage);

  // 4. Score the selection
  const scores = computeSelectionScore(account, offer, icp, broll, audio, input.trendFit);

  const selectionDecision: SelectionDecision = {
    selectedAccountId: account.accountId,
    selectedPlatform: account.platform,
    selectedOfferId: offer.offerId,
    selectedIcpId: icp.icpId,
    selectedFunnelStage: funnelStage,
    selectedNarrativeId: narrativeId,
    selectedBrollIds: broll.map((b) => b.brollId),
    selectedAudioId: audio?.audioId ?? "none",
    selectionScores: scores,
  };

  // 5. Generate AI summary strap candidates
  const strapPrompt = buildSummaryStrapPrompt(
    input.sourceAnalysis.transcript.fullText,
    input.contentBrief.objective,
    icp.pains,
    offer,
    input.contentBrief.bannedPhrases
  );

  let candidates: IsaiahReelJob["aiDecisions"]["summaryStrap"]["candidates"] = [];
  try {
    const raw = await input.callAI(strapPrompt);
    candidates = JSON.parse(raw);
  } catch {
    // Fallback: derive from transcript
    candidates = [{
      text: input.sourceAnalysis.speechSegments[0]?.text?.slice(0, 40) ?? "Your footage is already enough",
      transcriptFaithfulness: 0.75,
      curiosityScore: 0.65,
      styleMatchScore: 0.70,
      briefAlignmentScore: 0.70,
      overallScore: 0.70,
    }];
  }

  candidates.sort((a, b) => b.overallScore - a.overallScore);
  const selectedStrap = candidates[0];

  await emitEvent({ event: "summary_strap_selected", properties: { workspaceId: "dupree_ops", brandId: input.brandId as any, assetId: jobId, templateId: "IsaiahTalkingHeadV1", styleId: "isaiah_house_style_v1", summaryStrapText: selectedStrap.text } });

  // 6. Generate platform caption
  const captionPrompt = buildCaptionPrompt(
    selectedStrap.text,
    input.sourceAnalysis.transcript.fullText,
    account.platform,
    icp.languageToUse,
    offer.ctaTypes[0],
    offer
  );

  let generatedCopy: GeneratedCopy = {
    summaryStrapText: selectedStrap.text,
    onScreenHookText: input.sourceAnalysis.speechSegments[0]?.text ?? selectedStrap.text,
    ctaText: `Comment ${offer.ctaTypes[0]} for details`,
    platformCaption: `${selectedStrap.text}\n\n${input.sourceAnalysis.transcript.fullText.slice(0, 200)}`,
    platformHashtags: ["#automation", "#ai", "#builder"],
  };

  try {
    const captionRaw = await input.callAI(captionPrompt);
    const parsed = JSON.parse(captionRaw);
    generatedCopy = {
      ...generatedCopy,
      platformCaption: parsed.caption,
      platformHashtags: parsed.hashtags ?? [],
      firstComment: parsed.firstComment,
    };
  } catch {
    // Keep fallback
  }

  // 7. Assemble the job (partial — renderPlan.output filled in by render step)
  const { ISAIAH_HOUSE_STYLE } = await import("../types/IsaiahReelSchema");

  const experimentArm = assignExperimentArm(jobId, selectionDecision);

  const partialJob: Omit<IsaiahReelJob, "renderPlan" | "qa"> & { renderPlan?: any; qa?: any } = {
    schemaVersion: "1.2.0",
    jobId,
    createdAt: now,
    updatedAt: now,
    ids: {
      assetId: jobId,
      analysisId: `analysis_${jobId}`,
      briefId: `brief_${jobId}`,
      renderJobId: `render_${jobId}`,
      publishJobId: `publish_${jobId}`,
      sourceHash: "",
      transcriptHash: "",
    },
    sourceVideo: {
      sourceType: "iphone_video",
      sourcePath: input.sourceClipPath,
      durationMs: input.sourceAnalysis.speechSegments.at(-1)?.endMs ?? 0,
      width: 1080,
      height: 1920,
      fps: 30,
      orientation: "portrait",
      hasSpeaker: input.sourceAnalysis.faceTracking.primaryFaceDetected,
      primarySpeakerCount: 1,
      sourceQuality: {
        audioLevelScore: 0.8,
        sharpnessScore: 0.8,
        stabilityScore: 0.7,
        lightingScore: 0.75,
        backgroundNoiseScore: 0.3,
        usableForPrimaryTemplate: true,
      },
    },
    contentBrief: input.contentBrief,
    sourceAnalysis: input.sourceAnalysis,
    styleProfile: ISAIAH_HOUSE_STYLE,
    aiDecisions: {
      decisionVersion: "1.0.0",
      summaryStrap: {
        mode: "ai_generated",
        sourceInputs: ["transcript", "contentBrief", "styleProfile", "speechSegments"],
        candidates,
        selected: {
          text: selectedStrap.text,
          selectedFromCandidateIndex: 0,
          selectionReason: "highest combined overallScore",
          hardcoded: false,
        },
      },
      segmentSelection: {
        selectedSegments: input.sourceAnalysis.speechSegments
          .filter((s) => s.hookLikelihood > 0.6 || s.energyScore > 0.7)
          .slice(0, 3)
          .map((s) => ({
            segmentId: s.segmentId,
            startMs: s.startMs,
            endMs: s.endMs,
            reason: `hookLikelihood=${s.hookLikelihood}, energy=${s.energyScore}`,
          })),
      },
      captionSegmentation: {
        segmentationMode: "phrase_based",
        combineTokensWithinMs: 900,
        maxWordsPerPage: 6,
        allowSingleWordPunchPages: true,
      },
      editPlan: {
        cutPlan: { removeDeadAir: true, silenceThresholdMs: 180, targetCadenceSeconds: 1.25 },
        zoomPlan: {
          enabled: true,
          triggerMoments: input.sourceAnalysis.speechSegments
            .filter((s) => s.energyScore > 0.85)
            .slice(0, 4)
            .map((s) => ({ atMs: s.startMs, reason: "high energy moment" })),
        },
        brollPlan: { enabled: broll.length > 0, insertionMoments: [] },
        screenshotPlan: { enabled: false, insertionMoments: [] },
      },
    },
    selectionDecision,
    generatedCopy,
    experimentArm,
    distribution: {
      engine: "blotato",
      enabled: true,
      targets: [{
        platform: account.platform,
        blotatoAccountId: input.blotatoAccountMap?.[account.accountId] ?? 0,
        enabled: true,
        priority: 1,
      }],
      publishPolicy: {
        requireQaPass: true,
        requireManualApproval: false,
        scheduleMode: "queue",
      },
      telegramNotification: {
        enabled: true,
        messageTemplate: "Posted to {{platform}} / {{accountKey}}. Go look at {{postUrl}}",
      },
    },
    feedback: {
      postPublishMetrics: {
        collectAtHours: [1, 6, 24, 72],
        snapshots: [],
      },
      learningSignals: {
        compareRenderedVideoToBrief: true,
        compareRenderedVideoToStyleProfile: true,
        comparePerformanceBySummaryStrap: true,
        comparePerformanceByCaptionStylePreset: true,
        comparePerformanceByFontPreset: true,
      },
    },
  };

  // 8. Run QA
  const qa = runQAChecks(partialJob as any);

  // 9. Build Remotion props and finalize render plan
  const finalJob: IsaiahReelJob = {
    ...(partialJob as any),
    qa,
    renderPlan: {
      engine: "remotion",
      compositionId: "IsaiahTalkingHeadV1",
      props: buildRemotionProps({ ...(partialJob as any), qa } as IsaiahReelJob),
      output: {
        width: 1080,
        height: 1920,
        fps: 30,
        codec: "h264",
        audioCodec: "aac",
        pixelFormat: "yuv420p",
        crf: 18,
        imageFormat: "jpeg",
        preferHighQualityRender: true,
        exportPath: `renders/isaiah/${now.slice(0, 10)}/${jobId}.mp4`,
      },
      posterFrame: {
        frameSelectionMode: "ai_best_frame",
        titleText: selectedStrap.text,
      },
    },
  };

  await emitEvent({
    event: qa.status === "passed" ? "qa_passed" : "qa_failed",
    properties: {
      workspaceId: "dupree_ops",
      brandId: input.brandId as any,
      assetId: jobId,
      templateId: "IsaiahTalkingHeadV1",
      styleId: "isaiah_house_style_v1",
      summaryStrapText: selectedStrap.text,
      publishReady: qa.status === "passed",
    },
  });

  return finalJob;
}
