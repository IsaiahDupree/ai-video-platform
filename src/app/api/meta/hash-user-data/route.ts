/**
 * API Endpoint: Hash User Data
 *
 * POST /api/meta/hash-user-data
 *
 * Hashes user PII data with SHA256 for Meta Pixel/CAPI tracking.
 * This endpoint allows the client to hash sensitive user data server-side
 * before sending to Meta for conversion tracking.
 *
 * Security Notes:
 * - This endpoint should be rate-limited in production
 * - Consider adding authentication if needed
 * - User data is not stored, only hashed and returned
 */

import { NextRequest, NextResponse } from 'next/server';
import { hashUserData, UserDataToHash } from '@/utils/hashUserData';

export async function POST(request: NextRequest) {
  try {
    const userData: UserDataToHash = await request.json();

    // Validate that we have at least one field to hash
    if (!userData || Object.keys(userData).length === 0) {
      return NextResponse.json(
        { error: 'No user data provided' },
        { status: 400 }
      );
    }

    // Hash all provided user data
    const hashedData = await hashUserData(userData);

    return NextResponse.json({
      success: true,
      hashedData,
    });
  } catch (error) {
    console.error('[Hash User Data API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to hash user data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
