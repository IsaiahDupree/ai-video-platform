// EverReach Ad Angle Matrix
// Systematic testing of awareness levels × belief clusters × formats

import { AwarenessLevel, BeliefCluster } from './config';

// =============================================================================
// Angle Definition
// =============================================================================

export interface AdAngle {
  id: string;
  name: string;
  awareness: AwarenessLevel;
  belief: BeliefCluster;
  headline: string;
  subheadline: string;
  hook: string;
  ctaText: string;
  template: 'headline' | 'painpoint' | 'listicle' | 'comparison' | 'stat' | 'question' | 'objection';
}

// =============================================================================
// Phase A Testing Matrix - 20 Angles for Broad Testing
// =============================================================================

export const PHASE_A_ANGLES: AdAngle[] = [
  // --- UNAWARE (4 angles) ---
  {
    id: 'UA_TIMING_01',
    name: 'Timing Not Effort',
    awareness: 'unaware',
    belief: 'too_busy',
    headline: 'Most opportunities are lost to timing, not effort',
    subheadline: 'The fix isn\'t a sprint. It\'s 60 seconds a day.',
    hook: 'Timing is the real killer',
    ctaText: 'Start with 1 person',
    template: 'headline',
  },
  {
    id: 'UA_FADE_02',
    name: 'People Fade Out',
    awareness: 'unaware',
    belief: 'too_busy',
    headline: 'People don\'t fall out. They fade out.',
    subheadline: 'Not from conflict. From time.',
    hook: 'Relationships drift quietly',
    ctaText: 'Stay close on purpose',
    template: 'headline',
  },
  {
    id: 'UA_TAX_03',
    name: 'Invisible Tax',
    awareness: 'unaware',
    belief: 'too_busy',
    headline: 'Distance has a hidden cost',
    subheadline: 'Every week you wait, it gets harder to reach out.',
    hook: 'The invisible relationship tax',
    ctaText: 'Pay it daily in 60 seconds',
    template: 'painpoint',
  },
  {
    id: 'UA_HABIT_04',
    name: 'One Minute Workout',
    awareness: 'unaware',
    belief: 'too_busy',
    headline: 'One minute. One person. Done.',
    subheadline: 'Add one tiny habit that keeps your people close.',
    hook: 'Daily reps beat random bursts',
    ctaText: 'Start the habit',
    template: 'stat',
  },

  // --- PROBLEM AWARE (4 angles) ---
  {
    id: 'PA_SYSTEM_05',
    name: 'Network vs System',
    awareness: 'problem_aware',
    belief: 'already_organized',
    headline: 'Your network isn\'t small. Your system is.',
    subheadline: 'If you have 200+ contacts, you\'re already forgetting people.',
    hook: 'Not a network problem',
    ctaText: 'Get a system',
    template: 'headline',
  },
  {
    id: 'PA_DECAY_06',
    name: 'Relationship Decay',
    awareness: 'problem_aware',
    belief: 'revenue_loss',
    headline: 'Relationships don\'t disappear. They decay.',
    subheadline: 'Quietly. Until it\'s awkward to reach out.',
    hook: 'Decay happens silently',
    ctaText: 'Stop the decay',
    template: 'painpoint',
  },
  {
    id: 'PA_MEMORY_07',
    name: 'Memory Fails',
    awareness: 'problem_aware',
    belief: 'already_organized',
    headline: 'The worst follow-up system is "I\'ll remember"',
    subheadline: 'You won\'t. Not with a full life.',
    hook: 'Memory is not a system',
    ctaText: 'Get a real system',
    template: 'headline',
  },
  {
    id: 'PA_COST_08',
    name: 'Cost of Inaction',
    awareness: 'problem_aware',
    belief: 'revenue_loss',
    headline: 'Lost deals. Missed referrals. Faded intros.',
    subheadline: 'All because you didn\'t follow up in time.',
    hook: 'Inaction is expensive',
    ctaText: 'Fix it now',
    template: 'painpoint',
  },

  // --- SOLUTION AWARE (4 angles) ---
  {
    id: 'SA_WORDS_09',
    name: 'Reminders Fail',
    awareness: 'solution_aware',
    belief: 'hate_crm',
    headline: 'Reminders aren\'t enough',
    subheadline: 'They don\'t tell you what to say.',
    hook: 'Reminders fail because no words',
    ctaText: 'Get the words too',
    template: 'headline',
  },
  {
    id: 'SA_CRM_10',
    name: 'CRM Action Gap',
    awareness: 'solution_aware',
    belief: 'hate_crm',
    headline: 'CRMs are for logging, not action',
    subheadline: 'EverReach is the action layer.',
    hook: 'Logging vs momentum',
    ctaText: 'Try the action layer',
    template: 'comparison',
  },
  {
    id: 'SA_DAILY_11',
    name: 'Daily System',
    awareness: 'solution_aware',
    belief: 'too_busy',
    headline: 'The best system is the one you\'ll use daily',
    subheadline: 'Not a CRM. A daily "who matters today" list.',
    hook: 'Daily use beats complexity',
    ctaText: 'See today\'s list',
    template: 'headline',
  },
  {
    id: 'SA_SIMPLE_12',
    name: 'Simplest Way',
    awareness: 'solution_aware',
    belief: 'hate_crm',
    headline: 'The simplest way to never let relationships go cold',
    subheadline: 'Pick one person. Get a message. Send in 60 seconds.',
    hook: 'Simplicity wins',
    ctaText: 'Try it free',
    template: 'headline',
  },

  // --- PRODUCT AWARE (5 angles) ---
  {
    id: 'PD_DEMO_13',
    name: 'Quick Demo',
    awareness: 'product_aware',
    belief: 'too_busy',
    headline: 'Pick one. Get message. Send.',
    subheadline: 'That\'s it. 60 seconds. Done.',
    hook: '3-step loop',
    ctaText: 'Start with 1 person',
    template: 'stat',
  },
  {
    id: 'PD_NOENTRY_14',
    name: 'No Data Entry',
    awareness: 'product_aware',
    belief: 'hate_crm',
    headline: 'No data entry. No pipelines. Just momentum.',
    subheadline: 'Start with 1 person. No full import required.',
    hook: 'Zero friction start',
    ctaText: 'Try it free',
    template: 'headline',
  },
  {
    id: 'PD_WARMTH_15',
    name: 'Warmth Score',
    awareness: 'product_aware',
    belief: 'already_organized',
    headline: 'See who\'s going cold',
    subheadline: 'Warmth score shows you who needs attention today.',
    hook: 'Visual relationship health',
    ctaText: 'Check your warmth',
    template: 'headline',
  },
  {
    id: 'PD_APPROVE_16',
    name: 'You Approve',
    awareness: 'product_aware',
    belief: 'feels_cringe',
    headline: 'You approve every message',
    subheadline: 'Edit it. Sound like you. Then send.',
    hook: 'No auto-send ever',
    ctaText: 'Try it free',
    template: 'headline',
  },
  {
    id: 'PD_OBJECTIONS_17',
    name: 'Objection Killer',
    awareness: 'product_aware',
    belief: 'privacy_first',
    headline: 'Still not sure?',
    subheadline: 'Every objection answered.',
    hook: 'All doubts handled',
    ctaText: 'Try it free',
    template: 'objection',
  },

  // --- MOST AWARE (3 angles) ---
  {
    id: 'MA_START_18',
    name: 'Start Today',
    awareness: 'most_aware',
    belief: 'too_busy',
    headline: 'Start with 1 person today',
    subheadline: 'No credit card. Cancel anytime.',
    hook: 'Just start',
    ctaText: 'Try it free',
    template: 'headline',
  },
  {
    id: 'MA_SILENCE_19',
    name: 'Stop Silence',
    awareness: 'most_aware',
    belief: 'revenue_loss',
    headline: 'Stop losing deals to silence',
    subheadline: 'Your network is waiting.',
    hook: 'Silence costs money',
    ctaText: 'Get your first message',
    template: 'headline',
  },
  {
    id: 'MA_ENGINE_20',
    name: 'Opportunity Engine',
    awareness: 'most_aware',
    belief: 'revenue_loss',
    headline: 'Turn your network into opportunity',
    subheadline: 'One message a day compounds.',
    hook: 'Network as asset',
    ctaText: 'Start with 1 person',
    template: 'headline',
  },
];

