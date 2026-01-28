/**
 * APP-008: Screenshot Upload API
 *
 * Service for managing screenshots in App Store Connect API
 */

import { makeRequest, getDefaultCredentials } from './ascAuth';
import type { ASCCredentials } from '@/types/ascAuth';
import type {
  AppScreenshot,
  AppScreenshotSet,
  AppScreenshotResponse,
  AppScreenshotSetResponse,
  AppScreenshotSetsResponse,
  AppScreenshotsResponse,
  CreateScreenshotSetOptions,
  CreateScreenshotOptions,
  UploadScreenshotDataOptions,
  CommitScreenshotOptions,
  DeleteScreenshotOptions,
  DeleteScreenshotSetOptions,
  ListScreenshotSetsOptions,
  ListScreenshotsOptions,
  ScreenshotInfo,
  ScreenshotSetInfo,
  UploadScreenshotResult,
  BatchUploadResult,
  ScreenshotDisplayType,
} from '@/types/ascScreenshots';
import { readFile } from 'fs/promises';
import { createHash } from 'crypto';

/**
 * Create a new screenshot set for a specific device type
 */
export async function createScreenshotSet(
  options: CreateScreenshotSetOptions,
  credentials?: ASCCredentials
): Promise<AppScreenshotSet> {
  const creds = credentials || (await getDefaultCredentials());

  const response = await makeRequest<AppScreenshotSetResponse>(creds, {
    method: 'POST',
    path: '/v1/appScreenshotSets',
    body: {
      data: {
        type: 'appScreenshotSets',
        attributes: {
          screenshotDisplayType: options.screenshotDisplayType,
        },
        relationships: {
          appStoreVersionLocalization: {
            data: {
              type: 'appStoreVersionLocalizations',
              id: options.appStoreVersionLocalizationId,
            },
          },
        },
      },
    },
  });

  return response.data;
}

/**
 * Get a screenshot set by ID
 */
export async function getScreenshotSet(
  screenshotSetId: string,
  credentials?: ASCCredentials
): Promise<AppScreenshotSet> {
  const creds = credentials || (await getDefaultCredentials());

  const response = await makeRequest<AppScreenshotSetResponse>(creds, {
    method: 'GET',
    path: `/v1/appScreenshotSets/${screenshotSetId}`,
    query: {
      include: 'appScreenshots',
    },
  });

  return response.data;
}

/**
 * List all screenshot sets for a localization
 */
export async function listScreenshotSets(
  options: ListScreenshotSetsOptions,
  credentials?: ASCCredentials
): Promise<AppScreenshotSetsResponse> {
  const creds = credentials || (await getDefaultCredentials());

  const query: Record<string, string | number> = {
    'filter[appStoreVersionLocalization]': options.appStoreVersionLocalizationId,
  };

  if (options.filterScreenshotDisplayType) {
    query['filter[screenshotDisplayType]'] = options.filterScreenshotDisplayType;
  }

  if (options.include) {
    query.include = options.include.join(',');
  }

  if (options.limit) {
    query.limit = options.limit;
  }

  const response = await makeRequest<AppScreenshotSetsResponse>(creds, {
    method: 'GET',
    path: '/v1/appScreenshotSets',
    query,
  });

  return response;
}

/**
 * Delete a screenshot set
 */
export async function deleteScreenshotSet(
  options: DeleteScreenshotSetOptions,
  credentials?: ASCCredentials
): Promise<void> {
  const creds = credentials || (await getDefaultCredentials());

  await makeRequest(creds, {
    method: 'DELETE',
    path: `/v1/appScreenshotSets/${options.screenshotSetId}`,
  });
}

/**
 * Create a screenshot (reserve slot before upload)
 */
export async function createScreenshot(
  options: CreateScreenshotOptions,
  credentials?: ASCCredentials
): Promise<AppScreenshot> {
  const creds = credentials || (await getDefaultCredentials());

  const response = await makeRequest<AppScreenshotResponse>(creds, {
    method: 'POST',
    path: '/v1/appScreenshots',
    body: {
      data: {
        type: 'appScreenshots',
        attributes: {
          fileName: options.fileName,
          fileSize: options.fileSize,
        },
        relationships: {
          appScreenshotSet: {
            data: {
              type: 'appScreenshotSets',
              id: options.appScreenshotSetId,
            },
          },
        },
      },
    },
  });

  return response.data;
}

/**
 * Get a screenshot by ID
 */
export async function getScreenshot(
  screenshotId: string,
  credentials?: ASCCredentials
): Promise<AppScreenshot> {
  const creds = credentials || (await getDefaultCredentials());

  const response = await makeRequest<AppScreenshotResponse>(creds, {
    method: 'GET',
    path: `/v1/appScreenshots/${screenshotId}`,
  });

  return response.data;
}

/**
 * List screenshots in a screenshot set
 */
