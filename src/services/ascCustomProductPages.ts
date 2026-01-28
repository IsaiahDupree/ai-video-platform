/**
 * APP-010: Custom Product Page Creator
 *
 * Service for managing Custom Product Pages via App Store Connect API
 */

import { makeRequest, getDefaultCredentials } from './ascAuth';
import type { ASCCredentials } from '@/types/ascAuth';
import type {
  AppCustomProductPage,
  AppCustomProductPageResponse,
  AppCustomProductPagesResponse,
  AppCustomProductPageVersion,
  AppCustomProductPageVersionResponse,
  AppCustomProductPageVersionsResponse,
  AppCustomProductPageLocalization,
  AppCustomProductPageLocalizationResponse,
  AppCustomProductPageLocalizationsResponse,
  CompleteCustomProductPage,
  CreateCustomProductPageOptions,
  CreateCustomProductPageVersionOptions,
  CreateCustomProductPageLocalizationOptions,
  UpdateCustomProductPageOptions,
  UpdateCustomProductPageVersionOptions,
  UpdateCustomProductPageLocalizationOptions,
  ListCustomProductPagesOptions,
  ListCustomProductPageVersionsOptions,
  ListCustomProductPageLocalizationsOptions,
  DeleteCustomProductPageOptions,
  DeleteCustomProductPageVersionOptions,
  DeleteCustomProductPageLocalizationOptions,
  CreateCustomProductPageResult,
  CreateCustomProductPageLocalizationResult,
} from '@/types/ascCustomProductPages';

/**
 * =============================================================================
 * CUSTOM PRODUCT PAGE OPERATIONS
 * =============================================================================
 */

/**
 * Create a new custom product page
 *
 * @param options - Options for creating the custom product page
 * @param credentials - Optional ASC credentials
 * @returns The created custom product page
 */
export async function createCustomProductPage(
  options: CreateCustomProductPageOptions,
  credentials?: ASCCredentials
): Promise<AppCustomProductPage> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const response = await makeRequest<AppCustomProductPageResponse>(creds, {
    method: 'POST',
    path: '/v1/appCustomProductPages',
    body: {
      data: {
        type: 'appCustomProductPages',
        attributes: {
          name: options.name,
          visible: options.visible ?? true,
        },
        relationships: {
          app: {
            data: {
              type: 'apps',
              id: options.appId,
            },
          },
        },
      },
    },
  });

  return response.data;
}

/**
 * Get a custom product page by ID
 *
 * @param customProductPageId - The custom product page ID
 * @param credentials - Optional ASC credentials
 * @returns The custom product page
 */
export async function getCustomProductPage(
  customProductPageId: string,
  credentials?: ASCCredentials
): Promise<AppCustomProductPage> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const response = await makeRequest<AppCustomProductPageResponse>(creds, {
    method: 'GET',
    path: `/v1/appCustomProductPages/${customProductPageId}`,
    query: {
      include: 'appCustomProductPageVersions',
    },
  });

  return response.data;
}

/**
 * List custom product pages
 *
 * @param options - Options for listing
 * @param credentials - Optional ASC credentials
 * @returns Response with array of custom product pages
 */
export async function listCustomProductPages(
  options: ListCustomProductPagesOptions = {},
  credentials?: ASCCredentials
): Promise<AppCustomProductPagesResponse> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const query: Record<string, string | number | string[]> = {};

  if (options.filterAppId) {
    query['filter[app]'] = options.filterAppId;
  }

  if (options.filterVisible !== undefined) {
    query['filter[visible]'] = options.filterVisible.toString();
  }

  if (options.include && options.include.length > 0) {
    query.include = options.include.join(',');
  }

  if (options.limit) {
    query.limit = options.limit;
  }

  const response = await makeRequest<AppCustomProductPagesResponse>(creds, {
    method: 'GET',
    path: '/v1/appCustomProductPages',
    query,
  });

  return response;
}

/**
 * Update a custom product page
 *
 * @param options - Options for updating
 * @param credentials - Optional ASC credentials
 * @returns The updated custom product page
 */
