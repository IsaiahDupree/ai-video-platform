# TRACK-008: Error & Performance Tracking

**Status:** ✅ Implemented
**Category:** Tracking
**Priority:** P2
**Effort:** 8pts

## Overview

Error & Performance Tracking provides critical insights into system reliability and performance issues. This helps engineering teams identify, diagnose, and resolve problems in the rendering pipeline and API calls, ultimately improving platform stability and user experience.

## Events Tracked

### 1. Render Failed
Track when render operations fail, capturing the reason and context.

**Event:** `render_failed`

**Data Captured:**
- Render ID and template ID
- Failure reason (timeout, memory_exceeded, invalid_composition, missing_asset, codec_error, unknown)
- Error message
- Duration before failure (ms)
- Retry attempt number
- Timestamp

**Use Cases:**
- Monitor render success rates
- Identify common failure patterns
- Trigger automatic retries
- Alert on critical failures
- Analyze error trends

### 2. API Error
Track when API calls fail, including both internal and external APIs.

**Event:** `api_error`

**Data Captured:**
- API endpoint
- HTTP status code
- Error message
- Request ID
- Duration before failure (ms)
- Retry attempt number
- Timestamp

**Use Cases:**
- Monitor API reliability
- Track external service failures
- Identify rate limiting issues
- Measure error rates
- Debug integration problems

### 3. Slow Render
Track when render operations exceed performance thresholds.

**Event:** `slow_render`

**Data Captured:**
- Render ID and template ID
- Render type (still, video, batch)
- Actual duration (ms)
- Expected duration threshold (ms)
- Slowness factor (actual/expected)
- Dimensions (width x height)
- Timestamp

**Use Cases:**
- Identify performance bottlenecks
- Optimize slow templates
- Monitor render performance trends
- Alert on performance degradation
- Capacity planning

## Performance Thresholds

```typescript
export const PERFORMANCE_THRESHOLDS = {
  render_still: 5000,      // 5 seconds
  render_video: 30000,     // 30 seconds
  api_call: 3000,          // 3 seconds
  image_generation: 10000, // 10 seconds
  voice_generation: 15000, // 15 seconds
}
```

These thresholds define when an operation is considered "slow" and should be tracked for performance analysis.

## Implementation

### Tracking Render Failures

```typescript
import {
  trackRenderFailed,
  measureRenderPerformance
} from '@/services/errorPerformanceTracking';

// Manual tracking
trackRenderFailed(
  'render_001',
  'timeout',
  'Render operation timed out after 30 seconds',
  'template_hero_001',
  30000,
  0 // retry attempt
);

// Automatic tracking with measurement helper
const completeTracking = measureRenderPerformance(
  'render_002',
  'still',
  'template_product_002'
);

try {
  // ... render logic
  completeTracking(true); // Success
} catch (error) {
  completeTracking(false, 'memory_exceeded', error.message);
}
```

### Tracking API Errors

```typescript
import {
  trackAPIError,
  measureAPIPerformance
} from '@/services/errorPerformanceTracking';

// Manual tracking
trackAPIError(
  '/api/render',
  500,
  'Internal server error during render',
  'req_001',
  2500,
  0
);

// Automatic tracking with measurement helper
const completeTracking = measureAPIPerformance('/api/render', 'req_002');

try {
  const response = await fetch('/api/render', options);
  completeTracking(true, response.status);
} catch (error) {
  completeTracking(false, null, error.message);
}
```

### Tracking Slow Renders

```typescript
import {
  trackSlowRender,
  PERFORMANCE_THRESHOLDS
} from '@/services/errorPerformanceTracking';

const startTime = Date.now();
// ... render operation
const duration = Date.now() - startTime;

if (duration > PERFORMANCE_THRESHOLDS.render_still) {
  trackSlowRender(
    'render_003',
    'still',
    duration,
    PERFORMANCE_THRESHOLDS.render_still,
    'template_testimonial_003',
    { width: 1920, height: 1080 }
  );
}
```

## Error & Performance Statistics

The system maintains local statistics for quick access to error and performance metrics:

```typescript
import {
  getErrorPerformanceStats,
  resetErrorPerformanceStats,
  calculateErrorRate
} from '@/services/errorPerformanceTracking';

// Get current stats
const stats = getErrorPerformanceStats();
console.log({
  rendersFailed: stats.rendersFailed,
  apiErrors: stats.apiErrors,
  slowRenders: stats.slowRenders,
  totalErrors: stats.totalErrors,
  totalPerformanceIssues: stats.totalPerformanceIssues,
});

// Calculate error rate
const errorRate = calculateErrorRate(100, 5); // 5%

// Reset stats (for testing or data export)
resetErrorPerformanceStats();
```

## Integration Points

### Render Service
- **Location:** `src/services/renderStill.ts`
- **Tracks:** Render failures, slow renders
- **Method:** Automatic measurement with `measureRenderPerformance()`
- **Error Detection:** Classifies failures by error type (timeout, memory, codec, etc.)

### API Routes
- **Location:** `src/app/api/render/route.ts`
- **Tracks:** API errors
- **Method:** Automatic measurement with `measureAPIPerformance()`
- **Error Detection:** Captures HTTP status codes and error messages

### Variant Generator
- **Location:** `src/app/api/ads/generate-variants/route.ts`
- **Tracks:** API errors, OpenAI rate limits
- **Method:** Automatic measurement with request ID tracking

## Analytics Queries

### Render Failure Rate
```sql
SELECT
  DATE(timestamp) as date,
  COUNT(*) as total_failures,
  reason,
  AVG(duration) as avg_duration_before_failure
FROM events
WHERE event_name = 'render_failed'
GROUP BY date, reason
ORDER BY date DESC, total_failures DESC
```

