/**
 * Segments API
 * GDP-012: Segment Engine
 *
 * POST /api/segments - Create segment
 * GET /api/segments - List segments
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSegment,
  listSegments,
  updateSegment,
  deleteSegment,
} from '@/services/segmentEngine';
import { CreateSegmentInput, UpdateSegmentInput } from '@/types/segmentEngine';

/**
 * GET /api/segments
 * List all segments
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('is_active');

    const segments = await listSegments(
      isActive ? isActive === 'true' : undefined
    );

    return NextResponse.json(
      {
        success: true,
        data: segments,
        count: segments.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing segments:', error);
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
 * POST /api/segments
 * Create a new segment
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateSegmentInput;

    // Validate required fields
    if (!body.name || !body.rule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, rule',
        },
        { status: 400 }
      );
    }

    const segment = await createSegment(body);

    return NextResponse.json(
      {
        success: true,
        data: segment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
