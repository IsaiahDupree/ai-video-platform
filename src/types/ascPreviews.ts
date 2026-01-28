/**
 * APP-009: App Preview Upload API
 *
 * Type definitions for App Store Connect app preview videos API
 */

/**
 * Preview display type (device type + orientation)
 * Based on App Store Connect API v1
 *
 * App previews use the same display types as screenshots
 */
export type PreviewDisplayType =
  // iPhone
  | 'APP_IPHONE_67' // iPhone 17 Pro Max / 16 Pro Max (6.7")
  | 'APP_IPHONE_65' // iPhone 16 Plus / 15 Plus / 14 Plus (6.5")
  | 'APP_IPHONE_61' // iPhone 15 / 14 / 13 / 12 (6.1")
  | 'APP_IPHONE_58' // iPhone 11 Pro / XS / X (5.8")
  | 'APP_IPHONE_55' // iPhone 8 Plus / 7 Plus / 6s Plus (5.5")
  | 'APP_IPHONE_47' // iPhone SE (4.7")
  | 'APP_IPHONE_40' // iPhone SE (4.0")
  | 'APP_IPHONE_35' // iPhone 4s (3.5")
  // iPad
  | 'APP_IPAD_PRO_3GEN_129' // iPad Pro 12.9" (3rd gen+)
  | 'APP_IPAD_PRO_3GEN_11' // iPad Pro 11"
  | 'APP_IPAD_PRO_129' // iPad Pro 12.9" (1st/2nd gen)
  | 'APP_IPAD_105' // iPad 10.5"
  | 'APP_IPAD_97' // iPad 9.7"
  // Apple Watch
  | 'APP_WATCH_ULTRA' // Apple Watch Ultra (49mm)
  | 'APP_WATCH_SERIES_7' // Apple Watch Series 7+ (45mm)
  | 'APP_WATCH_SERIES_4' // Apple Watch Series 4-6 (44mm)
  | 'APP_WATCH_SERIES_3' // Apple Watch Series 3 (42mm)
  // Apple TV
  | 'APP_APPLE_TV' // Apple TV
  // Mac
  | 'APP_DESKTOP' // Mac
  // Vision
  | 'APP_VISION_PRO'; // Apple Vision Pro

/**
 * Video preview type
 */
export type PreviewType = 'PREVIEW' | 'ANIMATED_PREVIEW';

/**
 * App preview attributes
 */
export interface AppPreviewAttributes {
  /** File size in bytes */
  fileSize?: number;
  /** File name */
  fileName?: string;
  /** Source file checksum */
  sourceFileChecksum?: string;
  /** Preview frame time code (for poster frame) */
  previewFrameTimeCode?: string;
  /** Mime type */
  mimeType?: string;
  /** Video asset details */
  videoAsset?: {
    /** Template URL for downloading */
    templateUrl?: string;
    /** Width in pixels */
    width?: number;
    /** Height in pixels */
    height?: number;
    /** Duration in seconds */
    duration?: number;
  };
  /** Preview image (poster frame) */
  previewImage?: {
    /** Template URL for downloading */
    templateUrl?: string;
    /** Width in pixels */
    width?: number;
    /** Height in pixels */
    height?: number;
  };
  /** Asset delivery state */
  assetDeliveryState?: {
    /** State (AWAITING_UPLOAD, UPLOAD_COMPLETE, COMPLETE, FAILED) */
    state?: string;
    /** Errors if any */
    errors?: Array<{
      code?: string;
      description?: string;
    }>;
  };
  /** Upload operations for video */
  uploadOperations?: Array<{
    /** HTTP method */
    method?: string;
    /** Request headers */
    requestHeaders?: Array<{
      name?: string;
      value?: string;
    }>;
    /** Upload URL */
    url?: string;
    /** Offset for resumable uploads */
    offset?: number;
    /** Length of chunk to upload */
    length?: number;
  }>;
}

/**
 * App preview relationships
 */
export interface AppPreviewRelationships {
  /** Parent preview set */
  appPreviewSet?: {
    data?: {
      type: 'appPreviewSets';
      id: string;
    };
  };
}

/**
 * App preview resource
 */
export interface AppPreview {
  /** Resource type */
  type: 'appPreviews';
  /** Unique identifier */
  id: string;
  /** Preview attributes */
  attributes: AppPreviewAttributes;
  /** Preview relationships */
  relationships?: AppPreviewRelationships;
  /** Links */
  links?: {
    self: string;
  };
}

/**
 * App preview set attributes
 */
export interface AppPreviewSetAttributes {
  /** Preview display type (device type) */
  previewType: PreviewDisplayType;
}

/**
 * App preview set relationships
 */
export interface AppPreviewSetRelationships {
  /** App store version localization */
  appStoreVersionLocalization?: {
    data?: {
      type: 'appStoreVersionLocalizations';
      id: string;
    };
  };
  /** App custom product page localization */
  appCustomProductPageLocalization?: {
    data?: {
      type: 'appCustomProductPageLocalizations';
      id: string;
    };
  };
  /** Previews in this set */
  appPreviews?: {
    data?: Array<{
      type: 'appPreviews';
      id: string;
    }>;
    links?: {
      self?: string;
      related?: string;
    };
    meta?: {
      paging?: {
        total: number;
        limit: number;
      };
    };
  };
}

/**
 * App preview set resource
 */
