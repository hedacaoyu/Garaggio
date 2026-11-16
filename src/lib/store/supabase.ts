import { carName, catalogCar } from '@/lib/catalog/cars'
import type {
  Card,
  CardexEntry,
  CatalogCar,

  Profile,
  RaceResult,
  ShowcaseBoardId,
  ShowcaseEntry,
} from '@/lib/game/types'
import { currentWeekKey } from './rivals'
import { supabase } from './supabase-client'
import type { LeaderRow, Store } from './types'

type CardRow = {
  id: string
  owner: string
  catalog_car_id: string
  kind: Card['kind']
  source: Card['source']
  color: string
  acquired_at: string
  location: Card['location'] | null
  mods: Card['mods']
  tags: string[]
  vin: string | null
  ownership: Card['ownership'] | null
  stack_count: number
}

function cardFromRow(row: CardRow): Card {
  return {
    id: row.id,
    catalogCarId: row.catalog_car_id,
    kind: row.kind,
    source: row.source,
    color: row.color,
    acquiredAt: row.acquired_at,
    location: row.location ?? undefined,
    mods: row.mods,
    tags: row.tags ?? [],
    vin: row.vin ?? undefined,
    ownership: row.ownership ?? undefined,
    stackCount: row.stack_count,
  }
}

function cardToRow(card: Card, owner: string): CardRow {
  return {
    id: card.id,
    owner,
    catalog_car_id: card.catalogCarId,
    kind: card.kind,
    source: card.source,
    color: card.color,
    acquired_at: card.acquiredAt,
    location: card.location ?? null,
    mods: card.mods,
    tags: card.tags,
    vin: card.vin ?? null,
    ownership: card.ownership ?? null,
    stack_count: card.stackCount,
  }
}

