/**
 * APP-009: App Preview Upload API
 *
 * Service for managing app preview videos in App Store Connect API
 */

import { makeRequest, getDefaultCredentials } from './ascAuth';
import type { ASCCredentials } from '@/types/ascAuth';
import type {
  AppPreview,
  AppPreviewSet,
  AppPreviewResponse,
  AppPreviewSetResponse,
  AppPreviewSetsResponse,
  AppPreviewsResponse,
  CreatePreviewSetOptions,
  CreatePreviewOptions,
  UploadPreviewDataOptions,
  CommitPreviewOptions,
  DeletePreviewOptions,
  DeletePreviewSetOptions,
  ListPreviewSetsOptions,
  ListPreviewsOptions,
  PreviewInfo,
  PreviewSetInfo,
  UploadPreviewResult,
  BatchUploadPreviewResult,
  PreviewDisplayType,
} from '@/types/ascPreviews';
import { readFile } from 'fs/promises';
import { createHash } from 'crypto';

/**
 * Create a new preview set for a specific device type
 */
export async function createPreviewSet(
  options: CreatePreviewSetOptions,
  credentials?: ASCCredentials
): Promise<AppPreviewSet> {
  const creds = credentials || (await getDefaultCredentials());

  const response = await makeRequest<AppPreviewSetResponse>(creds, {
    method: 'POST',
    path: '/v1/appPreviewSets',
    body: {
      data: {
        type: 'appPreviewSets',
        attributes: {
          previewType: options.previewType,
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
 * Get a preview set by ID
 */
export async function getPreviewSet(
  previewSetId: string,
  credentials?: ASCCredentials
): Promise<AppPreviewSet> {
  const creds = credentials || (await getDefaultCredentials());

  const response = await makeRequest<AppPreviewSetResponse>(creds, {
    method: 'GET',
    path: `/v1/appPreviewSets/${previewSetId}`,
    query: {
      include: 'appPreviews',
    },
  });

  return response.data;
}

/**
 * List all preview sets for a localization
 */
export async function listPreviewSets(
  options: ListPreviewSetsOptions,
  credentials?: ASCCredentials
): Promise<AppPreviewSetsResponse> {
  const creds = credentials || (await getDefaultCredentials());

  const query: Record<string, string | number> = {
    'filter[appStoreVersionLocalization]': options.appStoreVersionLocalizationId,
  };

  if (options.filterPreviewType) {
    query['filter[previewType]'] = options.filterPreviewType;
  }

  if (options.include) {
    query.include = options.include.join(',');
  }

  if (options.limit) {
    query.limit = options.limit;
  }

  const response = await makeRequest<AppPreviewSetsResponse>(creds, {
    method: 'GET',
    path: '/v1/appPreviewSets',
    query,
  });

  return response;
}

/**
 * Delete a preview set
 */
export async function deletePreviewSet(
  options: DeletePreviewSetOptions,
  credentials?: ASCCredentials
): Promise<void> {
  const creds = credentials || (await getDefaultCredentials());

  await makeRequest(creds, {
    method: 'DELETE',
    path: `/v1/appPreviewSets/${options.previewSetId}`,
  });
}

/**
 * Create a preview (reserve slot before upload)
 */
export async function createPreview(
  options: CreatePreviewOptions,
  credentials?: ASCCredentials
): Promise<AppPreview> {
  const creds = credentials || (await getDefaultCredentials());

  const attributes: {
    fileName: string;
    fileSize: number;
    previewFrameTimeCode?: string;
    mimeType?: string;
  } = {
    fileName: options.fileName,
    fileSize: options.fileSize,
  };

  if (options.previewFrameTimeCode) {
    attributes.previewFrameTimeCode = options.previewFrameTimeCode;
  }

  if (options.mimeType) {
    attributes.mimeType = options.mimeType;
  }

  const response = await makeRequest<AppPreviewResponse>(creds, {
    method: 'POST',
    path: '/v1/appPreviews',
    body: {
      data: {
        type: 'appPreviews',
        attributes,
        relationships: {
          appPreviewSet: {
            data: {
              type: 'appPreviewSets',
              id: options.appPreviewSetId,
            },
          },
        },
      },
    },
  });

  return response.data;
}

/**
 * Get a preview by ID
 */
export async function getPreview(
  previewId: string,
  credentials?: ASCCredentials
): Promise<AppPreview> {
  const creds = credentials || (await getDefaultCredentials());

  const response = await makeRequest<AppPreviewResponse>(creds, {
    method: 'GET',
    path: `/v1/appPreviews/${previewId}`,
  });

  return response.data;
}

/**
 * List previews in a preview set
 */
export async function listPreviews(
  options: ListPreviewsOptions,
  credentials?: ASCCredentials
): Promise<AppPreviewsResponse> {
  const creds = credentials || (await getDefaultCredentials());

  const query: Record<string, string | number> = {
    'filter[appPreviewSet]': options.appPreviewSetId,
  };

  if (options.include) {
    query.include = options.include.join(',');
  }

  if (options.limit) {
    query.limit = options.limit;
  }

  const response = await makeRequest<AppPreviewsResponse>(creds, {
    method: 'GET',
    path: '/v1/appPreviews',
    query,
  });

  return response;
}

/**
 * Upload preview data to the reserved upload URL
 */
export async function uploadPreviewData(
  options: UploadPreviewDataOptions
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
      `Failed to upload preview data: ${response.status} ${response.statusText}\n${errorText}`
    );
  }
}

/**
 * Commit preview upload (mark as uploaded)
 */
export async function commitPreview(
  options: CommitPreviewOptions,
  credentials?: ASCCredentials
): Promise<AppPreview> {
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
      type: 'appPreviews',
      id: options.previewId,
      attributes: {
        uploaded: options.uploaded,
      },
    },
  };

  if (options.sourceFileChecksum) {
    body.data.attributes.sourceFileChecksum = options.sourceFileChecksum;
  }

  const response = await makeRequest<AppPreviewResponse>(creds, {
    method: 'PATCH',
    path: `/v1/appPreviews/${options.previewId}`,
    body,
  });

  return response.data;
}

/**
 * Delete a preview
 */
export async function deletePreview(
  options: DeletePreviewOptions,
  credentials?: ASCCredentials
): Promise<void> {
  const creds = credentials || (await getDefaultCredentials());

  await makeRequest(creds, {
    method: 'DELETE',
    path: `/v1/appPreviews/${options.previewId}`,
  });
}

/**
 * Calculate MD5 checksum of a buffer
 */
export function calculateChecksum(buffer: Buffer): string {
  return createHash('md5').update(buffer).digest('hex');
}

/**
 * Upload a preview (high-level function that handles the entire flow)
 */
export async function uploadPreview(
  options: CreatePreviewOptions,
  credentials?: ASCCredentials
): Promise<UploadPreviewResult> {
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

    // Step 1: Create preview (reserves slot and gets upload URL)
    const preview = await createPreview(options, creds);

    if (!preview.attributes.uploadOperations || preview.attributes.uploadOperations.length === 0) {
      return {
        success: false,
        previewId: preview.id,
        error: 'No upload operations returned from API',
      };
    }

    // Step 2: Upload the file data
    const uploadOp = preview.attributes.uploadOperations[0];
    await uploadPreviewData({
      previewId: preview.id,
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
    const committedPreview = await commitPreview(
      {
        previewId: preview.id,
        uploaded: true,
        sourceFileChecksum: checksum,
      },
      creds
    );

    // Return result
    return {
      success: true,
      previewId: committedPreview.id,
      preview: toPreviewInfo(committedPreview),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Upload multiple previews to a preview set
 */
export async function uploadPreviews(
  previewSetId: string,
  previews: Array<{
    fileName: string;
    fileSize: number;
    file: Buffer | string;
    previewFrameTimeCode?: string;
    mimeType?: string;
  }>,
  credentials?: ASCCredentials
): Promise<BatchUploadPreviewResult> {
  const results: UploadPreviewResult[] = [];
  let uploaded = 0;
  let failed = 0;

  for (const preview of previews) {
    const result = await uploadPreview(
      {
        appPreviewSetId: previewSetId,
        fileName: preview.fileName,
        fileSize: preview.fileSize,
        file: preview.file,
        previewFrameTimeCode: preview.previewFrameTimeCode,
        mimeType: preview.mimeType,
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

  // Get preview set info
  const creds = credentials || (await getDefaultCredentials());
  const previewSet = await getPreviewSet(previewSetId, creds);

  return {
    success: failed === 0,
    uploaded,
    failed,
    results,
    previewSet: toPreviewSetInfo(previewSet),
  };
}

/**
 * Replace all previews in a preview set
 */
export async function replacePreviews(
  previewSetId: string,
  previews: Array<{
    fileName: string;
    fileSize: number;
    file: Buffer | string;
    previewFrameTimeCode?: string;
    mimeType?: string;
  }>,
  credentials?: ASCCredentials
): Promise<BatchUploadPreviewResult> {
  const creds = credentials || (await getDefaultCredentials());

  // Step 1: Delete all existing previews
  const existingPreviews = await listPreviews({ appPreviewSetId: previewSetId }, creds);

  for (const preview of existingPreviews.data) {
    await deletePreview({ previewId: preview.id }, creds);
  }

  // Step 2: Upload new previews
  return await uploadPreviews(previewSetId, previews, creds);
}

/**
 * Get preview set with all previews
 */
export async function getPreviewSetInfo(
  previewSetId: string,
  credentials?: ASCCredentials
): Promise<PreviewSetInfo> {
  const creds = credentials || (await getDefaultCredentials());
  const previewSet = await getPreviewSet(previewSetId, creds);
  return toPreviewSetInfo(previewSet);
}

/**
 * Convert AppPreview to PreviewInfo
 */
export function toPreviewInfo(preview: AppPreview): PreviewInfo {
  const attrs = preview.attributes;
  const state = attrs.assetDeliveryState?.state?.toLowerCase() || 'awaiting_upload';

  return {
    id: preview.id,
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
    dimensions:
      attrs.videoAsset?.width && attrs.videoAsset?.height
        ? {
            width: attrs.videoAsset.width,
            height: attrs.videoAsset.height,
          }
        : undefined,
    duration: attrs.videoAsset?.duration,
    downloadUrl: attrs.videoAsset?.templateUrl,
    previewImageUrl: attrs.previewImage?.templateUrl,
  };
}

/**
 * Convert AppPreviewSet to PreviewSetInfo
 */
export function toPreviewSetInfo(previewSet: AppPreviewSet): PreviewSetInfo {
  const previews =
    previewSet.relationships?.appPreviews?.data?.map((p) =>
      toPreviewInfo({
        type: 'appPreviews',
        id: p.id,
        attributes: {},
      })
    ) || [];

  return {
    id: previewSet.id,
    displayType: previewSet.attributes.previewType,
    previewCount: previews.length,
    previews,
  };
}

/**
 * Find or create a preview set for a device type
 */
export async function findOrCreatePreviewSet(
  appStoreVersionLocalizationId: string,
  displayType: PreviewDisplayType,
  credentials?: ASCCredentials
): Promise<AppPreviewSet> {
  const creds = credentials || (await getDefaultCredentials());

  // Try to find existing preview set
  const existingSets = await listPreviewSets(
    {
      appStoreVersionLocalizationId,
      filterPreviewType: displayType,
    },
    creds
  );

  if (existingSets.data.length > 0) {
    return existingSets.data[0];
  }

  // Create new preview set
  return await createPreviewSet(
    {
      appStoreVersionLocalizationId,
      previewType: displayType,
    },
    creds
  );
}

/**
 * Get all preview sets for a localization
 */
export async function getAllPreviewSets(
  appStoreVersionLocalizationId: string,
  credentials?: ASCCredentials
): Promise<PreviewSetInfo[]> {
  const creds = credentials || (await getDefaultCredentials());

  const response = await listPreviewSets(
    {
      appStoreVersionLocalizationId,
      include: ['appPreviews'],
    },
    creds
  );

  return response.data.map(toPreviewSetInfo);
}

/**
 * Delete all previews in a preview set
 */
export async function clearPreviewSet(
  previewSetId: string,
  credentials?: ASCCredentials
): Promise<void> {
  const creds = credentials || (await getDefaultCredentials());

  const previews = await listPreviews({ appPreviewSetId: previewSetId }, creds);

  for (const preview of previews.data) {
    await deletePreview({ previewId: preview.id }, creds);
  }
}
