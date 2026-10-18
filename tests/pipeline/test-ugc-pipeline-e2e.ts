#!/usr/bin/env npx tsx
/**
 * End-to-End Test: UGC Ad Pipeline
 *
 * Validates the full pipeline loop without external API calls:
 * 1. Dry-run generation with all 4 templates
 * 2. Mock Meta CSV ingestion + scoring
 * 3. Optimization → next batch generation
 * 4. Gallery HTML generation
 * 5. Resume checkpoint system
 *
 * Usage: npx tsx tests/pipeline/test-ugc-pipeline-e2e.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Modules under test
import { runUGCPipeline } from '../../src/pipeline/ugc-ad-pipeline';
import { ingestMetaCSV, mergePerformanceIntoBatch, loadBatch, saveBatch } from '../../src/pipeline/meta-data-ingester';
import { generateOptimizationReport, testParameterSignificance, recommendBudgetAllocation } from '../../src/pipeline/parameter-scorer';
import { generateNextBatch } from '../../src/pipeline/optimization-engine';
import { generateGalleryFromBatch } from '../../src/pipeline/preview-generator';
import { loadCheckpoint, listResumableBatches } from '../../src/pipeline/batch-resume';
import { generateMetaUploadCSV, generateUTMTrackingCSV } from '../../src/pipeline/meta-csv-exporter';
import { compareBatches, calculateSampleSize } from '../../src/pipeline/batch-comparator';
import { quickFatigueCheck, detectFatigue, parseMultiPeriodData } from '../../src/pipeline/fatigue-detector';
import { META_AD_SIZES } from '../../src/pipeline/types';
import type {
  UGCPipelineConfig,
  AdBatch,
  TemplateType,
  HookType,
  AwarenessLevel,
  CtaType,
  CopyBank,
} from '../../src/pipeline/types';

// =============================================================================
// Test Helpers
// =============================================================================

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`   ✅ ${message}`);
  } else {
    failed++;
    errors.push(message);
    console.log(`   ❌ ${message}`);
  }
}

function section(name: string): void {
  console.log(`\n━━━ ${name} ━━━`);
}

// =============================================================================
// Test Config
// =============================================================================

const TEST_OUTPUT_DIR = path.join(process.cwd(), 'output', '_test_e2e_pipeline');

const TEST_COPY_BANK: CopyBank = {
  headlines: {
    question: ['Still posting with watermarks?', 'Tired of blurry removals?'],
    statement: ['Watermarks kill engagement'],
    shock: ['87% of creators lose followers'],
    curiosity: ['The tool 50K creators use', 'What if removal was instant?'],
    social_proof: ['Join 50,000+ creators', 'Rated 4.9/5'],
    urgency: ['10 free credits today only', 'Free tier closing soon'],
  },
  subheadlines: {
    problem_aware: ['That watermark is killing the clip.', 'Don\'t redo the whole edit.'],
    solution_aware: ['No bait-and-switch. No blurry exports.', 'Ad-free for creators.'],
    unaware: ['Upload your video and get a clean version back.'],
    product_aware: ['The one you bookmark. Because it works.'],
    most_aware: ['Get 10 free credits. No card needed.'],
  },
  ctas: {
    action: ['Remove Watermark Now', 'Try It Free'],
    benefit: ['Get Clean Exports', 'Get 10 Free Credits'],
    urgency: ['Claim Free Credits Now'],
    curiosity: ['See the Difference'],
  },
  beforeLabels: ['BEFORE', 'WITH WATERMARK'],
  afterLabels: ['AFTER', 'CLEAN'],
  trustLines: ['Quality preserved • No popups', ''],
  badges: ['AD-FREE', 'PREMIUM', ''],
};

const TEST_CONFIG: UGCPipelineConfig = {
  product: { name: 'TestProduct', description: 'Test product for E2E' },
  brand: { name: 'TestBrand', primaryColor: '#6366f1', accentColor: '#22c55e', fontFamily: 'Inter' },
  scenes: { beforePrompt: 'test before', afterPrompt: 'test after', characterStyle: 'realistic' },
  matrix: {
    templates: ['before_after', 'testimonial', 'product_demo', 'problem_solution'] as TemplateType[],
    hookTypes: ['question', 'social_proof', 'urgency', 'curiosity'] as HookType[],
    awarenessLevels: ['problem_aware', 'solution_aware'] as AwarenessLevel[],
    ctaTypes: ['action', 'benefit'] as CtaType[],
    sizes: META_AD_SIZES.filter(s => ['feed_square', 'story'].includes(s.name)),
    strategy: 'latin_square',
    maxVariants: 20,
  },
  copyBank: TEST_COPY_BANK,
  outputDir: TEST_OUTPUT_DIR,
  dryRun: true,
};

// =============================================================================
// Tests
// =============================================================================

async function testDryRunGeneration(): Promise<AdBatch> {
  section('Test 1: Dry-Run Generation (All 4 Templates)');

  const batch = await runUGCPipeline(TEST_CONFIG);

  assert(!!batch.id, `Batch ID generated: ${batch.id}`);
  assert(batch.variants.length > 0, `Variants generated: ${batch.variants.length}`);

  // Check all 4 templates present
  const templates = new Set(batch.variants.map(v => v.parameters.visual.template));
  assert(templates.has('before_after'), 'Template: before_after present');
  assert(templates.has('testimonial'), 'Template: testimonial present');
  assert(templates.has('product_demo'), 'Template: product_demo present');
  assert(templates.has('problem_solution'), 'Template: problem_solution present');

  // Check hook distribution
  const hooks = new Set(batch.variants.map(v => v.parameters.copy.hookType));
  assert(hooks.size >= 3, `Hook types distributed: ${hooks.size} types`);

  // Check files saved
  const batchDir = path.join(TEST_OUTPUT_DIR, batch.id);
  assert(fs.existsSync(path.join(batchDir, 'batch.json')), 'batch.json saved');
  assert(fs.existsSync(path.join(batchDir, 'variants.json')), 'variants.json saved');
  assert(fs.existsSync(path.join(batchDir, 'utm_mapping.json')), 'utm_mapping.json saved');
  assert(fs.existsSync(path.join(batchDir, 'checkpoint.json')), 'checkpoint.json saved');

  // Verify UTM params
  const firstVariant = batch.variants[0];
  assert(!!firstVariant.utmParams.utm_content, `UTM content: ${firstVariant.utmParams.utm_content}`);
  assert(!!firstVariant.utmParams.utm_campaign, `UTM campaign: ${firstVariant.utmParams.utm_campaign}`);

  // Verify variant IDs encode parameters
  assert(firstVariant.id.includes(batch.id), `Variant ID contains batch ID`);

  return batch;
}

function testMockMetaIngestion(batch: AdBatch): void {
  section('Test 2: Mock Meta CSV Ingestion + Scoring');

  const batchDir = path.join(TEST_OUTPUT_DIR, batch.id);

  // Create mock CSV matching generated variant IDs
  const mockRows = batch.variants.slice(0, 6).map((v, i) => {
    const impressions = 3000 + Math.floor(Math.random() * 3000);
    const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.03));
    const ctr = (clicks / impressions * 100).toFixed(2);
    const cpc = (0.8 + Math.random() * 1.5).toFixed(2);
    const spend = (clicks * parseFloat(cpc)).toFixed(2);
    const results = Math.floor(clicks * (0.05 + Math.random() * 0.15));
    const costPerResult = results > 0 ? (parseFloat(spend) / results).toFixed(2) : '0';
    return `UGC-Test,Test-${i},${v.id},${impressions},${clicks},${ctr}%,$${cpc},$25.00,$${spend},${results},$${costPerResult},${impressions},${Math.floor(impressions * 0.5)},${impressions - 200},1.05,2026-01-15,2026-01-22,Feed,instagram`;
  });

  const csvContent = 'Campaign name,Ad set name,Ad name,Impressions,Link clicks,CTR (link click-through rate),CPC (cost per link click),CPM (cost per 1,000 impressions),Amount spent,Results,Cost per result,Video plays,ThruPlays,Reach,Frequency,Reporting starts,Reporting ends,Placement,Platform\n' + mockRows.join('\n');

  const csvPath = path.join(batchDir, 'test_meta_export.csv');
  fs.writeFileSync(csvPath, csvContent);

  // Ingest
  const performances = ingestMetaCSV(csvPath);
  assert(performances.length === 6, `Ingested ${performances.length} performances`);

  // Merge into batch
  const loadedBatch = loadBatch(path.join(batchDir, 'batch.json'));
  mergePerformanceIntoBatch(loadedBatch, performances);
  saveBatch(loadedBatch, path.join(batchDir, 'batch.json'));

  const matchedCount = loadedBatch.variants.filter(v => v.performance).length;
  assert(matchedCount === 6, `Merged ${matchedCount}/6 performances into variants`);

  // Score
  const report = generateOptimizationReport(loadedBatch);
  assert(!!report, 'Optimization report generated');
  assert(report.topCombinations.length > 0, `Top combinations: ${report.topCombinations.length}`);
  assert(Object.keys(report.parameterRankings).length > 0, `Parameter dimensions scored: ${Object.keys(report.parameterRankings).length}`);

  // Save report
  fs.writeFileSync(path.join(batchDir, 'optimization_report.json'), JSON.stringify(report, null, 2));
  assert(fs.existsSync(path.join(batchDir, 'optimization_report.json')), 'Report saved');
}

function testNextBatchGeneration(batch: AdBatch): void {
  section('Test 3: Next Batch Optimization');

  const batchDir = path.join(TEST_OUTPUT_DIR, batch.id);
  const loadedBatch = loadBatch(path.join(batchDir, 'batch.json'));
  const report = JSON.parse(fs.readFileSync(path.join(batchDir, 'optimization_report.json'), 'utf-8'));

  const nextBatchResult = generateNextBatch({
    previousBatch: loadedBatch,
    report,
    allTemplates: ['before_after', 'testimonial', 'product_demo', 'problem_solution'],
    allHookTypes: ['question', 'statement', 'shock', 'curiosity', 'social_proof', 'urgency'],
    allAwarenessLevels: ['unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware'],
    allCtaTypes: ['action', 'benefit', 'urgency', 'curiosity'],
    copyBank: TEST_COPY_BANK,
    maxVariants: 12,
    sizes: META_AD_SIZES.filter(s => ['feed_square', 'story'].includes(s.name)),
  });

  assert(nextBatchResult.variants.length > 0, `Next batch: ${nextBatchResult.variants.length} variants`);
  assert(nextBatchResult.exploitVariants > 0, `Exploit variants: ${nextBatchResult.exploitVariants}`);
  assert(nextBatchResult.exploreVariants >= 0, `Explore variants: ${nextBatchResult.exploreVariants}`);
  assert(nextBatchResult.mutateVariants >= 0, `Mutate variants: ${nextBatchResult.mutateVariants}`);

  // Save
  const nextDir = path.join(TEST_OUTPUT_DIR, `next_${batch.id}`);
  fs.mkdirSync(nextDir, { recursive: true });
  fs.writeFileSync(path.join(nextDir, 'next_batch.json'), JSON.stringify(nextBatchResult, null, 2));
  assert(fs.existsSync(path.join(nextDir, 'next_batch.json')), 'Next batch saved');
}

function testGalleryGeneration(batch: AdBatch): void {
  section('Test 4: Gallery HTML Generation');

  const batchDir = path.join(TEST_OUTPUT_DIR, batch.id);
  const galleryPath = generateGalleryFromBatch(batchDir);

  assert(fs.existsSync(galleryPath), 'Gallery HTML file created');

  const html = fs.readFileSync(galleryPath, 'utf-8');
  assert(html.includes('UGC Ad Gallery'), 'Gallery has title');
  assert(html.includes(batch.id), 'Gallery includes batch ID');
  assert(html.includes('before_after'), 'Gallery shows before_after template');
  assert(html.includes('testimonial'), 'Gallery shows testimonial template');
  assert(html.includes('filter-btn'), 'Gallery has filter buttons');
  assert(html.length > 5000, `Gallery has substantial content: ${html.length} chars`);
}

function testCheckpointSystem(batch: AdBatch): void {
  section('Test 5: Checkpoint / Resume System');

  const batchDir = path.join(TEST_OUTPUT_DIR, batch.id);
  const checkpoint = loadCheckpoint(batchDir);

  assert(checkpoint !== null, 'Checkpoint loaded');
  assert(checkpoint!.batchId === batch.id, `Checkpoint batch ID matches: ${checkpoint!.batchId}`);
  assert(checkpoint!.stage === 'complete', `Checkpoint stage: ${checkpoint!.stage}`);
  assert(checkpoint!.completedStages.includes('variants'), 'Variants stage completed');
  assert(checkpoint!.completedStages.includes('complete'), 'Complete stage marked');
  assert(!!checkpoint!.stageData.variants, 'Variants stage data saved');
}

function testVariantIdEncoding(batch: AdBatch): void {
  section('Test 6: Variant ID Encoding');

  for (const variant of batch.variants.slice(0, 4)) {
    const id = variant.id;
    const p = variant.parameters;

    // Verify ID structure: {template_abbrev}_{hook_abbrev}_{awareness_abbrev}_{cta_abbrev}_{size}_{batchId}_{index}
    const parts = id.split('_');
    assert(parts.length >= 5, `Variant ID has enough parts: ${id} (${parts.length} parts)`);

    // Template abbreviation
    const templateMap: Record<string, string> = {
      before_after: 'ba', testimonial: 'tm', product_demo: 'pd', problem_solution: 'ps',
    };
    const expectedPrefix = templateMap[p.visual.template];
    assert(id.startsWith(expectedPrefix + '_'), `ID starts with template abbrev '${expectedPrefix}': ${id}`);
  }
}

function testStatisticalSignificance(batch: AdBatch): void {
  section('Test 7: Statistical Significance Testing');

  const batchDir = path.join(TEST_OUTPUT_DIR, batch.id);
  const loadedBatch = loadBatch(path.join(batchDir, 'batch.json'));

  const results = testParameterSignificance(loadedBatch, 'ctr');
  assert(Array.isArray(results), 'Significance results is an array');

  // With only 6 variants having perf data, we may or may not get results
  // but the function should not throw
  if (results.length > 0) {
    const first = results[0];
    assert(typeof first.pValue === 'number', `p-value is numeric: ${first.pValue}`);
    assert(typeof first.tStatistic === 'number', `t-statistic is numeric: ${first.tStatistic}`);
    assert(typeof first.effectSize === 'number', `Effect size is numeric: ${first.effectSize}`);
    assert(typeof first.isSignificant === 'boolean', 'isSignificant is boolean');
    assert(typeof first.recommendation === 'string' && first.recommendation.length > 0, 'Recommendation present');
    assert(first.sampleSizeA >= 2, `Sample A >= 2: ${first.sampleSizeA}`);
    assert(first.sampleSizeB >= 2, `Sample B >= 2: ${first.sampleSizeB}`);
  } else {
    assert(true, 'No significance results (expected with small sample)');
  }

  // Test with roas metric too
  const roasResults = testParameterSignificance(loadedBatch, 'roas');
  assert(Array.isArray(roasResults), 'ROAS significance results is an array');
}

function testBudgetAllocation(batch: AdBatch): void {
  section('Test 8: Budget Allocation');

  const batchDir = path.join(TEST_OUTPUT_DIR, batch.id);
  const loadedBatch = loadBatch(path.join(batchDir, 'batch.json'));

  const allocations = recommendBudgetAllocation(loadedBatch, 200);
  assert(Array.isArray(allocations), 'Allocations is an array');

  if (allocations.length > 0) {
    const totalShare = allocations.reduce((s, a) => s + a.recommendedSharePct, 0);
    assert(Math.abs(totalShare - 100) < 1, `Total share sums to ~100%: ${totalShare.toFixed(1)}%`);

    const first = allocations[0];
    assert(typeof first.variantId === 'string', 'Has variant ID');
    assert(['increase', 'maintain', 'decrease', 'pause'].includes(first.action), `Valid action: ${first.action}`);
    assert(typeof first.reason === 'string' && first.reason.length > 0, 'Reason present');
    assert(first.recommendedSharePct >= 0, `Share >= 0: ${first.recommendedSharePct}%`);
  } else {
    assert(true, 'No allocations (expected with few variants having perf data)');
  }
}

function testMetaCSVExport(batch: AdBatch): void {
  section('Test 9: Meta CSV Export');

  // Test upload CSV
  const csv = generateMetaUploadCSV(batch, { baseUrl: 'https://test.com', campaignName: 'Test_Campaign' });
  assert(csv.length > 0, 'CSV has content');

  const lines = csv.split('\n');
  assert(lines.length === batch.variants.length + 1, `CSV has ${lines.length} lines (header + ${batch.variants.length} variants)`);

  const header = lines[0];
  assert(header.includes('Ad Name'), 'CSV header has Ad Name');
  assert(header.includes('Campaign Name'), 'CSV header has Campaign Name');
  assert(header.includes('UTM Content'), 'CSV header has UTM Content');
  assert(header.includes('Website URL'), 'CSV header has Website URL');

  // Check first data row
  const firstRow = lines[1];
  assert(firstRow.includes(batch.variants[0].id), 'First row has variant ID');
  assert(firstRow.includes('Test_Campaign'), 'First row has campaign name');
  assert(firstRow.includes('utm_source='), 'First row has UTM source');

  // Save CSV
  const batchDir = path.join(TEST_OUTPUT_DIR, batch.id);
  fs.writeFileSync(path.join(batchDir, 'meta_upload.csv'), csv);
  assert(fs.existsSync(path.join(batchDir, 'meta_upload.csv')), 'CSV file saved');

  // Test UTM tracking CSV
  const utmCsv = generateUTMTrackingCSV(batch);
  assert(utmCsv.length > 0, 'UTM CSV has content');
  assert(utmCsv.split('\n').length === batch.variants.length + 1, 'UTM CSV has correct row count');
}

function testBatchComparison(batch: AdBatch): void {
  section('Test 10: Batch Comparison');

  const batchDir = path.join(TEST_OUTPUT_DIR, batch.id);
  const loadedBatch = loadBatch(path.join(batchDir, 'batch.json'));

  // Compare batch against itself (should show zero deltas)
  const selfComparison = compareBatches(loadedBatch, loadedBatch);
  assert(!!selfComparison, 'Self-comparison result exists');
  assert(selfComparison.batchA.id === selfComparison.batchB.id, 'Both sides reference same batch');
  assert(selfComparison.metrics.ctr.absoluteDelta === 0, 'CTR delta is 0 for self-comparison');
  assert(selfComparison.metrics.roas.absoluteDelta === 0, 'ROAS delta is 0 for self-comparison');
  assert(typeof selfComparison.summary === 'string' && selfComparison.summary.length > 0, 'Summary text present');
  assert(Array.isArray(selfComparison.parameterShifts), 'Parameter shifts is an array');
  assert(Array.isArray(selfComparison.templateComparison), 'Template comparison is an array');

  // Check template comparison has entries for each template
  const templates = new Set(loadedBatch.variants.map(v => v.parameters.visual.template));
  assert(
    selfComparison.templateComparison.length === templates.size,
    `Template comparison has ${selfComparison.templateComparison.length} entries for ${templates.size} templates`
  );

  // Parameter shifts should all be stable in self-comparison
  for (const shift of selfComparison.parameterShifts) {
    assert(!shift.shifted, `Parameter ${shift.parameter} stable in self-comparison`);
  }
}

function testSampleSizeCalculator(): void {
  section('Test 11: Sample Size Calculator');

  // Standard case: 2% baseline CTR, detect 20% relative lift
  const result = calculateSampleSize({
    baselineCtr: 0.02,
    mde: 0.20,
    numVariants: 4,
    dailyImpressions: 1000,
    cpm: 15,
  });

  assert(result.sampleSizePerVariant > 0, `Sample size per variant: ${result.sampleSizePerVariant}`);
  assert(result.totalSampleSize > result.sampleSizePerVariant, `Total > per-variant: ${result.totalSampleSize}`);
  assert(result.totalSampleSize === result.sampleSizePerVariant * result.numVariants, 'Total = perVariant * numVariants');
  assert(result.estimatedDays > 0, `Estimated days: ${result.estimatedDays}`);
  assert(result.estimatedBudget > 0, `Estimated budget: $${result.estimatedBudget}`);
  assert(result.baselineCtr === 0.02, 'Baseline CTR preserved');
  assert(result.minimumDetectableEffect === 0.20, 'MDE preserved');
  assert(result.power === 0.80, 'Default power is 0.80');
  assert(result.significanceLevel === 0.05, 'Default alpha is 0.05');

  // Smaller effect requires larger sample
  const smallEffect = calculateSampleSize({ baselineCtr: 0.02, mde: 0.10 });
  const largeEffect = calculateSampleSize({ baselineCtr: 0.02, mde: 0.50 });
  assert(
    smallEffect.sampleSizePerVariant > largeEffect.sampleSizePerVariant,
    `Smaller effect needs larger sample: ${smallEffect.sampleSizePerVariant} > ${largeEffect.sampleSizePerVariant}`
  );

  // Higher baseline CTR needs smaller sample
  const lowCtr = calculateSampleSize({ baselineCtr: 0.01, mde: 0.20 });
  const highCtr = calculateSampleSize({ baselineCtr: 0.05, mde: 0.20 });
  assert(
    lowCtr.sampleSizePerVariant > highCtr.sampleSizePerVariant,
    `Lower CTR needs larger sample: ${lowCtr.sampleSizePerVariant} > ${highCtr.sampleSizePerVariant}`
  );
}

function testFatigueDetection(batch: AdBatch): void {
  section('Test 12: Creative Fatigue Detection');

  const batchDir = path.join(TEST_OUTPUT_DIR, batch.id);
  const loadedBatch = loadBatch(path.join(batchDir, 'batch.json'));

  // Quick fatigue check (single-period heuristic)
  const quickReport = quickFatigueCheck(loadedBatch);
  assert(!!quickReport, 'Quick fatigue report generated');
  assert(quickReport.batchId === loadedBatch.id, 'Report has correct batch ID');
  assert(typeof quickReport.shouldRefresh === 'boolean', 'shouldRefresh is boolean');
  assert(['none', 'low', 'medium', 'high'].includes(quickReport.urgency), `Valid urgency: ${quickReport.urgency}`);
  assert(quickReport.statusBreakdown.healthy >= 0, 'Healthy count >= 0');
  assert(typeof quickReport.batchRecommendation === 'string', 'Has batch recommendation');

  // Verify variant reports
  if (quickReport.variantReports.length > 0) {
    const first = quickReport.variantReports[0];
    assert(['healthy', 'watch', 'fatigued', 'critical'].includes(first.overallStatus), `Valid status: ${first.overallStatus}`);
    assert(first.fatigueScore >= 0 && first.fatigueScore <= 100, `Score in range: ${first.fatigueScore}`);
    assert(first.estimatedDaysRemaining > 0, `Days remaining > 0: ${first.estimatedDaysRemaining}`);
  }

  // Multi-period fatigue detection with synthetic data
  const variantsWithPerf = loadedBatch.variants.filter(v => v.performance);
  if (variantsWithPerf.length >= 2) {
    // Create mock multi-period CSV: period 1 good, period 2 declining
    const v1 = variantsWithPerf[0];
    const v2 = variantsWithPerf[1];
    const mockCsv = [
      'Ad name,Impressions,Link clicks,CTR (link click-through rate),CPC (cost per link click),Amount spent,Results,Reach,Frequency,Reporting starts,Reporting ends',
      `${v1.id},5000,150,3.0%,$1.20,$180,8,4500,1.1,2026-01-01,2026-01-07`,
      `${v1.id},5000,75,1.5%,$2.40,$180,3,3800,1.3,2026-01-08,2026-01-14`,
      `${v2.id},4000,120,3.0%,$1.00,$120,6,3800,1.05,2026-01-01,2026-01-07`,
      `${v2.id},4000,110,2.75%,$1.10,$121,5,3700,1.08,2026-01-08,2026-01-14`,
    ].join('\n');

    const periodData = parseMultiPeriodData(mockCsv);
    assert(periodData.size === 2, `Parsed ${periodData.size} variants from multi-period CSV`);
    assert(periodData.get(v1.id)!.length === 2, 'Variant 1 has 2 periods');

    const fatigueReport = detectFatigue(loadedBatch, periodData);
    assert(!!fatigueReport, 'Multi-period fatigue report generated');
    assert(fatigueReport.variantReports.length >= 2, `Has variant reports: ${fatigueReport.variantReports.length}`);

    // v1 should show fatigue (CTR dropped 50%)
    const v1Report = fatigueReport.variantReports.find(r => r.variantId === v1.id);
    if (v1Report) {
      assert(v1Report.signals.length > 0, `Variant 1 has fatigue signals: ${v1Report.signals.length}`);
      assert(v1Report.fatigueScore > 0, `Variant 1 fatigue score > 0: ${v1Report.fatigueScore}`);
      assert(
        v1Report.overallStatus !== 'healthy',
        `Variant 1 flagged as ${v1Report.overallStatus} (CTR dropped 50%)`
      );
    }

    // v2 should be more stable
    const v2Report = fatigueReport.variantReports.find(r => r.variantId === v2.id);
    if (v2Report) {
      assert(
        v2Report.fatigueScore <= (v1Report?.fatigueScore || 100),
        `Variant 2 less fatigued than variant 1: ${v2Report.fatigueScore} <= ${v1Report?.fatigueScore}`
      );
    }
  } else {
    assert(true, 'Skipped multi-period test (not enough variants with perf data)');
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧪 UGC Ad Pipeline — End-to-End Test Suite');
  console.log('═══════════════════════════════════════════════════════════════');

  // Clean test output
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
  }

  try {
    const batch = await testDryRunGeneration();
    testMockMetaIngestion(batch);
    testNextBatchGeneration(batch);
    testGalleryGeneration(batch);
    testCheckpointSystem(batch);
    testVariantIdEncoding(batch);
    testStatisticalSignificance(batch);
    testBudgetAllocation(batch);
    testMetaCSVExport(batch);
    testBatchComparison(batch);
    testSampleSizeCalculator();
    testFatigueDetection(batch);
  } catch (error: any) {
    console.error(`\n💥 Test crashed: ${error.message}`);
    console.error(error.stack);
    failed++;
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  🧪 Results: ${passed} passed, ${failed} failed`);
  if (errors.length > 0) {
    console.log('  ❌ Failures:');
    errors.forEach(e => console.log(`     - ${e}`));
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Cleanup
  if (failed === 0 && fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
    console.log('🧹 Test output cleaned up');
  } else if (failed > 0) {
    console.log(`📂 Test output preserved at: ${TEST_OUTPUT_DIR}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
