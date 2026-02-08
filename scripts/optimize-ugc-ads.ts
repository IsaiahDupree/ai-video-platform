#!/usr/bin/env npx tsx
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UGC Ad Optimizer CLI
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ingests Meta Ads performance data, scores parameters, and generates
 * an optimized next batch biased toward winners.
 *
 * Usage:
 *   npx tsx scripts/optimize-ugc-ads.ts --batch <batch_dir> --meta-csv <csv_path>
 *   npx tsx scripts/optimize-ugc-ads.ts --batch output/ugc-ads/b456417 --meta-csv data/meta-export.csv
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

import { ingestMetaCSV, mergePerformanceIntoBatch, loadBatch, saveBatch } from '../src/pipeline/meta-data-ingester';
import { generateOptimizationReport, testParameterSignificance, recommendBudgetAllocation } from '../src/pipeline/parameter-scorer';
import { generateNextBatch } from '../src/pipeline/optimization-engine';
import { META_AD_SIZES } from '../src/pipeline/types';
import type { TemplateType, HookType, AwarenessLevel, CtaType, CopyBank } from '../src/pipeline/types';

// =============================================================================
// Default Copy Bank (same as generate script)
// =============================================================================

const DEFAULT_COPY_BANK: CopyBank = {
  headlines: {
    question: ['Still posting with watermarks?', 'Tired of blurry AI removals?', 'Why settle for smeared exports?'],
    statement: ['Watermarks kill your engagement', 'Your content deserves better', 'Clean exports in minutes'],
    shock: ['87% of creators lose followers over this', 'This one thing ruins every post'],
    curiosity: ['The tool 50K creators won\'t share', 'What if removal was instant?'],
    social_proof: ['Join 50,000+ creators', 'Rated 4.9/5 by professionals'],
    urgency: ['10 free credits — today only', 'Limited: Free watermark removal'],
  },
  subheadlines: {
    problem_aware: ['That watermark is killing the clip. Upload → clean it → download.', 'When you need a clean clip today.'],
    solution_aware: ['If the usual sites keep ruining your video, try a premium tool.', 'No bait-and-switch. Just clean video.'],
    unaware: ['Upload your video and get a clean version back.'],
    product_aware: ['The one you bookmark. Because it works.'],
    most_aware: ['Get 10 free credits. No card needed.'],
  },
  ctas: {
    action: ['Remove Watermark Now', 'Try It Free', 'Upload Video'],
    benefit: ['Get Clean Photos', 'Get 10 Free Credits', 'Unlock HD Quality'],
    urgency: ['Claim Free Credits Now', 'Start Before Offer Ends'],
    curiosity: ['See the Difference', 'Watch It Work'],
  },
  beforeLabels: ['BEFORE', 'WITH WATERMARK', 'ORIGINAL'],
  afterLabels: ['AFTER', 'CLEAN', 'REMOVED'],
  trustLines: ['Quality preserved • No popups', 'Ad-free • Fast • Clean output', ''],
  badges: ['AD-FREE', 'HQ OUTPUT', 'PREMIUM', 'FAST', ''],
};

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): {
  batchDir: string;
  metaCsvPath: string;
  maxVariants: number;
  outputDir: string;
  generateNext: boolean;
  reportOnly: boolean;
} {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      if (['report-only', 'generate-next'].includes(key)) {
        opts[key] = 'true';
      } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
        opts[key] = args[++i];
      }
    }
  }

  return {
    batchDir: opts['batch'] || '',
    metaCsvPath: opts['meta-csv'] || opts['csv'] || '',
    maxVariants: parseInt(opts['max-variants'] || '12', 10),
    outputDir: opts['output'] || '',
    generateNext: opts['generate-next'] === 'true' || !opts['report-only'],
    reportOnly: opts['report-only'] === 'true',
  };
}

