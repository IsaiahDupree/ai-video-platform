/**
 * APP-007: App List Fetcher
 *
 * Service for fetching and managing apps from App Store Connect API
 */

import { makeRequest, getDefaultCredentials } from './ascAuth';
import type { ASCCredentials } from '@/types/ascAuth';
import type {
  App,
  AppInfo,
  AppsResponse,
  AppResponse,
  FetchAppsOptions,
  ListAppsQuery,
  AppStatistics,
  AppPlatform,
} from '@/types/ascApps';

/**
 * Fetch apps from App Store Connect API
 */
export async function fetchApps(
  credentials?: ASCCredentials,
  options: FetchAppsOptions = {}
): Promise<AppsResponse> {
  // Use provided credentials or get default
  const creds = credentials || (await getDefaultCredentials());

  if (!creds) {
    throw new Error('App Store Connect credentials not found');
  }

  // Build query parameters
  const query: ListAppsQuery = {};

  if (options.limit) {
    query.limit = options.limit;
  }

  if (options.bundleId) {
    query['filter[bundleId]'] = options.bundleId;
  }

  if (options.name) {
    query['filter[name]'] = options.name;
  }

  if (options.sku) {
    query['filter[sku]'] = options.sku;
  }

  if (options.include && options.include.length > 0) {
    query.include = options.include;
  }

  if (options.sort) {
    query.sort = options.sort;
  }

  // Make API request
  const response = await makeRequest<AppsResponse>(creds, {
    method: 'GET',
    path: '/v1/apps',
    query: query as any,
  });

  // If fetchAll is true and there's a next page, fetch all pages
  if (options.fetchAll && response.links?.next) {
    const allApps: App[] = ((response.data as unknown) as App[]).slice(0);
    let nextUrl = response.links.next;

    while (nextUrl) {
      // Extract cursor from next URL
      const url = new URL(nextUrl);
      const cursor = url.searchParams.get('cursor');

      if (!cursor) break;

      // Fetch next page
      const nextQuery = { ...query, cursor } as any;
      const nextResponse = await makeRequest<AppsResponse>(creds, {
        method: 'GET',
        path: '/v1/apps',
        query: nextQuery,
      });

      allApps.push(...(((nextResponse.data as unknown) as App[])));
      nextUrl = nextResponse.links?.next || '';
    }

    // Return combined response
    return {
      data: allApps,
      links: {
        self: response.links.self,
        first: response.links.first || response.links.self,
      },
      meta: {
        paging: {
          total: allApps.length,
        },
      },
    };
  }

  return response;
}

/**
 * Fetch a single app by ID
 */
export async function fetchApp(
  appId: string,
  credentials?: ASCCredentials,
  include?: string[]
): Promise<App> {
  // Use provided credentials or get default
  const creds = credentials || (await getDefaultCredentials());

  // Build query parameters
  const query: Record<string, any> = {};

  if (include && include.length > 0) {
    query.include = include;
  }

  // Make API request
  const response = await makeRequest<AppResponse>(creds, {
    method: 'GET',
    path: `/v1/apps/${appId}`,
    query,
  });

  return response.data;
}

/**
 * Search apps by name
 */
export async function searchAppsByName(
  name: string,
  credentials?: ASCCredentials,
  limit = 20
): Promise<App[]> {
  const response = await fetchApps(credentials, {
    name,
    limit,
  });

  return response.data;
}

/**
 * Search apps by bundle ID
 */
export async function searchAppsByBundleId(
  bundleId: string,
  credentials?: ASCCredentials
): Promise<App[]> {
  const response = await fetchApps(credentials, {
    bundleId,
    limit: 10,
  });

  return response.data;
}

/**
 * Get all apps (with pagination)
 */
export async function getAllApps(credentials?: ASCCredentials): Promise<App[]> {
  const response = await fetchApps(credentials, {
    fetchAll: true,
    limit: 200, // Max allowed by API
  });

  return response.data;
}

/**
 * Convert App to simplified AppInfo
 */
export function toAppInfo(app: App): AppInfo {
  // Infer platform from bundle ID or default to iOS
  let platform: AppPlatform = 'IOS';

  if (app.attributes.bundleId.includes('.macos') || app.attributes.bundleId.includes('.mac')) {
    platform = 'MAC_OS';
  } else if (app.attributes.bundleId.includes('.tvos') || app.attributes.bundleId.includes('.tv')) {
    platform = 'TV_OS';
  } else if (app.attributes.bundleId.includes('.visionos') || app.attributes.bundleId.includes('.vision')) {
    platform = 'VISION_OS';
  }

  return {
    id: app.id,
    name: app.attributes.name,
    bundleId: app.attributes.bundleId,
    sku: app.attributes.sku,
    primaryLocale: app.attributes.primaryLocale,
    platform,
  };
}

/**
 * Get simplified app info list
 */
export async function getAppInfoList(
  credentials?: ASCCredentials,
  options: FetchAppsOptions = {}
): Promise<AppInfo[]> {
  const response = await fetchApps(credentials, options);
  return response.data.map(toAppInfo);
}

/**
 * Get app statistics
 */
export async function getAppStatistics(
  credentials?: ASCCredentials
): Promise<AppStatistics> {
  const apps = await getAllApps(credentials);
  const appInfos = apps.map(toAppInfo);

  // Count by platform
  const byPlatform: Record<AppPlatform, number> = {
    IOS: 0,
    MAC_OS: 0,
    TV_OS: 0,
    VISION_OS: 0,
  };

  for (const app of appInfos) {
    if (app.platform) {
      byPlatform[app.platform]++;
    }
  }

  // Get most recent apps (first 10)
  const recent = appInfos.slice(0, 10);

  return {
    total: apps.length,
    byPlatform,
    recent,
  };
}

/**
 * Filter apps by platform
 */
export function filterAppsByPlatform(apps: App[], platform: AppPlatform): App[] {
  return apps.filter((app) => {
    const info = toAppInfo(app);
    return info.platform === platform;
  });
}

/**
 * Group apps by platform
 */
export function groupAppsByPlatform(apps: App[]): Record<AppPlatform, App[]> {
  const grouped: Record<AppPlatform, App[]> = {
    IOS: [],
    MAC_OS: [],
    TV_OS: [],
    VISION_OS: [],
  };

  for (const app of apps) {
    const info = toAppInfo(app);
    if (info.platform) {
      grouped[info.platform].push(app);
    }
  }

  return grouped;
}

/**
 * Find app by bundle ID
 */
export async function findAppByBundleId(
  bundleId: string,
  credentials?: ASCCredentials
): Promise<App | null> {
  const apps = await searchAppsByBundleId(bundleId, credentials);
  return apps.length > 0 ? apps[0] : null;
}

/**
 * Check if app exists by bundle ID
 */
export async function appExists(
  bundleId: string,
  credentials?: ASCCredentials
): Promise<boolean> {
  const app = await findAppByBundleId(bundleId, credentials);
  return app !== null;
}

/**
 * Get app count
 */
export async function getAppCount(credentials?: ASCCredentials): Promise<number> {
  const response = await fetchApps(credentials, { limit: 1 });
  return response.meta?.paging?.total || 0;
}
