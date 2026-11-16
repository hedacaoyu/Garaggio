'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CarArt } from '@/components/CarArt'
import { CarCard } from '@/components/CarCard'
import { Scanner } from '@/components/Scanner'
import { Screen, Sheet } from '@/components/ui'
import { carName } from '@/lib/catalog/cars'
import { CATEGORY_META } from '@/lib/game/categories'
import { currentScanLocation, formatPlace } from '@/lib/game/location'
import type { ScanResult } from '@/lib/game/recognition'
import { quarterMileEt } from '@/lib/game/performance'
import { scrapValue } from '@/lib/game/rules'
import type { ScanLocation } from '@/lib/game/types'
import { number } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { usePlayer, type ScanOutcome } from '@/state/game'

export default function ScanPage() {
  const { t, locale } = useI18n()
  const { state, game } = usePlayer()
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)
  const [place, setPlace] = useState<ScanLocation | undefined>()
  const [committed, setCommitted] = useState(false)
  const [picking, setPicking] = useState(false)
  const [nonce, setNonce] = useState(0)

  async function handleResult(result: ScanResult) {
    const location = await currentScanLocation(true)
    setPlace(location)
    const next = game.resolveScan(result, location)
    setOutcome(next)
    if (!next.collectionWasFull) {
      await game.commitScan(next)
      setCommitted(true)
    }
  }

  function reset() {
    setOutcome(null)
    setCommitted(false)
    setPlace(undefined)
    setNonce((n) => n + 1)
  }

  async function scrapThenKeep(cardId: string) {
    if (!outcome) return
    game.scrapCard(cardId)
    await game.commitScan({ ...outcome, collectionWasFull: false })
    setCommitted(true)
    setPicking(false)
  }

  if (!outcome) {
    return (
      <Screen title={t('scan.title')} back="/play">
        <div className="px-5 pt-4">
          <Scanner
            key={nonce}
            onResult={(r) => {
              if (r) void handleResult(r)
            }}
          />
          <p className="mt-3 text-center text-[11px] text-[var(--text-faint)]">{t('scan.simulated')}</p>
        </div>
      </Screen>
    )
  }

  const car = outcome.catalogCar
  const meta = CATEGORY_META[car.category]
  const collection = state.cards.filter((c) => c.kind === 'collection')

  return (
    <Screen title={t('scan.result')} back="/play">
      <div className="px-5 pt-4">
        <div
          className="pop-in surface overflow-hidden"
          style={{ borderColor: outcome.isNewModel ? meta.accent : undefined }}
        >
          <div
            className="relative px-4 pt-5"
            style={{ background: `linear-gradient(180deg, ${meta.accent}2e 0%, transparent 75%)` }}
          >
            {outcome.isNewModel && (
              <span
                className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide"
                style={{ background: meta.accent, color: '#17120b' }}
              >
                {t('common.new')}
              </span>
            )}
            <CarArt category={car.category} color={outcome.color} className="h-[150px] w-full" />
          </div>

          <div className="px-4 pb-4">
            <h2 className="text-[20px] font-black leading-tight">{carName(car)}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-bold" style={{ color: meta.accent }}>
                {t(`category.${car.category}`)}
              </span>
              <span className="chip">{t('scan.confidence', { pct: Math.round(outcome.confidence * 100) })}</span>
            </div>

            <div className="tabular mt-3 flex items-baseline gap-2">
              <span className="text-[26px] font-black text-[var(--accent)]">
                {t('scan.xpEarned', { xp: number(outcome.xp, locale) })}
              </span>
              {!outcome.isNewModel && (
                <span className="text-[11px] text-[var(--text-faint)]">{t('scan.repeat')}</span>
              )}
            </div>

            {outcome.firstDiscovery && (
              <p className="mt-2 text-[12px] font-semibold text-[var(--gold)]">
                {t('scan.firstDiscovery')} {t('scan.firstDiscoveryHint', { xp: 2500 })}
              </p>
            )}
            {outcome.fellBackToBaseModel && (
              <p className="mt-2 text-[12px] text-[var(--text-dim)]">{t('scan.fellBack')}</p>
            )}

            <div className="tabular mt-3 grid grid-cols-3 gap-2 text-center">
              <MiniStat label={t('card.horsepower')} value={`${car.horsepower}`} />
              <MiniStat label={t('card.quarterMile')} value={`${quarterMileEt(car).toFixed(2)}s`} />
              <MiniStat label={t('card.topSpeed')} value={`${car.topSpeedMph}`} />
            </div>

            <p className="mt-3 text-[11px] text-[var(--text-faint)]">
              {place ? t('card.seenAt', { place: formatPlace(place) ?? '' }) : t('card.seenUnknown')}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-faint)]">{t('card.placeholderArt')}</p>
          </div>
        </div>

        {outcome.collectionWasFull && !committed ? (
          <div className="surface mt-4 border-[var(--bad)] p-4">
            <h3 className="text-[15px] font-bold text-[var(--bad)]">{t('scan.full')}</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-dim)]">{t('scan.fullHint')}</p>
            <div className="mt-3 flex flex-col gap-2">
              <button className="btn btn-primary" onClick={() => setPicking(true)}>
                {t('scan.scrapToKeep')}
              </button>
              <button className="btn btn-quiet" onClick={reset}>
                {t('scan.letItGo')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-4 text-center text-[13px] font-semibold text-[var(--good)]">{t('scan.added')}</p>
            <div className="mt-3 flex flex-col gap-2">
              <button className="btn btn-primary" onClick={reset}>
                {t('scan.again')}
              </button>
              <Link href="/play/collection" className="btn btn-ghost">
                {t('scan.toCollection')}
              </Link>
            </div>
          </>
        )}
      </div>

      <Sheet open={picking} onClose={() => setPicking(false)} title={t('scan.scrapToKeep')}>
        <div className="grid grid-cols-2 gap-2">
          {collection.map((card) => (
            <div key={card.id} className="flex flex-col gap-1">
              <CarCard card={card} stat="value" onClick={() => void scrapThenKeep(card.id)} />
              <span className="text-center text-[10px] text-[var(--text-faint)]">
                {scrapValue(card) > 0
                  ? t('collection.scrapReturn', { n: scrapValue(card) })
                  : t('collection.scrapNothing')}
              </span>
            </div>
          ))}
        </div>
      </Sheet>
    </Screen>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-sunken)] px-2 py-2">
      <div className="text-[15px] font-black">{value}</div>
      <div className="mt-0.5 text-[10px] text-[var(--text-faint)]">{label}</div>
    </div>
  )
}
