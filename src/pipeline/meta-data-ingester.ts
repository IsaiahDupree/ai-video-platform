/**
 * Meta Ads Data Ingester
 *
 * Parses Meta Ads Manager CSV exports and maps performance data
 * back to parametric variant IDs for scoring.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { MetaAdPerformance, AdVariant, AdBatch } from './types';
import { decodeVariantId } from './variant-generator';

// =============================================================================
// CSV Column Mapping
// =============================================================================

const META_CSV_COLUMNS: Record<string, string> = {
  'Campaign name': 'campaignName',
  'Ad set name': 'adSetName',
  'Ad name': 'adName',
  'Impressions': 'impressions',
  'Link clicks': 'clicks',
  'CTR (link click-through rate)': 'ctr',
  'CPC (cost per link click)': 'cpc',
  'CPM (cost per 1,000 impressions)': 'cpm',
  'Amount spent': 'spend',
  'Results': 'conversions',
  'Cost per result': 'costPerConversion',
  'Video plays': 'videoViews',
  'ThruPlays': 'thruPlays',
  'Reach': 'reach',
  'Frequency': 'frequency',
  'Reporting starts': 'dateStart',
  'Reporting ends': 'dateEnd',
  'Placement': 'placement',
  'Platform': 'platform',
};

// =============================================================================
// CSV Parser
// =============================================================================

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const mappedKey = META_CSV_COLUMNS[header] || header;
      row[mappedKey] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

// =============================================================================
// Data Ingestion
// =============================================================================

function parseNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[$,%]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function rowToPerformance(row: Record<string, string>): MetaAdPerformance | null {
  const adName = row['adName'] || '';
  if (!adName) return null;

  const impressions = parseNumber(row['impressions']);
  const clicks = parseNumber(row['clicks']);
  const spend = parseNumber(row['spend']);
  const conversions = parseNumber(row['conversions']);
  const videoViews = parseNumber(row['videoViews']);
  const thruPlays = parseNumber(row['thruPlays']);

  return {
    adId: adName,
    adName,
    utmContent: adName, // Our variant ID is used as the ad name
    impressions,
    clicks,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : parseNumber(row['ctr']),
    cpc: clicks > 0 ? spend / clicks : parseNumber(row['cpc']),
    cpm: impressions > 0 ? (spend / impressions) * 1000 : parseNumber(row['cpm']),
    spend,
    conversions,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
    roas: spend > 0 ? conversions / spend : 0, // Simplified; real ROAS needs revenue
    costPerConversion: conversions > 0 ? spend / conversions : parseNumber(row['costPerConversion']),
    videoViews,
    videoViewRate: impressions > 0 ? (videoViews / impressions) * 100 : 0,
    avgWatchTime: 0, // Not in standard CSV export
    thruplayRate: videoViews > 0 ? (thruPlays / videoViews) * 100 : 0,
    dateRange: {
      start: row['dateStart'] || '',
      end: row['dateEnd'] || '',
    },
    placement: row['placement'] || 'feed',
    platform: row['platform'] || 'instagram',
  };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Ingest Meta Ads CSV and return performance data mapped to variant IDs
 */
export function ingestMetaCSV(csvPath: string): MetaAdPerformance[] {
  console.log(`📊 Ingesting Meta data from: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);

  console.log(`   Parsed ${rows.length} rows`);

  const performances: MetaAdPerformance[] = [];

  for (const row of rows) {
    const perf = rowToPerformance(row);
    if (perf && perf.impressions > 0) {
      // Verify this matches a known variant ID format
      const decoded = decodeVariantId(perf.adName);
      if (decoded) {
        performances.push(perf);
      } else {
        // Try to match by utm_content or partial name
        performances.push(perf);
      }
    }
  }

  console.log(`   Matched ${performances.length} ad performances`);
  return performances;
}

/**
 * Merge performance data into a batch's variants
 */
export function mergePerformanceIntoBatch(
  batch: AdBatch,
  performances: MetaAdPerformance[]
): AdBatch {
  const perfMap = new Map<string, MetaAdPerformance>();
  for (const perf of performances) {
    perfMap.set(perf.adName, perf);
    perfMap.set(perf.utmContent, perf);
  }

  let matched = 0;
  for (const variant of batch.variants) {
    const perf = perfMap.get(variant.id) || perfMap.get(variant.utmParams.utm_content);
    if (perf) {
      variant.performance = perf;
      matched++;
    }
  }

  // Compute batch-level performance
  const withPerf = batch.variants.filter(v => v.performance);
  if (withPerf.length > 0) {
    batch.performance = {
      totalSpend: withPerf.reduce((sum, v) => sum + (v.performance?.spend || 0), 0),
      totalConversions: withPerf.reduce((sum, v) => sum + (v.performance?.conversions || 0), 0),
      overallRoas: 0,
      overallCtr: 0,
      dateRange: {
        start: performances[0]?.dateRange.start || '',
        end: performances[performances.length - 1]?.dateRange.end || '',
      },
    };

    const totalImpressions = withPerf.reduce((sum, v) => sum + (v.performance?.impressions || 0), 0);
    const totalClicks = withPerf.reduce((sum, v) => sum + (v.performance?.clicks || 0), 0);
    batch.performance.overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    batch.performance.overallRoas = batch.performance.totalSpend > 0
      ? batch.performance.totalConversions / batch.performance.totalSpend
      : 0;
  }

  console.log(`   Merged performance data: ${matched}/${batch.variants.length} variants matched`);
  batch.status = 'analyzed';

  return batch;
}

/**
 * Load a batch from its JSON file
 */
export function loadBatch(batchPath: string): AdBatch {
  if (!fs.existsSync(batchPath)) {
    throw new Error(`Batch file not found: ${batchPath}`);
  }
  return JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
}

/**
 * Save a batch to its JSON file
 */
export function saveBatch(batch: AdBatch, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(batch, null, 2));
}
