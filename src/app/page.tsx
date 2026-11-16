'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useGame } from '@/state/game'
import { useT } from '@/lib/i18n'

/** Sends the player wherever they left off. */
export default function Gate() {
  const { status } = useGame()
  const router = useRouter()
  const t = useT()

  useEffect(() => {
    if (status === 'signed-out') router.replace('/welcome')
    else if (status === 'needs-onboarding') router.replace('/onboarding')
    else if (status === 'ready') router.replace('/play')
  }, [status, router])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4">
      <div className="text-[28px] font-black tracking-tight">
        GARAG<span className="text-[var(--accent)]">GIO</span>
      </div>
      <div className="text-[13px] text-[var(--text-faint)]">{t('common.loading')}</div>
    </div>
  )
}
