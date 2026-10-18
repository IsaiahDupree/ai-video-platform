// =============================================================================
// BlankLogo Static Ads - Configuration & Design System
// =============================================================================

// Brand Colors
export const BLANKLOGO_COLORS = {
  // Primary palette
  primary: '#635bff',
  primaryLight: '#8b5cf6',
  primaryDark: '#4f46e5',
  
  // Accent
  accent: '#00d4ff',
  accentGlow: '#00d4ff40',
  
  // Semantic
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.15)',
  error: '#ef4444',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  warning: '#f59e0b',
  
  // Neutrals
  white: '#ffffff',
  lightGray: '#a1a1aa',
  mediumGray: '#71717a',
  darkGray: '#3f3f46',
  dark: '#18181b',
  darker: '#0a0a0f',
  
  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #635bff 0%, #00d4ff 100%)',
  gradientDark: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
  gradientCard: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 40%, #2d1f4e 70%, #1a1a2e 100%)',
  gradientSuccess: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
} as const;

// Typography
export const BLANKLOGO_FONTS = {
  heading: 'Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, sans-serif',
  mono: 'JetBrains Mono, monospace',
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
} as const;

// Ad Sizes for Meta platforms
export const BLANKLOGO_AD_SIZES = {
  instagram_post: { width: 1080, height: 1080, name: 'Instagram Post' },
  instagram_story: { width: 1080, height: 1920, name: 'Instagram Story' },
  facebook_post: { width: 1200, height: 630, name: 'Facebook Post' },
  facebook_story: { width: 1080, height: 1920, name: 'Facebook Story' },
  twitter_post: { width: 1200, height: 675, name: 'Twitter Post' },
} as const;

// Copy Bank - Problem-Aware Messaging
export const PROBLEM_AWARE_COPY = {
  headlines: [
    'Remove Watermarks From Videos',
    'Fix the Watermark Fast',
    'No App. No Drama.',
    'Stop Getting Blurry Exports',
    'Remove Watermarks in 3 Steps',
    'Your Watermark Fix Tool',
    'Ad-Free Watermark Removal',
    'Post More. Stress Less.',
    'Stop Wasting Time',
    'Delete the Watermark',
  ],
  subheadlines: [
    'That watermark is killing the clip. Upload → clean it → download. No ad spam.',
    "Don't redo the whole edit. Clean the watermark and ship the video.",
    'Just upload the video. Premium watermark removal in a simple flow.',
    'Quality-first removal. Built to keep your video looking clean.',
    'Creators use this when they need the clip today.',
    'When you need a clean clip fast, this is the site you keep.',
    'Premium experience. No popups. No "wait 30 seconds" nonsense.',
    'Clean clips when watermarks get in the way.',
    'Most tools waste your time. This is built for speed + clean output.',
    'Upload your video and get a clean version back.',
  ],
  ctas: [
    'Try it now',
    'Remove watermark',
    'Get started',
    'Try BlankLogo',
    'Upload video',
    'Use now',
    'Remove now',
    'Try it',
    'Upload',
  ],
} as const;

// Copy Bank - Solution-Aware Messaging
export const SOLUTION_AWARE_COPY = {
  headlines: [
    'Finally — One That Works',
    'No New Watermark',
    'Skip the Ad Spam',
    'Stop Accepting Blurry Fixes',
    'No Silent Failures',
    'Premium Watermark Removal',
    'Minutes, Not Hours',
    'Works in the Browser',
    'The One You Keep Open',
    'Built to Avoid the Usual Problems',
  ],
  subheadlines: [
    'If the usual sites keep ruining your video, try a premium tool built for clean results.',
    'Premium output. No bait-and-switch. Just clean video.',
    'Ad-free experience designed for creators and teams.',
    'Designed to preserve clarity while removing the watermark.',
    'Clear progress. Clean output. Built like a real tool, not a sketchy site.',
    'For people who need it to work the first time.',
    'Stop waiting forever. Upload and get a clean version back.',
    'No downloads. No plugins. Just upload and go.',
    "When you find a tool that actually works, you don't switch.",
    'No ad walls. No low-quality exports. No gimmicks — just clean results.',
  ],
  ctas: [
    'Try BlankLogo',
    'Remove watermark',
    'Get started',
    'Try now',
    'Upload',
    'Remove now',
    'Use BlankLogo',
  ],
} as const;

