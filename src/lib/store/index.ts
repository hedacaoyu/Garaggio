import { supabaseConfigured } from './env'
import { localStore } from './local'
import { supabaseStore } from './supabase'
import type { Store } from './types'

/**
 * Supabase when the project is configured, otherwise local play. The rest of
 * the app never branches on this.
 */
export function getStore(preferLocal = false): Store {
  if (preferLocal || !supabaseConfigured) return localStore
  return supabaseStore
}

export { localStore, supabaseStore, supabaseConfigured }
export type { Store }
