'use client';

/**
 * ReviewItemCard Component - Apple Review
 * Displays an Apple approvable resource card with actions
 */

import React, { useState } from 'react';
import {
  ApprovalStatus,
  ApprovalAction,
  getStatusColor,
  getStatusDisplayName,
} from '@/types/approval';
import {
  AppleApprovableResource,
  AppleApprovableResourceType,
  getAppleResourceTypeDisplayName,
  getAppleResourceTypeIcon,
} from '@/types/appleApproval';
import { WorkspaceRole } from '@/types/workspace';
import styles from './ReviewItemCard.module.css';

interface ReviewItemCardProps {
  item: AppleApprovableResource;
  onUpdate: () => void;
}

export function ReviewItemCard({ item, onUpdate }: ReviewItemCardProps) {
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO: Get from auth context
  const currentUser = {
    userId: 'admin-1',
    userName: 'Admin User',
    userEmail: 'admin@example.com',
    role: WorkspaceRole.ADMIN,
  };

  async function handleAction(action: ApprovalAction, requireComment = false) {
    if (requireComment && !comment.trim()) {
      setShowCommentModal(true);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/review/apple/${item.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: currentUser.userId,
          userName: currentUser.userName,
          userEmail: currentUser.userEmail,
          userRole: currentUser.role,
          comment: comment || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform action');
      }

      const result = await response.json();
      alert(result.message || 'Action completed successfully!');
      setComment('');
      setShowCommentModal(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to perform action:', error);
      alert(error instanceof Error ? error.message : 'Failed to perform action');
    } finally {
      setLoading(false);
    }
  }

  function getAvailableActions(): {
    action: ApprovalAction;
    label: string;
    color: string;
    requireComment?: boolean;
  }[] {
    const actions: {
      action: ApprovalAction;
      label: string;
      color: string;
      requireComment?: boolean;
    }[] = [];

    switch (item.approvalStatus) {
      case ApprovalStatus.DRAFT:
        actions.push({
          action: ApprovalAction.SUBMIT_FOR_REVIEW,
          label: 'Submit for Review',
          color: '#3b82f6',
        });
        break;

      case ApprovalStatus.IN_REVIEW:
        actions.push(
          {
            action: ApprovalAction.APPROVE,
            label: 'Approve',
            color: '#10b981',
          },
          {
            action: ApprovalAction.REQUEST_CHANGES,
            label: 'Request Changes',
            color: '#f59e0b',
            requireComment: true,
          },
          {
            action: ApprovalAction.REJECT,
            label: 'Reject',
            color: '#ef4444',
            requireComment: true,
          }
        );
        break;

      case ApprovalStatus.APPROVED:
      case ApprovalStatus.REJECTED:
      case ApprovalStatus.CHANGES_REQUESTED:
        actions.push({
          action: ApprovalAction.REVERT_TO_DRAFT,
          label: 'Revert to Draft',
          color: '#6b7280',
        });
        break;
    }

    return actions;
  }

  const availableActions = getAvailableActions();
  const statusColor = getStatusColor(item.approvalStatus);
  const statusName = getStatusDisplayName(item.approvalStatus);
  const resourceTypeName = getAppleResourceTypeDisplayName(item.resourceType as AppleApprovableResourceType);
  const resourceIcon = getAppleResourceTypeIcon(item.resourceType as AppleApprovableResourceType);
  const timeAgo = getTimeAgo(new Date(item.updatedAt));

  // Get Apple-specific metadata
  const appleMetadata: { label: string; value: string }[] = [];
  if ('appId' in item) {
    appleMetadata.push({ label: 'App ID', value: item.appId });
  }
  if ('locale' in item) {
    appleMetadata.push({ label: 'Locale', value: item.locale });
  }
  if ('deviceType' in item) {
    appleMetadata.push({ label: 'Device', value: item.deviceType });
  }

  return (
    <>
      <div className={styles.card}>
        {item.thumbnailUrl && (
          <div className={styles.thumbnail}>
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className={styles.thumbnailImage}
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" fill="%239ca3af"%3E' + resourceIcon + '%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <span className={styles.resourceIcon}>{resourceIcon}</span>
              <h3 className={styles.title}>{item.name}</h3>
            </div>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: statusColor }}
            >
              {statusName}
            </span>
          </div>

          <div className={styles.resourceType}>{resourceTypeName}</div>

          {item.description && (
            <p className={styles.description}>{item.description}</p>
          )}

          <div className={styles.metadata}>
            {appleMetadata.map((meta) => (
              <div key={meta.label} className={styles.metadataItem}>
                <span className={styles.metadataLabel}>{meta.label}:</span>
                <span className={styles.metadataValue}>{meta.value}</span>
              </div>
            ))}
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Created by:</span>
              <span className={styles.metadataValue}>{item.createdByName}</span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Updated:</span>
              <span className={styles.metadataValue}>{timeAgo}</span>
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className={styles.tags}>
              {item.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {item.comments.length > 0 && (
            <div className={styles.commentsIndicator}>
              💬 {item.comments.length}{' '}
              {item.comments.length === 1 ? 'comment' : 'comments'}
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.viewButton}
              onClick={() => alert('View details - TODO: Navigate to detail page')}
            >
              View Details
            </button>

            {availableActions.length > 0 && (
              <div className={styles.actionButtons}>
                {availableActions.map(({ action, label, color, requireComment }) => (
                  <button
                    key={action}
                    className={styles.actionButton}
                    style={{ backgroundColor: color }}
                    onClick={() => handleAction(action, requireComment)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCommentModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Add Comment</h3>
            <p className={styles.modalDescription}>
              Please provide a reason for your decision:
            </p>
            <textarea
              className={styles.modalTextarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment..."
              rows={4}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelButton}
                onClick={() => {
                  setShowCommentModal(false);
                  setComment('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={styles.modalSubmitButton}
                onClick={() => {
                  const action = availableActions.find(a => a.requireComment)?.action;
                  if (action) {
                    handleAction(action, false);
                  }
                }}
                disabled={loading || !comment.trim()}
              >
                {loading ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to format relative time
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return date.toLocaleDateString();
}