// Comparison Data - "Typical tools" vs "BlankLogo"
export const COMPARISON_DATA = {
  typical: {
    title: 'Typical Tools',
    items: [
      'Blurry output',
      'Smear patches',
      'Endless ads',
      'Fake progress bars',
      'Add their own watermark',
      'Slow processing',
    ],
  },
  blanklogo: {
    title: 'BlankLogo',
    items: [
      'Clean removal',
      'Quality preserved',
      'Ad-free experience',
      'Clear status updates',
      'No new watermarks',
      'Fast turnaround',
    ],
  },
} as const;

// Three-step flow data
export const THREE_STEPS = [
  {
    step: 1,
    title: 'Upload',
    description: 'Drop your video file',
    icon: '📤',
  },
  {
    step: 2,
    title: 'Remove',
    description: 'AI removes the watermark',
    icon: '✨',
  },
  {
    step: 3,
    title: 'Download',
    description: 'Get your clean video',
    icon: '📥',
  },
] as const;

// Receipt/checklist items
export const RECEIPT_ITEMS = [
  { label: 'Watermark Removed', status: 'success' as const },
  { label: 'Quality Preserved', status: 'success' as const },
  { label: 'Ad-Free Experience', status: 'success' as const },
  { label: 'No New Watermark', status: 'success' as const },
  { label: 'Fast Processing', status: 'success' as const },
] as const;

// Ad concept configurations (20 total)
export const AD_CONCEPTS = {
  // Problem-aware (10)
  problem_aware: [
    { id: 'pa_01', headline: 'Remove Watermarks From Videos', subheadline: 'That watermark is killing the clip. Upload → clean it → download. No ad spam.', cta: 'Try it now' },
    { id: 'pa_02', headline: 'Fix the Watermark Fast', subheadline: "Don't redo the whole edit. Clean the watermark and ship the video.", cta: 'Remove watermark' },
    { id: 'pa_03', headline: 'No App. No Drama.', subheadline: 'Just upload the video. Premium watermark removal in a simple flow.', cta: 'Get started' },
    { id: 'pa_04', headline: 'Stop Getting Blurry Exports', subheadline: 'Quality-first removal. Built to keep your video looking clean.', cta: 'Try BlankLogo' },
    { id: 'pa_05', headline: 'Remove Watermarks in 3 Steps', subheadline: 'Creators use this when they need the clip today.', cta: 'Upload video' },
    { id: 'pa_06', headline: 'Your Watermark Fix Tool', subheadline: 'When you need a clean clip fast, this is the site you keep.', cta: 'Use now' },
    { id: 'pa_07', headline: 'Ad-Free Watermark Removal', subheadline: 'Premium experience. No popups. No "wait 30 seconds" nonsense.', cta: 'Remove now' },
    { id: 'pa_08', headline: 'Post More. Stress Less.', subheadline: 'Clean clips when watermarks get in the way.', cta: 'Try it' },
    { id: 'pa_09', headline: 'Stop Wasting Time', subheadline: 'Most tools waste your time. This is built for speed + clean output.', cta: 'Get started' },
    { id: 'pa_10', headline: 'Delete the Watermark', subheadline: 'Upload your video and get a clean version back.', cta: 'Upload' },
  ],
  // Solution-aware (10)
  solution_aware: [
    { id: 'sa_01', headline: 'Finally — One That Works', subheadline: 'If the usual sites keep ruining your video, try a premium tool built for clean results.', cta: 'Try BlankLogo' },
    { id: 'sa_02', headline: 'No New Watermark', subheadline: 'Premium output. No bait-and-switch. Just clean video.', cta: 'Remove watermark' },
    { id: 'sa_03', headline: 'Skip the Ad Spam', subheadline: 'Ad-free experience designed for creators and teams.', cta: 'Get started' },
    { id: 'sa_04', headline: 'Stop Accepting Blurry Fixes', subheadline: 'Designed to preserve clarity while removing the watermark.', cta: 'Try now' },
    { id: 'sa_05', headline: 'No Silent Failures', subheadline: 'Clear progress. Clean output. Built like a real tool, not a sketchy site.', cta: 'Upload' },
    { id: 'sa_06', headline: 'Premium Watermark Removal', subheadline: 'For people who need it to work the first time.', cta: 'Remove now' },
    { id: 'sa_07', headline: 'Minutes, Not Hours', subheadline: 'Stop waiting forever. Upload and get a clean version back.', cta: 'Try it' },
    { id: 'sa_08', headline: 'Works in the Browser', subheadline: 'No downloads. No plugins. Just upload and go.', cta: 'Get started' },
    { id: 'sa_09', headline: 'The One You Keep Open', subheadline: "When you find a tool that actually works, you don't switch.", cta: 'Use BlankLogo' },
    { id: 'sa_10', headline: 'Built to Avoid the Usual Problems', subheadline: 'No ad walls. No low-quality exports. No gimmicks — just clean results.', cta: 'Try now' },
  ],
} as const;

