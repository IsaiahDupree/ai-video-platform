/**
 * Custom Audience Types
 * META-007: Custom Audiences Setup
 *
 * Types for Meta custom audience management and syncing
 */

// Custom audience types
export type AudienceType = 'lookalike' | 'custom_list' | 'engagement';

export type AudienceStatus = 'pending' | 'syncing' | 'active' | 'failed';

export type SyncType = 'full' | 'incremental' | 'update';

// Custom audience definition
export interface CustomAudience {
  id: string;
  name: string;
  description?: string;

  // Meta integration
  meta_audience_id?: string;
  meta_business_account_id?: string;

  // Segment mapping
  segment_id?: string;

  // Audience configuration
  audience_type: AudienceType;
  lookalike_country?: string; // e.g., 'US', 'CA'
  lookalike_percentage?: number; // 1-10

  // Sync configuration
  auto_sync: boolean;
  sync_interval_hours: number;
  last_synced_at?: string;

  // Status
  is_active: boolean;
  status: AudienceStatus;
  total_synced: number;
  sync_error_message?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateCustomAudienceInput {
  name: string;
  description?: string;
  segment_id?: string;
  audience_type: AudienceType;
  lookalike_country?: string;
  lookalike_percentage?: number;
  auto_sync?: boolean;
  sync_interval_hours?: number;
  is_active?: boolean;
}

export interface UpdateCustomAudienceInput {
  name?: string;
  description?: string;
  audience_type?: AudienceType;
  lookalike_country?: string;
  lookalike_percentage?: number;
  auto_sync?: boolean;
  sync_interval_hours?: number;
  is_active?: boolean;
}

// Audience membership sync
export interface AudienceMemberSync {
  id: string;
  audience_id: string;
  person_id: string;
  is_synced: boolean;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAudienceMemberSyncInput {
  audience_id: string;
  person_id: string;
  is_synced?: boolean;
}

// Audience sync log
export interface AudienceSyncLog {
  id: string;
  audience_id: string;
  sync_type: SyncType;
  synced_count?: number;
  failed_count?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message?: string;
  started_at: string;
  completed_at?: string;
  meta_response?: Record<string, any>;
  created_at: string;
}

export interface CreateAudienceSyncLogInput {
  audience_id: string;
  sync_type: SyncType;
  synced_count?: number;
  failed_count?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message?: string;
  meta_response?: Record<string, any>;
}

// Audience metrics
export interface AudienceMetrics {
  total_members: number;
  synced_count: number;
  last_sync_date?: string;
  sync_status: AudienceStatus;
}

// Person data for audience export
export interface AudiencePersonData {
  person_id: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  country?: string;
  city?: string;
}

// Meta API types
export interface MetaCustomAudiencePayload {
  name: string;
  description?: string;
  subtype: 'CUSTOM' | 'LOOKALIKE';
  // For custom audiences
  customer_file_source?: 'USER_PROVIDED_ONLY' | 'PARTNER_PROVIDED_ONLY' | 'BOTH_USER_AND_PARTNER_PROVIDED';
  // For lookalike audiences
  lookalike_spec?: {
    type: 'REACH' | 'SIMILARITY';
    is_snapshot?: boolean;
    ratio?: number; // 1-10 for percentage
    starting_ratio?: number;
    country?: string;
  };
  opt_out_link?: string;
  rule?: Record<string, any>;
}

export interface MetaCustomAudienceResponse {
  id: string;
  name: string;
  description?: string;
  subtype: 'CUSTOM' | 'LOOKALIKE';
  operation_status?: string;
  approximate_count?: number;
}

export interface MetaCustomAudienceUploadPayload {
  audience_id: string;
  schema: string[]; // Field names: ['EMAIL', 'PHONE_NUMBER', 'FIRST_NAME', etc.]
  data: Array<Record<string, string>>;
  is_hashed: boolean;
}

// Sync result
export interface AudienceSyncResult {
  audience_id: string;
  synced_count: number;
  failed_count: number;
  sync_log_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

// Batch sync result
export interface BatchAudienceSyncResult {
  total_audiences: number;
  synced: number;
  failed: number;
  results: AudienceSyncResult[];
}

// Example audiences
export const EXAMPLE_AUDIENCES = {
  HIGH_VALUE_CUSTOMERS: {
    name: 'High Value Customers',
    description: 'Users with 10+ video renders',
    audience_type: 'custom_list' as AudienceType,
  },
  PRICING_VIEWERS: {
    name: 'Pricing Viewers Lookalike',
    description: 'Similar users to pricing page viewers',
    audience_type: 'lookalike' as AudienceType,
    lookalike_country: 'US',
    lookalike_percentage: 5,
  },
  RECENT_VISITORS: {
    name: 'Recent Website Visitors',
    description: 'Users active in the last 7 days',
    audience_type: 'engagement' as AudienceType,
  },
};
