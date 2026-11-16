'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { CarCard, type CardStat } from '@/components/CarCard'
import { Empty, Screen } from '@/components/ui'
import { catalogCar } from '@/lib/catalog/cars'

import { collectionCount } from '@/lib/game/rules'
import { useT } from '@/lib/i18n'
import { usePlayer } from '@/state/game'

type Sort = 'recent' | 'power' | 'value'

export default function CollectionPage() {
  const t = useT()
  const router = useRouter()
  const { state, game } = usePlayer()
  const [tab, setTab] = useState<'cars' | 'tags'>('cars')
  const [sort, setSort] = useState<Sort>('recent')
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const cards = useMemo(() => {
    const list = state.cards.filter((c) => c.kind === 'collection')
    const filtered = tagFilter ? list.filter((c) => c.tags.includes(tagFilter)) : list
    return [...filtered].sort((a, b) => {
      const ca = catalogCar(a.catalogCarId)
      const cb = catalogCar(b.catalogCarId)
      if (sort === 'power') return (cb?.horsepower ?? 0) - (ca?.horsepower ?? 0)
      if (sort === 'value') return (cb?.priceUsd ?? 0) - (ca?.priceUsd ?? 0)
      return b.acquiredAt.localeCompare(a.acquiredAt)
    })
  }, [state.cards, sort, tagFilter])

  const duplicates = useMemo(() => {
    const counts = new Map<string, number>()
    state.cards
      .filter((c) => c.kind === 'collection')
      .forEach((c) => counts.set(c.catalogCarId, (counts.get(c.catalogCarId) ?? 0) + 1))
    return [...counts.entries()].filter(([, n]) => n > 1)
  }, [state.cards])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    state.cards.forEach((c) => c.tags.forEach((tag) => set.add(tag)))
    return [...set].sort()
  }, [state.cards])

  const stat: CardStat = sort === 'value' ? 'value' : sort === 'power' ? 'power' : 'power'

  return (
    <Screen
      title={t('collection.title')}
      back="/play"
      action={
        <span className="tabular text-[12px] font-bold text-[var(--text-dim)]">
          {t('collection.capacity', { used: collectionCount(state), cap: state.profile.collectionCapacity })}
        </span>
      }
    >
      <div className="flex gap-1 px-5 pt-3">
        <Tab active={tab === 'cars'} onClick={() => setTab('cars')} label={t('collection.tabCars')} />
        <Tab active={tab === 'tags'} onClick={() => setTab('tags')} label={t('collection.tabTags')} />
      </div>

      {tab === 'cars' ? (
        <>
          <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto px-5">
            {(['recent', 'power', 'value'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`chip shrink-0 ${sort === s ? 'border-[var(--accent)] text-[var(--accent)]' : ''}`}
              >
                {t(`collection.sort${s === 'recent' ? 'Recent' : s === 'power' ? 'Power' : 'Value'}`)}
              </button>
            ))}
            {tagFilter && (
              <button className="chip shrink-0 border-[var(--accent)] text-[var(--accent)]" onClick={() => setTagFilter(null)}>
                #{tagFilter} ✕
              </button>
            )}
          </div>

          {duplicates.length > 0 && (
            <div className="mx-5 mt-3 flex flex-col gap-2">
              {duplicates.map(([carId, n]) => (
                <button
                  key={carId}
                  onClick={() => game.mergeModel(carId)}
                  className="surface flex items-center justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <span className="truncate text-[12px] text-[var(--text-dim)]">
                    {t('collection.mergeHint', { n })}
                  </span>
                  <span className="shrink-0 text-[12px] font-bold text-[var(--accent)]">
                    {t('collection.merge')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {cards.length === 0 ? (
            <Empty>{t('collection.empty')}</Empty>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 px-5 pt-3">
              {cards.map((card) => (
                <CarCard
                  key={card.id}
                  card={card}
                  stat={stat}
                  badge={card.id === state.profile.personalRideCardId ? '★' : undefined}
                  onClick={() => router.push(`/play/car/${card.id}`)}
                />
              ))}
            </div>
          )}
        </>
      ) : allTags.length === 0 ? (
        <Empty>{t('collection.noTags')}</Empty>
      ) : (
        <div className="flex flex-wrap gap-2 px-5 pt-4">
          {allTags.map((tag) => (
            <button
              key={tag}
              className="chip"
              onClick={() => {
                setTagFilter(tag)
                setTab('cars')
              }}
            >
              #{tag}
              <span className="tabular text-[var(--text-faint)]">
                {state.cards.filter((c) => c.tags.includes(tag)).length}
              </span>
            </button>
          ))}
        </div>
      )}
    </Screen>
  )
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl border px-3 py-2 text-[13px] font-bold transition-colors ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
          : 'border-[var(--line)] text-[var(--text-dim)]'
      }`}
    >
      {label}
    </button>
  )
}
