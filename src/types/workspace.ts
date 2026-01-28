/**
 * Workspace Types - ADS-014
 * Type definitions for workspace management and role-based access control
 */

/**
 * User role in a workspace
 */
export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

/**
 * Workspace member
 */
export interface WorkspaceMember {
  userId: string;
  email: string;
  name?: string;
  role: WorkspaceRole;
  invitedAt: string;
  acceptedAt?: string;
  invitedBy: string; // userId
  lastActiveAt?: string;
}

/**
 * Workspace configuration
 */
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // User ID of the workspace owner

  // Members and access
  members: WorkspaceMember[];

  // Settings
  settings: WorkspaceSettings;

  // Metadata
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/**
 * Workspace settings
 */
export interface WorkspaceSettings {
  // Brand settings
  defaultBrandKitId?: string;

  // Render settings
  renderQuality?: 'draft' | 'standard' | 'high';
  maxConcurrentRenders?: number;

  // Storage settings
  storageProvider?: 's3' | 'r2' | 'local';
  storageBucket?: string;

  // Collaboration settings
  allowGuestAccess?: boolean;
  requireApproval?: boolean;

  // Notification settings
  webhookUrl?: string;
  emailNotifications?: boolean;
}

/**
 * Permission definition
 */
export interface Permission {
  resource: ResourceType;
  action: ActionType;
  roles: WorkspaceRole[];
}

/**
 * Resource types in the system
 */
export enum ResourceType {
  WORKSPACE = 'workspace',
  BRAND_KIT = 'brand_kit',
  AD_TEMPLATE = 'ad_template',
  CAMPAIGN = 'campaign',
  RENDER = 'render',
  MEMBER = 'member',
  SETTINGS = 'settings',
}

/**
 * Action types
 */
export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  RENDER = 'render',
  EXPORT = 'export',
  INVITE = 'invite',
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: WorkspaceRole;
}

/**
 * Workspace invitation
 */
export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
}

/**
 * User context for authorization
 */
export interface UserContext {
  userId: string;
  email: string;
  name?: string;
  workspaces: {
    workspaceId: string;
    role: WorkspaceRole;
  }[];
}

/**
 * Default role permissions
 * Defines what each role can do
 */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  [WorkspaceRole.OWNER]: [
    // Owners can do everything
    { resource: ResourceType.WORKSPACE, action: ActionType.MANAGE, roles: [WorkspaceRole.OWNER] },
    { resource: ResourceType.BRAND_KIT, action: ActionType.MANAGE, roles: [WorkspaceRole.OWNER] },
    { resource: ResourceType.AD_TEMPLATE, action: ActionType.MANAGE, roles: [WorkspaceRole.OWNER] },
    { resource: ResourceType.CAMPAIGN, action: ActionType.MANAGE, roles: [WorkspaceRole.OWNER] },
    { resource: ResourceType.RENDER, action: ActionType.MANAGE, roles: [WorkspaceRole.OWNER] },
    { resource: ResourceType.MEMBER, action: ActionType.MANAGE, roles: [WorkspaceRole.OWNER] },
    { resource: ResourceType.SETTINGS, action: ActionType.MANAGE, roles: [WorkspaceRole.OWNER] },
  ],
  [WorkspaceRole.ADMIN]: [
    // Admins can manage most things except workspace deletion
    { resource: ResourceType.WORKSPACE, action: ActionType.READ, roles: [WorkspaceRole.ADMIN] },
    { resource: ResourceType.WORKSPACE, action: ActionType.UPDATE, roles: [WorkspaceRole.ADMIN] },
    { resource: ResourceType.BRAND_KIT, action: ActionType.MANAGE, roles: [WorkspaceRole.ADMIN] },
    { resource: ResourceType.AD_TEMPLATE, action: ActionType.MANAGE, roles: [WorkspaceRole.ADMIN] },
    { resource: ResourceType.CAMPAIGN, action: ActionType.MANAGE, roles: [WorkspaceRole.ADMIN] },
    { resource: ResourceType.RENDER, action: ActionType.MANAGE, roles: [WorkspaceRole.ADMIN] },
    { resource: ResourceType.MEMBER, action: ActionType.INVITE, roles: [WorkspaceRole.ADMIN] },
    { resource: ResourceType.MEMBER, action: ActionType.READ, roles: [WorkspaceRole.ADMIN] },
    { resource: ResourceType.SETTINGS, action: ActionType.UPDATE, roles: [WorkspaceRole.ADMIN] },
  ],
  [WorkspaceRole.EDITOR]: [
    // Editors can create and edit content
    { resource: ResourceType.WORKSPACE, action: ActionType.READ, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.BRAND_KIT, action: ActionType.READ, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.AD_TEMPLATE, action: ActionType.CREATE, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.AD_TEMPLATE, action: ActionType.READ, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.AD_TEMPLATE, action: ActionType.UPDATE, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.CAMPAIGN, action: ActionType.CREATE, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.CAMPAIGN, action: ActionType.READ, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.CAMPAIGN, action: ActionType.UPDATE, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.RENDER, action: ActionType.RENDER, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.RENDER, action: ActionType.READ, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.RENDER, action: ActionType.EXPORT, roles: [WorkspaceRole.EDITOR] },
    { resource: ResourceType.MEMBER, action: ActionType.READ, roles: [WorkspaceRole.EDITOR] },
  ],
  [WorkspaceRole.VIEWER]: [
    // Viewers can only read
    { resource: ResourceType.WORKSPACE, action: ActionType.READ, roles: [WorkspaceRole.VIEWER] },
    { resource: ResourceType.BRAND_KIT, action: ActionType.READ, roles: [WorkspaceRole.VIEWER] },
    { resource: ResourceType.AD_TEMPLATE, action: ActionType.READ, roles: [WorkspaceRole.VIEWER] },
    { resource: ResourceType.CAMPAIGN, action: ActionType.READ, roles: [WorkspaceRole.VIEWER] },
    { resource: ResourceType.RENDER, action: ActionType.READ, roles: [WorkspaceRole.VIEWER] },
    { resource: ResourceType.MEMBER, action: ActionType.READ, roles: [WorkspaceRole.VIEWER] },
  ],
};

