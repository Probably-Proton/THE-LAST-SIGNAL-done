/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * THE LAST SIGNAL — SUPABASE BACKEND CLIENT (PHASE 1)
 * 
 * Centralized, singleton Supabase client initialization.
 * Reads publishable credentials from environment variables:
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_ANON_KEY
 * 
 * SECURITY RULES:
 * 1. NEVER use or import a service-role key or database password in browser code.
 * 2. Only the public/anon key with PostgreSQL Row-Level Security is permitted on the client.
 * 3. If credentials are missing or placeholders, this module safely falls back to local
 *    prototype mode so the application continues to run without crashing.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl =
  (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL?.trim() : undefined) ||
  (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_URL?.trim() : undefined);
const rawAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() : undefined) ||
  (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_ANON_KEY?.trim() : undefined);

// Verify whether credentials are valid and not default documentation placeholders
function checkIsConfigured(url?: string, key?: string): boolean {
  if (!url || !key) return false;
  if (url.includes('your-project-id') || key.includes('placeholder')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured: boolean = checkIsConfigured(rawUrl, rawAnonKey);

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  targetHost?: string;
  mode: 'live' | 'prototype';
}

/**
 * Returns sanitized connection status for development diagnosis without exposing credentials.
 */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  let targetHost: string | undefined = undefined;
  if (rawUrl) {
    try {
      targetHost = new URL(rawUrl).host;
    } catch {
      targetHost = 'malformed-url';
    }
  }

  return {
    isConfigured: isSupabaseConfigured,
    hasUrl: Boolean(rawUrl && !rawUrl.includes('your-project-id')),
    hasAnonKey: Boolean(rawAnonKey && !rawAnonKey.includes('placeholder')),
    targetHost,
    mode: isSupabaseConfigured ? 'live' : 'prototype',
  };
}

// Log diagnostic notice once in development mode
if (typeof window !== 'undefined') {
  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) {
    console.info(
      `[THE LAST SIGNAL] Supabase client: PROTOTYPE MODE ACTIVE.\n` +
      `Live environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are unset or placeholder.\n` +
      `Game progression and player accounts will persist through local storage (prototypeAuth.ts).`
    );
  } else {
    console.info(
      `[THE LAST SIGNAL] Supabase client: LIVE BACKEND CONNECTED (${status.targetHost}).`
    );
  }
}

/**
 * Singleton Supabase client.
 * Returns the authenticated client if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set,
 * or null if running in offline / prototype mode.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl!, rawAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Helper to retrieve the active client with an informative error if called when unconfigured.
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      '[THE LAST SIGNAL] Cannot invoke live Supabase operations: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not configured. Check .env / .env.example.'
    );
  }
  return supabase;
}

export default supabase;
