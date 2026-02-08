/**
 * Render Cache Service - PERF-002
 * Cache rendered outputs and return cached version for duplicate briefs
 *
 * This service provides efficient caching of rendered video outputs,
 * avoiding redundant processing for identical briefs.
 */

import { createHash } from 'crypto';
import Redis from 'ioredis';

/**
 * Render cache entry
 */
export interface RenderCacheEntry {
  hash: string;
  briefHash: string;
  videoUrl: string;
  outputFormat: string;
  width: number;
  height: number;
  fileSize: number;
  renderTime: number;
  createdAt: number;
  expiresAt: number;
  metadata?: Record<string, any>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
}

/**
 * Render Cache Manager
 */
class RenderCacheManager {
  private redis: Redis;
  private cacheKeyPrefix = 'render:cache:';
  private statsKeyPrefix = 'render:stats:';
  private ttl = 30 * 24 * 60 * 60; // 30 days default TTL

  constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: null,
    };

    this.redis = new Redis(redisConfig);
  }

  /**
   * Generate a hash of the brief/composition config
   * This hash is used as the cache key
   *
   * @param briefContent - The brief/composition configuration
   * @returns SHA256 hash of the brief
   */
  generateBriefHash(briefContent: any): string {
    const jsonString = JSON.stringify(briefContent);
    return createHash('sha256').update(jsonString).digest('hex');
  }

  /**
   * Generate a cache entry hash
   * Unique identifier for a specific render output (brief + format + dimensions)
   */
  generateCacheHash(briefHash: string, format: string, width: number, height: number): string {
    const key = `${briefHash}:${format}:${width}x${height}`;
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Get cached render result if it exists
   *
   * @param briefContent - The brief/composition configuration
   * @param outputFormat - Output format (mp4, webm, gif, etc)
   * @param width - Video width
   * @param height - Video height
   * @returns Cached result or null if not found/expired
   */
  async getCachedRender(
    briefContent: any,
    outputFormat: string,
    width: number,
    height: number
  ): Promise<RenderCacheEntry | null> {
    try {
      const briefHash = this.generateBriefHash(briefContent);
      const cacheHash = this.generateCacheHash(briefHash, outputFormat, width, height);
      const cacheKey = `${this.cacheKeyPrefix}${cacheHash}`;

      const cachedData = await this.redis.get(cacheKey);

      if (!cachedData) {
        this.recordMiss();
        return null;
      }

      const entry = JSON.parse(cachedData) as RenderCacheEntry;

      // Check if entry has expired
      if (entry.expiresAt < Date.now()) {
        await this.redis.del(cacheKey);
        this.recordMiss();
        return null;
      }

      this.recordHit();
      return entry;
    } catch (error) {
      console.error('Error retrieving from render cache:', error);
      return null;
    }
  }

  /**
   * Cache a render result
   *
   * @param briefContent - The brief/composition configuration
   * @param outputFormat - Output format (mp4, webm, gif, etc)
   * @param width - Video width
   * @param height - Video height
   * @param videoUrl - URL to the rendered video
   * @param fileSize - Size of the video file in bytes
   * @param renderTime - Time taken to render in milliseconds
   * @param ttlSeconds - Time to live in seconds (default: 30 days)
   * @returns The cache entry
   */
  async cacheRender(
    briefContent: any,
    outputFormat: string,
    width: number,
    height: number,
    videoUrl: string,
    fileSize: number,
    renderTime: number,
    ttlSeconds: number = this.ttl,
    metadata?: Record<string, any>
  ): Promise<RenderCacheEntry> {
    try {
      const briefHash = this.generateBriefHash(briefContent);
      const cacheHash = this.generateCacheHash(briefHash, outputFormat, width, height);
      const cacheKey = `${this.cacheKeyPrefix}${cacheHash}`;

      const entry: RenderCacheEntry = {
        hash: cacheHash,
        briefHash,
        videoUrl,
        outputFormat,
        width,
        height,
        fileSize,
        renderTime,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttlSeconds * 1000,
        metadata,
      };

      await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(entry));

      return entry;
    } catch (error) {
      console.error('Error caching render result:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific brief
   * Used when a brief is updated
   *
   * @param briefContent - The brief/composition configuration
   */
  async invalidateBrief(briefContent: any): Promise<void> {
    try {
      const briefHash = this.generateBriefHash(briefContent);
      const pattern = `${this.cacheKeyPrefix}${briefHash}:*`;

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating brief cache:', error);
    }
  }

  /**
   * Invalidate cache by brief hash
   */
  async invalidateBriefByHash(briefHash: string): Promise<void> {
    try {
      const pattern = `${this.cacheKeyPrefix}${briefHash}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating brief cache by hash:', error);
    }
  }

  /**
   * Invalidate cache by cache hash
   */
  async invalidateCacheEntry(cacheHash: string): Promise<void> {
    try {
      const cacheKey = `${this.cacheKeyPrefix}${cacheHash}`;
      await this.redis.del(cacheKey);
    } catch (error) {
      console.error('Error invalidating cache entry:', error);
    }
  }

  /**
   * Get cache statistics
   *
   * @returns Cache hit/miss stats
   */
  async getStats(): Promise<CacheStats> {
    try {
      const statsKey = `${this.statsKeyPrefix}stats`;
      const statsData = await this.redis.get(statsKey);
      const stats = statsData ? JSON.parse(statsData) : { hits: 0, misses: 0 };

      // Get cache size and entry count
      const pattern = `${this.cacheKeyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      let totalSize = 0;

      for (const key of keys) {
        const size = await this.redis.memory('USAGE', key).catch(() => 0);
        totalSize += size;
      }

      const total = stats.hits + stats.misses;
      const hitRate = total > 0 ? (stats.hits / total) * 100 : 0;

      return {
        hits: stats.hits,
        misses: stats.misses,
        totalSize,
        entryCount: keys.length,
        hitRate,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { hits: 0, misses: 0, totalSize: 0, entryCount: 0, hitRate: 0 };
    }
  }

  /**
   * Record a cache hit
   */
  private async recordHit(): Promise<void> {
    try {
      const statsKey = `${this.statsKeyPrefix}stats`;
      const statsData = await this.redis.get(statsKey);
      const stats = statsData ? JSON.parse(statsData) : { hits: 0, misses: 0 };
      stats.hits++;
      await this.redis.set(statsKey, JSON.stringify(stats));
    } catch (error) {
      // Silently ignore stats errors
    }
  }

  /**
   * Record a cache miss
   */
  private async recordMiss(): Promise<void> {
    try {
      const statsKey = `${this.statsKeyPrefix}stats`;
      const statsData = await this.redis.get(statsKey);
      const stats = statsData ? JSON.parse(statsData) : { hits: 0, misses: 0 };
      stats.misses++;
      await this.redis.set(statsKey, JSON.stringify(stats));
    } catch (error) {
      // Silently ignore stats errors
    }
  }

  /**
   * Clear entire cache
   */
  async clearAll(): Promise<void> {
    try {
      const pattern = `${this.cacheKeyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Reset statistics
   */
  async resetStats(): Promise<void> {
    try {
      const statsKey = `${this.statsKeyPrefix}stats`;
      await this.redis.del(statsKey);
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let renderCacheInstance: RenderCacheManager | null = null;

/**
 * Get or create the render cache manager
 */
export function getRenderCache(): RenderCacheManager {
  if (!renderCacheInstance) {
    renderCacheInstance = new RenderCacheManager();
  }
  return renderCacheInstance;
}

/**
 * Utility function to check if a render exists in cache
 */
export async function isCachedRender(
  briefContent: any,
  outputFormat: string,
  width: number,
  height: number
): Promise<boolean> {
  const cache = getRenderCache();
  const result = await cache.getCachedRender(briefContent, outputFormat, width, height);
  return result !== null;
}

/**
 * Utility function to get cached render URL
 */
export async function getCachedRenderUrl(
  briefContent: any,
  outputFormat: string,
  width: number,
  height: number
): Promise<string | null> {
  const cache = getRenderCache();
  const result = await cache.getCachedRender(briefContent, outputFormat, width, height);
  return result ? result.videoUrl : null;
}

/**
 * Utility function to store a render in cache
 */
export async function storeRenderInCache(
  briefContent: any,
  outputFormat: string,
  width: number,
  height: number,
  videoUrl: string,
  fileSize: number,
  renderTime: number,
  ttlDays: number = 30
): Promise<RenderCacheEntry> {
  const cache = getRenderCache();
  return cache.cacheRender(
    briefContent,
    outputFormat,
    width,
    height,
    videoUrl,
    fileSize,
    renderTime,
    ttlDays * 24 * 60 * 60
  );
}
