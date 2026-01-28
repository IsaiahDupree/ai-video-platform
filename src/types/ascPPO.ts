/**
 * APP-014: PPO Test Configuration
 *
 * Type definitions for Product Page Optimization (PPO) tests in App Store Connect
 */

import type { ASCResponse } from './ascAuth';

/**
 * PPO Test state
 */
export type PPOTestState =
  | 'PREPARE_FOR_SUBMISSION'
  | 'READY_FOR_SUBMISSION'
  | 'WAITING_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'ACCEPTED'
  | 'APPROVED'
  | 'REPLACED_WITH_NEW_VERSION'
  | 'REJECTED'
  | 'STOPPED'
  | 'COMPLETED';

/**
 * Treatment state
 */
export type TreatmentState =
  | 'PREPARE_FOR_SUBMISSION'
  | 'READY_FOR_SUBMISSION'
  | 'WAITING_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'ACCEPTED'
  | 'APPROVED'
  | 'REPLACED_WITH_NEW_VERSION'
  | 'REJECTED';

/**
 * PPO Test platform
 */
export type PPOPlatform = 'IOS' | 'MAC_OS' | 'TV_OS' | 'VISION_OS';

/**
 * Traffic proportion (percentage as decimal)
 */
export type TrafficProportion = number; // 0.0 to 1.0

/**
 * App Store Version Experiment (PPO Test)
 */
export interface AppStoreVersionExperiment {
  type: 'appStoreVersionExperiments';
  id: string;
  attributes?: {
    /** Name of the experiment */
    name: string;
    /** Traffic proportion for control (0.0 to 1.0) */
    trafficProportion: TrafficProportion;
    /** Current state of the experiment */
    state: PPOTestState;
    /** Review submission status */
    reviewRequired?: boolean;
    /** Start date of the experiment */
    startDate?: string;
    /** End date of the experiment */
    endDate?: string;
    /** Platform the experiment is for */
    platform?: PPOPlatform;
  };
  relationships?: {
    app?: {
      data: {
        type: 'apps';
        id: string;
      };
    };
    latestControlVersion?: {
      data: {
        type: 'appStoreVersions';
        id: string;
      };
    };
    controlVersions?: {
      data: Array<{
        type: 'appStoreVersions';
        id: string;
      }>;
    };
    appStoreVersionExperimentTreatments?: {
      data: Array<{
        type: 'appStoreVersionExperimentTreatments';
        id: string;
      }>;
    };
  };
}

/**
 * App Store Version Experiment Treatment
 */
export interface AppStoreVersionExperimentTreatment {
  type: 'appStoreVersionExperimentTreatments';
  id: string;
  attributes?: {
    /** Name of the treatment */
    name: string;
    /** Traffic proportion for this treatment (0.0 to 1.0) */
    trafficProportion: TrafficProportion;
    /** Current state of the treatment */
    state: TreatmentState;
    /** Promoted date */
    promotedDate?: string;
  };
  relationships?: {
    appStoreVersionExperiment?: {
      data: {
        type: 'appStoreVersionExperiments';
        id: string;
      };
    };
    appStoreVersionExperimentTreatmentLocalizations?: {
      data: Array<{
        type: 'appStoreVersionExperimentTreatmentLocalizations';
        id: string;
      }>;
    };
  };
}

/**
 * App Store Version Experiment Treatment Localization
 */
export interface AppStoreVersionExperimentTreatmentLocalization {
  type: 'appStoreVersionExperimentTreatmentLocalizations';
  id: string;
  attributes?: {
    /** Locale code (e.g., en-US) */
    locale: string;
  };
  relationships?: {
    appStoreVersionExperimentTreatment?: {
      data: {
        type: 'appStoreVersionExperimentTreatments';
        id: string;
      };
    };
    appScreenshotSets?: {
      data: Array<{
        type: 'appScreenshotSets';
        id: string;
      }>;
    };
    appPreviewSets?: {
      data: Array<{
        type: 'appPreviewSets';
        id: string;
      }>;
    };
  };
}

/**
 * PPO Test Results
 */
export interface PPOTestResults {
  /** Treatment ID */
  treatmentId: string;
  /** Treatment name */
  treatmentName: string;
  /** Number of impressions */
  impressions: number;
  /** Number of conversions (downloads) */
  conversions: number;
  /** Conversion rate (%) */
  conversionRate: number;
  /** Improvement over control (%) */
  improvement: number;
  /** Statistical confidence (%) */
  confidence: number;
  /** Is this the winner? */
  isWinner: boolean;
}

