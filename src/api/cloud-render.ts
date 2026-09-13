/**
 * Optional authenticated Remotion rendering over HTTP(S).
 *
 * Local, private-network, Orion, and cloud render services are all supported.
 * Local CLI rendering is implemented independently by the normal render path.
 */

export const DEFAULT_MODAL_REMOTION_RENDER_URL =
  'https://isaiahdupree33--remotion-render-endpoint.modal.run';

export interface CloudRenderRequest {
  composition: string;
  inputProps?: Record<string, unknown>;
  quality?: 'preview' | 'production';
  outputFilename?: string;
  timeoutMs?: number;
}

export interface CloudRenderResult {
  url: string;
  filename?: string;
  composition?: string;
  quality?: string;
  file_size_mb?: number;
  render_time_sec?: number;
  [key: string]: unknown;
}

function safeOutputFilename(value?: string): string | undefined {
  if (!value) return undefined;
  const filename = value.split(/[\\/]/).pop()?.trim();
  return filename || undefined;
}

function requireRenderUrl(value: string, label: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid HTTP(S) URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${label} must use HTTP or HTTPS`);
  }
  return parsed;
}

function requireModalAuthToken(): string {
  const token = (
    process.env.MODAL_REMOTION_AUTH_TOKEN || process.env.WORKER_SECRET || ''
  ).trim();
  if (!token) {
    throw new Error(
      'MODAL_REMOTION_AUTH_TOKEN or WORKER_SECRET is required for cloud rendering'
    );
  }
  return token;
}

export async function renderCompositionCloud(
  request: CloudRenderRequest
): Promise<CloudRenderResult> {
  const endpoint = process.env.MODAL_REMOTION_RENDER_URL || DEFAULT_MODAL_REMOTION_RENDER_URL;
  const parsedEndpoint = requireRenderUrl(endpoint, 'MODAL_REMOTION_RENDER_URL');
  const authToken = requireModalAuthToken();

  let response: Response;
  try {
    response = await fetch(parsedEndpoint, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        composition: request.composition,
        input_props: request.inputProps || {},
        quality: request.quality || 'production',
        output_filename: safeOutputFilename(request.outputFilename),
      }),
      signal: AbortSignal.timeout(request.timeoutMs || 3_600_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Modal Remotion request failed: ${message}`);
  }

  const raw = await response.text();
  let result: Record<string, unknown>;
  try {
    result = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Modal Remotion returned non-JSON HTTP ${response.status}`);
  }

  if (!response.ok || result.error) {
    throw new Error(
      typeof result.error === 'string'
        ? result.error
        : `Modal Remotion returned HTTP ${response.status}`
    );
  }

  if (typeof result.url !== 'string') {
    throw new Error('Modal Remotion response is missing an HTTPS output URL');
  }
  requireRenderUrl(result.url, 'Modal render output URL');

  return result as CloudRenderResult;
}

export async function renderBriefCloud(
  brief: Record<string, unknown>,
  quality: 'preview' | 'production' = 'production',
  outputFilename?: string
): Promise<CloudRenderResult> {
  return renderCompositionCloud({
    composition: 'BriefComposition',
    // The deployed endpoint accepts a full ContentBrief directly here.
    inputProps: brief,
    quality,
    outputFilename,
  });
}

export function blockLocalBrowserRender(
  operation: string,
  cloudAlternative?: string
): any {
  throw new BrowserSingletonPolicyError(operation, cloudAlternative);
}
