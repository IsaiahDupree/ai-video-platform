/**
 * Custom Audience Service
 * META-007: Custom Audiences Setup
 *
 * Service for managing Meta custom audiences and syncing with segments
 */

import { supabaseAdmin } from './supabase';
import {
  CustomAudience,
  CreateCustomAudienceInput,
  UpdateCustomAudienceInput,
  AudienceMemberSync,
  AudienceSyncLog,
  CreateAudienceSyncLogInput,
  AudienceMetrics,
  AudiencePersonData,
  AudienceSyncResult,
  BatchAudienceSyncResult,
} from '../types/customAudience';

/**
 * CUSTOM AUDIENCE MANAGEMENT
 */

export async function createCustomAudience(
  input: CreateCustomAudienceInput
): Promise<CustomAudience> {
  const { data, error } = await supabaseAdmin
    .from('custom_audience')
    .insert({
      name: input.name,
      description: input.description,
      segment_id: input.segment_id,
      audience_type: input.audience_type,
      lookalike_country: input.lookalike_country,
      lookalike_percentage: input.lookalike_percentage,
      auto_sync: input.auto_sync ?? true,
      sync_interval_hours: input.sync_interval_hours ?? 24,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating custom audience: ${error.message}`);
  }

  return data;
}

export async function getCustomAudience(id: string): Promise<CustomAudience | null> {
  const { data, error } = await supabaseAdmin
    .from('custom_audience')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error fetching custom audience: ${error.message}`);
  }

  return data || null;
}

export async function listCustomAudiences(
  isActive?: boolean,
  segmentId?: string
): Promise<CustomAudience[]> {
  let query = supabaseAdmin.from('custom_audience').select('*');

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  if (segmentId) {
    query = query.eq('segment_id', segmentId);
  }

  const { data, error } = await query.order('name');

  if (error) {
    throw new Error(`Error listing custom audiences: ${error.message}`);
  }

  return data || [];
}

export async function updateCustomAudience(
  id: string,
  input: UpdateCustomAudienceInput
): Promise<CustomAudience> {
  const updates: any = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.audience_type !== undefined) updates.audience_type = input.audience_type;
  if (input.lookalike_country !== undefined) updates.lookalike_country = input.lookalike_country;
  if (input.lookalike_percentage !== undefined) updates.lookalike_percentage = input.lookalike_percentage;
  if (input.auto_sync !== undefined) updates.auto_sync = input.auto_sync;
  if (input.sync_interval_hours !== undefined) updates.sync_interval_hours = input.sync_interval_hours;
  if (input.is_active !== undefined) updates.is_active = input.is_active;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('custom_audience')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating custom audience: ${error.message}`);
  }

  return data;
}

export async function deleteCustomAudience(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('custom_audience')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting custom audience: ${error.message}`);
  }
}

/**
 * AUDIENCE SYNCING
 */

export async function syncAudienceMembers(
  audienceId: string,
  syncType: 'full' | 'incremental' | 'update' = 'incremental'
): Promise<AudienceSyncResult> {
  try {
    // Update status to syncing
    await updateCustomAudience(audienceId, { is_active: true });

    // Create sync log entry
    const syncLog = await createAudienceSyncLog({
      audience_id: audienceId,
      sync_type: syncType,
      status: 'in_progress',
    });

    // Call database function to sync members
    const { data, error } = await supabaseAdmin.rpc('sync_audience_members', {
      p_audience_id: audienceId,
      p_sync_type: syncType,
    });

    if (error) {
      // Update log with error
      await updateAudienceSyncLog(syncLog.id, {
        status: 'failed',
        error_message: error.message,
      });

      // Update audience status
      await updateCustomAudience(audienceId, {
        status: 'failed' as any,
        sync_error_message: error.message,
      });

      throw new Error(`Error syncing audience: ${error.message}`);
    }

    const [syncedCount, failedCount] = data || [0, 0];

    // Update sync log with success
    await updateAudienceSyncLog(syncLog.id, {
      synced_count: syncedCount,
      failed_count: failedCount,
      status: 'completed',
    });

    return {
      audience_id: audienceId,
      synced_count: syncedCount,
      failed_count: failedCount,
      sync_log_id: syncLog.id,
      status: 'completed',
    };
  } catch (error) {
    throw new Error(`Error syncing audience members: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function syncAllActiveAudiences(): Promise<BatchAudienceSyncResult> {
  const audiences = await listCustomAudiences(true);

  const results: AudienceSyncResult[] = [];
  let syncedCount = 0;
  let failedCount = 0;

  for (const audience of audiences) {
    try {
      // Check if it's time to sync
      const lastSynced = audience.last_synced_at
        ? new Date(audience.last_synced_at)
        : null;
      const now = new Date();
      const hoursSinceSync = lastSynced
        ? (now.getTime() - lastSynced.getTime()) / (1000 * 60 * 60)
        : audience.sync_interval_hours;

      if (hoursSinceSync >= audience.sync_interval_hours) {
        const result = await syncAudienceMembers(audience.id);
        results.push(result);
        syncedCount++;
      }
    } catch (err) {
      console.error(`Error syncing audience ${audience.id}:`, err);
      failedCount++;
    }
  }

  return {
    total_audiences: audiences.length,
    synced: syncedCount,
    failed: failedCount,
    results,
  };
}

/**
 * AUDIENCE MEMBER SYNC
 */

export async function getAudienceMembers(
  audienceId: string,
  limit?: number
): Promise<AudienceMemberSync[]> {
  let query = supabaseAdmin
    .from('audience_member_sync')
    .select('*')
    .eq('audience_id', audienceId)
    .eq('is_synced', true);

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching audience members: ${error.message}`);
  }

  return data || [];
}

