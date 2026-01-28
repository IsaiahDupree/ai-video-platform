/**
 * APP-007: App List Fetcher
 *
 * Type definitions for App Store Connect apps API
 */

/**
 * App platform (e.g., iOS, macOS, tvOS)
 */
export type AppPlatform = 'IOS' | 'MAC_OS' | 'TV_OS' | 'VISION_OS';

/**
 * App Store version platform (specific device types)
 */
export type AppStoreVersionPlatform =
  | 'IOS'
  | 'MAC_OS'
  | 'TV_OS'
  | 'VISION_OS';

/**
 * App content rights declaration
 */
export type ContentRightsDeclaration =
  | 'USES_ONLY_FIRST_PARTY_CONTENT'
  | 'USES_THIRD_PARTY_CONTENT';

/**
 * App attributes from App Store Connect API
 */
export interface AppAttributes {
  /** App name */
  name: string;
  /** Bundle ID (e.g., com.company.app) */
  bundleId: string;
  /** SKU (unique app identifier) */
  sku: string;
  /** Primary locale (e.g., en-US) */
  primaryLocale: string;
  /** Whether app is available for purchase */
  isOrEverWasMadeForKids?: boolean;
  /** Subscription status key */
  subscriptionStatusUrl?: string;
  /** Subscription status URL version */
  subscriptionStatusUrlVersion?: string;
  /** Subscription status URL for sandbox */
  subscriptionStatusUrlForSandbox?: string;
  /** Subscription status URL version for sandbox */
  subscriptionStatusUrlVersionForSandbox?: string;
  /** Available territories */
  availableInNewTerritories?: boolean;
  /** Content rights declaration */
  contentRightsDeclaration?: ContentRightsDeclaration;
}

/**
 * App relationships (related resources)
 */
export interface AppRelationships {
  /** App Store versions */
  appStoreVersions?: {
    links?: {
      self?: string;
      related?: string;
    };
    data?: Array<{
      type: 'appStoreVersions';
      id: string;
    }>;
  };
  /** Pre-release versions */
  preReleaseVersions?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** Beta app localizations */
  betaAppLocalizations?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** Beta license agreement */
  betaLicenseAgreement?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** Beta app review detail */
  betaAppReviewDetail?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** App infos */
  appInfos?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** App clips */
  appClips?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** Prices */
  prices?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** Available territories */
  availableTerritories?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** In-app purchases */
  inAppPurchases?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** Subscriptions */
  subscriptions?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** Game center enabled versions */
  gameCenterEnabledVersions?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** Perf power metrics */
  perfPowerMetrics?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
  /** App custom product pages */
  appCustomProductPages?: {
    links?: {
      self?: string;
      related?: string;
    };
  };
}

/**
 * App resource from App Store Connect API
 */
export interface App {
  /** Resource type (always 'apps') */
  type: 'apps';
  /** Unique app ID */
  id: string;
  /** App attributes */
  attributes: AppAttributes;
  /** App relationships (related resources) */
  relationships?: AppRelationships;
  /** Resource links */
  links?: {
    self: string;
  };
}

/**
 * Apps list response from App Store Connect API
 */
export interface AppsResponse {
  /** List of apps */
  data: App[];
  /** Response links (pagination) */
  links: {
    /** Self link */
    self: string;
    /** Next page link (if available) */
    next?: string;
    /** First page link */
    first?: string;
  };
  /** Response metadata */
  meta?: {
    paging?: {
      /** Total number of apps */
      total?: number;
      /** Limit per page */
      limit?: number;
    };
  };
}

/**
 * Single app response from App Store Connect API
 */
export interface AppResponse {
  /** App data */
  data: App;
  /** Response links */
  links?: {
    self: string;
  };
}

/**
 * Query parameters for listing apps
 */
export interface ListAppsQuery {
  /** Filter by bundle ID */
  'filter[bundleId]'?: string;
  /** Filter by name */
  'filter[name]'?: string;
  /** Filter by SKU */
  'filter[sku]'?: string;
  /** Filter by app store versions */
  'filter[appStoreVersions]'?: string;
  /** Filter by ID */
  'filter[id]'?: string;
  /** Include related resources */
  include?: string[];
  /** Fields to include in response */
  'fields[apps]'?: string[];
  /** Maximum number of apps to return */
  limit?: number;
  /** Sort by field */
  sort?: string;
  /** Cursor for pagination */
  cursor?: string;
}

/**
 * Options for fetching apps
 */
export interface FetchAppsOptions {
  /** Maximum number of apps to fetch */
  limit?: number;
  /** Filter by bundle ID */
  bundleId?: string;
  /** Filter by name */
  name?: string;
  /** Filter by SKU */
  sku?: string;
  /** Include related resources (e.g., 'appStoreVersions', 'appInfos') */
  include?: string[];
  /** Sort by field (e.g., 'name', '-name') */
  sort?: string;
  /** Fetch all pages (paginate automatically) */
  fetchAll?: boolean;
}

/**
 * Simplified app info for display
 */
export interface AppInfo {
  /** App ID */
  id: string;
  /** App name */
  name: string;
  /** Bundle ID */
  bundleId: string;
  /** SKU */
  sku: string;
  /** Primary locale */
  primaryLocale: string;
  /** Platform (derived from bundle ID or other metadata) */
  platform?: AppPlatform;
}

/**
 * Statistics for apps
 */
export interface AppStatistics {
  /** Total number of apps */
  total: number;
  /** Breakdown by platform */
  byPlatform?: Record<AppPlatform, number>;
  /** Most recent apps */
  recent?: AppInfo[];
}
