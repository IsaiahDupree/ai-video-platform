/**
 * Custom Audience Detail API
 * META-007: Custom Audiences Setup
 *
 * GET /api/audiences/:id - Get audience
 * PUT /api/audiences/:id - Update audience
 * DELETE /api/audiences/:id - Delete audience
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomAudience,
  updateCustomAudience,
  deleteCustomAudience,
  getAudienceMembers,
  getAudienceMetrics,
  getSyncLogs,
} from '@/services/customAudience';
import { UpdateCustomAudienceInput } from '@/types/customAudience';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/audiences/:id
 * Get custom audience details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const include = request.nextUrl.searchParams.get('include');

    const audience = await getCustomAudience(id);

    if (!audience) {
      return NextResponse.json(
        {
          success: false,
          error: 'Custom audience not found',
        },
        { status: 404 }
      );
    }

    const response: any = {
      success: true,
      data: audience,
    };

    // Include related data if requested
    if (include?.includes('members')) {
      response.members = await getAudienceMembers(id);
    }

    if (include?.includes('metrics')) {
      response.metrics = await getAudienceMetrics(id);
    }

    if (include?.includes('sync_logs')) {
      response.sync_logs = await getSyncLogs(id, 10);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching custom audience:', error);
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
 * PUT /api/audiences/:id
 * Update custom audience
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = (await request.json()) as UpdateCustomAudienceInput;

    const audience = await updateCustomAudience(id, body);

    return NextResponse.json(
      {
        success: true,
        data: audience,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating custom audience:', error);
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
 * DELETE /api/audiences/:id
 * Delete custom audience
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if audience exists
    const audience = await getCustomAudience(id);
    if (!audience) {
      return NextResponse.json(
        {
          success: false,
          error: 'Custom audience not found',
        },
        { status: 404 }
      );
    }

    await deleteCustomAudience(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Custom audience deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting custom audience:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