// =============================================================================
// META 12-AD LAUNCH SET - Ready for production
// =============================================================================

// Template A - Before/After Split (4 ads)
export const META_LAUNCH_BEFORE_AFTER = [
  {
    id: 'A1_PA',
    template: 'BeforeAfterSplit',
    overlayLine1: 'Watermark ruins it.',
    overlayLine2: 'Fix it fast.',
    badge: 'Ad-Free',
    headline: 'Remove Watermarks Fast',
    primaryText: 'That watermark is killing the clip. Upload → clean export → download.',
    cta: 'Upload Video',
  },
  {
    id: 'A2_PA',
    template: 'BeforeAfterSplit',
    overlayLine1: 'Posting today?',
    overlayLine2: 'Lose the watermark.',
    badge: 'HQ Output',
    headline: 'Ready to Post',
    primaryText: "Turn 'can't post this' into 'ready to publish'.",
    cta: 'Upload Video',
  },
  {
    id: 'A3_SA',
    template: 'BeforeAfterSplit',
    overlayLine1: 'Tried other sites?',
    overlayLine2: 'Stop getting blurry.',
    badge: 'Quality-First',
    headline: 'Built to Avoid the Usual',
    primaryText: 'If the usual tools ruin your export, try a premium workflow built for clean results.',
    cta: 'Try BlankLogo',
  },
  {
    id: 'A4_SA',
    template: 'BeforeAfterSplit',
    overlayLine1: "No 'HD' bait-and-switch.",
    overlayLine2: 'Quality preserved.',
    badge: 'No Re-Encode',
    headline: 'Quality Preserved',
    primaryText: 'Quality preserved. Audio intact. Clean export.',
    cta: 'Remove Watermark',
  },
] as const;

// Template B - Comparison Card (4 ads)
export const META_LAUNCH_COMPARISON = [
  {
    id: 'B1_SA',
    template: 'ComparisonCard',
    overlayHeader: 'Typical sites vs BlankLogo',
    leftBullets: ['Ads', 'Blur', 'Fake progress'],
    rightBullets: ['Ad-Free', 'Clean', 'Fast'],
    headline: 'Premium Utility',
    primaryText: 'Built to avoid the usual: ad walls, blurry exports, random failures.',
    cta: 'Get Started',
  },
  {
    id: 'B2_SA',
    template: 'ComparisonCard',
    overlayHeader: 'Typical sites vs BlankLogo',
    leftBullets: ['Wait timers', 'Popups', 'Sketchy'],
    rightBullets: ['Ad-free', 'Premium', 'Clean'],
    headline: 'Ad-Free Removal',
    primaryText: 'No popups. No nonsense. Just upload and go.',
    cta: 'Get Started',
  },
  {
    id: 'B3_PA',
    template: 'ComparisonCard',
    overlayHeader: 'Old way vs BlankLogo',
    leftBullets: ['Redo edit', 'Waste time', 'Frustration'],
    rightBullets: ['Quick fix', 'Minutes', 'Clean'],
    headline: 'Fast Fix',
    primaryText: "Don't re-edit everything. Clean export in minutes.",
    cta: 'Remove Watermark',
  },
  {
    id: 'B4_SA',
    template: 'ComparisonCard',
    overlayHeader: 'Sketchy sites vs BlankLogo',
    leftBullets: ['Random fails', 'No status', 'Unreliable'],
    rightBullets: ['Clear status', 'Done', 'Download'],
    headline: 'Reliable Workflow',
    primaryText: 'Clear status → done → download. Not a sketchy site.',
    cta: 'Upload Video',
  },
] as const;

