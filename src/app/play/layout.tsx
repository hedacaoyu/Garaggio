'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { useT } from '@/lib/i18n'
import { useGame } from '@/state/game'

/** Everything under /play needs a loaded player. */
export default function PlayLayout({ children }: { children: React.ReactNode }) {
  const { status } = useGame()
  const router = useRouter()
  const t = useT()

  useEffect(() => {
    if (status === 'signed-out') router.replace('/welcome')
    else if (status === 'needs-onboarding') router.replace('/onboarding')
  }, [status, router])

  if (status !== 'ready') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-[13px] text-[var(--text-faint)]">
        {t('common.loading')}
      </div>
    )
  }

  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}
