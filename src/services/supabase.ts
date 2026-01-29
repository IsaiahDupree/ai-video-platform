/**
 * Supabase Client Service
 * GDP-001: Supabase Schema Setup
 *
 * This service provides a configured Supabase client for the Growth Data Plane.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl) {
  console.warn('SUPABASE_URL not configured');
}

if (!supabaseAnonKey && !supabaseServiceKey) {
  console.warn('SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY not configured');
}

/**
 * Client-side Supabase client (uses anon key)
 * Use this in browser environments
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * Server-side Supabase client (uses service key)
 * Use this in API routes and server-side code
 * Has elevated permissions to bypass RLS
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));
}

export default supabase;
