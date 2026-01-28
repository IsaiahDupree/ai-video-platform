/**
 * TRACK-003: Activation Event Tracking - Render API
 * Handles render requests and tracks first_render_completed event
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderAdTemplate, type RenderStillOptions } from '../../../services/renderStill';
import { serverTracking } from '../../../services/trackingServer';
import type { AdTemplate } from '../../../types/adTemplate';

interface RenderRequest {
  template: AdTemplate;
  options?: RenderStillOptions;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RenderRequest = await request.json();
    const { template, options, userId } = body;

    // Validate input
    if (!template || !template.id) {
      return NextResponse.json(
        { error: 'template is required and must have an id' },
        { status: 400 }
      );
    }

    // Render the template
    const result = await renderAdTemplate(template, options);

    // Track first_render_completed on successful render
    if (result.success) {
      serverTracking.track('first_render_completed', {
        templateId: template.id,
        format: result.format,
        width: result.width,
        height: result.height,
        sizeInBytes: result.sizeInBytes,
        timestamp: new Date().toISOString(),
        userId: userId,
      });
    }

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error) {
    console.error('Error in render API:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to render',
      },
      { status: 500 }
    );
  }
}
