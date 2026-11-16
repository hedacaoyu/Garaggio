/**
 * Supabase is used when both public variables are present. Without them the
 * app falls back to local play so the game still runs.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
