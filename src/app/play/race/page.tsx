'use client'

import { useMemo, useState } from 'react'
import { CarCard } from '@/components/CarCard'
import { RaceGame, type RaceOutcome } from '@/components/RaceGame'
import { Empty, Screen, Stat } from '@/components/ui'
import { carName, catalogCar } from '@/lib/catalog/cars'
import { CATEGORY_META } from '@/lib/game/categories'
import { quarterMileEt } from '@/lib/game/performance'
import { RACE_EVENTS, type RaceEvent } from '@/lib/game/race'
import type { Card } from '@/lib/game/types'
import { ghostFor, type Ghost } from '@/lib/store/rivals'
import { number } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { usePlayer } from '@/state/game'

type Stage = 'setup' | 'racing' | 'result'

export default function RacePage() {
  const { t, locale } = useI18n()
  const { state, game } = usePlayer()

  const [source, setSource] = useState<'collection' | 'garage'>('collection')
  const [event, setEvent] = useState<RaceEvent | null>(null)
  const [card, setCard] = useState<Card | null>(null)
  const [stage, setStage] = useState<Stage>('setup')
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const [outcome, setOutcome] = useState<RaceOutcome | null>(null)
  const [reward, setReward] = useState<string | null>(null)

  const eligible = useMemo(() => {
    if (!event) return []
    return state.cards.filter(
      (c) => c.kind === source && catalogCar(c.catalogCarId)?.category === event.category,
    )
  }, [state.cards, source, event])

  const seasonWins = state.races.filter((r) => r.won).length

  function startRace(chosen: Card) {
    const car = catalogCar(chosen.catalogCarId)!
    const playerBest = quarterMileEt(car, chosen.mods)
    setCard(chosen)
    setGhost(ghostFor(car.category, playerBest, `${chosen.id}:${state.races.length}`))
    setStage('racing')
  }

  function finish(result: RaceOutcome) {
    if (!card || !event) return
    const saved = game.recordRace({
      cardId: card.id,
      eventId: event.id,
      playerEt: result.playerEt,
      ghostEt: result.ghostEt,
      won: result.won,
      xpEarned: 0,
      event,
    })
    setOutcome(result)
    setReward(saved.rewardLabel ?? null)
    setStage('result')
  }

  function again() {
    setOutcome(null)
    setReward(null)
    setStage('setup')
    setCard(null)
    setGhost(null)
  }

  // ------------------------------------------------------------- racing
  if (stage === 'racing' && card && ghost) {
    return (
      <Screen title={t('race.title')}>
        <div className="px-5 pt-4">
          <RaceGame card={card} ghost={ghost} onFinish={finish} />
        </div>
      </Screen>
    )
  }

  // ------------------------------------------------------------- result
  if (stage === 'result' && outcome && card) {
    const car = catalogCar(card.catalogCarId)!
    return (
      <Screen title={t('race.title')}>
        <div className="px-5 pt-6">
          <div
            className="pop-in text-center text-[40px] font-black tracking-tight"
            style={{ color: outcome.won ? 'var(--good)' : 'var(--bad)' }}
          >
            {outcome.won ? t('race.won') : t('race.lost')}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Stat label={t('race.yourTime')} value={`${outcome.playerEt.toFixed(2)}s`} hint={carName(car)} />
            <Stat label={t('race.ghostTime')} value={`${outcome.ghostEt.toFixed(2)}s`} />
          </div>

          <div className="surface mt-3 p-3">
            <div className="label">{t('race.reward')}</div>
            <div className="mt-1 text-[14px] font-bold">
              +{number(outcome.won ? 1200 : 250, locale)} XP
              {outcome.won && ` · +${number(event?.octaneReward ?? 0, locale)} Octane`}
            </div>
            <div className="mt-1 text-[13px] text-[var(--accent)]">
              {reward
                ? t(`race.reward${reward === 'turbo' ? 'Turbo' : reward === 'tune' ? 'Tune' : 'Exhaust'}`)
                : t('race.rewardNone')}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip">
              {t(
                outcome.launchLabel === 'perfect'
                  ? 'race.perfectLaunch'
                  : outcome.launchLabel === 'good'
                    ? 'race.goodLaunch'
                    : 'race.bogged',
              )}
            </span>
            <span className="chip">
              {t('race.perfectShift')} ×{outcome.quality.perfectShifts}
            </span>
            {outcome.quality.missedShifts > 0 && (
              <span className="chip border-[var(--bad)] text-[var(--bad)]">
                {t('race.missedShift')} ×{outcome.quality.missedShifts}
              </span>
            )}
          </div>

          <button className="btn btn-primary mt-6 w-full" onClick={again}>
            {t('race.again')}
          </button>
        </div>
      </Screen>
    )
  }

  // -------------------------------------------------------------- setup
  return (
    <Screen title={t('race.title')} back="/play">
      <p className="px-5 pt-3 text-[12px] leading-relaxed text-[var(--text-dim)]">{t('race.blurb')}</p>

      <div className="px-5 pt-4">
        <div className="label mb-1.5">{t('race.pass')}</div>
        <div className="surface flex items-center justify-between gap-3 p-3">
          <div>
            <div className="text-[13px] font-bold">
              {state.profile.premiumPass ? t('race.passPremium') : t('race.passBasic')}
            </div>
            <div className="tabular text-[11px] text-[var(--text-dim)]">
              {t('race.passProgress', { wins: seasonWins })}
            </div>
          </div>
          <span
            className={`chip ${state.profile.premiumPass ? 'border-[var(--gold)] text-[var(--gold)]' : ''}`}
          >
            {state.profile.premiumPass ? t('race.passUnlocked') : t('race.passLocked')}
          </span>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="label mb-1.5">{t('race.chooseSource')}</div>
        <div className="flex gap-2">
          {(['collection', 'garage'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSource(s)
                setCard(null)
              }}
              className={`flex-1 rounded-xl border px-3 py-2 text-[13px] font-bold ${
                source === s
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--line)] text-[var(--text-dim)]'
              }`}
            >
              {s === 'collection' ? t('race.fromCollection') : t('race.fromGarage')}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="label mb-1.5">{t('race.chooseEvent')}</div>
        <div className="flex flex-col gap-2">
          {RACE_EVENTS.map((e) => {
            const meta = CATEGORY_META[e.category]
            const count = state.cards.filter(
              (c) => c.kind === source && catalogCar(c.catalogCarId)?.category === e.category,
            ).length
            return (
              <button
                key={e.id}
                onClick={() => setEvent(e)}
                disabled={count === 0}
                className={`surface flex items-center gap-3 px-3 py-2.5 text-left disabled:opacity-40 ${
                  event?.id === e.id ? 'border-[var(--accent)]' : ''
                }`}
              >
                <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: meta.accent }} />
                <span className="flex-1">
                  <span className="block text-[13px] font-bold">{t(`category.${e.category}`)}</span>
                  <span className="tabular block text-[11px] text-[var(--text-dim)]">
                    {count} · +{e.octaneReward} Octane
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {event && (
        <div className="px-5 pt-4">
          <div className="label mb-1.5">{t('race.chooseCar')}</div>
          {eligible.length === 0 ? (
            <Empty>{t('race.noEligible')}</Empty>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {eligible.map((c) => (
                <CarCard key={c.id} card={c} stat="et" onClick={() => startRace(c)} />
              ))}
            </div>
          )}
        </div>
      )}
    </Screen>
  )
}
