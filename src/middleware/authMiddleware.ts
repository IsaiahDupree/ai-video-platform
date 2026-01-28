/**
 * Authentication Middleware - ADS-014
 * Middleware for Next.js API routes and server actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { workspaceAuthManager } from '../services/auth';
import { ResourceType, ActionType, WorkspaceRole } from '../types/workspace';

/**
 * User session information (mock - replace with real auth provider)
 */
export interface UserSession {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Extract user session from request
 * This is a mock implementation - replace with your actual auth provider
 * (e.g., NextAuth, Clerk, Auth0, Supabase Auth, etc.)
 */
export function getUserSession(request: NextRequest): UserSession | null {
  // Mock implementation - in production, extract from:
  // - JWT token in Authorization header
  // - Session cookie
  // - Auth provider (NextAuth, Clerk, etc.)

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  // Mock: Parse "Bearer user:email:name" format
  const [, token] = authHeader.split(' ');
  if (!token) {
    return null;
  }

  const [userId, email, name] = token.split(':');
  if (!userId || !email) {
    return null;
  }

  return { userId, email, name };
}

/**
 * Require authentication middleware
 * Ensures user is authenticated before proceeding
 */
export async function requireAuth(
  request: NextRequest,
  handler: (req: NextRequest, session: UserSession) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = getUserSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handler(request, session);
}

/**
 * Require workspace access middleware
 * Ensures user is a member of the workspace
 */
export async function requireWorkspaceAccess(
  request: NextRequest,
  workspaceId: string,
  handler: (req: NextRequest, session: UserSession) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = getUserSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const member = await workspaceAuthManager.getMember(workspaceId, session.userId);

  if (!member) {
    return NextResponse.json({ error: 'Forbidden: Not a workspace member' }, { status: 403 });
  }

  // Update member activity
  await workspaceAuthManager.updateMemberActivity(workspaceId, session.userId);

  return handler(request, session);
}

/**
 * Require permission middleware
 * Ensures user has specific permission in the workspace
 */
export async function requirePermission(
  request: NextRequest,
  workspaceId: string,
  resource: ResourceType,
  action: ActionType,
  handler: (req: NextRequest, session: UserSession) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = getUserSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await workspaceAuthManager.checkPermission(
    session.userId,
    workspaceId,
    resource,
    action
  );

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Forbidden: Insufficient permissions',
        reason: result.reason,
        requiredRole: result.requiredRole,
      },
      { status: 403 }
    );
  }

  // Update member activity
  await workspaceAuthManager.updateMemberActivity(workspaceId, session.userId);

  return handler(request, session);
}

/**
 * Require role middleware
 * Ensures user has a specific role or higher in the workspace
 */
export async function requireRole(
  request: NextRequest,
  workspaceId: string,
  requiredRole: WorkspaceRole,
  handler: (req: NextRequest, session: UserSession) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = getUserSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasRole = await workspaceAuthManager.hasRoleOrHigher(
    session.userId,
    workspaceId,
    requiredRole
  );

  if (!hasRole) {
    return NextResponse.json(
      {
        error: 'Forbidden: Insufficient role',
        requiredRole,
      },
      { status: 403 }
    );
  }

  // Update member activity
  await workspaceAuthManager.updateMemberActivity(workspaceId, session.userId);

  return handler(request, session);
}

/**
 * Require workspace owner middleware
 * Ensures user is the workspace owner
 */
export async function requireWorkspaceOwner(
  request: NextRequest,
  workspaceId: string,
  handler: (req: NextRequest, session: UserSession) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = getUserSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isOwner = await workspaceAuthManager.isWorkspaceOwner(session.userId, workspaceId);

  if (!isOwner) {
    return NextResponse.json({ error: 'Forbidden: Only workspace owner can perform this action' }, { status: 403 });
  }

  // Update member activity
  await workspaceAuthManager.updateMemberActivity(workspaceId, session.userId);

  return handler(request, session);
}

/**
 * Helper to extract workspace ID from URL
 */
export function getWorkspaceIdFromUrl(request: NextRequest): string | null {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');

  // Look for workspace ID in path (e.g., /api/workspaces/:workspaceId/...)
  const workspaceIndex = pathSegments.indexOf('workspaces');
  if (workspaceIndex !== -1 && pathSegments[workspaceIndex + 1]) {
    return pathSegments[workspaceIndex + 1];
  }

  // Look for workspace ID in query params
  const workspaceId = url.searchParams.get('workspaceId');
  if (workspaceId) {
    return workspaceId;
  }

  return null;
}

/**
 * Example usage decorators for API routes
 */

/**
 * Protect an API route with authentication
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, async (req, session) => {
 *     return NextResponse.json({ message: `Hello ${session.email}` });
 *   });
 * }
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, session: UserSession) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(request, handler);
}

/**
 * Protect an API route with workspace access
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const workspaceId = getWorkspaceIdFromUrl(request);
 *   return withWorkspaceAccess(request, workspaceId!, async (req, session) => {
 *     return NextResponse.json({ message: 'Workspace data' });
 *   });
 * }
 */
export async function withWorkspaceAccess(
  request: NextRequest,
  workspaceId: string,
  handler: (req: NextRequest, session: UserSession) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireWorkspaceAccess(request, workspaceId, handler);
}

/**
 * Protect an API route with specific permission
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const workspaceId = getWorkspaceIdFromUrl(request);
 *   return withPermission(
 *     request,
 *     workspaceId!,
 *     ResourceType.AD_TEMPLATE,
 *     ActionType.CREATE,
 *     async (req, session) => {
 *       // Create ad template
 *       return NextResponse.json({ success: true });
 *     }
 *   );
 * }
 */
export async function withPermission(
  request: NextRequest,
  workspaceId: string,
  resource: ResourceType,
  action: ActionType,
  handler: (req: NextRequest, session: UserSession) => Promise<NextResponse>
): Promise<NextResponse> {
  return requirePermission(request, workspaceId, resource, action, handler);
}

/**
 * Protect an API route with role requirement
 *
 * @example
 * export async function DELETE(request: NextRequest) {
 *   const workspaceId = getWorkspaceIdFromUrl(request);
 *   return withRole(
 *     request,
 *     workspaceId!,
 *     WorkspaceRole.ADMIN,
 *     async (req, session) => {
 *       // Delete resource
 *       return NextResponse.json({ success: true });
 *     }
 *   );
 * }
 */
export async function withRole(
  request: NextRequest,
  workspaceId: string,
  requiredRole: WorkspaceRole,
  handler: (req: NextRequest, session: UserSession) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireRole(request, workspaceId, requiredRole, handler);
}
