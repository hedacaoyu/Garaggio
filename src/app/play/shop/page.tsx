'use client'

import { useState } from 'react'
import { Screen, Toast } from '@/components/ui'
import { CAPACITY_UPGRADE_COST, CAPACITY_UPGRADE_SIZE } from '@/lib/game/rules'
import { number } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { usePlayer } from '@/state/game'

const COSMETICS = [
  { id: 'carbon_kit', cost: 220 },
  { id: 'chrome_wrap', cost: 180 },
  { id: 'forged_wheels', cost: 140 },
  { id: 'race_interior', cost: 160 },
  { id: 'driver_suit', cost: 120 },
]

const OCTANE_PACKS = [
  { octane: 100, usd: '0.99' },
  { octane: 550, usd: '4.99' },
  { octane: 1200, usd: '9.99' },
]

export default function ShopPage() {
  const { t, locale } = useI18n()
  const { state, game } = usePlayer()
  const [toast, setToast] = useState<string | null>(null)

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 1800)
  }

  return (
    <Screen
      title={t('shop.title')}
      back="/play"
      action={
        <span className="tabular text-[13px] font-bold text-[var(--gold)]">
          {t('shop.balance', { n: number(state.profile.octane, locale) })}
        </span>
      }
    >
      <div className="px-5 pt-4">
        <div className="surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold">{t('shop.racePass')}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-dim)]">{t('shop.racePassDesc')}</p>
            </div>
            {state.profile.premiumPass ? (
              <span className="chip border-[var(--gold)] text-[var(--gold)]">{t('shop.owned')}</span>
            ) : (
              <button
                className="btn btn-primary shrink-0"
                onClick={() => flash(game.buyPremiumPass() ? t('shop.owned') : t('shop.notEnough'))}
              >
                500
              </button>
            )}
          </div>
        </div>

        <div className="surface mt-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold">{t('shop.capacity')}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-dim)]">
                {t('shop.capacityDesc', { n: CAPACITY_UPGRADE_SIZE })}
              </p>
              <p className="tabular mt-1 text-[11px] text-[var(--text-faint)]">
                {state.profile.collectionCapacity}
              </p>
            </div>
            <button
              className="btn btn-primary shrink-0"
              onClick={() => flash(game.buyCapacity() ? t('shop.owned') : t('shop.notEnough'))}
            >
              {CAPACITY_UPGRADE_COST}
            </button>
          </div>
        </div>

        <h2 className="label mt-6">{t('shop.cosmetics')}</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-dim)]">{t('shop.cosmeticsDesc')}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {COSMETICS.map((item) => (
            <div key={item.id} className="surface flex items-center justify-between gap-2 p-3">
              <span className="text-[12px] font-semibold capitalize">{item.id.replace(/_/g, ' ')}</span>
              <span className="tabular text-[12px] font-bold text-[var(--gold)]">{item.cost}</span>
            </div>
          ))}
        </div>

        <h2 className="label mt-6">{t('shop.octanePacks')}</h2>
        <div className="mt-2 flex flex-col gap-2">
          {OCTANE_PACKS.map((pack) => (
            <div key={pack.octane} className="surface flex items-center justify-between gap-3 p-3 opacity-60">
              <span className="tabular text-[13px] font-bold">{number(pack.octane, locale)} Octane</span>
              <span className="tabular text-[13px]">${pack.usd}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[var(--text-faint)]">{t('shop.packsSoon')}</p>

        <p className="mt-6 rounded-xl border border-[var(--line-strong)] bg-[var(--bg-raised)] p-3 text-[12px] leading-relaxed text-[var(--text-dim)]">
          {t('shop.fairPlay')}
        </p>
      </div>

      <Toast message={toast} />
    </Screen>
  )
}
