/**
 * APP-020: AI Translation Suggestions
 * GPT-powered translation suggestions for captions with translation memory integration
 */

import OpenAI from 'openai';
import { getTranslationMemoryService, TranslationUnit } from './translations';

// Initialize OpenAI client lazily to avoid errors at import time
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY environment variable is not set. ' +
        'Please set it in your .env file or environment.'
      );
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Translation quality levels
 */
export type TranslationQuality = 'standard' | 'professional' | 'creative';

/**
 * Translation suggestion options
 */
export interface TranslationSuggestionOptions {
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: {
    domain?: string; // e.g., 'marketing', 'technical', 'app-store'
    fieldType?: string; // e.g., 'headline', 'caption', 'description'
    industry?: string; // e.g., 'technology', 'healthcare'
    tone?: string; // e.g., 'professional', 'casual', 'friendly'
  };
  quality?: TranslationQuality;
  count?: number; // Number of translation suggestions (default: 3)
  useMemory?: boolean; // Check translation memory first (default: true)
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo';
}

/**
 * Translation suggestion result
 */
export interface TranslationSuggestion {
  translation: string;
  confidence: number; // 0-1, where 1 is highest confidence
  source: 'memory-exact' | 'memory-fuzzy' | 'ai-generated';
  explanation?: string; // Why this translation was suggested
  memoryMatch?: {
    unitId: string;
    similarity: number;
    usageCount: number;
  };
}

/**
 * Full translation result with suggestions
 */
