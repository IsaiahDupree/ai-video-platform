/**
 * ADS-015: AI Variant Generator API Route
 * TRACK-008: Error & Performance Tracking
 * API endpoint for generating text variants using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateVariants, VariantType } from '../../../../services/aiVariants';
import { measureAPIPerformance } from '../../../../services/errorPerformanceTracking';

export async function POST(request: NextRequest) {
  // Generate unique request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Start API performance measurement
  const completeTracking = measureAPIPerformance('/api/ads/generate-variants', requestId);

  try {
    const body = await request.json();
    const { originalText, type, count, tone, brandVoice, industry, targetAudience } = body;

    // Validate input
    if (!originalText || typeof originalText !== 'string') {
      const error = 'originalText is required and must be a string';
      completeTracking(false, 400, error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    if (!type || !['headline', 'subheadline', 'body', 'cta'].includes(type)) {
      const error = 'type must be one of: headline, subheadline, body, cta';
      completeTracking(false, 400, error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      const error = 'OpenAI API key not configured';
      completeTracking(false, 500, error);
      return NextResponse.json(
        { error },
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

    // Track successful API call
    completeTracking(true, 200);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in generate-variants API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate variants';

    // Track API error
    completeTracking(false, 500, errorMessage);

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
