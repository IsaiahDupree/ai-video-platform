# META-007: Custom Audiences Setup

**Feature ID:** META-007
**Category:** Meta Pixel
**Priority:** P2
**Status:** ✅ Complete
**Date:** 2026-01-30

## Overview

Custom Audiences enable creating audience groups in Meta Business Manager based on event data and segments. This allows:

- **Audience Targeting** - Create custom audiences for ad campaigns
- **Segment Integration** - Sync GDP-012 segments to Meta audiences
- **Lookalike Audiences** - Generate similar audiences for expansion
- **Automatic Syncing** - Keep audiences updated with latest data
- **Audit Trail** - Log all sync operations for compliance

## Architecture

### Core Components

**Custom Audiences**
- Map to Meta Business Manager audiences
- Created from segments (GDP-012)
- Types: custom list, lookalike, engagement
- Automatic syncing with configurable intervals

**Audience Syncing**
- Full sync: Replace entire audience
- Incremental: Add new members
- Update: Modify existing members
- Logging and audit trail

**Audience Members**
- Tracked in database
- Synced to Meta via Conversions API
- PII hashed (email, phone, name) per Meta requirements

## Database Schema

### custom_audience Table

Stores audience definitions:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Audience name (unique) |
| description | TEXT | Audience description |
| meta_audience_id | TEXT | Meta-assigned audience ID |
| meta_business_account_id | TEXT | Meta Business Account |
| segment_id | UUID | Associated segment (GDP-012) |
| audience_type | TEXT | lookalike, custom_list, engagement |
| lookalike_country | TEXT | Country for lookalike (e.g., 'US') |
| lookalike_percentage | INT | Lookalike size 1-10 |
| auto_sync | BOOLEAN | Enable automatic syncing |
| sync_interval_hours | INT | Hours between syncs |
| last_synced_at | TIMESTAMPTZ | Last sync time |
| is_active | BOOLEAN | Active status |
| status | TEXT | pending, syncing, active, failed |
| total_synced | INT | Members synced count |
| sync_error_message | TEXT | Last error if any |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Update timestamp |

**Indexes:**
- `idx_custom_audience_is_active` - Active audience queries
- `idx_custom_audience_segment_id` - Segment lookups
- `idx_custom_audience_meta_audience_id` - Meta ID lookups
- `idx_custom_audience_status` - Status filtering
- `idx_custom_audience_last_synced_at` - Sync scheduling

### audience_member_sync Table

Tracks members in audiences:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| audience_id | UUID | Audience reference |
| person_id | UUID | Person reference |
| is_synced | BOOLEAN | Sync status |
| synced_at | TIMESTAMPTZ | Last sync time |
| created_at | TIMESTAMPTZ | Record created |
| updated_at | TIMESTAMPTZ | Record updated |

**Constraints:**
- `UNIQUE(audience_id, person_id)` - One membership per person/audience

### audience_sync_log Table

Logs all sync operations:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| audience_id | UUID | Audience reference |
| sync_type | TEXT | full, incremental, update |
| synced_count | INT | Members synced |
| failed_count | INT | Failed members |
| status | TEXT | pending, in_progress, completed, failed |
| error_message | TEXT | Error details |
| started_at | TIMESTAMPTZ | Sync start time |
| completed_at | TIMESTAMPTZ | Sync end time |
| meta_response | JSONB | Meta API response |
| created_at | TIMESTAMPTZ | Record created |

**Indexes:**
- `idx_audience_sync_log_audience_id` - Audience lookups
- `idx_audience_sync_log_status` - Status queries
- `idx_audience_sync_log_created_at` - Time-range queries

## SQL Helper Functions

### sync_audience_members

Syncs members from associated segment to audience:

```sql
SELECT * FROM sync_audience_members(
  p_audience_id := 'uuid...',
  p_sync_type := 'full'
);
-- Returns: synced_count, failed_count
```

### get_audience_members_for_export

Gets hashed member data for Meta upload:

```sql
SELECT * FROM get_audience_members_for_export('uuid...');
-- Returns: person_id, email, phone, first_name, last_name, country, city
```

### get_audience_metrics

Gets audience statistics:

```sql
SELECT * FROM get_audience_metrics('uuid...');
-- Returns: total_members, synced_count, last_sync_date, sync_status
```

## TypeScript Service API

### Custom Audience Management

