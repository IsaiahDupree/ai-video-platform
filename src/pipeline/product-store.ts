/**
 * Product & Campaign Store
 *
 * File-based persistence for products and campaigns.
 * Reads/writes JSON files in data/products/ and data/campaigns/.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BrandConfig } from './types';

// =============================================================================
// Types
// =============================================================================

export interface SceneConfig {
  beforePrompt: string;
  afterPrompt: string;
  characterStyle: 'realistic' | 'cartoon' | 'lifestyle' | 'minimal';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  brand: BrandConfig;
  scenes: SceneConfig;
  defaultMatrix: {
    templates?: string[];
    hookTypes?: string[];
    awarenessLevels?: string[];
    ctaTypes?: string[];
    strategy?: string;
    maxVariants?: number;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignInsights {
  bestTemplate?: string;
  bestHookType?: string;
  bestAwareness?: string;
  avgCtr?: number;
  avgRoas?: number;
  totalSpend?: number;
  totalConversions?: number;
}

export interface Campaign {
  id: string;
  name: string;
  productId: string;
  batches: string[];
  goal: 'ctr' | 'roas' | 'conversions';
  budget: { daily: number; total: number };
  status: 'draft' | 'active' | 'paused' | 'completed';
  insights: CampaignInsights;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Store
// =============================================================================

const DATA_DIR = process.env.UGC_DATA_DIR || './data';
const PRODUCTS_DIR = path.join(DATA_DIR, 'products');
const CAMPAIGNS_DIR = path.join(DATA_DIR, 'campaigns');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ── Products ──

export function listProducts(): Product[] {
  ensureDir(PRODUCTS_DIR);
  return fs.readdirSync(PRODUCTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(PRODUCTS_DIR, f), 'utf-8'));
      } catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getProduct(id: string): Product | null {
  const filePath = path.join(PRODUCTS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { return null; }
}

export function createProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  ensureDir(PRODUCTS_DIR);
  const now = new Date().toISOString();
  const product: Product = {
    ...input,
    id: generateId('prod'),
    createdAt: now,
    updatedAt: now,
  };
  fs.writeFileSync(
    path.join(PRODUCTS_DIR, `${product.id}.json`),
    JSON.stringify(product, null, 2)
  );
  return product;
}

export function updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | null {
  const existing = getProduct(id);
  if (!existing) return null;

  const updated: Product = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(PRODUCTS_DIR, `${id}.json`),
    JSON.stringify(updated, null, 2)
  );
  return updated;
}

export function deleteProduct(id: string): boolean {
  const filePath = path.join(PRODUCTS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

// ── Campaigns ──

export function listCampaigns(productId?: string): Campaign[] {
  ensureDir(CAMPAIGNS_DIR);
  let campaigns = fs.readdirSync(CAMPAIGNS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(CAMPAIGNS_DIR, f), 'utf-8'));
      } catch { return null; }
    })
    .filter(Boolean)
    .sort((a: Campaign, b: Campaign) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (productId) {
    campaigns = campaigns.filter((c: Campaign) => c.productId === productId);
  }
  return campaigns;
}

export function getCampaign(id: string): Campaign | null {
  const filePath = path.join(CAMPAIGNS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { return null; }
}

export function createCampaign(input: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'insights'>): Campaign {
  ensureDir(CAMPAIGNS_DIR);
  const now = new Date().toISOString();
  const campaign: Campaign = {
    ...input,
    id: generateId('camp'),
    insights: {},
    createdAt: now,
    updatedAt: now,
  };
  fs.writeFileSync(
    path.join(CAMPAIGNS_DIR, `${campaign.id}.json`),
    JSON.stringify(campaign, null, 2)
  );
  return campaign;
}

export function updateCampaign(id: string, updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>): Campaign | null {
  const existing = getCampaign(id);
  if (!existing) return null;

  const updated: Campaign = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(CAMPAIGNS_DIR, `${id}.json`),
    JSON.stringify(updated, null, 2)
  );
  return updated;
}

export function deleteCampaign(id: string): boolean {
  const filePath = path.join(CAMPAIGNS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

export function addBatchToCampaign(campaignId: string, batchId: string): Campaign | null {
  const campaign = getCampaign(campaignId);
  if (!campaign) return null;
  if (!campaign.batches.includes(batchId)) {
    campaign.batches.push(batchId);
  }
  return updateCampaign(campaignId, { batches: campaign.batches });
}

export function updateCampaignInsights(campaignId: string, insights: CampaignInsights): Campaign | null {
  return updateCampaign(campaignId, { insights });
}

// ── Cross-product insights ──

export function getCrossProductInsights(): {
  byHookType: Record<string, { avgCtr: number; count: number }>;
  byTemplate: Record<string, { avgCtr: number; count: number }>;
  byAwareness: Record<string, { avgCtr: number; count: number }>;
} {
  const campaigns = listCampaigns();
  const byHookType: Record<string, { totalCtr: number; count: number }> = {};
  const byTemplate: Record<string, { totalCtr: number; count: number }> = {};
  const byAwareness: Record<string, { totalCtr: number; count: number }> = {};

  for (const campaign of campaigns) {
    for (const batchId of campaign.batches) {
      const batchPath = path.join('./output/ugc-ads', batchId, 'batch.json');
      if (!fs.existsSync(batchPath)) continue;

      try {
        const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
        for (const variant of batch.variants || []) {
          const perf = variant.performance;
          if (!perf || !perf.ctr) continue;

          const hook = variant.parameters?.copy?.hookType;
          const template = variant.parameters?.visual?.template;
          const awareness = variant.parameters?.targeting?.awarenessLevel;

          if (hook) {
            if (!byHookType[hook]) byHookType[hook] = { totalCtr: 0, count: 0 };
            byHookType[hook].totalCtr += perf.ctr;
            byHookType[hook].count++;
          }
          if (template) {
            if (!byTemplate[template]) byTemplate[template] = { totalCtr: 0, count: 0 };
            byTemplate[template].totalCtr += perf.ctr;
            byTemplate[template].count++;
          }
          if (awareness) {
            if (!byAwareness[awareness]) byAwareness[awareness] = { totalCtr: 0, count: 0 };
            byAwareness[awareness].totalCtr += perf.ctr;
            byAwareness[awareness].count++;
          }
        }
      } catch { /* skip bad batch files */ }
    }
  }

  const toAvg = (m: Record<string, { totalCtr: number; count: number }>) =>
    Object.fromEntries(
      Object.entries(m).map(([k, v]) => [k, { avgCtr: v.count > 0 ? v.totalCtr / v.count : 0, count: v.count }])
    );

  return {
    byHookType: toAvg(byHookType),
    byTemplate: toAvg(byTemplate),
    byAwareness: toAvg(byAwareness),
  };
}
