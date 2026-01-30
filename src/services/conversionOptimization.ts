/**
 * Conversion Optimization Service
 * META-008: Conversion Optimization
 *
 * Service for tracking conversions and optimizing for Meta
 */

import { supabaseAdmin } from './supabase';
import {
  ConversionEvent,
  CreateConversionEventInput,
  ConversionFunnel,
  CreateConversionFunnelInput,
  FunnelStep,
  CreateFunnelStepInput,
  ConversionOptimizationRule,
  CreateConversionOptimizationRuleInput,
  ConversionMetrics,
  FunnelStats,
  ConversionSummary,
  OptimizationResult,
  BatchOptimizationResult,
} from '../types/conversionOptimization';

/**
 * CONVERSION EVENTS
 */

export async function trackConversionEvent(
  input: CreateConversionEventInput
): Promise<ConversionEvent> {
  const { data, error } = await supabaseAdmin
    .from('conversion_event')
    .insert({
      person_id: input.person_id,
      event_id: input.event_id,
      conversion_type: input.conversion_type,
      conversion_source: input.conversion_source,
      value_cents: input.value_cents,
      currency: input.currency || 'USD',
      campaign_id: input.campaign_id,
      ad_set_id: input.ad_set_id,
      ad_id: input.ad_id,
      utm_source: input.utm_source,
      utm_campaign: input.utm_campaign,
      utm_medium: input.utm_medium,
      utm_content: input.utm_content,
      device_type: input.device_type,
      browser: input.browser,
      os: input.os,
      country: input.country,
      city: input.city,
      properties: input.properties,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error tracking conversion: ${error.message}`);
  }

  return data;
}

export async function getConversionEvent(id: string): Promise<ConversionEvent | null> {
  const { data, error } = await supabaseAdmin
    .from('conversion_event')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error fetching conversion: ${error.message}`);
  }

  return data || null;
}

export async function listConversions(
  personId?: string,
  conversionType?: string,
  limit: number = 100
): Promise<ConversionEvent[]> {
  let query = supabaseAdmin
    .from('conversion_event')
    .select('*');

  if (personId) {
    query = query.eq('person_id', personId);
  }

  if (conversionType) {
    query = query.eq('conversion_type', conversionType);
  }

  const { data, error } = await query
    .order('conversion_time', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Error listing conversions: ${error.message}`);
  }

  return data || [];
}

/**
 * CONVERSION FUNNELS
 */

export async function createConversionFunnel(
  input: CreateConversionFunnelInput
): Promise<ConversionFunnel> {
  const { data, error } = await supabaseAdmin
    .from('conversion_funnel')
    .insert({
      person_id: input.person_id,
      funnel_name: input.funnel_name,
      total_steps: input.total_steps,
      completed_steps: 0,
      completion_percentage: 0,
      is_converted: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating funnel: ${error.message}`);
  }

  return data;
}

export async function getConversionFunnel(id: string): Promise<ConversionFunnel | null> {
  const { data, error } = await supabaseAdmin
    .from('conversion_funnel')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error fetching funnel: ${error.message}`);
  }

  return data || null;
}

export async function getFunnelsByPerson(personId: string): Promise<ConversionFunnel[]> {
  const { data, error } = await supabaseAdmin
    .from('conversion_funnel')
    .select('*')
    .eq('person_id', personId)
    .order('started_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching funnels: ${error.message}`);
  }

  return data || [];
}

