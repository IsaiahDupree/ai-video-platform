#!/usr/bin/env npx tsx
/**
 * EverReach Meta Ad Package — One command renders everything
 *
 * Produces:
 *   - Static PNGs (20 angles × 4 sizes × 2 types = up to 160 stills)
 *   - Reel MP4s (key angles × story/post = video ads)
 *   - meta-bulk-upload.csv — drag into Meta Ads Manager
 *   - utm-tracking.csv — full UTM mapping per variant
 *   - campaign-structure.json — TOF/MOF/BOF ad set structure
 *   - manifest.json — everything generated
 *
 * Usage:
 *   npx tsx scripts/render-everreach-package.ts
 *   npx tsx scripts/render-everreach-package.ts --campaign everreach_q1_2026
 *   npx tsx scripts/render-everreach-package.ts --statics-only
 *   npx tsx scripts/render-everreach-package.ts --reels-only
 *   npx tsx scripts/render-everreach-package.ts --angles UA_TIMING_01,PA_SYSTEM_05
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  PHASE_A_ANGLES,
  ANGLE_SCREENSHOT_MAP,
  type AdAngle,
} from '../src/compositions/everreach/angles';
import { buildUtmParams } from '../src/compositions/everreach/utm-builder';

// =============================================================================
// Config
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');

interface MetaSize {
  id: string;
  width: number;
  height: number;
  label: string;
  platform: string;
}

const STATIC_SIZES: MetaSize[] = [
  { id: 'post',      width: 1080, height: 1080, label: 'Instagram Post (1:1)',     platform: 'instagram' },
  { id: 'portrait',  width: 1080, height: 1350, label: 'Instagram Portrait (4:5)', platform: 'instagram' },
  { id: 'story',     width: 1080, height: 1920, label: 'Instagram Story (9:16)',   platform: 'instagram' },
  { id: 'facebook',  width: 1200, height: 630,  label: 'Facebook Post (1.91:1)',   platform: 'facebook' },
];

const REEL_SIZES: MetaSize[] = [
  { id: 'reel_story',    width: 1080, height: 1920, label: 'Reel Story (9:16)',     platform: 'instagram' },
  { id: 'reel_post',     width: 1080, height: 1080, label: 'Reel Post (1:1)',       platform: 'instagram' },
];

// Awareness → duration mapping per the creative framework
const AWARENESS_DURATION: Record<string, 15 | 20 | 25 | 30> = {
  unaware: 15,
  problem_aware: 20,
  solution_aware: 25,
  product_aware: 30,
  most_aware: 30,
};

// Awareness → funnel stage
const AWARENESS_FUNNEL: Record<string, string> = {
  unaware: 'TOF',
  problem_aware: 'TOF',
  solution_aware: 'MOF',
  product_aware: 'MOF',
  most_aware: 'BOF',
};

// Reel beat scripts per awareness stage (from the creative framework)
const AWARENESS_REEL_SCRIPTS: Record<string, {
  hookText: string;
  mirrorText: string;
  enemyText: string;
  mechanismText: string;
  proofScreenshots: string[];
}> = {
  unaware: {
    hookText: 'most friendships don\'t end — they drift',
    mirrorText: 'you care. you just get busy. and time disappears.',
    enemyText: 'the goal isn\'t to catch up — it\'s to make the next message normal again.',
    mechanismText: 'that takes a rhythm, not motivation.',
    proofScreenshots: [
      'everreach/screenshots/01-contacts-list.png',
      'everreach/screenshots/05-warmth-score.png',
    ],
  },
  problem_aware: {
    hookText: 'the longer you wait, the more awkward it feels',
    mirrorText: 'then you overthink. then you send nothing.',
    enemyText: 'and months turn into distance.',
    mechanismText: 'a tiny check-in rhythm, plus message starters',
    proofScreenshots: [
      'everreach/screenshots/05-warmth-score.png',
      'everreach/screenshots/06-goal-compose.png',
    ],
  },
  solution_aware: {
    hookText: 'stop doing relationships from memory',
    mirrorText: 'memory fails when life gets loud.',
    enemyText: 'reminders aren\'t enough — they don\'t tell you what to say.',
    mechanismText: 'top people list, weekly rotation, and message starters',
    proofScreenshots: [
      'everreach/screenshots/01-contacts-list.png',
      'everreach/screenshots/05-warmth-score.png',
      'everreach/screenshots/06-goal-compose.png',
    ],
  },
  product_aware: {
    hookText: 'if you want to stay close without overthinking — this is the tool',
    mirrorText: 'feature one — top people list and warmth score',
    enemyText: 'feature two — last touch and gentle reminders',
    mechanismText: 'feature three — message starters when your brain is blank',
    proofScreenshots: [
      'everreach/screenshots/01-contacts-list.png',
      'everreach/screenshots/05-warmth-score.png',
      'everreach/screenshots/06-goal-compose.png',
      'everreach/screenshots/02-contact-detail.png',
    ],
  },
  most_aware: {
    hookText: 'this is not spammy — it\'s a reminder to be human',
    mirrorText: 'you choose your circle and how often you want to check in.',
    enemyText: 'it gives you starters so it never feels awkward.',
    mechanismText: 'cancel anytime, no pressure.',
    proofScreenshots: [
      'everreach/screenshots/06-goal-compose.png',
      'everreach/screenshots/subscription.png',
      'everreach/screenshots/08-settings.png',
    ],
  },
};

// =============================================================================
// CLI Args
// =============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    campaign: 'everreach_ads',
    angles: [] as string[],
    staticsOnly: false,
    reelsOnly: false,
    screenshotOnly: false,
    outputDir: '',
    baseUrl: 'https://apps.apple.com/app/everreach/id6738029498',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--campaign' && args[i + 1]) opts.campaign = args[++i];
    else if (args[i] === '--angles' && args[i + 1]) opts.angles = args[++i].split(',');
    else if (args[i] === '--statics-only') opts.staticsOnly = true;
    else if (args[i] === '--reels-only') opts.reelsOnly = true;
    else if (args[i] === '--screenshot-only') opts.screenshotOnly = true;
    else if (args[i] === '--output' && args[i + 1]) opts.outputDir = args[++i];
    else if (args[i] === '--base-url' && args[i + 1]) opts.baseUrl = args[++i];
  }

  if (!opts.outputDir) {
    opts.outputDir = path.join(PROJECT_ROOT, 'output', `everreach-package-${Date.now()}`);
  }

  return opts;
}

// =============================================================================
// Render Helpers
// =============================================================================

function renderStill(
  compositionId: string,
  outputPath: string,
  width: number,
  height: number,
  props: Record<string, unknown>
): boolean {
  const propsFile = outputPath.replace(/\.(png|mp4)$/, '_props.json');
  fs.writeFileSync(propsFile, JSON.stringify(props));

  try {
    execSync(
      `npx remotion still "${compositionId}" "${outputPath}" --props="${propsFile}" --width=${width} --height=${height}`,
      { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: 60000 }
    );
    if (fs.existsSync(propsFile)) fs.unlinkSync(propsFile);
    return true;
  } catch (e: any) {
    if (fs.existsSync(propsFile)) fs.unlinkSync(propsFile);
    return false;
  }
}

function renderVideo(
  compositionId: string,
  outputPath: string,
  width: number,
  height: number,
  props: Record<string, unknown>
): boolean {
  const propsFile = outputPath.replace(/\.(png|mp4)$/, '_props.json');
  fs.writeFileSync(propsFile, JSON.stringify(props));

  try {
    execSync(
      `npx remotion render "${compositionId}" "${outputPath}" --props="${propsFile}" --width=${width} --height=${height} --crf=18`,
      { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: 180000 }
    );
    if (fs.existsSync(propsFile)) fs.unlinkSync(propsFile);
    return true;
  } catch (e: any) {
    if (fs.existsSync(propsFile)) fs.unlinkSync(propsFile);
    return false;
  }
}

// =============================================================================
// CSV Generators
// =============================================================================

function escapeCSV(val: string): string {
  if (!val) return '';
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function generateMetaBulkCSV(
  rows: Array<{
    adName: string;
    campaignName: string;
    adSetName: string;
    headline: string;
    primaryText: string;
    cta: string;
    websiteUrl: string;
    imagePath: string;
    videoPath: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent: string;
    template: string;
    hookType: string;
    awareness: string;
    funnel: string;
    status: string;
  }>
): string {
  const headers = [
    'Ad Name', 'Campaign Name', 'Ad Set Name', 'Headline', 'Primary Text',
    'Call to Action', 'Website URL', 'Image File Path', 'Video File Path',
    'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content',
    'Template', 'Hook Type', 'Awareness Level', 'Funnel Stage', 'Status',
  ];

  const csvRows = [headers.map(escapeCSV).join(',')];
  for (const row of rows) {
    csvRows.push([
      row.adName, row.campaignName, row.adSetName, row.headline, row.primaryText,
      row.cta, row.websiteUrl, row.imagePath, row.videoPath,
      row.utmSource, row.utmMedium, row.utmCampaign, row.utmContent,
      row.template, row.hookType, row.awareness, row.funnel, row.status,
    ].map(v => escapeCSV(String(v))).join(','));
  }

  return csvRows.join('\n');
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const opts = parseArgs();
  const startTime = Date.now();

  // Filter angles
  const angles = opts.angles.length > 0
    ? PHASE_A_ANGLES.filter(a => opts.angles.includes(a.id))
    : PHASE_A_ANGLES;

  const doStatics = !opts.reelsOnly;
  const doReels = !opts.staticsOnly;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  📦 EverReach Meta Ad Package Generator');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Campaign:  ${opts.campaign}`);
  console.log(`  Angles:    ${angles.length}`);
  console.log(`  Statics:   ${doStatics ? 'YES' : 'SKIP'}`);
  console.log(`  Reels:     ${doReels ? 'YES' : 'SKIP'}`);
  console.log(`  Output:    ${opts.outputDir}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Create output directories
  const staticsDir = path.join(opts.outputDir, 'statics');
  const reelsDir = path.join(opts.outputDir, 'reels');
  fs.mkdirSync(staticsDir, { recursive: true });
  fs.mkdirSync(reelsDir, { recursive: true });

  const csvRows: any[] = [];
  let staticSuccess = 0;
  let staticFailed = 0;
  let reelSuccess = 0;
  let reelFailed = 0;

  // =========================================================================
  // STATICS
  // =========================================================================
  if (doStatics) {
    console.log('━━━ STATIC ADS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const angle of angles) {
      console.log(`🎯 ${angle.id} — "${angle.name}" (${angle.awareness})`);
      const screenshotConfig = ANGLE_SCREENSHOT_MAP[angle.id];

      for (const size of STATIC_SIZES) {
        // Screenshot ad (primary)
        if (screenshotConfig) {
          const suffix = { post: 'Post', portrait: 'Portrait', story: 'Story', facebook: 'Facebook' }[size.id] || 'Post';
          const compositionId = `EverReach-Screenshot-${suffix}`;
          const filename = `${angle.id}_${size.id}.png`;
          const outputPath = path.join(staticsDir, filename);

          const props: Record<string, unknown> = {
            headline: angle.headline,
            subheadline: angle.subheadline,
            ctaText: angle.ctaText,
            awareness: angle.awareness,
            belief: angle.belief,
            screenshotSrc: screenshotConfig.screenshotSrc,
            showPhone: true,
            theme: screenshotConfig.theme,
            layout: size.id === 'facebook' ? 'right' : screenshotConfig.layout,
            badge: screenshotConfig.badge,
            logoSrc: 'everreach/branding/logo-no-bg.png',
            showLogo: true,
          };
          if (size.id === 'facebook') {
            props.headlineSize = 32;
            props.subheadlineSize = 14;
          }

          process.stdout.write(`   📐 ${size.id} → ${compositionId}... `);
          const ok = renderStill(compositionId, outputPath, size.width, size.height, props);
          console.log(ok ? '✅' : '❌');

          if (ok) {
            staticSuccess++;
            const funnel = AWARENESS_FUNNEL[angle.awareness] || 'TOF';
            csvRows.push({
              adName: `${angle.id}_${size.id}`,
              campaignName: `${opts.campaign}_${funnel}`,
              adSetName: `${funnel}_${angle.awareness}_${angle.belief}`,
              headline: angle.headline,
              primaryText: angle.subheadline,
              cta: 'INSTALL_MOBILE_APP',
              websiteUrl: `${opts.baseUrl}?utm_source=meta&utm_medium=paid_social&utm_campaign=${opts.campaign}&utm_content=${angle.id}_${size.id}`,
              imagePath: filename,
              videoPath: '',
              utmSource: 'meta',
              utmMedium: 'paid_social',
              utmCampaign: opts.campaign,
              utmContent: `${angle.id}_${size.id}`,
              template: angle.template,
              hookType: angle.hook,
              awareness: angle.awareness,
              funnel,
              status: 'ACTIVE',
            });
          } else {
            staticFailed++;
          }
        }
      }
      console.log('');
    }
  }

  // =========================================================================
  // REELS
  // =========================================================================
  if (doReels) {
    console.log('━━━ VIDEO REELS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Group angles by awareness to render one reel per awareness stage
    const awarenessGroups = new Map<string, AdAngle[]>();
    for (const angle of angles) {
      const existing = awarenessGroups.get(angle.awareness) || [];
      existing.push(angle);
      awarenessGroups.set(angle.awareness, existing);
    }

    for (const [awareness, groupAngles] of awarenessGroups) {
      const duration = AWARENESS_DURATION[awareness] || 20;
      const script = AWARENESS_REEL_SCRIPTS[awareness];
      if (!script) continue;

      // Use the first angle's copy for the reel CTA
      const primaryAngle = groupAngles[0];
      const funnel = AWARENESS_FUNNEL[awareness] || 'TOF';

      for (const size of REEL_SIZES) {
        const durationSuffix = duration === 20 ? '' : `-${duration}s`;
        const sizeLabel = size.id === 'reel_story' ? 'Story' : 'Post';
        const compositionId = duration === 15
          ? 'EverReach-Reel-Story-15s'
          : duration === 30
            ? 'EverReach-Reel-Story-30s'
            : size.id === 'reel_story'
              ? 'EverReach-Reel-Story'
              : 'EverReach-Reel-Post';

        const filename = `${awareness}_${size.id}${durationSuffix}.mp4`;
        const outputPath = path.join(reelsDir, filename);

        const props: Record<string, unknown> = {
          ...script,
          ctaText: primaryAngle.ctaText,
          awareness,
          belief: primaryAngle.belief,
          duration,
          brandName: 'EverReach',
          logoSrc: 'everreach/branding/logo-no-bg.png',
          accentColor: '#FF6B6B',
          theme: 'dark',
          showCaptions: true,
        };

        process.stdout.write(`   🎬 ${awareness} ${sizeLabel} (${duration}s) → ${compositionId}... `);
        const ok = renderVideo(compositionId, outputPath, size.width, size.height, props);
        console.log(ok ? '✅' : '❌');

        if (ok) {
          reelSuccess++;
          csvRows.push({
            adName: `${awareness}_reel_${size.id}`,
            campaignName: `${opts.campaign}_${funnel}`,
            adSetName: `${funnel}_${awareness}_video`,
            headline: script.hookText,
            primaryText: script.mirrorText,
            cta: 'INSTALL_MOBILE_APP',
            websiteUrl: `${opts.baseUrl}?utm_source=meta&utm_medium=paid_social&utm_campaign=${opts.campaign}&utm_content=${awareness}_reel_${size.id}`,
            imagePath: '',
            videoPath: filename,
            utmSource: 'meta',
            utmMedium: 'paid_social',
            utmCampaign: opts.campaign,
            utmContent: `${awareness}_reel_${size.id}`,
            template: 'reel',
            hookType: script.hookText.substring(0, 30),
            awareness,
            funnel,
            status: 'ACTIVE',
          });
        } else {
          reelFailed++;
        }
      }
      console.log('');
    }
  }

  // =========================================================================
  // EXPORT CSV + CAMPAIGN STRUCTURE
  // =========================================================================
  console.log('━━━ EXPORTING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Meta bulk upload CSV
  const csvContent = generateMetaBulkCSV(csvRows);
  const csvPath = path.join(opts.outputDir, 'meta-bulk-upload.csv');
  fs.writeFileSync(csvPath, csvContent);
  console.log(`   📄 meta-bulk-upload.csv — ${csvRows.length} rows`);

  // UTM tracking CSV
  const utmHeaders = 'Ad Name,UTM Source,UTM Medium,UTM Campaign,UTM Content,Awareness,Funnel,Template';
  const utmRows = csvRows.map(r =>
    [r.adName, r.utmSource, r.utmMedium, r.utmCampaign, r.utmContent, r.awareness, r.funnel, r.template]
      .map(v => escapeCSV(String(v))).join(',')
  );
  fs.writeFileSync(
    path.join(opts.outputDir, 'utm-tracking.csv'),
    [utmHeaders, ...utmRows].join('\n')
  );
  console.log(`   📄 utm-tracking.csv — ${utmRows.length} rows`);

  // Campaign structure JSON
  const campaignStructure = {
    campaign: opts.campaign,
    baseUrl: opts.baseUrl,
    adSets: {
      TOF: {
        name: `${opts.campaign}_TOF`,
        objective: 'Video Views / Engagement',
        targeting: 'Broad — interest-based',
        creatives: csvRows.filter(r => r.funnel === 'TOF').map(r => r.adName),
        notes: 'Unaware + Problem Aware. CTA: save/comment, NOT download.',
      },
      MOF: {
        name: `${opts.campaign}_MOF`,
        objective: 'App Promotion → Install / Trial Start',
        targeting: 'Retarget 25%+ video viewers from TOF',
        creatives: csvRows.filter(r => r.funnel === 'MOF').map(r => r.adName),
        notes: 'Solution + Product Aware. CTA: download / start trial.',
      },
      BOF: {
        name: `${opts.campaign}_BOF`,
        objective: 'App Event Optimization → Subscribe',
        targeting: 'Retarget MOF clickers + App Store visitors',
        creatives: csvRows.filter(r => r.funnel === 'BOF').map(r => r.adName),
        notes: 'Most Aware. CTA: start free trial / cancel anytime.',
      },
    },
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(opts.outputDir, 'campaign-structure.json'),
    JSON.stringify(campaignStructure, null, 2)
  );
  console.log('   📄 campaign-structure.json — TOF/MOF/BOF structure');

  // Manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    campaign: opts.campaign,
    stats: {
      staticSuccess,
      staticFailed,
      reelSuccess,
      reelFailed,
      totalFiles: staticSuccess + reelSuccess,
      elapsed: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    },
    statics: fs.readdirSync(staticsDir).filter(f => f.endsWith('.png')),
    reels: fs.readdirSync(reelsDir).filter(f => f.endsWith('.mp4')),
    csvRows: csvRows.length,
  };
  fs.writeFileSync(
    path.join(opts.outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('   📄 manifest.json');

  // README
  const readme = `# EverReach Meta Ad Package
Generated: ${new Date().toISOString()}
Campaign: ${opts.campaign}

## Contents
- \`statics/\` — ${staticSuccess} static PNG ads (${STATIC_SIZES.map(s => s.label).join(', ')})
- \`reels/\` — ${reelSuccess} video MP4 reels (15-30s, beat-timed)
- \`meta-bulk-upload.csv\` — Import into Meta Ads Manager → Bulk Upload
- \`utm-tracking.csv\` — Full UTM tracking per variant
- \`campaign-structure.json\` — TOF/MOF/BOF ad set structure

## Upload to Meta
1. Go to Meta Ads Manager → Create Campaign → App Promotion
2. Use Bulk Upload: upload \`meta-bulk-upload.csv\`
3. Upload the \`statics/\` and \`reels/\` folders as creative assets
4. Set budgets per the campaign-structure.json TOF/MOF/BOF split
5. Launch!

## Alternative: Use an Ad Management Service
Services like Smartly.io, Revealbot, or Madgicx accept CSV + asset bundles.
Upload the package directly for automated campaign management.
`;
  fs.writeFileSync(path.join(opts.outputDir, 'README.md'), readme);
  console.log('   📄 README.md\n');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  📊 Package Complete');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Static PNGs:  ${staticSuccess} ✅  ${staticFailed > 0 ? `${staticFailed} ❌` : ''}`);
  console.log(`  Video Reels:  ${reelSuccess} ✅  ${reelFailed > 0 ? `${reelFailed} ❌` : ''}`);
  console.log(`  CSV Rows:     ${csvRows.length}`);
  console.log(`  Duration:     ${elapsed}s`);
  console.log(`  Output:       ${opts.outputDir}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
