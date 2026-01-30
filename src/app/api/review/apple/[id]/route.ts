/**
 * API Route: /api/review/apple/[id]
 * Get specific Apple approvable resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAppleApprovalService } from '@/services/appleApprovalService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const service = getAppleApprovalService();
    const { id } = await params;
    const resource = await service.getResource(id);

    if (!resource) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resource not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      resource,
    });
  } catch (error) {
    console.error('Failed to get Apple approval resource:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load resource',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
