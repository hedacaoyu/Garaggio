'use client'

import { useI18n } from '@/lib/i18n'

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()
  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] p-0.5">
      {(['en', 'zh'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-3 py-1 text-[12px] font-bold transition-colors ${
            locale === l
              ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
              : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
        >
          {l === 'en' ? 'EN' : '中文'}
        </button>
      ))}
    </div>
  )
}
