'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CarArt } from '@/components/CarArt'
import { catalogCar } from '@/lib/catalog/cars'
import { quarterMileEt, runEt, type RunQuality } from '@/lib/game/performance'
import type { Ghost } from '@/lib/store/rivals'
import type { Card } from '@/lib/game/types'
import { useT } from '@/lib/i18n'

/**
 * A quarter mile in two parts: hold the revs in the green before the lights
 * go out, then catch each shift light. A good driver can take a slightly
 * quicker car, but no amount of skill makes up a real power gap.
 */
const GREEN_LOW = 0.62
const GREEN_HIGH = 0.82
const IDEAL_REVS = 0.72
const LIGHTS_MS = [700, 1400, 2100]
const GREEN_AT_MS = 2900
const SHIFT_POINTS = [0.16, 0.34, 0.54, 0.76]
const SHIFT_WINDOW = 0.055
const NITROUS_WINDOW: [number, number] = [0.42, 0.82]

type Phase = 'stage' | 'running' | 'done'

export type RaceOutcome = {
  playerEt: number
  ghostEt: number
  won: boolean
  quality: RunQuality
  launchLabel: 'perfect' | 'good' | 'bogged' | 'spun'
}

export function RaceGame({
  card,
  ghost,
  onFinish,
}: {
  card: Card
  ghost: Ghost
  onFinish: (outcome: RaceOutcome) => void
}) {
  const t = useT()
  const car = catalogCar(card.catalogCarId)!
  const ghostCar = catalogCar(ghost.catalogCarId)!

  const [phase, setPhase] = useState<Phase>('stage')
  const [revs, setRevs] = useState(0)
  const [lights, setLights] = useState(0)
  const [playerPos, setPlayerPos] = useState(0)
  const [ghostPos, setGhostPos] = useState(0)
  const [shiftOpen, setShiftOpen] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [nitrousLeft, setNitrousLeft] = useState(1)
  const [liveEt, setLiveEt] = useState(() => quarterMileEt(car, card.mods))

  const holding = useRef(false)
  const revsRef = useRef(0)
  const quality = useRef<RunQuality>({ launch: 0, perfectShifts: 0, missedShifts: 0, nitrous: 0 })
  const usedShifts = useRef<boolean[]>(SHIFT_POINTS.map(() => false))
  const raceStart = useRef(0)
  const launchLabel = useRef<RaceOutcome['launchLabel']>('bogged')
  const frame = useRef(0)

  const projectedEt = useCallback(() => runEt(car, card.mods, quality.current), [car, card.mods])

  // ------------------------------------------------------------ staging
  useEffect(() => {
    if (phase !== 'stage') return
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const elapsed = now - start
      setLights(LIGHTS_MS.filter((ms) => elapsed >= ms).length)

      revsRef.current = Math.max(
        0,
        Math.min(1, revsRef.current + (holding.current ? 0.014 : -0.022)),
      )
      setRevs(revsRef.current)

      if (elapsed >= GREEN_AT_MS) {
        const r = revsRef.current
        let launch: number
        if (r > 0.92) {
          launch = 0.45
          launchLabel.current = 'spun'
        } else {
          launch = Math.max(0, 1 - Math.abs(r - IDEAL_REVS) / 0.3)
          launchLabel.current = launch > 0.9 ? 'perfect' : launch > 0.6 ? 'good' : 'bogged'
        }
        quality.current = { ...quality.current, launch }
        setFlash(t(`race.${launchLabel.current === 'spun' ? 'bogged' : launchLabel.current === 'perfect' ? 'perfectLaunch' : launchLabel.current === 'good' ? 'goodLaunch' : 'bogged'}`))
        window.setTimeout(() => setFlash(null), 900)
        raceStart.current = now
        setPhase('running')
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, t])

  // ------------------------------------------------------------- racing
  useEffect(() => {
    if (phase !== 'running') return
    let raf = 0

    const tick = (now: number) => {
      const elapsed = (now - raceStart.current) / 1000
      const et = projectedEt()
      const p = Math.min(1, elapsed / et)
      const g = Math.min(1, elapsed / ghost.et)
      setPlayerPos(p)
      setGhostPos(g)
      setLiveEt(et)
      frame.current = p

      const nextShift = SHIFT_POINTS.findIndex(
        (point, i) => !usedShifts.current[i] && Math.abs(p - point) <= SHIFT_WINDOW,
      )
      setShiftOpen(nextShift >= 0)

      // A shift window that closes unanswered is a missed shift.
      SHIFT_POINTS.forEach((point, i) => {
        if (!usedShifts.current[i] && p > point + SHIFT_WINDOW) {
          usedShifts.current[i] = true
          quality.current = { ...quality.current, missedShifts: quality.current.missedShifts + 1 }
        }
      })

      if (p >= 1 && g >= 1) {
        const playerEt = projectedEt()
        onFinish({
          playerEt,
          ghostEt: ghost.et,
          won: playerEt <= ghost.et,
          quality: quality.current,
          launchLabel: launchLabel.current,
        })
        setPhase('done')
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, ghost.et, onFinish, projectedEt])

  function tapShift() {
    if (phase !== 'running') return
    const p = frame.current
    const idx = SHIFT_POINTS.findIndex(
      (point, i) => !usedShifts.current[i] && Math.abs(p - point) <= SHIFT_WINDOW,
    )
    if (idx >= 0) {
      usedShifts.current[idx] = true
      quality.current = { ...quality.current, perfectShifts: quality.current.perfectShifts + 1 }
      setFlash(t('race.perfectShift'))
    } else {
      quality.current = { ...quality.current, missedShifts: quality.current.missedShifts + 1 }
      setFlash(t('race.missedShift'))
    }
    window.setTimeout(() => setFlash(null), 600)
  }

  function tapNitrous() {
    if (phase !== 'running' || nitrousLeft === 0) return
    const p = frame.current
    const good = p >= NITROUS_WINDOW[0] && p <= NITROUS_WINDOW[1]
    quality.current = { ...quality.current, nitrous: good ? 1 : 0.35 }
    setNitrousLeft(0)
    setFlash(t('race.nitrous'))
    window.setTimeout(() => setFlash(null), 600)
  }

  const inGreen = revs >= GREEN_LOW && revs <= GREEN_HIGH

  return (
    <div className="flex flex-col gap-3">
      {/* track */}
      <div className="relative h-[190px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[linear-gradient(180deg,#11151b_0%,#0a0d11_100%)]">
        <TrackStripes offset={playerPos} />

        <Lane
          top={28}
          pos={playerPos}
          color={card.color}
          category={car.category}
          label={t('showcase.you')}
        />
        <Lane
          top={108}
          pos={ghostPos}
          color={ghost.color}
          category={ghostCar.category}
          label={ghost.username}
          ghostly
        />

        <div className="absolute inset-y-0 right-3 w-1 bg-[repeating-linear-gradient(180deg,#fff_0_8px,#000_8px_16px)] opacity-70" />

        {flash && (
          <div className="pop-in absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[20px] font-black tracking-wide text-[var(--accent)] drop-shadow">
            {flash}
          </div>
        )}
      </div>

      {phase === 'stage' && (
        <>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-4 w-4 rounded-full"
                style={{ background: lights > i ? '#f0b429' : '#232833' }}
              />
            ))}
          </div>

          <RevBar revs={revs} inGreen={inGreen} />
          <p className="text-center text-[12px] text-[var(--text-dim)]">{t('race.holdRevs')}</p>

          <button
            className="btn btn-primary h-16 select-none text-[18px]"
            onPointerDown={() => (holding.current = true)}
            onPointerUp={() => (holding.current = false)}
            onPointerLeave={() => (holding.current = false)}
            onPointerCancel={() => (holding.current = false)}
          >
            {t('race.stage')}
          </button>
        </>
      )}

      {phase === 'running' && (
        <>
          <div className="tabular flex justify-between text-[12px] text-[var(--text-dim)]">
            <span>{Math.round(playerPos * 100)}%</span>
            <span>{liveEt.toFixed(2)}s</span>
          </div>
          <button
            className={`btn h-20 select-none text-[22px] ${shiftOpen ? 'btn-primary' : 'btn-ghost'}`}
            onPointerDown={tapShift}
          >
            {t('race.shift')}
          </button>
          <button
            className="btn btn-ghost h-14 select-none"
            onPointerDown={tapNitrous}
            disabled={nitrousLeft === 0}
            style={nitrousLeft ? { borderColor: 'var(--good)', color: 'var(--good)' } : undefined}
          >
            {t('race.nitrous')}
          </button>
        </>
      )}

      <p className="text-center text-[11px] text-[var(--text-faint)]">
        {t('race.ghost', { name: ghost.username })} · {quarterMileEt(ghostCar).toFixed(2)}s{' '}
        {t('race.ghostHint')}
      </p>
    </div>
  )
}

