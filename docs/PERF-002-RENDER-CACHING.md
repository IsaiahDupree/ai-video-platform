# PERF-002: Render Caching for Identical Briefs

**Status:** ✅ Complete
**Priority:** P2 (Medium)
**Category:** Performance
**Last Updated:** 2026-02-08

## Overview

The Render Cache system prevents redundant video rendering by detecting identical briefs and returning cached outputs. This dramatically reduces processing time and computational costs when users request the same render multiple times.

## Features

### 1. Content-Based Caching

Briefs are hashed using SHA256 to create a unique fingerprint:

- **Deterministic:** Same brief = same hash (every time)
- **Sensitive:** Any change in brief content changes the hash
- **Fast:** SHA256 hash computation is O(n) but very efficient

Example:

```typescript
const briefA = { title: 'Sale', price: '$99' };
const briefB = { title: 'Sale', price: '$99' };
const briefC = { title: 'Sale', price: '$199' };

generateBriefHash(briefA) === generateBriefHash(briefB) // true
generateBriefHash(briefA) === generateBriefHash(briefC) // false
```

### 2. Multi-Format Cache Keys

Cache entries are unique for each combination of:

- Brief content
- Output format (MP4, WebM, GIF, etc.)
- Dimensions (1920x1080, 1280x720, etc.)

Example:

```
Brief#SHA256 + "mp4" + "1920x1080" = Cache Key
Brief#SHA256 + "webm" + "1920x1080" = Different Key
Brief#SHA256 + "mp4" + "1280x720" = Different Key
```

### 3. TTL-Based Expiration

Cache entries expire after configurable TTL (default: 30 days):

- Entries include creation time and expiration time
- Expired entries are automatically removed
- No manual cleanup needed

### 4. Statistics Tracking

Real-time cache performance metrics:

```typescript
{
  hits: 1250,           // Successful cache hits
  misses: 350,          // Cache misses
  hitRate: 78.1,        // Hit rate percentage
  entryCount: 1200,     // Total cached renders
  totalSize: 10737418240 // Total cache size in bytes
}
```

## Architecture

### Service: `src/services/renderCache.ts`

Main caching service with singleton pattern:

```typescript
const cache = getRenderCache(); // Gets or creates instance

// Check if render is cached
const isCached = await cache.getCachedRender(brief, 'mp4', 1920, 1080);

// Store render in cache
await cache.cacheRender(brief, 'mp4', 1920, 1080, url, fileSize, renderTime);

// Invalidate cache
await cache.invalidateBrief(brief);
```

### Redis Backend

Cache uses Redis for:

- **Speed:** Sub-millisecond lookups
- **Persistence:** Survives process restarts
- **Scale:** Distributed caching across servers
- **TTL:** Automatic key expiration

### Data Structure

```typescript
interface RenderCacheEntry {
  hash: string;           // Unique cache entry ID
  briefHash: string;      // Brief content hash
  videoUrl: string;       // URL to rendered video
  outputFormat: string;   // mp4, webm, gif, etc
  width: number;          // Video width
  height: number;         // Video height
  fileSize: number;       // File size in bytes
  renderTime: number;     // Original render duration
  createdAt: number;      // Creation timestamp
  expiresAt: number;      // Expiration timestamp
  metadata?: object;      // Custom metadata
}
```

## Integration Points

### 1. Render Queue Integration

Modify render job submission to check cache first:

```typescript
import { getRenderCache } from '../services/renderCache';
import { getRenderQueue } from '../services/renderQueue';

async function submitRenderJob(userId, brief, format, width, height) {
  // Check cache first
  const cache = getRenderCache();
  const cachedUrl = await cache.getCachedRender(brief, format, width, height);

  if (cachedUrl) {
    console.log('Returning cached render:', cachedUrl);
    return { cached: true, videoUrl: cachedUrl };
  }

  // Not cached, queue for rendering
  const job = await getRenderQueue().addSingleRenderJob(brief.id, {
    brief, format, width, height
  });

  return { cached: false, jobId: job.id };
}
```

