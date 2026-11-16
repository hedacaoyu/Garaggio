'use client'

import Link from 'next/link'
import { CarArt } from '@/components/CarArt'
import { ProgressBar } from '@/components/ui'
import { carName, catalogCar } from '@/lib/catalog/cars'
import { quarterMileEt } from '@/lib/game/performance'
import { levelProgress } from '@/lib/game/progression'
import { collectionCount } from '@/lib/game/rules'
import { number } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { usePlayer } from '@/state/game'

export default function Home() {
  const { t, locale } = useI18n()
  const { state } = usePlayer()
  const progress = levelProgress(state)

  const ride = state.cards.find((c) => c.id === state.profile.personalRideCardId) ?? state.cards[0]
  const rideCar = ride ? catalogCar(ride.catalogCarId) : undefined

  return (
    <main className="flex min-h-[100dvh] flex-col px-5 pb-32 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[18px] font-black tracking-tight">{state.profile.username}</div>
          <div className="mt-0.5 text-[12px] text-[var(--text-dim)]">
            {t('home.level', { n: state.profile.level })}
          </div>
        </div>
        <Link
          href="/play/shop"
          className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-[var(--bg-raised)] px-3 py-1.5"
        >
          <span className="text-[14px] font-black text-[var(--gold)]">$</span>
          <span className="tabular text-[13px] font-bold">{number(state.profile.octane, locale)}</span>
        </Link>
      </div>

      <div className="mt-3">
        <ProgressBar pct={progress.pct} />
        <div className="tabular mt-1 flex justify-between text-[10px] text-[var(--text-faint)]">
          <span>
            {number(progress.xpIntoLevel, locale)} / {number(progress.xpForLevel, locale)} XP
          </span>
          <span>
            {collectionCount(state)} / {state.profile.collectionCapacity}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <Link
          href="/play/scan"
          className="group relative flex h-[190px] w-[190px] items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[radial-gradient(circle_at_50%_30%,rgba(255,138,61,0.22),transparent_65%)] transition-transform active:scale-95"
        >
          <span className="absolute inset-3 rounded-full border border-[var(--accent)]/30" />
          <span className="absolute inset-7 rounded-full border border-[var(--accent)]/15" />
          <span className="flex flex-col items-center gap-1">
            <CameraIcon />
            <span className="text-[20px] font-black tracking-widest text-[var(--accent)]">
              {t('home.scan')}
            </span>
          </span>
        </Link>
        <p className="mt-3 text-[12px] text-[var(--text-faint)]">{t('home.scanHint')}</p>
      </div>

      <Link href="/play/collection" className="surface block overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          {rideCar && ride ? (
            <>
              <CarArt category={rideCar.category} color={ride.color} className="h-16 w-28 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="label">{t('home.personalRide')}</div>
                <div className="truncate text-[15px] font-bold">{carName(rideCar)}</div>
                <div className="tabular mt-0.5 text-[12px] text-[var(--text-dim)]">
                  {rideCar.horsepower} hp · {quarterMileEt(rideCar, ride.mods).toFixed(2)}s
                </div>
              </div>
            </>
          ) : (
            <div className="p-2 text-[13px] text-[var(--text-dim)]">{t('home.noPersonalRide')}</div>
          )}
        </div>
      </Link>
    </main>
  )
}

function CameraIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinejoin="round" />
      <circle cx="12" cy="12.5" r="3.6" />
    </svg>
  )
}
