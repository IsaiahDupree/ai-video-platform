/**
 * ADS-015: AI Variant Generator API Route
 * API endpoint for generating text variants using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateVariants, VariantType } from '../../../../services/aiVariants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalText, type, count, tone, brandVoice, industry, targetAudience } = body;

    // Validate input
    if (!originalText || typeof originalText !== 'string') {
      return NextResponse.json(
        { error: 'originalText is required and must be a string' },
        { status: 400 }
      );
    }

    if (!type || !['headline', 'subheadline', 'body', 'cta'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be one of: headline, subheadline, body, cta' },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Generate variants
    const result = await generateVariants({
      originalText,
      type: type as VariantType,
      count: count || 10,
      tone: tone || 'professional',
      brandVoice,
      industry,
      targetAudience,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in generate-variants API:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate variants',
      },
      { status: 500 }
    );
  }
}
