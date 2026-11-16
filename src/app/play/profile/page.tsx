'use client'

import Link from 'next/link'
import { Avatar } from '@/components/Avatar'
import { ProgressBar, Screen, Stat } from '@/components/ui'
import { BADGES, badgeTier } from '@/lib/game/badges'
import { levelProgress } from '@/lib/game/progression'
import { collectionCount, collectionValue } from '@/lib/game/rules'
import { money, number } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { usePlayer } from '@/state/game'

const TIER_COLOR: Record<string, string> = {
  none: 'var(--line-strong)',
  bronze: '#c08457',
  silver: '#c9ccd1',
  gold: 'var(--gold)',
  platinum: '#8fe3ff',
}

export default function ProfilePage() {
  const { t, locale } = useI18n()
  const { state } = usePlayer()
  const progress = levelProgress(state)

  const countries = new Set(state.cards.map((c) => c.location?.country).filter(Boolean)).size

  return (
    <Screen
      title={t('profile.title')}
      back="/play"
      action={
        <Link href="/play/settings" className="text-[var(--text-dim)] hover:text-[var(--accent)]" aria-label={t('nav.settings')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.2A1.6 1.6 0 0 0 7.9 19l-.1.1A2 2 0 1 1 5 16.3l.1-.1A1.6 1.6 0 0 0 4 13.5H4a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 5.6 7l-.1-.1A2 2 0 1 1 8.3 4l.1.1A1.6 1.6 0 0 0 11 3V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1A2 2 0 1 1 20.6 7l-.1.1a1.6 1.6 0 0 0 1.1 2.7H22a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" />
          </svg>
        </Link>
      }
    >
      <div className="flex items-center gap-4 px-5 pt-4">
        <Avatar avatar={state.profile.avatar} size={72} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[20px] font-black tracking-tight">{state.profile.username}</div>
          <div className="mt-1 text-[12px] text-[var(--text-dim)]">
            {t('home.level', { n: state.profile.level })} ·{' '}
            <span className="tabular text-[var(--gold)]">{number(state.profile.octane, locale)} Octane</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        <ProgressBar pct={progress.pct} />
        <p className="tabular mt-1.5 text-[11px] text-[var(--text-faint)]">
          {t('profile.xpToNext', {
            into: number(progress.xpIntoLevel, locale),
            need: number(progress.xpForLevel, locale),
            next: state.profile.level + 1,
          })}
        </p>
        {progress.blockedBy && (
          <div className="surface mt-2 border-[var(--gold)] p-3">
            <p className="text-[12px] leading-relaxed">
              {t('profile.gateBlocked', {
                next: state.profile.level + 1,
                count: progress.blockedBy.count,
                category: t(`category.${progress.blockedBy.category}`),
                have: progress.blockedBy.have,
              })}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-faint)]">{t('profile.gateHint')}</p>
          </div>
        )}
      </div>

      <h2 className="label px-5 pt-6">{t('profile.stats')}</h2>
      <div className="grid grid-cols-2 gap-2 px-5 pt-2">
        <Stat label={t('profile.statCars')} value={number(collectionCount(state), locale)} />
        <Stat label={t('profile.statModels')} value={number(state.cardex.length, locale)} />
        <Stat label={t('profile.statRaces')} value={number(state.races.filter((r) => r.won).length, locale)} />
        <Stat label={t('profile.statValue')} value={money(collectionValue(state), locale)} />
        <div className="col-span-2">
          <Stat label={t('profile.statCountries')} value={number(countries, locale)} />
        </div>
      </div>

      <h2 className="label px-5 pt-6">{t('profile.badges')}</h2>
      <div className="grid grid-cols-2 gap-2 px-5 pt-2">
        {BADGES.map((badge) => {
          const { tier, value, next } = badgeTier(badge, state)
          return (
            <div key={badge.id} className="surface p-3" style={{ borderColor: TIER_COLOR[tier] }}>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: TIER_COLOR[tier] }} />
                <span className="text-[11px] font-bold" style={{ color: TIER_COLOR[tier] }}>
                  {t(`badge.tier.${tier}`)}
                </span>
              </div>
              <div className="mt-1 text-[12px] font-semibold leading-tight">{t(`badge.${badge.id}`)}</div>
              <div className="tabular mt-1 text-[11px] text-[var(--text-dim)]">
                {next ? t('badge.next', { have: value, need: next }) : number(value, locale)}
              </div>
            </div>
          )
        })}
      </div>

      <h2 className="label px-5 pt-6">{t('profile.friends')}</h2>
      <p className="px-5 pt-2 text-[12px] leading-relaxed text-[var(--text-dim)]">{t('profile.friendsSoon')}</p>
    </Screen>
  )
}