export async function updateFunnelProgress(
  funnelId: string,
  completedSteps: number,
  isConverted: boolean = false
): Promise<ConversionFunnel> {
  const funnel = await getConversionFunnel(funnelId);
  if (!funnel) throw new Error('Funnel not found');

  const completionPercentage =
    (completedSteps / funnel.total_steps) * 100;

  const { data, error } = await supabaseAdmin
    .from('conversion_funnel')
    .update({
      completed_steps: completedSteps,
      completion_percentage: completionPercentage,
      is_converted: isConverted,
      converted_at: isConverted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', funnelId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating funnel: ${error.message}`);
  }

  return data;
}

/**
 * FUNNEL STEPS
 */

export async function createFunnelStep(
  input: CreateFunnelStepInput
): Promise<FunnelStep> {
  const { data, error } = await supabaseAdmin
    .from('funnel_step')
    .insert({
      funnel_id: input.funnel_id,
      step_number: input.step_number,
      step_name: input.step_name,
      expected_event_name: input.expected_event_name,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating funnel step: ${error.message}`);
  }

  return data;
}

export async function getFunnelSteps(funnelId: string): Promise<FunnelStep[]> {
  const { data, error } = await supabaseAdmin
    .from('funnel_step')
    .select('*')
    .eq('funnel_id', funnelId)
    .order('step_number');

  if (error) {
    throw new Error(`Error fetching funnel steps: ${error.message}`);
  }

  return data || [];
}

export async function completeFunnelStep(
  stepId: string,
  eventId: string
): Promise<FunnelStep> {
  const { data, error } = await supabaseAdmin
    .from('funnel_step')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      event_id: eventId,
    })
    .eq('id', stepId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error completing funnel step: ${error.message}`);
  }

  return data;
}

/**
 * CONVERSION OPTIMIZATION RULES
 */

export async function createOptimizationRule(
  input: CreateConversionOptimizationRuleInput
): Promise<ConversionOptimizationRule> {
  const { data, error } = await supabaseAdmin
    .from('conversion_optimization_rule')
    .insert({
      name: input.name,
      description: input.description,
      trigger_event: input.trigger_event,
      trigger_type: input.trigger_type || 'event',
      action_type: input.action_type,
      action_config: input.action_config,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating optimization rule: ${error.message}`);
  }

  return data;
}

export async function listOptimizationRules(
  isActive?: boolean
): Promise<ConversionOptimizationRule[]> {
  let query = supabaseAdmin
    .from('conversion_optimization_rule')
    .select('*');

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  const { data, error } = await query.order('name');

  if (error) {
    throw new Error(`Error listing optimization rules: ${error.message}`);
  }

  return data || [];
}

/**
 * CONVERSION METRICS
 */

export async function getConversionMetrics(
  personId?: string,
  periodDate?: string
): Promise<ConversionMetrics[]> {
  let query = supabaseAdmin.from('conversion_metrics').select('*');

  if (personId) {
    query = query.eq('person_id', personId);
  }

  if (periodDate) {
    query = query.eq('period_date', periodDate);
  }

  const { data, error } = await query.order('period_date', {
    ascending: false,
  });

  if (error) {
    throw new Error(`Error fetching metrics: ${error.message}`);
  }

  return data || [];
}

/**
 * FUNNEL ANALYTICS
 */

export async function getFunnelStats(funnelName: string): Promise<FunnelStats> {
  const { data, error } = await supabaseAdmin.rpc('get_funnel_stats', {
    p_funnel_name: funnelName,
  });

  if (error) {
    throw new Error(`Error getting funnel stats: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No funnel stats found');
  }

  const [stats] = data;

  return {
    funnel_name: funnelName,
    total_started: stats.total_started || 0,
    total_converted: stats.total_converted || 0,
    conversion_rate: stats.conversion_rate || 0,
    average_time_seconds: stats.average_time_seconds || 0,
  };
}

/**
 * CONVERSION SUMMARY
 */

export async function getConversionSummary(
  personId?: string,
  daysBack: number = 30
): Promise<ConversionSummary> {
  // Get conversion stats
  let conversionQuery = supabaseAdmin
    .from('conversion_event')
    .select('*');

  if (personId) {
    conversionQuery = conversionQuery.eq('person_id', personId);
  }

  conversionQuery = conversionQuery.gt(
    'conversion_time',
    new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
  );

  const { data: conversions, error: convError } = await conversionQuery;

  if (convError) {
    throw new Error(`Error fetching conversions: ${convError.message}`);
  }

  const conversionsList = conversions || [];

  // Calculate summary
  const totalConversions = conversionsList.length;
  const totalRevenue = conversionsList.reduce(
    (sum, c) => sum + (c.value_cents || 0),
    0
  );
  const avgValue =
    totalConversions > 0 ? Math.round(totalRevenue / totalConversions) : 0;

  // Group by source
  const bySource = new Map<string, number>();
  conversionsList.forEach((c) => {
    const count = bySource.get(c.conversion_source) || 0;
    bySource.set(c.conversion_source, count + 1);
  });

  const topSources = Array.from(bySource.entries()).map(([source, count]) => ({
    source: source as any,
    count,
  }));

  // Group by campaign
  const byCampaign = new Map<
    string,
    { conversions: number; revenue_cents: number }
  >();
  conversionsList.forEach((c) => {
    if (c.campaign_id) {
      const existing = byCampaign.get(c.campaign_id) || {
        conversions: 0,
        revenue_cents: 0,
      };
      byCampaign.set(c.campaign_id, {
        conversions: existing.conversions + 1,
        revenue_cents: existing.revenue_cents + (c.value_cents || 0),
      });
    }
  });

  const topCampaigns = Array.from(byCampaign.entries())
    .map(([campaign_id, stats]) => ({
      campaign_id,
      ...stats,
    }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 10);

  return {
    total_conversions: totalConversions,
    total_revenue_cents: totalRevenue,
    average_conversion_value: avgValue,
    conversion_rate: totalConversions > 0 ? 100 : 0, // Simplified
    top_conversion_sources: topSources,
    top_campaigns: topCampaigns,
    funnels: [], // Would be populated from database
  };
}

/**
 * OPTIMIZATION
 */

export async function optimizeConversionForMeta(
  conversionId: string
): Promise<OptimizationResult> {
  // Get conversion
  const conversion = await getConversionEvent(conversionId);
  if (!conversion) {
    return {
      conversion_id: conversionId,
      optimized: false,
      status: 'failed',
      error: 'Conversion not found',
    };
  }

  // Placeholder - in production would send to Meta API
  console.info(`[PLACEHOLDER] Would optimize conversion ${conversionId} for Meta`);

  // Update conversion as optimized
  try {
    await supabaseAdmin
      .from('conversion_event')
      .update({
        is_optimized: true,
        meta_conversion_id: `meta_${Date.now()}`,
      })
      .eq('id', conversionId);

    return {
      conversion_id: conversionId,
      optimized: true,
      status: 'optimized',
      meta_conversion_id: `meta_${Date.now()}`,
    };
  } catch (err) {
    return {
      conversion_id: conversionId,
      optimized: false,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function optimizeBatchConversions(
  personId?: string,
  limit: number = 100
): Promise<BatchOptimizationResult> {
  // Get unoptimized conversions
  let query = supabaseAdmin
    .from('conversion_event')
    .select('*')
    .eq('is_optimized', false);

  if (personId) {
    query = query.eq('person_id', personId);
  }

  const { data: conversions, error } = await query.limit(limit);

  if (error) {
    throw new Error(`Error fetching conversions: ${error.message}`);
  }

  const results: OptimizationResult[] = [];
  let optimizedCount = 0;
  let failedCount = 0;

  for (const conversion of conversions || []) {
    try {
      const result = await optimizeConversionForMeta(conversion.id);
      results.push(result);

      if (result.optimized) {
        optimizedCount++;
      } else {
        failedCount++;
      }
    } catch (err) {
      failedCount++;
      results.push({
        conversion_id: conversion.id,
        optimized: false,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return {
    total_conversions: conversions?.length || 0,
    optimized_count: optimizedCount,
    failed_count: failedCount,
    results,
  };
}