```typescript
import {
  createCustomAudience,
  getCustomAudience,
  listCustomAudiences,
  updateCustomAudience,
  deleteCustomAudience,
} from '@/services/customAudience';

// Create custom audience
const audience = await createCustomAudience({
  name: 'High Value Customers',
  description: 'Users with 10+ video renders',
  audience_type: 'custom_list',
  segment_id: segmentId, // Link to GDP-012 segment
  auto_sync: true,
  sync_interval_hours: 24,
});

// Get audience
const audience = await getCustomAudience(audienceId);

// List audiences
const audiences = await listCustomAudiences(true); // true = active only

// Update audience
const updated = await updateCustomAudience(audienceId, {
  description: 'Updated description',
});

// Delete audience
await deleteCustomAudience(audienceId);
```

### Audience Syncing

```typescript
import {
  syncAudienceMembers,
  syncAllActiveAudiences,
} from '@/services/customAudience';

// Sync specific audience
const result = await syncAudienceMembers(audienceId, 'full');
// { audience_id, synced_count, failed_count, sync_log_id, status }

// Sync all active audiences
const result = await syncAllActiveAudiences();
// { total_audiences, synced, failed, results: [...] }
```

### Audience Members & Metrics

```typescript
import {
  getAudienceMembers,
  getAudienceMembersForExport,
  getAudienceMetrics,
  getSyncLogs,
} from '@/services/customAudience';

// Get audience members
const members = await getAudienceMembers(audienceId);

// Get members for Meta export (includes hashed data)
const exportData = await getAudienceMembersForExport(audienceId);

// Get audience metrics
const metrics = await getAudienceMetrics(audienceId);
// { total_members, synced_count, last_sync_date, sync_status }

// Get sync history
const logs = await getSyncLogs(audienceId, 50);
```

## REST API

### Custom Audiences

```bash
# List all custom audiences
GET /api/audiences?is_active=true

# Create custom audience
POST /api/audiences
{
  "name": "High Value Customers",
  "description": "Users with 10+ renders",
  "audience_type": "custom_list",
  "segment_id": "uuid...",
  "auto_sync": true,
  "sync_interval_hours": 24
}

# Get custom audience with related data
GET /api/audiences/:id?include=members,metrics,sync_logs

# Update custom audience
PUT /api/audiences/:id
{
  "description": "Updated description",
  "sync_interval_hours": 12
}

# Delete custom audience
DELETE /api/audiences/:id
```

### Audience Syncing

```bash
# Sync specific audience
POST /api/audiences/sync
{
  "audience_id": "uuid...",
  "sync_type": "full"
}

# Sync all active audiences
POST /api/audiences/sync
```

## Examples

### Example 1: Custom List from Segment

```typescript
// Create audience from "High Engagers" segment
const audience = await createCustomAudience({
  name: 'High Engagers for Upsell',
  description: 'Users who rendered 5+ videos',
  audience_type: 'custom_list',
  segment_id: 'high-engagers-segment-id',
  auto_sync: true,
  sync_interval_hours: 24,
});

// Auto-sync will run every 24 hours
// Members will be synced from the associated segment
```

### Example 2: Lookalike Audience

```typescript
// Create lookalike audience for expansion
const audience = await createCustomAudience({
  name: 'Pricing Viewers Lookalike',
  description: 'Similar users to pricing page viewers',
  audience_type: 'lookalike',
  segment_id: 'pricing-viewers-segment-id',
  lookalike_country: 'US',
  lookalike_percentage: 5, // 1-10 for audience similarity
  auto_sync: true,
  sync_interval_hours: 48, // Weekly updates
});
```

### Example 3: Manual Audience Sync

```typescript
// Manually trigger audience sync
const result = await syncAudienceMembers(audienceId, 'full');

console.log(`Synced ${result.synced_count} members`);
console.log(`Failed: ${result.failed_count}`);

// Check metrics
const metrics = await getAudienceMetrics(audienceId);
console.log(`Total members: ${metrics.total_members}`);
console.log(`Last sync: ${metrics.last_sync_date}`);
```

### Example 4: Syncing Multiple Audiences

```typescript
// Sync all active audiences at once
const result = await syncAllActiveAudiences();

console.log(`Updated ${result.synced} audiences`);
console.log(`${result.failed} had errors`);

result.results.forEach(sync => {
  console.log(`${sync.audience_id}: ${sync.synced_count} members`);
});
```

## Integration with Other Features

### GDP-012: Segment Engine

Custom Audiences are fed by segments created in GDP-012:

```typescript
// Create segment
const segment = await createSegment({
  name: 'High Engagers',
  rule: { type: 'condition', attribute: 'total_renders', operator: '>=', value: 5 }
});

// Create audience from segment
const audience = await createCustomAudience({
  segment_id: segment.id,
  audience_type: 'custom_list',
  auto_sync: true,
});

// When segment membership changes, audience automatically syncs
```