// Template C - UI Proof / 3-Step Flow (4 ads)
export const META_LAUNCH_UI_FLOW = [
  {
    id: 'C1_PA',
    template: 'ThreeSteps',
    overlayLine1: 'Upload → Remove → Download',
    overlayLine2: 'Simple as that.',
    badge: 'Simple',
    headline: 'Works in Browser',
    primaryText: 'No installs. Just upload your video and get a clean version back.',
    cta: 'Upload Video',
  },
  {
    id: 'C2_PA',
    template: 'UIProof',
    overlayLine1: 'Processing…',
    overlayLine2: 'Done.',
    badge: 'Fast',
    headline: 'Remove Now',
    primaryText: 'When you need a clean clip today.',
    cta: 'Upload Video',
  },
  {
    id: 'C3_SA',
    template: 'UIProof',
    overlayLine1: 'Skip the ad spam.',
    overlayLine2: 'Premium experience.',
    badge: 'Ad-Free',
    headline: 'Ad-Free Premium',
    primaryText: 'Premium experience. No popups. No wait games.',
    cta: 'Get Started',
  },
  {
    id: 'C4_RT',
    template: 'ReceiptProof',
    overlayLine1: '10 free credits',
    overlayLine2: '(one-time)',
    badge: 'No Card',
    headline: 'Start Free',
    primaryText: 'Try it without a credit card. See if it earns a bookmark.',
    cta: 'Get Started Free',
  },
] as const;

// All 12 Meta Launch ads combined
export const META_LAUNCH_SET = [
  ...META_LAUNCH_BEFORE_AFTER,
  ...META_LAUNCH_COMPARISON,
  ...META_LAUNCH_UI_FLOW,
] as const;

// =============================================================================
// RETARGETING ADS (for site visitors who didn't convert)
// =============================================================================

export const RETARGETING_ADS = [
  {
    id: 'RT_01',
    template: 'ReceiptProof',
    overlayLine1: 'Job fails?',
    overlayLine2: 'Credit refunded.',
    badge: 'Low Risk',
    headline: 'Low Risk',
    primaryText: "If a job fails and can't be recovered, credits are returned automatically.",
    cta: 'Try Again',
  },
  {
    id: 'RT_02',
    template: 'UIProof',
    overlayLine1: '10 free credits',
    overlayLine2: '(one-time)',
    badge: 'No Card',
    headline: 'Start Free',
    primaryText: 'Try it without a card. Keep it if it works.',
    cta: 'Get Started Free',
  },
  {
    id: 'RT_03',
    template: 'ComparisonCard',
    overlayHeader: 'Pick the right mode',
    leftBullets: ['Edge watermark?', 'Use Crop', 'Fast'],
    rightBullets: ['Overlap?', 'Use Inpaint', 'AI fill'],
    headline: 'Pick the Right Mode',
    primaryText: 'Use the right mode for the clip. Get the clean export you wanted.',
    cta: 'Upload Video',
  },
  {
    id: 'RT_04',
    template: 'UIProof',
    overlayLine1: 'Sora • TikTok • Runway',
    overlayLine2: 'All supported.',
    badge: 'All Platforms',
    headline: 'Supported Platforms',
    primaryText: 'Built for the exports creators actually use.',
    cta: 'Remove Watermark',
  },
] as const;

// =============================================================================
// OVERLAY TEXT VARIATIONS (for Remotion batch rendering)
// =============================================================================

export const OVERLAY_VARIANTS = {
  problem_hooks: [
    { line1: 'Watermark ruins it.', line2: 'Fix it fast.' },
    { line1: "Don't repost with this.", line2: 'Remove the watermark.' },
    { line1: 'Client needs it today.', line2: 'Clean export, quick.' },
    { line1: 'That logo has to go.', line2: 'Get a clean clip.' },
    { line1: 'Stop re-editing everything.', line2: 'Just remove the mark.' },
    { line1: 'Your video is fire…', line2: "The watermark isn't." },
    { line1: 'Posting today?', line2: 'Lose the watermark.' },
    { line1: "Don't let this tank views.", line2: 'Clean it up.' },
    { line1: "Watermark = instant 'skip.'", line2: 'Fix it in minutes.' },
    { line1: 'Make it look original.', line2: 'Remove the watermark.' },
  ],
  solution_hooks: [
    { line1: 'Tried other sites?', line2: 'Stop getting blurry.' },
    { line1: 'Skip the ad spam.', line2: 'Premium removal.' },
    { line1: "No 'fake progress' BS.", line2: 'Real output.' },
    { line1: 'Most tools ruin quality.', line2: "We don't." },
    { line1: 'No new watermark.', line2: 'Just clean video.' },
    { line1: 'If it failed before…', line2: 'Try the clean option.' },
    { line1: 'Stop settling for smears.', line2: 'Cleaner removal.' },
    { line1: 'No installs. No plugins.', line2: 'Upload → Done.' },
    { line1: 'Built like a real tool.', line2: 'Not a sketchy site.' },
    { line1: 'The one you bookmark.', line2: 'Because it works.' },
  ],
  badges: ['Ad-Free', 'HQ Output', 'Premium', 'No Install', 'Simple', 'Fast', 'Quality-First', 'No Re-Encode', 'Reliable', 'No Card'],
  ctas: ['Upload Video', 'Remove Watermark', 'Try BlankLogo', 'Get Clean Export', 'Start Now', 'Get Started', 'Try Now', 'Remove Now'],
};