### API Error Trends
```sql
SELECT
  endpoint,
  statusCode,
  COUNT(*) as error_count,
  AVG(duration) as avg_duration
FROM events
WHERE event_name = 'api_error'
GROUP BY endpoint, statusCode
ORDER BY error_count DESC
```

### Performance Degradation
```sql
SELECT
  renderType,
  AVG(slownessFactor) as avg_slowness,
  COUNT(*) as slow_render_count,
  AVG(duration) as avg_duration
FROM events
WHERE event_name = 'slow_render'
GROUP BY renderType
ORDER BY avg_slowness DESC
```

### Error Rate by Template
```sql
SELECT
  templateId,
  COUNT(CASE WHEN event_name = 'render_failed' THEN 1 END) as failures,
  COUNT(CASE WHEN event_name = 'video_rendered' THEN 1 END) as successes,
  ROUND(100.0 *
    COUNT(CASE WHEN event_name = 'render_failed' THEN 1 END) /
    NULLIF(COUNT(*), 0), 2) as error_rate_pct
FROM events
WHERE event_name IN ('render_failed', 'video_rendered')
GROUP BY templateId
HAVING COUNT(*) > 10
ORDER BY error_rate_pct DESC
```

## Testing

### Run Test Suite
```bash
npx tsx scripts/test-error-performance-tracking.ts
```

### Test Coverage
- ✅ calculateErrorRate()
- ✅ isSlow()
- ✅ PERFORMANCE_THRESHOLDS
- ✅ Integration in renderStill.ts
- ✅ Integration in API routes
- ✅ Error classification
- ✅ Performance threshold detection

## Failure Reason Classification

The system automatically classifies render failures into categories:

| Reason | Description | Example Errors |
|--------|-------------|----------------|
| `memory_exceeded` | Out of memory during render | "Memory limit exceeded", "OOM" |
| `timeout` | Operation took too long | "Timeout after 30s", "Request timeout" |
| `invalid_composition` | Invalid template or config | "Composition not found", "Invalid format" |
| `missing_asset` | Required asset not available | "File not found", "Missing image" |
| `codec_error` | Video/audio encoding issue | "Codec error", "Encoding failed" |
| `unknown` | Unclassified error | All other errors |

## Performance Considerations

### Client-Side
- Events are queued and batched (max 10 events)
- Fire-and-forget pattern (no blocking)
- LocalStorage for statistics (instant reads)

### Server-Side
- Async tracking (doesn't block render pipeline)
- Events written to queue for processing
- Minimal overhead (<2ms per event)
- Error tracking doesn't introduce additional failures

### Storage
- Average event size: ~250 bytes
- Estimated daily volume: ~5,000 error/performance events
- Monthly storage: ~37MB (compressed)

## Alerting & Monitoring

### Recommended Alerts

1. **High Error Rate Alert**
   - Trigger: Error rate > 5% over 15 minutes
   - Action: Notify on-call engineer
   - Severity: Critical

2. **API Degradation Alert**
   - Trigger: > 10 API errors in 5 minutes
   - Action: Check external service status
   - Severity: High

3. **Performance Degradation Alert**
   - Trigger: > 50% renders slow over 30 minutes
   - Action: Check system resources
   - Severity: Medium

4. **Template-Specific Failures**
   - Trigger: Same template fails > 3 times
   - Action: Disable template, investigate
   - Severity: High

## Data Privacy

### User Consent
- Error data collected for logged-in users only
- No PII in error messages (sanitized)
- Users can opt out in account settings

### Data Retention
- Raw event data: 30 days
- Aggregated statistics: 1 year
- Error-specific data deleted on account deletion

### Sensitive Data
- Error messages sanitized to remove tokens/keys
- Request IDs are generated, not user-provided
- No personally identifiable information in payloads

## Debugging & Troubleshooting

### Common Issues

**Issue:** Render failures not tracked
- **Check:** Ensure `measureRenderPerformance()` is called
- **Check:** Verify tracking service initialized
- **Fix:** Add tracking to render function

**Issue:** False positive slow renders
- **Check:** Review PERFORMANCE_THRESHOLDS values
- **Check:** Consider hardware variations
- **Fix:** Adjust thresholds for environment

**Issue:** Missing error context
- **Check:** Error classification logic
- **Check:** Error message format
- **Fix:** Update failure reason detection

### Debug Mode

Enable debug logging for tracking:

```typescript
// In browser console
localStorage.setItem('debug_tracking', 'true');

// In Node.js
process.env.DEBUG_TRACKING = 'true';
```

## Future Enhancements

### Short-term
- [ ] Error trend visualization dashboard
- [ ] Automatic retry logic based on failure type
- [ ] Performance regression detection
- [ ] Template-specific threshold tuning

### Long-term
- [ ] AI-powered error prediction
- [ ] Automatic performance optimization suggestions
- [ ] Cross-region performance comparison
- [ ] Integration with external monitoring (Sentry, Datadog)

## Related Features

- **TRACK-001:** Base tracking SDK
- **TRACK-003:** Activation events
- **TRACK-004:** Core value events
- **ADS-007:** renderStill service

## Files

- `src/services/errorPerformanceTracking.ts` - Core tracking service
- `src/services/renderStill.ts` - Render error tracking
- `src/app/api/render/route.ts` - API error tracking
- `src/app/api/ads/generate-variants/route.ts` - API error tracking
- `scripts/test-error-performance-tracking.ts` - Test suite
- `docs/TRACK-008-ERROR-PERFORMANCE-TRACKING.md` - This document

## Support

For questions or issues with error & performance tracking:
- Check the test suite for usage examples
- Review integration points in render services
- Verify tracking events in browser console
- Check analytics dashboard for data validation
- Review error classification logic for accuracy
