'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { catalogCar } from '@/lib/catalog/cars'
import { MAX_MOD_LEVEL, type RaceEvent, rollPartReward } from '@/lib/game/race'
import { applyXp, FIRST_DISCOVERY_XP, SCAN_XP, XP_MOD_INSTALL, XP_RACE_LOSS, XP_RACE_WIN } from '@/lib/game/progression'
import { CAPACITY_UPGRADE_COST, CAPACITY_UPGRADE_SIZE, collectionFull, scrapValue } from '@/lib/game/rules'
import { scoreFor } from '@/lib/game/showcase'
import type {
  Avatar,
  Card,
  CardMods,
  CatalogCar,
  PlayerState,
  RaceResult,
  ScanLocation,
  ShowcaseBoardId,
} from '@/lib/game/types'
import type { ScanResult } from '@/lib/game/recognition'
import { getStore, supabaseConfigured } from '@/lib/store'
import type { LeaderRow, Session, Store } from '@/lib/store/types'

const PREMIUM_PASS_COST = 500
const LOCAL_PREF_KEY = 'garaggio.preferLocal'

export type Status = 'loading' | 'signed-out' | 'needs-onboarding' | 'ready'

export type ScanOutcome = {
  catalogCar: CatalogCar
  color: string
  xp: number
  isNewModel: boolean
  firstDiscovery: boolean
  fellBackToBaseModel: boolean
  confidence: number
  collectionWasFull: boolean
  location?: ScanLocation
}

type NewCardInput = {
  catalogCarId: string
  color: string
  kind?: Card['kind']
  source?: Card['source']
  location?: ScanLocation
  vin?: string
  ownership?: Card['ownership']
}

type GameValue = {
  status: Status
  store: Store
  session: Session | null
  state: PlayerState | null
  error: string | null
  saving: boolean

  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsConfirm: boolean }>
  playLocally: () => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>

  createPlayer: (input: { username: string; avatar: Avatar; firstCar: NewCardInput }) => Promise<void>
  isUsernameTaken: (username: string) => Promise<boolean>

  resolveScan: (result: ScanResult, location?: ScanLocation) => ScanOutcome
  commitScan: (outcome: ScanOutcome) => Promise<void>
  addCard: (input: NewCardInput) => Card
  scrapCard: (cardId: string) => void
  mergeModel: (catalogCarId: string) => void
  setTags: (cardId: string, tags: string[]) => void
  setPersonalRide: (cardId: string) => void
  releaseGarageCar: (cardId: string) => void
  installMod: (cardId: string, part: keyof Pick<CardMods, 'turbo' | 'tune' | 'exhaust'>) => boolean
  recordRace: (input: Omit<RaceResult, 'id' | 'racedAt'> & { event: RaceEvent }) => RaceResult
  submitShowcase: (board: ShowcaseBoardId, cardId: string) => void
  withdrawShowcase: (board: ShowcaseBoardId) => void
  buyCapacity: () => boolean
  buyPremiumPass: () => boolean
  loadLeaderboard: (board: ShowcaseBoardId) => Promise<LeaderRow[]>
}

const GameContext = createContext<GameValue | null>(null)

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

