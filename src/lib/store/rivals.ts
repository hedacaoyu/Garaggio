import { CATALOG, carName, catalogCar } from '@/lib/catalog/cars'
import { quarterMileEt } from '@/lib/game/performance'
import type { Category, ShowcaseBoardId } from '@/lib/game/types'
import type { LeaderRow } from './types'

/**
 * Stand-in opponents. Leaderboards and ghost races need other players to feel
 * like anything at all, and a brand-new game has none. These are generated
 * from a fixed seed so a board looks the same from one visit to the next.
 */
const NAMES = [
  'apex_hunter', 'quarter_mile_kid', 'nocturne', 'redline_rae', 'vinbandit',
  'bay_area_bo', 'torque_tourist', 'slipstream', 'garage_gremlin', 'octanejunkie',
  'cold_start', 'one_more_pull', 'boost_leak', 'tyre_smoke', 'heel_and_toe',
  'carpark_crawler', 'launch_control', 'shift_light', 'chassis_dyno', 'valet_mode',
  'downshift_dan', 'clutch_kick', 'paddock_pass', 'trackday_tam', 'curb_weight',
]

function mulberry32(seed: number) {
  return function next() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFrom(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const PAINT = ['#d92b2b', '#1f6feb', '#111317', '#e8e8ea', '#f0b429', '#3fb950', '#7b61ff']

/** Deterministic rival rows for one board in one week. */
export function rivalRows(board: ShowcaseBoardId, weekKey: string, count = 40): LeaderRow[] {
  const rand = mulberry32(seedFrom(`${board}:${weekKey}`))
  const pool = CATALOG.filter((c) => c.status === 'approved')
  const rows: LeaderRow[] = []

  for (let i = 0; i < count; i++) {
    const car = pool[Math.floor(rand() * pool.length)]
    const username = NAMES[Math.floor(rand() * NAMES.length)] + (rand() < 0.3 ? Math.floor(rand() * 90 + 10) : '')
    rows.push({
      rank: 0,
      username,
      carLabel: carName(car),
      color: PAINT[Math.floor(rand() * PAINT.length)],
      score: Math.round(boardScoreFor(board, car.id, rand)),
      isYou: false,
    })
  }
  return rows
}

function boardScoreFor(board: ShowcaseBoardId, carId: string, rand: () => number): number {
  const car = catalogCar(carId)!
  switch (board) {
    case 'fastest_car':
      return Math.max(0, (16 - quarterMileEt(car)) * 1000)
    case 'most_valuable':
      return car.priceUsd
    case 'best_garage':
      return car.priceUsd * (0.6 + rand() * 0.8)
    case 'best_collection':
    default:
      return Math.round(200 + rand() * 2400)
  }
}

export type Ghost = {
  username: string
  catalogCarId: string
  et: number
  color: string
}

/**
 * A ghost is a recording of someone's run, so its time is a real car's time
 * with a human-sized mistake baked in. Matched roughly to the player's car so
 * races stay close.
 */
export function ghostFor(category: Category, playerEt: number, seed: string): Ghost {
  const rand = mulberry32(seedFrom(seed))
  const pool = CATALOG.filter((c) => c.category === category && c.status === 'approved')
  const sorted = [...pool].sort(
    (a, b) => Math.abs(quarterMileEt(a) - playerEt) - Math.abs(quarterMileEt(b) - playerEt),
  )
  const car = sorted[Math.min(sorted.length - 1, Math.floor(rand() * 3))] ?? pool[0]
  const sloppiness = 0.05 + rand() * 0.35
  return {
    username: NAMES[Math.floor(rand() * NAMES.length)],
    catalogCarId: car.id,
    et: Math.round((quarterMileEt(car) + sloppiness) * 100) / 100,
    color: PAINT[Math.floor(rand() * PAINT.length)],
  }
}

/** Monday-based week key; Showcase resets weekly. */
export function currentWeekKey(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

export function msUntilWeekReset(now = new Date()): number {
  const start = new Date(`${currentWeekKey(now)}T00:00:00Z`).getTime()
  return start + 7 * 24 * 3600 * 1000 - now.getTime()
}
