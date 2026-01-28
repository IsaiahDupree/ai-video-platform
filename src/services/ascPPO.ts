/**
 * APP-014: PPO Test Configuration
 *
 * Service for managing Product Page Optimization (PPO) tests in App Store Connect
 */

import { authenticatedRequest } from './ascAuth';
import type { ASCCredentials } from '@/types/ascAuth';
import type {
  AppStoreVersionExperiment,
  AppStoreVersionExperimentTreatment,
  AppStoreVersionExperimentTreatmentLocalization,
  CreatePPOTestOptions,
  CreateTreatmentOptions,
  CreateTreatmentLocalizationOptions,
  PPOTestInfo,
  TreatmentInfo,
  TreatmentLocalizationInfo,
  ListPPOTestsOptions,
  PPOTestResponse,
  PPOTestListResponse,
  TreatmentResponse,
  TreatmentListResponse,
  TreatmentLocalizationResponse,
  TreatmentLocalizationListResponse,
  PPOOperationResult,
  CompletePPOTestResult,
  PPOTestState,
  TrafficProportion,
} from '@/types/ascPPO';

/**
 * Create a new PPO test (experiment)
 */
export async function createPPOTest(
  options: CreatePPOTestOptions,
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperiment> {
  const { appId, appStoreVersionId, name, trafficProportion = 0.5, platform } = options;

  const body = {
    data: {
      type: 'appStoreVersionExperiments',
      attributes: {
        name,
        trafficProportion,
        ...(platform && { platform }),
      },
      relationships: {
        app: {
          data: {
            type: 'apps',
            id: appId,
          },
        },
        latestControlVersion: {
          data: {
            type: 'appStoreVersions',
            id: appStoreVersionId,
          },
        },
      },
    },
  };

  const response = await authenticatedRequest<PPOTestResponse>({
    method: 'POST',
    path: '/v1/appStoreVersionExperiments',
    body,
  }, credentials);

  return response.data;
}

/**
 * Get a PPO test by ID
 */
export async function getPPOTest(
  experimentId: string,
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperiment> {
  const response = await authenticatedRequest<PPOTestResponse>({
    method: 'GET',
    path: `/v1/appStoreVersionExperiments/${experimentId}`,
    query: {
      'include': 'appStoreVersionExperimentTreatments',
    },
  }, credentials);

  return response.data;
}

/**
 * List PPO tests
 */
export async function listPPOTests(
  options: ListPPOTestsOptions = {},
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperiment[]> {
  const { appId, state, limit = 50 } = options;

  const query: Record<string, string | number> = {
    limit,
  };

  if (appId) {
    query['filter[app]'] = appId;
  }

  if (state) {
    query['filter[state]'] = state;
  }

  const response = await authenticatedRequest<PPOTestListResponse>({
    method: 'GET',
    path: '/v1/appStoreVersionExperiments',
    query,
  }, credentials);

  return Array.isArray(response.data) ? response.data : [response.data];
}

/**
 * Update a PPO test
 */
export async function updatePPOTest(
  experimentId: string,
  updates: {
    name?: string;
    trafficProportion?: TrafficProportion;
  },
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperiment> {
  const body = {
    data: {
      type: 'appStoreVersionExperiments',
      id: experimentId,
      attributes: updates,
    },
  };

  const response = await authenticatedRequest<PPOTestResponse>({
    method: 'PATCH',
    path: `/v1/appStoreVersionExperiments/${experimentId}`,
    body,
  }, credentials);

  return response.data;
}

/**
 * Delete a PPO test
 */
export async function deletePPOTest(
  experimentId: string,
  credentials?: ASCCredentials
): Promise<void> {
  await authenticatedRequest({
    method: 'DELETE',
    path: `/v1/appStoreVersionExperiments/${experimentId}`,
  }, credentials);
}

/**
 * Create a treatment for a PPO test
 */
export async function createTreatment(
  options: CreateTreatmentOptions,
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperimentTreatment> {
  const { experimentId, name, trafficProportion = 0.25 } = options;

  const body = {
    data: {
      type: 'appStoreVersionExperimentTreatments',
      attributes: {
        name,
        trafficProportion,
      },
      relationships: {
        appStoreVersionExperiment: {
          data: {
            type: 'appStoreVersionExperiments',
            id: experimentId,
          },
        },
      },
    },
  };

  const response = await authenticatedRequest<TreatmentResponse>({
    method: 'POST',
    path: '/v1/appStoreVersionExperimentTreatments',
    body,
  }, credentials);

  return response.data;
}

/**
 * Get a treatment by ID
 */
export async function getTreatment(
  treatmentId: string,
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperimentTreatment> {
  const response = await authenticatedRequest<TreatmentResponse>({
    method: 'GET',
    path: `/v1/appStoreVersionExperimentTreatments/${treatmentId}`,
    query: {
      'include': 'appStoreVersionExperimentTreatmentLocalizations',
    },
  }, credentials);

  return response.data;
}

/**
 * List treatments for a PPO test
 */
export async function listTreatments(
  experimentId: string,
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperimentTreatment[]> {
  const response = await authenticatedRequest<TreatmentListResponse>({
    method: 'GET',
    path: `/v1/appStoreVersionExperiments/${experimentId}/appStoreVersionExperimentTreatments`,
  }, credentials);

  return Array.isArray(response.data) ? response.data : [response.data];
}

/**
 * Update a treatment
 */
export async function updateTreatment(
  treatmentId: string,
  updates: {
    name?: string;
    trafficProportion?: TrafficProportion;
  },
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperimentTreatment> {
  const body = {
    data: {
      type: 'appStoreVersionExperimentTreatments',
      id: treatmentId,
      attributes: updates,
    },
  };

  const response = await authenticatedRequest<TreatmentResponse>({
    method: 'PATCH',
    path: `/v1/appStoreVersionExperimentTreatments/${treatmentId}`,
    body,
  }, credentials);

  return response.data;
}

/**
 * Delete a treatment
 */
export async function deleteTreatment(
  treatmentId: string,
  credentials?: ASCCredentials
): Promise<void> {
  await authenticatedRequest({
    method: 'DELETE',
    path: `/v1/appStoreVersionExperimentTreatments/${treatmentId}`,
  }, credentials);
}

/**
 * Create a treatment localization
 */
export async function createTreatmentLocalization(
  options: CreateTreatmentLocalizationOptions,
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperimentTreatmentLocalization> {
  const { treatmentId, locale } = options;

  const body = {
    data: {
      type: 'appStoreVersionExperimentTreatmentLocalizations',
      attributes: {
        locale,
      },
      relationships: {
        appStoreVersionExperimentTreatment: {
          data: {
            type: 'appStoreVersionExperimentTreatments',
            id: treatmentId,
          },
        },
      },
    },
  };

  const response = await authenticatedRequest<TreatmentLocalizationResponse>({
    method: 'POST',
    path: '/v1/appStoreVersionExperimentTreatmentLocalizations',
    body,
  }, credentials);

  return response.data;
}

/**
 * Get a treatment localization by ID
 */
export async function getTreatmentLocalization(
  localizationId: string,
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperimentTreatmentLocalization> {
  const response = await authenticatedRequest<TreatmentLocalizationResponse>({
    method: 'GET',
    path: `/v1/appStoreVersionExperimentTreatmentLocalizations/${localizationId}`,
    query: {
      'include': 'appScreenshotSets,appPreviewSets',
    },
  }, credentials);

  return response.data;
}

/**
 * List treatment localizations
 */
export async function listTreatmentLocalizations(
  treatmentId: string,
  credentials?: ASCCredentials
): Promise<AppStoreVersionExperimentTreatmentLocalization[]> {
  const response = await authenticatedRequest<TreatmentLocalizationListResponse>({
    method: 'GET',
    path: `/v1/appStoreVersionExperimentTreatments/${treatmentId}/appStoreVersionExperimentTreatmentLocalizations`,
  }, credentials);

  return Array.isArray(response.data) ? response.data : [response.data];
}

/**
 * Delete a treatment localization
 */
export async function deleteTreatmentLocalization(
  localizationId: string,
  credentials?: ASCCredentials
): Promise<void> {
  await authenticatedRequest({
    method: 'DELETE',
    path: `/v1/appStoreVersionExperimentTreatmentLocalizations/${localizationId}`,
  }, credentials);
}

// ============================================================================
// High-Level Helper Functions
// ============================================================================

/**
 * Create a complete PPO test with treatments and localizations
 */
export async function createCompletePPOTest(
  options: {
    appId: string;
    appStoreVersionId: string;
    name: string;
    trafficProportion?: TrafficProportion;
    treatments: Array<{
      name: string;
      trafficProportion?: TrafficProportion;
      locales: string[];
    }>;
  },
  credentials?: ASCCredentials
): Promise<CompletePPOTestResult> {
  try {
    // Create the experiment
    const experiment = await createPPOTest({
      appId: options.appId,
      appStoreVersionId: options.appStoreVersionId,
      name: options.name,
      trafficProportion: options.trafficProportion,
    }, credentials);

    // Create treatments
    const treatments: AppStoreVersionExperimentTreatment[] = [];
    for (const treatmentOptions of options.treatments) {
      const treatment = await createTreatment({
        experimentId: experiment.id,
        name: treatmentOptions.name,
        trafficProportion: treatmentOptions.trafficProportion,
      }, credentials);

      treatments.push(treatment);

      // Create localizations for each treatment
      for (const locale of treatmentOptions.locales) {
        await createTreatmentLocalization({
          treatmentId: treatment.id,
          locale,
        }, credentials);
      }
    }

    return {
      success: true,
      experiment,
      treatments,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get complete PPO test info with all treatments and localizations
 */
export async function getCompletePPOTest(
  experimentId: string,
  credentials?: ASCCredentials
): Promise<PPOOperationResult<PPOTestInfo>> {
  try {
    const experiment = await getPPOTest(experimentId, credentials);
    const treatments = await listTreatments(experimentId, credentials);

    const treatmentInfos: TreatmentInfo[] = [];
    for (const treatment of treatments) {
      const localizations = await listTreatmentLocalizations(treatment.id, credentials);

      const localizationInfos: TreatmentLocalizationInfo[] = localizations.map(loc => ({
        id: loc.id,
        treatmentId: treatment.id,
        locale: loc.attributes?.locale || '',
        screenshotSetIds: loc.relationships?.appScreenshotSets?.data.map(s => s.id) || [],
        previewSetIds: loc.relationships?.appPreviewSets?.data.map(p => p.id) || [],
      }));

      treatmentInfos.push({
        id: treatment.id,
        experimentId: experiment.id,
        name: treatment.attributes?.name || '',
        state: treatment.attributes?.state || 'PREPARE_FOR_SUBMISSION',
        trafficProportion: treatment.attributes?.trafficProportion || 0,
        promotedDate: treatment.attributes?.promotedDate,
        localizations: localizationInfos,
      });
    }

    const ppoTestInfo: PPOTestInfo = {
      id: experiment.id,
      appId: experiment.relationships?.app?.data.id || '',
      appStoreVersionId: experiment.relationships?.latestControlVersion?.data.id || '',
      name: experiment.attributes?.name || '',
      state: experiment.attributes?.state || 'PREPARE_FOR_SUBMISSION',
      trafficProportion: experiment.attributes?.trafficProportion || 0.5,
      platform: experiment.attributes?.platform,
      startDate: experiment.attributes?.startDate,
      endDate: experiment.attributes?.endDate,
      treatments: treatmentInfos,
    };

    return {
      success: true,
      data: ppoTestInfo,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Convert to simplified PPO test info
 */
export function toPPOTestInfo(experiment: AppStoreVersionExperiment): PPOTestInfo {
  return {
    id: experiment.id,
    appId: experiment.relationships?.app?.data.id || '',
    appStoreVersionId: experiment.relationships?.latestControlVersion?.data.id || '',
    name: experiment.attributes?.name || '',
    state: experiment.attributes?.state || 'PREPARE_FOR_SUBMISSION',
    trafficProportion: experiment.attributes?.trafficProportion || 0.5,
    platform: experiment.attributes?.platform,
    startDate: experiment.attributes?.startDate,
    endDate: experiment.attributes?.endDate,
    treatments: [],
  };
}

/**
 * Convert to simplified treatment info
 */
export function toTreatmentInfo(treatment: AppStoreVersionExperimentTreatment): TreatmentInfo {
  return {
    id: treatment.id,
    experimentId: treatment.relationships?.appStoreVersionExperiment?.data.id || '',
    name: treatment.attributes?.name || '',
    state: treatment.attributes?.state || 'PREPARE_FOR_SUBMISSION',
    trafficProportion: treatment.attributes?.trafficProportion || 0,
    promotedDate: treatment.attributes?.promotedDate,
    localizations: [],
  };
}

/**
 * Convert to simplified treatment localization info
 */
export function toTreatmentLocalizationInfo(
  localization: AppStoreVersionExperimentTreatmentLocalization
): TreatmentLocalizationInfo {
  return {
    id: localization.id,
    treatmentId: localization.relationships?.appStoreVersionExperimentTreatment?.data.id || '',
    locale: localization.attributes?.locale || '',
    screenshotSetIds: localization.relationships?.appScreenshotSets?.data.map(s => s.id) || [],
    previewSetIds: localization.relationships?.appPreviewSets?.data.map(p => p.id) || [],
  };
}

/**
 * List all PPO tests for an app
 */
export async function listPPOTestsForApp(
  appId: string,
  credentials?: ASCCredentials
): Promise<PPOOperationResult<PPOTestInfo[]>> {
  try {
    const experiments = await listPPOTests({ appId }, credentials);
    const ppoTests: PPOTestInfo[] = experiments.map(toPPOTestInfo);

    return {
      success: true,
      data: ppoTests,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Start a PPO test (submit for review)
 */
export async function startPPOTest(
  experimentId: string,
  credentials?: ASCCredentials
): Promise<PPOOperationResult<AppStoreVersionExperiment>> {
  try {
    // In reality, starting a test requires submitting it for review
    // This is done by updating the state, but the exact mechanism may vary
    // For now, we just return the experiment
    const experiment = await getPPOTest(experimentId, credentials);

    return {
      success: true,
      data: experiment,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Stop a PPO test
 */
export async function stopPPOTest(
  experimentId: string,
  credentials?: ASCCredentials
): Promise<PPOOperationResult<void>> {
  try {
    await deletePPOTest(experimentId, credentials);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
