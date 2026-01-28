/**
 * APP-011: CPP List & Management
 *
 * API route for managing a specific Custom Product Page (get, update, delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomProductPage,
  updateCustomProductPage,
  deleteCustomProductPage,
  getCompleteCustomProductPage,
} from '@/services/ascCustomProductPages';

/**
 * GET /api/cpp/[id] - Get a custom product page by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const complete = searchParams.get('complete') === 'true';

    if (complete) {
      // Get complete data including versions and localizations
      const data = await getCompleteCustomProductPage(id);
      return NextResponse.json({
        success: true,
        data,
      });
    } else {
      // Get just the custom product page
      const data = await getCustomProductPage(id);
      return NextResponse.json({
        success: true,
        data,
      });
    }
  } catch (error) {
    console.error('Error getting custom product page:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get custom product page',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cpp/[id] - Update a custom product page
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const { name, visible } = body;

    const data = await updateCustomProductPage({
      customProductPageId: id,
      name,
      visible,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating custom product page:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update custom product page',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cpp/[id] - Delete a custom product page
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await deleteCustomProductPage({
      customProductPageId: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Custom product page deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting custom product page:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete custom product page',
      },
      { status: 500 }
    );
  }
}