### 2. After-Render Caching

Cache the result after successful rendering:

```typescript
async function renderVideo(brief, format, width, height) {
  const startTime = Date.now();

  // Perform the render
  const { videoUrl, fileSize } = await performRender(brief, format, width, height);

  const renderTime = Date.now() - startTime;

  // Cache the result
  const cache = getRenderCache();
  await cache.cacheRender(brief, format, width, height, videoUrl, fileSize, renderTime);

  return { videoUrl, fileSize, cached: false };
}
```

### 3. Brief Update Handler

Invalidate cache when brief is updated:

```typescript
async function updateBrief(briefId, updates) {
  const brief = await db.briefs.findById(briefId);

  // Update the brief
  Object.assign(brief, updates);
  await db.briefs.save(brief);

  // Invalidate cache for old version
  const cache = getRenderCache();
  await cache.invalidateBrief(brief);

  return brief;
}
```

### 4. API Endpoint Integration

```typescript
// GET /api/render/cached
export async function GET(request: Request) {
  const { briefId, format, width, height } = request.query;

  const cache = getRenderCache();
  const cachedUrl = await cache.getCachedRender(brief, format, width, height);

  if (cachedUrl) {
    return Response.json({ cached: true, videoUrl: cachedUrl });
  }

  return Response.json({ cached: false }, { status: 404 });
}
```

## Usage Examples

### Example 1: Basic Cache Lookup

```typescript
const cache = getRenderCache();

const entry = await cache.getCachedRender(brief, 'mp4', 1920, 1080);

if (entry) {
  console.log('Cached render found!');
  console.log(`URL: ${entry.videoUrl}`);
  console.log(`File size: ${entry.fileSize / 1024 / 1024}MB`);
  console.log(`Original render time: ${entry.renderTime}ms`);
} else {
  console.log('Not in cache, rendering...');
}
```

### Example 2: Store Render Result

```typescript
const cache = getRenderCache();

const entry = await cache.cacheRender(
  brief,           // Brief configuration
  'mp4',           // Output format
  1920, 1080,      // Dimensions
  'https://...',   // Video URL
  25165824,        // File size (24MB)
  45000,           // Render time (45s)
  30,              // TTL in days
  { quality: 'high' } // Optional metadata
);

console.log(`Cached as: ${entry.hash}`);
```

### Example 3: Invalidate Brief Cache

```typescript
const cache = getRenderCache();

// Invalidate all formats/sizes for this brief
await cache.invalidateBrief(brief);

// Or by brief hash
await cache.invalidateBriefByHash(briefHash);

// Or specific cache entry
await cache.invalidateCacheEntry(cacheHash);
```

### Example 4: Monitor Cache Performance

```typescript
const cache = getRenderCache();
const stats = await cache.getStats();

console.log(`Cache hit rate: ${stats.hitRate.toFixed(2)}%`);
console.log(`Cached renders: ${stats.entryCount}`);
console.log(`Cache size: ${stats.totalSize / 1024 / 1024}MB`);

// Use this to decide when to clear cache
if (stats.totalSize > 50 * 1024 * 1024 * 1024) { // > 50GB
  await cache.clearAll();
}
```

## Performance Impact

### Before Caching

```
User Request 1: Brief X
  → Render (45 seconds)
  → Return URL

User Request 2: Same Brief X
  → Render (45 seconds)  ← Wasted time!
  → Return URL
```

### After Caching

```
User Request 1: Brief X
  → Check cache (1ms miss)
  → Render (45 seconds)
  → Cache result
  → Return URL

User Request 2: Same Brief X
  → Check cache (1ms hit)
  → Return cached URL     ← Instant!
```

### Efficiency Gains

| Scenario | Savings |
|----------|---------|
| 2 identical requests | 45 seconds (50% faster) |
| 10 identical requests | 405 seconds (90% faster) |
| 100 identical requests | 4,455 seconds (99% faster) |

