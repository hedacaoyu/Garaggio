// Core domain types for Garaggio.

export const CATEGORIES = [
  'hypercar',
  'supercar',
  'sports',
  'luxury_suv',
  'luxury_sedan',
  'muscle',
] as const

export type Category = (typeof CATEGORIES)[number]

export type Drivetrain = 'rwd' | 'awd' | 'fwd'

/** A car model in the shared catalog. Specs live here, never on the card. */
export type CatalogCar = {
  id: string
  make: string
  model: string
  /** Specific variant, e.g. "E Performance". Empty for base models. */
  trim?: string
  generation?: string
  yearStart: number
  yearEnd?: number
  category: Category
  horsepower: number
  weightLbs: number
  topSpeedMph: number
  /** Current market value in USD, not original MSRP. */
  priceUsd: number
  drivetrain: Drivetrain
  /** Catalog entries created by a player scan start as 'pending' review. */
  status: 'approved' | 'pending'
  /** Alternate spellings merged into this entry so CarDex has no duplicates. */
  aliases?: string[]
}

export type CardKind = 'collection' | 'garage'

export type CardSource = 'scan' | 'starter' | 'race' | 'trade' | 'vin'

export type ScanLocation = {
  city: string
  country: string
  /** Precise coordinates are stored but never shown publicly. */
  lat?: number
  lon?: number
}

export type CardMods = {
  turbo: number
  tune: number
  exhaust: number
  /** Cosmetic only: paint, body kit, wheels, interior. */
  paint?: string
  bodyKit?: string
  wheels?: string
}

export type Card = {
  id: string
  catalogCarId: string
  kind: CardKind
  source: CardSource
  /** Colour the car was seen in; the card art is tinted with it. */
  color: string
  acquiredAt: string
  location?: ScanLocation
  mods: CardMods
  tags: string[]
  /** Garage cars only. */
  vin?: string
  ownership?: 'claimed' | 'verified'
  /** Merged duplicates of the same model collapse into one stack. */
  stackCount: number
}

export type CardexEntry = {
  catalogCarId: string
  firstCollectedAt: string
  timesCollected: number
  /** True when this player was the first in the world to scan the model. */
  firstDiscovery: boolean
}

export type ShowcaseBoardId =
  | 'best_collection'
  | 'fastest_car'
  | 'best_garage'
  | 'most_valuable'

export type ShowcaseEntry = {
  boardId: ShowcaseBoardId
  cardId: string
  score: number
  submittedAt: string
}

export type RaceResult = {
  id: string
  cardId: string
  eventId: string
  playerEt: number
  ghostEt: number
  won: boolean
  xpEarned: number
  rewardLabel?: string
  racedAt: string
}

export type Avatar = {
  skin: string
  hair: string
  outfit: string
  accessory: string
}

export type Profile = {
  id: string
  username: string
  avatar: Avatar
  level: number
  xp: number
  octane: number
  collectionCapacity: number
  personalRideCardId?: string
  createdAt: string
  /** Earned once, e.g. a Race Pass season. */
  premiumPass: boolean
}

export type PlayerState = {
  profile: Profile
  cards: Card[]
  cardex: CardexEntry[]
  showcase: ShowcaseEntry[]
  races: RaceResult[]
  /** Catalog rows this player created by scanning something new. */
  pendingCatalog: CatalogCar[]
}
