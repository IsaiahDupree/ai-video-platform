/**
 * APP-019: Translation Memory
 * Service for storing and reusing translations across locales
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'translation-memory');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Translation Unit - A single translation pair
 */
export interface TranslationUnit {
  id: string; // Unique ID for this translation unit
  sourceText: string; // Original text
  targetText: string; // Translated text
  sourceLanguage: string; // ISO 639-1 code (e.g., 'en')
  targetLanguage: string; // ISO 639-1 code (e.g., 'es')
  context?: {
    // Optional context for better matching
    domain?: string; // e.g., 'marketing', 'technical', 'legal'
    fieldType?: string; // e.g., 'headline', 'body', 'cta'
    industry?: string; // e.g., 'technology', 'healthcare'
    tone?: string; // e.g., 'professional', 'casual', 'friendly'
  };
  metadata: {
    createdAt: string; // ISO timestamp
    createdBy: string; // User/system who created
    lastUsed?: string; // ISO timestamp of last use
    usageCount: number; // Number of times this translation was reused
    quality?: 'verified' | 'unverified' | 'machine' | 'professional'; // Translation quality
    source?: 'ai' | 'manual' | 'professional' | 'import'; // Translation source
  };
  fingerprint?: string; // Hash for exact matching
}

/**
 * Translation Match - Result of searching translation memory
 */
export interface TranslationMatch {
  unit: TranslationUnit;
  matchType: 'exact' | 'fuzzy' | 'partial';
  similarity: number; // 0-1, where 1 is exact match
  suggestion: string; // The suggested translation
}

/**
 * Translation Memory Query
 */
export interface TranslationMemoryQuery {
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: TranslationUnit['context'];
  minSimilarity?: number; // Minimum similarity threshold (default: 0.7)
  maxResults?: number; // Maximum number of results (default: 5)
}

/**
 * Translation Memory Statistics
 */
export interface TranslationMemoryStats {
  totalUnits: number;
  byLanguagePair: Record<string, number>; // e.g., "en-es": 100
  byDomain: Record<string, number>;
  byQuality: Record<string, number>;
  totalUsageCount: number;
  mostUsedTranslations: TranslationUnit[];
}

/**
 * TranslationMemoryService - Store and reuse translations
 */
export class TranslationMemoryService {
  private memoryCache: Map<string, TranslationUnit[]> = new Map();
  private cacheLoaded = false;

