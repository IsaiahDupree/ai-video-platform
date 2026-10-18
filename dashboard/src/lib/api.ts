/**
 * API client for the UGC Ad Pipeline server (port 3100)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'dev-api-key';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json();
}

// ── Types ──

export interface AdVariant {
  id: string;
  batchId: string;
  variantIndex: number;
  parameters: {
    visual: { template: string; colorScheme: string; characterStyle: string };
    copy: { hookType: string; headline: string; subheadline: string; ctaType: string; ctaText: string };
    targeting: { awarenessLevel: string };
    structure: { hasBadge: boolean; hasTrustLine: boolean };
  };
  assets: {
    beforeImagePath?: string;
    afterImagePath?: string;
    videoPath?: string;
    composedPaths: Record<string, string>;
    videoPaths?: Record<string, string>;
  };
  utmParams: Record<string, string>;
  performance?: {
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    spend: number;
    conversions: number;
    roas: number;
  };
  status: string;
  createdAt: string;
}

export interface AdBatch {
  id: string;
  productId: string;
  campaignId: string;
  variants: AdVariant[];
  totalVariants: number;
  performance?: {
    totalSpend: number;
    totalConversions: number;
    overallRoas: number;
    overallCtr: number;
  };
  status: string;
  createdAt: string;
}

export interface BatchSummary {
  id: string;
  variantCount: number;
  templates: string[];
  status: string;
  createdAt: string;
  hasPerformance: boolean;
}

export interface PipelineRequest {
  product: string;
  description: string;
  brandName: string;
  primaryColor: string;
  accentColor: string;
  templates: string[];
  maxVariants: number;
  strategy: string;
  dryRun: boolean;
  autoCopy: boolean;
  renderVideo: boolean;
}

export interface OptimizationReport {
  batchId: string;
  parameterScores: Record<string, { value: string; compositeScore: number; rank: number; metrics: Record<string, number> }[]>;
  recommendations: string[];
}

// ── API Methods ──

export async function listBatches(): Promise<BatchSummary[]> {
  const data = await apiFetch<{ batches: any[]; total: number }>('/api/v1/ugc/batches');
  return (data.batches || []).map((b) => ({
    id: b.id,
    variantCount: b.totalVariants || 0,
    templates: b.templates || [],
    status: b.status || 'unknown',
    createdAt: b.createdAt || '',
    hasPerformance: !!b.hasReport,
  }));
}

export async function getBatch(id: string): Promise<AdBatch> {
  const data = await apiFetch<{ batch: AdBatch; report: unknown }>(`/api/v1/ugc/batches/${id}`);
  return data.batch;
}

export async function triggerPipeline(request: PipelineRequest): Promise<{ batchId: string; status: string }> {
  return apiFetch('/api/v1/ugc/generate', { method: 'POST', body: JSON.stringify(request) });
}

export async function optimizeBatch(batchId: string): Promise<OptimizationReport> {
  return apiFetch('/api/v1/ugc/optimize', { method: 'POST', body: JSON.stringify({ batchId }) });
}

export async function getBatchGallery(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/ugc/batches/${id}/gallery`, {
    headers: { 'x-api-key': API_KEY },
  });
  return res.text();
}

export async function getCapabilities(): Promise<Record<string, unknown>> {
  return apiFetch('/api/v1/capabilities');
}

export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch('/health');
}

// ── Products & Campaigns (Phase 3) ──

export interface Product {
  id: string;
  name: string;
  description: string;
  brand: { name: string; primaryColor: string; accentColor: string; fontFamily?: string; logoUrl?: string };
  scenes: { beforePrompt: string; afterPrompt: string; characterStyle: string };
  defaultMatrix: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  productId: string;
  batches: string[];
  goal: 'ctr' | 'roas' | 'conversions';
  budget: { daily: number; total: number };
  status: 'draft' | 'active' | 'paused' | 'completed';
  insights: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export async function listProducts(): Promise<Product[]> {
  const data = await apiFetch<{ products: Product[] }>('/api/v1/products');
  return data.products || [];
}

export async function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/v1/products/${id}`);
}

export async function createProduct(input: Partial<Product>): Promise<Product> {
  return apiFetch<Product>('/api/v1/products', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateProduct(id: string, input: Partial<Product>): Promise<Product> {
  return apiFetch<Product>(`/api/v1/products/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/api/v1/products/${id}`, { method: 'DELETE' });
}

export async function listCampaigns(productId?: string): Promise<Campaign[]> {
  const qs = productId ? `?productId=${productId}` : '';
  const data = await apiFetch<{ campaigns: Campaign[] }>(`/api/v1/campaigns${qs}`);
  return data.campaigns || [];
}

export async function getCampaign(id: string): Promise<Campaign> {
  return apiFetch<Campaign>(`/api/v1/campaigns/${id}`);
}

export async function createCampaign(input: Partial<Campaign>): Promise<Campaign> {
  return apiFetch<Campaign>('/api/v1/campaigns', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateCampaign(id: string, input: Partial<Campaign>): Promise<Campaign> {
  return apiFetch<Campaign>(`/api/v1/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function deleteCampaign(id: string): Promise<void> {
  await apiFetch(`/api/v1/campaigns/${id}`, { method: 'DELETE' });
}

export async function addBatchToCampaign(campaignId: string, batchId: string): Promise<Campaign> {
  return apiFetch<Campaign>(`/api/v1/campaigns/${campaignId}/batches`, { method: 'POST', body: JSON.stringify({ batchId }) });
}

export async function getCrossProductInsights(): Promise<Record<string, unknown>> {
  return apiFetch('/api/v1/insights');
}

export { API_BASE };
