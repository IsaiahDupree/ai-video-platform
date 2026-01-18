// EverReach Ad Configuration
// Colors, fonts, copy bank, and ad sizes for Meta platforms

// =============================================================================
// Brand Colors
// =============================================================================

export const EVERREACH_COLORS = {
  // Primary
  primary: '#6366f1',      // Indigo
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  
  // Secondary
  secondary: '#8b5cf6',    // Purple
  secondaryDark: '#7c3aed',
  
  // Accent
  accent: '#f59e0b',       // Amber
  accentLight: '#fbbf24',
  
  // Neutrals
  dark: '#0a0a1a',
  darkGray: '#1a1a2e',
  gray: '#64748b',
  lightGray: '#cbd5e1',
  white: '#ffffff',
  
  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  
  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  gradientDark: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)',
  gradientWarm: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
} as const;

// =============================================================================
// Typography
// =============================================================================

export const EVERREACH_FONTS = {
  heading: "'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
} as const;

// =============================================================================
// Meta Platform Ad Sizes
// =============================================================================

export const META_AD_SIZES = {
  // Instagram
  instagram_post: { width: 1080, height: 1080, name: 'Instagram Post', aspect: '1:1' },
  instagram_story: { width: 1080, height: 1920, name: 'Instagram Story', aspect: '9:16' },
  instagram_landscape: { width: 1080, height: 566, name: 'Instagram Landscape', aspect: '1.91:1' },
  
  // Facebook
  facebook_post: { width: 1200, height: 630, name: 'Facebook Post', aspect: '1.91:1' },
  facebook_story: { width: 1080, height: 1920, name: 'Facebook Story', aspect: '9:16' },
  facebook_square: { width: 1200, height: 1200, name: 'Facebook Square', aspect: '1:1' },
  
  // Threads
  threads_post: { width: 1080, height: 1080, name: 'Threads Post', aspect: '1:1' },
  
  // All platforms story
  story: { width: 1080, height: 1920, name: 'Story (All)', aspect: '9:16' },
} as const;

export type MetaAdSize = keyof typeof META_AD_SIZES;

// =============================================================================
// Awareness Levels
// =============================================================================

export const AWARENESS_LEVELS = {
  unaware: {
    id: 'unaware',
    name: 'Unaware',
    goal: 'Make problem obvious',
    hookStyle: 'Life insight → habit → soft reveal',
  },
  problem_aware: {
    id: 'problem_aware',
    name: 'Problem Aware',
    goal: 'Make pain personal + urgent',
    hookStyle: 'Pain → cost → fix',
  },
  solution_aware: {
    id: 'solution_aware',
    name: 'Solution Aware',
    goal: 'Position as simplest way',
    hookStyle: 'Compare alternatives → mechanism',
  },
  product_aware: {
    id: 'product_aware',
    name: 'Product Aware',
    goal: 'Handle objections + close',
    hookStyle: 'Demo + objections + CTA',
  },
  most_aware: {
    id: 'most_aware',
    name: 'Most Aware',
    goal: 'Direct CTA + proof',
    hookStyle: 'Proof + risk reversal + urgency',
  },
} as const;

export type AwarenessLevel = keyof typeof AWARENESS_LEVELS;

// =============================================================================
// Belief Clusters
// =============================================================================

export const BELIEF_CLUSTERS = {
  too_busy: {
    id: 'too_busy',
    name: 'Too Busy',
    pain: 'Forgetting check-ins',
    promise: 'Never let a relationship go cold',
    objection: 'Setup takes forever',
  },
  hate_crm: {
    id: 'hate_crm',
    name: 'Hate CRMs',
    pain: 'System fragmentation',
    promise: 'Daily "who matters" list',
    objection: 'Already have tools',
  },
  feels_cringe: {
    id: 'feels_cringe',
    name: 'Feels Cringe',
    pain: 'Fear of sounding salesy',
    promise: 'Sound like you, not a template',
    objection: 'AI makes it robotic',
  },
  revenue_loss: {
    id: 'revenue_loss',
    name: 'Revenue Loss',
    pain: 'Missed opportunities',
    promise: 'Relationships = pipeline',
    objection: 'Not sure ROI',
  },
  privacy_first: {
    id: 'privacy_first',
    name: 'Privacy First',
    pain: 'Data trust concerns',
    promise: 'You control everything',
    objection: "Don't trust syncing",
  },
  already_organized: {
    id: 'already_organized',
    name: 'Already Organized',
    pain: 'Notes everywhere',
    promise: 'One place, one action',
    objection: "Don't need another tool",
  },
} as const;