  /**
   * Add a translation unit to memory
   */
  async addTranslation(
    sourceText: string,
    targetText: string,
    sourceLanguage: string,
    targetLanguage: string,
    options: {
      context?: TranslationUnit['context'];
      metadata?: Partial<TranslationUnit['metadata']>;
    } = {}
  ): Promise<TranslationUnit> {
    // Generate fingerprint for exact matching
    const fingerprint = this.generateFingerprint(sourceText, sourceLanguage, targetLanguage);

    // Check if exact translation already exists
    const existing = await this.findExactMatch(sourceText, sourceLanguage, targetLanguage);
    if (existing) {
      // Update usage count and last used timestamp
      existing.metadata.usageCount++;
      existing.metadata.lastUsed = new Date().toISOString();
      this.saveTranslationUnit(existing);
      return existing;
    }

    // Create new translation unit
    const unit: TranslationUnit = {
      id: `tu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceText,
      targetText,
      sourceLanguage,
      targetLanguage,
      context: options.context,
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: options.metadata?.createdBy || 'system',
        usageCount: 1,
        quality: options.metadata?.quality || 'unverified',
        source: options.metadata?.source || 'manual',
        lastUsed: new Date().toISOString(),
      },
      fingerprint,
    };

    // Save to file
    this.saveTranslationUnit(unit);

    // Update cache
    const key = this.getLanguagePairKey(sourceLanguage, targetLanguage);
    if (!this.memoryCache.has(key)) {
      this.memoryCache.set(key, []);
    }
    this.memoryCache.get(key)!.push(unit);

    return unit;
  }

  /**
   * Search translation memory for matches
   */
  async search(query: TranslationMemoryQuery): Promise<TranslationMatch[]> {
    await this.ensureCacheLoaded();

    const {
      sourceText,
      sourceLanguage,
      targetLanguage,
      context,
      minSimilarity = 0.7,
      maxResults = 5,
    } = query;

    const key = this.getLanguagePairKey(sourceLanguage, targetLanguage);
    const units = this.memoryCache.get(key) || [];

    if (units.length === 0) {
      return [];
    }

    // Find matches
    const matches: TranslationMatch[] = [];

    for (const unit of units) {
      // Calculate similarity
      const similarity = this.calculateSimilarity(sourceText, unit.sourceText);

      // Check if similarity meets threshold
      if (similarity < minSimilarity) {
        continue;
      }

      // Context matching (bonus for matching context)
      let contextBonus = 0;
      if (context && unit.context) {
        if (context.domain && context.domain === unit.context.domain) contextBonus += 0.1;
        if (context.fieldType && context.fieldType === unit.context.fieldType) contextBonus += 0.1;
        if (context.industry && context.industry === unit.context.industry) contextBonus += 0.05;
        if (context.tone && context.tone === unit.context.tone) contextBonus += 0.05;
      }

      const adjustedSimilarity = Math.min(1, similarity + contextBonus);

      // Determine match type
      let matchType: TranslationMatch['matchType'] = 'partial';
      if (similarity === 1) {
        matchType = 'exact';
      } else if (similarity >= 0.9) {
        matchType = 'fuzzy';
      }

      matches.push({
        unit,
        matchType,
        similarity: adjustedSimilarity,
        suggestion: unit.targetText,
      });
    }

    // Sort by similarity (descending) and limit results
    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, maxResults);
  }

  /**
   * Find exact match for a source text
   */
  async findExactMatch(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationUnit | null> {
    await this.ensureCacheLoaded();

    const fingerprint = this.generateFingerprint(sourceText, sourceLanguage, targetLanguage);
    const key = this.getLanguagePairKey(sourceLanguage, targetLanguage);
    const units = this.memoryCache.get(key) || [];

    return units.find(u => u.fingerprint === fingerprint) || null;
  }

  /**
   * Get translation unit by ID
   */
  async getTranslationUnit(id: string): Promise<TranslationUnit | null> {
    await this.ensureCacheLoaded();

    for (const units of this.memoryCache.values()) {
      const unit = units.find(u => u.id === id);
      if (unit) return unit;
    }

    return null;
  }

  /**
   * Update a translation unit
   */
  async updateTranslationUnit(
    id: string,
    updates: Partial<Omit<TranslationUnit, 'id' | 'fingerprint'>>
  ): Promise<TranslationUnit> {
    const unit = await this.getTranslationUnit(id);

    if (!unit) {
      throw new Error(`Translation unit not found: ${id}`);
    }

    const updated: TranslationUnit = {
      ...unit,
      ...updates,
      id: unit.id, // Preserve ID
      fingerprint: unit.fingerprint, // Preserve fingerprint
    };

    this.saveTranslationUnit(updated);

    // Update cache
    const key = this.getLanguagePairKey(unit.sourceLanguage, unit.targetLanguage);
    const units = this.memoryCache.get(key) || [];
    const index = units.findIndex(u => u.id === id);
    if (index >= 0) {
      units[index] = updated;
    }

    return updated;
  }

  /**
   * Delete a translation unit
   */
  async deleteTranslationUnit(id: string): Promise<boolean> {
    const unit = await this.getTranslationUnit(id);

    if (!unit) {
      return false;
    }

    const filePath = path.join(DATA_DIR, `${id}.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from cache
    const key = this.getLanguagePairKey(unit.sourceLanguage, unit.targetLanguage);
    const units = this.memoryCache.get(key) || [];
    const index = units.findIndex(u => u.id === id);
    if (index >= 0) {
      units.splice(index, 1);
    }

    return true;
  }

  /**
   * Import translations in bulk
   */
  async importTranslations(
    units: Array<{
      sourceText: string;
      targetText: string;
      sourceLanguage: string;
      targetLanguage: string;
      context?: TranslationUnit['context'];
      metadata?: Partial<TranslationUnit['metadata']>;
    }>
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const unit of units) {
      try {
        // Check if translation already exists
        const existing = await this.findExactMatch(
          unit.sourceText,
          unit.sourceLanguage,
          unit.targetLanguage
        );

        if (existing) {
          skipped++;
          continue;
        }

        await this.addTranslation(
          unit.sourceText,
          unit.targetText,
          unit.sourceLanguage,
          unit.targetLanguage,
          {
            context: unit.context,
            metadata: unit.metadata,
          }
        );

        imported++;
      } catch (error) {
        errors.push(
          `Failed to import translation: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Export all translations for a language pair
   */
  async exportTranslations(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationUnit[]> {
    await this.ensureCacheLoaded();

    const key = this.getLanguagePairKey(sourceLanguage, targetLanguage);
    return this.memoryCache.get(key) || [];
  }

  /**
   * Get translation memory statistics
   */
  async getStats(): Promise<TranslationMemoryStats> {
    await this.ensureCacheLoaded();

    let totalUnits = 0;
    let totalUsageCount = 0;
    const byLanguagePair: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    const byQuality: Record<string, number> = {};
    const allUnits: TranslationUnit[] = [];

    for (const [key, units] of this.memoryCache.entries()) {
      totalUnits += units.length;
      byLanguagePair[key] = units.length;

      for (const unit of units) {
        totalUsageCount += unit.metadata.usageCount;
        allUnits.push(unit);

        // Count by domain
        const domain = unit.context?.domain || 'unknown';
        byDomain[domain] = (byDomain[domain] || 0) + 1;

        // Count by quality
        const quality = unit.metadata.quality || 'unknown';
        byQuality[quality] = (byQuality[quality] || 0) + 1;
      }
    }

    // Find most used translations (top 10)
    const mostUsedTranslations = allUnits
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, 10);

    return {
      totalUnits,
      byLanguagePair,
      byDomain,
      byQuality,
      totalUsageCount,
      mostUsedTranslations,
    };
  }

  /**
   * Clear all translation memory
   */
  async clearMemory(): Promise<number> {
    await this.ensureCacheLoaded();

    let deleted = 0;

    // Delete all files
    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(DATA_DIR, file));
          deleted++;
        }
      }
    }

    // Clear cache
    this.memoryCache.clear();

    return deleted;
  }

  // Private helper methods

  private async ensureCacheLoaded(): Promise<void> {
    if (this.cacheLoaded) {
      return;
    }

    // Load all translation units from disk
    if (!fs.existsSync(DATA_DIR)) {
      this.cacheLoaded = true;
      return;
    }

    const files = fs.readdirSync(DATA_DIR);

    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }

      try {
        const filePath = path.join(DATA_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const unit = JSON.parse(content) as TranslationUnit;

        const key = this.getLanguagePairKey(unit.sourceLanguage, unit.targetLanguage);
        if (!this.memoryCache.has(key)) {
          this.memoryCache.set(key, []);
        }
        this.memoryCache.get(key)!.push(unit);
      } catch (error) {
        console.error(`Failed to load translation unit from ${file}:`, error);
      }
    }

    this.cacheLoaded = true;
  }

  private saveTranslationUnit(unit: TranslationUnit): void {
    const filePath = path.join(DATA_DIR, `${unit.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(unit, null, 2), 'utf-8');
  }

  private getLanguagePairKey(sourceLanguage: string, targetLanguage: string): string {
    return `${sourceLanguage}-${targetLanguage}`;
  }

  private generateFingerprint(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): string {
    // Normalize text for fingerprinting
    const normalized = sourceText.trim().toLowerCase();
    const key = `${sourceLanguage}:${targetLanguage}:${normalized}`;

    // Simple hash function (for demonstration; use crypto.createHash in production)
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `fp_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Calculate similarity between two strings (Levenshtein distance based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Normalize strings
    const s1 = str1.trim().toLowerCase();
    const s2 = str2.trim().toLowerCase();

    // Exact match
    if (s1 === s2) {
      return 1;
    }

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    // Convert distance to similarity (0-1)
    const similarity = 1 - distance / maxLength;

    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Create distance matrix
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      Array.from({ length: n + 1 }, () => 0)
    );

    // Initialize first column and row
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1, // deletion
            dp[i][j - 1] + 1, // insertion
            dp[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }

    return dp[m][n];
  }
}

// Singleton instance
let translationMemoryService: TranslationMemoryService | null = null;

export function getTranslationMemoryService(): TranslationMemoryService {
  if (!translationMemoryService) {
    translationMemoryService = new TranslationMemoryService();
  }
  return translationMemoryService;
}
