/**
 * Audience Sync API
 * META-007: Custom Audiences Setup
 *
 * POST /api/audiences/sync - Sync audience members from segment
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  syncAudienceMembers,
  syncAllActiveAudiences,
} from '@/services/customAudience';

/**
 * POST /api/audiences/sync
 * Sync audience members from associated segment
 *
 * Request body:
 * {
 *   audience_id: string (required)
 *   sync_type?: 'full' | 'incremental' | 'update'
 * }
 *
 * Or leave body empty to sync all active audiences
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = {};

    try {
      body = await request.json();
    } catch {
      // Empty body - sync all active audiences
    }

    const { audience_id, sync_type } = body;

    if (audience_id) {
      // Sync specific audience
      const result = await syncAudienceMembers(
        audience_id,
        sync_type || 'incremental'
      );

      return NextResponse.json(
        {
          success: true,
          data: result,
        },
        { status: 200 }
      );
    } else {
      // Sync all active audiences
      const result = await syncAllActiveAudiences();

      return NextResponse.json(
        {
          success: true,
          data: result,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error syncing audiences:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