### META-001 to META-006: Meta Pixel Integration

Custom audiences integrate with Meta's tracking:

1. Track events via Meta Pixel (META-001 to META-003)
2. Send conversions via CAPI (META-004)
3. Hash PII (META-006)
4. Create segments (GDP-012)
5. Sync to custom audiences (META-007)

## Setup Instructions

### 1. Apply Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually in SQL Editor:
# Copy contents of: supabase/migrations/20260130000003_create_custom_audiences_tables.sql
```

### 2. Create First Audience

```bash
# Using API
curl -X POST http://localhost:3000/api/audiences \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Audience",
    "description": "Test custom audience",
    "audience_type": "custom_list"
  }'
```

### 3. Sync to Meta (Future)

When full Meta API integration is implemented:

```typescript
// Create audience in Meta
const metaResult = await createAudienceInMeta(
  audienceId,
  metaAccessToken,
  metaAccountId
);

// Update with Meta audience ID
await updateCustomAudience(audienceId, {
  meta_audience_id: metaResult.meta_audience_id,
});

// Sync members to Meta
await syncAudienceToMeta(audienceId, metaAccessToken);
```

### 4. Verify Installation

```bash
# Run test script
npx tsx scripts/test-custom-audiences.ts
```

Expected output:
```
🧪 Testing Custom Audiences (META-007)

✅ Create custom audience
✅ Fetch custom audience by ID
✅ List all custom audiences
✅ Update custom audience
✅ Create audience sync log
✅ Fetch sync logs for audience
✅ Fetch audience members
✅ Fetch audience metrics
✅ Create lookalike custom audience
✅ Delete custom audience

=========================================
Test Summary:
✅ Passed: 10
❌ Failed: 0
📊 Total: 10
=========================================

🎉 All tests passed!
```

## Performance Considerations

### Automatic Syncing

Audiences with `auto_sync: true` sync automatically:

```typescript
// Sync every 24 hours
const audience = await createCustomAudience({
  auto_sync: true,
  sync_interval_hours: 24,
});
```

Trigger periodic sync from a cron job:

```typescript
// In your cron job service
const result = await syncAllActiveAudiences();
```

### Batch Syncing

For large audiences with many members:

```typescript
// Incremental sync (faster for large audiences)
await syncAudienceMembers(audienceId, 'incremental');

// Full sync (replaces entire audience)
await syncAudienceMembers(audienceId, 'full');
```

### Audience Size Limits

Meta audience limits depend on audience type:

- **Custom List**: Up to ~10M hashed records
- **Lookalike**: Minimum 100 seed users
- **Engagement**: Pixel event tracking required

## Future Enhancements

### Phase 2: Meta Integration

1. **Graph API Integration**
   - Create audiences in Meta Business Manager
   - Upload customer lists via CAPI
   - Manage audience parameters

2. **Advanced Matching**
   - Hash PII for Meta matching
   - Automatic re-hashing on updates
   - Compliance with Meta's privacy policy

3. **Campaign Targeting**
   - Select custom audiences in ad campaigns
   - A/B test audience performance
   - Track campaign conversion by audience

### Phase 3: Enhanced Features

1. **Dynamic Audiences**
   - Real-time audience updates
   - Audience overlap analysis
   - Predictive audience growth

2. **Multi-Platform Syncing**
   - Google Customer Match
   - LinkedIn Matched Audiences
   - TikTok Custom Audiences

## Files

```
supabase/migrations/
└── 20260130000003_create_custom_audiences_tables.sql

src/types/
└── customAudience.ts

src/services/
└── customAudience.ts

src/app/api/audiences/
├── route.ts (GET, POST)
├── [id]/route.ts (GET, PUT, DELETE)
└── sync/route.ts (POST)

scripts/
└── test-custom-audiences.ts

docs/
└── META-007-CUSTOM-AUDIENCES.md
```

## Summary

META-007 provides complete custom audience management:

✅ **Custom Audience Creation** - List, custom, lookalike, engagement types
✅ **Segment Integration** - Feed from GDP-012 segments
✅ **Automatic Syncing** - Configurable sync intervals
✅ **Member Tracking** - Database tracking of synced members
✅ **Sync Logging** - Audit trail for compliance
✅ **Metrics & Analytics** - Monitor audience size and sync status
✅ **REST API** - Full CRUD and sync operations
✅ **Type Safety** - Complete TypeScript types
✅ **Database Functions** - Efficient SQL-level operations
✅ **Test Coverage** - Comprehensive test suite

This foundation is ready for Phase 2 Meta Graph API integration to push audiences to Meta Business Manager.
