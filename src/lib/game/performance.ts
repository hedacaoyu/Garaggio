import type { CardMods, CatalogCar, Drivetrain } from './types'

/**
 * Quarter-mile performance is computed, never stored, so that mods actually
 * change race outcomes. The base model is the classic Fox ET/trap pair,
 * calibrated against published real-world times, with a drivetrain factor
 * standing in for how well a car puts power down off the line.
 */

const DRIVETRAIN_ET_FACTOR: Record<Drivetrain, number> = {
  awd: 0.955,
  rwd: 1.0,
  fwd: 1.045,
}

/** Performance parts are won by racing only — never bought. Max level 3 each. */
export const MOD_POWER_GAIN = { turbo: 0.06, tune: 0.035, exhaust: 0.02 }

export function effectiveHorsepower(car: CatalogCar, mods?: CardMods): number {
  if (!mods) return car.horsepower
  const gain =
    mods.turbo * MOD_POWER_GAIN.turbo +
    mods.tune * MOD_POWER_GAIN.tune +
    mods.exhaust * MOD_POWER_GAIN.exhaust
  return Math.round(car.horsepower * (1 + gain))
}

/** Best possible quarter-mile for this car with a flawless run, in seconds. */
export function quarterMileEt(car: CatalogCar, mods?: CardMods): number {
  const hp = effectiveHorsepower(car, mods)
  const raw = 5.825 * Math.cbrt(car.weightLbs / hp)
  return round2(raw * DRIVETRAIN_ET_FACTOR[car.drivetrain])
}

/** Trap speed at the quarter-mile line, in mph. */
export function trapSpeedMph(car: CatalogCar, mods?: CardMods): number {
  const hp = effectiveHorsepower(car, mods)
  return Math.round(234 * Math.cbrt(hp / car.weightLbs))
}

export function powerToWeight(car: CatalogCar, mods?: CardMods): number {
  return round2(effectiveHorsepower(car, mods) / (car.weightLbs / 1000))
}

/** How a driver's run deviated from a perfect one. */
export type RunQuality = {
  /** 0 = bogged or redlit, 1 = perfect launch. */
  launch: number
  perfectShifts: number
  missedShifts: number
  /** Nitrous timing, 0 = unused or wasted, 1 = used at the ideal moment. */
  nitrous: number
}

export const LAUNCH_PENALTY_MAX = 0.42
export const PERFECT_SHIFT_GAIN = 0.05
export const MISSED_SHIFT_PENALTY = 0.14
export const NITROUS_GAIN_MAX = 0.28

/**
 * A driver's actual time. Skill can beat a slightly quicker car, but it can
 * never make up a big power gap — roughly 0.9s of total swing.
 */
export function runEt(car: CatalogCar, mods: CardMods | undefined, q: RunQuality): number {
  const base = quarterMileEt(car, mods)
  const penalty =
    (1 - clamp01(q.launch)) * LAUNCH_PENALTY_MAX +
    q.missedShifts * MISSED_SHIFT_PENALTY -
    q.perfectShifts * PERFECT_SHIFT_GAIN -
    clamp01(q.nitrous) * NITROUS_GAIN_MAX
  return round2(Math.max(base - 0.35, base + penalty))
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function formatEt(et: number): string {
  return `${et.toFixed(2)}s`
}
