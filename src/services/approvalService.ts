/**
 * Approval Service - ADS-016
 * Service for managing approval workflows
 */

import fs from 'fs';
import path from 'path';
import {
  ApprovalStatus,
  ApprovableResourceType,
  ApprovableResource,
  ApprovalComment,
  ApprovalStatusChange,
  ApprovalAction,
  ApprovalActionRequest,
  ApprovalActionResult,
  ApprovalWorkflowSettings,
  ApprovalFilter,
  ApprovalStatistics,
  ApprovalNotification,
  DEFAULT_APPROVAL_SETTINGS,
  isValidStatusTransition,
  canPerformAction,
} from '../types/approval';
import { WorkspaceRole } from '../types/workspace';

/**
 * Approval Service
 * Handles approval workflow operations, status transitions, and comments
 */
export class ApprovalService {
  private dataDir: string;
  private resourcesDir: string;
  private commentsDir: string;
  private historyDir: string;
  private notificationsDir: string;

  constructor(dataDir: string = 'data/approvals') {
    this.dataDir = dataDir;
    this.resourcesDir = path.join(dataDir, 'resources');
    this.commentsDir = path.join(dataDir, 'comments');
    this.historyDir = path.join(dataDir, 'history');
    this.notificationsDir = path.join(dataDir, 'notifications');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.dataDir, this.resourcesDir, this.commentsDir, this.historyDir, this.notificationsDir].forEach(
      (dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
    );
  }

  /**
   * Get approval settings for a workspace
   */
  async getWorkspaceApprovalSettings(workspaceId: string): Promise<ApprovalWorkflowSettings> {
    // TODO: Integrate with workspace service
    // For now, return default settings with approval enabled
    return {
      ...DEFAULT_APPROVAL_SETTINGS,
      enabled: true,
    };
  }

