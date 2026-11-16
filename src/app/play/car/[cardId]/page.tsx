'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { CarArt } from '@/components/CarArt'
import { Screen, Sheet, Stat, Toast } from '@/components/ui'
import { carName, catalogCar } from '@/lib/catalog/cars'
import { CATEGORY_META } from '@/lib/game/categories'
import { formatPlace } from '@/lib/game/location'
import { effectiveHorsepower, quarterMileEt, trapSpeedMph } from '@/lib/game/performance'
import { MAX_MOD_LEVEL } from '@/lib/game/race'
import { scrapValue } from '@/lib/game/rules'
import type { CardMods } from '@/lib/game/types'
import { lbs, moneyFull } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { usePlayer } from '@/state/game'

const PERFORMANCE_PARTS: Array<keyof Pick<CardMods, 'turbo' | 'tune' | 'exhaust'>> = [
  'turbo',
  'tune',
  'exhaust',
]

export default function CarDetail() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const params = useParams<{ cardId: string }>()
  const { state, game } = usePlayer()
  const [confirmScrap, setConfirmScrap] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const card = state.cards.find((c) => c.id === params.cardId)
  const car = card ? catalogCar(card.catalogCarId) : undefined

  if (!card || !car) {
    return (
      <Screen title={t('common.back')} back="/play/collection">
        <p className="px-5 pt-6 text-[13px] text-[var(--text-dim)]">{t('collection.empty')}</p>
      </Screen>
    )
  }

  const meta = CATEGORY_META[car.category]
  const isGarage = card.kind === 'garage'
  const back = isGarage ? '/play/garage' : '/play/collection'
  const modded = effectiveHorsepower(car, card.mods) > car.horsepower

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 1800)
  }

  function addTag() {
    const tag = newTag.trim().replace(/^#/, '')
    if (!tag || card!.tags.includes(tag)) return
    game.setTags(card!.id, [...card!.tags, tag])
    setNewTag('')
  }

  return (
    <Screen title={carName(car)} back={back}>
      <div
        className="px-5 pt-4"
        style={{ background: `linear-gradient(180deg, ${meta.accent}26 0%, transparent 60%)` }}
      >
        <CarArt category={car.category} color={card.color} className="h-[150px] w-full" />
      </div>

      <div className="px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold" style={{ color: meta.accent }}>
            {t(`category.${car.category}`)}
          </span>
          {card.stackCount > 1 && <span className="chip">{t('collection.stack', { n: card.stackCount })}</span>}
          {card.id === state.profile.personalRideCardId && (
            <span className="chip border-[var(--accent)] text-[var(--accent)]">{t('card.isPersonalRide')}</span>
          )}
          {isGarage && (
            <span
              className={`chip ${card.ownership === 'verified' ? 'border-[var(--good)] text-[var(--good)]' : ''}`}
            >
              {card.ownership === 'verified' ? t('garage.verified') : t('garage.claimed')}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat
            label={t('card.horsepower')}
            value={
              <span className={modded ? 'text-[var(--accent)]' : undefined}>
                {effectiveHorsepower(car, card.mods)} hp
              </span>
            }
            hint={modded ? `${car.horsepower} hp stock` : undefined}
          />
          <Stat label={t('card.quarterMile')} value={`${quarterMileEt(car, card.mods).toFixed(2)}s`} />
          <Stat label={t('card.topSpeed')} value={`${car.topSpeedMph} mph`} />
          <Stat label={t('card.trapSpeed')} value={`${trapSpeedMph(car, card.mods)} mph`} />
          <Stat label={t('card.weight')} value={lbs(car.weightLbs, locale)} />
          <Stat label={t('card.drivetrain')} value={t(`drivetrain.${car.drivetrain}`)} />
          <div className="col-span-2">
            <Stat label={t('card.value')} value={moneyFull(car.priceUsd, locale)} />
          </div>
        </div>

        <h3 className="label mt-5">{t('card.mods')}</h3>
        <div className="surface mt-2 p-3">
          <div className="label mb-2">{t('card.modsPerformance')}</div>
          <div className="flex flex-col gap-2">
            {PERFORMANCE_PARTS.map((part) => (
              <div key={part} className="flex items-center gap-3">
                <span className="w-20 text-[13px] font-semibold">
                  {t(`card.mod${part === 'turbo' ? 'Turbo' : part === 'tune' ? 'Tune' : 'Exhaust'}`)}
                </span>
                <div className="flex flex-1 gap-1">
                  {Array.from({ length: MAX_MOD_LEVEL }, (_, i) => (
                    <span
                      key={i}
                      className="h-2 flex-1 rounded-full"
                      style={{
                        background: i < card.mods[part] ? 'var(--accent)' : 'var(--bg-sunken)',
                      }}
                    />
                  ))}
                </div>
                <span className="tabular w-8 text-right text-[12px] text-[var(--text-dim)]">
                  {card.mods[part]}/{MAX_MOD_LEVEL}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-faint)]">{t('card.modsWinOnly')}</p>
        </div>

        <h3 className="label mt-5">{t('collection.tabTags')}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {card.tags.map((tag) => (
            <button
              key={tag}
              className="chip"
              onClick={() => game.setTags(card.id, card.tags.filter((x) => x !== tag))}
            >
              #{tag} ✕
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            className="field flex-1"
            value={newTag}
            placeholder={t('collection.newTag')}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
          />
          <button className="btn btn-ghost" onClick={addTag}>
            {t('collection.addTag')}
          </button>
        </div>

        <p className="mt-5 text-[11px] text-[var(--text-faint)]">
          {isGarage
            ? t('garage.locationNever')
            : card.location
              ? t('card.seenAt', { place: formatPlace(card.location) ?? '' })
              : t('card.seenUnknown')}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {card.id !== state.profile.personalRideCardId && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                game.setPersonalRide(card.id)
                flash(t('card.isPersonalRide'))
              }}
            >
              {t('card.setPersonalRide')}
            </button>
          )}
          {isGarage ? (
            <>
              <p className="text-[11px] text-[var(--text-faint)]">{t('garage.noTrade')}</p>
              <button
                className="btn btn-danger"
                onClick={() => {
                  game.releaseGarageCar(card.id)
                  router.replace('/play/garage')
                }}
              >
                {t('garage.release')}
              </button>
              <p className="text-[11px] text-[var(--text-faint)]">{t('garage.releaseHint')}</p>
            </>
          ) : (
            <button className="btn btn-danger" onClick={() => setConfirmScrap(true)}>
              {t('collection.scrap')}
            </button>
          )}
        </div>
      </div>

      <Sheet open={confirmScrap} onClose={() => setConfirmScrap(false)} title={t('collection.scrap')}>
        <p className="text-[13px] leading-relaxed text-[var(--text-dim)]">{t('collection.scrapConfirm')}</p>
        <p className="mt-2 text-[13px] font-semibold">
          {scrapValue(card) > 0
            ? t('collection.scrapReturn', { n: scrapValue(card) })
            : t('collection.scrapNothing')}
        </p>
        <div className="mt-4 flex gap-2">
          <button className="btn btn-quiet flex-1" onClick={() => setConfirmScrap(false)}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-danger flex-1"
            onClick={() => {
              game.scrapCard(card.id)
              router.replace('/play/collection')
            }}
          >
            {t('common.confirm')}
          </button>
        </div>
      </Sheet>

      <Toast message={toast} />
    </Screen>
  )
}
