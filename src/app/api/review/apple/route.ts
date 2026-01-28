/**
 * API Route: /api/review/apple
 * List Apple approvable resources with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAppleApprovalService } from '@/services/appleApprovalService';
import { AppleApprovalFilter } from '@/types/appleApproval';
import { ApprovalStatus } from '@/types/approval';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build filter from query params
    const filter: AppleApprovalFilter = {
      workspaceId: searchParams.get('workspaceId') || undefined,
      appId: searchParams.get('appId') || undefined,
      locale: searchParams.get('locale') || undefined,
      deviceType: searchParams.get('deviceType') || undefined,
      searchQuery: searchParams.get('search') || undefined,
    };

    // Parse status filter
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const statuses = statusParam.split(',').filter((s) =>
        Object.values(ApprovalStatus).includes(s as ApprovalStatus)
      ) as ApprovalStatus[];
      if (statuses.length > 0) {
        filter.status = statuses;
      }
    }

    // Parse resource type filter
    const resourceTypeParam = searchParams.get('resourceType');
    if (resourceTypeParam) {
      const types = resourceTypeParam.split(',');
      if (types.length > 0) {
        filter.resourceType = types as any;
      }
    }

    // Get service and fetch data
    const service = getAppleApprovalService();
    const items = await service.listResources(filter);
    const stats = await service.getStatistics(filter);

    return NextResponse.json({
      success: true,
      items,
      stats,
      count: items.length,
    });
  } catch (error) {
    console.error('Failed to list Apple approval resources:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load approval items',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