## Configuration

### Cache TTL

Default: 30 days (can be customized)

```typescript
// Custom TTL (in seconds)
await cache.cacheRender(brief, format, width, height, url, size, time, 7 * 24 * 60 * 60); // 7 days
```

### Redis Configuration

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
REDIS_DB=0
```

## Storage Considerations

### Cache Size Estimation

Average video file sizes:
- MP4 (1920x1080): 20-30MB
- WebM (1920x1080): 15-20MB
- GIF (1920x1080): 50-100MB

Example storage:
- 1,000 unique briefs × 3 formats × 3 sizes = 9,000 cache entries
- Estimated space: 9,000 × 25MB = ~225GB

### Cleanup Strategies

1. **TTL-based:** Automatic removal after 30 days
2. **LRU (Least Recently Used):** Redis eviction policy
3. **Size-based:** Manual cleanup when total size exceeds threshold
4. **Brief-based:** Clear all formats when brief is updated

## Testing

Run the test suite:

```bash
npm run test -- scripts/test-render-cache.ts
```

Test coverage includes:

- ✅ Brief hash consistency
- ✅ Cache entry identification
- ✅ Storage and retrieval
- ✅ Cache invalidation
- ✅ Multi-format support
- ✅ Statistics tracking
- ✅ Real-world workflows

## Monitoring & Observability

### Key Metrics

```typescript
// Track cache hit rate
const stats = await cache.getStats();
metrics.cache_hit_rate = stats.hitRate;

// Track cache size
metrics.cache_size_mb = stats.totalSize / 1024 / 1024;

// Track entry count
metrics.cache_entries = stats.entryCount;
```

### Alerting

Set up alerts for:
- Cache hit rate dropping below 70%
- Cache size exceeding 100GB
- Redis connection failures

### Logging

```typescript
// Log cache decisions
console.log(`[CACHE] Render ${briefHash} cached=${isCached}`);

// Log statistics
console.log(`[CACHE] Hit rate: ${stats.hitRate.toFixed(2)}%`);
```

## Security & Privacy

1. **Content Hashing:** Briefs are hashed, not stored plaintext
2. **URL Expiry:** Video URLs have signed, time-limited access
3. **User Isolation:** Cache keys include brief content, not user ID
4. **Invalidation:** Users can force cache invalidation when needed

## Future Enhancements

1. **Partial Match Caching** - Cache variations of similar briefs
2. **Incremental Rendering** - Reuse unchanged sections
3. **Distributed Cache** - Multi-node Redis cluster
4. **Smart Eviction** - ML-based cache retention policies
5. **Compression** - Compress cached metadata
6. **CDN Integration** - Push cached videos to CDN

## Troubleshooting

### Cache Not Working

**Symptom:** Cache hits are 0%
**Cause:** Redis connection failed or briefs not matching
**Solution:**
1. Check Redis connection: `redis-cli ping`
2. Verify brief hashing is deterministic
3. Check cache statistics: `cache.getStats()`

### High Cache Memory Usage

**Symptom:** Cache size exceeds limits
**Cause:** Too many unique briefs being cached
**Solution:**
1. Reduce TTL from 30 days to 7 days
2. Implement size-based eviction
3. Clear old cache entries

### Stale Cache Serving

**Symptom:** Updated briefs still returning old videos
**Cause:** Cache not invalidated on brief update
**Solution:**
1. Call `cache.invalidateBrief()` after updates
2. Use brief hash to invalidate: `cache.invalidateBriefByHash()`
3. Add audit logging for invalidations

## Summary

PERF-002 provides a production-ready caching system that:

✅ Detects identical briefs automatically
✅ Caches renders in multiple formats and sizes
✅ Returns cached results in milliseconds
✅ Provides statistics and monitoring
✅ Handles cache invalidation gracefully
✅ Integrates seamlessly with render queue
✅ Includes comprehensive tests and documentation

The system is ready for immediate production deployment.
