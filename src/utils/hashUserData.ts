/**
 * User Data Hashing Utility
 *
 * Provides consistent SHA256 hashing of PII data for Meta Pixel and CAPI.
 * Works in both browser and Node.js environments.
 *
 * Meta requires all PII (Personally Identifiable Information) to be hashed
 * with SHA256 before sending via Conversions API or Advanced Matching.
 *
 * PII Fields that should be hashed:
 * - em: email address
 * - ph: phone number
 * - fn: first name
 * - ln: last name
 * - ct: city
 * - st: state
 * - zp: zip/postal code
 * - country: country code
 * - ge: gender
 * - db: date of birth (YYYYMMDD format)
 *
 * Documentation:
 * https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
 */

/**
 * Hash a string value with SHA256
 * Works in both browser (SubtleCrypto) and Node.js (crypto module)
 *
 * @param value - The string value to hash
 * @returns Promise resolving to the SHA256 hash (lowercase hex)
 */
export async function hashValue(value: string): Promise<string> {
  if (!value) return '';

  // Normalize: lowercase and trim whitespace
  const normalized = value.toLowerCase().trim();

  // Browser environment - use SubtleCrypto
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  // Node.js environment - use crypto module
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(normalized).digest('hex');
    } catch (error) {
      console.error('Failed to load crypto module:', error);
      throw new Error('Hashing not available in this environment');
    }
  }

  throw new Error('No hashing method available');
}

/**
 * Hash a phone number according to Meta's requirements
 *
 * Phone numbers should be:
 * 1. In E.164 format (e.g., +14155551234)
 * 2. Or with country code and digits only (no spaces, dashes, etc.)
 *
 * @param phone - Phone number to hash
 * @returns Promise resolving to hashed phone number
 */
export async function hashPhone(phone: string): Promise<string> {
  if (!phone) return '';

  // Remove all non-digit characters except leading +
  let cleaned = phone.trim();
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.substring(1).replace(/\D/g, '');
  } else {
    cleaned = cleaned.replace(/\D/g, '');
  }

  return hashValue(cleaned);
}

/**
 * Hash an email address according to Meta's requirements
 *
 * Email addresses should be:
 * 1. Lowercase
 * 2. Trimmed of whitespace
 * 3. No special characters in local part (keep @ and .)
 *
 * @param email - Email address to hash
 * @returns Promise resolving to hashed email
 */
export async function hashEmail(email: string): Promise<string> {
  if (!email) return '';

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleaned = email.toLowerCase().trim();

  if (!emailRegex.test(cleaned)) {
    console.warn('Invalid email format:', email);
    return '';
  }

  return hashValue(cleaned);
}

/**
 * Hash a date of birth according to Meta's requirements
 *
 * Date of birth should be in YYYYMMDD format (e.g., 19900115)
 * Accepts various input formats and converts to YYYYMMDD
 *
 * @param dob - Date of birth (YYYY-MM-DD, YYYYMMDD, or Date object)
 * @returns Promise resolving to hashed date of birth
 */
export async function hashDateOfBirth(dob: string | Date): Promise<string> {
  if (!dob) return '';

  let formatted: string;

  if (dob instanceof Date) {
    // Use UTC to avoid timezone issues
    const year = dob.getUTCFullYear();
    const month = String(dob.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dob.getUTCDate()).padStart(2, '0');
    formatted = `${year}${month}${day}`;
  } else {
    // Remove dashes and spaces
    formatted = dob.replace(/[-\s]/g, '');

    // Validate YYYYMMDD format
    if (!/^\d{8}$/.test(formatted)) {
      console.warn('Invalid date of birth format (expected YYYYMMDD):', dob);
      return '';
    }
  }

  return hashValue(formatted);
}

/**
 * User data that can be hashed
 */
export interface UserDataToHash {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  gender?: 'm' | 'f';
  dateOfBirth?: string | Date;
}

/**
 * Hashed user data in Meta CAPI format
 */
export interface HashedUserData {
  em?: string;    // email
  ph?: string;    // phone
  fn?: string;    // first name
  ln?: string;    // last name
  ct?: string;    // city
  st?: string;    // state
  zp?: string;    // zip code
  country?: string;
  ge?: string;    // gender
  db?: string;    // date of birth
}

/**
 * Hash all user data fields
 *
 * Converts user-friendly field names to Meta's abbreviated format
 * and hashes all PII values with SHA256.
 *
 * @param userData - User data to hash
 * @returns Promise resolving to hashed user data in Meta CAPI format
 *
 * @example
 * const hashed = await hashUserData({
 *   email: 'user@example.com',
 *   phone: '+14155551234',
 *   firstName: 'John',
 *   lastName: 'Doe',
 * });
 * // Returns: { em: 'abc123...', ph: 'def456...', fn: 'xyz789...', ln: '...'}
 */
export async function hashUserData(userData: UserDataToHash): Promise<HashedUserData> {
  const hashed: HashedUserData = {};

  // Hash email
  if (userData.email) {
    hashed.em = await hashEmail(userData.email);
  }

  // Hash phone
  if (userData.phone) {
    hashed.ph = await hashPhone(userData.phone);
  }

  // Hash first name
  if (userData.firstName) {
    hashed.fn = await hashValue(userData.firstName);
  }

  // Hash last name
  if (userData.lastName) {
    hashed.ln = await hashValue(userData.lastName);
  }

  // Hash city
  if (userData.city) {
    hashed.ct = await hashValue(userData.city);
  }

  // Hash state
  if (userData.state) {
    hashed.st = await hashValue(userData.state);
  }

  // Hash zip code
  if (userData.zipCode) {
    hashed.zp = await hashValue(userData.zipCode);
  }

  // Hash country (should be 2-letter ISO country code)
  if (userData.country) {
    hashed.country = await hashValue(userData.country);
  }

  // Hash gender (should be 'm' or 'f')
  if (userData.gender) {
    hashed.ge = await hashValue(userData.gender);
  }

  // Hash date of birth
  if (userData.dateOfBirth) {
    hashed.db = await hashDateOfBirth(userData.dateOfBirth);
  }

  return hashed;
}

/**
 * Validate that a string is a valid SHA256 hash
 *
 * @param hash - String to validate
 * @returns True if valid SHA256 hash (64 hex characters)
 */
export function isValidSHA256Hash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Check if user data is already hashed
 *
 * Useful to avoid double-hashing data that's already been hashed
 *
 * @param userData - User data to check
 * @returns True if all present fields appear to be SHA256 hashes
 */
export function isUserDataHashed(userData: HashedUserData): boolean {
  const values = Object.values(userData).filter(v => typeof v === 'string' && v.length > 0);

  if (values.length === 0) return false;

  return values.every(value => isValidSHA256Hash(value as string));
}
