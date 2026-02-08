# Remaining Features Implementation Guide

This document outlines the 8 remaining features that require implementation to achieve 100% completion. These are all advanced features that support scaling, testing, performance optimization, and API integration.

## Summary

- **Total Remaining:** 8 features (6.7% of 120)
- **P1 (High Priority):** 6 features
- **P2 (Medium Priority):** 2 features

---

## P1 Features (High Priority)

### 1. TEST-001: Unit Tests for Brief Schema Validation
**Priority:** P1 | **Effort:** Unknown
**Files:** TBD

**Description:** Test all brief field validations, defaults, and edge cases

**Implementation Plan:**
- Create test suite for `src/utils/validateBrief.ts`
- Test required field validation
- Test type checking
- Test range validation (width, height, fps, etc.)
- Test codec validation
- Test theme validation
- Test section type validation
- Test edge cases (null values, empty arrays, missing fields)

**Example Test Cases:**
```typescript
describe('validateBrief', () => {
  it('should reject non-object input');
  it('should require version field');
  it('should validate settings.width range (1-7680)');
  it('should validate settings.height range (1-4320)');
  it('should validate fps range (1-120)');
  it('should validate theme enum (light, dark, custom)');
  it('should validate section types');
  it('should handle missing optional fields gracefully');
});
```

---

### 2. TEST-002: Integration Tests for Render Pipeline
**Priority:** P1 | **Effort:** Unknown
**Files:** TBD

**Description:** End-to-end render tests with test briefs across all template types

**Implementation Plan:**
- Create test briefs for each composition type
- Test full render pipeline: brief → composition → ffmpeg → output
- Test with different video formats and quality presets
- Test error handling for invalid briefs
- Test output validation (file size, duration, codec)
- Test caching behavior

**Key Components to Test:**
- `BriefComposition` rendering
- Audio integration
- Image handling
- Theme application
- Export to multiple formats

---

### 3. PERF-001: Render Queue Priority System
**Priority:** P1 | **Effort:** Unknown
**Files:** TBD

**Description:** Priority-based render queue with paid users getting faster processing

**Implementation Plan:**
1. Extend `RenderQueue` (BullMQ-based) with priority levels:
   - Free tier: priority 10 (lowest)
   - Pro tier: priority 5
   - Enterprise: priority 1 (highest)

2. Create user tier middleware:
   - Check user subscription status
   - Apply priority multiplier based on tier
   - Track render limits per tier

3. Implement queue worker improvements:
   - Process high-priority jobs first
   - Implement fair scheduling for same-priority jobs
   - Add queue status endpoint

**Code Structure:**
```typescript
// src/services/renderQueueWithPriority.ts
interface RenderJobWithPriority extends RenderJob {
  priority: number;
  userId: string;
  userTier: 'free' | 'pro' | 'enterprise';
}

class PriorityRenderQueue extends RenderQueue {
  async addJob(job: RenderJobWithPriority) {
    const actualPriority = this.calculatePriority(job.userTier);
    // Add to queue with priority
  }
}
```

---

### 4. PERF-003: CDN Distribution for Rendered Assets
**Priority:** P1 | **Effort:** Unknown
**Files:** TBD

**Description:** Auto-upload rendered videos to R2/CloudFront with signed URLs

**Implementation Plan:**
1. Create CDN service:
   - After video render completes, upload to R2
   - Generate CloudFront signed URLs (1-7 day validity)
   - Store CDN URLs in database

2. Implement cache invalidation:
   - Create CloudFront invalidation after upload
   - Cache bust on version updates

3. Update render pipeline:
   - Hook into render completion
   - Upload and generate CDN URLs
   - Return CDN URLs to user instead of direct S3

**Benefits:**
- Faster downloads for global users
- Reduce egress costs
- Geographic distribution
- DDoS protection from CloudFront

---

### 5. API-001: Public REST API for Video Generation
**Priority:** P1 | **Effort:** Unknown
**Files:** TBD

