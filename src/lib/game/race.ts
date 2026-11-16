import type { CardMods, Category } from './types'

export type RaceEvent = {
  id: string
  category: Category
  /** Octane paid out for a win, on top of XP. */
  octaneReward: number
}

export const RACE_EVENTS: RaceEvent[] = [
  { id: 'hypercar_invitational', category: 'hypercar', octaneReward: 120 },
  { id: 'supercar_shootout', category: 'supercar', octaneReward: 70 },
  { id: 'sports_series', category: 'sports', octaneReward: 30 },
  { id: 'suv_heavyweight', category: 'luxury_suv', octaneReward: 40 },
  { id: 'sedan_executive', category: 'luxury_sedan', octaneReward: 35 },
  { id: 'muscle_showdown', category: 'muscle', octaneReward: 35 },
]

export type PartReward = { part: keyof Pick<CardMods, 'turbo' | 'tune' | 'exhaust'> } | { part: null }

/**
 * Performance parts drop from racing only — never from the shop — so paying
 * money can never make a car quicker.
 */
export function rollPartReward(won: boolean, premiumPass: boolean): PartReward {
  if (!won) return { part: null }
  const chance = premiumPass ? 0.7 : 0.45
  if (Math.random() > chance) return { part: null }
  const roll = Math.random()
  if (roll < 0.34) return { part: 'turbo' }
  if (roll < 0.67) return { part: 'tune' }
  return { part: 'exhaust' }
}

export const MAX_MOD_LEVEL = 3
