/**
 * Copy Generation Stage
 *
 * Uses Google Gemini to auto-generate product-aware ad copy:
 *   - Headlines per hook type (question, statement, shock, curiosity, social_proof, urgency)
 *   - Subheadlines per awareness level (unaware → most_aware)
 *   - CTAs per CTA type (action, benefit, urgency, curiosity)
 *   - Template-specific content (features, stats, testimonials, pricing)
 *
 * Replaces the hardcoded DEFAULT_COPY_BANK with tailored, product-specific copy.
 */

import * as https from 'https';
import type { CopyBank, ProductInput } from './types';

// =============================================================================
// Types
// =============================================================================

export interface CopyGenerationInput {
  product: ProductInput;
  hookTypes?: string[];
  awarenessLevels?: string[];
  ctaTypes?: string[];
  templates?: string[];
  headlinesPerType?: number;
  subheadlinesPerLevel?: number;
  ctasPerType?: number;
}

export interface TemplateSpecificCopy {
  testimonials?: { quote: string; authorName: string; authorTitle: string; rating: number }[];
  features?: { text: string; included: boolean; highlight?: boolean }[];
  stats?: { value: string; label: string; suffix?: string }[];
  productSteps?: { icon: string; title: string; description: string }[];
  urgencyOffer?: { offerText: string; originalPrice: string; salePrice: string; discount: string };
}

export interface GeneratedCopy {
  copyBank: CopyBank;
  templateSpecific: TemplateSpecificCopy;
  productSummary: string;
}

// =============================================================================
// Gemini API
// =============================================================================

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY not set. Add to .env.local');
  }
  return key;
}

