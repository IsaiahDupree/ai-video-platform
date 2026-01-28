/**
 * APP-011: CPP List & Management
 *
 * API route for listing Custom Product Pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { listCustomProductPages } from '@/services/ascCustomProductPages';
import type { ListCustomProductPagesOptions } from '@/types/ascCustomProductPages';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const options: ListCustomProductPagesOptions = {};

    const appId = searchParams.get('appId');
    if (appId) {
      options.filterAppId = appId;
    }

    const visible = searchParams.get('visible');
    if (visible !== null) {
      options.filterVisible = visible === 'true';
    }

    const limit = searchParams.get('limit');
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    // Always include versions for the list view
    options.include = ['appCustomProductPageVersions'];

    // Fetch custom product pages
    const response = await listCustomProductPages(options);

    return NextResponse.json({
      success: true,
      data: response.data,
      meta: response.meta,
      links: response.links,
    });
  } catch (error) {
    console.error('Error listing custom product pages:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list custom product pages',
      },
      { status: 500 }
    );
  }
}
