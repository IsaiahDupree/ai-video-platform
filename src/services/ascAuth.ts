/**
 * APP-006: App Store Connect OAuth
 *
 * Authentication service for App Store Connect API using JWT
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  ASCCredentials,
  ASCTokenPayload,
  ASCToken,
  ASCAuthConfig,
  StoredASCCredentials,
  ASCRequestOptions,
  ASCResponse,
  ASCErrorResponse,
  TokenCacheEntry,
} from '@/types/ascAuth';

/**
 * Default App Store Connect API configuration
 */
const DEFAULT_CONFIG = {
  baseUrl: 'https://api.appstoreconnect.apple.com',
  tokenExpiration: 1200, // 20 minutes (max allowed by Apple)
  audience: 'appstoreconnect-v1',
  algorithm: 'ES256' as const,
};

/**
 * Data directory for stored credentials
 */
const DATA_DIR = path.join(process.cwd(), 'data', 'asc-credentials');

/**
 * In-memory token cache
 */
const tokenCache = new Map<string, TokenCacheEntry>();

/**
 * Generate a JWT token for App Store Connect API
 */
export function generateToken(credentials: ASCCredentials, expirationSeconds = 1200): ASCToken {
  // Validate expiration (max 20 minutes)
  const expiration = Math.min(expirationSeconds, 1200);

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + expiration;

  // Create JWT payload
  const payload: ASCTokenPayload = {
    iss: credentials.issuerId,
    iat: now,
    exp: expiresAt,
    aud: DEFAULT_CONFIG.audience,
  };

  // Create JWT header
  const header = {
    alg: DEFAULT_CONFIG.algorithm,
    kid: credentials.keyId,
    typ: 'JWT',
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Sign the token (ES256 uses ECDSA with P-256 curve and SHA-256)
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createSign('sha256')
    .update(signatureInput)
    .sign(credentials.privateKey, 'base64');

  const encodedSignature = base64UrlEncode(Buffer.from(signature, 'base64'));

  // Construct JWT
  const token = `${signatureInput}.${encodedSignature}`;

  return {
    token,
    expiresAt,
    isValid: true,
  };
}

/**
 * Get a valid token (from cache or generate new)
 */
export function getToken(credentials: ASCCredentials, credentialsId?: string): ASCToken {
  const id = credentialsId || 'default';

  // Check cache
  const cached = tokenCache.get(id);
  if (cached && cached.expiresAt > Date.now() / 1000 + 60) {
    // Token still valid for at least 1 more minute
    return {
      token: cached.token,
      expiresAt: cached.expiresAt,
      isValid: true,
    };
  }

  // Generate new token
  const newToken = generateToken(credentials);

  // Cache it
  tokenCache.set(id, {
    credentialsId: id,
    token: newToken.token,
    expiresAt: newToken.expiresAt,
  });

  return newToken;
}

/**
 * Validate JWT token structure and expiration
 */
export function validateToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

/**
 * Make authenticated request to App Store Connect API
 */
export async function makeRequest<T = unknown>(
  credentials: ASCCredentials,
  options: ASCRequestOptions,
  config?: Partial<ASCAuthConfig>
): Promise<ASCResponse<T>> {
  const baseUrl = config?.baseUrl || DEFAULT_CONFIG.baseUrl;
  const token = getToken(credentials);

  // Build URL
  const url = new URL(options.path, baseUrl);
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  // Build headers
  const headers: HeadersInit = {
    Authorization: `Bearer ${token.token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  // Make request
  const response = await fetch(url.toString(), {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Parse response
  const data = await response.json();

  // Check for errors
  if (!response.ok) {
    const errorResponse = data as ASCErrorResponse;
    const firstError = errorResponse.errors?.[0];
    throw new Error(
      `App Store Connect API error: ${firstError?.title || 'Unknown error'} - ${
        firstError?.detail || response.statusText
      }`
    );
  }

  return data as ASCResponse<T>;
}

/**
 * Save credentials to disk
 */
export async function saveCredentials(
  credentials: ASCCredentials,
  name: string,
  isDefault = false
): Promise<StoredASCCredentials> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const id = generateId();
  const stored: StoredASCCredentials = {
    ...credentials,
    id,
    name,
    createdAt: new Date().toISOString(),
    isDefault,
  };

  const filePath = path.join(DATA_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(stored, null, 2));

  return stored;
}

/**
 * Load credentials from disk
 */
export async function loadCredentials(id: string): Promise<StoredASCCredentials | null> {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * List all stored credentials
 */
export async function listCredentials(): Promise<StoredASCCredentials[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const files = await fs.readdir(DATA_DIR);

    const credentials: StoredASCCredentials[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
        credentials.push(JSON.parse(content));
      }
    }

    return credentials.sort((a, b) => {
      // Default first
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      // Then by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch {
    return [];
  }
}

/**
 * Get default credentials
 */
export async function getDefaultCredentials(): Promise<StoredASCCredentials | null> {
  const all = await listCredentials();
  return all.find((c) => c.isDefault) || all[0] || null;
}

/**
 * Delete credentials
 */
export async function deleteCredentials(id: string): Promise<void> {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  await fs.unlink(filePath);

  // Clear from cache
  tokenCache.delete(id);
}

/**
 * Update last used timestamp
 */
export async function updateLastUsed(id: string): Promise<void> {
  const creds = await loadCredentials(id);
  if (!creds) return;

  creds.lastUsedAt = new Date().toISOString();
  const filePath = path.join(DATA_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(creds, null, 2));
}

/**
 * Test credentials by making a simple API call
 */
export async function testCredentials(credentials: ASCCredentials): Promise<boolean> {
  try {
    // Try to list apps (should work with any valid credentials)
    await makeRequest(credentials, {
      method: 'GET',
      path: '/v1/apps',
      query: { limit: 1 },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear token cache (useful for testing or forcing refresh)
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string | Buffer): string {
  const base64 = Buffer.from(str).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  // Add padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `asc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
