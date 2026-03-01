/**
 * Creative Scorer — AI-powered ad quality prediction
 *
 * Uses Gemini to score ad variants before running them,
 * predicting CTR, engagement, and overall quality.
 */

import * as https from 'https';

// =============================================================================
// Gemini API Helper
// =============================================================================

function geminiTextRequest(apiKey: string, prompt: string): Promise<string> {
  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
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
            reject(new Error(`Failed to parse Gemini response: ${responseData.substring(0, 200)}`));
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
// Types
// =============================================================================

export interface CreativeScore {
  variantId: string;
  predictedCtr: number;       // 0-1 scale
  qualityScore: number;       // 0-100
  engagementScore: number;    // 0-100
  clarityScore: number;       // 0-100
  emotionalAppeal: number;    // 0-100
  ctaEffectiveness: number;   // 0-100
  overallRank: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface BatchCreativeReport {
  batchId: string;
  scores: CreativeScore[];
  topVariants: string[];
  bottomVariants: string[];
  averagePredictedCtr: number;
  scoredAt: string;
}

// =============================================================================
// Scorer
// =============================================================================

export async function scoreVariants(
  variants: {
    id: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    hookType: string;
    awarenessLevel: string;
    template: string;
    colorScheme: string;
  }[],
  productContext: {
    name: string;
    description: string;
    targetAudience?: string;
  }
): Promise<CreativeScore[]> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('⚠️  No API key found — using heuristic scoring');
    return heuristicScore(variants);
  }

  const variantDescriptions = variants.map((v, i) => `
Variant ${i + 1} (${v.id}):
  - Headline: "${v.headline}"
  - Subheadline: "${v.subheadline}"
  - CTA: "${v.ctaText}"
  - Hook Type: ${v.hookType}
  - Awareness Level: ${v.awarenessLevel}
  - Template: ${v.template}
  - Color: ${v.colorScheme}
`).join('\n');

  const prompt = `You are an expert performance marketer scoring ad creatives for Meta (Facebook/Instagram).

Product: ${productContext.name}
Description: ${productContext.description}
${productContext.targetAudience ? `Target Audience: ${productContext.targetAudience}` : ''}

Score each variant on these dimensions (0-100):
- qualityScore: Overall creative quality
- engagementScore: Likelihood of likes/comments/shares
- clarityScore: How clear is the message
- emotionalAppeal: Emotional resonance
- ctaEffectiveness: How compelling is the CTA

Also predict CTR (click-through rate) as a decimal (e.g., 0.025 for 2.5%).

For each variant provide:
- strengths: 1-2 key strengths
- weaknesses: 1-2 weaknesses
- suggestions: 1-2 improvement ideas

Variants to score:
${variantDescriptions}

Return JSON array matching this schema:
[{
  "variantId": "string",
  "predictedCtr": number,
  "qualityScore": number,
  "engagementScore": number,
  "clarityScore": number,
  "emotionalAppeal": number,
  "ctaEffectiveness": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"]
}]`;

  try {
    const text = await geminiTextRequest(apiKey, prompt);
    const scores: Omit<CreativeScore, 'overallRank'>[] = JSON.parse(text);

    // Add rankings
    const ranked = scores
      .map((s) => ({ ...s, overallRank: 0 }))
      .sort((a, b) => b.qualityScore - a.qualityScore);

    ranked.forEach((s, i) => { s.overallRank = i + 1; });

    return ranked;
  } catch (e: any) {
    console.log(`⚠️  Gemini scoring failed: ${e.message} — falling back to heuristic`);
    return heuristicScore(variants);
  }
}

export function generateBatchReport(batchId: string, scores: CreativeScore[]): BatchCreativeReport {
  const sorted = [...scores].sort((a, b) => b.qualityScore - a.qualityScore);
  const avgCtr = scores.reduce((s, v) => s + v.predictedCtr, 0) / scores.length;

  return {
    batchId,
    scores: sorted,
    topVariants: sorted.slice(0, 3).map((s) => s.variantId),
    bottomVariants: sorted.slice(-3).map((s) => s.variantId),
    averagePredictedCtr: avgCtr,
    scoredAt: new Date().toISOString(),
  };
}

// =============================================================================
// Heuristic Fallback
// =============================================================================

function heuristicScore(
  variants: {
    id: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    hookType: string;
    awarenessLevel: string;
    template: string;
    colorScheme: string;
  }[]
): CreativeScore[] {
  const hookBonus: Record<string, number> = {
    question: 8,
    social_proof: 10,
    curiosity: 7,
    urgency: 9,
    shock: 6,
    statement: 5,
  };

  const templateBonus: Record<string, number> = {
    before_after: 8,
    testimonial: 9,
    stat_counter: 7,
    urgency: 8,
    product_demo: 6,
    feature_list: 5,
    problem_solution: 7,
  };

  const scores = variants.map((v) => {
    const headlineLength = v.headline.length;
    const clarityScore = Math.min(100, Math.max(40, 100 - Math.abs(headlineLength - 40) * 1.5));
    const hookScore = (hookBonus[v.hookType] || 5) * 10;
    const templateScore = (templateBonus[v.template] || 5) * 10;
    const ctaLength = v.ctaText.length;
    const ctaEffectiveness = Math.min(100, Math.max(40, 100 - Math.abs(ctaLength - 12) * 3));
    const engagementScore = Math.round((hookScore + templateScore) / 2);
    const emotionalAppeal = Math.round((hookScore * 0.6 + clarityScore * 0.4));
    const qualityScore = Math.round(
      clarityScore * 0.25 + engagementScore * 0.25 + emotionalAppeal * 0.25 + ctaEffectiveness * 0.25
    );
    const predictedCtr = Math.max(0.005, Math.min(0.08, qualityScore / 2000 + 0.01));

    return {
      variantId: v.id,
      predictedCtr: Math.round(predictedCtr * 10000) / 10000,
      qualityScore,
      engagementScore,
      clarityScore: Math.round(clarityScore),
      emotionalAppeal,
      ctaEffectiveness: Math.round(ctaEffectiveness),
      overallRank: 0,
      strengths: [
        hookScore >= 80 ? `Strong ${v.hookType} hook` : `${v.template} template works well`,
        ctaEffectiveness >= 70 ? 'Clear CTA' : 'Recognizable format',
      ],
      weaknesses: [
        headlineLength > 60 ? 'Headline may be too long' : headlineLength < 15 ? 'Headline could be more specific' : 'Could test alternative hooks',
      ],
      suggestions: [
        'A/B test with different hook types',
        qualityScore < 70 ? 'Consider rewriting headline for clarity' : 'Test with different color scheme',
      ],
    };
  });

  const ranked = scores.sort((a, b) => b.qualityScore - a.qualityScore);
  ranked.forEach((s, i) => { s.overallRank = i + 1; });
  return ranked;
}