**Description:** API key authenticated endpoints for external integrations to submit briefs and poll render status

**Endpoints:**
```
POST   /api/v1/renders          - Submit render job
GET    /api/v1/renders/:id      - Get render status
GET    /api/v1/renders/:id/url  - Get download URL
DELETE /api/v1/renders/:id      - Cancel render job
GET    /api/v1/user/quota       - Check remaining quota
```

**Implementation Plan:**
1. Create API key management:
   - `POST /api/v1/api-keys` - Generate new key
   - `DELETE /api/v1/api-keys/:key` - Revoke key
   - Store in Supabase with user association

2. Implement auth middleware:
   - Parse `Authorization: Bearer <api-key>` header
   - Validate against stored keys
   - Rate limit by key

3. Create v1 API routes:
   - Reuse existing render logic
   - Add webhook support for completion
   - Add pagination for list endpoints

---

### 6. API-003: Rate Limiting and Usage Quotas
**Priority:** P1 | **Effort:** Unknown
**Files:** TBD

**Description:** Per-API-key rate limiting with monthly render quotas by plan tier

**Implementation Plan:**
1. Create quota system:
   - Free: 10 renders/month, 5 req/min
   - Pro: 100 renders/month, 30 req/min
   - Enterprise: Unlimited

2. Implement rate limiter:
   - Redis-backed sliding window counter
   - Per API key + per IP
   - Return 429 when exceeded

3. Add quota tracking:
   - Track render count per month
   - Reset on 1st of month
   - Send warning at 80% usage

4. Create quota endpoint:
   ```typescript
   GET /api/v1/user/quota
   Returns: {
     renders_used: 45,
     renders_limit: 100,
     requests_this_minute: 12,
     requests_limit: 30
   }
   ```

---

## P2 Features (Medium Priority)

### 7. ADMIN-001: Admin Dashboard with Render Analytics
**Priority:** P2 | **Effort:** Unknown
**Files:** TBD

**Description:** Admin panel showing total renders, queue depth, error rates, and revenue

**Features:**
- Real-time render queue stats
- Monthly render count chart
- Error rate by template type
- User growth chart
- Revenue summary by plan
- Top templates by usage

**Implementation:**
```typescript
// src/app/admin/dashboard/page.tsx
// Supabase queries for analytics
// Chart components (using recharts or similar)
// Real-time updates via subscriptions
```

---

### 8. ADMIN-002: User Management and Plan Assignment
**Priority:** P2 | **Effort:** Unknown
**Files:** TBD

**Description:** Admin CRUD for users, plan upgrades/downgrades, and quota overrides

**Features:**
- List all users with filters
- View/edit user details
- Change subscription plan
- Override quota limits
- Deactivate accounts
- View user activity history

---

## Implementation Priority

**Recommended Order:**
1. **TEST-001 & TEST-002** (Unblock further development)
2. **PERF-001** (Improves user experience)
3. **API-001** (Enable integrations)
4. **PERF-003** (Reduce costs)
5. **API-003** (Protect system)
6. **ADMIN-001 & ADMIN-002** (Operations support)

## Already Completed P1 Features

✅ **SEC-001: Signed Download URLs** - Implemented with 24h default expiry
✅ **SEC-002: Input Sanitization** - XSS prevention with comprehensive sanitization
✅ **EXPORT-001: Multi-Format Export** - MP4, WebM, GIF with platform optimization

---

## Key Dependencies

- **Supabase**: For quota and user data persistence
- **Redis**: For rate limiting and queue state
- **BullMQ**: For render job queueing
- **ffmpeg**: For format conversion
- **Cloudflare R2/CloudFront**: For CDN distribution

## Next Steps

1. Review and approve remaining feature prioritization
2. Assign development resources
3. Create detailed technical specifications for each feature
4. Set up test framework infrastructure
5. Begin implementation starting with P1 features

