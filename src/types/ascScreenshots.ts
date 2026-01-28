/**
 * APP-008: Screenshot Upload API
 *
 * Type definitions for App Store Connect screenshots API
 */

/**
 * Screenshot display type (device type + orientation)
 * Based on App Store Connect API v1
 */
export type ScreenshotDisplayType =
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
 * App screenshot attributes
 */
export interface AppScreenshotAttributes {
  /** File size in bytes */
  fileSize?: number;
  /** File name */
  fileName?: string;
  /** Source file checksum */
  sourceFileChecksum?: string;
  /** Image asset details */
  imageAsset?: {
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
  /** Upload operations */
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
 * App screenshot relationships
 */
export interface AppScreenshotRelationships {
  /** Parent screenshot set */
  appScreenshotSet?: {
    data?: {
      type: 'appScreenshotSets';
      id: string;
    };
  };
}

/**
 * App screenshot resource
 */
export interface AppScreenshot {
  /** Resource type */
  type: 'appScreenshots';
  /** Unique identifier */
  id: string;
  /** Screenshot attributes */
  attributes: AppScreenshotAttributes;
  /** Screenshot relationships */
  relationships?: AppScreenshotRelationships;
  /** Links */
  links?: {
    self: string;
  };
}

/**
 * App screenshot set attributes
 */
export interface AppScreenshotSetAttributes {
  /** Screenshot display type (device type) */
  screenshotDisplayType: ScreenshotDisplayType;
}

/**
 * App screenshot set relationships
 */
export interface AppScreenshotSetRelationships {
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
  /** Screenshots in this set */
  appScreenshots?: {
    data?: Array<{
      type: 'appScreenshots';
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
 * App screenshot set resource
 */
export interface AppScreenshotSet {
  /** Resource type */
  type: 'appScreenshotSets';
  /** Unique identifier */
  id: string;
  /** Screenshot set attributes */
  attributes: AppScreenshotSetAttributes;
  /** Screenshot set relationships */
  relationships?: AppScreenshotSetRelationships;
  /** Links */
  links?: {
    self: string;
  };
}

/**
 * App Store version localization attributes
 */
export interface AppStoreVersionLocalizationAttributes {
  /** Description */
  description?: string;
  /** Locale (e.g., en-US) */
  locale: string;
  /** Keywords */
  keywords?: string;
  /** Marketing URL */
  marketingUrl?: string;
  /** Promotional text */
  promotionalText?: string;
  /** Support URL */
  supportUrl?: string;
  /** What's new text */
  whatsNew?: string;
}

/**
 * App Store version localization resource
 */
export interface AppStoreVersionLocalization {
  /** Resource type */
  type: 'appStoreVersionLocalizations';
  /** Unique identifier */
  id: string;
  /** Localization attributes */
  attributes: AppStoreVersionLocalizationAttributes;
  /** Localization relationships */
  relationships?: {
    appStoreVersion?: {
      data?: {
        type: 'appStoreVersions';
        id: string;
      };
    };
    appScreenshotSets?: {
      data?: Array<{
        type: 'appScreenshotSets';
        id: string;
      }>;
      links?: {
        self?: string;
        related?: string;
      };
    };
    appPreviewSets?: {
      data?: Array<{
        type: 'appPreviewSets';
        id: string;
      }>;
      links?: {
        self?: string;
        related?: string;
      };
    };
  };
  /** Links */
  links?: {
    self: string;
  };
}

/**
 * Response wrapper for screenshot operations
 */
export interface AppScreenshotResponse {
  /** Screenshot data */
  data: AppScreenshot;
  /** Included related resources */
  included?: Array<AppScreenshotSet | AppStoreVersionLocalization>;
  /** Links */
  links?: {
    self: string;
  };
}

/**
 * Response wrapper for screenshot set operations
 */
export interface AppScreenshotSetResponse {
  /** Screenshot set data */
  data: AppScreenshotSet;
  /** Included related resources */
  included?: Array<AppScreenshot | AppStoreVersionLocalization>;
  /** Links */
  links?: {
    self: string;
  };
}

/**
 * Response wrapper for listing screenshot sets
 */
export interface AppScreenshotSetsResponse {
  /** Screenshot sets data */
  data: AppScreenshotSet[];
  /** Included related resources */
  included?: Array<AppScreenshot | AppStoreVersionLocalization>;
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
 * Response wrapper for listing screenshots
 */
export interface AppScreenshotsResponse {
  /** Screenshots data */
  data: AppScreenshot[];
  /** Included related resources */
  included?: Array<AppScreenshotSet | AppStoreVersionLocalization>;
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
 * Options for creating a screenshot set
 */
export interface CreateScreenshotSetOptions {
  /** Screenshot display type */
  screenshotDisplayType: ScreenshotDisplayType;
  /** App Store version localization ID */
  appStoreVersionLocalizationId: string;
}

/**
 * Options for creating/uploading a screenshot
 */
export interface CreateScreenshotOptions {
  /** Screenshot set ID */
  appScreenshotSetId: string;
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** File buffer or path */
  file: Buffer | string;
}

/**
 * Options for uploading screenshot data
 */
export interface UploadScreenshotDataOptions {
  /** Screenshot ID */
  screenshotId: string;
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
 * Options for committing a screenshot upload
 */
export interface CommitScreenshotOptions {
  /** Screenshot ID */
  screenshotId: string;
  /** Whether upload is complete */
  uploaded: boolean;
  /** Source file checksum (MD5) */
  sourceFileChecksum?: string;
}

/**
 * Options for deleting a screenshot
 */
export interface DeleteScreenshotOptions {
  /** Screenshot ID */
  screenshotId: string;
}

/**
 * Options for deleting a screenshot set
 */
export interface DeleteScreenshotSetOptions {
  /** Screenshot set ID */
  screenshotSetId: string;
}

/**
 * Options for listing screenshot sets
 */
export interface ListScreenshotSetsOptions {
  /** App Store version localization ID */
  appStoreVersionLocalizationId: string;
  /** Filter by screenshot display type */
  filterScreenshotDisplayType?: ScreenshotDisplayType;
  /** Include related resources */
  include?: Array<'appScreenshots'>;
  /** Page limit */
  limit?: number;
}

/**
 * Options for listing screenshots in a set
 */
export interface ListScreenshotsOptions {
  /** Screenshot set ID */
  appScreenshotSetId: string;
  /** Include related resources */
  include?: Array<'appScreenshotSet'>;
  /** Page limit */
  limit?: number;
}

/**
 * Screenshot info for simplified operations
 */
export interface ScreenshotInfo {
  /** Screenshot ID */
  id: string;
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Display type */
  displayType: ScreenshotDisplayType;
  /** Upload state */
  state: 'awaiting_upload' | 'upload_complete' | 'complete' | 'failed';
  /** Image dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
  /** Download URL */
  downloadUrl?: string;
}

/**
 * Screenshot set info for simplified operations
 */
export interface ScreenshotSetInfo {
  /** Screenshot set ID */
  id: string;
  /** Display type */
  displayType: ScreenshotDisplayType;
  /** Number of screenshots */
  screenshotCount: number;
  /** Screenshots in this set */
  screenshots: ScreenshotInfo[];
}

/**
 * Simplified screenshot upload result
 */
export interface UploadScreenshotResult {
  /** Success flag */
  success: boolean;
  /** Screenshot ID */
  screenshotId?: string;
  /** Screenshot info */
  screenshot?: ScreenshotInfo;
  /** Error message if failed */
  error?: string;
}

/**
 * Batch upload result
 */
export interface BatchUploadResult {
  /** Success flag */
  success: boolean;
  /** Number of screenshots uploaded */
  uploaded: number;
  /** Number of screenshots failed */
  failed: number;
  /** Results for each screenshot */
  results: UploadScreenshotResult[];
  /** Screenshot set info */
  screenshotSet?: ScreenshotSetInfo;
}
