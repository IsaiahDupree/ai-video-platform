#!/usr/bin/env npx tsx
/**
 * UGC Ad Meta CSV Exporter CLI
 *
 * Generates Meta Ads Manager-compatible CSV and UTM tracking CSV
 * from a batch directory.
 *
 * Usage:
 *   npx tsx scripts/export-ugc-csv.ts --batch output/ugc-ads/b630656
 *   npx tsx scripts/export-ugc-csv.ts --batch output/ugc-ads/b630656 --url https://myapp.com --campaign "Spring 2026"
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateMetaUploadCSV, generateUTMTrackingCSV } from '../src/pipeline/meta-csv-exporter';
import type { AdBatch } from '../src/pipeline/types';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      if (args[i + 1] && !args[i + 1].startsWith('--')) {
        opts[key] = args[++i];
      }
    }
  }

  return {
    batchDir: opts['batch'] || '',
    baseUrl: opts['url'] || 'https://example.com',
    campaignName: opts['campaign'] || '',
    adSetPrefix: opts['adset-prefix'] || 'UGC',
  };
}

function main() {
  const args = parseArgs();

  if (!args.batchDir || process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
📤 UGC Ad CSV Exporter
═══════════════════════════════════════════════════════════════

Export batch as Meta Ads Manager CSV for bulk upload.

Usage:
  npx tsx scripts/export-ugc-csv.ts --batch <batch_dir> [options]

Options:
  --batch <dir>            Path to batch directory (required)
  --url <base_url>         Base website URL for tracking (default: https://example.com)
  --campaign <name>        Campaign name override (default: UGC_{batchId})
  --adset-prefix <prefix>  Ad set name prefix (default: UGC)

Outputs:
  meta_upload.csv    - Meta Ads Manager bulk upload format
  utm_tracking.csv   - UTM parameter tracking spreadsheet
`);
    process.exit(args.batchDir ? 0 : 1);
  }

  const batchJsonPath = path.join(args.batchDir, 'batch.json');
  if (!fs.existsSync(batchJsonPath)) {
    console.error(`❌ batch.json not found in ${args.batchDir}`);
    process.exit(1);
  }

  const batch: AdBatch = JSON.parse(fs.readFileSync(batchJsonPath, 'utf-8'));

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  📤 UGC Ad CSV Exporter');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Batch:    ${batch.id} (${batch.variants.length} variants)`);
  console.log(`  URL:      ${args.baseUrl}`);
  console.log(`  Campaign: ${args.campaignName || `UGC_${batch.id}`}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Generate Meta upload CSV
  const metaCsv = generateMetaUploadCSV(batch, {
    baseUrl: args.baseUrl,
    campaignName: args.campaignName || undefined,
    adSetPrefix: args.adSetPrefix,
  });
  const metaCsvPath = path.join(args.batchDir, 'meta_upload.csv');
  fs.writeFileSync(metaCsvPath, metaCsv);
  console.log(`  ✅ Meta upload CSV:   ${metaCsvPath}`);
  console.log(`     ${batch.variants.length} ads, ${metaCsv.split('\n').length} rows`);

  // Generate UTM tracking CSV
  const utmCsv = generateUTMTrackingCSV(batch);
  const utmCsvPath = path.join(args.batchDir, 'utm_tracking.csv');
  fs.writeFileSync(utmCsvPath, utmCsv);
  console.log(`  ✅ UTM tracking CSV:  ${utmCsvPath}`);

  // Summary by template
  const byTemplate: Record<string, number> = {};
  for (const v of batch.variants) {
    const t = v.parameters.visual.template;
    byTemplate[t] = (byTemplate[t] || 0) + 1;
  }
  console.log('\n  📊 Breakdown:');
  for (const [template, count] of Object.entries(byTemplate)) {
    console.log(`     ${template}: ${count} variants`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📋 Next Steps:');
  console.log('  1. Open Meta Ads Manager → Bulk Upload');
  console.log(`  2. Upload ${metaCsvPath}`);
  console.log('  3. Upload creative files referenced in CSV');
  console.log(`  4. Keep ${utmCsvPath} for analytics tracking`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main();
