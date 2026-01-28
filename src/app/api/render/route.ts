/**
 * TRACK-003: Activation Event Tracking - Render API
 * TRACK-008: Error & Performance Tracking - API Error Tracking
 * Handles render requests and tracks first_render_completed event
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderAdTemplate, type RenderStillOptions } from '../../../services/renderStill';
import { serverTracking } from '../../../services/trackingServer';
import { measureAPIPerformance, trackAPIError } from '../../../services/errorPerformanceTracking';
import type { AdTemplate } from '../../../types/adTemplate';

interface RenderRequest {
  template: AdTemplate;
  options?: RenderStillOptions;
  userId?: string;
}

export async function POST(request: NextRequest) {
  // Generate unique request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Start API performance measurement
  const completeTracking = measureAPIPerformance('/api/render', requestId);

  try {
    const body: RenderRequest = await request.json();
    const { template, options, userId } = body;

    // Validate input
    if (!template || !template.id) {
      const error = 'template is required and must have an id';
      completeTracking(false, 400, error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    // Render the template
    const result = await renderAdTemplate(template, options);

    // Check if render was successful
    if (!result.success) {
      // Track API error for failed render
      completeTracking(false, 500, result.error || 'Render failed');
      return NextResponse.json({
        success: false,
        result,
      }, { status: 500 });
    }

    // Track successful API call
    completeTracking(true, 200);

    // Track first_render_completed on successful render
    serverTracking.track('first_render_completed', {
      templateId: template.id,
      format: result.format,
      width: result.width,
      height: result.height,
      sizeInBytes: result.sizeInBytes,
      timestamp: new Date().toISOString(),
      userId: userId,
    });

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error) {
    console.error('Error in render API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to render';

    // Track API error
    completeTracking(false, 500, errorMessage);

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
