/**
 * Custom Audiences API
 * META-007: Custom Audiences Setup
 *
 * POST /api/audiences - Create custom audience
 * GET /api/audiences - List custom audiences
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createCustomAudience,
  listCustomAudiences,
  syncAllActiveAudiences,
} from '@/services/customAudience';
import { CreateCustomAudienceInput } from '@/types/customAudience';

/**
 * GET /api/audiences
 * List all custom audiences
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('is_active');
    const segmentId = searchParams.get('segment_id');

    const audiences = await listCustomAudiences(
      isActive ? isActive === 'true' : undefined,
      segmentId || undefined
    );

    return NextResponse.json(
      {
        success: true,
        data: audiences,
        count: audiences.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing custom audiences:', error);
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
 * POST /api/audiences
 * Create a new custom audience
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateCustomAudienceInput;

    // Validate required fields
    if (!body.name || !body.audience_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, audience_type',
        },
        { status: 400 }
      );
    }

    const audience = await createCustomAudience(body);

    return NextResponse.json(
      {
        success: true,
        data: audience,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating custom audience:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
