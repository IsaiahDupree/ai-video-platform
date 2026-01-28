/**
 * Approval Workflow Types - ADS-016
 * Type definitions for approval workflow: Draft → In Review → Approved
 */

import { WorkspaceRole } from './workspace';

/**
 * Approval status enum
 * Defines the lifecycle of an asset in the approval workflow
 */
export enum ApprovalStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested',
}

/**
 * Resource types that can be approved
 */
export enum ApprovableResourceType {
  AD = 'ad',
  CAMPAIGN = 'campaign',
  AD_VARIANT = 'ad_variant',
  CAMPAIGN_ASSET = 'campaign_asset',
}

/**
 * Comment on an approvable resource
 */
export interface ApprovalComment {
  id: string;
  resourceId: string;
  resourceType: ApprovableResourceType;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: WorkspaceRole;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isInternal?: boolean; // Internal notes vs client-facing comments
  attachments?: string[]; // URLs or paths to attached files
}

/**
 * Status change event in approval history
 */
export interface ApprovalStatusChange {
  id: string;
  resourceId: string;
  resourceType: ApprovableResourceType;
  fromStatus?: ApprovalStatus;
  toStatus: ApprovalStatus;
  changedBy: string;
  changedByName: string;
  changedByEmail: string;
  changedByRole: WorkspaceRole;
  reason?: string;
  timestamp: string;
}

/**
 * Approvable resource base interface
 * Any resource that can go through approval workflow should implement this
 */
export interface ApprovableResource {
  id: string;
  workspaceId: string;
  resourceType: ApprovableResourceType;
  name: string;
  description?: string;

  // Approval workflow fields
  approvalStatus: ApprovalStatus;
  approvalHistory: ApprovalStatusChange[];
  comments: ApprovalComment[];

  // Ownership and tracking
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;

  // Review tracking
  submittedForReviewAt?: string;
  submittedForReviewBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;

  // Metadata
  thumbnailUrl?: string;
  previewUrl?: string;
  tags?: string[];
}

/**
 * Approval workflow settings
 * Controls how approval works in a workspace
 */
export interface ApprovalWorkflowSettings {
  enabled: boolean;
  requiredApprovers: number; // Minimum number of approvals needed
  allowedApproverRoles: WorkspaceRole[]; // Roles that can approve
  allowedReviewerRoles: WorkspaceRole[]; // Roles that can submit for review
  autoApproveOwner: boolean; // Owner's submissions auto-approve
  requireCommentOnReject: boolean;
  notifyOnStatusChange: boolean;
  notifyApprovers: boolean;
}

/**
 * Default approval workflow settings
 */
export const DEFAULT_APPROVAL_SETTINGS: ApprovalWorkflowSettings = {
  enabled: false,
  requiredApprovers: 1,
  allowedApproverRoles: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
  allowedReviewerRoles: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR],
  autoApproveOwner: true,
  requireCommentOnReject: true,
  notifyOnStatusChange: true,
  notifyApprovers: true,
};

/**
 * Approval action types
 */
export enum ApprovalAction {
  SUBMIT_FOR_REVIEW = 'submit_for_review',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
  REVERT_TO_DRAFT = 'revert_to_draft',
}

/**
 * Approval action request
 */
export interface ApprovalActionRequest {
  resourceId: string;
  resourceType: ApprovableResourceType;
  action: ApprovalAction;
  userId: string;
  userRole: WorkspaceRole;
  comment?: string;
  reason?: string;
}

/**
 * Approval action result
 */
export interface ApprovalActionResult {
  success: boolean;
  newStatus: ApprovalStatus;
  statusChange: ApprovalStatusChange;
  message?: string;
  error?: string;
}

/**
 * Approval statistics for a workspace
 */
export interface ApprovalStatistics {
  totalDraft: number;
  totalInReview: number;
  totalApproved: number;
  totalRejected: number;
  totalChangesRequested: number;
  avgTimeToApproval: number; // milliseconds
  approvalRate: number; // percentage
}

/**
 * Filter options for approval queries
 */
export interface ApprovalFilter {
  workspaceId?: string;
  resourceType?: ApprovableResourceType;
  status?: ApprovalStatus[];
  createdBy?: string;
  approvedBy?: string;
  tags?: string[];
  fromDate?: string;
  toDate?: string;
  searchQuery?: string;
}

/**
 * Approval notification
 */
export interface ApprovalNotification {
  id: string;
  workspaceId: string;
  recipientId: string;
  recipientEmail: string;
  resourceId: string;
  resourceType: ApprovableResourceType;
  resourceName: string;
  type: 'submitted' | 'approved' | 'rejected' | 'changes_requested' | 'comment_added';
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

/**
 * Type guard for ApprovableResource
 */
export function isApprovableResource(obj: any): obj is ApprovableResource {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.workspaceId === 'string' &&
    typeof obj.resourceType === 'string' &&
    Object.values(ApprovableResourceType).includes(obj.resourceType) &&
    typeof obj.approvalStatus === 'string' &&
    Object.values(ApprovalStatus).includes(obj.approvalStatus) &&
    Array.isArray(obj.approvalHistory) &&
    Array.isArray(obj.comments)
  );
}

