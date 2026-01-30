/**
 * Segment Automations API
 * GDP-012: Segment Engine
 *
 * POST /api/segments/automations - Create automation
 * GET /api/segments/automations - List automations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createAutomation,
  listAutomations,
  getAutomationExecutions,
} from '@/services/segmentEngine';
import { CreateSegmentAutomationInput } from '@/types/segmentEngine';

/**
 * GET /api/segments/automations
 * List automations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const segmentId = searchParams.get('segment_id');
    const isActive = searchParams.get('is_active');

    const automations = await listAutomations(
      segmentId || undefined,
      isActive ? isActive === 'true' : undefined
    );

    return NextResponse.json(
      {
        success: true,
        data: automations,
        count: automations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing automations:', error);
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
 * POST /api/segments/automations
 * Create automation
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateSegmentAutomationInput;

    // Validate required fields
    if (!body.segment_id || !body.name || !body.trigger_type || !body.action) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: segment_id, name, trigger_type, action',
        },
        { status: 400 }
      );
    }

    const automation = await createAutomation(body);

    return NextResponse.json(
      {
        success: true,
        data: automation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