export async function updateCustomProductPage(
  options: UpdateCustomProductPageOptions,
  credentials?: ASCCredentials
): Promise<AppCustomProductPage> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const attributes: Record<string, any> = {};

  if (options.name !== undefined) {
    attributes.name = options.name;
  }

  if (options.visible !== undefined) {
    attributes.visible = options.visible;
  }

  const response = await makeRequest<AppCustomProductPageResponse>(creds, {
    method: 'PATCH',
    path: `/v1/appCustomProductPages/${options.customProductPageId}`,
    body: {
      data: {
        type: 'appCustomProductPages',
        id: options.customProductPageId,
        attributes,
      },
    },
  });

  return response.data;
}

/**
 * Delete a custom product page
 *
 * @param options - Options for deletion
 * @param credentials - Optional ASC credentials
 */
export async function deleteCustomProductPage(
  options: DeleteCustomProductPageOptions,
  credentials?: ASCCredentials
): Promise<void> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  await makeRequest(creds, {
    method: 'DELETE',
    path: `/v1/appCustomProductPages/${options.customProductPageId}`,
  });
}

/**
 * =============================================================================
 * CUSTOM PRODUCT PAGE VERSION OPERATIONS
 * =============================================================================
 */

/**
 * Create a new custom product page version
 *
 * @param options - Options for creating the version
 * @param credentials - Optional ASC credentials
 * @returns The created version
 */
export async function createCustomProductPageVersion(
  options: CreateCustomProductPageVersionOptions,
  credentials?: ASCCredentials
): Promise<AppCustomProductPageVersion> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const response = await makeRequest<AppCustomProductPageVersionResponse>(creds, {
    method: 'POST',
    path: '/v1/appCustomProductPageVersions',
    body: {
      data: {
        type: 'appCustomProductPageVersions',
        relationships: {
          appCustomProductPage: {
            data: {
              type: 'appCustomProductPages',
              id: options.customProductPageId,
            },
          },
        },
      },
    },
  });

  return response.data;
}

/**
 * Get a custom product page version by ID
 *
 * @param versionId - The version ID
 * @param credentials - Optional ASC credentials
 * @returns The version
 */
export async function getCustomProductPageVersion(
  versionId: string,
  credentials?: ASCCredentials
): Promise<AppCustomProductPageVersion> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const response = await makeRequest<AppCustomProductPageVersionResponse>(creds, {
    method: 'GET',
    path: `/v1/appCustomProductPageVersions/${versionId}`,
    query: {
      include: 'appCustomProductPageLocalizations',
    },
  });

  return response.data;
}

/**
 * List custom product page versions
 *
 * @param options - Options for listing
 * @param credentials - Optional ASC credentials
 * @returns Response with array of versions
 */
export async function listCustomProductPageVersions(
  options: ListCustomProductPageVersionsOptions = {},
  credentials?: ASCCredentials
): Promise<AppCustomProductPageVersionsResponse> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const query: Record<string, string | number | string[]> = {};

  if (options.filterCustomProductPageId) {
    query['filter[appCustomProductPage]'] = options.filterCustomProductPageId;
  }

  if (options.filterState) {
    query['filter[state]'] = options.filterState;
  }

  if (options.include && options.include.length > 0) {
    query.include = options.include.join(',');
  }

  if (options.limit) {
    query.limit = options.limit;
  }

  const response = await makeRequest<AppCustomProductPageVersionsResponse>(creds, {
    method: 'GET',
    path: '/v1/appCustomProductPageVersions',
    query,
  });

  return response;
}

/**
 * Update a custom product page version
 *
 * @param options - Options for updating
 * @param credentials - Optional ASC credentials
 * @returns The updated version
 */
export async function updateCustomProductPageVersion(
  options: UpdateCustomProductPageVersionOptions,
  credentials?: ASCCredentials
): Promise<AppCustomProductPageVersion> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const response = await makeRequest<AppCustomProductPageVersionResponse>(creds, {
    method: 'PATCH',
    path: `/v1/appCustomProductPageVersions/${options.versionId}`,
    body: {
      data: {
        type: 'appCustomProductPageVersions',
        id: options.versionId,
        attributes: {
          name: options.name,
        },
      },
    },
  });

  return response.data;
}

/**
 * Delete a custom product page version
 *
 * @param options - Options for deletion
 * @param credentials - Optional ASC credentials
 */
