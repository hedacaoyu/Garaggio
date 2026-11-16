import { catalogCar } from '@/lib/catalog/cars'
import { quarterMileEt } from './performance'
import { collectionValue, garageValue } from './rules'
import type { Card, PlayerState, ShowcaseBoardId } from './types'

export const SHOWCASE_BOARDS: ShowcaseBoardId[] = [
  'best_collection',
  'fastest_car',
  'best_garage',
  'most_valuable',
]

/**
 * Collection boards are scored on breadth, not price: at a car show hundreds
 * of players scan the same Bugatti, and a price ranking would be one long tie.
 * Garage boards are scored on the objective worth of cars you actually own.
 */
export function scoreFor(board: ShowcaseBoardId, card: Card, state: PlayerState): number {
  const car = catalogCar(card.catalogCarId)
  if (!car) return 0
  switch (board) {
    case 'best_collection': {
      const cars = state.cards.filter((c) => c.kind === 'collection').reduce((n, c) => n + c.stackCount, 0)
      const models = new Set(state.cards.filter((c) => c.kind === 'collection').map((c) => c.catalogCarId)).size
      return cars * 10 + models * 25
    }
    case 'fastest_car':
      return Math.max(0, Math.round((16 - quarterMileEt(car, card.mods)) * 1000))
    case 'best_garage':
      return Math.round(garageValue(state))
    case 'most_valuable':
      return car.priceUsd
  }
}

/** Which of a player's cards may be entered on a given board. */
export function eligibleCards(board: ShowcaseBoardId, state: PlayerState): Card[] {
  switch (board) {
    case 'best_garage':
      // Only a proven owner can rank a garage, so a photographed door jamb is
      // not enough here.
      return state.cards.filter((c) => c.kind === 'garage' && c.ownership === 'verified')
    case 'best_collection':
      return state.cards.filter((c) => c.kind === 'collection')
    default:
      return state.cards
  }
}

export function boardUnit(board: ShowcaseBoardId): 'points' | 'et' | 'usd' {
  if (board === 'fastest_car') return 'et'
  if (board === 'most_valuable' || board === 'best_garage') return 'usd'
  return 'points'
}

export function collectionScoreParts(state: PlayerState) {
  return {
    cars: state.cards.filter((c) => c.kind === 'collection').reduce((n, c) => n + c.stackCount, 0),
    models: new Set(state.cards.filter((c) => c.kind === 'collection').map((c) => c.catalogCarId)).size,
    value: collectionValue(state),
  }
}
