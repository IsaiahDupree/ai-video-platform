/**
 * Click Redirect API Route - GDP-006
 *
 * Handles email link clicks and tracks through to conversion
 * Creates tracking token and redirects to destination
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordClickAndRedirect } from '../../../../services/clickRedirect';

interface ClickRedirectQuery {
  ct?: string; // click token
  url?: string; // destination URL
  personalizedUrl?: string; // Optional personalized URL
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clickToken = searchParams.get('ct') as string | null;
    const destinationUrl = searchParams.get('url') || searchParams.get('dest');
    const personalizedUrl = searchParams.get('personalizedUrl');

    // Validate click token
    if (!clickToken) {
      return NextResponse.json(
        {
          error: 'Missing click token',
        },
        { status: 400 }
      );
    }

    // Validate destination URL
    if (!destinationUrl) {
      return NextResponse.json(
        {
          error: 'Missing destination URL',
        },
        { status: 400 }
      );
    }

    // Record click and get redirect URL
    const redirectUrl = await recordClickAndRedirect(
      clickToken,
      destinationUrl,
      personalizedUrl || undefined
    );

    // Return redirect
    return NextResponse.redirect(redirectUrl, {
      status: 302,
    });
  } catch (error) {
    console.error('Error processing click redirect:', error);

    // On error, try to redirect to the destination URL if provided
    const fallbackUrl = request.nextUrl.searchParams.get('url') || '/';

    return NextResponse.redirect(fallbackUrl, {
      status: 302,
    });
  }
}

/**
 * POST endpoint to programmatically create click redirects
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clickTokenId, destinationUrl, personalizedUrl } = body;

    if (!clickTokenId || !destinationUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    const redirectUrl = await recordClickAndRedirect(
      clickTokenId,
      destinationUrl,
      personalizedUrl
    );

    return NextResponse.json({
      success: true,
      redirectUrl,
      clickTokenId,
    });
  } catch (error) {
    console.error('Error in click redirect POST:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process click redirect',
      },
      { status: 500 }
    );
  }
}
