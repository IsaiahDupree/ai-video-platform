/**
 * pipeline-schema.ts — Canonical Strategy Schema v1.2
 *
 * TypeScript interfaces for the full content decision engine.
 * Registry layer (brands, offers, ICPs, platform accounts, narratives) +
 * Runtime layer (per-video decisions, render settings, publish result).
 *
 * Generated from YAML schema v1.2.0
 */

// ─── Registry: Brands ────────────────────────────────────────────────────────

export type BrandId =
  | 'isaiah_personal'
  | 'everreach'
  | 'portal_copy_co'
  | 'techmestuff';

export interface BrandVoice {
  tone: string[];
  avoid: string[];
}

export interface BrandVisualIdentity {
  topNameText: string;
  summaryBgColor: string;
  summaryTextColor: string;
  captionBgColor: string;
  captionTextColor: string;
}

export interface Brand {
  brandId: BrandId;
  brandName: string;
  mission: string;
  voice: BrandVoice;
  visualIdentity?: BrandVisualIdentity;
}

// ─── Registry: Offers ────────────────────────────────────────────────────────

export type OfferId =
  | 'everreach_app'
  | 'automation_services'
  | 'content_system_offer'
  | 'email_marketing_course'
  | 'engineering_tools';

export type OfferType =
  | 'app_subscription'
  | 'service'
  | 'service_or_productized_service'
  | 'course'
  | 'tool';

export type CtaType =
  | 'download'
  | 'trial'
  | 'watch_demo'
  | 'book_call'
  | 'dm_keyword'
  | 'view_case_study'
  | 'join_waitlist'
  | 'book_strategy_call'
  | 'join_newsletter'
  | 'buy_course'
  | 'download_freebie'
  | 'use_tool'
  | 'read_blog'
  | 'subscribe';

export interface Offer {
  offerId: OfferId;
  brandId: BrandId;
  offerName: string;
  offerType: OfferType;
  corePromise: string;
  primaryOutcome: string;
  ctaTypes: CtaType[];
}

// ─── Registry: ICPs ──────────────────────────────────────────────────────────

export type IcpId =
  | 'creators_builders'
  | 'founders_operators'
  | 'relationship_driven_networkers'
  | 'solopreneurs_women_business_owners'
  | 'engineers_tech_learners';

export interface FunnelMix {
  problemAware: number;   // 0–1
  solutionAware: number;
  productAware: number;
  mostAware: number;
}

export interface Icp {
  icpId: IcpId;
  label: string;
  pains: string[];
  desiredOutcomes: string[];
  languageToUse: string[];
  funnelBias: FunnelMix;
}

// ─── Registry: Narratives ────────────────────────────────────────────────────

export type NarrativeId =
  | 'operator_proof'
  | 'pain_to_shift'
  | 'identity_reframe'
  | 'demo_with_context'
  | 'trend_to_offer'
  | 'relationship_truth';

export interface NarrativeArchetype {
  narrativeId: NarrativeId;
  description: string;
}

// ─── Registry: Platform Accounts ─────────────────────────────────────────────

export type PlatformAccountId =
  | 'isaiah_instagram'
  | 'isaiah_tiktok'
  | 'isaiah_youtube_shorts'
  | 'everreach_instagram'
  | 'everreach_tiktok'
  | 'everreach_threads'
  | 'portalcopyco_instagram'
  | 'portalcopyco_linkedin'
  | 'techmestuff_youtube';

export type Platform =
  | 'instagram_reels'
  | 'tiktok'
  | 'youtube_shorts'
  | 'threads'
  | 'linkedin'
  | 'twitter'
  | 'facebook';

export interface PlatformAccount {
  accountId: PlatformAccountId;
  brandId: BrandId;
  platform: Platform;
  handle: string;
  /** Blotato numeric account ID for publishing */
  blotatoAccountId: number;
  primaryGoal: string;
  preferredNarratives: NarrativeId[];
  preferredOffers: OfferId[];
  targetIcps: IcpId[];
  preferredFunnelMix: FunnelMix;
  contentPillars: string[];
}

// ─── Registry: Creative Libraries ────────────────────────────────────────────

export type BrollTag =
  | 'movement'
  | 'software'
  | 'city'
  | 'typing'
  | 'phone'
  | 'workflow'
  | 'founder'
  | 'lifestyle'
  | 'closeup'
  | 'whiteboard'
  | 'screen_recording';