// =============================================================================
// Premium Video Ad Copy Matrix (12 ads)
// =============================================================================

export const VIDEO_AD_COPY = {
  // Problem-Aware (6 ads) - for people who just want to post/ship
  problemAware: [
    {
      id: 'PA-01',
      name: 'Post Today',
      badge: 'READY TO POST',
      headline: 'Remove the Watermark.',
      subheadline: 'Upload → Clean export → Download',
      cta: 'Get 10 Free Credits',
      underButtonText: '10 free credits (one-time) • No card',
      beforeSubLabel: 'Watermark present',
      afterSubLabel: 'Clean export',
      trustLine: 'Quality preserved • Fast workflow',
      footerText: 'Clean exports • Built for creators',
    },
    {
      id: 'PA-02',
      name: 'Fast Fix',
      badge: 'FAST WORKFLOW',
      headline: 'Clean Export in Minutes',
      subheadline: 'Upload → Remove watermark → Download',
      cta: 'Start Free',
      underButtonText: '10 free credits (one-time)',
      beforeSubLabel: 'Needs cleanup',
      afterSubLabel: 'Ready to post',
      trustLine: 'No waiting • No installs',
      footerText: 'Fast workflow • Quality preserved',
    },
    {
      id: 'PA-03',
      name: 'Creator Grade',
      badge: 'CREATOR-GRADE',
      headline: 'Clean Video.',
      subheadline: 'Watermark off. Quality kept.',
      cta: 'Get 10 Free Credits',
      underButtonText: 'One-time • No card',
      beforeSubLabel: 'Not postable',
      afterSubLabel: 'Creator-ready',
      trustLine: 'Quality preserved • Clean output',
      footerText: 'Built for creators',
    },
    {
      id: 'PA-04',
      name: 'Client Ready',
      badge: 'CLIENT-READY',
      headline: 'Make It Deliverable',
      subheadline: 'Remove watermark → send the clip',
      cta: 'Get 10 Free Credits',
      underButtonText: '10 free credits (one-time)',
      beforeSubLabel: 'Not deliverable',
      afterSubLabel: 'Client-ready',
      trustLine: 'Professional output • Fast',
      footerText: 'Deliverable quality • No hassle',
    },
    {
      id: 'PA-05',
      name: 'No Installs',
      badge: 'IN-BROWSER',
      headline: 'No Installs.',
      subheadline: 'Upload → Done → Download',
      cta: 'Start Free',
      underButtonText: '10 free credits (one-time) • No card',
      beforeSubLabel: 'Watermark on',
      afterSubLabel: 'Clean export',
      trustLine: 'Works in browser • No plugins',
      footerText: 'No installs • No plugins • Just upload',
    },
    {
      id: 'PA-06',
      name: 'Quick Cleanup',
      badge: 'CLEANUP TOOL',
      headline: 'Delete the Watermark',
      subheadline: 'Simple workflow. Clean export.',
      cta: 'Get 10 Free Credits',
      underButtonText: 'One-time • No card',
      beforeSubLabel: 'Watermark visible',
      afterSubLabel: 'Cleaned up',
      trustLine: 'Simple • Fast • Clean',
      footerText: 'Quick cleanup • Quality output',
    },
  ],
  // Solution-Aware (6 ads) - for people who already tried tools
  solutionAware: [
    {
      id: 'SA-01',
      name: 'Distraction Free',
      badge: 'DISTRACTION-FREE',
      headline: 'A Clean Export Tool',
      subheadline: 'No popups. No wait games.',
      cta: 'Get 10 Free Credits',
      underButtonText: '10 free credits (one-time) • No card',
      beforeSubLabel: "Can't use this",
      afterSubLabel: 'Ready to use',
      trustLine: 'No distractions • Just results',
      footerText: 'Clean workflow • Quality preserved',
    },
    {
      id: 'SA-02',
      name: 'Quality First',
      badge: 'QUALITY-FIRST',
      headline: 'Stop Settling for Blur',
      subheadline: 'Clean export that stays crisp',
      cta: 'Start Free',
      underButtonText: '10 free credits (one-time)',
      beforeSubLabel: 'Blurry elsewhere',
      afterSubLabel: 'Crisp export',
      trustLine: 'Quality preserved • No blur',
      footerText: 'Quality-first • Built different',
    },
    {
      id: 'SA-03',
      name: 'Pro Tool',
      badge: 'PRO TOOL',
      headline: 'Built Like a Real Service',
      subheadline: 'Predictable output. Clean workflow.',
      cta: 'Get 10 Free Credits',
      underButtonText: 'One-time • No card',
      beforeSubLabel: 'Unpredictable',
      afterSubLabel: 'Reliable output',
      trustLine: 'Professional grade • Predictable',
      footerText: 'Pro tool • Real results',
    },
    {
      id: 'SA-04',
      name: 'No Ad Walls',
      badge: 'NO AD WALLS',
      headline: 'Skip the Spam',
      subheadline: 'Upload → remove → download',
      cta: 'Start Free (10 Credits)',
      underButtonText: 'One-time • No card',
      beforeSubLabel: 'Stuck in spam',
      afterSubLabel: 'Clean download',
      trustLine: 'No ads • No popups • No nonsense',
      footerText: 'Skip the spam • Get clean exports',
    },
    {
      id: 'SA-05',
      name: 'Not Sketchy',
      badge: 'TRUSTED WORKFLOW',
      headline: 'Not a Sketchy Site',
      subheadline: 'Clear status → clean export',
      cta: 'Get 10 Free Credits',
      underButtonText: '10 free credits (one-time)',
      beforeSubLabel: 'Sketchy tools fail',
      afterSubLabel: 'Trusted result',
      trustLine: 'Transparent • Reliable • Clean',
      footerText: 'Trusted workflow • Real results',
    },
    {
      id: 'SA-06',
      name: 'Bookmark',
      badge: 'STUDIO MODE',
      headline: 'The One You Bookmark',
      subheadline: 'Clean exports when it matters',
      cta: 'Start Free',
      underButtonText: '10 free credits (one-time) • No card',
      beforeSubLabel: 'Still searching',
      afterSubLabel: 'Found it',
      trustLine: 'Bookmark-worthy • Reliable',
      footerText: 'The one you bookmark',
    },
  ],
} as const;