/**
 * Type guard for WorkspaceRole
 */
export function isValidWorkspaceRole(role: string): role is WorkspaceRole {
  return Object.values(WorkspaceRole).includes(role as WorkspaceRole);
}

/**
 * Type guard for Workspace
 */
export function isWorkspace(obj: any): obj is Workspace {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.ownerId === 'string' &&
    Array.isArray(obj.members) &&
    obj.settings &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string' &&
    typeof obj.isActive === 'boolean'
  );
}

/**
 * Type guard for WorkspaceMember
 */
export function isWorkspaceMember(obj: any): obj is WorkspaceMember {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.userId === 'string' &&
    typeof obj.email === 'string' &&
    isValidWorkspaceRole(obj.role) &&
    typeof obj.invitedAt === 'string' &&
    typeof obj.invitedBy === 'string'
  );
}

/**
 * Default workspace settings
 */
export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  renderQuality: 'standard',
  maxConcurrentRenders: 5,
  storageProvider: 'local',
  allowGuestAccess: false,
  requireApproval: false,
  emailNotifications: true,
};

/**
 * Helper to create a workspace with default values
 */
export function createWorkspace(
  partial: Partial<Workspace> & {
    id: string;
    name: string;
    ownerId: string;
  }
): Workspace {
  const now = new Date().toISOString();

  // Owner is automatically added as a member
  const ownerMember: WorkspaceMember = {
    userId: partial.ownerId,
    email: partial.members?.[0]?.email || 'owner@example.com',
    name: partial.members?.[0]?.name,
    role: WorkspaceRole.OWNER,
    invitedAt: now,
    acceptedAt: now,
    invitedBy: partial.ownerId,
    lastActiveAt: now,
  };

  return {
    description: '',
    members: [ownerMember],
    settings: DEFAULT_WORKSPACE_SETTINGS,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/**
 * Helper to check if a user has a specific role or higher
 */
export function hasRoleOrHigher(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  const roleHierarchy = [
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  ];

  const userLevel = roleHierarchy.indexOf(userRole);
  const requiredLevel = roleHierarchy.indexOf(requiredRole);

  return userLevel >= requiredLevel;
}
