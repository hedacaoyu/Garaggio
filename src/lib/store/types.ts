import type { PlayerState, ShowcaseBoardId } from '@/lib/game/types'

export type StoreMode = 'supabase' | 'local'

export type Session = {
  userId: string
  email?: string
  mode: StoreMode
}

export type LeaderRow = {
  rank: number
  username: string
  carLabel: string
  color: string
  score: number
  isYou: boolean
}

/**
 * One interface, two backings. Supabase is the real one; the local backing
 * keeps the whole game playable before a project is wired up, and is what
 * "play without an account" uses.
 */
export interface Store {
  readonly mode: StoreMode
  getSession(): Promise<Session | null>
  signUp(email: string, password: string): Promise<{ session: Session | null; needsConfirm: boolean }>
  signIn(email: string, password: string): Promise<Session>
  signOut(): Promise<void>
  loadPlayer(session: Session): Promise<PlayerState | null>
  savePlayer(session: Session, state: PlayerState): Promise<void>
  isUsernameTaken(username: string): Promise<boolean>
  /** A VIN belongs to one account only. */
  isVinClaimed(vin: string, byUserId: string): Promise<boolean>
  leaderboard(board: ShowcaseBoardId, session: Session, state: PlayerState): Promise<LeaderRow[]>
  deleteAccount(session: Session): Promise<void>
}
