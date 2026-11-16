import { catalogCar } from '@/lib/catalog/cars'
import type { Card, Category, PlayerState } from './types'

/**
 * XP, levels and level gates. Scan XP follows the values in the design plan:
 * rarer cars pay more, and a model you already own pays 20% so that standing
 * in a car park re-scanning the same Civic is not a strategy.
 */
export const SCAN_XP: Record<Category, { fresh: number; repeat: number }> = {
  hypercar: { fresh: 15000, repeat: 3000 },
  supercar: { fresh: 4000, repeat: 800 },
  luxury_suv: { fresh: 1000, repeat: 200 },
  luxury_sedan: { fresh: 750, repeat: 150 },
  muscle: { fresh: 600, repeat: 120 },
  sports: { fresh: 500, repeat: 100 },
}

/** Bonus for being the first player in the world to log a model. */
export const FIRST_DISCOVERY_XP = 2500

export const XP_RACE_WIN = 1200
export const XP_RACE_LOSS = 250
export const XP_MOD_INSTALL = 300

/** XP needed to go from `level` to `level + 1`. Each level costs more. */
export function xpToNextLevel(level: number): number {
  return Math.round(900 * Math.pow(level, 1.45))
}

export function totalXpForLevel(level: number): number {
  let total = 0
  for (let l = 1; l < level; l++) total += xpToNextLevel(l)
  return total
}

/** Levelling pays Octane, never XP, so progress cannot compound. */
export function levelUpOctane(level: number): number {
  return 50 + level * 10
}

/** Every fifth level also pays an item that cannot be bought. */
export function levelUpItem(level: number): string | undefined {
  if (level % 5 !== 0) return undefined
  return level % 10 === 0 ? 'exclusive_livery' : 'turbo_kit'
}

/**
 * Some levels are gated on what is in the Collection (the Garage does not
 * count). Gates are stated by category rather than by a named car, so a
 * player who does not live near a Bugatti can still get there by racing or
 * trading for any hypercar.
 */
export const LEVEL_GATES: Record<number, { category: Category; count: number }> = {
  10: { category: 'supercar', count: 1 },
  20: { category: 'hypercar', count: 1 },
  30: { category: 'hypercar', count: 2 },
  40: { category: 'hypercar', count: 4 },
}

export function gateFor(level: number) {
  return LEVEL_GATES[level]
}

export function gateSatisfied(state: PlayerState, level: number): boolean {
  const gate = LEVEL_GATES[level]
  if (!gate) return true
  return countCategory(state.cards, gate.category) >= gate.count
}

export function countCategory(cards: Card[], category: Category): number {
  return cards
    .filter((c) => c.kind === 'collection')
    .filter((c) => catalogCar(c.catalogCarId)?.category === category)
    .reduce((sum, c) => sum + c.stackCount, 0)
}

export type LevelProgress = {
  level: number
  xpIntoLevel: number
  xpForLevel: number
  pct: number
  blockedBy?: { category: Category; count: number; have: number }
}

export function levelProgress(state: PlayerState): LevelProgress {
  const { level, xp } = state.profile
  const need = xpToNextLevel(level)
  const into = Math.max(0, xp - totalXpForLevel(level))
  const gate = LEVEL_GATES[level + 1]
  const blockedBy =
    gate && countCategory(state.cards, gate.category) < gate.count
      ? { ...gate, have: countCategory(state.cards, gate.category) }
      : undefined
  return {
    level,
    xpIntoLevel: Math.min(into, need),
    xpForLevel: need,
    pct: Math.min(100, Math.round((into / need) * 100)),
    blockedBy,
  }
}

/** Applies XP and resolves any level-ups that the gates allow. */
export function applyXp(
  state: PlayerState,
  amount: number,
): { profile: PlayerState['profile']; levelsGained: number; octaneGained: number; items: string[] } {
  let { level, xp, octane } = state.profile
  xp += amount
  let levelsGained = 0
  let octaneGained = 0
  const items: string[] = []

  // Keep levelling while XP allows and the next level's gate is satisfied.
  for (;;) {
    const need = totalXpForLevel(level + 1)
    if (xp < need) break
    if (!gateSatisfied(state, level + 1)) break
    level += 1
    levelsGained += 1
    const pay = levelUpOctane(level)
    octane += pay
    octaneGained += pay
    const item = levelUpItem(level)
    if (item) items.push(item)
  }

  return { profile: { ...state.profile, level, xp, octane }, levelsGained, octaneGained, items }
}
