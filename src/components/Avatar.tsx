'use client'

import type { Avatar as AvatarData } from '@/lib/game/types'

export const SKIN_TONES = ['#f1c7a4', '#dba378', '#b4764a', '#8a5433', '#5c3722']
export const HAIR_COLORS = ['#1b1b1f', '#4a3222', '#a8681f', '#d9d2c5', '#8b2f8b']
export const OUTFITS = ['#ff8a3d', '#1f6feb', '#3fd17a', '#e8e8ea', '#7b61ff', '#d92b2b']
export const ACCESSORIES = ['none', 'shades', 'cap', 'gloves'] as const

export const DEFAULT_AVATAR: AvatarData = {
  skin: SKIN_TONES[1],
  hair: HAIR_COLORS[0],
  outfit: OUTFITS[0],
  accessory: 'shades',
}

/**
 * A small, cheap stand-in for the animated avatar in the design. It is built
 * from the same four choices the real one will have, so profile data made now
 * stays valid later.
 */
export function Avatar({ avatar, size = 48 }: { avatar: AvatarData; size?: number }) {
  const a = { ...DEFAULT_AVATAR, ...avatar }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="var(--bg-sunken)" />
      {/* shoulders */}
      <path d="M10 64 Q10 44 32 44 Q54 44 54 64 Z" fill={a.outfit} />
      {/* head */}
      <circle cx="32" cy="27" r="14" fill={a.skin} />
      {/* hair */}
      <path d="M18 25 Q20 12 32 12 Q44 12 46 25 Q40 18 32 18 Q24 18 18 25 Z" fill={a.hair} />
      {a.accessory === 'cap' && (
        <path d="M17 23 Q19 9 32 9 Q45 9 47 23 L50 25 L14 25 Z" fill={a.outfit} />
      )}
      {a.accessory === 'shades' ? (
        <g fill="#13161b">
          <rect x="21" y="25" width="9" height="6" rx="2" />
          <rect x="34" y="25" width="9" height="6" rx="2" />
          <rect x="30" y="27" width="4" height="1.6" />
        </g>
      ) : (
        <g fill="#13161b">
          <circle cx="26" cy="28" r="1.8" />
          <circle cx="38" cy="28" r="1.8" />
        </g>
      )}
      {a.accessory === 'gloves' && (
        <g fill="#13161b">
          <circle cx="14" cy="56" r="5" />
          <circle cx="50" cy="56" r="5" />
        </g>
      )}
    </svg>
  )
}
