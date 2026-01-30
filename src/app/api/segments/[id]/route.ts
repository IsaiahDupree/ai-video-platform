/**
 * Segment Detail API
 * GDP-012: Segment Engine
 *
 * GET /api/segments/:id - Get segment
 * PUT /api/segments/:id - Update segment
 * DELETE /api/segments/:id - Delete segment
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSegment,
  updateSegment,
  deleteSegment,
  getSegmentMembers,
  listAutomations,
} from '@/services/segmentEngine';
import { UpdateSegmentInput } from '@/types/segmentEngine';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/segments/:id
 * Get segment details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const include = request.nextUrl.searchParams.get('include');

    const segment = await getSegment(id);

    if (!segment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Segment not found',
        },
        { status: 404 }
      );
    }

    const response: any = {
      success: true,
      data: segment,
    };

    // Include related data if requested
    if (include?.includes('members')) {
      response.members = await getSegmentMembers(id);
    }

    if (include?.includes('automations')) {
      response.automations = await listAutomations(id);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching segment:', error);
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
 * PUT /api/segments/:id
 * Update segment
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = (await request.json()) as UpdateSegmentInput;

    const segment = await updateSegment(id, body);

    return NextResponse.json(
      {
        success: true,
        data: segment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating segment:', error);
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
 * DELETE /api/segments/:id
 * Delete segment
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if segment exists
    const segment = await getSegment(id);
    if (!segment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Segment not found',
        },
        { status: 404 }
      );
    }

    await deleteSegment(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Segment deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting segment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
