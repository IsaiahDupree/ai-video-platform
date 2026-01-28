/**
 * Authentication Service - ADS-014
 * Service for workspace authentication and role-based access control (RBAC)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceInvitation,
  UserContext,
  ResourceType,
  ActionType,
  Permission,
  PermissionCheckResult,
  ROLE_PERMISSIONS,
  isWorkspace,
  isWorkspaceMember,
  createWorkspace,
  hasRoleOrHigher,
} from '../types/workspace';

/**
 * Storage directories
 */
const WORKSPACES_DIR = path.join(process.cwd(), 'data', 'workspaces');
const INVITATIONS_DIR = path.join(process.cwd(), 'data', 'invitations');

/**
 * Ensure directories exist
 */
function ensureDirectories(): void {
  if (!fs.existsSync(WORKSPACES_DIR)) {
    fs.mkdirSync(WORKSPACES_DIR, { recursive: true });
  }
  if (!fs.existsSync(INVITATIONS_DIR)) {
    fs.mkdirSync(INVITATIONS_DIR, { recursive: true });
  }
}

/**
 * Workspace Authentication Manager
 */
export class WorkspaceAuthManager {
  private workspacesDir: string;
  private invitationsDir: string;

  constructor(workspacesDir?: string, invitationsDir?: string) {
    this.workspacesDir = workspacesDir || WORKSPACES_DIR;
    this.invitationsDir = invitationsDir || INVITATIONS_DIR;
    ensureDirectories();
  }

  // ============================================================================
  // Workspace Management
  // ============================================================================

  /**
   * Create a new workspace
   */
  async createWorkspace(
    name: string,
    ownerId: string,
    ownerEmail: string,
    options?: Partial<Workspace>
  ): Promise<Workspace> {
    const id = `workspace-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const workspace = createWorkspace({
      id,
      name,
      ownerId,
      members: [
        {
          userId: ownerId,
          email: ownerEmail,
          role: WorkspaceRole.OWNER,
          invitedAt: new Date().toISOString(),
          acceptedAt: new Date().toISOString(),
          invitedBy: ownerId,
        },
      ],
      ...options,
    });

    await this.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Get a workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const filePath = path.join(this.workspacesDir, `${workspaceId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const workspace = JSON.parse(data);

    if (!isWorkspace(workspace)) {
      throw new Error(`Invalid workspace format: ${workspaceId}`);
    }

    return workspace;
  }

  /**
   * Save a workspace
   */
  async saveWorkspace(workspace: Workspace): Promise<void> {
    const filePath = path.join(this.workspacesDir, `${workspace.id}.json`);
    workspace.updatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(workspace, null, 2));
  }

  /**
   * Update a workspace
   */
  async updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Promise<Workspace> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    const updatedWorkspace: Workspace = {
      ...workspace,
      ...updates,
      id: workspace.id, // Prevent ID change
      ownerId: workspace.ownerId, // Prevent owner change via this method
      createdAt: workspace.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    };