export interface TranslationResult {
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  suggestions: TranslationSuggestion[];
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate AI-powered translation suggestions for captions
 * Integrates with translation memory for improved accuracy and consistency
 */
export async function generateTranslationSuggestions(
  options: TranslationSuggestionOptions
): Promise<TranslationResult> {
  const {
    sourceText,
    sourceLanguage,
    targetLanguage,
    context,
    quality = 'standard',
    count = 3,
    useMemory = true,
    model = 'gpt-4o-mini',
  } = options;

  console.log(`Generating ${count} translation suggestions from ${sourceLanguage} to ${targetLanguage}...`);
  console.log(`Source text: "${sourceText}"`);

  const suggestions: TranslationSuggestion[] = [];
  const translationMemory = getTranslationMemoryService();

  // Step 1: Check translation memory for matches
  if (useMemory) {
    try {
      const memoryMatches = await translationMemory.search({
        sourceText,
        sourceLanguage,
        targetLanguage,
        context,
        minSimilarity: 0.7,
        maxResults: 3,
      });

      for (const match of memoryMatches) {
        const source =
          match.matchType === 'exact' ? 'memory-exact' : 'memory-fuzzy';

        suggestions.push({
          translation: match.suggestion,
          confidence: match.similarity,
          source,
          explanation:
            match.matchType === 'exact'
              ? 'Exact match from translation memory'
              : `Similar match from translation memory (${Math.round(match.similarity * 100)}% similarity)`,
          memoryMatch: {
            unitId: match.unit.id,
            similarity: match.similarity,
            usageCount: match.unit.metadata.usageCount,
          },
        });
      }

      console.log(`✓ Found ${memoryMatches.length} matches in translation memory`);

      // If we have an exact match with high confidence, we might not need AI suggestions
      if (memoryMatches.length > 0 && memoryMatches[0].matchType === 'exact') {
        console.log('✓ Exact match found, using cached translation');

        // Still generate AI suggestions if requested, but prioritize memory match
        if (count > 1) {
          console.log('Generating additional AI suggestions...');
        } else {
          return {
            sourceText,
            sourceLanguage,
            targetLanguage,
            suggestions,
          };
        }
      }
    } catch (error) {
      console.warn('Error searching translation memory:', error);
      // Continue with AI translation if memory search fails
    }
  }

  // Step 2: Generate AI-powered translations if we need more suggestions
  const aiSuggestionsNeeded = Math.max(0, count - suggestions.length);

  if (aiSuggestionsNeeded > 0) {
    try {
      const aiSuggestions = await generateAITranslations({
        sourceText,
        sourceLanguage,
        targetLanguage,
        context,
        quality,
        count: aiSuggestionsNeeded,
        model,
      });

      suggestions.push(...aiSuggestions.suggestions);

      return {
        sourceText,
        sourceLanguage,
        targetLanguage,
        suggestions: suggestions.slice(0, count),
        model: aiSuggestions.model,
        usage: aiSuggestions.usage,
      };
    } catch (error) {
      console.error('Error generating AI translations:', error);

      // If we have memory matches but AI failed, return what we have
      if (suggestions.length > 0) {
        return {
          sourceText,
          sourceLanguage,
          targetLanguage,
          suggestions,
        };
      }

      throw error;
    }
  }

  return {
    sourceText,
    sourceLanguage,
    targetLanguage,
    suggestions: suggestions.slice(0, count),
  };
}

/**
 * Generate AI translations using OpenAI
 */
async function generateAITranslations(options: {
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: TranslationSuggestionOptions['context'];
  quality: TranslationQuality;
  count: number;
  model: string;
}): Promise<{ suggestions: TranslationSuggestion[]; model: string; usage?: any }> {
  const {
    sourceText,
    sourceLanguage,
    targetLanguage,
    context,
    quality,
    count,
    model,
  } = options;

  // Build context for the AI
  const contextParts = [];
  if (context?.domain) contextParts.push(`Domain: ${context.domain}`);
  if (context?.fieldType) contextParts.push(`Field type: ${context.fieldType}`);
  if (context?.industry) contextParts.push(`Industry: ${context.industry}`);
  if (context?.tone) contextParts.push(`Tone: ${context.tone}`);

  const contextStr = contextParts.length > 0
    ? `\n\nContext:\n${contextParts.join('\n')}`
    : '';

  // Quality descriptions
  const qualityDescriptions: Record<TranslationQuality, string> = {
    standard: 'accurate and natural-sounding',
    professional: 'polished, professional, and culturally appropriate',
    creative: 'creative and engaging while maintaining the core message',
  };

  const systemPrompt = `You are an expert translator specializing in marketing and app localization. Your translations are ${qualityDescriptions[quality]}, maintaining the intent, tone, and cultural nuances of the original text.`;

  const userPrompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}.

Source text: "${sourceText}"
${contextStr}

Requirements:
- Provide ${count} translation ${count === 1 ? 'option' : 'options'}
- Keep the same tone and intent as the original
- Make the translation sound natural and native to ${targetLanguage}
- Maintain similar length to the original (±20%)
${context?.fieldType === 'headline' ? '- Make headlines attention-grabbing and memorable' : ''}
${context?.fieldType === 'caption' ? '- Ensure captions are clear and concise' : ''}
${context?.fieldType === 'description' ? '- Include key details and benefits' : ''}
- Consider cultural appropriateness for the target language

Return the result as a JSON object with this structure:
{
  "translations": [
    {
      "text": "translated text here",
      "confidence": 0.95,
      "explanation": "brief explanation of translation choices"
    }
  ]
}

The confidence should be a number between 0 and 1, where 1 is highest confidence.`;

  console.log(`Generating ${count} AI translations using ${model}...`);

  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: quality === 'creative' ? 0.8 : 0.3, // More creative = higher temperature
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error('No response from OpenAI');
  }

  // Parse the JSON response
  let translationsData: Array<{ text: string; confidence: number; explanation?: string }>;
  try {
    const parsed = JSON.parse(responseText);

    if (parsed.translations && Array.isArray(parsed.translations)) {
      translationsData = parsed.translations;
    } else if (Array.isArray(parsed)) {
      translationsData = parsed;
    } else {
      // Try to find any array in the response
      const firstArray = Object.values(parsed).find(v => Array.isArray(v));
      if (firstArray && Array.isArray(firstArray)) {
        translationsData = firstArray as any;
      } else {
        throw new Error('Response does not contain an array of translations');
      }
    }
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', responseText);
    throw new Error(`Failed to parse AI response: ${parseError}`);
  }

  // Convert to TranslationSuggestion format
  const suggestions: TranslationSuggestion[] = translationsData
    .filter(t => t.text && typeof t.text === 'string' && t.text.trim().length > 0)
    .map(t => ({
      translation: t.text.trim(),
      confidence: typeof t.confidence === 'number' ? t.confidence : 0.8,
      source: 'ai-generated' as const,
      explanation: t.explanation || 'AI-generated translation',
    }))
    .slice(0, count);

  if (suggestions.length === 0) {
    throw new Error('No valid translations generated');
  }

  console.log(`✓ Generated ${suggestions.length} AI translations`);

  return {
    suggestions,
    model,
    usage: {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    },
  };
}

/**
 * Accept a translation suggestion and save it to translation memory
 */
export async function acceptTranslation(
  sourceText: string,
  targetText: string,
  sourceLanguage: string,
  targetLanguage: string,
  options: {
    context?: TranslationSuggestionOptions['context'];
    quality?: TranslationUnit['metadata']['quality'];
    source?: TranslationUnit['metadata']['source'];
  } = {}
): Promise<TranslationUnit> {
  console.log('Saving translation to memory...');

  const translationMemory = getTranslationMemoryService();

  const unit = await translationMemory.addTranslation(
    sourceText,
    targetText,
    sourceLanguage,
    targetLanguage,
    {
      context: options.context,
      metadata: {
        quality: options.quality || 'verified',
        source: options.source || 'ai',
        createdBy: 'user',
      },
    }
  );

  console.log(`✓ Translation saved to memory (ID: ${unit.id})`);

  return unit;
}

/**
 * Batch translate multiple texts
 */
export async function batchTranslate(
  texts: Array<{
    text: string;
    context?: TranslationSuggestionOptions['context'];
  }>,
  sourceLanguage: string,
  targetLanguage: string,
  options: {
    quality?: TranslationQuality;
    useMemory?: boolean;
  } = {}
): Promise<TranslationResult[]> {
  console.log(`Batch translating ${texts.length} texts from ${sourceLanguage} to ${targetLanguage}...`);

  // Process in parallel with a concurrency limit to avoid rate limits
  const results: TranslationResult[] = [];
  const batchSize = 5; // Process 5 at a time

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const batchPromises = batch.map(item =>
      generateTranslationSuggestions({
        sourceText: item.text,
        sourceLanguage,
        targetLanguage,
        context: item.context,
        quality: options.quality,
        count: 1, // Just get best translation for batch
        useMemory: options.useMemory,
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    console.log(`✓ Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
  }

  return results;
}

/**
 * Get supported languages for translation
 * Returns common languages supported by the translation system
 */
export function getSupportedLanguages(): Array<{
  code: string;
  name: string;
  nativeName: string;
}> {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
    { code: 'zh-Hant', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
    { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  ];
}
