/**
 * Conversion Optimization Types
 * META-008: Conversion Optimization
 *
 * Types for tracking and optimizing conversions
 */

export type ConversionType =
  | 'purchase'
  | 'signup'
  | 'video_render'
  | 'trial_start'
  | 'subscription'
  | 'custom';

export type ConversionSource = 'pixel' | 'capi' | 'webhook' | 'api';

export type OptimizationStatus =
  | 'pending'
  | 'optimizing'
  | 'optimized'
  | 'failed';

export type AttributionModel =
  | 'first_touch'
  | 'last_touch'
  | 'multi_touch'
  | 'time_decay';

// Conversion event
export interface ConversionEvent {
  id: string;
  person_id?: string;
  event_id?: string;

  // Conversion details
  conversion_type: ConversionType;
  conversion_source: ConversionSource;

  // Value
  value_cents?: number;
  currency: string;

  // Attribution
  campaign_id?: string;
  ad_set_id?: string;
  ad_id?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;

  // Device info
  device_type?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;

  // Properties
  properties?: Record<string, any>;

  // Meta optimization
  meta_pixel_id?: string;
  meta_conversion_id?: string;
  is_optimized: boolean;

  // Timestamps
  conversion_time: string;
  created_at: string;
}

export interface CreateConversionEventInput {
  person_id?: string;
  event_id?: string;
  conversion_type: ConversionType;
  conversion_source: ConversionSource;
  value_cents?: number;
  currency?: string;
  campaign_id?: string;
  ad_set_id?: string;
  ad_id?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  properties?: Record<string, any>;
}

// Conversion funnel
export interface ConversionFunnel {
  id: string;
  person_id: string;
  funnel_name: string;
  total_steps: number;
  completed_steps: number;
  completion_percentage: number;
  is_converted: boolean;
  converted_at?: string;
  total_time_seconds?: number;
  started_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConversionFunnelInput {
  person_id: string;
  funnel_name: string;
  total_steps: number;
}

// Funnel step
export interface FunnelStep {
  id: string;
  funnel_id: string;
  event_id?: string;
  step_number: number;
  step_name: string;
  expected_event_name?: string;
  is_completed: boolean;
  is_skipped: boolean;
  completed_at?: string;
  skipped_at?: string;
  duration_seconds?: number;
  created_at: string;
}

export interface CreateFunnelStepInput {
  funnel_id: string;
  step_number: number;
  step_name: string;
  expected_event_name?: string;
}

// Conversion optimization rule
export interface ConversionOptimizationRule {
  id: string;
  name: string;
  description?: string;
  trigger_event: string;
  trigger_type: 'event' | 'funnel' | 'audience';
  action_type: 'send_to_meta' | 'track_value' | 'create_audience';
  action_config: Record<string, any>;
  is_active: boolean;
  total_triggered: number;
  total_optimized: number;
  created_at: string;
  updated_at: string;
}

export interface CreateConversionOptimizationRuleInput {
  name: string;
  description?: string;
  trigger_event: string;
  trigger_type?: 'event' | 'funnel' | 'audience';
  action_type: 'send_to_meta' | 'track_value' | 'create_audience';
  action_config: Record<string, any>;
  is_active?: boolean;
}

// Conversion metrics
export interface ConversionMetrics {
  id: string;
  person_id?: string;
  campaign_id?: string;
  total_conversions: number;
  total_value_cents: number;
  average_value_cents?: number;
  conversion_rate?: number;
  repeat_customer_rate?: number;
  total_funnel_starts: number;
  total_funnel_completions: number;
  funnel_completion_rate?: number;
  average_funnel_time_seconds?: number;
  last_click_to_conversion_hours?: number;
  attribution_model?: AttributionModel;
  is_optimized: boolean;
  optimization_status: OptimizationStatus;
  period_date: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
}

// Funnel stats
export interface FunnelStats {
  funnel_name: string;
  total_started: number;
  total_converted: number;
  conversion_rate: number;
  average_time_seconds: number;
}

// Conversion summary
export interface ConversionSummary {
  total_conversions: number;
  total_revenue_cents: number;
  average_conversion_value: number;
  conversion_rate: number;
  top_conversion_sources: Array<{
    source: ConversionSource;
    count: number;
  }>;
  top_campaigns: Array<{
    campaign_id: string;
    conversions: number;
    revenue_cents: number;
  }>;
  funnels: FunnelStats[];
}

// Meta optimization config
export interface MetaConversionOptimizationConfig {
  pixel_id: string;
  access_token: string;
  conversion_events: ConversionType[];
  auto_optimize: boolean;
  optimization_goal: 'conversions' | 'value' | 'engagement';
  currency: string;
}

// Optimization result
export interface OptimizationResult {
  conversion_id: string;
  optimized: boolean;
  status: OptimizationStatus;
  meta_conversion_id?: string;
  error?: string;
}

// Batch optimization result
export interface BatchOptimizationResult {
  total_conversions: number;
  optimized_count: number;
  failed_count: number;
  results: OptimizationResult[];
}
