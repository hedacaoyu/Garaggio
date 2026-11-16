import { CATALOG } from '@/lib/catalog/cars'
import type { CatalogCar } from './types'

/**
 * Garage cars are proven by VIN rather than by a photo, so their data is
 * exact. Decoding goes through NHTSA vPIC, which is free and needs no key.
 */

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
}
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

export type VinCheck = { ok: true } | { ok: false; reason: 'length' | 'chars' | 'checkdigit' | 'prewar' }

/** Cars built before 1981 have no 17-character VIN and must be entered by hand. */
export function validateVin(raw: string): VinCheck {
  const vin = raw.trim().toUpperCase()
  if (vin.length !== 17) return { ok: false, reason: vin.length > 0 && vin.length < 17 ? 'prewar' : 'length' }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return { ok: false, reason: 'chars' }

  let sum = 0
  for (let i = 0; i < 17; i++) {
    const ch = vin[i]
    const value = /\d/.test(ch) ? Number(ch) : TRANSLITERATION[ch]
    if (value === undefined) return { ok: false, reason: 'chars' }
    sum += value * WEIGHTS[i]
  }
  const expected = sum % 11
  const actual = vin[8] === 'X' ? 10 : Number(vin[8])
  return expected === actual ? { ok: true } : { ok: false, reason: 'checkdigit' }
}

export function normalizeVin(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

export type DecodedVin = {
  vin: string
  make: string
  model: string
  trim?: string
  modelYear?: number
  /** Catalog match, when the decoded model is one we hold specs for. */
  catalogCarId?: string
}

/** Best-effort match of a decoded make/model onto a catalog entry. */
export function matchCatalog(make: string, model: string, trim?: string): CatalogCar | undefined {
  const m = make.toLowerCase()
  const md = model.toLowerCase()
  const candidates = CATALOG.filter(
    (c) => c.make.toLowerCase().includes(m) || m.includes(c.make.toLowerCase().split(' ')[0]),
  ).filter((c) => c.model.toLowerCase().includes(md) || md.includes(c.model.toLowerCase()))
  if (candidates.length === 0) return undefined
  if (trim) {
    const t = trim.toLowerCase()
    const exact = candidates.find((c) => c.trim && t.includes(c.trim.toLowerCase()))
    if (exact) return exact
  }
  return candidates[0]
}
