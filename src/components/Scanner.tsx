'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { requestCameraStream } from '@/lib/game/camera'
import { mockRecognizer, type ScanResult } from '@/lib/game/recognition'
import { useT } from '@/lib/i18n'

type Phase = 'idle' | 'starting' | 'live' | 'denied' | 'identifying'

/**
 * The camera is real; only the match is simulated for now. Uploads are not
 * accepted on purpose — scanning a photo off the internet would be the first
 * thing anyone tried.
 */
export function Scanner({
  onResult,
  preferId,
  autoStart = true,
  captureLabel,
  /** Photo-only mode: grab the frame, skip recognition (used for VIN stickers). */
  photoOnly = false,
}: {
  onResult: (result: ScanResult | null, frame: Blob | null) => void
  preferId?: string
  autoStart?: boolean
  captureLabel?: string
  photoOnly?: boolean
}) {
  const t = useT()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<Phase>(autoStart ? 'starting' : 'idle')

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  /**
   * Written with `.then` rather than `await` on purpose: the camera is an
   * external system, and the state change belongs in its callback.
   */
  const start = useCallback(() => {
    requestCameraStream({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      audio: false,
    })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play().catch(() => undefined)
        }
        setPhase('live')
      })
      .catch(() => setPhase('denied'))
  }, [])

  useEffect(() => {
    if (autoStart) start()
    return stop
  }, [autoStart, start, stop])

  async function capture() {
    if (phase !== 'live') return
    setPhase('identifying')
    const frame = await grabFrame(videoRef.current)
    if (photoOnly) {
      stop()
      onResult(null, frame)
      return
    }
    const result = await mockRecognizer.identify(frame ?? new Blob())
    // Onboarding biases the roll so the first scan feels like a win.
    const final = preferId ? { ...mockRecognizer.identifySync({ preferId }), color: result.color } : result
    stop()
    onResult(final, frame)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-sunken)]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ opacity: phase === 'live' || phase === 'identifying' ? 1 : 0 }}
        />

        {/* viewfinder */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-6 rounded-xl border-2 border-white/25" />
          <div className="absolute inset-x-6 top-1/2 h-px bg-[var(--accent)]/70" />
        </div>

        {phase === 'identifying' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
              {!photoOnly && <span className="text-[13px] font-semibold">{t('scan.identifying')}</span>}
            </div>
          </div>
        )}

        {(phase === 'idle' || phase === 'starting' || phase === 'denied') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-[13px] leading-relaxed text-[var(--text-dim)]">
              {phase === 'denied' ? t('scan.denied') : t('scan.permission')}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setPhase('starting')
                start()
              }}
              disabled={phase === 'starting'}
            >
              {phase === 'starting' ? t('common.loading') : t('scan.enable')}
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-[var(--text-faint)]">{t('scan.liveOnly')}</p>

      {/*
        Development escape hatch: without it there is no way to walk the loop
        on a machine with no camera. It is compiled out of production builds,
        where live capture is the only way in.
      */}
      {process.env.NODE_ENV !== 'production' && phase === 'denied' && (
        <button
          className="btn btn-quiet w-full"
          onClick={() => {
            if (photoOnly) {
              onResult(null, null)
              return
            }
            onResult(mockRecognizer.identifySync(preferId ? { preferId } : {}), null)
          }}
        >
          {t('scan.devSimulate')}
        </button>
      )}

      <button
        className="btn btn-primary w-full"
        onClick={() => void capture()}
        disabled={phase !== 'live'}
      >
        {captureLabel ?? t('scan.capture')}
      </button>
    </div>
  )
}

async function grabFrame(video: HTMLVideoElement | null): Promise<Blob | null> {
  if (!video || !video.videoWidth) return null
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(video, 0, 0)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85))
}