function emptyMods(): CardMods {
  return { turbo: 0, tune: 0, exhaust: 0 }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [preferLocal, setPreferLocal] = useState(false)
  const [store, setStore] = useState<Store>(() => getStore(true))
  const [session, setSession] = useState<Session | null>(null)
  const [state, setState] = useState<PlayerState | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Skip the save that would otherwise fire for the state we just loaded.
  const dirty = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const wantsLocal = window.localStorage.getItem(LOCAL_PREF_KEY) === '1' || !supabaseConfigured
      const active = getStore(wantsLocal)
      if (cancelled) return
      setPreferLocal(wantsLocal)
      setStore(active)
      try {
        const s = await active.getSession()
        if (cancelled) return
        if (!s) {
          setStatus('signed-out')
          return
        }
        setSession(s)
        const player = await active.loadPlayer(s)
        if (cancelled) return
        setState(player)
        setStatus(player ? 'ready' : 'needs-onboarding')
      } catch (e) {
        if (!cancelled) {
          setError(messageOf(e))
          setStatus('signed-out')
        }
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  // Persist whenever the player state changes through an action.
  useEffect(() => {
    if (!dirty.current || !state || !session) return
    dirty.current = false
    let cancelled = false
    setSaving(true)
    store
      .savePlayer(session, state)
      .catch((e) => !cancelled && setError(messageOf(e)))
      .finally(() => !cancelled && setSaving(false))
    return () => {
      cancelled = true
    }
  }, [state, session, store])

  const mutate = useCallback((fn: (prev: PlayerState) => PlayerState) => {
    dirty.current = true
    setState((prev) => (prev ? fn(prev) : prev))
  }, [])

  // ------------------------------------------------------------- auth
  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null)
      const active = getStore(preferLocal)
      const s = await active.signIn(email, password)
      setStore(active)
      setSession(s)
      const player = await active.loadPlayer(s)
      setState(player)
      setStatus(player ? 'ready' : 'needs-onboarding')
    },
    [preferLocal],
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      setError(null)
      const active = getStore(preferLocal)
      const { session: s, needsConfirm } = await active.signUp(email, password)
      if (!s) return { needsConfirm }
      setStore(active)
      setSession(s)
      setState(null)
      setStatus('needs-onboarding')
      return { needsConfirm }
    },
    [preferLocal],
  )

  const playLocally = useCallback(async () => {
    window.localStorage.setItem(LOCAL_PREF_KEY, '1')
    const active = getStore(true)
    setPreferLocal(true)
    setStore(active)
    const s = await active.signIn('', '')
    setSession(s)
    const player = await active.loadPlayer(s)
    setState(player)
    setStatus(player ? 'ready' : 'needs-onboarding')
  }, [])

  const signOut = useCallback(async () => {
    await store.signOut()
    window.localStorage.removeItem(LOCAL_PREF_KEY)
    setSession(null)
    setState(null)
    setPreferLocal(!supabaseConfigured)
    setStore(getStore(!supabaseConfigured))
    setStatus('signed-out')
  }, [store])

  const deleteAccount = useCallback(async () => {
    if (!session) return
    await store.deleteAccount(session)
    window.localStorage.removeItem(LOCAL_PREF_KEY)
    setSession(null)
    setState(null)
    setStatus('signed-out')
  }, [session, store])

  // -------------------------------------------------------- onboarding
  const createPlayer = useCallback(
    async (input: { username: string; avatar: Avatar; firstCar: NewCardInput }) => {
      if (!session) throw new Error('No session')
      const now = new Date().toISOString()
      const card: Card = {
        id: uuid(),
        catalogCarId: input.firstCar.catalogCarId,
        kind: input.firstCar.kind ?? 'collection',
        source: input.firstCar.source ?? 'starter',
        color: input.firstCar.color,
        acquiredAt: now,
        location: input.firstCar.location,
        mods: emptyMods(),
        tags: [],
        vin: input.firstCar.vin,
        ownership: input.firstCar.ownership,
        stackCount: 1,
      }
      const fresh: PlayerState = {
        profile: {
          id: session.userId,
          username: input.username,
          avatar: input.avatar,
          level: 1,
          xp: 0,
          octane: 200,
          collectionCapacity: 150,
          personalRideCardId: card.id,
          premiumPass: false,
          createdAt: now,
        },
        cards: [card],
        cardex: [
          {
            catalogCarId: card.catalogCarId,
            firstCollectedAt: now,
            timesCollected: 1,
            firstDiscovery: false,
          },
        ],
        showcase: [],
        races: [],
        pendingCatalog: [],
      }
      await store.savePlayer(session, fresh)
      setState(fresh)
      setStatus('ready')
    },
    [session, store],
  )

  const isUsernameTaken = useCallback((u: string) => store.isUsernameTaken(u), [store])

  // ------------------------------------------------------------- scan
  const resolveScan = useCallback(
    (result: ScanResult, location?: ScanLocation): ScanOutcome => {
      const car = result.catalogCar
      const known = state?.cardex.some((e) => e.catalogCarId === car.id) ?? false
      const table = SCAN_XP[car.category]
      // First discovery is a world-first in the real game; offline there is no
      // world, so only a model missing from the catalog counts.
      const firstDiscovery = result.isNewToCatalog
      const xp = (known ? table.repeat : table.fresh) + (firstDiscovery ? FIRST_DISCOVERY_XP : 0)
      return {
        catalogCar: car,
        color: result.color,
        xp,
        isNewModel: !known,
        firstDiscovery,
        fellBackToBaseModel: result.fellBackToBaseModel,
        confidence: result.confidence,
        collectionWasFull: state ? collectionFull(state) : false,
        location,
      }
    },
    [state],
  )

  /**
   * A full Collection never blocks a scan: the XP and the CarDex entry land
   * either way, and only the card itself is held back.
   */
  const commitScan = useCallback(
    async (outcome: ScanOutcome) => {
      mutate((prev) => {
        const now = new Date().toISOString()
        const cards = [...prev.cards]
        if (!outcome.collectionWasFull) {
          cards.push({
            id: uuid(),
            catalogCarId: outcome.catalogCar.id,
            kind: 'collection',
            source: 'scan',
            color: outcome.color,
            acquiredAt: now,
            location: outcome.location,
            mods: emptyMods(),
            tags: [],
            stackCount: 1,
          })
        }
        const cardex = [...prev.cardex]
        const existing = cardex.findIndex((e) => e.catalogCarId === outcome.catalogCar.id)
        if (existing >= 0) {
          cardex[existing] = { ...cardex[existing], timesCollected: cardex[existing].timesCollected + 1 }
        } else {
          cardex.push({
            catalogCarId: outcome.catalogCar.id,
            firstCollectedAt: now,
            timesCollected: 1,
            firstDiscovery: outcome.firstDiscovery,
          })
        }
        const next: PlayerState = { ...prev, cards, cardex }
        const { profile } = applyXp(next, outcome.xp)
        return { ...next, profile }
      })
    },
    [mutate],
  )

  const addCard = useCallback(
    (input: NewCardInput): Card => {
      const card: Card = {
        id: uuid(),
        catalogCarId: input.catalogCarId,
        kind: input.kind ?? 'collection',
        source: input.source ?? 'scan',
        color: input.color,
        acquiredAt: new Date().toISOString(),
        location: input.kind === 'garage' ? undefined : input.location,
        mods: emptyMods(),
        tags: [],
        vin: input.vin,
        ownership: input.ownership,
        stackCount: 1,
      }
      mutate((prev) => {
        const cardex = [...prev.cardex]
        const i = cardex.findIndex((e) => e.catalogCarId === card.catalogCarId)
        if (i >= 0) cardex[i] = { ...cardex[i], timesCollected: cardex[i].timesCollected + 1 }
        else
          cardex.push({
            catalogCarId: card.catalogCarId,
            firstCollectedAt: card.acquiredAt,
            timesCollected: 1,
            firstDiscovery: false,
          })
        return { ...prev, cards: [...prev.cards, card], cardex }
      })
      return card
    },
    [mutate],
  )

  // ------------------------------------------------------- collection
  const scrapCard = useCallback(
    (cardId: string) => {
      mutate((prev) => {
        const card = prev.cards.find((c) => c.id === cardId)
        if (!card) return prev
        const payout = scrapValue(card)
        // Scrapping a stack removes one car from it, not the whole stack.
        const cards =
          card.stackCount > 1
            ? prev.cards.map((c) => (c.id === cardId ? { ...c, stackCount: c.stackCount - 1 } : c))
            : prev.cards.filter((c) => c.id !== cardId)
        const personalRideCardId =
          prev.profile.personalRideCardId === cardId && card.stackCount <= 1
            ? cards[0]?.id
            : prev.profile.personalRideCardId
        return {
          ...prev,
          cards,
          showcase: prev.showcase.filter((e) => e.cardId !== cardId || card.stackCount > 1),
          profile: { ...prev.profile, octane: prev.profile.octane + payout, personalRideCardId },
        }
      })
    },
    [mutate],
  )

  const mergeModel = useCallback(
    (catalogCarId: string) => {
      mutate((prev) => {
        const group = prev.cards.filter((c) => c.kind === 'collection' && c.catalogCarId === catalogCarId)
        if (group.length < 2) return prev
        const keep = group[0]
        const total = group.reduce((n, c) => n + c.stackCount, 0)
        const removed = new Set(group.slice(1).map((c) => c.id))
        const cards = prev.cards
          .filter((c) => !removed.has(c.id))
          .map((c) => (c.id === keep.id ? { ...c, stackCount: total } : c))
        const personalRideCardId = removed.has(prev.profile.personalRideCardId ?? '')
          ? keep.id
          : prev.profile.personalRideCardId
        return {
          ...prev,
          cards,
          showcase: prev.showcase.map((e) => (removed.has(e.cardId) ? { ...e, cardId: keep.id } : e)),
          profile: { ...prev.profile, personalRideCardId },
        }
      })
    },
    [mutate],
  )

  const setTags = useCallback(
    (cardId: string, tags: string[]) => {
      mutate((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? { ...c, tags } : c)),
      }))
    },
    [mutate],
  )

  const setPersonalRide = useCallback(
    (cardId: string) => {
      mutate((prev) => ({ ...prev, profile: { ...prev.profile, personalRideCardId: cardId } }))
    },
    [mutate],
  )

  const releaseGarageCar = useCallback(
    (cardId: string) => {
      mutate((prev) => ({
        ...prev,
        cards: prev.cards.filter((c) => c.id !== cardId),
        showcase: prev.showcase.filter((e) => e.cardId !== cardId),
      }))
    },
    [mutate],
  )

  const installMod = useCallback(
    (cardId: string, part: keyof Pick<CardMods, 'turbo' | 'tune' | 'exhaust'>) => {
      let applied = false
      mutate((prev) => {
        const card = prev.cards.find((c) => c.id === cardId)
        if (!card || card.mods[part] >= MAX_MOD_LEVEL) return prev
        applied = true
        const cards = prev.cards.map((c) =>
          c.id === cardId ? { ...c, mods: { ...c.mods, [part]: c.mods[part] + 1 } } : c,
        )
        const next = { ...prev, cards }
        const { profile } = applyXp(next, XP_MOD_INSTALL)
        return { ...next, profile }
      })
      return applied
    },
    [mutate],
  )

  // ------------------------------------------------------------- race
  const recordRace = useCallback(
    (input: Omit<RaceResult, 'id' | 'racedAt'> & { event: RaceEvent }) => {
      const result: RaceResult = {
        id: uuid(),
        cardId: input.cardId,
        eventId: input.eventId,
        playerEt: input.playerEt,
        ghostEt: input.ghostEt,
        won: input.won,
        xpEarned: input.won ? XP_RACE_WIN : XP_RACE_LOSS,
        rewardLabel: input.rewardLabel,
        racedAt: new Date().toISOString(),
      }
      mutate((prev) => {
        const reward = rollPartReward(result.won, prev.profile.premiumPass)
        let cards = prev.cards
        if (reward.part) {
          cards = prev.cards.map((c) =>
            c.id === result.cardId && c.mods[reward.part!] < MAX_MOD_LEVEL
              ? { ...c, mods: { ...c.mods, [reward.part!]: c.mods[reward.part!] + 1 } }
              : c,
          )
          result.rewardLabel = reward.part
        }
        const octane = prev.profile.octane + (result.won ? input.event.octaneReward : 0)
        const next: PlayerState = { ...prev, cards, races: [result, ...prev.races].slice(0, 200) }
        const { profile } = applyXp({ ...next, profile: { ...next.profile, octane } }, result.xpEarned)
        return { ...next, profile }
      })
      return result
    },
    [mutate],
  )

  // --------------------------------------------------------- showcase
  const submitShowcase = useCallback(
    (board: ShowcaseBoardId, cardId: string) => {
      mutate((prev) => {
        const card = prev.cards.find((c) => c.id === cardId)
        if (!card) return prev
        const entry = {
          boardId: board,
          cardId,
          score: scoreFor(board, card, prev),
          submittedAt: new Date().toISOString(),
        }
        return { ...prev, showcase: [...prev.showcase.filter((e) => e.boardId !== board), entry] }
      })
    },
    [mutate],
  )

  const withdrawShowcase = useCallback(
    (board: ShowcaseBoardId) => {
      mutate((prev) => ({ ...prev, showcase: prev.showcase.filter((e) => e.boardId !== board) }))
    },
    [mutate],
  )

  // ------------------------------------------------------------- shop
  const buyCapacity = useCallback(() => {
    let ok = false
    mutate((prev) => {
      if (prev.profile.octane < CAPACITY_UPGRADE_COST) return prev
      ok = true
      return {
        ...prev,
        profile: {
          ...prev.profile,
          octane: prev.profile.octane - CAPACITY_UPGRADE_COST,
          collectionCapacity: prev.profile.collectionCapacity + CAPACITY_UPGRADE_SIZE,
        },
      }
    })
    return ok
  }, [mutate])

  const buyPremiumPass = useCallback(() => {
    let ok = false
    mutate((prev) => {
      if (prev.profile.premiumPass || prev.profile.octane < PREMIUM_PASS_COST) return prev
      ok = true
      return {
        ...prev,
        profile: { ...prev.profile, octane: prev.profile.octane - PREMIUM_PASS_COST, premiumPass: true },
      }
    })
    return ok
  }, [mutate])

  const loadLeaderboard = useCallback(
    async (board: ShowcaseBoardId) => {
      if (!session || !state) return []
      return store.leaderboard(board, session, state)
    },
    [session, state, store],
  )

  const value = useMemo<GameValue>(
    () => ({
      status, store, session, state, error, saving,
      signIn, signUp, playLocally, signOut, deleteAccount,
      createPlayer, isUsernameTaken,
      resolveScan, commitScan, addCard,
      scrapCard, mergeModel, setTags, setPersonalRide, releaseGarageCar, installMod,
      recordRace, submitShowcase, withdrawShowcase,
      buyCapacity, buyPremiumPass, loadLeaderboard,
    }),
    [
      status, store, session, state, error, saving,
      signIn, signUp, playLocally, signOut, deleteAccount,
      createPlayer, isUsernameTaken,
      resolveScan, commitScan, addCard,
      scrapCard, mergeModel, setTags, setPersonalRide, releaseGarageCar, installMod,
      recordRace, submitShowcase, withdrawShowcase,
      buyCapacity, buyPremiumPass, loadLeaderboard,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}

/** For screens that only render once a player exists. */
export function usePlayer(): { state: PlayerState; game: GameValue } {
  const game = useGame()
  if (!game.state) throw new Error('usePlayer used before the player loaded')
  return { state: game.state, game }
}

export function cardLabel(card: Card): string {
  const car = catalogCar(card.catalogCarId)
  return car ? [car.make, car.model, car.trim].filter(Boolean).join(' ') : card.catalogCarId
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
