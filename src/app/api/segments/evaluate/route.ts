/**
 * Segment Evaluation API
 * GDP-012: Segment Engine
 *
 * POST /api/segments/evaluate - Evaluate person against segments
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  evaluatePersonSegments,
  evaluateSegmentForPerson,
} from '@/services/segmentEngine';

/**
 * POST /api/segments/evaluate
 * Evaluate a person against segment(s)
 *
 * Request body:
 * {
 *   person_id: string (required)
 *   segment_id?: string (optional - evaluate specific segment, or all if not provided)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { person_id, segment_id } = body;

    // Validate required fields
    if (!person_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: person_id',
        },
        { status: 400 }
      );
    }

    let result;

    if (segment_id) {
      // Evaluate specific segment
      result = await evaluateSegmentForPerson(person_id, segment_id);
    } else {
      // Evaluate all segments
      result = await evaluatePersonSegments(person_id);
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error evaluating segments:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
