/**
 * Cloud-only Remotion rendering.
 *
 * Browser-backed renders must never execute on this Mac: all local apps and
 * agents share the singleton Chrome bridge and Remotion cannot safely borrow
 * or replace it. Render-capable service paths therefore use the Modal endpoint
 * or fail closed when no matching cloud renderer exists.
 */

export const BROWSER_SINGLETON_POLICY_CODE = 'BROWSER_SINGLETON_POLICY';
export const DEFAULT_MODAL_REMOTION_RENDER_URL =
  'https://isaiahdupree33--remotion-render-endpoint.modal.run';

export class BrowserSingletonPolicyError extends Error {
  readonly code = BROWSER_SINGLETON_POLICY_CODE;

  constructor(operation: string, cloudAlternative?: string) {
    super(
      `${operation} is disabled on this Mac by the browser singleton policy. ` +
      'Local Remotion rendering would launch Chrome/Chromium or Chrome Headless Shell. ' +
      (cloudAlternative || 'Use an approved cloud renderer; no local browser fallback is permitted.')
    );
    this.name = 'BrowserSingletonPolicyError';
  }
}

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

function isForbiddenLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const private172 = normalized.match(/^172\.(\d{1,3})\./);
  return normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized === 'host.docker.internal' ||
    normalized === '0.0.0.0' ||
    normalized.startsWith('127.') ||
    normalized.startsWith('10.') ||
    normalized.startsWith('192.168.') ||
    normalized.startsWith('169.254.') ||
    (normalized.includes(':') && (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    )) ||
    (private172 !== null && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
}

function requireHttpsCloudUrl(value: string, label: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new BrowserSingletonPolicyError(
      label,
      `${label} must be a valid HTTPS cloud URL; local-process fallback is forbidden.`
    );
  }
  if (parsed.protocol !== 'https:' || isForbiddenLocalHostname(parsed.hostname)) {
    throw new BrowserSingletonPolicyError(
      label,
      `${label} must be an HTTPS cloud URL and cannot target this Mac/private network; local-process fallback is forbidden.`
    );
  }
  return parsed;
}

export async function renderCompositionCloud(
  request: CloudRenderRequest
): Promise<CloudRenderResult> {
  const endpoint = process.env.MODAL_REMOTION_RENDER_URL || DEFAULT_MODAL_REMOTION_RENDER_URL;
  const parsedEndpoint = requireHttpsCloudUrl(endpoint, 'MODAL_REMOTION_RENDER_URL');

  let response: Response;
  try {
    response = await fetch(parsedEndpoint, {
      method: 'POST',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
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
  requireHttpsCloudUrl(result.url, 'Modal render output URL');

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
