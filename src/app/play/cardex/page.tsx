'use client'

import { useMemo, useState } from 'react'
import { CarArt } from '@/components/CarArt'
import { Screen } from '@/components/ui'
import { CATALOG, carName } from '@/lib/catalog/cars'
import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/game/categories'
import type { Category } from '@/lib/game/types'
import { useT } from '@/lib/i18n'
import { usePlayer } from '@/state/game'

/**
 * The permanent record. Models stay here once collected, whatever happens to
 * the card afterwards. Only the two rarest classes show a completion count:
 * nobody is ever going to "finish" sports cars.
 */
export default function CardexPage() {
  const t = useT()
  const { state } = usePlayer()
  const [open, setOpen] = useState<Category | null>('hypercar')

  const collected = useMemo(
    () => new Map(state.cardex.map((e) => [e.catalogCarId, e])),
    [state.cardex],
  )

  return (
    <Screen title={t('cardex.title')} back="/play">
      <p className="px-5 pt-3 text-[12px] leading-relaxed text-[var(--text-dim)]">{t('cardex.blurb')}</p>

      <div className="mt-3 flex flex-col gap-2 px-5">
        {CATEGORY_ORDER.map((category) => {
          const meta = CATEGORY_META[category]
          const models = CATALOG.filter((c) => c.category === category)
          const have = models.filter((m) => collected.has(m.id)).length
          const isOpen = open === category

          return (
            <section key={category} className="surface overflow-hidden">
              <button
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
                onClick={() => setOpen(isOpen ? null : category)}
              >
                <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: meta.accent }} />
                <span className="flex-1">
                  <span className="block text-[14px] font-bold">{t(`category.${category}`)}</span>
                  <span className="tabular block text-[11px] text-[var(--text-dim)]">
                    {meta.showsCompletion
                      ? t('cardex.collected', { have, total: models.length })
                      : t('cardex.models', { n: have })}
                  </span>
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-faint)"
                  strokeWidth="2.2"
                  style={{ transform: isOpen ? 'rotate(180deg)' : undefined }}
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-[var(--line)] px-3.5 py-3">
                  {groupByMake(models).map(([make, list]) => (
                    <div key={make} className="mb-3 last:mb-0">
                      <div className="label mb-1.5">
                        {make} · {list.filter((m) => collected.has(m.id)).length}/{list.length}
                      </div>
                      <div className="flex flex-col gap-1">
                        {list.map((model) => {
                          const entry = collected.get(model.id)
                          return (
                            <div
                              key={model.id}
                              className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5"
                              style={{ opacity: entry ? 1 : 0.4 }}
                            >
                              <CarArt
                                category={model.category}
                                color={entry ? meta.accent : '#3a4150'}
                                className="h-7 w-14 shrink-0"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-semibold">
                                  {carName(model)}
                                </span>
                                <span className="tabular block text-[10px] text-[var(--text-faint)]">
                                  {entry ? t('cardex.times', { n: entry.timesCollected }) : t('cardex.notSeen')}
                                </span>
                              </span>
                              {entry?.firstDiscovery && (
                                <span className="chip border-[var(--gold)] text-[var(--gold)]">
                                  {t('cardex.firstDiscovery')}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </Screen>
  )
}

function groupByMake<T extends { make: string }>(models: T[]): Array<[string, T[]]> {
  const map = new Map<string, T[]>()
  models.forEach((m) => {
    const list = map.get(m.make) ?? []
    list.push(m)
    map.set(m.make, list)
  })
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}
