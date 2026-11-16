'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LanguageToggle } from '@/components/LanguageToggle'
import { Screen, Sheet } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { useGame } from '@/state/game'

export default function SettingsPage() {
  const t = useT()
  const router = useRouter()
  const { store, session, signOut, deleteAccount } = useGame()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <Screen title={t('settings.title')} back="/play/profile">
      <div className="flex flex-col gap-3 px-5 pt-4">
        <Row label={t('settings.language')}>
          <LanguageToggle />
        </Row>

        <section className="surface p-3">
          <div className="label">{t('settings.storage')}</div>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-dim)]">
            {store.mode === 'supabase' ? t('settings.storageSupabase') : t('settings.storageLocal')}
          </p>
          {session?.email && (
            <p className="tabular mt-1 text-[11px] text-[var(--text-faint)]">{session.email}</p>
          )}
        </section>

        <section className="surface p-3">
          <div className="label">{t('settings.privacy')}</div>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-dim)]">
            {t('settings.privacyLocation')}
          </p>
        </section>

        <section className="surface p-3 opacity-60">
          <div className="label">{t('settings.notifications')}</div>
          <p className="mt-1 text-[12px] text-[var(--text-dim)]">{t('shop.packsSoon')}</p>
        </section>

        <button
          className="btn btn-ghost"
          onClick={() => {
            void signOut().then(() => router.replace('/welcome'))
          }}
        >
          {t('auth.signOut')}
        </button>

        <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
          {store.mode === 'supabase' ? t('settings.deleteAccount') : t('settings.resetLocal')}
        </button>
      </div>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={store.mode === 'supabase' ? t('settings.deleteAccount') : t('settings.resetLocal')}
      >
        <p className="text-[13px] leading-relaxed text-[var(--text-dim)]">{t('settings.deleteWarning')}</p>
        <div className="mt-4 flex gap-2">
          <button className="btn btn-quiet flex-1" onClick={() => setConfirmDelete(false)}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-danger flex-1"
            onClick={() => {
              void deleteAccount().then(() => router.replace('/welcome'))
            }}
          >
            {t('common.confirm')}
          </button>
        </div>
      </Sheet>
    </Screen>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="surface flex items-center justify-between gap-3 p-3">
      <span className="text-[13px] font-semibold">{label}</span>
      {children}
    </section>
  )
}