/**
 * Helper: Check if a status transition is valid
 */
export function isValidStatusTransition(
  from: ApprovalStatus,
  to: ApprovalStatus
): boolean {
  const validTransitions: Record<ApprovalStatus, ApprovalStatus[]> = {
    [ApprovalStatus.DRAFT]: [ApprovalStatus.IN_REVIEW],
    [ApprovalStatus.IN_REVIEW]: [
      ApprovalStatus.APPROVED,
      ApprovalStatus.REJECTED,
      ApprovalStatus.CHANGES_REQUESTED,
      ApprovalStatus.DRAFT,
    ],
    [ApprovalStatus.APPROVED]: [ApprovalStatus.DRAFT], // Can revert to draft for changes
    [ApprovalStatus.REJECTED]: [ApprovalStatus.DRAFT],
    [ApprovalStatus.CHANGES_REQUESTED]: [ApprovalStatus.DRAFT, ApprovalStatus.IN_REVIEW],
  };

  return validTransitions[from]?.includes(to) || false;
}

/**
 * Helper: Get action from status transition
 */
export function getActionForTransition(
  from: ApprovalStatus,
  to: ApprovalStatus
): ApprovalAction | null {
  if (from === ApprovalStatus.DRAFT && to === ApprovalStatus.IN_REVIEW) {
    return ApprovalAction.SUBMIT_FOR_REVIEW;
  }
  if (from === ApprovalStatus.IN_REVIEW && to === ApprovalStatus.APPROVED) {
    return ApprovalAction.APPROVE;
  }
  if (from === ApprovalStatus.IN_REVIEW && to === ApprovalStatus.REJECTED) {
    return ApprovalAction.REJECT;
  }
  if (from === ApprovalStatus.IN_REVIEW && to === ApprovalStatus.CHANGES_REQUESTED) {
    return ApprovalAction.REQUEST_CHANGES;
  }
  if (to === ApprovalStatus.DRAFT) {
    return ApprovalAction.REVERT_TO_DRAFT;
  }
  return null;
}

/**
 * Helper: Check if user can perform action
 */
export function canPerformAction(
  action: ApprovalAction,
  userRole: WorkspaceRole,
  settings: ApprovalWorkflowSettings,
  isOwner: boolean
): boolean {
  switch (action) {
    case ApprovalAction.SUBMIT_FOR_REVIEW:
      return settings.allowedReviewerRoles.includes(userRole);

    case ApprovalAction.APPROVE:
      return settings.allowedApproverRoles.includes(userRole);

    case ApprovalAction.REJECT:
    case ApprovalAction.REQUEST_CHANGES:
      return settings.allowedApproverRoles.includes(userRole);

    case ApprovalAction.REVERT_TO_DRAFT:
      // Owner and creator can revert, admins can revert if it's in review
      return isOwner || userRole === WorkspaceRole.OWNER || userRole === WorkspaceRole.ADMIN;

    default:
      return false;
  }
}

/**
 * Helper: Get status badge color
 */
export function getStatusColor(status: ApprovalStatus): string {
  switch (status) {
    case ApprovalStatus.DRAFT:
      return '#6b7280'; // gray
    case ApprovalStatus.IN_REVIEW:
      return '#f59e0b'; // amber
    case ApprovalStatus.APPROVED:
      return '#10b981'; // green
    case ApprovalStatus.REJECTED:
      return '#ef4444'; // red
    case ApprovalStatus.CHANGES_REQUESTED:
      return '#3b82f6'; // blue
    default:
      return '#6b7280';
  }
}

/**
 * Helper: Get status display name
 */
export function getStatusDisplayName(status: ApprovalStatus): string {
  switch (status) {
    case ApprovalStatus.DRAFT:
      return 'Draft';
    case ApprovalStatus.IN_REVIEW:
      return 'In Review';
    case ApprovalStatus.APPROVED:
      return 'Approved';
    case ApprovalStatus.REJECTED:
      return 'Rejected';
    case ApprovalStatus.CHANGES_REQUESTED:
      return 'Changes Requested';
    default:
      return status;
  }
}

/**
 * Helper: Get action display name
 */
export function getActionDisplayName(action: ApprovalAction): string {
  switch (action) {
    case ApprovalAction.SUBMIT_FOR_REVIEW:
      return 'Submit for Review';
    case ApprovalAction.APPROVE:
      return 'Approve';
    case ApprovalAction.REJECT:
      return 'Reject';
    case ApprovalAction.REQUEST_CHANGES:
      return 'Request Changes';
    case ApprovalAction.REVERT_TO_DRAFT:
      return 'Revert to Draft';
    default:
      return action;
  }
}