// Video pairs for ad variations
export const VIDEO_PAIRS = [
  {
    id: 'video1',
    name: 'Video 1',
    beforeSrc: 'blanklogo/video1-before-web.mp4',
    afterSrc: 'blanklogo/video1-after-web.mp4',
  },
  {
    id: 'video2',
    name: 'Video 2',
    beforeSrc: 'blanklogo/video2-before-web.mp4',
    afterSrc: 'blanklogo/video2-after-web.mp4',
  },
  {
    id: 'video3',
    name: 'Video 3',
    beforeSrc: 'blanklogo/video3-before-web.mp4',
    afterSrc: 'blanklogo/video3-after-web.mp4',
  },
  {
    id: 'video4',
    name: 'Video 4',
    beforeSrc: 'blanklogo/video4-before-web.mp4',
    afterSrc: 'blanklogo/video4-after-web.mp4',
  },
  {
    id: 'video5',
    name: 'Video 5',
    beforeSrc: 'blanklogo/video5-before-web.mp4',
    afterSrc: 'blanklogo/video5-after-web.mp4',
  },
  {
    id: 'video6',
    name: 'Video 6',
    beforeSrc: 'blanklogo/video6-before-web.mp4',
    afterSrc: 'blanklogo/video6-after-web.mp4',
  },
  {
    id: 'video7',
    name: 'Video 7',
    beforeSrc: 'blanklogo/video7-before-web.mp4',
    afterSrc: 'blanklogo/video7-after-web.mp4',
  },
  {
    id: 'video8',
    name: 'Video 8',
    beforeSrc: 'blanklogo/video8-before-web.mp4',
    afterSrc: 'blanklogo/video8-after-web.mp4',
  },
] as const;
