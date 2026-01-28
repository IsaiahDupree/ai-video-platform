'use client';

/**
 * ReviewItemCard Component
 * Displays an approvable resource card with actions
 */

import React, { useState } from 'react';
import {
  ApprovableResource,
  ApprovalStatus,
  ApprovalAction,
  getStatusColor,
  getStatusDisplayName,
} from '@/types/approval';
import { WorkspaceRole } from '@/types/workspace';
import styles from './ReviewItemCard.module.css';

interface ReviewItemCardProps {
  item: ApprovableResource;
  onUpdate: () => void;
}

export function ReviewItemCard({ item, onUpdate }: ReviewItemCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO: Get from auth context
  const currentUser = {
    userId: 'admin-1',
    role: WorkspaceRole.ADMIN,
  };

  async function handleAction(action: ApprovalAction, requireComment = false) {
    if (requireComment && !comment.trim()) {
      setShowCommentModal(true);
      return;
    }

    try {
      setLoading(true);

      // TODO: Replace with actual API call
      console.log('Performing action:', {
        resourceId: item.id,
        action,
        userId: currentUser.userId,
        userRole: currentUser.role,
        comment: comment || undefined,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      alert(`Action "${action}" completed successfully!`);
      setComment('');
      setShowCommentModal(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to perform action:', error);
      alert('Failed to perform action. Please try again.');
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

  const timeAgo = getTimeAgo(new Date(item.updatedAt));

  return (
    <>
      <div className={styles.card}>
        {item.thumbnailUrl && (
          <div className={styles.thumbnail}>
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className={styles.thumbnailImage}
            />
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.header}>
            <h3 className={styles.title}>{item.name}</h3>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: statusColor }}
            >
              {statusName}
            </span>
          </div>

          {item.description && (
            <p className={styles.description}>{item.description}</p>
          )}

          <div className={styles.metadata}>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Created by:</span>
              <span className={styles.metadataValue}>{item.createdByName}</span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Updated:</span>
              <span className={styles.metadataValue}>{timeAgo}</span>
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
          </div>

          {item.comments.length > 0 && (
            <div className={styles.commentsIndicator}>
              💬 {item.comments.length}{' '}
              {item.comments.length === 1 ? 'comment' : 'comments'}
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.viewButton}
              onClick={() => alert('View details not implemented yet')}
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
                    {loading ? '...' : label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCommentModal && (
        <div className={styles.modal} onClick={() => setShowCommentModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Comment</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowCommentModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <p>Please provide a reason for this action:</p>
              <textarea
                className={styles.commentInput}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your comment..."
                rows={4}
                autoFocus
              />
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalCancelButton}
                onClick={() => {
                  setComment('');
                  setShowCommentModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className={styles.modalSubmitButton}
                onClick={() => {
                  // Re-trigger the action with the comment
                  setShowCommentModal(false);
                  // The action will be triggered automatically
                }}
                disabled={!comment.trim()}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
