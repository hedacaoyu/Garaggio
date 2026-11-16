'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'
import { en, type DictKey } from './en'
import { zh } from './zh'

export type Locale = 'en' | 'zh'

const DICTS: Record<Locale, Record<DictKey, string>> = { en, zh }
const STORAGE_KEY = 'garaggio.locale'

/*
 * The locale lives in a tiny module-level store rather than in component
 * state. The server has no way to know the stored choice, so the first paint
 * is always English and the store corrects it on subscribe — which keeps
 * hydration consistent without a cascading render.
 */
const listeners = new Set<() => void>()
let current: Locale = 'en'
let initialized = false

function emit() {
  listeners.forEach((l) => l())
}

function detect(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'zh') return stored
  } catch {
    // Storage can be blocked; fall back to the browser's language.
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (!initialized) {
    initialized = true
    const detected = detect()
    if (detected !== current) {
      current = detected
      document.documentElement.lang = current === 'zh' ? 'zh-Hans' : 'en'
      queueMicrotask(emit)
    }
  }
  return () => listeners.delete(listener)
}

function setLocaleValue(next: Locale) {
  if (next === current) return
  current = next
  document.documentElement.lang = next === 'zh' ? 'zh-Hans' : 'en'
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // The choice simply will not persist.
  }
  emit()
}

type Vars = Record<string, string | number>

type I18nValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: DictKey, vars?: Vars) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    () => current,
    () => 'en' as Locale,
  )

  const t = useCallback(
    (key: DictKey, vars?: Vars) => interpolate(DICTS[locale][key] ?? en[key] ?? key, vars),
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale: setLocaleValue, t }), [locale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/** Convenience for components that only need the translate function. */
export function useT() {
  return useI18n().t
}

export type { DictKey }
