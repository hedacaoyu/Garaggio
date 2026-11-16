'use client'

import { useEffect, useMemo, useState } from 'react'
import { CarCard } from '@/components/CarCard'
import { Empty, Screen, Sheet } from '@/components/ui'
import { boardUnit, eligibleCards, SHOWCASE_BOARDS } from '@/lib/game/showcase'
import type { ShowcaseBoardId } from '@/lib/game/types'
import { msUntilWeekReset } from '@/lib/store/rivals'
import type { LeaderRow } from '@/lib/store/types'
import { money, number } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { usePlayer } from '@/state/game'

export default function ShowcasePage() {
  const { t, locale } = useI18n()
  const { state, game } = usePlayer()
  const [board, setBoard] = useState<ShowcaseBoardId>('best_collection')
  const [loaded, setLoaded] = useState<{
    board: ShowcaseBoardId
    rows: LeaderRow[]
    resetMs: number
  } | null>(null)
  const [picking, setPicking] = useState(false)
  const rows = loaded?.board === board ? loaded.rows : null

  const entry = state.showcase.find((e) => e.boardId === board)
  const eligible = useMemo(() => eligibleCards(board, state), [board, state])

  useEffect(() => {
    let cancelled = false
    game
      .loadLeaderboard(board)
      .then((r) => {
        if (!cancelled) setLoaded({ board, rows: r, resetMs: msUntilWeekReset() })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ board, rows: [], resetMs: msUntilWeekReset() })
      })
    return () => {
      cancelled = true
    }
  }, [board, game, state.showcase])

  const reset = loaded?.resetMs ?? 0
  const days = Math.floor(reset / 86_400_000)
  const hours = Math.floor((reset % 86_400_000) / 3_600_000)

  function formatScore(score: number): string {
    const unit = boardUnit(board)
    if (unit === 'usd') return money(score, locale)
    if (unit === 'et') return `${(16 - score / 1000).toFixed(2)}s`
    return number(Math.round(score), locale)
  }

  return (
    <Screen title={t('showcase.title')} back="/play">
      <p className="px-5 pt-3 text-[12px] leading-relaxed text-[var(--text-dim)]">{t('showcase.blurb')}</p>
      <p className="tabular px-5 pt-1 text-[11px] text-[var(--text-faint)]">
        {t('showcase.resetsIn', { days, hours })}
      </p>

      <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto px-5">
        {SHOWCASE_BOARDS.map((b) => (
          <button
            key={b}
            onClick={() => setBoard(b)}
            className={`chip shrink-0 ${board === b ? 'border-[var(--accent)] text-[var(--accent)]' : ''}`}
          >
            {t(`showcase.board.${b}`)}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4">
        <div className="surface flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="label">{t('showcase.yourEntry')}</div>
            <div className="truncate text-[13px] font-bold">
              {entry
                ? (rows?.find((r) => r.isYou)?.carLabel ?? formatScore(entry.score))
                : t('showcase.unranked')}
            </div>
            {entry && (
              <div className="tabular text-[11px] text-[var(--text-dim)]">
                {t('showcase.score')} {formatScore(entry.score)}
              </div>
            )}
          </div>
          {entry ? (
            <button className="btn btn-quiet" onClick={() => game.withdrawShowcase(board)}>
              {t('showcase.withdraw')}
            </button>
          ) : (
            <button className="btn btn-primary" disabled={eligible.length === 0} onClick={() => setPicking(true)}>
              {t('showcase.enter')}
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-[var(--text-faint)]">
          {board === 'best_garage' ? t('showcase.verifiedOnly') : t('showcase.oneEach')}
        </p>
      </div>

      <div className="mt-4 px-5">
        {rows === null ? (
          <p className="text-[12px] text-[var(--text-faint)]">{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <Empty>{t('showcase.unranked')}</Empty>
        ) : (
          <ol className="flex flex-col gap-1">
            {rows.map((row) => (
              <li
                key={`${row.rank}-${row.username}`}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                  row.isYou
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-transparent bg-[var(--bg-raised)]'
                }`}
              >
                <span className="tabular w-7 shrink-0 text-right text-[13px] font-black text-[var(--text-faint)]">
                  {row.rank}
                </span>
                <span className="h-7 w-2 shrink-0 rounded-full" style={{ background: row.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold">
                    {row.isYou ? t('showcase.you') : row.username}
                  </span>
                  <span className="block truncate text-[11px] text-[var(--text-dim)]">{row.carLabel}</span>
                </span>
                <span className="tabular shrink-0 text-[12px] font-bold">{formatScore(row.score)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Sheet open={picking} onClose={() => setPicking(false)} title={t('showcase.enter')}>
        <div className="grid grid-cols-2 gap-2">
          {eligible.map((card) => (
            <CarCard
              key={card.id}
              card={card}
              stat={board === 'fastest_car' ? 'et' : 'value'}
              onClick={() => {
                game.submitShowcase(board, card.id)
                setPicking(false)
              }}
            />
          ))}
        </div>
      </Sheet>
    </Screen>
  )
}
