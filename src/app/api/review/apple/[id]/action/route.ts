/**
 * API Route: /api/review/apple/[id]/action
 * Perform approval action on Apple resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAppleApprovalService } from '@/services/appleApprovalService';
import { ApprovalAction } from '@/types/approval';
import { WorkspaceRole } from '@/types/workspace';

interface ActionRequestBody {
  action: ApprovalAction;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: WorkspaceRole;
  comment?: string;
  reason?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: ActionRequestBody = await request.json();

    // Validate required fields
    if (!body.action || !body.userId || !body.userName || !body.userEmail || !body.userRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Validate action
    if (!Object.values(ApprovalAction).includes(body.action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action',
        },
        { status: 400 }
      );
    }

    // Perform action
    const service = getAppleApprovalService();
    const result = await service.performAction(
      params.id,
      body.action,
      body.userId,
      body.userName,
      body.userEmail,
      body.userRole,
      body.comment,
      body.reason
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Failed to perform approval action:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform action',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
