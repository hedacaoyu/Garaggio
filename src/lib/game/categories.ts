import type { Category } from './types'

export type CategoryMeta = {
  id: Category
  /** Body shape used by the card artwork. */
  silhouette: 'wedge' | 'coupe' | 'sedan' | 'suv' | 'muscle'
  accent: string
  /** CarDex shows collected/total only for the two rarest classes. */
  showsCompletion: boolean
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  hypercar: { id: 'hypercar', silhouette: 'wedge', accent: '#f0b429', showsCompletion: true },
  supercar: { id: 'supercar', silhouette: 'wedge', accent: '#e8513f', showsCompletion: true },
  sports: { id: 'sports', silhouette: 'coupe', accent: '#38b2e8', showsCompletion: false },
  luxury_suv: { id: 'luxury_suv', silhouette: 'suv', accent: '#5bc08c', showsCompletion: false },
  luxury_sedan: { id: 'luxury_sedan', silhouette: 'sedan', accent: '#a78bfa', showsCompletion: false },
  muscle: { id: 'muscle', silhouette: 'muscle', accent: '#f2743f', showsCompletion: false },
}

export const CATEGORY_ORDER: Category[] = [
  'hypercar',
  'supercar',
  'sports',
  'luxury_suv',
  'luxury_sedan',
  'muscle',
]
