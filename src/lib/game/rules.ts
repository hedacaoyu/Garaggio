import { catalogCar } from '@/lib/catalog/cars'
import type { Card, PlayerState } from './types'

/** Collection cap from the plan. Every car in a stack counts against it. */
export const BASE_COLLECTION_CAPACITY = 150
export const CAPACITY_UPGRADE_SIZE = 25
export const CAPACITY_UPGRADE_COST = 300

export function collectionCount(state: PlayerState): number {
  return state.cards
    .filter((c) => c.kind === 'collection')
    .reduce((sum, c) => sum + c.stackCount, 0)
}

export function collectionFull(state: PlayerState): boolean {
  return collectionCount(state) >= state.profile.collectionCapacity
}

/**
 * Scrapping frees a slot. Only the two rarest classes pay anything back, so
 * scrapping is a real choice rather than a grinding loop.
 */
export function scrapValue(card: Card): number {
  const car = catalogCar(card.catalogCarId)
  if (!car) return 0
  if (car.category === 'hypercar') return 120
  if (car.category === 'supercar') return 40
  return 0
}

/** Cards of the same model can be merged into one stack. */
export function canMerge(a: Card, b: Card): boolean {
  return (
    a.id !== b.id &&
    a.kind === 'collection' &&
    b.kind === 'collection' &&
    a.catalogCarId === b.catalogCarId
  )
}

export function collectionValue(state: PlayerState): number {
  return state.cards
    .filter((c) => c.kind === 'collection')
    .reduce((sum, c) => sum + (catalogCar(c.catalogCarId)?.priceUsd ?? 0) * c.stackCount, 0)
}

export function garageValue(state: PlayerState): number {
  return state.cards
    .filter((c) => c.kind === 'garage')
    .reduce((sum, c) => sum + (catalogCar(c.catalogCarId)?.priceUsd ?? 0), 0)
}