export async function deleteCustomProductPageVersion(
  options: DeleteCustomProductPageVersionOptions,
  credentials?: ASCCredentials
): Promise<void> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  await makeRequest(creds, {
    method: 'DELETE',
    path: `/v1/appCustomProductPageVersions/${options.versionId}`,
  });
}

/**
 * =============================================================================
 * CUSTOM PRODUCT PAGE LOCALIZATION OPERATIONS
 * =============================================================================
 */

/**
 * Create a new custom product page localization
 *
 * @param options - Options for creating the localization
 * @param credentials - Optional ASC credentials
 * @returns The created localization
 */
export async function createCustomProductPageLocalization(
  options: CreateCustomProductPageLocalizationOptions,
  credentials?: ASCCredentials
): Promise<AppCustomProductPageLocalization> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const response = await makeRequest<AppCustomProductPageLocalizationResponse>(creds, {
    method: 'POST',
    path: '/v1/appCustomProductPageLocalizations',
    body: {
      data: {
        type: 'appCustomProductPageLocalizations',
        attributes: {
          locale: options.locale,
          ...(options.promotionalText && { promotionalText: options.promotionalText }),
        },
        relationships: {
          appCustomProductPageVersion: {
            data: {
              type: 'appCustomProductPageVersions',
              id: options.customProductPageVersionId,
            },
          },
        },
      },
    },
  });

  return response.data;
}

/**
 * Get a custom product page localization by ID
 *
 * @param localizationId - The localization ID
 * @param credentials - Optional ASC credentials
 * @returns The localization
 */
export async function getCustomProductPageLocalization(
  localizationId: string,
  credentials?: ASCCredentials
): Promise<AppCustomProductPageLocalization> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const response = await makeRequest<AppCustomProductPageLocalizationResponse>(creds, {
    method: 'GET',
    path: `/v1/appCustomProductPageLocalizations/${localizationId}`,
    query: {
      include: 'appScreenshotSets,appPreviewSets',
    },
  });

  return response.data;
}

/**
 * List custom product page localizations
 *
 * @param options - Options for listing
 * @param credentials - Optional ASC credentials
 * @returns Response with array of localizations
 */
export async function listCustomProductPageLocalizations(
  options: ListCustomProductPageLocalizationsOptions = {},
  credentials?: ASCCredentials
): Promise<AppCustomProductPageLocalizationsResponse> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const query: Record<string, string | number | string[]> = {};

  if (options.filterCustomProductPageVersionId) {
    query['filter[appCustomProductPageVersion]'] = options.filterCustomProductPageVersionId;
  }

  if (options.filterLocale) {
    query['filter[locale]'] = options.filterLocale;
  }

  if (options.include && options.include.length > 0) {
    query.include = options.include.join(',');
  }

  if (options.limit) {
    query.limit = options.limit;
  }

  const response = await makeRequest<AppCustomProductPageLocalizationsResponse>(creds, {
    method: 'GET',
    path: '/v1/appCustomProductPageLocalizations',
    query,
  });

  return response;
}

/**
 * Update a custom product page localization
 *
 * @param options - Options for updating
 * @param credentials - Optional ASC credentials
 * @returns The updated localization
 */
export async function updateCustomProductPageLocalization(
  options: UpdateCustomProductPageLocalizationOptions,
  credentials?: ASCCredentials
): Promise<AppCustomProductPageLocalization> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const response = await makeRequest<AppCustomProductPageLocalizationResponse>(creds, {
    method: 'PATCH',
    path: `/v1/appCustomProductPageLocalizations/${options.localizationId}`,
    body: {
      data: {
        type: 'appCustomProductPageLocalizations',
        id: options.localizationId,
        attributes: {
          promotionalText: options.promotionalText,
        },
      },
    },
  });

  return response.data;
}

/**
 * Delete a custom product page localization
 *
 * @param options - Options for deletion
 * @param credentials - Optional ASC credentials
 */
export async function deleteCustomProductPageLocalization(
  options: DeleteCustomProductPageLocalizationOptions,
  credentials?: ASCCredentials
): Promise<void> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  await makeRequest(creds, {
    method: 'DELETE',
    path: `/v1/appCustomProductPageLocalizations/${options.localizationId}`,
  });
}