function geminiTextRequest(prompt: string): Promise<string> {
  const apiKey = getApiKey();

  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.9,
      maxOutputTokens: 4096,
    },
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk: string) => (responseData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (parsed.error) {
              reject(new Error(parsed.error.message || 'Gemini API error'));
              return;
            }
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
              reject(new Error('No text in Gemini response'));
              return;
            }
            resolve(text);
          } catch (e) {
            reject(new Error(`Failed to parse Gemini response: ${responseData.substring(0, 300)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// =============================================================================
// Prompt Builders
// =============================================================================

function buildCopyBankPrompt(product: ProductInput, input: CopyGenerationInput): string {
  const hookTypes = input.hookTypes || ['question', 'statement', 'shock', 'curiosity', 'social_proof', 'urgency'];
  const awarenessLevels = input.awarenessLevels || ['unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware'];
  const ctaTypes = input.ctaTypes || ['action', 'benefit', 'urgency', 'curiosity'];
  const n = input.headlinesPerType || 3;
  const nSub = input.subheadlinesPerLevel || 3;
  const nCta = input.ctasPerType || 3;

  return `You are an expert performance marketer writing UGC-style ad copy for Meta (Instagram/Facebook) ads.

PRODUCT:
  Name: ${product.name}
  Description: ${product.description}
  ${product.websiteUrl ? `Website: ${product.websiteUrl}` : ''}

Generate ad copy for this product. The copy must feel native to social media — casual, punchy, scroll-stopping. Never be generic. Every line should reference the specific product or its specific benefits.

Return a JSON object with this exact structure:

{
  "headlines": {
    ${hookTypes.map(h => `"${h}": [${n} short headlines, max 8 words each]`).join(',\n    ')}
  },
  "subheadlines": {
    ${awarenessLevels.map(a => `"${a}": [${nSub} subheadlines, 10-20 words, tailored to this awareness level]`).join(',\n    ')}
  },
  "ctas": {
    ${ctaTypes.map(c => `"${c}": [${nCta} CTA button texts, 2-5 words]`).join(',\n    ')}
  },
  "beforeLabels": [3 short labels for the "before" state, 1-2 words],
  "afterLabels": [3 short labels for the "after" state, 1-2 words],
  "trustLines": [4 trust/social proof lines, max 6 words each, use · as separator, last one empty string ""],
  "badges": [6 badge texts, 1-2 words each, last one empty string ""]
}

HOOK TYPE GUIDELINES:
- question: Ask a pain-point question the target user would nod at
- statement: Bold claim about the problem or solution
- shock: Surprising stat or counterintuitive fact
- curiosity: Tease the solution without revealing it
- social_proof: Reference user count, ratings, or community
- urgency: Time-limited or scarcity framing

AWARENESS LEVEL GUIDELINES:
- unaware: Don't mention the product. Focus on the outcome.
- problem_aware: Name the pain point. Hint at a solution.
- solution_aware: Position against alternatives. Why this is better.
- product_aware: Assume they know the product. Give a reason to act now.
- most_aware: Direct offer. Price, credits, trial.

Return ONLY the JSON object, no markdown fences, no explanation.`;
}

function buildTemplateSpecificPrompt(product: ProductInput, templates: string[]): string {
  return `You are an expert performance marketer. Generate template-specific ad content for this product:

PRODUCT:
  Name: ${product.name}
  Description: ${product.description}

Generate content for these ad templates. Return a JSON object:

{
  ${templates.includes('testimonial') ? `"testimonials": [
    { "quote": "realistic 1-2 sentence testimonial", "authorName": "First L.", "authorTitle": "role/title", "rating": 5 },
    { "quote": "another testimonial", "authorName": "First L.", "authorTitle": "role/title", "rating": 5 },
    { "quote": "third testimonial", "authorName": "First L.", "authorTitle": "role/title", "rating": 4 }
  ],` : ''}
  ${templates.includes('feature_list') ? `"features": [
    { "text": "feature description, 2-4 words", "included": true, "highlight": true },
    { "text": "feature 2", "included": true, "highlight": false },
    { "text": "feature 3", "included": true, "highlight": false },
    { "text": "feature 4", "included": true, "highlight": true },
    { "text": "feature 5", "included": true, "highlight": false }
  ],` : ''}
  ${templates.includes('stat_counter') ? `"stats": [
    { "value": "big number", "label": "what it measures", "suffix": "+" or "★" or "%" },
    { "value": "big number", "label": "what it measures", "suffix": "+" },
    { "value": "big number", "label": "what it measures", "suffix": "+" }
  ],` : ''}
  ${templates.includes('product_demo') ? `"productSteps": [
    { "icon": "emoji", "title": "Step 1 title", "description": "2-4 word description" },
    { "icon": "emoji", "title": "Step 2 title", "description": "2-4 word description" },
    { "icon": "emoji", "title": "Step 3 title", "description": "2-4 word description" }
  ],` : ''}
  ${templates.includes('urgency') ? `"urgencyOffer": {
    "offerText": "what's on offer, e.g. Annual Pro Plan",
    "originalPrice": "$XX",
    "salePrice": "$YY",
    "discount": "XX% OFF"
  },` : ''}
  "productSummary": "one sentence summary of the product"
}

Make all content specific to ${product.name}. Use realistic but aspirational numbers for stats. Testimonials should sound like real users, not marketing copy. Feature descriptions should be specific to what this product actually does.

Return ONLY the JSON object, no markdown fences.`;
}

// =============================================================================
// Copy Generation Stage
// =============================================================================

export async function runCopyGenerationStage(input: CopyGenerationInput): Promise<GeneratedCopy> {
  console.log('\n✍️  Copy Generation Stage');
  console.log(`   Product: ${input.product.name}`);
  console.log(`   Description: ${input.product.description.substring(0, 80)}...`);
  console.log('─'.repeat(60));

  const startTime = Date.now();

  // Generate copy bank and template-specific content in parallel
  console.log('   📝 Generating ad copy with Gemini...');

  const templates = input.templates || ['before_after', 'testimonial', 'product_demo', 'problem_solution', 'stat_counter', 'feature_list', 'urgency'];
  const needsTemplateSpecific = templates.some(t =>
    ['testimonial', 'feature_list', 'stat_counter', 'product_demo', 'urgency'].includes(t)
  );

  const copyBankPrompt = buildCopyBankPrompt(input.product, input);
  const templatePrompt = needsTemplateSpecific
    ? buildTemplateSpecificPrompt(input.product, templates)
    : null;

  // Fire both requests concurrently
  const [copyBankRaw, templateRaw] = await Promise.all([
    geminiTextRequest(copyBankPrompt),
    templatePrompt ? geminiTextRequest(templatePrompt) : Promise.resolve('{}'),
  ]);

  // Parse responses
  let copyBank: CopyBank;
  let templateSpecific: TemplateSpecificCopy = {};
  let productSummary = '';

  try {
    const parsed = JSON.parse(copyBankRaw);
    copyBank = {
      headlines: parsed.headlines || {},
      subheadlines: parsed.subheadlines || {},
      ctas: parsed.ctas || {},
      beforeLabels: parsed.beforeLabels || ['BEFORE', 'WITHOUT', 'OLD WAY'],
      afterLabels: parsed.afterLabels || ['AFTER', 'WITH', 'NEW WAY'],
      trustLines: parsed.trustLines || [''],
      badges: parsed.badges || [''],
    };
    console.log('   ✅ Copy bank generated');

    // Log sample
    const firstHook = Object.keys(copyBank.headlines)[0];
    if (firstHook && copyBank.headlines[firstHook]?.[0]) {
      console.log(`      Sample headline (${firstHook}): "${copyBank.headlines[firstHook][0]}"`);
    }
    const firstAwareness = Object.keys(copyBank.subheadlines)[0];
    if (firstAwareness && copyBank.subheadlines[firstAwareness]?.[0]) {
      console.log(`      Sample sub (${firstAwareness}): "${copyBank.subheadlines[firstAwareness][0].substring(0, 60)}..."`);
    }
  } catch (e: any) {
    console.log(`   ⚠️  Failed to parse copy bank JSON: ${e.message}`);
    console.log(`      Raw (first 200 chars): ${copyBankRaw.substring(0, 200)}`);
    throw new Error(`Copy bank generation failed: ${e.message}`);
  }

  try {
    const parsed = JSON.parse(templateRaw);
    templateSpecific = {
      testimonials: parsed.testimonials,
      features: parsed.features,
      stats: parsed.stats,
      productSteps: parsed.productSteps,
      urgencyOffer: parsed.urgencyOffer,
    };
    productSummary = parsed.productSummary || '';

    if (templateSpecific.testimonials?.length) {
      console.log(`   ✅ ${templateSpecific.testimonials.length} testimonials generated`);
    }
    if (templateSpecific.features?.length) {
      console.log(`   ✅ ${templateSpecific.features.length} features generated`);
    }
    if (templateSpecific.stats?.length) {
      console.log(`   ✅ ${templateSpecific.stats.length} stats generated`);
    }
    if (templateSpecific.productSteps?.length) {
      console.log(`   ✅ ${templateSpecific.productSteps.length} product steps generated`);
    }
    if (templateSpecific.urgencyOffer) {
      console.log(`   ✅ Urgency offer generated: ${templateSpecific.urgencyOffer.discount}`);
    }
  } catch (e: any) {
    console.log(`   ⚠️  Template-specific content parse failed (non-fatal): ${e.message}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalHeadlines = Object.values(copyBank.headlines).reduce((sum, arr) => sum + arr.length, 0);
  const totalSubs = Object.values(copyBank.subheadlines).reduce((sum, arr) => sum + arr.length, 0);
  const totalCtas = Object.values(copyBank.ctas).reduce((sum, arr) => sum + arr.length, 0);

  console.log(`\n   📊 Copy generated in ${elapsed}s`);
  console.log(`      Headlines: ${totalHeadlines} across ${Object.keys(copyBank.headlines).length} hook types`);
  console.log(`      Subheadlines: ${totalSubs} across ${Object.keys(copyBank.subheadlines).length} awareness levels`);
  console.log(`      CTAs: ${totalCtas} across ${Object.keys(copyBank.ctas).length} CTA types`);

  return {
    copyBank,
    templateSpecific,
    productSummary,
  };
}