    await this.saveWorkspace(updatedWorkspace);
    return updatedWorkspace;
  }

  /**
   * Delete a workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<boolean> {
    const filePath = path.join(this.workspacesDir, `${workspaceId}.json`);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    return true;
  }

  /**
   * List all workspaces
   */
  async listWorkspaces(): Promise<Workspace[]> {
    if (!fs.existsSync(this.workspacesDir)) {
      return [];
    }

    const files = fs.readdirSync(this.workspacesDir).filter(f => f.endsWith('.json'));
    const workspaces: Workspace[] = [];

    for (const file of files) {
      const data = fs.readFileSync(path.join(this.workspacesDir, file), 'utf-8');
      const workspace = JSON.parse(data);

      if (isWorkspace(workspace)) {
        workspaces.push(workspace);
      }
    }

    return workspaces;
  }

  /**
   * Get workspaces for a user
   */
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const allWorkspaces = await this.listWorkspaces();
    return allWorkspaces.filter(workspace =>
      workspace.members.some(member => member.userId === userId)
    );
  }

  // ============================================================================
  // Member Management
  // ============================================================================

  /**
   * Add a member to a workspace
   */
  async addMember(
    workspaceId: string,
    member: Omit<WorkspaceMember, 'invitedAt'>
  ): Promise<Workspace> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    // Check if member already exists
    const existingMember = workspace.members.find(m => m.userId === member.userId);
    if (existingMember) {
      throw new Error(`User ${member.userId} is already a member`);
    }

    const newMember: WorkspaceMember = {
      ...member,
      invitedAt: new Date().toISOString(),
    };

    workspace.members.push(newMember);
    await this.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Remove a member from a workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<Workspace> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    // Prevent removing the owner
    if (workspace.ownerId === userId) {
      throw new Error('Cannot remove the workspace owner');
    }

    workspace.members = workspace.members.filter(m => m.userId !== userId);
    await this.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    newRole: WorkspaceRole
  ): Promise<Workspace> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    // Prevent changing owner role
    if (workspace.ownerId === userId && newRole !== WorkspaceRole.OWNER) {
      throw new Error('Cannot change the owner role');
    }

    const member = workspace.members.find(m => m.userId === userId);
    if (!member) {
      throw new Error(`User ${userId} is not a member`);
    }

    member.role = newRole;
    await this.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Get a member from a workspace
   */
  async getMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      return null;
    }

    return workspace.members.find(m => m.userId === userId) || null;
  }

  /**
   * Update member's last active timestamp
   */
  async updateMemberActivity(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      return;
    }

    const member = workspace.members.find(m => m.userId === userId);
    if (member) {
      member.lastActiveAt = new Date().toISOString();
      await this.saveWorkspace(workspace);
    }
  }

  // ============================================================================
  // Invitation Management
  // ============================================================================

  /**
   * Create an invitation
   */
  async createInvitation(
    workspaceId: string,
    email: string,
    role: WorkspaceRole,
    invitedBy: string,
    expiresInDays: number = 7
  ): Promise<WorkspaceInvitation> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    // Check if email is already a member
    const existingMember = workspace.members.find(m => m.email === email);
    if (existingMember) {
      throw new Error(`${email} is already a member`);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    const invitation: WorkspaceInvitation = {
      id: `invite-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      workspaceId,
      email,
      role,
      invitedBy,
      invitedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      token: crypto.randomBytes(32).toString('hex'),
      status: 'pending',
    };

    const filePath = path.join(this.invitationsDir, `${invitation.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(invitation, null, 2));

    return invitation;
  }

  /**
   * Get an invitation by token
   */
  async getInvitationByToken(token: string): Promise<WorkspaceInvitation | null> {
    if (!fs.existsSync(this.invitationsDir)) {
      return null;
    }

    const files = fs.readdirSync(this.invitationsDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const data = fs.readFileSync(path.join(this.invitationsDir, file), 'utf-8');
      const invitation: WorkspaceInvitation = JSON.parse(data);

      if (invitation.token === token) {
        return invitation;
      }
    }

    return null;
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string, userId: string, userName?: string): Promise<Workspace> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error(`Invitation is ${invitation.status}`);
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired';
      const filePath = path.join(this.invitationsDir, `${invitation.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(invitation, null, 2));
      throw new Error('Invitation has expired');
    }

    const workspace = await this.addMember(invitation.workspaceId, {
      userId,
      email: invitation.email,
      name: userName,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      acceptedAt: new Date().toISOString(),
    });

    // Mark invitation as accepted
    invitation.status = 'accepted';
    const filePath = path.join(this.invitationsDir, `${invitation.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(invitation, null, 2));

    return workspace;
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId: string): Promise<boolean> {
    const filePath = path.join(this.invitationsDir, `${invitationId}.json`);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const invitation: WorkspaceInvitation = JSON.parse(data);

    invitation.status = 'revoked';
    fs.writeFileSync(filePath, JSON.stringify(invitation, null, 2));

    return true;
  }

  /**
   * List invitations for a workspace
   */
  async listInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
    if (!fs.existsSync(this.invitationsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.invitationsDir).filter(f => f.endsWith('.json'));
    const invitations: WorkspaceInvitation[] = [];

    for (const file of files) {
      const data = fs.readFileSync(path.join(this.invitationsDir, file), 'utf-8');
      const invitation: WorkspaceInvitation = JSON.parse(data);

      if (invitation.workspaceId === workspaceId) {
        invitations.push(invitation);
      }
    }

    return invitations;
  }

  // ============================================================================
  // Authorization & Permissions
  // ============================================================================

  /**
   * Check if a user has permission to perform an action
   */
  async checkPermission(
    userId: string,
    workspaceId: string,
    resource: ResourceType,
    action: ActionType
  ): Promise<PermissionCheckResult> {
    const member = await this.getMember(workspaceId, userId);

    if (!member) {
      return {
        allowed: false,
        reason: 'User is not a member of this workspace',
      };
    }

    const permissions = ROLE_PERMISSIONS[member.role];

    // Check for exact permission match
    const hasPermission = permissions.some(
      p => p.resource === resource && (p.action === action || p.action === ActionType.MANAGE)
    );

    if (!hasPermission) {
      // Find the minimum required role for this action
      let requiredRole: WorkspaceRole | undefined;
      for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
        const hasIt = perms.some(
          p => p.resource === resource && (p.action === action || p.action === ActionType.MANAGE)
        );
        if (hasIt) {
          requiredRole = role as WorkspaceRole;
          break;
        }
      }

      return {
        allowed: false,
        reason: `Insufficient permissions. User role: ${member.role}`,
        requiredRole,
      };
    }

    return { allowed: true };
  }

  /**
   * Assert permission (throws if not allowed)
   */
  async assertPermission(
    userId: string,
    workspaceId: string,
    resource: ResourceType,
    action: ActionType
  ): Promise<void> {
    const result = await this.checkPermission(userId, workspaceId, resource, action);
    if (!result.allowed) {
      throw new Error(result.reason || 'Permission denied');
    }
  }

  /**
   * Check if user is workspace owner
   */
  async isWorkspaceOwner(userId: string, workspaceId: string): Promise<boolean> {
    const workspace = await this.getWorkspace(workspaceId);
    return workspace?.ownerId === userId;
  }

  /**
   * Check if user has role or higher
   */
  async hasRoleOrHigher(
    userId: string,
    workspaceId: string,
    requiredRole: WorkspaceRole
  ): Promise<boolean> {
    const member = await this.getMember(workspaceId, userId);
    if (!member) {
      return false;
    }

    return hasRoleOrHigher(member.role, requiredRole);
  }

  /**
   * Get user context (all workspaces and roles)
   */
  async getUserContext(userId: string, email: string, name?: string): Promise<UserContext> {
    const workspaces = await this.getUserWorkspaces(userId);

    return {
      userId,
      email,
      name,
      workspaces: workspaces.map(workspace => {
        const member = workspace.members.find(m => m.userId === userId)!;
        return {
          workspaceId: workspace.id,
          role: member.role,
        };
      }),
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Transfer workspace ownership
   */
  async transferOwnership(workspaceId: string, newOwnerId: string): Promise<Workspace> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    const newOwner = workspace.members.find(m => m.userId === newOwnerId);
    if (!newOwner) {
      throw new Error('New owner must be a member of the workspace');
    }

    // Update old owner to admin
    const oldOwner = workspace.members.find(m => m.userId === workspace.ownerId);
    if (oldOwner) {
      oldOwner.role = WorkspaceRole.ADMIN;
    }

    // Update new owner
    newOwner.role = WorkspaceRole.OWNER;
    workspace.ownerId = newOwnerId;

    await this.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    totalMembers: number;
    roleDistribution: Record<WorkspaceRole, number>;
    activeMembers: number;
    pendingInvitations: number;
  }> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    const invitations = await this.listInvitations(workspaceId);

    const roleDistribution: Record<WorkspaceRole, number> = {
      [WorkspaceRole.OWNER]: 0,
      [WorkspaceRole.ADMIN]: 0,
      [WorkspaceRole.EDITOR]: 0,
      [WorkspaceRole.VIEWER]: 0,
    };

    workspace.members.forEach(member => {
      roleDistribution[member.role]++;
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const activeMembers = workspace.members.filter(
      m => m.lastActiveAt && m.lastActiveAt > thirtyDaysAgo
    ).length;

    return {
      totalMembers: workspace.members.length,
      roleDistribution,
      activeMembers,
      pendingInvitations: invitations.filter(i => i.status === 'pending').length,
    };
  }
}

/**
 * Default workspace auth manager instance
 */
export const workspaceAuthManager = new WorkspaceAuthManager();

/**
 * Convenience functions
 */

export async function createWorkspaceWithOwner(
  name: string,
  ownerId: string,
  ownerEmail: string
): Promise<Workspace> {
  return workspaceAuthManager.createWorkspace(name, ownerId, ownerEmail);
}

export async function checkUserPermission(
  userId: string,
  workspaceId: string,
  resource: ResourceType,
  action: ActionType
): Promise<boolean> {
  const result = await workspaceAuthManager.checkPermission(userId, workspaceId, resource, action);
  return result.allowed;
}

export async function inviteUserToWorkspace(
  workspaceId: string,
  email: string,
  role: WorkspaceRole,
  invitedBy: string
): Promise<WorkspaceInvitation> {
  return workspaceAuthManager.createInvitation(workspaceId, email, role, invitedBy);
}
