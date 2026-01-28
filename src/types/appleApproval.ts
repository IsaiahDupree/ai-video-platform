/**
 * Apple Product Page Approval Workflow Types - APP-021
 * Extension of base approval system for Apple App Store assets
 */

import {
  ApprovalStatus,
  ApprovalComment,
  ApprovalStatusChange,
  ApprovableResource,
} from './approval';
import { WorkspaceRole } from './workspace';

/**
 * Apple-specific resource types that can be approved
 */
export enum AppleApprovableResourceType {
  SCREENSHOT = 'screenshot',
  SCREENSHOT_SET = 'screenshot_set',
  CUSTOM_PRODUCT_PAGE = 'custom_product_page',
  APP_PREVIEW_VIDEO = 'app_preview_video',
  LOCALIZED_METADATA = 'localized_metadata',
  PPO_TREATMENT = 'ppo_treatment',
}

/**
 * Screenshot resource for approval
 */
export interface AppleScreenshotResource extends Omit<ApprovableResource, 'resourceType'> {
  resourceType: AppleApprovableResourceType.SCREENSHOT | AppleApprovableResourceType.SCREENSHOT_SET;

  // Apple-specific fields
  appId: string;
  locale: string;
  deviceType: string;
  displayType?: string;

  // Screenshot data
  imageUrl?: string;
  frameUrl?: string; // Device frame overlay
  captionText?: string;
  captionPosition?: 'top' | 'bottom' | 'center';

  // Set information (for screenshot sets)
  screenshotCount?: number;
  screenshotIds?: string[];
  setOrder?: number;
}

/**
 * Custom Product Page resource for approval
 */
export interface AppleCPPResource extends Omit<ApprovableResource, 'resourceType'> {
  resourceType: AppleApprovableResourceType.CUSTOM_PRODUCT_PAGE;

  // Apple-specific fields
  appId: string;
  cppId?: string; // App Store Connect ID
  cppName: string;
  cppUrl?: string;
  locale: string;

  // CPP data
  promotionalText?: string;
  screenshotSetIds: string[];
  appPreviewIds?: string[];

  // State tracking
  isPublished: boolean;
  publishedAt?: string;
  lastSyncedAt?: string;
}

/**
 * App Preview Video resource for approval
 */
export interface ApplePreviewResource extends Omit<ApprovableResource, 'resourceType'> {
  resourceType: AppleApprovableResourceType.APP_PREVIEW_VIDEO;

  // Apple-specific fields
  appId: string;
  locale: string;
  deviceType: string;

  // Video data
  videoUrl: string;
  duration: number; // seconds
  posterFrame?: string; // Thumbnail
  videoFormat: string;
  resolution: string;
}

/**
 * Localized Metadata resource for approval
 */
export interface AppleMetadataResource extends Omit<ApprovableResource, 'resourceType'> {
  resourceType: AppleApprovableResourceType.LOCALIZED_METADATA;

  // Apple-specific fields
  appId: string;
  locale: string;

  // Metadata fields
  appName?: string;
  subtitle?: string;
  promotionalText?: string;
  description?: string;
  keywords?: string;
  whatsNew?: string;
  marketingUrl?: string;
  supportUrl?: string;
  privacyPolicyUrl?: string;
}

/**
 * PPO Treatment resource for approval
 */
export interface ApplePPOResource extends Omit<ApprovableResource, 'resourceType'> {
  resourceType: AppleApprovableResourceType.PPO_TREATMENT;

  // Apple-specific fields
  appId: string;
  testId: string;
  treatmentId: string;
  locale: string;

  // Treatment data
  treatmentType: 'icon' | 'screenshots' | 'previews';
  controlGroup: boolean;

  // Assets
  screenshotSetIds?: string[];
  appPreviewIds?: string[];
  customIconUrl?: string;

  // Test tracking
  testStartDate?: string;
  testEndDate?: string;
  isWinner?: boolean;
}

/**
 * Union type for all Apple approvable resources
 */
export type AppleApprovableResource =
  | AppleScreenshotResource
  | AppleCPPResource
  | ApplePreviewResource
  | AppleMetadataResource
  | ApplePPOResource;

/**
 * Filter options for Apple approval queries
 */
export interface AppleApprovalFilter {
  workspaceId?: string;
  resourceType?: AppleApprovableResourceType | AppleApprovableResourceType[];
  status?: ApprovalStatus | ApprovalStatus[];
  appId?: string;
  locale?: string;
  deviceType?: string;
  createdBy?: string;
  approvedBy?: string;
  tags?: string[];
  fromDate?: string;
  toDate?: string;
  searchQuery?: string;
}

/**
 * Apple approval statistics
 */
export interface AppleApprovalStatistics {
  totalDraft: number;
  totalInReview: number;
  totalApproved: number;
  totalRejected: number;
  totalChangesRequested: number;

  // Breakdown by resource type
  byResourceType: Record<AppleApprovableResourceType, {
    draft: number;
    inReview: number;
    approved: number;
    rejected: number;
  }>;

  // Breakdown by app
  byApp: Record<string, {
    appName: string;
    total: number;
    approved: number;
  }>;

  // Performance metrics
  avgTimeToApproval: number; // milliseconds
  approvalRate: number; // percentage
}

/**
 * Type guard for Apple screenshot resource
 */
export function isAppleScreenshotResource(obj: any): obj is AppleScreenshotResource {
  return (
    obj &&
    typeof obj === 'object' &&
    (obj.resourceType === AppleApprovableResourceType.SCREENSHOT ||
     obj.resourceType === AppleApprovableResourceType.SCREENSHOT_SET) &&
    typeof obj.appId === 'string' &&
    typeof obj.locale === 'string' &&
    typeof obj.deviceType === 'string'
  );
}

/**
 * Type guard for Apple CPP resource
 */
export function isAppleCPPResource(obj: any): obj is AppleCPPResource {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.resourceType === AppleApprovableResourceType.CUSTOM_PRODUCT_PAGE &&
    typeof obj.appId === 'string' &&
    typeof obj.cppName === 'string' &&
    typeof obj.locale === 'string'
  );
}

/**
 * Helper: Get Apple resource type display name
 */
export function getAppleResourceTypeDisplayName(
  resourceType: AppleApprovableResourceType
): string {
  switch (resourceType) {
    case AppleApprovableResourceType.SCREENSHOT:
      return 'Screenshot';
    case AppleApprovableResourceType.SCREENSHOT_SET:
      return 'Screenshot Set';
    case AppleApprovableResourceType.CUSTOM_PRODUCT_PAGE:
      return 'Custom Product Page';
    case AppleApprovableResourceType.APP_PREVIEW_VIDEO:
      return 'App Preview Video';
    case AppleApprovableResourceType.LOCALIZED_METADATA:
      return 'Localized Metadata';
    case AppleApprovableResourceType.PPO_TREATMENT:
      return 'PPO Treatment';
    default:
      return resourceType;
  }
}

/**
 * Helper: Get icon for resource type
 */
export function getAppleResourceTypeIcon(
  resourceType: AppleApprovableResourceType
): string {
  switch (resourceType) {
    case AppleApprovableResourceType.SCREENSHOT:
    case AppleApprovableResourceType.SCREENSHOT_SET:
      return '📱';
    case AppleApprovableResourceType.CUSTOM_PRODUCT_PAGE:
      return '📄';
    case AppleApprovableResourceType.APP_PREVIEW_VIDEO:
      return '🎬';
    case AppleApprovableResourceType.LOCALIZED_METADATA:
      return '🌐';
    case AppleApprovableResourceType.PPO_TREATMENT:
      return '🧪';
    default:
      return '📦';
  }
}
