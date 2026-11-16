import { catalogCar } from '@/lib/catalog/cars'
import type { PlayerState } from './types'

export type BadgeId =
  | 'modified'
  | 'collected'
  | 'garage'
  | 'showcased'
  | 'wins'
  | 'power'
  | 'millionaire'
  | 'countries'

export type BadgeTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'

export type Badge = {
  id: BadgeId
  thresholds: [number, number, number, number]
  value: (s: PlayerState) => number
}

const TIERS: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum']

export const BADGES: Badge[] = [
  {
    id: 'modified',
    thresholds: [1, 5, 15, 40],
    value: (s) =>
      s.cards.filter((c) => c.mods.turbo + c.mods.tune + c.mods.exhaust > 0).length,
  },
  {
    id: 'collected',
    thresholds: [10, 50, 150, 400],
    value: (s) =>
      s.cards.filter((c) => c.kind === 'collection').reduce((n, c) => n + c.stackCount, 0),
  },
  { id: 'garage', thresholds: [1, 3, 5, 10], value: (s) => s.cards.filter((c) => c.kind === 'garage').length },
  { id: 'showcased', thresholds: [1, 2, 3, 4], value: (s) => s.showcase.length },
  { id: 'wins', thresholds: [1, 10, 50, 200], value: (s) => s.races.filter((r) => r.won).length },
  {
    id: 'power',
    thresholds: [1, 5, 20, 60],
    value: (s) => s.cards.filter((c) => (catalogCar(c.catalogCarId)?.horsepower ?? 0) > 800).length,
  },
  {
    id: 'millionaire',
    thresholds: [1, 5, 10, 25],
    value: (s) =>
      s.cards.filter((c) => (catalogCar(c.catalogCarId)?.priceUsd ?? 0) >= 1_000_000).length,
  },
  {
    id: 'countries',
    thresholds: [1, 3, 6, 12],
    value: (s) => new Set(s.cards.map((c) => c.location?.country).filter(Boolean)).size,
  },
]

export function badgeTier(badge: Badge, state: PlayerState): { tier: BadgeTier; value: number; next?: number } {
  const value = badge.value(state)
  let tier: BadgeTier = 'none'
  let next: number | undefined = badge.thresholds[0]
  badge.thresholds.forEach((threshold, i) => {
    if (value >= threshold) {
      tier = TIERS[i]
      next = badge.thresholds[i + 1]
    }
  })
  return { tier, value, next }
}
