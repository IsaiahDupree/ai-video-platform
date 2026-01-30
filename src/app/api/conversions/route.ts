/**
 * Conversions API
 * META-008: Conversion Optimization
 *
 * POST /api/conversions - Track conversion
 * GET /api/conversions - List conversions
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  trackConversionEvent,
  listConversions,
  getConversionSummary,
} from '@/services/conversionOptimization';
import { CreateConversionEventInput } from '@/types/conversionOptimization';

/**
 * GET /api/conversions
 * List conversion events
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const personId = searchParams.get('person_id');
    const conversionType = searchParams.get('conversion_type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      // Return conversion summary
      const result = await getConversionSummary(personId || undefined);

      return NextResponse.json(
        {
          success: true,
          data: result,
        },
        { status: 200 }
      );
    }

    // Return conversion list
    const conversions = await listConversions(
      personId || undefined,
      conversionType || undefined,
      limit
    );

    return NextResponse.json(
      {
        success: true,
        data: conversions,
        count: conversions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing conversions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversions
 * Track a conversion event
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateConversionEventInput;

    // Validate required fields
    if (!body.conversion_type || !body.conversion_source) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: conversion_type, conversion_source',
        },
        { status: 400 }
      );
    }

    const conversion = await trackConversionEvent(body);

    return NextResponse.json(
      {
        success: true,
        data: conversion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error tracking conversion:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