export type AudioMood =
  | 'focused'
  | 'confident'
  | 'upbeat'
  | 'emotional'
  | 'minimal_tension'
  | 'clean_cinematic';

export interface BrollAsset {
  brollId: string;
  filePath: string;
  tags: BrollTag[];
  durationSeconds: number;
  description?: string;
}

export interface AudioAsset {
  audioId: string;
  filePath: string;         // relative to public/
  mood: AudioMood[];
  genre: string;
  energyLevel: number;      // 1–10
  durationSeconds: number;
  isTrending: boolean;
}

// ─── Funnel Stage ─────────────────────────────────────────────────────────────

export type FunnelStage =
  | 'problemAware'
  | 'solutionAware'
  | 'productAware'
  | 'mostAware';

// ─── Experiment ───────────────────────────────────────────────────────────────

export type ExperimentDimension =
  | 'hook_style'
  | 'narrative_id'
  | 'funnel_stage'
  | 'caption_style'
  | 'broll_theme'
  | 'audio_mood'
  | 'offer_angle';

export type SuccessMetric =
  | 'retention_3s'
  | 'retention_50pct'
  | 'saves'
  | 'shares'
  | 'comments'
  | 'profile_clicks'
  | 'trial_or_lead_conversion';

// ─── Runtime: Decision Output ─────────────────────────────────────────────────

export interface RuntimeDecision {
  brandId: BrandId;
  sourceClipId: string;
  targetAccountId: PlatformAccountId;
  selectedOfferId: OfferId;
  selectedIcpId: IcpId;
  selectedFunnelStage: FunnelStage;
  selectedNarrativeId: NarrativeId;
  selectedBrollIds: string[];
  selectedAudioId: string;
  // AI-generated copy
  generatedHook: string;
  generatedSummaryStrap: string;
  generatedDescription: string;
  generatedCta: string;
  // Experiment arm: e.g. "hook_contrarian__caption_phrase_blocks__broll_software"
  experimentArm: string;
}

// ─── Runtime: Render Settings ─────────────────────────────────────────────────

export interface RenderSettings {
  compositionId: string;           // e.g. 'IsaiahReelV2'
  backgroundVideoPath: string;
  audioPath?: string;
  musicPath?: string;
  musicVolumeBase: number;
  musicVolumeDucked: number;
  voiceVolume: number;
  tagline: string;
  handle: string;
  faceSafeBottomY: number;
  captionFontSize: number;
  captionMaxWords: number;
  fontVariant: string;
  durationFrames: number;
  outputPath: string;
}

// ─── Runtime: Publish Result ──────────────────────────────────────────────────

export interface PublishResult {
  platform: Platform;
  blotatoAccountId: number;
  status: 'queued' | 'published' | 'failed';
  platformPostId?: string;
  platformUrl?: string;
  publishedAt?: string;
  error?: string;
}

// ─── Runtime: Tracking Events ────────────────────────────────────────────────

export type TrackingEventType =
  | 'account_selected'
  | 'offer_selected'
  | 'icp_selected'
  | 'funnel_stage_selected'
  | 'narrative_selected'
  | 'broll_ranked'
  | 'broll_selected'
  | 'audio_selected'
  | 'hook_generated'
  | 'description_generated'
  | 'render_completed'
  | 'publish_completed'
  | 'post_performance_ingested';

export interface TrackingEvent {
  event: TrackingEventType;
  timestamp: string;
  sourceClipId: string;
  value?: unknown;
}

// ─── Runtime: Full Pipeline Job ──────────────────────────────────────────────