// =============================================================================
// Angle Variations by Format
// =============================================================================

export const FORMAT_VARIATIONS = {
  instagram_post: {
    headlineSize: 48,
    subheadlineSize: 22,
    layout: 'centered',
  },
  instagram_story: {
    headlineSize: 52,
    subheadlineSize: 24,
    layout: 'centered',
  },
  facebook_post: {
    headlineSize: 42,
    subheadlineSize: 20,
    layout: 'centered',
  },
  facebook_story: {
    headlineSize: 52,
    subheadlineSize: 24,
    layout: 'centered',
  },
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

export function getAngleById(id: string): AdAngle | undefined {
  return PHASE_A_ANGLES.find(angle => angle.id === id);
}

export function getAnglesByAwareness(awareness: AwarenessLevel): AdAngle[] {
  return PHASE_A_ANGLES.filter(angle => angle.awareness === awareness);
}

export function getAnglesByBelief(belief: BeliefCluster): AdAngle[] {
  return PHASE_A_ANGLES.filter(angle => angle.belief === belief);
}

export function generateAngleMatrix(): Array<{
  angle: AdAngle;
  format: string;
  compositionId: string;
}> {
  const formats = ['instagram_post', 'instagram_story', 'facebook_post'];
  const matrix: Array<{ angle: AdAngle; format: string; compositionId: string }> = [];

  for (const angle of PHASE_A_ANGLES) {
    for (const format of formats) {
      matrix.push({
        angle,
        format,
        compositionId: `EverReach-${angle.id}-${format}`,
      });
    }
  }

  return matrix;
}

// =============================================================================
// Screenshot-to-Angle Mapping (for EverReachScreenshotAd)
// =============================================================================

// Screenshot visual content reference:
//   01-contacts-list.png  → Dashboard home (Relationship Health: Hot/Warm/Cool/Cold counts)
//   02-contact-detail.png → Contact profile (Rachel Green, HOT 86/100, channels)
//   03-voice-note.png     → Voice note recorder screen
//   04-search-tags.png    → People list with warmth scores (the contacts list)
//   05-warmth-score.png   → Contact context detail (Nina Patel, HOT 69, tags, timeline)
//   06-goal-compose.png   → Pick Goal / Generate Message screen
//   07-subscription.png   → Paywall / features list + pricing
//   subscription.png      → Same as 07

export const ANGLE_SCREENSHOT_MAP: Record<string, {
  screenshotSrc: string;
  screenshotAlt: string;
  layout: 'left' | 'right' | 'center' | 'bottom';
  badge?: string;
  theme: 'dark' | 'light' | 'warmGradient' | 'coolGradient';
}> = {
  // Unaware — dashboard home shows the "relationship health" concept emotionally
  UA_TIMING_01: { screenshotSrc: 'everreach/screenshots/01-contacts-list.png', screenshotAlt: 'Relationship health dashboard', layout: 'right', theme: 'dark' },
  UA_FADE_02:   { screenshotSrc: 'everreach/screenshots/04-search-tags.png',   screenshotAlt: 'Contacts with warmth scores', layout: 'right', theme: 'dark' },
  UA_TAX_03:    { screenshotSrc: 'everreach/screenshots/01-contacts-list.png', screenshotAlt: 'Relationship health', layout: 'bottom', theme: 'warmGradient' },
  UA_HABIT_04:  { screenshotSrc: 'everreach/screenshots/04-search-tags.png',   screenshotAlt: 'Contacts list', layout: 'right', theme: 'dark' },

  // Problem Aware — show contacts going cold (people list with scores)
  PA_SYSTEM_05: { screenshotSrc: 'everreach/screenshots/04-search-tags.png',   screenshotAlt: 'Contacts with warmth scores', layout: 'right', theme: 'dark' },
  PA_DECAY_06:  { screenshotSrc: 'everreach/screenshots/01-contacts-list.png', screenshotAlt: 'Relationship health', layout: 'right', theme: 'warmGradient' },
  PA_MEMORY_07: { screenshotSrc: 'everreach/screenshots/04-search-tags.png',   screenshotAlt: 'Contacts list', layout: 'bottom', theme: 'dark' },
  PA_COST_08:   { screenshotSrc: 'everreach/screenshots/04-search-tags.png',   screenshotAlt: 'Contacts list', layout: 'right', theme: 'dark', badge: 'WAKE UP' },

  // Solution Aware — show the mechanism (goal picker + message generator)
  SA_WORDS_09:  { screenshotSrc: 'everreach/screenshots/06-goal-compose.png', screenshotAlt: 'AI message generator', layout: 'right', theme: 'dark' },
  SA_CRM_10:    { screenshotSrc: 'everreach/screenshots/06-goal-compose.png', screenshotAlt: 'AI message generator', layout: 'right', theme: 'coolGradient' },
  SA_DAILY_11:  { screenshotSrc: 'everreach/screenshots/01-contacts-list.png', screenshotAlt: 'Daily relationship dashboard', layout: 'right', theme: 'dark' },
  SA_SIMPLE_12: { screenshotSrc: 'everreach/screenshots/06-goal-compose.png', screenshotAlt: 'AI message generator', layout: 'right', theme: 'dark' },

  // Product Aware — show proof (contact detail, warmth context, compose)
  PD_DEMO_13:    { screenshotSrc: 'everreach/screenshots/06-goal-compose.png', screenshotAlt: 'Generate message in seconds', layout: 'right', theme: 'dark', badge: '60 SECONDS' },
  PD_NOENTRY_14: { screenshotSrc: 'everreach/screenshots/05-warmth-score.png', screenshotAlt: 'Contact context detail', layout: 'right', theme: 'dark' },
  PD_WARMTH_15:  { screenshotSrc: 'everreach/screenshots/02-contact-detail.png', screenshotAlt: 'Contact with HOT warmth score', layout: 'right', theme: 'dark', badge: 'WARMTH SCORE' },
  PD_APPROVE_16: { screenshotSrc: 'everreach/screenshots/06-goal-compose.png', screenshotAlt: 'Message composer', layout: 'right', theme: 'dark' },
  PD_OBJECTIONS_17: { screenshotSrc: 'everreach/screenshots/07-subscription.png', screenshotAlt: 'Features + pricing', layout: 'right', theme: 'dark' },

  // Most Aware — direct CTA + proof (paywall / subscription)
  MA_START_18:   { screenshotSrc: 'everreach/screenshots/07-subscription.png', screenshotAlt: 'Start free trial', layout: 'right', theme: 'dark', badge: 'FREE TRIAL' },
  MA_SILENCE_19: { screenshotSrc: 'everreach/screenshots/04-search-tags.png',  screenshotAlt: 'Contacts with warmth scores', layout: 'right', theme: 'warmGradient' },
  MA_ENGINE_20:  { screenshotSrc: 'everreach/screenshots/06-goal-compose.png', screenshotAlt: 'AI message generator', layout: 'right', theme: 'dark', badge: 'START FREE' },
};

export function getAngleScreenshot(angleId: string) {
  return ANGLE_SCREENSHOT_MAP[angleId] || {
    screenshotSrc: 'everreach/screenshots/05-warmth-score.png',
    screenshotAlt: 'Warmth score',
    layout: 'right' as const,
    theme: 'dark' as const,
  };
}

// Export all angles as a flat array for batch rendering
export const ALL_ANGLES = PHASE_A_ANGLES;