export interface AppPreviewSet {
  /** Resource type */
  type: 'appPreviewSets';
  /** Unique identifier */
  id: string;
  /** Preview set attributes */
  attributes: AppPreviewSetAttributes;
  /** Preview set relationships */
  relationships?: AppPreviewSetRelationships;
  /** Links */
  links?: {
    self: string;
  };
}

/**
 * Response wrapper for preview operations
 */
export interface AppPreviewResponse {
  /** Preview data */
  data: AppPreview;
  /** Included related resources */
  included?: Array<AppPreviewSet>;
  /** Links */
  links?: {
    self: string;
  };
}

/**
 * Response wrapper for preview set operations
 */
export interface AppPreviewSetResponse {
  /** Preview set data */
  data: AppPreviewSet;
  /** Included related resources */
  included?: Array<AppPreview>;
  /** Links */
  links?: {
    self: string;
  };
}

/**
 * Response wrapper for listing preview sets
 */
export interface AppPreviewSetsResponse {
  /** Preview sets data */
  data: AppPreviewSet[];
  /** Included related resources */
  included?: Array<AppPreview>;
  /** Links for pagination */
  links?: {
    self: string;
    next?: string;
    first?: string;
  };
  /** Metadata */
  meta?: {
    paging?: {
      total: number;
      limit: number;
    };
  };
}

/**
 * Response wrapper for listing previews
 */
export interface AppPreviewsResponse {
  /** Previews data */
  data: AppPreview[];
  /** Included related resources */
  included?: Array<AppPreviewSet>;
  /** Links for pagination */
  links?: {
    self: string;
    next?: string;
    first?: string;
  };
  /** Metadata */
  meta?: {
    paging?: {
      total: number;
      limit: number;
    };
  };
}

/**
 * Options for creating a preview set
 */
export interface CreatePreviewSetOptions {
  /** Preview display type */
  previewType: PreviewDisplayType;
  /** App Store version localization ID */
  appStoreVersionLocalizationId: string;
}

/**
 * Options for creating/uploading a preview
 */
export interface CreatePreviewOptions {
  /** Preview set ID */
  appPreviewSetId: string;
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** File buffer or path */
  file: Buffer | string;
  /** Preview frame time code (e.g., "00:00:05:00") */
  previewFrameTimeCode?: string;
  /** Mime type (e.g., "video/mp4") */
  mimeType?: string;
}

/**
 * Options for uploading preview data
 */
export interface UploadPreviewDataOptions {
  /** Preview ID */
  previewId: string;
  /** Upload operation details */
  uploadOperation: {
    method: string;
    url: string;
    requestHeaders: Array<{ name: string; value: string }>;
    offset?: number;
    length?: number;
  };
  /** File buffer */
  fileData: Buffer;
}

/**
 * Options for committing a preview upload
 */
export interface CommitPreviewOptions {
  /** Preview ID */
  previewId: string;
  /** Whether upload is complete */
  uploaded: boolean;
  /** Source file checksum (MD5) */
  sourceFileChecksum?: string;
}

/**
 * Options for deleting a preview
 */
export interface DeletePreviewOptions {
  /** Preview ID */
  previewId: string;
}

/**
 * Options for deleting a preview set
 */
export interface DeletePreviewSetOptions {
  /** Preview set ID */
  previewSetId: string;
}

/**
 * Options for listing preview sets
 */
export interface ListPreviewSetsOptions {
  /** App Store version localization ID */
  appStoreVersionLocalizationId: string;
  /** Filter by preview type */
  filterPreviewType?: PreviewDisplayType;
  /** Include related resources */
  include?: Array<'appPreviews'>;
  /** Page limit */
  limit?: number;
}

/**
 * Options for listing previews in a set
 */
export interface ListPreviewsOptions {
  /** Preview set ID */
  appPreviewSetId: string;
  /** Include related resources */
  include?: Array<'appPreviewSet'>;
  /** Page limit */
  limit?: number;
}

/**
 * Preview info for simplified operations
 */
export interface PreviewInfo {
  /** Preview ID */
  id: string;
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Display type */
  displayType: PreviewDisplayType;
  /** Upload state */
  state: 'awaiting_upload' | 'upload_complete' | 'complete' | 'failed';
  /** Video dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
  /** Duration in seconds */
  duration?: number;
  /** Download URL for video */
  downloadUrl?: string;
  /** Preview image (poster frame) URL */
  previewImageUrl?: string;
}

/**
 * Preview set info for simplified operations
 */
export interface PreviewSetInfo {
  /** Preview set ID */
  id: string;
  /** Display type */
  displayType: PreviewDisplayType;
  /** Number of previews */
  previewCount: number;
  /** Previews in this set */
  previews: PreviewInfo[];
}

/**
 * Simplified preview upload result
 */
export interface UploadPreviewResult {
  /** Success flag */
  success: boolean;
  /** Preview ID */
  previewId?: string;
  /** Preview info */
  preview?: PreviewInfo;
  /** Error message if failed */
  error?: string;
}

/**
 * Batch upload result
 */
export interface BatchUploadPreviewResult {
  /** Success flag */
  success: boolean;
  /** Number of previews uploaded */
  uploaded: number;
  /** Number of previews failed */
  failed: number;
  /** Results for each preview */
  results: UploadPreviewResult[];
  /** Preview set info */
  previewSet?: PreviewSetInfo;
}