export const supabaseStore: Store = {
  mode: 'supabase',

  async getSession() {
    const { data } = await supabase().auth.getSession()
    const user = data.session?.user
    return user ? { userId: user.id, email: user.email ?? undefined, mode: 'supabase' } : null
  },

  async signUp(email, password) {
    const { data, error } = await supabase().auth.signUp({ email, password })
    if (error) throw error
    const user = data.user
    // With email confirmation on, there is no session until the link is used.
    if (!data.session || !user) return { session: null, needsConfirm: true }
    return {
      session: { userId: user.id, email: user.email ?? undefined, mode: 'supabase' },
      needsConfirm: false,
    }
  },

  async signIn(email, password) {
    const { data, error } = await supabase().auth.signInWithPassword({ email, password })
    if (error) throw error
    return { userId: data.user.id, email: data.user.email ?? undefined, mode: 'supabase' }
  },

  async signOut() {
    await supabase().auth.signOut()
  },

  async loadPlayer(session) {
    const db = supabase()
    const { data: profileRow, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', session.userId)
      .maybeSingle()
    if (error) throw error
    if (!profileRow) return null

    const [cards, cardex, showcase, races, submissions] = await Promise.all([
      db.from('cards').select('*').eq('owner', session.userId),
      db.from('cardex').select('*').eq('owner', session.userId),
      db.from('showcase_entries').select('*').eq('owner', session.userId),
      db.from('race_results').select('*').eq('owner', session.userId).order('raced_at', { ascending: false }).limit(200),
      db.from('catalog_submissions').select('*').eq('created_by', session.userId),
    ])

    const profile: Profile = {
      id: profileRow.id,
      username: profileRow.username,
      avatar: profileRow.avatar ?? {},
      level: profileRow.level,
      xp: Number(profileRow.xp),
      octane: profileRow.octane,
      collectionCapacity: profileRow.collection_capacity,
      personalRideCardId: profileRow.personal_ride_card_id ?? undefined,
      premiumPass: profileRow.premium_pass,
      createdAt: profileRow.created_at,
    }

    return {
      profile,
      cards: (cards.data ?? []).map((r) => cardFromRow(r as CardRow)),
      cardex: (cardex.data ?? []).map(
        (r): CardexEntry => ({
          catalogCarId: r.catalog_car_id,
          firstCollectedAt: r.first_collected_at,
          timesCollected: r.times_collected,
          firstDiscovery: r.first_discovery,
        }),
      ),
      showcase: (showcase.data ?? []).map(
        (r): ShowcaseEntry => ({
          boardId: r.board_id as ShowcaseBoardId,
          cardId: r.card_id,
          score: r.score,
          submittedAt: r.submitted_at,
        }),
      ),
      races: (races.data ?? []).map(
        (r): RaceResult => ({
          id: r.id,
          cardId: r.card_id,
          eventId: r.event_id,
          playerEt: r.player_et,
          ghostEt: r.ghost_et,
          won: r.won,
          xpEarned: r.xp_earned,
          rewardLabel: r.reward_label ?? undefined,
          racedAt: r.raced_at,
        }),
      ),
      pendingCatalog: (submissions.data ?? []).map((r) => r.payload as CatalogCar),
    }
  },

  /**
   * v1 writes the whole player state. A player holds at most a few hundred
   * rows, so a full upsert plus a delete of anything no longer present is
   * simpler and safer than tracking deltas across the UI.
   */
  async savePlayer(session, state) {
    const db = supabase()
    const owner = session.userId

    const { error: profileError } = await db.from('profiles').upsert({
      id: owner,
      username: state.profile.username,
      avatar: state.profile.avatar,
      level: state.profile.level,
      xp: state.profile.xp,
      octane: state.profile.octane,
      collection_capacity: state.profile.collectionCapacity,
      personal_ride_card_id: state.profile.personalRideCardId ?? null,
      premium_pass: state.profile.premiumPass,
    })
    if (profileError) throw profileError

    if (state.cards.length > 0) {
      const { error } = await db.from('cards').upsert(state.cards.map((c) => cardToRow(c, owner)))
      if (error) throw error
    }
    const keepIds = state.cards.map((c) => c.id)
    const deleteCards = db.from('cards').delete().eq('owner', owner)
    const { error: delError } = keepIds.length
      ? await deleteCards.not('id', 'in', `(${keepIds.join(',')})`)
      : await deleteCards
    if (delError) throw delError

    if (state.cardex.length > 0) {
      const { error } = await db.from('cardex').upsert(
        state.cardex.map((e) => ({
          owner,
          catalog_car_id: e.catalogCarId,
          first_collected_at: e.firstCollectedAt,
          times_collected: e.timesCollected,
          first_discovery: e.firstDiscovery,
        })),
      )
      if (error) throw error
    }

    const week = currentWeekKey()
    if (state.showcase.length > 0) {
      const { error } = await db.from('showcase_entries').upsert(
        state.showcase.map((e) => ({
          owner,
          board_id: e.boardId,
          card_id: e.cardId,
          score: e.score,
          week_key: week,
          submitted_at: e.submittedAt,
        })),
      )
      if (error) throw error
    }
    const boards = state.showcase.map((e) => e.boardId)
    const deleteBoards = db.from('showcase_entries').delete().eq('owner', owner)
    const { error: boardDelError } = boards.length
      ? await deleteBoards.not('board_id', 'in', `(${boards.map((b) => `"${b}"`).join(',')})`)
      : await deleteBoards
    if (boardDelError) throw boardDelError

    if (state.races.length > 0) {
      const { error } = await db.from('race_results').upsert(
        state.races.map((r) => ({
          id: r.id,
          owner,
          card_id: r.cardId,
          event_id: r.eventId,
          player_et: r.playerEt,
          ghost_et: r.ghostEt,
          won: r.won,
          xp_earned: r.xpEarned,
          reward_label: r.rewardLabel ?? null,
          raced_at: r.racedAt,
        })),
        { ignoreDuplicates: true },
      )
      if (error) throw error
    }

    const vins = state.cards.filter((c) => c.vin).map((c) => ({ vin: c.vin!, owner }))
    if (vins.length > 0) {
      const { error } = await db.from('vin_claims').upsert(vins, { ignoreDuplicates: true })
      if (error) throw error
    }

    if (state.pendingCatalog.length > 0) {
      const { error } = await db.from('catalog_submissions').upsert(
        state.pendingCatalog.map((c) => ({ id: c.id, created_by: owner, payload: c, status: 'pending' })),
        { ignoreDuplicates: true },
      )
      if (error) throw error
    }
  },

  async isUsernameTaken(username) {
    const { data, error } = await supabase()
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .limit(1)
    if (error) throw error
    return (data?.length ?? 0) > 0
  },

  async isVinClaimed(vin, byUserId) {
    const { data, error } = await supabase().from('vin_claims').select('owner').eq('vin', vin).maybeSingle()
    if (error) throw error
    return Boolean(data) && data!.owner !== byUserId
  },

  async leaderboard(board, session, state) {
    const { data, error } = await supabase()
      .from('showcase_board')
      .select('username, catalog_car_id, color, score, owner')
      .eq('board_id', board)
      .eq('week_key', currentWeekKey())
      .order('score', { ascending: false })
      .limit(100)
    if (error) throw error

    const rows: LeaderRow[] = (data ?? []).map((r, i) => {
      const car = catalogCar(r.catalog_car_id)
      return {
        rank: i + 1,
        username: r.username,
        carLabel: car ? carName(car) : r.catalog_car_id,
        color: r.color,
        score: r.score,
        isYou: r.owner === session.userId,
      }
    })

    // A brand-new project has an empty board; show the player's own entry
    // rather than nothing at all.
    if (rows.length === 0 && state.showcase.some((e) => e.boardId === board)) {
      const entry = state.showcase.find((e) => e.boardId === board)!
      const card = state.cards.find((c) => c.id === entry.cardId)
      const car = card ? catalogCar(card.catalogCarId) : undefined
      rows.push({
        rank: 1,
        username: state.profile.username,
        carLabel: car ? carName(car) : '—',
        color: card?.color ?? '#888',
        score: entry.score,
        isYou: true,
      })
    }
    return rows
  },

  async deleteAccount(session) {
    // Cascades remove cards, CarDex, showcase entries and race history.
    const { error } = await supabase().from('profiles').delete().eq('id', session.userId)
    if (error) throw error
    await supabase().auth.signOut()
  },
}
