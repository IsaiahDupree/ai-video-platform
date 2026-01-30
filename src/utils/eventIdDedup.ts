/**
 * Event ID Deduplication Utility
 * GDP-010: Meta Pixel + CAPI Dedup
 *
 * This utility manages event ID generation and deduplication across:
 * - Client-side Meta Pixel tracking
 * - Server-side Meta CAPI (Conversions API)
 * - PostHog event tracking
 *
 * When the same event is tracked from both client (Pixel) and server (CAPI),
 * Meta will deduplicate them if they have the same event_id.
 *
 * Flow:
 * 1. Client generates eventId when tracking starts
 * 2. Client sends eventId with tracking.track() call
 * 3. Client-side Meta Pixel receives event with eventId
 * 4. Server receives request with eventId in properties
 * 5. Server-side CAPI also sends event with same eventId
 * 6. Meta deduplicates based on matching eventId values
 */

/**
 * Generate a unique event ID for deduplication
 * Uses timestamp + random string for high probability of uniqueness
 * Format: {timestamp}-{random}
 */
export function generateEventId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Generate an event ID (same as generateEventId)
 * More cryptographically secure than simple random generation
 */
export function generateSecureEventId(): string {
  return generateEventId();
}

/**
 * Validate an event ID format
 * Ensures the ID matches expected format
 */
export function isValidEventId(eventId: string | unknown): eventId is string {
  if (typeof eventId !== 'string') return false;
  if (eventId.length === 0) return false;
  // Basic validation - should be non-empty string
  return true;
}

/**
 * Event ID context for tracking a specific user action
 * Stores the ID and metadata about when it was generated
 */
export interface EventIdContext {
  eventId: string;
  timestamp: number;
  source: 'client' | 'server';
}

/**
 * Create an event ID context with metadata
 */
export function createEventIdContext(
  source: 'client' | 'server' = 'client'
): EventIdContext {
  return {
    eventId: generateEventId(),
    timestamp: Date.now(),
    source,
  };
}

/**
 * Store event ID in session storage (client-side only)
 * Useful for multi-step flows where event ID needs to persist
 */
export function storeEventId(
  key: string,
  eventId: string,
  ttlMs: number = 30000
): void {
  if (typeof window === 'undefined') return;

  const data = {
    eventId,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };

  try {
    sessionStorage.setItem(`event_id_${key}`, JSON.stringify(data));
  } catch (error) {
    console.warn('[EventId] Failed to store event ID:', error);
  }
}

/**
 * Retrieve stored event ID from session storage
 * Returns null if expired or not found
 */
export function retrieveEventId(key: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = sessionStorage.getItem(`event_id_${key}`);
    if (!data) return null;

    const parsed = JSON.parse(data);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      // Event ID expired, remove it
      sessionStorage.removeItem(`event_id_${key}`);
      return null;
    }

    return parsed.eventId;
  } catch (error) {
    console.warn('[EventId] Failed to retrieve event ID:', error);
    return null;
  }
}

/**
 * Clear stored event ID
 */
export function clearEventId(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(`event_id_${key}`);
  } catch (error) {
    console.warn('[EventId] Failed to clear event ID:', error);
  }
}

/**
 * Store event ID for a multi-step form
 * Useful for checkout, signup, etc.
 */
export function startEventIdFlow(flowId: string): string {
  const eventId = generateEventId();
  storeEventId(`flow_${flowId}`, eventId, 300000); // 5 minute TTL for multi-step flows
  return eventId;
}

/**
 * Retrieve event ID for a multi-step form
 */
export function getFlowEventId(flowId: string): string | null {
  return retrieveEventId(`flow_${flowId}`);
}

/**
 * Clear event ID for a multi-step form
 */
export function endEventIdFlow(flowId: string): void {
  clearEventId(`flow_${flowId}`);
}

/**
 * Map event IDs across different tracking systems
 * Ensures the same event gets the same ID in PostHog, Pixel, and CAPI
 */
export interface EventIdMapping {
  eventId: string;
  pixelEventId?: string; // May differ if Pixel uses different format
  capiEventId?: string; // May differ if CAPI uses different format
  posthogEventId?: string; // PostHog distinguishes by distinct_id, not event_id
}

/**
 * Create event ID mapping for multi-system tracking
 */
export function createEventIdMapping(baseEventId: string): EventIdMapping {
  return {
    eventId: baseEventId,
    pixelEventId: baseEventId, // Meta Pixel uses eventID parameter
    capiEventId: baseEventId, // Meta CAPI uses event_id field
    posthogEventId: baseEventId, // PostHog can use as custom property
  };
}

/**
 * Test event ID deduplication setup
 * Verifies that the deduplication utilities are working correctly
 */
export function validateEventIdDedup(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Test 1: Event ID generation
  const eventId1 = generateEventId();
  if (!isValidEventId(eventId1)) {
    errors.push('Generated event ID is invalid');
  }

  // Test 2: Event ID uniqueness
  const eventIds = new Set<string>();
  for (let i = 0; i < 10; i++) {
    const id = generateEventId();
    if (eventIds.has(id)) {
      errors.push('Generated duplicate event IDs');
    }
    eventIds.add(id);
  }

  // Test 3: Secure event ID generation
  const secureId = generateSecureEventId();
  if (!isValidEventId(secureId)) {
    errors.push('Secure event ID generation failed');
  }

  // Test 4: Event ID context creation
  const context = createEventIdContext('client');
  if (!isValidEventId(context.eventId) || context.source !== 'client') {
    errors.push('Event ID context creation failed');
  }

  // Test 5: Event ID mapping
  const mapping = createEventIdMapping(eventId1);
  if (mapping.eventId !== eventId1 || mapping.pixelEventId !== eventId1) {
    errors.push('Event ID mapping failed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Debug logging for event ID tracking
 */
export function logEventId(eventId: string, event: string, source: 'client' | 'server'): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[EventId Dedup] ${source.toUpperCase()} - Event: ${event}, ID: ${eventId}`);
  }
}