  /**
   * Get approvable resource by ID
   */
  async getResource(resourceId: string): Promise<ApprovableResource | null> {
    const filePath = path.join(this.resourcesDir, `${resourceId}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as ApprovableResource;
  }

  /**
   * Save approvable resource
   */
  async saveResource(resource: ApprovableResource): Promise<void> {
    const filePath = path.join(this.resourcesDir, `${resource.id}.json`);
    resource.updatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(resource, null, 2));
  }

  /**
   * Create a new approvable resource
   */
  async createResource(
    data: Omit<ApprovableResource, 'id' | 'approvalStatus' | 'approvalHistory' | 'comments' | 'createdAt' | 'updatedAt'>
  ): Promise<ApprovableResource> {
    const resource: ApprovableResource = {
      ...data,
      id: `${data.resourceType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      approvalStatus: ApprovalStatus.DRAFT,
      approvalHistory: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveResource(resource);
    return resource;
  }

  /**
   * Perform an approval action on a resource
   */
  async performAction(request: ApprovalActionRequest): Promise<ApprovalActionResult> {
    const resource = await this.getResource(request.resourceId);

    if (!resource) {
      return {
        success: false,
        newStatus: ApprovalStatus.DRAFT,
        statusChange: {} as ApprovalStatusChange,
        error: 'Resource not found',
      };
    }

    // Get workspace settings
    const settings = await this.getWorkspaceApprovalSettings(resource.workspaceId);

    if (!settings.enabled && request.action !== ApprovalAction.REVERT_TO_DRAFT) {
      return {
        success: false,
        newStatus: resource.approvalStatus,
        statusChange: {} as ApprovalStatusChange,
        error: 'Approval workflow is not enabled for this workspace',
      };
    }

    // Check if user has permission to perform this action
    const isResourceOwner = resource.createdBy === request.userId;
    if (!canPerformAction(request.action, request.userRole, settings, isResourceOwner)) {
      return {
        success: false,
        newStatus: resource.approvalStatus,
        statusChange: {} as ApprovalStatusChange,
        error: 'You do not have permission to perform this action',
      };
    }

    // Determine the new status based on the action
    const newStatus = this.getNewStatusForAction(request.action, resource.approvalStatus);

    if (!newStatus) {
      return {
        success: false,
        newStatus: resource.approvalStatus,
        statusChange: {} as ApprovalStatusChange,
        error: 'Invalid action for current status',
      };
    }

    // Validate status transition
    if (!isValidStatusTransition(resource.approvalStatus, newStatus)) {
      return {
        success: false,
        newStatus: resource.approvalStatus,
        statusChange: {} as ApprovalStatusChange,
        error: `Cannot transition from ${resource.approvalStatus} to ${newStatus}`,
      };
    }

    // Check if comment is required
    if (
      settings.requireCommentOnReject &&
      (request.action === ApprovalAction.REJECT || request.action === ApprovalAction.REQUEST_CHANGES) &&
      !request.comment
    ) {
      return {
        success: false,
        newStatus: resource.approvalStatus,
        statusChange: {} as ApprovalStatusChange,
        error: 'Comment is required when rejecting or requesting changes',
      };
    }

    // Create status change record
    const statusChange: ApprovalStatusChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resourceId: resource.id,
      resourceType: resource.resourceType,
      fromStatus: resource.approvalStatus,
      toStatus: newStatus,
      changedBy: request.userId,
      changedByName: 'User', // TODO: Get from user context
      changedByEmail: 'user@example.com', // TODO: Get from user context
      changedByRole: request.userRole,
      reason: request.reason || request.comment,
      timestamp: new Date().toISOString(),
    };

    // Update resource
    resource.approvalStatus = newStatus;
    resource.approvalHistory.push(statusChange);

    // Update tracking fields
    const now = new Date().toISOString();
    if (newStatus === ApprovalStatus.IN_REVIEW) {
      resource.submittedForReviewAt = now;
      resource.submittedForReviewBy = request.userId;
    } else if (newStatus === ApprovalStatus.APPROVED) {
      resource.approvedAt = now;
      resource.approvedBy = request.userId;
    } else if (newStatus === ApprovalStatus.REJECTED) {
      resource.rejectedAt = now;
      resource.rejectedBy = request.userId;
    }

    // Add comment if provided
    if (request.comment) {
      const comment = await this.addComment({
        resourceId: resource.id,
        resourceType: resource.resourceType,
        authorId: request.userId,
        authorName: 'User', // TODO: Get from user context
        authorEmail: 'user@example.com', // TODO: Get from user context
        authorRole: request.userRole,
        content: request.comment,
      });
      resource.comments.push(comment);
    }

    // Save resource
    await this.saveResource(resource);

    // Send notifications if enabled
    if (settings.notifyOnStatusChange) {
      await this.sendNotifications(resource, statusChange, request);
    }

    return {
      success: true,
      newStatus,
      statusChange,
      message: `Successfully transitioned to ${newStatus}`,
    };
  }

  /**
   * Get new status for an action
   */
  private getNewStatusForAction(action: ApprovalAction, currentStatus: ApprovalStatus): ApprovalStatus | null {
    switch (action) {
      case ApprovalAction.SUBMIT_FOR_REVIEW:
        return ApprovalStatus.IN_REVIEW;
      case ApprovalAction.APPROVE:
        return ApprovalStatus.APPROVED;
      case ApprovalAction.REJECT:
        return ApprovalStatus.REJECTED;
      case ApprovalAction.REQUEST_CHANGES:
        return ApprovalStatus.CHANGES_REQUESTED;
      case ApprovalAction.REVERT_TO_DRAFT:
        return ApprovalStatus.DRAFT;
      default:
        return null;
    }
  }

  /**
   * Add a comment to a resource
   */
  async addComment(
    data: Omit<ApprovalComment, 'id' | 'createdAt'>
  ): Promise<ApprovalComment> {
    const comment: ApprovalComment = {
      ...data,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    // Save comment to file
    const commentPath = path.join(this.commentsDir, `${comment.resourceId}.json`);
    let comments: ApprovalComment[] = [];

    if (fs.existsSync(commentPath)) {
      const data = fs.readFileSync(commentPath, 'utf-8');
      comments = JSON.parse(data);
    }

    comments.push(comment);
    fs.writeFileSync(commentPath, JSON.stringify(comments, null, 2));

    return comment;
  }

  /**
   * Get comments for a resource
   */
  async getComments(resourceId: string): Promise<ApprovalComment[]> {
    const commentPath = path.join(this.commentsDir, `${resourceId}.json`);

    if (!fs.existsSync(commentPath)) {
      return [];
    }

    const data = fs.readFileSync(commentPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Get approval history for a resource
   */
  async getHistory(resourceId: string): Promise<ApprovalStatusChange[]> {
    const resource = await this.getResource(resourceId);
    return resource?.approvalHistory || [];
  }

  /**
   * Query resources by filter
   */
  async queryResources(filter: ApprovalFilter): Promise<ApprovableResource[]> {
    const files = fs.readdirSync(this.resourcesDir).filter((f) => f.endsWith('.json'));
    const resources: ApprovableResource[] = [];

    for (const file of files) {
      const data = fs.readFileSync(path.join(this.resourcesDir, file), 'utf-8');
      const resource = JSON.parse(data) as ApprovableResource;

      // Apply filters
      if (filter.workspaceId && resource.workspaceId !== filter.workspaceId) continue;
      if (filter.resourceType && resource.resourceType !== filter.resourceType) continue;
      if (filter.status && !filter.status.includes(resource.approvalStatus)) continue;
      if (filter.createdBy && resource.createdBy !== filter.createdBy) continue;
      if (filter.approvedBy && resource.approvedBy !== filter.approvedBy) continue;
      if (filter.tags && filter.tags.length > 0) {
        const hasTags = filter.tags.some((tag) => resource.tags?.includes(tag));
        if (!hasTags) continue;
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesSearch =
          resource.name.toLowerCase().includes(query) ||
          resource.description?.toLowerCase().includes(query);
        if (!matchesSearch) continue;
      }
      if (filter.fromDate && new Date(resource.createdAt) < new Date(filter.fromDate)) continue;
      if (filter.toDate && new Date(resource.createdAt) > new Date(filter.toDate)) continue;

      resources.push(resource);
    }

    return resources;
  }

  /**
   * Get approval statistics for a workspace
   */
  async getStatistics(workspaceId: string): Promise<ApprovalStatistics> {
    const resources = await this.queryResources({ workspaceId });

    const stats: ApprovalStatistics = {
      totalDraft: 0,
      totalInReview: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalChangesRequested: 0,
      avgTimeToApproval: 0,
      approvalRate: 0,
    };

    let totalApprovalTime = 0;
    let approvalCount = 0;

    for (const resource of resources) {
      switch (resource.approvalStatus) {
        case ApprovalStatus.DRAFT:
          stats.totalDraft++;
          break;
        case ApprovalStatus.IN_REVIEW:
          stats.totalInReview++;
          break;
        case ApprovalStatus.APPROVED:
          stats.totalApproved++;
          if (resource.submittedForReviewAt && resource.approvedAt) {
            const timeToApproval =
              new Date(resource.approvedAt).getTime() -
              new Date(resource.submittedForReviewAt).getTime();
            totalApprovalTime += timeToApproval;
            approvalCount++;
          }
          break;
        case ApprovalStatus.REJECTED:
          stats.totalRejected++;
          break;
        case ApprovalStatus.CHANGES_REQUESTED:
          stats.totalChangesRequested++;
          break;
      }
    }

    if (approvalCount > 0) {
      stats.avgTimeToApproval = totalApprovalTime / approvalCount;
    }

    const totalReviewed = stats.totalApproved + stats.totalRejected;
    if (totalReviewed > 0) {
      stats.approvalRate = (stats.totalApproved / totalReviewed) * 100;
    }

    return stats;
  }

  /**
   * Send notifications for status change
   */
  private async sendNotifications(
    resource: ApprovableResource,
    statusChange: ApprovalStatusChange,
    request: ApprovalActionRequest
  ): Promise<void> {
    const notifications: ApprovalNotification[] = [];

    // Notify creator on status change (except if they made the change)
    if (resource.createdBy !== request.userId) {
      notifications.push(this.createNotification(
        resource,
        statusChange,
        resource.createdBy,
        resource.createdByEmail
      ));
    }

    // TODO: Get workspace members and notify approvers
    // For now, just notify creator

    // Save notifications
    for (const notification of notifications) {
      await this.saveNotification(notification);
    }
  }

  /**
   * Create notification object
   */
  private createNotification(
    resource: ApprovableResource,
    statusChange: ApprovalStatusChange,
    recipientId: string,
    recipientEmail: string
  ): ApprovalNotification {
    let type: ApprovalNotification['type'] = 'submitted';
    let title = '';
    let message = '';

    switch (statusChange.toStatus) {
      case ApprovalStatus.IN_REVIEW:
        type = 'submitted';
        title = 'New item submitted for review';
        message = `${resource.name} has been submitted for review`;
        break;
      case ApprovalStatus.APPROVED:
        type = 'approved';
        title = 'Item approved';
        message = `${resource.name} has been approved`;
        break;
      case ApprovalStatus.REJECTED:
        type = 'rejected';
        title = 'Item rejected';
        message = `${resource.name} has been rejected`;
        break;
      case ApprovalStatus.CHANGES_REQUESTED:
        type = 'changes_requested';
        title = 'Changes requested';
        message = `Changes have been requested for ${resource.name}`;
        break;
    }

    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: resource.workspaceId,
      recipientId,
      recipientEmail,
      resourceId: resource.id,
      resourceType: resource.resourceType,
      resourceName: resource.name,
      type,
      title,
      message,
      actionUrl: `/ads/review/${resource.id}`,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Save notification
   */
  private async saveNotification(notification: ApprovalNotification): Promise<void> {
    const filePath = path.join(this.notificationsDir, `${notification.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(notification, null, 2));
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, unreadOnly = false): Promise<ApprovalNotification[]> {
    const files = fs.readdirSync(this.notificationsDir).filter((f) => f.endsWith('.json'));
    const notifications: ApprovalNotification[] = [];

    for (const file of files) {
      const data = fs.readFileSync(path.join(this.notificationsDir, file), 'utf-8');
      const notification = JSON.parse(data) as ApprovalNotification;

      if (notification.recipientId === userId) {
        if (!unreadOnly || !notification.readAt) {
          notifications.push(notification);
        }
      }
    }

    return notifications.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    const filePath = path.join(this.notificationsDir, `${notificationId}.json`);

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const notification = JSON.parse(data) as ApprovalNotification;
      notification.readAt = new Date().toISOString();
      fs.writeFileSync(filePath, JSON.stringify(notification, null, 2));
    }
  }
}

// Export singleton instance
export const approvalService = new ApprovalService();
