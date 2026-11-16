'use client'

import { Screen } from '@/components/ui'
import { useT } from '@/lib/i18n'

/**
 * Placeholder for the curated feed of car meets and shows. Kept as a screen so
 * the bottom bar matches the design, and so the shape of an event is already
 * decided when the real feed arrives.
 */
const SAMPLE_EVENTS = [
  { name: 'Monterey Car Week', place: 'Monterey, United States', month: 'August' },
  { name: 'Vancouver International Auto Show', place: 'Vancouver, Canada', month: 'March' },
  { name: 'Goodwood Festival of Speed', place: 'Chichester, United Kingdom', month: 'July' },
  { name: 'Tokyo Auto Salon', place: 'Chiba, Japan', month: 'January' },
]

export default function EventsPage() {
  const t = useT()
  return (
    <Screen title={t('events.title')} back="/play">
      <p className="px-5 pt-3 text-[12px] leading-relaxed text-[var(--text-dim)]">{t('events.blurb')}</p>

      <div className="mt-3 flex flex-col gap-2 px-5">
        {SAMPLE_EVENTS.map((event) => (
          <div key={event.name} className="surface flex items-center gap-3 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-sunken)] text-[11px] font-black text-[var(--accent)]">
              {event.month.slice(0, 3).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold">{event.name}</span>
              <span className="block truncate text-[11px] text-[var(--text-dim)]">{event.place}</span>
            </span>
          </div>
        ))}
      </div>

      <p className="px-5 pt-4 text-[11px] text-[var(--text-faint)]">{t('events.soon')}</p>
    </Screen>
  )
}