function Lane({
  top,
  pos,
  color,
  category,
  label,
  ghostly,
}: {
  top: number
  pos: number
  color: string
  category: Parameters<typeof CarArt>[0]['category']
  label: string
  ghostly?: boolean
}) {
  return (
    <div className="absolute left-0 right-0" style={{ top }}>
      <div
        className="relative h-[58px] w-[104px] will-change-transform"
        style={{
          transform: `translateX(calc(${pos * 100}% * 3.1 + 6px))`,
          opacity: ghostly ? 0.55 : 1,
        }}
      >
        <CarArt category={category} color={color} className="h-full w-full" />
      </div>
      <span className="absolute left-2 top-0 text-[9px] font-bold text-[var(--text-faint)]">{label}</span>
    </div>
  )
}

function TrackStripes({ offset }: { offset: number }) {
  return (
    <div
      className="absolute inset-0 opacity-25"
      style={{
        background:
          'repeating-linear-gradient(90deg, transparent 0 56px, rgba(255,255,255,0.25) 56px 60px)',
        transform: `translateX(${-offset * 240}px)`,
      }}
    />
  )
}

function RevBar({ revs, inGreen }: { revs: number; inGreen: boolean }) {
  return (
    <div className="relative h-5 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
      <div
        className="absolute inset-y-0"
        style={{
          left: `${GREEN_LOW * 100}%`,
          width: `${(GREEN_HIGH - GREEN_LOW) * 100}%`,
          background: 'rgba(63,209,122,0.3)',
        }}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${revs * 100}%`,
          background: inGreen ? 'var(--good)' : revs > 0.92 ? 'var(--bad)' : 'var(--accent)',
        }}
      />
    </div>
  )
}