function printUsage(): void {
  console.log(`
📊 UGC Ad Optimizer
═══════════════════════════════════════════════════════════════

Ingest Meta Ads data, score parameters, and generate optimized next batch.

Usage:
  npx tsx scripts/optimize-ugc-ads.ts --batch <batch_dir> --meta-csv <csv_path>

Options:
  --batch <dir>             Path to batch output directory (contains batch.json)
  --meta-csv <path>         Path to Meta Ads Manager CSV export
  --max-variants <n>        Max variants for next batch (default: 12)
  --output <dir>            Output directory for next batch
  --report-only             Only generate report, don't create next batch
  --generate-next           Generate next batch (default: true)

Flow:
  1. Load batch manifest (batch.json)
  2. Parse Meta CSV → performance data
  3. Merge performance into batch variants
  4. Score parameters (which hooks/CTAs/templates win?)
  5. Generate optimization report
  6. Create next batch biased toward winners (70/20/10)

Examples:
  # Full optimization cycle
  npx tsx scripts/optimize-ugc-ads.ts \\
    --batch output/ugc-ads/b456417 \\
    --meta-csv data/meta-export.csv

  # Report only
  npx tsx scripts/optimize-ugc-ads.ts \\
    --batch output/ugc-ads/b456417 \\
    --meta-csv data/meta-export.csv \\
    --report-only
`);
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = parseArgs();

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  if (!args.batchDir) {
    console.error('❌ --batch <dir> is required. Point to a batch output directory.');
    printUsage();
    process.exit(1);
  }

  if (!args.metaCsvPath) {
    console.error('❌ --meta-csv <path> is required. Export from Meta Ads Manager.');
    printUsage();
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  📊 UGC Ad Optimizer');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Batch:       ${args.batchDir}`);
  console.log(`  Meta CSV:    ${args.metaCsvPath}`);
  console.log(`  Report Only: ${args.reportOnly}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Step 1: Load batch
  const batchJsonPath = path.join(args.batchDir, 'batch.json');
  console.log('📂 Loading batch...');
  const batch = loadBatch(batchJsonPath);
  console.log(`   Batch ${batch.id}: ${batch.variants.length} variants\n`);

  // Step 2: Ingest Meta CSV
  console.log('📊 Ingesting Meta Ads data...');
  const performances = ingestMetaCSV(args.metaCsvPath);
  console.log(`   ${performances.length} ad performances loaded\n`);

  // Step 3: Merge performance into batch
  console.log('🔗 Merging performance data...');
  mergePerformanceIntoBatch(batch, performances);

  // Save updated batch
  saveBatch(batch, batchJsonPath);
  console.log(`   Updated batch saved to ${batchJsonPath}\n`);

  // Step 4: Generate optimization report
  const report = generateOptimizationReport(batch);

  // Save report
  const reportPath = path.join(args.batchDir, 'optimization_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n   📄 Report saved: ${reportPath}`);

  // Print report summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 Optimization Report Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Variants Analyzed: ${report.variantsAnalyzed}`);
  console.log(`  Total Spend:       $${report.totalSpend.toFixed(2)}`);
  console.log(`  Total Conversions: ${report.totalConversions}`);
  console.log(`  Overall ROAS:      ${report.overallRoas.toFixed(2)}x`);
  console.log(`  Overall CTR:       ${report.overallCtr.toFixed(2)}%`);

  if (Object.keys(report.winners).length > 0) {
    console.log('\n  🏆 Winners:');
    for (const [param, winner] of Object.entries(report.winners)) {
      const short = param.split('.').pop();
      console.log(`    ${short}: "${winner.value}" (score: ${winner.score.toFixed(3)}, conf: ${winner.confidence})`);
    }
  }

  if (report.recommendations.length > 0) {
    console.log('\n  💡 Recommendations:');
    for (const rec of report.recommendations) {
      console.log(`    [${rec.action.toUpperCase()}] ${rec.target}`);
      console.log(`      ${rec.reason}`);
      console.log(`      → ${rec.expectedImpact}`);
    }
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Step 4b: Statistical Significance Testing
  const sigResults = testParameterSignificance(batch, 'ctr');
  if (sigResults.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  🔬 Statistical Significance (Welch\'s t-test on CTR)');
    console.log('═══════════════════════════════════════════════════════════════');
    for (const sig of sigResults.slice(0, 8)) {
      const icon = sig.isHighlySignificant ? '✅✅' : sig.isSignificant ? '✅' : '⚠️';
      const param = sig.parameterA.split('=')[0].split('.').pop();
      console.log(`  ${icon} ${param}: "${sig.parameterA.split('=')[1]}" vs "${sig.parameterB.split('=')[1]}"`);
      console.log(`     mean ${sig.meanA.toFixed(2)}% vs ${sig.meanB.toFixed(2)}% | p=${sig.pValue} | d=${sig.effectSize}`);
      console.log(`     ${sig.recommendation}`);
    }
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save significance results
    fs.writeFileSync(
      path.join(args.batchDir, 'significance_tests.json'),
      JSON.stringify(sigResults, null, 2)
    );
  }

  // Step 4c: Budget Allocation
  const budgetRecs = recommendBudgetAllocation(batch, 100);
  if (budgetRecs.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  💰 Budget Allocation ($100/day)');
    console.log('═══════════════════════════════════════════════════════════════');
    for (const alloc of budgetRecs) {
      const icon = alloc.action === 'increase' ? '🟢' : alloc.action === 'maintain' ? '🟡' : alloc.action === 'pause' ? '🔴' : '🟠';
      console.log(`  ${icon} ${alloc.variantId} → ${alloc.recommendedSharePct}%`);
      console.log(`     ${alloc.reason}`);
    }
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.writeFileSync(
      path.join(args.batchDir, 'budget_allocation.json'),
      JSON.stringify(budgetRecs, null, 2)
    );
  }

  // Step 5: Generate next batch
  if (!args.reportOnly) {
    console.log('🧠 Generating optimized next batch...\n');

    const nextBatchResult = generateNextBatch({
      previousBatch: batch,
      report,
      allTemplates: ['before_after', 'testimonial', 'product_demo', 'problem_solution'] as TemplateType[],
      allHookTypes: ['question', 'statement', 'shock', 'curiosity', 'social_proof', 'urgency'] as HookType[],
      allAwarenessLevels: ['unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware'] as AwarenessLevel[],
      allCtaTypes: ['action', 'benefit', 'urgency', 'curiosity'] as CtaType[],
      copyBank: DEFAULT_COPY_BANK,
      maxVariants: args.maxVariants,
      sizes: META_AD_SIZES.filter(s => ['feed_square', 'story'].includes(s.name)),
    });

    const nextBatchDir = args.outputDir || path.join(path.dirname(args.batchDir), `next_${batch.id}`);
    fs.mkdirSync(nextBatchDir, { recursive: true });

    // Save next batch config
    const nextBatchManifest = {
      parentBatchId: batch.id,
      exploitVariants: nextBatchResult.exploitVariants,
      exploreVariants: nextBatchResult.exploreVariants,
      mutateVariants: nextBatchResult.mutateVariants,
      totalVariants: nextBatchResult.variants.length,
      matrix: nextBatchResult.matrix,
      variants: nextBatchResult.variants.map(v => ({
        id: v.id,
        hookType: v.parameters.copy.hookType,
        awareness: v.parameters.targeting.awarenessLevel,
        template: v.parameters.visual.template,
        ctaType: v.parameters.copy.ctaType,
        headline: v.parameters.copy.headline,
        ctaText: v.parameters.copy.ctaText,
        utmContent: v.utmParams.utm_content,
      })),
      generatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(nextBatchDir, 'next_batch.json'),
      JSON.stringify(nextBatchManifest, null, 2)
    );

    // Link batches
    batch.childBatchId = `next_${batch.id}`;
    saveBatch(batch, batchJsonPath);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Next Batch Generated');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Output:     ${nextBatchDir}`);
    console.log(`  Exploit:    ${nextBatchResult.exploitVariants} variants (winners)`);
    console.log(`  Explore:    ${nextBatchResult.exploreVariants} variants (new combos)`);
    console.log(`  Mutate:     ${nextBatchResult.mutateVariants} variants (winner mutations)`);
    console.log(`  Total:      ${nextBatchResult.variants.length} variants`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📋 Next Steps:');
    console.log(`  1. Review next batch: ${nextBatchDir}/next_batch.json`);
    console.log(`  2. Generate creatives: npx tsx scripts/generate-ugc-ads.ts --config ${nextBatchDir}/next_batch.json`);
    console.log(`  3. Upload to Meta Ads Manager`);
    console.log(`  4. After running, optimize again with the new batch`);
  }
}

main().catch(err => {
  console.error(`\n❌ Optimizer failed: ${err.message}`);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
