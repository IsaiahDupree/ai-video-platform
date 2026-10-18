// EverReach App Store Copy Angles
// Each angle targets a distinct belief cluster / audience segment.
// Used by EverReachAppStoreScreens.tsx via angleKey prop.

export type AngleKey = 'busy' | 'revenue' | 'authentic' | 'friendship' | 'founder' | 'drift' | 'memory' | 'unghost';

export interface CopyAngle {
  key: AngleKey;
  label: string;
  audience: string;
  belief: string;

  // Screen 1 — Hero
  s1Headline: string;
  s1Sub: string;
  s1Badge: string;
  s1Cta: string;
  s1Proof: string;

  // Screen 2 — Who
  s2Badge: string;
  s2Headline: string;
  s2CalloutText: string;
  s2FooterText: string;

  // Screen 3 — What
  s3Badge: string;
  s3Headline: string;
  s3Before: string;
  s3After: string;
  s3AfterNote: string;
  s3CalloutText: string;
  s3FooterText: string;

  // Screen 4 — When
  s4Badge: string;
  s4Headline: string;
  s4NotifTitle: string;
  s4NotifBody: string;
  s4Checks: string[];
  s4FooterText: string;

  // Screen 5 — Trust
  s5Stars: string;
  s5Rating: string;
  s5RatingNote: string;
  s5Headline: string;
  s5Stats: Array<{ number: string; label: string }>;
  s5Quotes: Array<{ text: string; author: string; role: string }>;
  s5Cta: string;
  s5Footer: string;
}

