'use client'

import { carName, catalogCar } from '@/lib/catalog/cars'
import { CATEGORY_META } from '@/lib/game/categories'
import { quarterMileEt } from '@/lib/game/performance'
import type { Card } from '@/lib/game/types'
import { money } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { CarArt } from './CarArt'

export type CardStat = 'power' | 'value' | 'et'

export function CarCard({
  card,
  stat = 'power',
  onClick,
  selected,
  badge,
}: {
  card: Card
  stat?: CardStat
  onClick?: () => void
  selected?: boolean
  badge?: string
}) {
  const { t, locale } = useI18n()
  const car = catalogCar(card.catalogCarId)
  if (!car) return null
  const meta = CATEGORY_META[car.category]

  const statText =
    stat === 'value'
      ? money(car.priceUsd, locale)
      : stat === 'et'
        ? `${quarterMileEt(car, card.mods).toFixed(2)}s`
        : `${car.horsepower} hp`

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className={`surface relative w-full overflow-hidden text-left transition-colors ${
        selected ? 'border-[var(--accent)]' : 'hover:border-[var(--line-strong)]'
      }`}
      style={{ borderColor: selected ? 'var(--accent)' : undefined }}
    >
      <div
        className="relative px-2 pt-3"
        style={{ background: `linear-gradient(180deg, ${meta.accent}1f 0%, transparent 72%)` }}
      >
        <CarArt category={car.category} color={card.color} className="h-[84px] w-full" />
        {card.stackCount > 1 && (
          <span className="tabular absolute right-2 top-2 rounded-full bg-[var(--bg-sunken)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent)]">
            {t('collection.stack', { n: card.stackCount })}
          </span>
        )}
        {badge && (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--accent-ink)]">
            {badge}
          </span>
        )}
      </div>
      <div className="px-3 pb-3 pt-1">
        <div className="truncate text-[13px] font-bold leading-tight">{carName(car)}</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold" style={{ color: meta.accent }}>
            {t(`category.${car.category}`)}
          </span>
          <span className="tabular shrink-0 text-[11px] font-bold text-[var(--text-dim)]">{statText}</span>
        </div>
      </div>
    </Tag>
  )
}
