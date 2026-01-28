/**
 * Apple Approval Service - APP-021
 * Service for managing approval workflows for Apple App Store assets
 */

import fs from 'fs';
import path from 'path';
import {
  ApprovalStatus,
  ApprovalComment,
  ApprovalStatusChange,
  ApprovalAction,
  ApprovalWorkflowSettings,
  DEFAULT_APPROVAL_SETTINGS,
  isValidStatusTransition,
  canPerformAction,
} from '../types/approval';
import {
  AppleApprovableResourceType,
  AppleApprovableResource,
  AppleApprovalFilter,
  AppleApprovalStatistics,
  isAppleScreenshotResource,
  isAppleCPPResource,
} from '../types/appleApproval';
import { WorkspaceRole } from '../types/workspace';

/**
 * Apple Approval Service
 * Extends the base approval system for Apple-specific resources
 */
export class AppleApprovalService {
  private dataDir: string;
  private resourcesDir: string;
  private commentsDir: string;
  private historyDir: string;

  constructor(dataDir: string = 'data/apple-approvals') {
    this.dataDir = dataDir;
    this.resourcesDir = path.join(dataDir, 'resources');
    this.commentsDir = path.join(dataDir, 'comments');
    this.historyDir = path.join(dataDir, 'history');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.dataDir, this.resourcesDir, this.commentsDir, this.historyDir].forEach(
      (dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
    );
  }

  /**
   * Get approval settings for Apple workflows
   */
  async getApprovalSettings(workspaceId: string): Promise<ApprovalWorkflowSettings> {
    // TODO: Integrate with workspace service
    // For now, return default settings with approval enabled
    return {
      ...DEFAULT_APPROVAL_SETTINGS,
      enabled: true,
    };
  }

