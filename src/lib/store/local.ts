import { carName, catalogCar } from '@/lib/catalog/cars'
import type { PlayerState, ShowcaseBoardId } from '@/lib/game/types'
import { currentWeekKey, rivalRows } from './rivals'
import type { LeaderRow, Session, Store } from './types'

const PLAYER_KEY = 'garaggio.player'
const SESSION_KEY = 'garaggio.session'

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, blocked site data). The game
    // keeps working for this session; it just will not be there next time.
  }
}

/** Browser-only backing: no server, no account, this device only. */
export const localStore: Store = {
  mode: 'local',

  async getSession() {
    return read<Session>(SESSION_KEY)
  },

  async signUp() {
    const session: Session = { userId: 'local-player', mode: 'local' }
    write(SESSION_KEY, session)
    return { session, needsConfirm: false }
  },

  async signIn() {
    const session: Session = { userId: 'local-player', mode: 'local' }
    write(SESSION_KEY, session)
    return session
  },

  async signOut() {
    try {
      window.localStorage.removeItem(SESSION_KEY)
    } catch {
      /* nothing to clear */
    }
  },

  async loadPlayer() {
    return read<PlayerState>(PLAYER_KEY)
  },

  async savePlayer(_session, state) {
    write(PLAYER_KEY, state)
  },

  async isUsernameTaken(username) {
    // No shared namespace offline; only block the handful of reserved names.
    return ['admin', 'garaggio', 'support'].includes(username.toLowerCase())
  },

  async isVinClaimed(vin) {
    const state = read<PlayerState>(PLAYER_KEY)
    return Boolean(state?.cards.some((c) => c.vin === vin))
  },

  async leaderboard(board, _session, state) {
    return buildBoard(board, state)
  },

  async deleteAccount() {
    try {
      window.localStorage.removeItem(PLAYER_KEY)
      window.localStorage.removeItem(SESSION_KEY)
    } catch {
      /* nothing to clear */
    }
  },
}

/** Merges the player's own entry into the generated rival rows and ranks them. */
export function buildBoard(board: ShowcaseBoardId, state: PlayerState): LeaderRow[] {
  const rows = rivalRows(board, currentWeekKey())
  const mine = state.showcase.find((e) => e.boardId === board)
  if (mine) {
    const card = state.cards.find((c) => c.id === mine.cardId)
    const car = card ? catalogCar(card.catalogCarId) : undefined
    rows.push({
      rank: 0,
      username: state.profile.username,
      carLabel: car ? carName(car) : '—',
      color: card?.color ?? '#888',
      score: mine.score,
      isYou: true,
    })
  }
  return rows
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
    .map((row, i) => ({ ...row, rank: i + 1 }))
}
