'use client'

import Link from 'next/link'
import { type ReactNode, useEffect } from 'react'

export function Screen({
  title,
  action,
  children,
  back,
}: {
  title?: string
  action?: ReactNode
  back?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      {title && (
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--line)] bg-[var(--bg)]/95 px-4 py-3 backdrop-blur">
          {back && (
            <Link href={back} className="text-[var(--text-dim)] hover:text-[var(--accent)]" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
          <h1 className="flex-1 text-[17px] font-bold tracking-tight">{title}</h1>
          {action}
        </header>
      )}
      <div className="flex-1 pb-28">{children}</div>
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 sm:items-center sm:px-4">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="pop-in relative z-10 max-h-[85dvh] w-full max-w-[460px] overflow-y-auto rounded-t-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 sm:rounded-2xl">
        {title && <h2 className="mb-3 text-[16px] font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="surface px-3 py-2.5">
      <div className="label">{label}</div>
      <div className="tabular mt-0.5 text-[15px] font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-[var(--text-faint)]">{hint}</div>}
    </div>
  )
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-4 mt-10 rounded-2xl border border-dashed border-[var(--line-strong)] px-6 py-10 text-center">
      <p className="text-[14px] leading-relaxed text-[var(--text-dim)]">{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function ProgressBar({ pct, tone = 'accent' }: { pct: number; tone?: 'accent' | 'good' | 'gold' }) {
  const color = tone === 'good' ? 'var(--good)' : tone === 'gold' ? 'var(--gold)' : 'var(--accent)'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
      />
    </div>
  )
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="pop-in fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--line-strong)] bg-[var(--bg-raised)] px-4 py-2 text-[13px] font-semibold shadow-[var(--shadow)]">
      {message}
    </div>
  )
}