  /**
   * Get Apple resource by ID
   */
  async getResource(resourceId: string): Promise<AppleApprovableResource | null> {
    const filePath = path.join(this.resourcesDir, `${resourceId}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as AppleApprovableResource;
  }

  /**
   * Save Apple resource
   */
  async saveResource(resource: AppleApprovableResource): Promise<void> {
    const filePath = path.join(this.resourcesDir, `${resource.id}.json`);
    resource.updatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(resource, null, 2));
  }

  /**
   * Create a new approvable Apple resource
   */
  async createResource(
    data: Omit<AppleApprovableResource, 'id' | 'approvalStatus' | 'approvalHistory' | 'comments' | 'createdAt' | 'updatedAt'>
  ): Promise<AppleApprovableResource> {
    const resource: AppleApprovableResource = {
      ...data,
      id: `${data.resourceType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      approvalStatus: ApprovalStatus.DRAFT,
      approvalHistory: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as AppleApprovableResource;

    await this.saveResource(resource);
    return resource;
  }

  /**
   * List Apple resources with filtering
   */
  async listResources(filter: AppleApprovalFilter = {}): Promise<AppleApprovableResource[]> {
    const files = fs.readdirSync(this.resourcesDir).filter((f) => f.endsWith('.json'));
    let resources: AppleApprovableResource[] = [];

    for (const file of files) {
      const data = fs.readFileSync(path.join(this.resourcesDir, file), 'utf-8');
      const resource = JSON.parse(data) as AppleApprovableResource;
      resources.push(resource);
    }

    // Apply filters
    if (filter.workspaceId) {
      resources = resources.filter((r) => r.workspaceId === filter.workspaceId);
    }

    if (filter.resourceType) {
      const types = Array.isArray(filter.resourceType) ? filter.resourceType : [filter.resourceType];
      resources = resources.filter((r) => types.includes(r.resourceType as AppleApprovableResourceType));
    }

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      resources = resources.filter((r) => statuses.includes(r.approvalStatus));
    }

    if (filter.appId) {
      resources = resources.filter((r) => {
        if ('appId' in r) {
          return r.appId === filter.appId;
        }
        return false;
      });
    }

    if (filter.locale) {
      resources = resources.filter((r) => {
        if ('locale' in r) {
          return r.locale === filter.locale;
        }
        return false;
      });
    }

    if (filter.deviceType) {
      resources = resources.filter((r) => {
        if ('deviceType' in r) {
          return r.deviceType === filter.deviceType;
        }
        return false;
      });
    }

    if (filter.createdBy) {
      resources = resources.filter((r) => r.createdBy === filter.createdBy);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      resources = resources.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Sort by most recent first
    resources.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return resources;
  }

  /**
   * Perform approval action
   */
  async performAction(
    resourceId: string,
    action: ApprovalAction,
    userId: string,
    userName: string,
    userEmail: string,
    userRole: WorkspaceRole,
    comment?: string,
    reason?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const resource = await this.getResource(resourceId);

    if (!resource) {
      return { success: false, error: 'Resource not found' };
    }

    const settings = await this.getApprovalSettings(resource.workspaceId);

    // Check if user can perform this action
    const isOwner = resource.createdBy === userId;
    if (!canPerformAction(action, userRole, settings, isOwner)) {
      return { success: false, error: 'You do not have permission to perform this action' };
    }

    // Determine new status
    let newStatus: ApprovalStatus;
    switch (action) {
      case ApprovalAction.SUBMIT_FOR_REVIEW:
        newStatus = ApprovalStatus.IN_REVIEW;
        break;
      case ApprovalAction.APPROVE:
        newStatus = ApprovalStatus.APPROVED;
        break;
      case ApprovalAction.REJECT:
        newStatus = ApprovalStatus.REJECTED;
        break;
      case ApprovalAction.REQUEST_CHANGES:
        newStatus = ApprovalStatus.CHANGES_REQUESTED;
        break;
      case ApprovalAction.REVERT_TO_DRAFT:
        newStatus = ApprovalStatus.DRAFT;
        break;
      default:
        return { success: false, error: 'Invalid action' };
    }

    // Validate transition
    if (!isValidStatusTransition(resource.approvalStatus, newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${resource.approvalStatus} to ${newStatus}`,
      };
    }

    // Check comment requirement
    if (
      settings.requireCommentOnReject &&
      (action === ApprovalAction.REJECT || action === ApprovalAction.REQUEST_CHANGES) &&
      !comment &&
      !reason
    ) {
      return {
        success: false,
        error: 'Comment or reason is required for rejection or change requests',
      };
    }

    // Create status change record
    const statusChange: ApprovalStatusChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resourceId: resource.id,
      resourceType: resource.resourceType as any,
      fromStatus: resource.approvalStatus,
      toStatus: newStatus,
      changedBy: userId,
      changedByName: userName,
      changedByEmail: userEmail,
      changedByRole: userRole,
      reason: reason || comment,
      timestamp: new Date().toISOString(),
    };

    // Update resource
    resource.approvalStatus = newStatus;
    resource.approvalHistory.push(statusChange);

    // Update specific timestamps
    if (action === ApprovalAction.SUBMIT_FOR_REVIEW) {
      resource.submittedForReviewAt = statusChange.timestamp;
      resource.submittedForReviewBy = userId;
    } else if (action === ApprovalAction.APPROVE) {
      resource.approvedAt = statusChange.timestamp;
      resource.approvedBy = userId;
    } else if (action === ApprovalAction.REJECT) {
      resource.rejectedAt = statusChange.timestamp;
      resource.rejectedBy = userId;
    }

    // Add comment if provided
    if (comment) {
      const commentObj: ApprovalComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        resourceId: resource.id,
        resourceType: resource.resourceType as any,
        authorId: userId,
        authorName: userName,
        authorEmail: userEmail,
        authorRole: userRole,
        content: comment,
        createdAt: new Date().toISOString(),
        isInternal: false,
      };
      resource.comments.push(commentObj);
      await this.saveComment(commentObj);
    }

    // Save updated resource
    await this.saveResource(resource);

    // Save status change to history
    await this.saveStatusChange(statusChange);

    return {
      success: true,
      message: `Successfully ${action.replace(/_/g, ' ')}`,
    };
  }

  /**
   * Add comment to resource
   */
  async addComment(
    resourceId: string,
    userId: string,
    userName: string,
    userEmail: string,
    userRole: WorkspaceRole,
    content: string,
    isInternal: boolean = false,
    attachments?: string[]
  ): Promise<ApprovalComment | null> {
    const resource = await this.getResource(resourceId);

    if (!resource) {
      return null;
    }

    const comment: ApprovalComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resourceId: resource.id,
      resourceType: resource.resourceType as any,
      authorId: userId,
      authorName: userName,
      authorEmail: userEmail,
      authorRole: userRole,
      content,
      createdAt: new Date().toISOString(),
      isInternal,
      attachments,
    };

    resource.comments.push(comment);
    await this.saveResource(resource);
    await this.saveComment(comment);

    return comment;
  }

  /**
   * Get comments for a resource
   */
  async getComments(resourceId: string): Promise<ApprovalComment[]> {
    const resource = await this.getResource(resourceId);
    return resource?.comments || [];
  }

  /**
   * Get approval history for a resource
   */
  async getHistory(resourceId: string): Promise<ApprovalStatusChange[]> {
    const resource = await this.getResource(resourceId);
    return resource?.approvalHistory || [];
  }

  /**
   * Get approval statistics
   */
  async getStatistics(filter: AppleApprovalFilter = {}): Promise<AppleApprovalStatistics> {
    const resources = await this.listResources(filter);

    const stats: AppleApprovalStatistics = {
      totalDraft: 0,
      totalInReview: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalChangesRequested: 0,
      byResourceType: {} as any,
      byApp: {},
      avgTimeToApproval: 0,
      approvalRate: 0,
    };

    // Initialize resource type stats
    Object.values(AppleApprovableResourceType).forEach((type) => {
      stats.byResourceType[type] = {
        draft: 0,
        inReview: 0,
        approved: 0,
        rejected: 0,
      };
    });

    let totalApprovalTime = 0;
    let approvalCount = 0;

    for (const resource of resources) {
      // Count by status
      switch (resource.approvalStatus) {
        case ApprovalStatus.DRAFT:
          stats.totalDraft++;
          stats.byResourceType[resource.resourceType as AppleApprovableResourceType].draft++;
          break;
        case ApprovalStatus.IN_REVIEW:
          stats.totalInReview++;
          stats.byResourceType[resource.resourceType as AppleApprovableResourceType].inReview++;
          break;
        case ApprovalStatus.APPROVED:
          stats.totalApproved++;
          stats.byResourceType[resource.resourceType as AppleApprovableResourceType].approved++;
          break;
        case ApprovalStatus.REJECTED:
          stats.totalRejected++;
          stats.byResourceType[resource.resourceType as AppleApprovableResourceType].rejected++;
          break;
        case ApprovalStatus.CHANGES_REQUESTED:
          stats.totalChangesRequested++;
          break;
      }

      // Count by app
      if ('appId' in resource) {
        const appId = resource.appId;
        if (!stats.byApp[appId]) {
          stats.byApp[appId] = {
            appName: appId, // TODO: Get actual app name
            total: 0,
            approved: 0,
          };
        }
        stats.byApp[appId].total++;
        if (resource.approvalStatus === ApprovalStatus.APPROVED) {
          stats.byApp[appId].approved++;
        }
      }

      // Calculate approval time
      if (resource.approvedAt && resource.submittedForReviewAt) {
        const submitTime = new Date(resource.submittedForReviewAt).getTime();
        const approveTime = new Date(resource.approvedAt).getTime();
        totalApprovalTime += approveTime - submitTime;
        approvalCount++;
      }
    }

    // Calculate averages
    stats.avgTimeToApproval = approvalCount > 0 ? totalApprovalTime / approvalCount : 0;
    const totalReviewed = stats.totalApproved + stats.totalRejected;
    stats.approvalRate = totalReviewed > 0 ? (stats.totalApproved / totalReviewed) * 100 : 0;

    return stats;
  }

  /**
   * Save comment to file
   */
  private async saveComment(comment: ApprovalComment): Promise<void> {
    const filePath = path.join(this.commentsDir, `${comment.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(comment, null, 2));
  }

  /**
   * Save status change to history
   */
  private async saveStatusChange(change: ApprovalStatusChange): Promise<void> {
    const filePath = path.join(this.historyDir, `${change.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(change, null, 2));
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string): Promise<boolean> {
    const filePath = path.join(this.resourcesDir, `${resourceId}.json`);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    return true;
  }
}

// Singleton instance
let appleApprovalServiceInstance: AppleApprovalService | null = null;

export function getAppleApprovalService(): AppleApprovalService {
  if (!appleApprovalServiceInstance) {
    appleApprovalServiceInstance = new AppleApprovalService();
  }
  return appleApprovalServiceInstance;
}