/**
 * =============================================================================
 * HIGH-LEVEL OPERATIONS
 * =============================================================================
 */

/**
 * Create a complete custom product page with version and localization
 *
 * @param options - Combined options for creating page, version, and localization
 * @param credentials - Optional ASC credentials
 * @returns Result with created resources
 */
export async function createCompleteCustomProductPage(
  options: {
    appId: string;
    name: string;
    visible?: boolean;
    locale: string;
    promotionalText?: string;
  },
  credentials?: ASCCredentials
): Promise<CreateCustomProductPageResult> {
  try {
    const creds = credentials || (await getDefaultCredentials());
    if (!creds) throw new Error('No ASC credentials found');

    // Step 1: Create custom product page
    const customProductPage = await createCustomProductPage(
      {
        appId: options.appId,
        name: options.name,
        visible: options.visible,
      },
      creds
    );

    // Step 2: Create version
    const version = await createCustomProductPageVersion(
      {
        customProductPageId: customProductPage.id,
      },
      creds
    );

    // Step 3: Create localization
    await createCustomProductPageLocalization(
      {
        customProductPageVersionId: version.id,
        locale: options.locale,
        promotionalText: options.promotionalText,
      },
      creds
    );

    return {
      success: true,
      customProductPage,
      version,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get a complete custom product page with all nested data
 *
 * @param customProductPageId - The custom product page ID
 * @param credentials - Optional ASC credentials
 * @returns Complete custom product page with versions and localizations
 */
export async function getCompleteCustomProductPage(
  customProductPageId: string,
  credentials?: ASCCredentials
): Promise<CompleteCustomProductPage> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  // Get the custom product page
  const page = await getCustomProductPage(customProductPageId, creds);

  // Get versions
  const versionsResponse = await listCustomProductPageVersions(
    {
      filterCustomProductPageId: customProductPageId,
      include: ['appCustomProductPageLocalizations'],
      limit: 1,
    },
    creds
  );

  const version = versionsResponse.data[0];

  // Get localizations for the current version
  const localizations: AppCustomProductPageLocalization[] = [];
  if (version) {
    const localizationsResponse = await listCustomProductPageLocalizations(
      {
        filterCustomProductPageVersionId: version.id,
        include: ['appScreenshotSets', 'appPreviewSets'],
      },
      creds
    );

    localizations.push(...localizationsResponse.data);
  }

  return {
    page,
    version,
    localizations,
  };
}

/**
 * Add a localization to an existing custom product page
 *
 * @param options - Options for adding localization
 * @param credentials - Optional ASC credentials
 * @returns Result with created localization
 */
export async function addLocalizationToCustomProductPage(
  options: {
    customProductPageId: string;
    locale: string;
    promotionalText?: string;
  },
  credentials?: ASCCredentials
): Promise<CreateCustomProductPageLocalizationResult> {
  try {
    const creds = credentials || (await getDefaultCredentials());
    if (!creds) throw new Error('No ASC credentials found');

    // Get the latest version
    const versionsResponse = await listCustomProductPageVersions(
      {
        filterCustomProductPageId: options.customProductPageId,
        limit: 1,
      },
      creds
    );

    if (versionsResponse.data.length === 0) {
      throw new Error('No version found for custom product page');
    }

    const version = versionsResponse.data[0];

    // Create localization
    const localization = await createCustomProductPageLocalization(
      {
        customProductPageVersionId: version.id,
        locale: options.locale,
        promotionalText: options.promotionalText,
      },
      creds
    );

    return {
      success: true,
      localization,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * List all custom product pages for an app
 *
 * @param appId - The app ID
 * @param credentials - Optional ASC credentials
 * @returns Array of custom product pages
 */
export async function listCustomProductPagesForApp(
  appId: string,
  credentials?: ASCCredentials
): Promise<AppCustomProductPage[]> {
  const creds = credentials || (await getDefaultCredentials());
  if (!creds) throw new Error('No ASC credentials found');

  const response = await listCustomProductPages(
    {
      filterAppId: appId,
      include: ['appCustomProductPageVersions'],
    },
    creds
  );

  return response.data;
}
