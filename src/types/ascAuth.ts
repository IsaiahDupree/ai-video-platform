/**
 * APP-006: App Store Connect OAuth
 *
 * Type definitions for App Store Connect API authentication
 */

/**
 * App Store Connect API credentials
 */
export interface ASCCredentials {
  /** Issuer ID from App Store Connect API Keys page */
  issuerId: string;
  /** Key ID from App Store Connect API Keys page */
  keyId: string;
  /** Private key content (p8 file) */
  privateKey: string;
}

/**
 * JWT token payload for App Store Connect API
 */
export interface ASCTokenPayload {
  /** Issuer ID */
  iss: string;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp (max 20 minutes) */
  exp: number;
  /** Audience (always appstoreconnect-v1) */
  aud: string;
  /** Scope (optional) */
  scope?: string[];
}

/**
 * Generated JWT token with metadata
 */
export interface ASCToken {
  /** JWT token string */
  token: string;
  /** Expiration timestamp */
  expiresAt: number;
  /** Whether token is still valid */
  isValid: boolean;
}

/**
 * Configuration for ASC authentication
 */
export interface ASCAuthConfig {
  /** Credentials */
  credentials: ASCCredentials;
  /** Token expiration time in seconds (default: 1200, max: 1200) */
  tokenExpiration?: number;
  /** Base URL for App Store Connect API */
  baseUrl?: string;
}

/**
 * Stored credentials with metadata
 */
export interface StoredASCCredentials extends ASCCredentials {
  /** Unique identifier for these credentials */
  id: string;
  /** Display name for credentials */
  name: string;
  /** When credentials were created */
  createdAt: string;
  /** When credentials were last used */
  lastUsedAt?: string;
  /** Whether these are the default credentials */
  isDefault: boolean;
}

/**
 * API request options
 */
export interface ASCRequestOptions {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Request path (without base URL) */
  path: string;
  /** Query parameters */
  query?: Record<string, string | number | boolean>;
  /** Request body */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
}

/**
 * API response wrapper
 */
export interface ASCResponse<T = unknown> {
  /** Response data */
  data: T;
  /** Links for pagination */
  links?: {
    self?: string;
    next?: string;
    first?: string;
    related?: string;
  };
  /** Metadata */
  meta?: {
    paging?: {
      total: number;
      limit: number;
    };
  };
}

/**
 * API error response
 */
export interface ASCError {
  /** Error status code */
  status: string;
  /** Error code */
  code: string;
  /** Error title */
  title: string;
  /** Error detail */
  detail: string;
  /** Source of error */
  source?: {
    pointer?: string;
    parameter?: string;
  };
}

/**
 * API error response wrapper
 */
export interface ASCErrorResponse {
  /** Array of errors */
  errors: ASCError[];
}

/**
 * Token cache entry
 */
export interface TokenCacheEntry {
  /** Credentials ID */
  credentialsId: string;
  /** Cached token */
  token: string;
  /** Expiration timestamp */
  expiresAt: number;
}
