'use client'

import { useId } from 'react'
import { CATEGORY_META } from '@/lib/game/categories'
import type { Category } from '@/lib/game/types'

/**
 * Cards show a clean silhouette of the car, tinted with the colour it was
 * seen in — never the player's own photo. Until a model gets drawn properly,
 * this stands in for it, so every card looks like part of the same set.
 */
type Shape = {
  body: string
  glass: string
  wheels: [number, number]
  wheelR: number
  accentLine: string
}

const SHAPES: Record<ReturnType<() => Category> extends never ? never : string, Shape> = {
  // Mid-engine wedge: hypercars and supercars.
  wedge: {
    body: 'M18 120 L34 102 Q70 90 112 86 L150 62 Q196 50 252 54 L300 70 Q352 80 382 96 L388 112 L384 124 L330 128 L96 128 L22 126 Z',
    glass: 'M136 84 L162 66 Q198 57 244 60 L276 74 Z',
    wheels: [100, 316],
    wheelR: 27,
    accentLine: 'M40 108 Q180 96 378 104',
  },
  // Front-engine coupe: sports cars.
  coupe: {
    body: 'M20 118 L36 96 Q78 84 118 80 L164 54 Q220 44 272 52 L318 82 Q360 88 384 100 L388 116 L380 128 L92 128 L24 126 Z',
    glass: 'M146 78 L178 58 Q222 50 264 57 L300 80 Z',
    wheels: [102, 312],
    wheelR: 28,
    accentLine: 'M42 104 Q190 92 378 106',
  },
  sedan: {
    body: 'M16 116 L30 94 Q70 82 112 78 L156 50 Q226 40 292 50 L336 80 Q372 86 390 98 L392 116 L384 128 L88 128 L20 126 Z',
    glass: 'M140 76 L172 56 Q226 47 284 55 L318 78 Z',
    wheels: [96, 318],
    wheelR: 28,
    accentLine: 'M38 102 Q196 90 384 104',
  },
  suv: {
    body: 'M16 116 L26 78 Q62 62 118 56 L150 36 Q232 28 302 38 L330 58 Q374 66 392 82 L394 116 L384 130 L86 130 L20 128 Z',
    glass: 'M138 58 L160 40 Q232 33 296 41 L316 60 Z',
    wheels: [98, 318],
    wheelR: 32,
    accentLine: 'M34 94 Q196 84 388 96',
  },
  muscle: {
    body: 'M14 118 L26 92 Q72 80 122 78 L170 56 Q232 48 286 58 L324 82 Q368 88 392 100 L394 118 L384 130 L86 130 L18 128 Z',
    glass: 'M152 76 L186 60 Q232 53 278 61 L306 78 Z',
    wheels: [100, 316],
    wheelR: 30,
    accentLine: 'M36 106 Q196 94 386 106',
  },
}

export function CarArt({
  category,
  color,
  className,
  flat = false,
}: {
  category: Category
  color: string
  className?: string
  flat?: boolean
}) {
  const id = useId()
  const shape = SHAPES[CATEGORY_META[category].silhouette]
  const bodyFill = flat ? color : `url(#${id}-body)`

  return (
    <svg viewBox="0 0 410 160" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="58%" stopColor={color} stopOpacity="0.92" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="205" cy="140" rx="180" ry="14" fill={`url(#${id}-shadow)`} />

      <path d={shape.body} fill={bodyFill} stroke="rgb(0 0 0 / 35%)" strokeWidth="2" />
      <path d={shape.glass} fill="#0d1117" opacity="0.88" />
      <path
        d={shape.accentLine}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.22"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {shape.wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={122} r={shape.wheelR} fill="#0a0c10" />
          <circle cx={cx} cy={122} r={shape.wheelR * 0.56} fill="#2b313c" />
          <circle cx={cx} cy={122} r={shape.wheelR * 0.22} fill="#4b5465" />
        </g>
      ))}
    </svg>
  )
}