export async function listScreenshots(
  options: ListScreenshotsOptions,
  credentials?: ASCCredentials
): Promise<AppScreenshotsResponse> {
  const creds = credentials || (await getDefaultCredentials());

  const query: Record<string, string | number> = {
    'filter[appScreenshotSet]': options.appScreenshotSetId,
  };

  if (options.include) {
    query.include = options.include.join(',');
  }

  if (options.limit) {
    query.limit = options.limit;
  }

  const response = await makeRequest<AppScreenshotsResponse>(creds, {
    method: 'GET',
    path: '/v1/appScreenshots',
    query,
  });

  return response;
}

/**
 * Upload screenshot data to the reserved upload URL
 */
export async function uploadScreenshotData(
  options: UploadScreenshotDataOptions
): Promise<void> {
  const { uploadOperation, fileData } = options;

  // Build headers object from array
  const headers: Record<string, string> = {};
  uploadOperation.requestHeaders.forEach((header) => {
    headers[header.name] = header.value;
  });

  // Upload using native fetch
  const response = await fetch(uploadOperation.url, {
    method: uploadOperation.method,
    headers,
    body: fileData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to upload screenshot data: ${response.status} ${response.statusText}\n${errorText}`
    );
  }
}

/**
 * Commit screenshot upload (mark as uploaded)
 */
export async function commitScreenshot(
  options: CommitScreenshotOptions,
  credentials?: ASCCredentials
): Promise<AppScreenshot> {
  const creds = credentials || (await getDefaultCredentials());

  const body: {
    data: {
      type: string;
      id: string;
      attributes: {
        uploaded: boolean;
        sourceFileChecksum?: string;
      };
    };
  } = {
    data: {
      type: 'appScreenshots',
      id: options.screenshotId,
      attributes: {
        uploaded: options.uploaded,
      },
    },
  };

  if (options.sourceFileChecksum) {
    body.data.attributes.sourceFileChecksum = options.sourceFileChecksum;
  }

  const response = await makeRequest<AppScreenshotResponse>(creds, {
    method: 'PATCH',
    path: `/v1/appScreenshots/${options.screenshotId}`,
    body,
  });

  return response.data;
}

/**
 * Delete a screenshot
 */
export async function deleteScreenshot(
  options: DeleteScreenshotOptions,
  credentials?: ASCCredentials
): Promise<void> {
  const creds = credentials || (await getDefaultCredentials());

  await makeRequest(creds, {
    method: 'DELETE',
    path: `/v1/appScreenshots/${options.screenshotId}`,
  });
}

/**
 * Calculate MD5 checksum of a buffer
 */
export function calculateChecksum(buffer: Buffer): string {
  return createHash('md5').update(buffer).digest('hex');
}

/**
 * Upload a screenshot (high-level function that handles the entire flow)
 */
export async function uploadScreenshot(
  options: CreateScreenshotOptions,
  credentials?: ASCCredentials
): Promise<UploadScreenshotResult> {
  try {
    const creds = credentials || (await getDefaultCredentials());

    // Load file if path is provided
    let fileBuffer: Buffer;
    if (typeof options.file === 'string') {
      fileBuffer = await readFile(options.file);
    } else {
      fileBuffer = options.file;
    }

    // Verify file size matches
    if (fileBuffer.length !== options.fileSize) {
      return {
        success: false,
        error: `File size mismatch: expected ${options.fileSize}, got ${fileBuffer.length}`,
      };
    }

    // Calculate checksum
    const checksum = calculateChecksum(fileBuffer);

    // Step 1: Create screenshot (reserves slot and gets upload URL)
    const screenshot = await createScreenshot(options, creds);

    if (!screenshot.attributes.uploadOperations || screenshot.attributes.uploadOperations.length === 0) {
      return {
        success: false,
        screenshotId: screenshot.id,
        error: 'No upload operations returned from API',
      };
    }

    // Step 2: Upload the file data
    const uploadOp = screenshot.attributes.uploadOperations[0];
    await uploadScreenshotData({
      screenshotId: screenshot.id,
      uploadOperation: {
        method: uploadOp.method!,
        url: uploadOp.url!,
        requestHeaders: uploadOp.requestHeaders!,
        offset: uploadOp.offset,
        length: uploadOp.length,
      },
      fileData: fileBuffer,
    });

    // Step 3: Commit the upload
    const committedScreenshot = await commitScreenshot(
      {
        screenshotId: screenshot.id,
        uploaded: true,
        sourceFileChecksum: checksum,
      },
      creds
    );

    // Return result
    return {
      success: true,
      screenshotId: committedScreenshot.id,
      screenshot: toScreenshotInfo(committedScreenshot),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Upload multiple screenshots to a screenshot set
 */
export async function uploadScreenshots(
  screenshotSetId: string,
  screenshots: Array<{ fileName: string; fileSize: number; file: Buffer | string }>,
  credentials?: ASCCredentials
): Promise<BatchUploadResult> {
  const results: UploadScreenshotResult[] = [];
  let uploaded = 0;
  let failed = 0;

  for (const screenshot of screenshots) {
    const result = await uploadScreenshot(
      {
        appScreenshotSetId: screenshotSetId,
        fileName: screenshot.fileName,
        fileSize: screenshot.fileSize,
        file: screenshot.file,
      },
      credentials
    );

    results.push(result);

    if (result.success) {
      uploaded++;
    } else {
      failed++;
    }
  }

  // Get screenshot set info
  const creds = credentials || (await getDefaultCredentials());
  const screenshotSet = await getScreenshotSet(screenshotSetId, creds);

  return {
    success: failed === 0,
    uploaded,
    failed,
    results,
    screenshotSet: toScreenshotSetInfo(screenshotSet),
  };
}

/**
 * Replace all screenshots in a screenshot set
 */
export async function replaceScreenshots(
  screenshotSetId: string,
  screenshots: Array<{ fileName: string; fileSize: number; file: Buffer | string }>,
  credentials?: ASCCredentials
): Promise<BatchUploadResult> {
  const creds = credentials || (await getDefaultCredentials());

  // Step 1: Delete all existing screenshots
  const existingScreenshots = await listScreenshots(
    { appScreenshotSetId: screenshotSetId },
    creds
  );

  for (const screenshot of existingScreenshots.data) {
    await deleteScreenshot({ screenshotId: screenshot.id }, creds);
  }

  // Step 2: Upload new screenshots
  return await uploadScreenshots(screenshotSetId, screenshots, creds);
}

/**
 * Get screenshot set with all screenshots
 */
export async function getScreenshotSetInfo(
  screenshotSetId: string,
  credentials?: ASCCredentials
): Promise<ScreenshotSetInfo> {
  const creds = credentials || (await getDefaultCredentials());
  const screenshotSet = await getScreenshotSet(screenshotSetId, creds);
  return toScreenshotSetInfo(screenshotSet);
}

/**
 * Convert AppScreenshot to ScreenshotInfo
 */
export function toScreenshotInfo(screenshot: AppScreenshot): ScreenshotInfo {
  const attrs = screenshot.attributes;
  const state = attrs.assetDeliveryState?.state?.toLowerCase() || 'awaiting_upload';

  return {
    id: screenshot.id,
    fileName: attrs.fileName || 'unknown',
    fileSize: attrs.fileSize || 0,
    displayType: 'APP_IPHONE_67', // Default, should be from set
    state: (state === 'awaiting_upload'
      ? 'awaiting_upload'
      : state === 'upload_complete'
      ? 'upload_complete'
      : state === 'complete'
      ? 'complete'
      : 'failed') as 'awaiting_upload' | 'upload_complete' | 'complete' | 'failed',
    dimensions: attrs.imageAsset?.width && attrs.imageAsset?.height
      ? {
          width: attrs.imageAsset.width,
          height: attrs.imageAsset.height,
        }
      : undefined,
    downloadUrl: attrs.imageAsset?.templateUrl,
  };
}

/**
 * Convert AppScreenshotSet to ScreenshotSetInfo
 */
export function toScreenshotSetInfo(screenshotSet: AppScreenshotSet): ScreenshotSetInfo {
  const screenshots =
    screenshotSet.relationships?.appScreenshots?.data?.map((s) =>
      toScreenshotInfo({
        type: 'appScreenshots',
        id: s.id,
        attributes: {},
      })
    ) || [];

  return {
    id: screenshotSet.id,
    displayType: screenshotSet.attributes.screenshotDisplayType,
    screenshotCount: screenshots.length,
    screenshots,
  };
}

/**
 * Find or create a screenshot set for a device type
 */
export async function findOrCreateScreenshotSet(
  appStoreVersionLocalizationId: string,
  displayType: ScreenshotDisplayType,
  credentials?: ASCCredentials
): Promise<AppScreenshotSet> {
  const creds = credentials || (await getDefaultCredentials());

  // Try to find existing screenshot set
  const existingSets = await listScreenshotSets(
    {
      appStoreVersionLocalizationId,
      filterScreenshotDisplayType: displayType,
    },
    creds
  );

  if (existingSets.data.length > 0) {
    return existingSets.data[0];
  }

  // Create new screenshot set
  return await createScreenshotSet(
    {
      appStoreVersionLocalizationId,
      screenshotDisplayType: displayType,
    },
    creds
  );
}

/**
 * Get all screenshot sets for a localization
 */
export async function getAllScreenshotSets(
  appStoreVersionLocalizationId: string,
  credentials?: ASCCredentials
): Promise<ScreenshotSetInfo[]> {
  const creds = credentials || (await getDefaultCredentials());

  const response = await listScreenshotSets(
    {
      appStoreVersionLocalizationId,
      include: ['appScreenshots'],
    },
    creds
  );

  return response.data.map(toScreenshotSetInfo);
}

/**
 * Delete all screenshots in a screenshot set
 */
export async function clearScreenshotSet(
  screenshotSetId: string,
  credentials?: ASCCredentials
): Promise<void> {
  const creds = credentials || (await getDefaultCredentials());

  const screenshots = await listScreenshots({ appScreenshotSetId: screenshotSetId }, creds);

  for (const screenshot of screenshots.data) {
    await deleteScreenshot({ screenshotId: screenshot.id }, creds);
  }
}
