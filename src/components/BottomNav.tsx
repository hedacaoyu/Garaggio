'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { Sheet } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { usePlayer } from '@/state/game'

const KEY_LINKS = [
  { href: '/play/cardex', key: 'nav.cardex', icon: 'book' },
  { href: '/play/race', key: 'nav.race', icon: 'flag' },
  { href: '/play/showcase', key: 'nav.showcase', icon: 'trophy' },
  { href: '/play/collection', key: 'nav.collection', icon: 'cards' },
  { href: '/play/garage', key: 'nav.garage', icon: 'garage' },
] as const

/** Avatar, keys, race flag — the three the design puts on the home bar. */
export function BottomNav() {
  const t = useT()
  const router = useRouter()
  const { state } = usePlayer()
  const [menu, setMenu] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[460px] -translate-x-1/2 border-t border-[var(--line)] bg-[var(--bg)]/95 px-6 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link href="/play/profile" className="flex flex-col items-center gap-1" aria-label={t('nav.profile')}>
            <Avatar avatar={state.profile.avatar} size={34} />
            <span className="text-[10px] font-semibold text-[var(--text-faint)]">{t('nav.profile')}</span>
          </Link>

          <button
            onClick={() => setMenu(true)}
            aria-label={t('nav.menu')}
            className="-mt-6 flex h-[58px] w-[58px] items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--bg-raised)] shadow-[var(--shadow)] transition-transform active:scale-95"
          >
            <KeyIcon />
          </button>

          <Link href="/play/events" className="flex flex-col items-center gap-1" aria-label={t('nav.events')}>
            <FlagIcon />
            <span className="text-[10px] font-semibold text-[var(--text-faint)]">{t('nav.events')}</span>
          </Link>
        </div>
      </nav>

      <Sheet open={menu} onClose={() => setMenu(false)} title={t('nav.menu')}>
        <div className="grid grid-cols-2 gap-2">
          {KEY_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => {
                setMenu(false)
                router.push(link.href)
              }}
              className="surface flex flex-col items-start gap-2 p-3.5 text-left transition-colors hover:border-[var(--accent)]"
            >
              <MenuIcon name={link.icon} />
              <span className="text-[13px] font-bold">{t(link.key)}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}

function KeyIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
      <circle cx="8" cy="8" r="4.5" />
      <path d="M11.5 11.5L20 20M17 17l2-2M14.5 14.5l2-2" strokeLinecap="round" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2">
      <path d="M5 21V4" strokeLinecap="round" />
      <path d="M5 5h13l-2.5 4L18 13H5z" strokeLinejoin="round" />
    </svg>
  )
}

function MenuIcon({ name }: { name: string }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'var(--accent)', strokeWidth: 2 }
  switch (name) {
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" strokeLinejoin="round" />
          <path d="M8 7h7M8 11h7" strokeLinecap="round" />
        </svg>
      )
    case 'flag':
      return (
        <svg {...common}>
          <path d="M5 21V4" strokeLinecap="round" />
          <path d="M5 5h13l-2.5 4L18 13H5z" strokeLinejoin="round" />
        </svg>
      )
    case 'trophy':
      return (
        <svg {...common}>
          <path d="M7 4h10v5a5 5 0 0 1-10 0z" strokeLinejoin="round" />
          <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M10 19h4M12 14v5" strokeLinecap="round" />
        </svg>
      )
    case 'cards':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="12" height="14" rx="2" />
          <path d="M8 3h10a2 2 0 0 1 2 2v12" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M3 10l9-6 9 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />
          <path d="M7 21v-6h10v6" strokeLinecap="round" />
        </svg>
      )
  }
}