export interface PipelineJob {
  jobId: string;
  createdAt: string;
  sourceClipId: string;
  sourceFilePath: string;
  decision: RuntimeDecision;
  renderSettings: RenderSettings;
  publishTargets: Array<{ accountId: PlatformAccountId; blotatoId: number }>;
  publishResults: PublishResult[];
  events: TrackingEvent[];
  status: 'pending' | 'deciding' | 'rendering' | 'publishing' | 'done' | 'failed';
  error?: string;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface Workspace {
  workspaceId: string;
  owner: string;
  timezone: string;
  brands: Brand[];
  offers: Offer[];
  icps: Icp[];
  narrativeArchetypes: NarrativeArchetype[];
  platformAccounts: PlatformAccount[];
}

// ─── Populated Registry ───────────────────────────────────────────────────────

export const WORKSPACE: Workspace = {
  workspaceId: 'dupree_ops',
  owner: 'Isaiah Dupree',
  timezone: 'America/New_York',

  brands: [
    {
      brandId: 'isaiah_personal',
      brandName: 'Isaiah Dupree',
      mission: 'builder operator authority through AI automation systems and execution',
      voice: { tone: ['direct', 'builder', 'operator', 'clear', 'confident'], avoid: ['fluffy', 'pretentious', 'overly-corporate'] },
      visualIdentity: { topNameText: 'Isaiah Dupree', summaryBgColor: '#7DFF63', summaryTextColor: '#000000', captionBgColor: '#7DFF63', captionTextColor: '#000000' },
    },
    {
      brandId: 'everreach',
      brandName: 'EverReach',
      mission: 'help people stay in touch and follow up with context',
      voice: { tone: ['warm', 'clear', 'useful', 'emotionally-intelligent', 'practical'], avoid: ['crm jargon', 'cold enterprise language'] },
    },
    {
      brandId: 'portal_copy_co',
      brandName: 'Portal Copy Co',
      mission: 'help solopreneurs and women business owners create better email marketing and copy',
      voice: { tone: ['smart', 'clear', 'supportive', 'strategic'], avoid: ['hypey', 'generic guru language'] },
    },
    {
      brandId: 'techmestuff',
      brandName: 'TechMeStuff',
      mission: 'teach practical engineering tech automation and calculators',
      voice: { tone: ['educational', 'practical', 'curious', 'clear'], avoid: ['needless complexity', 'low-value filler'] },
    },
  ],

  offers: [
    { offerId: 'everreach_app', brandId: 'everreach', offerName: 'EverReach App', offerType: 'app_subscription', corePromise: 'never let important relationships go cold', primaryOutcome: 'better follow-up with less friction', ctaTypes: ['download', 'trial', 'watch_demo'] },
    { offerId: 'automation_services', brandId: 'isaiah_personal', offerName: 'AI Automation Services', offerType: 'service', corePromise: 'replace repetitive work with scalable systems', primaryOutcome: 'more output less manual overhead', ctaTypes: ['book_call', 'dm_keyword', 'view_case_study'] },
    { offerId: 'content_system_offer', brandId: 'isaiah_personal', offerName: 'Content System / Reverse Engineering Offer', offerType: 'service_or_productized_service', corePromise: 'turn raw footage into a repeatable publishing machine', primaryOutcome: 'publish more consistently with better edits', ctaTypes: ['dm_keyword', 'join_waitlist', 'book_strategy_call'] },
    { offerId: 'email_marketing_course', brandId: 'portal_copy_co', offerName: 'Email Newsletter Course', offerType: 'course', corePromise: 'create better emails that nurture and convert', primaryOutcome: 'higher engagement and conversions', ctaTypes: ['join_newsletter', 'buy_course', 'download_freebie'] },
    { offerId: 'engineering_tools', brandId: 'techmestuff', offerName: 'Engineering Calculators and Tools', offerType: 'tool', corePromise: 'make technical work easier faster and more accurate', primaryOutcome: 'save time and reduce calculation friction', ctaTypes: ['use_tool', 'read_blog', 'subscribe'] },
  ],

  icps: [
    { icpId: 'creators_builders', label: 'Creators and builders', pains: ['overediting', 'not posting consistently', 'too much footage not enough system'], desiredOutcomes: ['publish faster', 'turn raw clips into content', 'grow with repeatable structure'], languageToUse: ['your footage is enough', 'stop overthinking', 'post faster', 'systemize your content'], funnelBias: { problemAware: 0.40, solutionAware: 0.35, productAware: 0.15, mostAware: 0.10 } },
    { icpId: 'founders_operators', label: 'Founders and operators', pains: ['too much manual work', 'systems not connected', 'team output bottlenecks'], desiredOutcomes: ['scalable workflows', 'time savings', 'clearer operations'], languageToUse: ['systems', 'automation', 'operator leverage', 'remove friction'], funnelBias: { problemAware: 0.25, solutionAware: 0.35, productAware: 0.25, mostAware: 0.15 } },
    { icpId: 'relationship_driven_networkers', label: 'Networkers relationship builders professionals', pains: ['forgetting to follow up', 'relationships fading', 'not knowing what to say'], desiredOutcomes: ['stay top of mind', 'reach out with confidence', 'keep real relationships warm'], languageToUse: ['follow up', 'stay in touch', 'reach out', 'your people matter'], funnelBias: { problemAware: 0.30, solutionAware: 0.30, productAware: 0.25, mostAware: 0.15 } },
    { icpId: 'solopreneurs_women_business_owners', label: 'Solopreneurs and women business owners', pains: ['not enough time for marketing', 'emails not converting', 'not knowing what to say consistently'], desiredOutcomes: ['easy email workflows', 'clear messaging', 'consistent nurture'], languageToUse: ['nurture', 'email strategy', 'simplify your marketing', 'convert with clarity'], funnelBias: { problemAware: 0.35, solutionAware: 0.35, productAware: 0.20, mostAware: 0.10 } },
    { icpId: 'engineers_tech_learners', label: 'Engineers students and practical tech learners', pains: ['technical friction', 'hard-to-find practical explanations', 'slow workflows'], desiredOutcomes: ['clear explanations', 'faster calculations', 'hands-on learning'], languageToUse: ['practical', 'step by step', 'engineering', 'clear breakdown'], funnelBias: { problemAware: 0.30, solutionAware: 0.35, productAware: 0.20, mostAware: 0.15 } },
  ],

  narrativeArchetypes: [
    { narrativeId: 'operator_proof',    description: 'show the system working and explain why it matters' },
    { narrativeId: 'pain_to_shift',     description: 'call out the frustrating pattern and introduce a new way' },
    { narrativeId: 'identity_reframe',  description: 'speak to who the viewer wants to become' },
    { narrativeId: 'demo_with_context', description: 'show product or workflow while tying it to real use' },
    { narrativeId: 'trend_to_offer',    description: 'use a trend signal then bridge it to your offer' },
    { narrativeId: 'relationship_truth',description: 'emotion-first narrative about human connection and follow-up' },
  ],

  platformAccounts: [
    {
      accountId: 'isaiah_instagram', brandId: 'isaiah_personal', platform: 'instagram_reels',
      handle: '@the_isaiah_dupree', blotatoAccountId: 807,
      primaryGoal: 'authority + inbound leads + content system proof',
      preferredNarratives: ['pain_to_shift', 'operator_proof', 'identity_reframe'],
      preferredOffers: ['automation_services', 'content_system_offer'],
      targetIcps: ['creators_builders', 'founders_operators'],
      preferredFunnelMix: { problemAware: 0.35, solutionAware: 0.30, productAware: 0.20, mostAware: 0.15 },
      contentPillars: ['AI automation', 'content systems', 'operator workflows', 'builder execution'],
    },
    {
      accountId: 'isaiah_tiktok', brandId: 'isaiah_personal', platform: 'tiktok',
      handle: '@the_isaiah_dupree', blotatoAccountId: 243,
      primaryGoal: 'reach + native discovery + rapid hypothesis testing',
      preferredNarratives: ['pain_to_shift', 'trend_to_offer', 'identity_reframe'],
      preferredOffers: ['content_system_offer', 'automation_services'],
      targetIcps: ['creators_builders', 'founders_operators'],
      preferredFunnelMix: { problemAware: 0.45, solutionAware: 0.30, productAware: 0.15, mostAware: 0.10 },
      contentPillars: ['why your content is not working', 'AI workflow truths', 'building in public', 'hot takes with proof'],
    },
    {
      accountId: 'isaiah_youtube_shorts', brandId: 'isaiah_personal', platform: 'youtube_shorts',
      handle: '@isaiahdupree', blotatoAccountId: 228,
      primaryGoal: 'searchable authority + compounding educational value',
      preferredNarratives: ['operator_proof', 'demo_with_context', 'pain_to_shift'],
      preferredOffers: ['automation_services', 'content_system_offer'],
      targetIcps: ['creators_builders', 'founders_operators', 'engineers_tech_learners'],
      preferredFunnelMix: { problemAware: 0.25, solutionAware: 0.35, productAware: 0.25, mostAware: 0.15 },
      contentPillars: ['automation breakdowns', 'tool demos', 'content machine architecture', 'execution lessons'],
    },
    {
      accountId: 'everreach_instagram', brandId: 'everreach', platform: 'instagram_reels',
      handle: '@everreachapp', blotatoAccountId: 670,   // @the_isaiah_dupree_ secondary — update when EverReach IG is added
      primaryGoal: 'emotional resonance + app interest',
      preferredNarratives: ['relationship_truth', 'pain_to_shift', 'demo_with_context'],
      preferredOffers: ['everreach_app'],
      targetIcps: ['relationship_driven_networkers', 'founders_operators'],
      preferredFunnelMix: { problemAware: 0.35, solutionAware: 0.30, productAware: 0.20, mostAware: 0.15 },
      contentPillars: ['forgotten follow ups', 'friendship maintenance', 'networking with context', 'message confidence'],
    },
    {
      accountId: 'everreach_tiktok', brandId: 'everreach', platform: 'tiktok',
      handle: '@everreachapp', blotatoAccountId: 710,
      primaryGoal: 'mass resonance around relationships fading',
      preferredNarratives: ['relationship_truth', 'identity_reframe', 'pain_to_shift'],
      preferredOffers: ['everreach_app'],
      targetIcps: ['relationship_driven_networkers'],
      preferredFunnelMix: { problemAware: 0.50, solutionAware: 0.25, productAware: 0.15, mostAware: 0.10 },
      contentPillars: ['text them now', 'people youve been thinking about', 'old messages', 'friendship recovery'],
    },
    {
      accountId: 'everreach_threads', brandId: 'everreach', platform: 'threads',
      handle: '@everreachapp', blotatoAccountId: 4151,
      primaryGoal: 'text-based emotional authority and app framing',
      preferredNarratives: ['relationship_truth', 'identity_reframe'],
      preferredOffers: ['everreach_app'],
      targetIcps: ['relationship_driven_networkers', 'founders_operators'],
      preferredFunnelMix: { problemAware: 0.40, solutionAware: 0.30, productAware: 0.20, mostAware: 0.10 },
      contentPillars: ['short reflections', 'follow up truths', 'relationship reminders'],
    },
    {
      accountId: 'portalcopyco_instagram', brandId: 'portal_copy_co', platform: 'instagram_reels',
      handle: '@portalcopyco', blotatoAccountId: 1369,
      primaryGoal: 'lead generation + trust + newsletter/course funnel',
      preferredNarratives: ['pain_to_shift', 'demo_with_context', 'identity_reframe'],
      preferredOffers: ['email_marketing_course'],
      targetIcps: ['solopreneurs_women_business_owners'],
      preferredFunnelMix: { problemAware: 0.35, solutionAware: 0.35, productAware: 0.20, mostAware: 0.10 },
      contentPillars: ['email mistakes', 'newsletter strategy', 'copy clarity', 'small business nurture'],
    },
    {
      accountId: 'portalcopyco_linkedin', brandId: 'portal_copy_co', platform: 'linkedin',
      handle: 'Portal Copy Co', blotatoAccountId: 173,
      primaryGoal: 'high-trust professional inbound',
      preferredNarratives: ['operator_proof', 'demo_with_context', 'pain_to_shift'],
      preferredOffers: ['email_marketing_course'],
      targetIcps: ['solopreneurs_women_business_owners', 'founders_operators'],
      preferredFunnelMix: { problemAware: 0.20, solutionAware: 0.35, productAware: 0.30, mostAware: 0.15 },
      contentPillars: ['email systems', 'copy performance', 'case-study style lessons'],
    },
    {
      accountId: 'techmestuff_youtube', brandId: 'techmestuff', platform: 'youtube_shorts',
      handle: '@techmestuff', blotatoAccountId: 3370,
      primaryGoal: 'education + tool discovery + search traffic',
      preferredNarratives: ['demo_with_context', 'operator_proof', 'pain_to_shift'],
      preferredOffers: ['engineering_tools'],
      targetIcps: ['engineers_tech_learners', 'creators_builders'],
      preferredFunnelMix: { problemAware: 0.25, solutionAware: 0.40, productAware: 0.20, mostAware: 0.15 },
      contentPillars: ['calculator demos', 'engineering concepts', 'practical automation', 'DIY tools'],
    },
  ],
};

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getAccount(id: PlatformAccountId): PlatformAccount {
  const a = WORKSPACE.platformAccounts.find(a => a.accountId === id);
  if (!a) throw new Error(`Unknown account: ${id}`);
  return a;
}

export function getOffer(id: OfferId): Offer {
  const o = WORKSPACE.offers.find(o => o.offerId === id);
  if (!o) throw new Error(`Unknown offer: ${id}`);
  return o;
}

export function getIcp(id: IcpId): Icp {
  const i = WORKSPACE.icps.find(i => i.icpId === id);
  if (!i) throw new Error(`Unknown ICP: ${id}`);
  return i;
}

export function getBrand(id: BrandId): Brand {
  const b = WORKSPACE.brands.find(b => b.brandId === id);
  if (!b) throw new Error(`Unknown brand: ${id}`);
  return b;
}

/** All platform accounts for a given brand */
export function getAccountsForBrand(brandId: BrandId): PlatformAccount[] {
  return WORKSPACE.platformAccounts.filter(a => a.brandId === brandId);
}

/** Pick the highest-weighted funnel stage from a mix */
export function dominantStage(mix: FunnelMix): FunnelStage {
  const entries = Object.entries(mix) as [FunnelStage, number][];
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * selectAccount — given a brand and optional platform preference,
 * returns the best matching account ID.
 */
export function selectAccount(
  brandId: BrandId,
  platform?: Platform,
): PlatformAccount {
  const candidates = getAccountsForBrand(brandId);
  if (!candidates.length) throw new Error(`No accounts for brand: ${brandId}`);
  if (platform) {
    const match = candidates.find(a => a.platform === platform);
    if (match) return match;
  }
  return candidates[0];
}

/**
 * selectOffer — returns the best offer for an account based on its
 * preferredOffers list.
 */
export function selectOffer(account: PlatformAccount): Offer {
  return getOffer(account.preferredOffers[0]);
}

/**
 * selectIcp — returns the best ICP for an account+offer combination.
 */
export function selectIcp(account: PlatformAccount): Icp {
  return getIcp(account.targetIcps[0]);
}

/**
 * selectFunnelStage — blends account preferredFunnelMix and ICP funnelBias
 * to pick the dominant stage.
 */
export function selectFunnelStage(
  account: PlatformAccount,
  icp: Icp,
): FunnelStage {
  const blended: FunnelMix = {
    problemAware:  (account.preferredFunnelMix.problemAware  + icp.funnelBias.problemAware)  / 2,
    solutionAware: (account.preferredFunnelMix.solutionAware + icp.funnelBias.solutionAware) / 2,
    productAware:  (account.preferredFunnelMix.productAware  + icp.funnelBias.productAware)  / 2,
    mostAware:     (account.preferredFunnelMix.mostAware     + icp.funnelBias.mostAware)     / 2,
  };
  return dominantStage(blended);
}

/**
 * selectNarrative — picks best narrative archetype for an account + funnel stage.
 */
export function selectNarrative(
  account: PlatformAccount,
  stage: FunnelStage,
): NarrativeId {
  // Problem-aware content → lead with pain
  if (stage === 'problemAware') {
    return account.preferredNarratives.find(n =>
      n === 'pain_to_shift' || n === 'relationship_truth'
    ) ?? account.preferredNarratives[0];
  }
  // Solution-aware → operator proof or demo
  if (stage === 'solutionAware' || stage === 'productAware') {
    return account.preferredNarratives.find(n =>
      n === 'operator_proof' || n === 'demo_with_context'
    ) ?? account.preferredNarratives[0];
  }
  return account.preferredNarratives[0];
}

/**
 * buildDecision — full decision engine: source clip → runtime decision.
 * All fields except generated copy are determined programmatically.
 */
export function buildDecision(params: {
  sourceClipId: string;
  brandId: BrandId;
  platform?: Platform;
  overrides?: Partial<RuntimeDecision>;
}): Omit<RuntimeDecision, 'generatedHook' | 'generatedSummaryStrap' | 'generatedDescription' | 'generatedCta'> {
  const { sourceClipId, brandId, platform, overrides } = params;

  const account  = selectAccount(brandId, platform);
  const offer    = selectOffer(account);
  const icp      = selectIcp(account);
  const stage    = selectFunnelStage(account, icp);
  const narrative = selectNarrative(account, stage);

  const arm = [
    `narrative_${narrative}`,
    `funnel_${stage}`,
    `offer_${offer.offerId}`,
  ].join('__');

  return {
    brandId,
    sourceClipId,
    targetAccountId: account.accountId,
    selectedOfferId: offer.offerId,
    selectedIcpId: icp.icpId,
    selectedFunnelStage: stage,
    selectedNarrativeId: narrative,
    selectedBrollIds: [],
    selectedAudioId: 'auto',
    experimentArm: arm,
    ...overrides,
  };
}