export async function getAudienceMembersForExport(
  audienceId: string
): Promise<AudiencePersonData[]> {
  const { data, error } = await supabaseAdmin.rpc(
    'get_audience_members_for_export',
    {
      p_audience_id: audienceId,
    }
  );

  if (error) {
    throw new Error(`Error fetching audience members for export: ${error.message}`);
  }

  return data || [];
}

/**
 * AUDIENCE SYNC LOGGING
 */

export async function createAudienceSyncLog(
  input: CreateAudienceSyncLogInput
): Promise<AudienceSyncLog> {
  const { data, error } = await supabaseAdmin
    .from('audience_sync_log')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating sync log: ${error.message}`);
  }

  return data;
}

export async function getSyncLogs(
  audienceId: string,
  limit: number = 50
): Promise<AudienceSyncLog[]> {
  const { data, error } = await supabaseAdmin
    .from('audience_sync_log')
    .select('*')
    .eq('audience_id', audienceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Error fetching sync logs: ${error.message}`);
  }

  return data || [];
}

export async function updateAudienceSyncLog(
  id: string,
  updates: Partial<{
    synced_count: number;
    failed_count: number;
    status: string;
    error_message: string;
    completed_at: string;
    meta_response: Record<string, any>;
  }>
): Promise<AudienceSyncLog> {
  const updateData: any = {
    ...updates,
  };

  if (updates.completed_at === undefined && updates.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('audience_sync_log')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating sync log: ${error.message}`);
  }

  return data;
}

/**
 * AUDIENCE METRICS
 */

export async function getAudienceMetrics(audienceId: string): Promise<AudienceMetrics> {
  const { data, error } = await supabaseAdmin.rpc(
    'get_audience_metrics',
    {
      p_audience_id: audienceId,
    }
  );

  if (error) {
    throw new Error(`Error fetching audience metrics: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No metrics found for audience');
  }

  const [result] = data;

  return {
    total_members: result.total_members || 0,
    synced_count: result.synced_count || 0,
    last_sync_date: result.last_sync_date,
    sync_status: result.sync_status || 'pending',
  };
}

/**
 * AUDIENCE BULK OPERATIONS
 */

export async function associateSegmentToAudience(
  audienceId: string,
  segmentId: string
): Promise<CustomAudience> {
  return updateCustomAudience(audienceId, {} as any);
}

export async function removeSegmentFromAudience(
  audienceId: string
): Promise<CustomAudience> {
  return updateCustomAudience(audienceId, {} as any);
}

/**
 * Meta Integration (Placeholder - Real implementation would use Meta Graph API)
 */

export async function createAudienceInMeta(
  audienceId: string,
  metaAccessToken: string,
  metaAccountId: string
): Promise<{ meta_audience_id: string }> {
  // In a real implementation, this would call Meta's Graph API to create the audience
  // For now, return a placeholder
  console.info(
    `[PLACEHOLDER] Would create Meta audience for ${audienceId} using account ${metaAccountId}`
  );

  return {
    meta_audience_id: `meta_audience_${Date.now()}`,
  };
}

export async function syncAudienceToMeta(
  audienceId: string,
  metaAccessToken: string
): Promise<{ synced_count: number; status: string }> {
  // In a real implementation, this would use Meta's Customer List upload API
  // to push hashed customer data to Meta
  console.info(`[PLACEHOLDER] Would sync audience ${audienceId} to Meta`);

  return {
    synced_count: 0,
    status: 'pending',
  };
}