/**
 * Create PPO test options
 */
export interface CreatePPOTestOptions {
  /** App ID */
  appId: string;
  /** App Store Version ID (control) */
  appStoreVersionId: string;
  /** Test name */
  name: string;
  /** Traffic proportion for control (0.0 to 1.0) */
  trafficProportion?: TrafficProportion;
  /** Platform */
  platform?: PPOPlatform;
}

/**
 * Create treatment options
 */
export interface CreateTreatmentOptions {
  /** PPO test ID */
  experimentId: string;
  /** Treatment name */
  name: string;
  /** Traffic proportion (0.0 to 1.0) */
  trafficProportion?: TrafficProportion;
}

/**
 * Create treatment localization options
 */
export interface CreateTreatmentLocalizationOptions {
  /** Treatment ID */
  treatmentId: string;
  /** Locale code */
  locale: string;
}

/**
 * PPO Test info (simplified)
 */
export interface PPOTestInfo {
  id: string;
  appId: string;
  appStoreVersionId: string;
  name: string;
  state: PPOTestState;
  trafficProportion: TrafficProportion;
  platform?: PPOPlatform;
  startDate?: string;
  endDate?: string;
  treatments: TreatmentInfo[];
  results?: PPOTestResults[];
}

/**
 * Treatment info (simplified)
 */
export interface TreatmentInfo {
  id: string;
  experimentId: string;
  name: string;
  state: TreatmentState;
  trafficProportion: TrafficProportion;
  promotedDate?: string;
  localizations: TreatmentLocalizationInfo[];
}

/**
 * Treatment localization info (simplified)
 */
export interface TreatmentLocalizationInfo {
  id: string;
  treatmentId: string;
  locale: string;
  screenshotSetIds: string[];
  previewSetIds: string[];
}

/**
 * PPO Test list options
 */
export interface ListPPOTestsOptions {
  /** App ID to filter by */
  appId?: string;
  /** State to filter by */
  state?: PPOTestState;
  /** Limit results */
  limit?: number;
}

/**
 * PPO Test API responses
 */
export type PPOTestResponse = ASCResponse<AppStoreVersionExperiment>;
export type PPOTestListResponse = ASCResponse<AppStoreVersionExperiment[]>;
export type TreatmentResponse = ASCResponse<AppStoreVersionExperimentTreatment>;
export type TreatmentListResponse = ASCResponse<AppStoreVersionExperimentTreatment[]>;
export type TreatmentLocalizationResponse = ASCResponse<AppStoreVersionExperimentTreatmentLocalization>;
export type TreatmentLocalizationListResponse = ASCResponse<AppStoreVersionExperimentTreatmentLocalization[]>;

/**
 * API operation result
 */
export interface PPOOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Complete PPO test creation result
 */
export interface CompletePPOTestResult {
  success: boolean;
  experiment?: AppStoreVersionExperiment;
  treatments?: AppStoreVersionExperimentTreatment[];
  error?: string;
}

/**
 * APP-017: Apply Winning Treatment
 *
 * Result of applying a winning treatment to the default product page
 */
export interface ApplyWinningTreatmentResult {
  success: boolean;
  data?: {
    /** Treatment that was applied */
    treatmentId: string;
    treatmentName: string;
    /** Locales that were updated */
    localesUpdated: string[];
    /** Screenshot sets that were copied */
    screenshotSetsCopied: number;
    /** Preview sets that were copied */
    previewSetsCopied: number;
    /** Details of what was copied per locale */
    details: Array<{
      locale: string;
      screenshotSets: number;
      previewSets: number;
      success: boolean;
      error?: string;
    }>;
  };
  error?: string;
}

/**
 * Options for applying a winning treatment
 */
export interface ApplyWinningTreatmentOptions {
  /** Experiment ID */
  experimentId: string;
  /** Treatment ID to apply (if not provided, auto-detect winner) */
  treatmentId?: string;
  /** App Store Version ID to apply to (defaults to control version) */
  targetVersionId?: string;
  /** Locales to copy (if not provided, copies all treatment locales) */
  locales?: string[];
  /** Whether to replace existing screenshots (default: false, appends instead) */
  replaceExisting?: boolean;
  /** Dry run mode - don't actually copy, just show what would be copied */
  dryRun?: boolean;
}
