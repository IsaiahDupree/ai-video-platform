/**
 * SEC-002: Input Sanitization
 * Sanitize all user-provided text in briefs to prevent XSS in rendered output
 */

/**
 * HTML entities that need to be escaped
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

/**
 * Regex to match any character that needs to be escaped
 */
const UNSAFE_CHARS_REGEX = /[&<>"'\/]/g;

/**
 * Sanitize a string by escaping HTML special characters
 * @param input - The input string to sanitize
 * @returns The sanitized string safe for use in HTML context
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input.replace(UNSAFE_CHARS_REGEX, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize text input for video captions/titles (allows some formatting)
 * Removes potentially dangerous characters while preserving readability
 * @param input - The input string to sanitize
 * @returns The sanitized string
 */
export function sanitizeTextForVideo(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Limit consecutive whitespace
  sanitized = sanitized.replace(/\s\s+/g, ' ');

  // Remove potentially dangerous HTML/script patterns
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  return sanitized;
}

/**
 * Sanitize URL strings
 * Only allows http://, https://, and mailto: protocols
 * @param input - The input URL to sanitize
 * @returns The sanitized URL or empty string if invalid
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  const trimmed = input.trim();

  // Check for safe protocols
  const safeProtocols = ['http://', 'https://', 'mailto:', '/'];

  // Check if URL starts with a safe protocol
  const isSafe = safeProtocols.some((protocol) => trimmed.toLowerCase().startsWith(protocol));

  if (!isSafe && !trimmed.startsWith('#')) {
    // Not a safe protocol - return empty string
    return '';
  }

  // Encode special characters
  try {
    // For http/https, validate as URL
    if (
      trimmed.toLowerCase().startsWith('http://') ||
      trimmed.toLowerCase().startsWith('https://')
    ) {
      const url = new URL(trimmed);
      return url.toString();
    }

    // For relative URLs and mailto, just escape HTML entities
    return sanitizeString(trimmed);
  } catch {
    // Invalid URL format
    return '';
  }
}

/**
 * Sanitize an entire ContentBrief object recursively
 * @param brief - The brief object to sanitize
 * @returns A new sanitized brief object
 */
export function sanitizeBrief(brief: any): any {
  if (brief === null || brief === undefined) {
    return brief;
  }

  if (typeof brief === 'string') {
    return sanitizeString(brief);
  }

  if (Array.isArray(brief)) {
    return brief.map((item) => sanitizeBrief(item));
  }

  if (typeof brief === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(brief)) {
      // Sanitize string values
      if (typeof value === 'string') {
        // Special handling for specific fields
        if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
          sanitized[key] = sanitizeUrl(value);
        } else if (
          key === 'heading' ||
          key === 'title' ||
          key === 'body' ||
          key === 'voiceover' ||
          key === 'caption'
        ) {
          sanitized[key] = sanitizeTextForVideo(value);
        } else {
          sanitized[key] = sanitizeString(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects and arrays
        sanitized[key] = sanitizeBrief(value);
      } else {
        // Keep other types as-is (numbers, booleans, etc.)
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return brief;
}

/**
 * Validate and sanitize a complete content brief
 * @param brief - The brief to validate and sanitize
 * @returns Object with validation and sanitization results
 */
export function validateAndSanitizeBrief(brief: any): {
  valid: boolean;
  sanitized: any;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (typeof brief !== 'object' || brief === null) {
    return {
      valid: false,
      sanitized: null,
      warnings: ['Brief must be an object'],
    };
  }

  try {
    const sanitized = sanitizeBrief(brief);

    // Check for data loss during sanitization
    const briefStr = JSON.stringify(brief);
    const sanitizedStr = JSON.stringify(sanitized);

    if (briefStr !== sanitizedStr) {
      warnings.push('Some input values were modified during sanitization to remove potentially unsafe content');
    }

    return {
      valid: true,
      sanitized,
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      sanitized: null,
      warnings: [
        `Error during sanitization: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}
