/**
 * ADS-020: Multi-language Localization Service
 * Service for managing multi-language creative variants
 */

import fs from 'fs';
import path from 'path';
import { LocalizedCreative, TranslationRequest, TranslationResponse, TranslationField, LocalizationConfig, getLanguage } from '../types/localization';
import OpenAI from 'openai';

const DATA_DIR = path.join(process.cwd(), 'data', 'localizations');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * LocalizationService - Manage multi-language creative variants
 */
export class LocalizationService {
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Create a localized variant of a creative
   */
  async createLocalizedCreative(
    baseCreativeId: string,
    language: string,
    translations: TranslationField[],
    metadata: LocalizedCreative['metadata']
  ): Promise<LocalizedCreative> {
    const id = `${baseCreativeId}_${language}_${Date.now()}`;

    const localized: LocalizedCreative = {
      id,
      baseCreativeId,
      language,
      translations,
      metadata,
    };

    // Save to file
    this.saveLocalizedCreative(localized);

    return localized;
  }

  /**
   * Get all localized variants for a creative
   */
  getLocalizedCreatives(baseCreativeId: string): LocalizedCreative[] {
    if (!fs.existsSync(DATA_DIR)) {
      return [];
    }

    const files = fs.readdirSync(DATA_DIR);
    const variants: LocalizedCreative[] = [];

    for (const file of files) {
      if (file.startsWith(baseCreativeId) && file.endsWith('.json')) {
        const filePath = path.join(DATA_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const variant = JSON.parse(content) as LocalizedCreative;
        variants.push(variant);
      }
    }

    return variants;
  }

  /**
   * Get a specific localized creative
   */
  getLocalizedCreative(id: string): LocalizedCreative | null {
    const filePath = path.join(DATA_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as LocalizedCreative;
  }

  /**
   * Get localized creative by creative ID and language
   */
  getLocalizedCreativeByLanguage(baseCreativeId: string, language: string): LocalizedCreative | null {
    const variants = this.getLocalizedCreatives(baseCreativeId);
    return variants.find(v => v.language === language) || null;
  }

  /**
   * Update a localized creative
   */
  updateLocalizedCreative(id: string, updates: Partial<LocalizedCreative>): LocalizedCreative {
    const existing = this.getLocalizedCreative(id);

    if (!existing) {
      throw new Error(`Localized creative not found: ${id}`);
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      baseCreativeId: existing.baseCreativeId, // Preserve base ID
    };

    this.saveLocalizedCreative(updated);

    return updated;
  }

  /**
   * Delete a localized creative
   */
  deleteLocalizedCreative(id: string): boolean {
    const filePath = path.join(DATA_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    return true;
  }

  /**
   * Delete all localized creatives for a base creative
   */
  deleteAllLocalizedCreatives(baseCreativeId: string): number {
    const variants = this.getLocalizedCreatives(baseCreativeId);
    let deleted = 0;

    for (const variant of variants) {
      if (this.deleteLocalizedCreative(variant.id)) {
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Translate creative fields using AI
   */
  async translateWithAI(request: TranslationRequest): Promise<TranslationResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const { creativeId, sourceLanguage, targetLanguages, fields, context } = request;

    // Get source language info
    const sourceLang = getLanguage(sourceLanguage);
    if (!sourceLang) {
      throw new Error(`Unsupported source language: ${sourceLanguage}`);
    }

    const translations: LocalizedCreative[] = [];
    const errors: { language: string; error: string }[] = [];

    // Translate to each target language
    for (const targetLanguage of targetLanguages) {
      try {
        const targetLang = getLanguage(targetLanguage);
        if (!targetLang) {
          errors.push({
            language: targetLanguage,
            error: `Unsupported target language: ${targetLanguage}`,
          });
          continue;
        }

        // Build translation prompt
        const prompt = this.buildTranslationPrompt(
          sourceLang.name,
          targetLang.name,
          fields,
          context
        );

        // Call OpenAI API
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator specializing in marketing copy and advertising content. Provide translations that are culturally appropriate and maintain the tone and intent of the original text.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });

        const response = completion.choices[0].message.content;
        if (!response) {
          throw new Error('Empty response from OpenAI');
        }

        // Parse response (expecting JSON format)
        const translatedFields = this.parseTranslationResponse(response, fields);

        // Create localized creative
        const localized = await this.createLocalizedCreative(
          creativeId,
          targetLanguage,
          translatedFields,
          {
            translatedBy: 'AI (GPT-4)',
            translatedAt: new Date().toISOString(),
            method: 'ai',
            verified: false,
          }
        );

        translations.push(localized);
      } catch (error) {
        errors.push({
          language: targetLanguage,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      translations,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Verify a translation
   */
  verifyTranslation(id: string, verifiedBy: string): LocalizedCreative {
    const localized = this.getLocalizedCreative(id);

    if (!localized) {
      throw new Error(`Localized creative not found: ${id}`);
    }

    return this.updateLocalizedCreative(id, {
      metadata: {
        ...localized.metadata,
        verified: true,
        verifiedBy,
        verifiedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Get translation statistics for a creative
   */
  getTranslationStats(baseCreativeId: string) {
    const variants = this.getLocalizedCreatives(baseCreativeId);

    return {
      total: variants.length,
      verified: variants.filter(v => v.metadata.verified).length,
      unverified: variants.filter(v => !v.metadata.verified).length,
      byMethod: {
        ai: variants.filter(v => v.metadata.method === 'ai').length,
        manual: variants.filter(v => v.metadata.method === 'manual').length,
        professional: variants.filter(v => v.metadata.method === 'professional').length,
      },
      languages: variants.map(v => v.language),
    };
  }

  /**
   * Export all translations for a creative
   */
  exportTranslations(baseCreativeId: string): Record<string, Record<string, string>> {
    const variants = this.getLocalizedCreatives(baseCreativeId);
    const exported: Record<string, Record<string, string>> = {};

    for (const variant of variants) {
      const fields: Record<string, string> = {};

      for (const translation of variant.translations) {
        fields[translation.fieldName] = translation.translatedText;
      }

      exported[variant.language] = fields;
    }

    return exported;
  }

  /**
   * Import translations from external format
   */
  async importTranslations(
    baseCreativeId: string,
    translations: Record<string, Record<string, string>>,
    metadata: Partial<LocalizedCreative['metadata']> = {}
  ): Promise<LocalizedCreative[]> {
    const imported: LocalizedCreative[] = [];

    for (const [language, fields] of Object.entries(translations)) {
      const translationFields: TranslationField[] = Object.entries(fields).map(
        ([fieldName, translatedText]) => ({
          fieldName,
          originalText: '', // Will be filled from base creative
          translatedText,
        })
      );

      const localized = await this.createLocalizedCreative(
        baseCreativeId,
        language,
        translationFields,
        {
          translatedBy: metadata.translatedBy || 'Import',
          translatedAt: new Date().toISOString(),
          method: metadata.method || 'manual',
          verified: metadata.verified || false,
          verifiedBy: metadata.verifiedBy,
          verifiedAt: metadata.verifiedAt,
        }
      );

      imported.push(localized);
    }

    return imported;
  }

  // Private helper methods

  private saveLocalizedCreative(localized: LocalizedCreative): void {
    const filePath = path.join(DATA_DIR, `${localized.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(localized, null, 2), 'utf-8');
  }

  private buildTranslationPrompt(
    sourceLang: string,
    targetLang: string,
    fields: Record<string, string>,
    context?: TranslationRequest['context']
  ): string {
    let prompt = `Translate the following marketing copy from ${sourceLang} to ${targetLang}.\n\n`;

    if (context) {
      if (context.industry) {
        prompt += `Industry: ${context.industry}\n`;
      }
      if (context.tone) {
        prompt += `Tone: ${context.tone}\n`;
      }
      if (context.audience) {
        prompt += `Target Audience: ${context.audience}\n`;
      }
      if (context.brandVoice) {
        prompt += `Brand Voice: ${context.brandVoice}\n`;
      }
      prompt += '\n';
    }

    prompt += 'Fields to translate:\n\n';

    for (const [fieldName, text] of Object.entries(fields)) {
      prompt += `${fieldName}: "${text}"\n`;
    }

    prompt += '\nPlease provide translations in JSON format:\n';
    prompt += '{\n';
    for (const fieldName of Object.keys(fields)) {
      prompt += `  "${fieldName}": "translated text here",\n`;
    }
    prompt += '}\n\n';
    prompt += 'Important:\n';
    prompt += '- Maintain the tone and intent of the original text\n';
    prompt += '- Keep translations culturally appropriate\n';
    prompt += '- Preserve any special formatting (e.g., capitalization for CTAs)\n';
    prompt += '- Keep similar length to the original when possible\n';

    return prompt;
  }

  private parseTranslationResponse(
    response: string,
    fields: Record<string, string>
  ): TranslationField[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;

      return Object.entries(parsed).map(([fieldName, translatedText]) => ({
        fieldName,
        originalText: fields[fieldName] || '',
        translatedText,
      }));
    } catch (error) {
      throw new Error(`Failed to parse translation response: ${error}`);
    }
  }
}

// Singleton instance
let localizationService: LocalizationService | null = null;

export function getLocalizationService(): LocalizationService {
  if (!localizationService) {
    localizationService = new LocalizationService();
  }
  return localizationService;
}

/**
 * Configuration management
 */
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

export function getLocalizationConfig(): LocalizationConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
      autoTranslate: false,
      requireVerification: true,
    };
  }

  const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(content) as LocalizationConfig;
}

export function setLocalizationConfig(config: LocalizationConfig): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}
