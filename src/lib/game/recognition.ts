import { CATALOG, catalogCar } from '@/lib/catalog/cars'
import type { CatalogCar, Category } from './types'

/**
 * The scanner and the catalog are deliberately separate: recognition only has
 * to answer "which model is this?", and the catalog answers "what is that
 * model?". Swapping the mock recognizer for Gemini later means replacing this
 * one module and nothing else.
 */
export type ScanResult = {
  catalogCar: CatalogCar
  color: string
  /** 0-1. Below SPECIFIC_TRIM_CONFIDENCE we fall back to the base model. */
  confidence: number
  /** True when the model was not in the catalog and was created as pending. */
  isNewToCatalog: boolean
  /** Set when a specific variant was guessed down to the base model. */
  fellBackToBaseModel: boolean
}

export interface Recognizer {
  identify(frame: Blob): Promise<ScanResult>
}

export const SPECIFIC_TRIM_CONFIDENCE = 0.72

/** Street frequency weights — you see far more Mustangs than Koenigseggs. */
const RARITY_WEIGHT: Record<Category, number> = {
  hypercar: 1,
  supercar: 6,
  sports: 30,
  luxury_suv: 18,
  luxury_sedan: 14,
  muscle: 20,
}

const PAINT = [
  '#d92b2b', '#1f6feb', '#111317', '#e8e8ea', '#f0b429',
  '#3fb950', '#7b61ff', '#c9ccd1', '#ff7a3d', '#1b4d3e',
]

function weightedPick(pool: CatalogCar[]): CatalogCar {
  const total = pool.reduce((sum, c) => sum + RARITY_WEIGHT[c.category], 0)
  let roll = Math.random() * total
  for (const car of pool) {
    roll -= RARITY_WEIGHT[car.category]
    if (roll <= 0) return car
  }
  return pool[pool.length - 1]
}

/** Drops a specific variant down to the base model when confidence is low. */
function baseModelOf(car: CatalogCar): CatalogCar {
  if (!car.trim) return car
  const base = CATALOG.find((c) => c.make === car.make && c.model === car.model && !c.trim)
  return base ?? car
}

export type MockOptions = {
  /** Bias the roll towards a model, e.g. the starter car during onboarding. */
  preferId?: string
}

/**
 * Stands in for Gemini while the loop is being built. Every scan returns a
 * definite answer immediately, because players scan from moving cars.
 */
export const mockRecognizer: Recognizer & { identifySync(opts?: MockOptions): ScanResult } = {
  async identify(): Promise<ScanResult> {
    // A real call takes a moment; keep the UI honest about that.
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 700))
    return mockRecognizer.identifySync()
  },

  identifySync(opts: MockOptions = {}): ScanResult {
    const approved = CATALOG.filter((c) => c.status === 'approved')
    const preferred = opts.preferId ? catalogCar(opts.preferId) : undefined
    const picked = preferred ?? weightedPick(approved)
    const confidence = 0.55 + Math.random() * 0.45
    const specific = confidence >= SPECIFIC_TRIM_CONFIDENCE
    const car = specific ? picked : baseModelOf(picked)
    return {
      catalogCar: car,
      color: PAINT[Math.floor(Math.random() * PAINT.length)],
      confidence: Math.round(confidence * 100) / 100,
      isNewToCatalog: false,
      fellBackToBaseModel: !specific && car.id !== picked.id,
    }
  },
}