export type BeliefCluster = keyof typeof BELIEF_CLUSTERS;

// =============================================================================
// Copy Bank
// =============================================================================

export const COPY_BANK = {
  headlines: {
    unaware: [
      'Your network is quietly getting weaker',
      'Most people lose opportunities for one reason: timing',
      'The people who matter most don\'t show up as urgent',
      'People don\'t fall out. They fade out.',
      'One minute. One person. Done.',
    ],
    problem_aware: [
      'If you have 200+ contacts, you\'re forgetting people',
      'The worst follow-up system is "I\'ll remember"',
      'Relationships don\'t disappear. They decay.',
      'Your network isn\'t small. Your system is.',
      'It\'s not that you don\'t care—you\'re busy.',
    ],
    solution_aware: [
      'Reminders aren\'t enough. You also need the words.',
      'CRMs are for logging, not keeping relationships warm',
      'The best system is the one you\'ll actually use daily',
      'Stop relying on memory. Use a system.',
      'Consistency beats intensity.',
    ],
    product_aware: [
      'Pick one person. Get a message. Send in 60 seconds.',
      'No data entry. No pipelines. Just momentum.',
      'Relationship intelligence, not contact storage.',
      'See who\'s going cold. Act before it\'s awkward.',
      'You approve every message. No auto-send.',
    ],
    most_aware: [
      'Start with 1 person today',
      'Stop losing deals to silence',
      'Turn your network into opportunity',
      'Try EverReach free',
      'Your network is waiting',
    ],
  },
  subheadlines: {
    unaware: [
      'A tiny daily habit that keeps your people close',
      'The fix isn\'t a sprint. It\'s 60 seconds a day.',
      'Make connection the default, not the afterthought',
    ],
    problem_aware: [
      'EverReach shows you who\'s fading and what to say',
      'One person. One message. One minute.',
      'Stop the quiet drift before it costs you',
    ],
    solution_aware: [
      'The daily "who matters today" list with the words included',
      'Not a CRM. An action layer.',
      'Context + message draft = follow-up in 60 seconds',
    ],
    product_aware: [
      'Warmth score tells you who needs attention',
      'Start with 1 person. No full import required.',
      'You edit. You approve. You send.',
    ],
    most_aware: [
      'Join thousands keeping relationships warm',
      'No credit card required',
      'Cancel anytime',
    ],
  },
  ctas: [
    'Start with 1 person',
    'Try it free',
    'See who\'s going cold',
    'Get your first message',
    'Keep relationships warm',
  ],
  objectionCounters: [
    { objection: 'Setup time', counter: 'Start with 1 person' },
    { objection: 'Privacy', counter: 'You control your data' },
    { objection: 'AI sounds fake', counter: 'You edit before send' },
    { objection: 'Will spam', counter: 'One message at a time' },
    { objection: 'Auto-send', counter: 'You approve every message' },
    { objection: 'Have CRM', counter: 'This is the action layer' },
    { objection: 'Not in sales', counter: 'Works for all relationships' },
    { objection: 'Pricing', counter: 'One saved relationship covers it' },
    { objection: 'Cancel', counter: 'Cancel anytime' },
  ],
} as const;

// =============================================================================
// Default Props
// =============================================================================

export const EVERREACH_DEFAULT_PROPS = {
  headline: 'Never let a relationship go cold',
  subheadline: 'Pick one person. Get a message. Send in 60 seconds.',
  ctaText: 'Start with 1 person',
  awareness: 'problem_aware' as AwarenessLevel,
  belief: 'too_busy' as BeliefCluster,
  theme: 'gradient' as const,
  logoPosition: 'top-left' as const,
  ctaStyle: 'pill' as const,
};
