/**
 * APP-010: Custom Product Page Creator
 *
 * Type definitions for App Store Connect Custom Product Pages API
 */

/**
 * Custom Product Page state
 * States that a custom product page can be in
 */
export type CustomProductPageState =
  | 'PREPARE_FOR_SUBMISSION'  // Initial state, being edited
  | 'READY_FOR_DISTRIBUTION'  // Approved and ready to use
  | 'PROCESSING_FOR_DISTRIBUTION' // Being processed by Apple
  | 'REPLACED_WITH_NEW_VERSION'; // Superseded by newer version

/**
 * Custom Product Page visibility
 * Determines if the page is visible or hidden
 */
export type CustomProductPageVisibility = 'VISIBLE' | 'HIDDEN';

/**
 * App Custom Product Page attributes
 */
export interface AppCustomProductPageAttributes {
  /** Custom product page name */
  name?: string;
  /** Unique URL slug for this custom product page */
  url?: string;
  /** Whether the custom product page is visible */
  visible?: boolean;
  /** State of the custom product page */
  state?: CustomProductPageState;
}

/**
 * App Custom Product Page relationships
 */
export interface AppCustomProductPageRelationships {
  /** Parent app */
  app?: {
    data?: {
      type: 'apps';
      id: string;
    };
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** App custom product page versions */
  appCustomProductPageVersions?: {
    data?: Array<{
      type: 'appCustomProductPageVersions';
      id: string;
    }>;
    links?: {
      self?: string;
      related?: string;
    };
    meta?: {
      paging?: {
        total?: number;
        limit?: number;
      };
    };
  };
}

/**
 * App Custom Product Page resource
 */
export interface AppCustomProductPage {
  /** Resource type */
  type: 'appCustomProductPages';
  /** Resource ID */
  id: string;
  /** Attributes */
  attributes?: AppCustomProductPageAttributes;
  /** Relationships */
  relationships?: AppCustomProductPageRelationships;
  /** Links */
  links?: {
    /** Self link */
    self?: string;
  };
}

/**
 * App Custom Product Page Version state
 */
export type CustomProductPageVersionState =
  | 'PREPARE_FOR_SUBMISSION'  // Being edited
  | 'WAITING_FOR_REVIEW'      // Submitted to Apple
  | 'IN_REVIEW'               // Under review by Apple
  | 'ACCEPTED'                // Accepted but not yet live
  | 'APPROVED'                // Approved and live
  | 'REPLACED_WITH_NEW_VERSION' // Superseded
  | 'REJECTED';               // Rejected by Apple

/**
 * App Custom Product Page Version attributes
 */
export interface AppCustomProductPageVersionAttributes {
  /** Version name */
  name?: string;
  /** State of the version */
  state?: CustomProductPageVersionState;
  /** Deep link (URL) to this custom product page */
  deepLink?: string;
}

/**
 * App Custom Product Page Version relationships
 */
export interface AppCustomProductPageVersionRelationships {
  /** Parent custom product page */
  appCustomProductPage?: {
    data?: {
      type: 'appCustomProductPages';
      id: string;
    };
  };
  /** Associated localizations */
  appCustomProductPageLocalizations?: {
    data?: Array<{
      type: 'appCustomProductPageLocalizations';
      id: string;
    }>;
    links?: {
      self?: string;
      related?: string;
    };
    meta?: {
      paging?: {
        total?: number;
        limit?: number;
      };
    };
  };
}

/**
 * App Custom Product Page Version resource
 */
export interface AppCustomProductPageVersion {
  /** Resource type */
  type: 'appCustomProductPageVersions';
  /** Resource ID */
  id: string;
  /** Attributes */
  attributes?: AppCustomProductPageVersionAttributes;
  /** Relationships */
  relationships?: AppCustomProductPageVersionRelationships;
  /** Links */
  links?: {
    /** Self link */
    self?: string;
  };
}

/**
 * App Custom Product Page Localization state
 */
export type CustomProductPageLocalizationState =
  | 'PREPARE_FOR_SUBMISSION'
  | 'WAITING_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'ACCEPTED'
  | 'APPROVED'
  | 'REPLACED_WITH_NEW_VERSION'
  | 'REJECTED';

/**
 * App Custom Product Page Localization attributes
 */
export interface AppCustomProductPageLocalizationAttributes {
  /** Locale code (e.g., 'en-US', 'fr-FR') */
  locale?: string;
  /** Promotional text (170 characters max) */
  promotionalText?: string;
  /** State of the localization */
  state?: CustomProductPageLocalizationState;
}

/**
 * App Custom Product Page Localization relationships
 */
export interface AppCustomProductPageLocalizationRelationships {
  /** Parent custom product page version */
  appCustomProductPageVersion?: {
    data?: {
      type: 'appCustomProductPageVersions';
      id: string;
    };
  };
  /** Screenshot sets */
  appScreenshotSets?: {
    data?: Array<{
      type: 'appScreenshotSets';
      id: string;
    }>;
    links?: {
      self?: string;
      related?: string;
    };
    meta?: {
      paging?: {
        total?: number;
        limit?: number;
      };
    };
  };
  /** App preview sets */
  appPreviewSets?: {
    data?: Array<{
      type: 'appPreviewSets';
      id: string;
    }>;
    links?: {
      self?: string;
      related?: string;
    };
    meta?: {
      paging?: {
        total?: number;
        limit?: number;
      };
    };
  };
}

/**
 * App Custom Product Page Localization resource
 */
export interface AppCustomProductPageLocalization {
  /** Resource type */
  type: 'appCustomProductPageLocalizations';
  /** Resource ID */
  id: string;
  /** Attributes */
  attributes?: AppCustomProductPageLocalizationAttributes;
  /** Relationships */
  relationships?: AppCustomProductPageLocalizationRelationships;
  /** Links */
  links?: {
    /** Self link */
    self?: string;
  };
}

/**
 * API Response wrapper for a single custom product page
 */
export interface AppCustomProductPageResponse {
  /** The custom product page data */
  data: AppCustomProductPage;
  /** Included resources */
  included?: Array<
    | AppCustomProductPageVersion
    | AppCustomProductPageLocalization
  >;
  /** Links */
  links?: {
    self?: string;
  };
}

/**
 * API Response wrapper for multiple custom product pages
 */
export interface AppCustomProductPagesResponse {
  /** Array of custom product pages */
  data: AppCustomProductPage[];
  /** Included resources */
  included?: Array<
    | AppCustomProductPageVersion
    | AppCustomProductPageLocalization
  >;
  /** Links for pagination */
  links?: {
    self?: string;
    next?: string;
    first?: string;
  };
  /** Metadata */
  meta?: {
    paging?: {
      total?: number;
      limit?: number;
    };
  };
}

/**
 * API Response wrapper for a single custom product page version
 */
export interface AppCustomProductPageVersionResponse {
  /** The version data */
  data: AppCustomProductPageVersion;
  /** Included resources */
  included?: Array<
    | AppCustomProductPage
    | AppCustomProductPageLocalization
  >;
  /** Links */
  links?: {
    self?: string;
  };
}

/**
 * API Response wrapper for multiple custom product page versions
 */
export interface AppCustomProductPageVersionsResponse {
  /** Array of versions */
  data: AppCustomProductPageVersion[];
  /** Included resources */
  included?: Array<
    | AppCustomProductPage
    | AppCustomProductPageLocalization
  >;
  /** Links for pagination */
  links?: {
    self?: string;
    next?: string;
    first?: string;
  };
  /** Metadata */
  meta?: {
    paging?: {
      total?: number;
      limit?: number;
    };
  };
}

/**
 * API Response wrapper for a single custom product page localization
 */
export interface AppCustomProductPageLocalizationResponse {
  /** The localization data */
  data: AppCustomProductPageLocalization;
  /** Included resources */
  included?: Array<
    | AppCustomProductPageVersion
    | AppCustomProductPage
  >;
  /** Links */
  links?: {
    self?: string;
  };
}

/**
 * API Response wrapper for multiple custom product page localizations
 */
export interface AppCustomProductPageLocalizationsResponse {
  /** Array of localizations */
  data: AppCustomProductPageLocalization[];
  /** Included resources */
  included?: Array<
    | AppCustomProductPageVersion
    | AppCustomProductPage
  >;
  /** Links for pagination */
  links?: {
    self?: string;
    next?: string;
    first?: string;
  };
  /** Metadata */
  meta?: {
    paging?: {
      total?: number;
      limit?: number;
    };
  };
}

/**
 * Options for creating a custom product page
 */
export interface CreateCustomProductPageOptions {
  /** App ID to create the page for */
  appId: string;
  /** Name of the custom product page */
  name: string;
  /** Whether the page should be visible (default: true) */
  visible?: boolean;
}

/**
 * Options for creating a custom product page version
 */
export interface CreateCustomProductPageVersionOptions {
  /** Custom product page ID */
  customProductPageId: string;
}

/**
 * Options for creating a custom product page localization
 */
export interface CreateCustomProductPageLocalizationOptions {
  /** Custom product page version ID */
  customProductPageVersionId: string;
  /** Locale code (e.g., 'en-US') */
  locale: string;
  /** Optional promotional text (170 characters max) */
  promotionalText?: string;
}

/**
 * Options for updating a custom product page
 */
export interface UpdateCustomProductPageOptions {
  /** Custom product page ID */
  customProductPageId: string;
  /** New name (optional) */
  name?: string;
  /** New visibility (optional) */
  visible?: boolean;
}

/**
 * Options for updating a custom product page version
 */
export interface UpdateCustomProductPageVersionOptions {
  /** Custom product page version ID */
  versionId: string;
  /** New name (optional) */
  name?: string;
}

/**
 * Options for updating a custom product page localization
 */
export interface UpdateCustomProductPageLocalizationOptions {
  /** Localization ID */
  localizationId: string;
  /** New promotional text (optional, 170 characters max) */
  promotionalText?: string;
}

/**
 * Options for listing custom product pages
 */
export interface ListCustomProductPagesOptions {
  /** Filter by app ID */
  filterAppId?: string;
  /** Filter by visibility */
  filterVisible?: boolean;
  /** Include related resources */
  include?: Array<'appCustomProductPageVersions'>;
  /** Results per page */
  limit?: number;
}

/**
 * Options for listing custom product page versions
 */
export interface ListCustomProductPageVersionsOptions {
  /** Filter by custom product page ID */
  filterCustomProductPageId?: string;
  /** Filter by state */
  filterState?: CustomProductPageVersionState;
  /** Include related resources */
  include?: Array<'appCustomProductPage' | 'appCustomProductPageLocalizations'>;
  /** Results per page */
  limit?: number;
}

/**
 * Options for listing custom product page localizations
 */
export interface ListCustomProductPageLocalizationsOptions {
  /** Filter by custom product page version ID */
  filterCustomProductPageVersionId?: string;
  /** Filter by locale */
  filterLocale?: string;
  /** Include related resources */
  include?: Array<'appCustomProductPageVersion' | 'appScreenshotSets' | 'appPreviewSets'>;
  /** Results per page */
  limit?: number;
}

/**
 * Options for deleting a custom product page
 */
export interface DeleteCustomProductPageOptions {
  /** Custom product page ID to delete */
  customProductPageId: string;
}

/**
 * Options for deleting a custom product page version
 */
export interface DeleteCustomProductPageVersionOptions {
  /** Version ID to delete */
  versionId: string;
}

/**
 * Options for deleting a custom product page localization
 */
export interface DeleteCustomProductPageLocalizationOptions {
  /** Localization ID to delete */
  localizationId: string;
}

/**
 * Complete custom product page with all nested data
 */
export interface CompleteCustomProductPage {
  /** Custom product page */
  page: AppCustomProductPage;
  /** Current version */
  version?: AppCustomProductPageVersion;
  /** Localizations */
  localizations: AppCustomProductPageLocalization[];
}

/**
 * Result of a custom product page creation operation
 */
export interface CreateCustomProductPageResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** The created custom product page */
  customProductPage?: AppCustomProductPage;
  /** The created version */
  version?: AppCustomProductPageVersion;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of a custom product page localization creation operation
 */
export interface CreateCustomProductPageLocalizationResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** The created localization */
  localization?: AppCustomProductPageLocalization;
  /** Error message if failed */
  error?: string;
}
