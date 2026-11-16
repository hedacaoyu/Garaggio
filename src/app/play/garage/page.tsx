'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { CarArt } from '@/components/CarArt'
import { CarCard } from '@/components/CarCard'
import { Scanner } from '@/components/Scanner'
import { Empty, Screen, Sheet } from '@/components/ui'
import { CATALOG, carName } from '@/lib/catalog/cars'
import { matchCatalog, normalizeVin, validateVin, type DecodedVin } from '@/lib/game/vin'
import type { CatalogCar } from '@/lib/game/types'
import { useT } from '@/lib/i18n'
import { usePlayer } from '@/state/game'

type Step = 'vin' | 'decoding' | 'confirm' | 'photo'

const EXAMPLE_VIN = '1HGCM82633A004352'

export default function GaragePage() {
  const t = useT()
  const router = useRouter()
  const { state, game } = usePlayer()

  const [adding, setAdding] = useState(false)
  const [step, setStep] = useState<Step>('vin')
  const [vin, setVin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [decoded, setDecoded] = useState<DecodedVin | null>(null)
  const [chosen, setChosen] = useState<CatalogCar | null>(null)
  const [search, setSearch] = useState('')
  const [color, setColor] = useState('#1f6feb')

  const garage = state.cards.filter((c) => c.kind === 'garage')

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return CATALOG.slice(0, 12)
    return CATALOG.filter((c) => carName(c).toLowerCase().includes(q)).slice(0, 20)
  }, [search])

  function reset() {
    setAdding(false)
    setStep('vin')
    setVin('')
    setError(null)
    setDecoded(null)
    setChosen(null)
    setSearch('')
  }

  async function submitVin() {
    const clean = normalizeVin(vin)
    const check = validateVin(clean)
    if (!check.ok) {
      setError(
        check.reason === 'checkdigit'
          ? t('garage.vinCheckDigit')
          : check.reason === 'prewar'
            ? t('garage.vinPrewar')
            : t('garage.vinInvalid'),
      )
      return
    }
    setError(null)

    if (await game.store.isVinClaimed(clean, game.session?.userId ?? '')) {
      setError(t('garage.vinTaken'))
      return
    }
    if (state.cards.some((c) => c.vin === clean)) {
      setError(t('garage.vinTaken'))
      return
    }

    setStep('decoding')
    try {
      const res = await fetch(`/api/vin?vin=${clean}`)
      if (!res.ok) throw new Error('decode failed')
      const data = (await res.json()) as DecodedVin
      setDecoded(data)
      setChosen(matchCatalog(data.make, data.model, data.trim) ?? null)
    } catch {
      setDecoded({ vin: clean, make: '', model: '' })
      setChosen(null)
    }
    setStep('confirm')
  }

  function finish() {
    if (!chosen || !decoded) return
    const card = game.addCard({
      catalogCarId: chosen.id,
      color,
      kind: 'garage',
      source: 'vin',
      vin: decoded.vin,
      // A matching door-jamb photo proves possession, not ownership, so the
      // car is Claimed. Verified owner needs a registration check later.
      ownership: 'claimed',
    })
    reset()
    router.push(`/play/car/${card.id}`)
  }

  return (
    <Screen
      title={t('garage.title')}
      back="/play"
      action={
        <button className="text-[13px] font-bold text-[var(--accent)]" onClick={() => setAdding(true)}>
          + {t('garage.add')}
        </button>
      }
    >
      {garage.length === 0 ? (
        <Empty
          action={
            <button className="btn btn-primary" onClick={() => setAdding(true)}>
              {t('garage.add')}
            </button>
          }
        >
          {t('garage.empty')}
        </Empty>
      ) : (
        <>
          <p className="px-5 pt-3 text-[11px] leading-relaxed text-[var(--text-faint)]">
            {t('garage.claimedHint')}
          </p>
          <div className="grid grid-cols-2 gap-2.5 px-5 pt-3">
            {garage.map((card) => (
              <CarCard
                key={card.id}
                card={card}
                stat="value"
                badge={card.ownership === 'verified' ? '✓' : undefined}
                onClick={() => router.push(`/play/car/${card.id}`)}
              />
            ))}
          </div>
        </>
      )}

      <Sheet open={adding} onClose={reset} title={t('garage.add')}>
        {step === 'vin' && (
          <div className="flex flex-col gap-3">
            <p className="text-[12px] leading-relaxed text-[var(--text-dim)]">{t('garage.vinHint')}</p>
            <input
              className="field tabular uppercase"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder={EXAMPLE_VIN}
              maxLength={17}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
            />
            {error && <p className="text-[12px] text-[var(--bad)]">{error}</p>}
            <button className="btn btn-primary" onClick={() => void submitVin()} disabled={vin.length < 17}>
              {t('common.next')}
            </button>
            <p className="text-[11px] text-[var(--text-faint)]">{t('garage.vinPrewar')}</p>
          </div>
        )}

        {step === 'decoding' && (
          <div className="flex items-center gap-3 py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <span className="text-[13px]">{t('garage.decoding')}</span>
          </div>
        )}

        {step === 'confirm' && decoded && (
          <div className="flex flex-col gap-3">
            <div className="surface p-3">
              <div className="label">{t('garage.vin')}</div>
              <div className="tabular text-[13px] font-bold">{decoded.vin}</div>
              {decoded.make && (
                <div className="mt-1 text-[13px] text-[var(--text-dim)]">
                  {[decoded.modelYear, decoded.make, decoded.model, decoded.trim].filter(Boolean).join(' ')}
                </div>
              )}
            </div>

            {chosen ? (
              <div className="surface flex items-center gap-3 p-3">
                <CarArt category={chosen.category} color={color} className="h-14 w-24 shrink-0" />
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-bold">{carName(chosen)}</div>
                  <div className="tabular text-[12px] text-[var(--text-dim)]">{chosen.horsepower} hp</div>
                </div>
              </div>
            ) : (
              <p className="text-[12px] leading-relaxed text-[var(--text-dim)]">{t('garage.notInCatalog')}</p>
            )}

            <div>
              <div className="label mb-1.5">{chosen ? t('garage.manual') : t('common.search')}</div>
              <input
                className="field"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Supra, M3, Hellcat…"
              />
              <div className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto">
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setChosen(c)}
                    className={`rounded-lg border px-3 py-2 text-left text-[13px] ${
                      chosen?.id === c.id
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-[var(--line)] text-[var(--text-dim)]'
                    }`}
                  >
                    {carName(c)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="label mb-1.5">Colour</div>
              <div className="flex gap-2">
                {['#1f6feb', '#d92b2b', '#111317', '#e8e8ea', '#f0b429', '#3fd17a'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={c}
                    className="h-8 w-8 rounded-full border-2"
                    style={{ background: c, borderColor: color === c ? 'var(--accent)' : 'transparent' }}
                  />
                ))}
              </div>
            </div>

            <button className="btn btn-primary" disabled={!chosen} onClick={() => setStep('photo')}>
              {t('common.next')}
            </button>
          </div>
        )}

        {step === 'photo' && (
          <div className="flex flex-col gap-3">
            <p className="text-[12px] leading-relaxed text-[var(--text-dim)]">{t('garage.photoHint')}</p>
            <Scanner photoOnly captureLabel={t('garage.photoTake')} onResult={() => finish()} />
            <p className="text-[11px] text-[var(--text-faint)]">{t('garage.claimedHint')}</p>
          </div>
        )}
      </Sheet>
    </Screen>
  )
}
