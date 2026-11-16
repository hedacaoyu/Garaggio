'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LanguageToggle } from '@/components/LanguageToggle'
import { useT } from '@/lib/i18n'
import { supabaseConfigured } from '@/lib/store'
import { useGame } from '@/state/game'

type Mode = 'choose' | 'signup' | 'signin'

export default function Welcome() {
  const t = useT()
  const router = useRouter()
  const { status, signIn, signUp, playLocally } = useGame()
  const [mode, setMode] = useState<Mode>('choose')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'ready') router.replace('/play')
    else if (status === 'needs-onboarding') router.replace('/onboarding')
  }, [status, router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signup') {
        const { needsConfirm } = await signUp(email, password)
        if (needsConfirm) {
          setNotice(t('auth.checkInbox'))
          setMode('signin')
        }
      } else {
        await signIn(email, password)
      }
    } catch {
      setError(t('auth.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col px-6 pb-10 pt-6">
      <div className="flex justify-end">
        <LanguageToggle />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className="text-[36px] font-black leading-none tracking-tight">
          GARAG<span className="text-[var(--accent)]">GIO</span>
        </div>
        <p className="mt-3 max-w-[22rem] text-[14px] leading-relaxed text-[var(--text-dim)]">
          {t('welcome.blurb')}
        </p>
      </div>

      {mode === 'choose' ? (
        <div className="flex flex-col gap-2.5">
          <button className="btn btn-primary" onClick={() => setMode('signup')}>
            {t('welcome.newPlayer')}
          </button>
          <button className="btn btn-ghost" onClick={() => setMode('signin')}>
            {t('welcome.returning')}
          </button>
          <button className="btn btn-quiet" onClick={() => void playLocally()}>
            {t('auth.localMode')}
          </button>
          <p className="mt-1 text-center text-[11px] text-[var(--text-faint)]">
            {t('auth.localModeHint')}
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-2.5" onSubmit={submit}>
          <button type="button" className="btn btn-ghost" disabled title={t('auth.providerSoon')}>
            {t('auth.withApple')}
          </button>
          <button type="button" className="btn btn-ghost" disabled title={t('auth.providerSoon')}>
            {t('auth.withGoogle')}
          </button>
          <div className="my-1 h-px bg-[var(--line)]" />

          {!supabaseConfigured && (
            <p className="rounded-xl border border-[var(--line-strong)] bg-[var(--bg-raised)] p-3 text-[12px] leading-relaxed text-[var(--text-dim)]">
              Supabase is not configured in this build, so email accounts are unavailable. Add
              <span className="tabular"> NEXT_PUBLIC_SUPABASE_URL </span> and
              <span className="tabular"> NEXT_PUBLIC_SUPABASE_ANON_KEY </span> to
              <span className="tabular"> .env.local</span>, or play locally.
            </p>
          )}

          <input
            className="field"
            type="email"
            autoComplete="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="field"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {notice && <p className="text-[12px] text-[var(--good)]">{notice}</p>}
          {error && <p className="text-[12px] text-[var(--bad)]">{error}</p>}

          <button className="btn btn-primary" disabled={busy || !supabaseConfigured}>
            {mode === 'signup' ? t('auth.signUp') : t('auth.signIn')}
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setMode('choose')}>
            {t('common.back')}
          </button>
        </form>
      )}
    </main>
  )
}
