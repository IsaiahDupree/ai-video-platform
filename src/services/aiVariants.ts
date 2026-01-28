/**
 * ADS-015: AI Variant Generator
 * Generate headline and copy variations using OpenAI
 */

import OpenAI from 'openai';

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
 * Types of text that can be varied
 */
export type VariantType = 'headline' | 'subheadline' | 'body' | 'cta';

/**
 * Options for variant generation
 */
export interface VariantGenerationOptions {
  originalText: string;
  type: VariantType;
  count?: number; // Number of variants to generate (default: 10)
  tone?: 'professional' | 'casual' | 'urgent' | 'friendly' | 'persuasive';
  brandVoice?: string; // Optional brand voice guidelines
  industry?: string; // Optional industry context
  targetAudience?: string; // Optional target audience
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo';
}

/**
 * Result of variant generation
 */
export interface VariantGenerationResult {
  originalText: string;
  type: VariantType;
  variants: string[];
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate AI-powered text variants for ad copy
 */
export async function generateVariants(
  options: VariantGenerationOptions
): Promise<VariantGenerationResult> {
  const {
    originalText,
    type,
    count = 10,
    tone = 'professional',
    brandVoice,
    industry,
    targetAudience,
    model = 'gpt-4o-mini',
  } = options;

  // Build context for the AI
  let contextParts = [];
  if (industry) contextParts.push(`Industry: ${industry}`);
  if (targetAudience) contextParts.push(`Target audience: ${targetAudience}`);
  if (brandVoice) contextParts.push(`Brand voice: ${brandVoice}`);

  const context = contextParts.length > 0
    ? `\n\nContext:\n${contextParts.join('\n')}`
    : '';

  // Build the prompt based on the type
  const typeDescriptions: Record<VariantType, string> = {
    headline: 'attention-grabbing headline',
    subheadline: 'supporting subheadline',
    body: 'compelling body copy',
    cta: 'call-to-action button text',
  };

  const systemPrompt = `You are an expert copywriter specializing in advertising and marketing. Your task is to generate creative variations of ad copy that are compelling, clear, and effective. Match the tone and style requested while maintaining the core message.`;

  const userPrompt = `Generate ${count} variations of this ${typeDescriptions[type]} for an advertisement.

Original ${type}: "${originalText}"

Tone: ${tone}${context}

Requirements:
- Create ${count} distinct variations
- Keep the core message and intent
- Match the ${tone} tone
- Maintain similar length to the original (±20%)
${type === 'headline' ? '- Make each headline attention-grabbing and memorable' : ''}
${type === 'cta' ? '- Keep CTAs concise (2-5 words typically)' : ''}
${type === 'subheadline' ? '- Support and expand on the headline' : ''}
${type === 'body' ? '- Include key benefits and value propositions' : ''}

Return ONLY the ${count} variations as a JSON array of strings, with no additional commentary or formatting. Example format:
["variation 1", "variation 2", "variation 3", ...]`;

  console.log(`Generating ${count} ${type} variants using ${model}...`);
  console.log(`Original: "${originalText}"`);

  try {
    const client = getOpenAIClient();

    // Call OpenAI API
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8, // Higher temperature for more creative variations
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let variants: string[];
    try {
      const parsed = JSON.parse(responseText);
      // Handle both array and object with array property
      if (Array.isArray(parsed)) {
        variants = parsed;
      } else if (parsed.variations && Array.isArray(parsed.variations)) {
        variants = parsed.variations;
      } else if (parsed.variants && Array.isArray(parsed.variants)) {
        variants = parsed.variants;
      } else {
        // Try to find any array in the response
        const firstArray = Object.values(parsed).find(v => Array.isArray(v));
        if (firstArray && Array.isArray(firstArray)) {
          variants = firstArray;
        } else {
          throw new Error('Response does not contain an array of variants');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error(`Failed to parse AI response: ${parseError}`);
    }

    // Validate and clean variants
    variants = variants
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map(v => v.trim())
      .slice(0, count); // Ensure we don't exceed requested count

    if (variants.length === 0) {
      throw new Error('No valid variants generated');
    }

    console.log(`✓ Generated ${variants.length} variants`);

    return {
      originalText,
      type,
      variants,
      model,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('Error generating variants:', error);
    throw error;
  }
}

/**
 * Generate variants for multiple text fields in parallel
 */
export async function generateMultipleVariants(
  fields: Array<{
    text: string;
    type: VariantType;
    options?: Partial<VariantGenerationOptions>;
  }>
): Promise<VariantGenerationResult[]> {
  console.log(`Generating variants for ${fields.length} fields in parallel...`);

  const promises = fields.map((field) =>
    generateVariants({
      originalText: field.text,
      type: field.type,
      ...field.options,
    })
  );

  return Promise.all(promises);
}

/**
 * Score a variant against the original (0-100)
 * This is a simple heuristic-based scoring
 */
export function scoreVariant(original: string, variant: string): number {
  let score = 50; // Base score

  // Length similarity
  const lengthRatio = variant.length / original.length;
  if (lengthRatio >= 0.8 && lengthRatio <= 1.2) {
    score += 20;
  } else if (lengthRatio >= 0.6 && lengthRatio <= 1.4) {
    score += 10;
  }

  // Word count similarity
  const originalWords = original.split(/\s+/).length;
  const variantWords = variant.split(/\s+/).length;
  const wordRatio = variantWords / originalWords;
  if (wordRatio >= 0.8 && wordRatio <= 1.2) {
    score += 15;
  } else if (wordRatio >= 0.6 && wordRatio <= 1.4) {
    score += 8;
  }

  // Uniqueness (different enough from original)
  const similarity = calculateSimilarity(original.toLowerCase(), variant.toLowerCase());
  if (similarity < 0.7) {
    score += 15; // More unique is better
  } else if (similarity < 0.9) {
    score += 8;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate simple word-based similarity (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Rank variants by quality score
 */
export function rankVariants(
  original: string,
  variants: string[]
): Array<{ variant: string; score: number }> {
  return variants
    .map(variant => ({
      variant,
      score: scoreVariant(original, variant),
    }))
    .sort((a, b) => b.score - a.score);
}