export const COPY_ANGLES: Record<AngleKey, CopyAngle> = {

  // ── ANGLE 1: BUSY ─────────────────────────────────────────────────────────
  // Target: ambitious 25-40 year olds who care but keep forgetting to reach out
  busy: {
    key: 'busy',
    label: 'Busy',
    audience: 'Ambitious professionals who value relationships but forget',
    belief: 'too_busy',

    s1Headline: 'Never lose touch\nwith the people\nwho matter.',
    s1Sub: 'AI tells you who to reach out to, what to say, and when — so relationships never go cold.',
    s1Badge: 'FREE TO START',
    s1Cta: 'Download EverReach',
    s1Proof: '⭐⭐⭐⭐⭐  Loved by people who care about relationships',

    s2Badge: 'WHO TO REACH',
    s2Headline: 'See who needs\nyour attention\ntoday.',
    s2CalloutText: 'Warmth score tells you\nwho\'s fading before\nit gets awkward.',
    s2FooterText: 'Your daily "who matters today" list — always ready.',

    s3Badge: 'WHAT TO SAY',
    s3Headline: 'AI drafts the\nperfect opener.\nYou just send it.',
    s3Before: 'staring at blank message...',
    s3After: '"Hey! Saw your post about the launch — huge congrats! 🎉"',
    s3AfterNote: 'Sent in 60 seconds ✓',
    s3CalloutText: 'You edit before\nyou send. Always.',
    s3FooterText: 'Context-aware drafts based on your last conversation.',

    s4Badge: 'WHEN TO REACH',
    s4Headline: 'Nudged at the\nright moment.\nNot spammed.',
    s4NotifTitle: 'EverReach',
    s4NotifBody: 'Marcus is going cold. Last touch 3 weeks ago.',
    s4Checks: ['One reminder at a time', 'You decide the cadence', 'No annoying daily pings'],
    s4FooterText: 'Thoughtful reminders — not notification spam.',

    s5Stars: '⭐⭐⭐⭐⭐',
    s5Rating: 'Loved by early users',
    s5RatingNote: 'Growing fast — join now',
    s5Headline: 'The CRM that\nactually feels\nhuman.',
    s5Stats: [
      { number: '60s', label: 'from nudge to sent message' },
      { number: '0', label: 'auto-sends — ever' },
      { number: '3min', label: 'daily routine, 100s of relationships' },
    ],
    s5Quotes: [
      { text: 'I reconnected with a client I\'d been meaning to reach out to for months. Closed a deal within a week.', author: 'Alex R.', role: 'Founder, early access user' },
      { text: 'Finally stopped losing touch with mentors and friends who actually matter.', author: 'Jamie L.', role: 'Product Manager, early access' },
    ],
    s5Cta: 'Start Free — No Credit Card',
    s5Footer: 'everreach.app · Available on iPhone & iPad',
  },

  // ── ANGLE 2: REVENUE ──────────────────────────────────────────────────────
  // Target: founders, sales, biz dev — relationships = pipeline
  revenue: {
    key: 'revenue',
    label: 'Revenue',
    audience: 'Founders, sales, biz dev — network drives revenue',
    belief: 'revenue_loss',

    s1Headline: 'Your network is\nleaving money\non the table.',
    s1Sub: 'Reconnecting with one warm contact at the right moment is the highest-ROI action in business.',
    s1Badge: 'FREE TO START',
    s1Cta: 'Stop Leaving Deals on the Table',
    s1Proof: '⭐⭐⭐⭐⭐  Loved by founders & operators',

    s2Badge: 'WHO TO CONTACT',
    s2Headline: 'See which\nrelationships are\ngoing cold.',
    s2CalloutText: 'Warmth score shows\nwho needs a touchpoint\nbefore the deal goes quiet.',
    s2FooterText: 'Your network ranked by relationship health — daily.',

    s3Badge: 'WHAT TO SAY',
    s3Headline: 'Sound human,\nnot like a\nsales script.',
    s3Before: '"Just checking in..." (ignored)',
    s3After: '"Saw Acme hit Series B — congrats! Would love to catch up if you\'re open."',
    s3AfterNote: 'Reply rate 4× higher ✓',
    s3CalloutText: 'Context-aware.\nNever generic.\nAlways on-brand.',
    s3FooterText: 'Every draft pulls from email, calendar, and LinkedIn context.',

    s4Badge: 'PERFECT TIMING',
    s4Headline: 'Reach out before\nthe opportunity\npasses.',
    s4NotifTitle: 'EverReach',
    s4NotifBody: 'Sarah just got promoted. Perfect time to reconnect.',
    s4Checks: ['Triggered by life events', 'Job changes & news mentions', 'Quarterly cadence built-in'],
    s4FooterText: 'Never miss a window — EverReach monitors for you.',

    s5Stars: '⭐⭐⭐⭐⭐',
    s5Rating: 'Built for founders',
    s5RatingNote: 'Early access — growing fast',
    s5Headline: 'Relationships\nare the pipeline.',
    s5Stats: [
      { number: '60s', label: 'to send a personalized message' },
      { number: '0', label: 'auto-sends — you always approve' },
      { number: '3min', label: 'daily routine to stay warm' },
    ],
    s5Quotes: [
      { text: 'I reconnected with a warm contact and closed a deal within the week. This thing works.', author: 'Ryan M.', role: 'B2B SaaS Founder, early access' },
      { text: 'Replaced my manual spreadsheet CRM. My reply rates are noticeably better.', author: 'Dana K.', role: 'Head of Partnerships, early access' },
    ],
    s5Cta: 'Start Free — Activate Your Network',
    s5Footer: 'everreach.app · iPhone & iPad',
  },

  // ── ANGLE 3: AUTHENTIC ────────────────────────────────────────────────────
  // Target: people who avoid reaching out because it "feels cringe" or salesy
  authentic: {
    key: 'authentic',
    label: 'Authentic',
    audience: 'People who want to reach out but feel cringe or awkward doing it',
    belief: 'feels_cringe',

    s1Headline: 'Reach out without\nfeeling like\nyou\'re using them.',
    s1Sub: 'Messages that sound exactly like you — not a template, not a bot, not cringe.',
    s1Badge: 'FREE TO START',
    s1Cta: 'Reach Out Without the Awkward',
    s1Proof: '⭐⭐⭐⭐⭐  "Never felt cringe sending a message" — early access users',

    s2Badge: 'THE RIGHT PEOPLE',
    s2Headline: 'People you\ngenuinely want\nto reconnect with.',
    s2CalloutText: 'Not a sales pipeline.\nJust the people\nyou actually miss.',
    s2FooterText: 'Add friends, mentors, family — not just contacts.',

    s3Badge: 'YOUR VOICE',
    s3Headline: 'Sounds like you.\nFeels like you.\nBecause it is you.',
    s3Before: '"Just touching base..." 😬',
    s3After: '"Still thinking about that conversation we had at the conference — hope the launch went well!"',
    s3AfterNote: 'You wrote it (with help) ✓',
    s3CalloutText: 'Every draft is\neditable. Your words,\nyour style.',
    s3FooterText: 'AI suggests — you decide. Zero auto-sends. Ever.',

    s4Badge: 'RIGHT MOMENT',
    s4Headline: 'When reaching\nout actually\nmakes sense.',
    s4NotifTitle: 'EverReach',
    s4NotifBody: 'Haven\'t heard from Jordan in a while — they might appreciate a message.',
    s4Checks: ['Only when timing feels natural', 'Never interrupt with spam', 'You approve every outreach'],
    s4FooterText: 'Gentle nudges, not pressure.',

    s5Stars: '⭐⭐⭐⭐⭐',
    s5Rating: 'Real messages. Real replies.',
    s5RatingNote: 'Early access — join now',
    s5Headline: 'Authentic beats\npolished. Every time.',
    s5Stats: [
      { number: '60s', label: 'from nudge to sent message' },
      { number: '0', label: 'auto-sends — ever' },
      { number: '100%', label: 'you review before sending' },
    ],
    s5Quotes: [
      { text: 'For the first time I actually look forward to reaching out. It doesn\'t feel forced at all.', author: 'Priya S.', role: 'Designer & Freelancer, early access' },
      { text: 'My messages feel so much more thoughtful. The AI helps but my voice comes through.', author: 'Chris W.', role: 'Marketing Director, early access' },
    ],
    s5Cta: 'Start Free — Be Real, Not Robotic',
    s5Footer: 'everreach.app · Available on iPhone & iPad',
  },

  // ── ANGLE 4: FRIENDSHIP ───────────────────────────────────────────────────
  // Target: unaware — emotional hook about friendships fading silently
  friendship: {
    key: 'friendship',
    label: 'Friendship',
    audience: 'Anyone who\'s let friendships drift and regrets it',
    belief: 'unaware',

    s1Headline: 'The friends fading\nfrom your life\naren\'t gone yet.',
    s1Sub: 'They\'re just waiting for you to reach out. EverReach makes it a 60-second daily habit.',
    s1Badge: 'FREE TO START',
    s1Cta: 'Reconnect With Someone Today',
    s1Proof: '⭐⭐⭐⭐⭐  People reconnecting every day',

    s2Badge: 'WHO TO RECONNECT',
    s2Headline: 'Old friends.\nMentors. Family.\nAll in one place.',
    s2CalloutText: 'Warmth score shows\nwho you haven\'t\nreached in too long.',
    s2FooterText: 'A gentle reminder before the drift becomes permanent.',

    s3Badge: 'BREAK THE ICE',
    s3Headline: 'A message that\ndoesn\'t feel\nawkward after years.',
    s3Before: '"It\'s been so long I don\'t know how to start..." 😶',
    s3After: '"Been thinking about our road trip — one of my favorite memories. Hope life\'s been treating you well!"',
    s3AfterNote: 'They replied in 4 minutes ✓',
    s3CalloutText: 'Context from your\nlast memories\ntogether.',
    s3FooterText: 'Break the ice without the awkward silence.',

    s4Badge: 'GENTLE REMINDERS',
    s4Headline: 'Before the drift\nbecomes\npermanent.',
    s4NotifTitle: 'EverReach',
    s4NotifBody: 'You haven\'t spoken to Emma in 6 weeks. She might love to hear from you.',
    s4Checks: ['Reminds you before it\'s too late', 'No pressure — you choose when', 'Celebrate their milestones'],
    s4FooterText: 'The nudge you needed to reach out.',

    s5Stars: '⭐⭐⭐⭐⭐',
    s5Rating: 'Reconnections happen daily',
    s5RatingNote: 'Early access — growing fast',
    s5Headline: 'The friendships\nyou almost let\ngo cold.',
    s5Stats: [
      { number: '60s', label: 'to send a message that matters' },
      { number: '0', label: 'auto-sends — you always choose' },
      { number: '3min', label: 'daily habit to stay connected' },
    ],
    s5Quotes: [
      { text: 'I reconnected with my college best friend after years of silence. Just needed the right nudge.', author: 'Maria T.', role: 'Teacher & Mom, early access' },
      { text: 'I reached out to my dad more in one month than the entire year before. This app changed that.', author: 'James K.', role: 'Software Engineer, early access' },
    ],
    s5Cta: 'Reconnect With Someone — Free',
    s5Footer: 'everreach.app · Available on iPhone & iPad',
  },

  // ── ANGLE 6: DRIFT ────────────────────────────────────────────────────────
  // Target: broad 25-45 — #1 Meta ad concept (8.47% CTR, $0.11 CPC). Pure emotional truth, unaware stage.
  drift: {
    key: 'drift',
    label: 'Drift',
    audience: 'Anyone who has let friendships quietly fade — broad 25-45',
    belief: 'unaware_drift',

    s1Headline: 'Most friendships\ndon\'t end.\nThey drift.',
    s1Sub: 'You care. You just got busy. EverReach helps you make the next message feel normal again.',
    s1Badge: 'FREE TO START',
    s1Cta: 'Stop the Drift',
    s1Proof: '⭐⭐⭐⭐⭐  People reconnecting every day',

    s2Badge: 'WHO TO REACH',
    s2Headline: 'See who\'s\nslipping before\nyou lose them.',
    s2CalloutText: 'Warmth score shows\nwho needs a message\nbefore it gets awkward.',
    s2FooterText: 'A gentle list of who matters — updated every day.',

    s3Badge: 'BREAK THE ICE',
    s3Headline: 'The message\nthat makes the\nnext one normal.',
    s3Before: '"It\'s been so long I don\'t know how to start..." 😶',
    s3After: '"Been thinking about our road trip — one of my favorite memories."',
    s3AfterNote: 'They replied in minutes ✓',
    s3CalloutText: 'Context from your\nlast real moments\ntogether.',
    s3FooterText: 'AI finds the warmth — you send the message.',

    s4Badge: 'GENTLE NUDGE',
    s4Headline: 'Before the gap\nbecomes\npermanent.',
    s4NotifTitle: 'EverReach',
    s4NotifBody: 'You haven\'t spoken to Emma in 6 weeks. She might love to hear from you.',
    s4Checks: ['Nudged before it gets awkward', 'You choose if and when', 'No pressure, just a reminder'],
    s4FooterText: 'The nudge you needed to finally reach out.',

    s5Stars: '⭐⭐⭐⭐⭐',
    s5Rating: 'Reconnections happen daily',
    s5RatingNote: 'Early access — join now',
    s5Headline: 'The friendships\nyou almost let\ngo cold.',
    s5Stats: [
      { number: '60s', label: 'to send a message that matters' },
      { number: '0', label: 'auto-sends ever' },
      { number: '3min', label: 'daily habit' },
    ],
    s5Quotes: [
      { text: 'I reconnected with my college best friend after two years of silence. Needed the nudge.', author: 'Maria T.', role: 'Teacher & Mom, early access' },
      { text: 'Reached out to my dad more last month than the whole year before. This changed that.', author: 'James K.', role: 'Software Engineer, early access' },
    ],
    s5Cta: 'Reconnect With Someone — Free',
    s5Footer: 'everreach.app · iPhone & iPad',
  },

  // ── ANGLE 7: MEMORY ───────────────────────────────────────────────────────
  // Target: problem-aware. Self-absolution angle. "You are not a bad friend, you are just doing friendship from memory."
  memory: {
    key: 'memory',
    label: 'Memory',
    audience: 'People who feel guilt about losing touch but are already trying',
    belief: 'problem_aware_memory',

    s1Headline: 'You\'re not a\nbad friend. You\'re\ndoing it from memory.',
    s1Sub: 'Memory fails when life gets loud. EverReach gives you a system — so caring becomes a rhythm.',
    s1Badge: 'FREE TO START',
    s1Cta: 'Get a System That Cares',
    s1Proof: '⭐⭐⭐⭐⭐  Loved by people who are already trying',

    s2Badge: 'WHO NEEDS YOU',
    s2Headline: 'Stop guessing\nwho to check in\non today.',
    s2CalloutText: 'Warmth score replaces\nguesswork with a\nclear daily list.',
    s2FooterText: 'Your memory shouldn\'t be the only system you have.',

    s3Badge: 'WHAT TO SAY',
    s3Headline: 'No more blank\npage. No more\noverthinking.',
    s3Before: '"I should reach out... but what do I even say?" (didn\'t send)',
    s3After: '"Hey — saw your post and thought of you. How\'s it going?"',
    s3AfterNote: 'Sent. Done. ✓',
    s3CalloutText: 'AI starts it.\nYou make it yours.\nAlways.',
    s3FooterText: 'The starting line you never had.',

    s4Badge: 'THE RHYTHM',
    s4Headline: 'A tiny habit\nthat replaces\na failing system.',
    s4NotifTitle: 'EverReach',
    s4NotifBody: 'Three people to check in on today. Takes 3 minutes.',
    s4Checks: ['One nudge at a time', 'You set the pace', 'Consistency over intensity'],
    s4FooterText: 'Tiny repeats beat big catch-ups. Always.',

    s5Stars: '⭐⭐⭐⭐⭐',
    s5Rating: 'For people who already care',
    s5RatingNote: 'Early access — growing fast',
    s5Headline: 'The system\nyour memory\ncould never be.',
    s5Stats: [
      { number: '60s', label: 'from nudge to sent' },
      { number: '0', label: 'auto-sends' },
      { number: '3min', label: 'a day, every relationship' },
    ],
    s5Quotes: [
      { text: 'I stopped feeling like a bad friend the week I started using this. I\'m not — I just needed a system.', author: 'Priya S.', role: 'Designer, early access' },
      { text: 'The guilt of forgetting used to pile up. Now it just doesn\'t happen.', author: 'Marcus B.', role: 'Consultant, early access' },
    ],
    s5Cta: 'Build the Habit — Free',
    s5Footer: 'everreach.app · iPhone & iPad',
  },

  // ── ANGLE 8: UNGHOST ──────────────────────────────────────────────────────
  // Target: solution-aware. For the person who wants to re-initiate after years of silence.
  unghost: {
    key: 'unghost',
    label: 'Unghost',
    audience: 'People actively wanting to reconnect after long gaps',
    belief: 'solution_aware_unghost',

    s1Headline: 'The message\nthat ends years\nof silence.',
    s1Sub: 'You\'ve been meaning to reach out. EverReach writes the opener — you just hit send.',
    s1Badge: 'FREE TO START',
    s1Cta: 'Reach Out Today',
    s1Proof: '⭐⭐⭐⭐⭐  Real reconnections, every day',

    s2Badge: 'WHO TO UNGHOST',
    s2Headline: 'The people you\'ve\nbeen meaning\nto reach out to.',
    s2CalloutText: 'Sorted by how long\nit\'s been. Longest\nsilences surface first.',
    s2FooterText: 'Your personal list of relationships worth reviving.',

    s3Badge: 'HOW TO START',
    s3Headline: 'A message that\ndoesn\'t feel weird\nafter years.',
    s3Before: '"It\'s been literally years. This is going to be so awkward." (never sent)',
    s3After: '"Been thinking about that time we — still one of my favorite memories. Hope you\'re well."',
    s3AfterNote: 'They replied the same day ✓',
    s3CalloutText: 'Not a template.\nBuilt from your\nactual history.',
    s3FooterText: 'The AI finds the warmth — you bring the relationship.',

    s4Badge: 'THE RIGHT MOMENT',
    s4Headline: 'It\'s never too\nlate to send\none message.',
    s4NotifTitle: 'EverReach',
    s4NotifBody: 'Alex has been on your mind. Here\'s how to start.',
    s4Checks: ['Surfaces long-silent contacts', 'Finds a natural hook', 'You approve before anything sends'],
    s4FooterText: 'The nudge you\'ve been waiting for.',

    s5Stars: '⭐⭐⭐⭐⭐',
    s5Rating: 'Real reconnections daily',
    s5RatingNote: 'Early access — join now',
    s5Headline: 'It starts with\none message.\nEverReach writes it.',
    s5Stats: [
      { number: '60s', label: 'to draft the first message' },
      { number: '0', label: 'auto-sends — you approve' },
      { number: '100%', label: 'of messages reviewed by you' },
    ],
    s5Quotes: [
      { text: 'I reached out to someone I hadn\'t spoken to in 4 years. We grabbed coffee last week.', author: 'Dana K.', role: 'Head of Partnerships, early access' },
      { text: 'Finally stopped saying "I should reach out" and actually did it. Every single time.', author: 'Ryan M.', role: 'Founder, early access' },
    ],
    s5Cta: 'Start Free — Send One Message Today',
    s5Footer: 'everreach.app · iPhone & iPad',
  },

  // ── ANGLE 5: FOUNDER ──────────────────────────────────────────────────────
  // Target: founders, operators — relationships as competitive advantage
  founder: {
    key: 'founder',
    label: 'Founder',
    audience: 'Startup founders & operators — relationships as competitive moat',
    belief: 'revenue_loss',

    s1Headline: 'Your network\nis your\npipeline.',
    s1Sub: 'Founders who consistently close deals, hire great people, and raise fast — they never stop nurturing relationships.',
    s1Badge: 'BUILT FOR FOUNDERS',
    s1Cta: 'Activate Your Network',
    s1Proof: '⭐⭐⭐⭐⭐  Loved by startup founders',

    s2Badge: 'WHO MATTERS NOW',
    s2Headline: 'Investors. Clients.\nHires. Advisors.\nAll ranked.',
    s2CalloutText: 'Warmth score shows\nwho to prioritize\nthis week.',
    s2FooterText: 'Relationship health across your entire professional network.',

    s3Badge: 'THE RIGHT MESSAGE',
    s3Headline: 'Context-driven\ndrafts. Not\ntemplate spam.',
    s3Before: '"Hope all is well!" (deleted unsent)',
    s3After: '"Congrats on the TechCrunch feature — that hiring insight was spot-on. Would love to connect at SaaStr."',
    s3AfterNote: 'Got a meeting booked ✓',
    s3CalloutText: 'Pulls from LinkedIn,\nemail & calendar.\nYou approve.',
    s3FooterText: 'Every message feels researched — because it is.',

    s4Badge: 'ALWAYS ON TIME',
    s4Headline: 'Reach out when\nit matters most\nfor the deal.',
    s4NotifTitle: 'EverReach',
    s4NotifBody: 'David just closed his Series A. Perfect moment to reconnect.',
    s4Checks: ['Tracks job changes & news', 'Fundraising & launch triggers', 'Quarterly relationship reviews'],
    s4FooterText: 'Never miss a strategic moment to reach out.',

    s5Stars: '⭐⭐⭐⭐⭐',
    s5Rating: 'Built for founders',
    s5RatingNote: 'Early access — get in now',
    s5Headline: 'The unfair\nadvantage in\nevery room.',
    s5Stats: [
      { number: '60s', label: 'to send a warm, personal message' },
      { number: '0', label: 'auto-sends — you control every touchpoint' },
      { number: '3min', label: 'a day keeps your network warm' },
    ],
    s5Quotes: [
      { text: 'My last hire came from a relationship I almost let go cold. EverReach reminded me at the right moment.', author: 'Tariq H.', role: 'CEO, early access founder' },
      { text: 'Every major deal starts with a warm reconnect. This makes that systematic without feeling robotic.', author: 'Leila N.', role: 'Founding AE, early access' },
    ],
    s5Cta: 'Start Free — Outperform Your Network',
    s5Footer: 'everreach.app · iPhone & iPad',
  },
};

export const ANGLE_KEYS: AngleKey[] = ['busy', 'revenue', 'authentic', 'friendship', 'founder', 'drift', 'memory', 'unghost'];
