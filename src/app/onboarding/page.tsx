'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ACCESSORIES, Avatar, DEFAULT_AVATAR, HAIR_COLORS, OUTFITS, SKIN_TONES } from '@/components/Avatar'
import { CarArt } from '@/components/CarArt'
import { LanguageToggle } from '@/components/LanguageToggle'
import { Scanner } from '@/components/Scanner'
import { ProgressBar } from '@/components/ui'
import { carName, catalogCar, STARTER_CAR_IDS } from '@/lib/catalog/cars'
import { requestCameraStream } from '@/lib/game/camera'
import { currentScanLocation } from '@/lib/game/location'
import type { ScanResult } from '@/lib/game/recognition'
import type { Avatar as AvatarData, ScanLocation } from '@/lib/game/types'
import { useT } from '@/lib/i18n'
import { useGame } from '@/state/game'

const STEPS = ['birthday', 'username', 'avatar', 'permissions', 'car', 'garage'] as const
const MIN_AGE = 13

export default function Onboarding() {
  const t = useT()
  const router = useRouter()
  const { status, createPlayer, isUsernameTaken } = useGame()

  const [step, setStep] = useState(0)
  const [birthday, setBirthday] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<AvatarData>(DEFAULT_AVATAR)
  const [camera, setCamera] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const [locationOk, setLocationOk] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [pick, setPick] = useState<{ catalogCarId: string; color: string; location?: ScanLocation } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (status === 'signed-out') router.replace('/welcome')
    else if (status === 'ready') router.replace('/play')
  }, [status, router])

  const age = useMemo(() => {
    if (!birthday) return null
    const d = new Date(birthday)
    if (Number.isNaN(d.getTime())) return null
    const now = new Date()
    let years = now.getFullYear() - d.getFullYear()
    const m = now.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--
    return years
  }, [birthday])

  async function nextFromUsername() {
    const clean = username.trim()
    if (!/^[A-Za-z0-9_]{3,16}$/.test(clean)) {
      setUsernameError(t('onboarding.usernameBad'))
      return
    }
    setBusy(true)
    try {
      if (await isUsernameTaken(clean)) {
        setUsernameError(t('onboarding.usernameTaken'))
        return
      }
      setUsernameError(null)
      setStep(2)
    } finally {
      setBusy(false)
    }
  }

  async function requestCamera() {
    try {
      const stream = await requestCameraStream()
      stream.getTracks().forEach((track) => track.stop())
      setCamera('granted')
    } catch {
      // A browser with no camera, or a refused prompt, should not trap a new
      // player on this step — the scanner asks again when they first scan.
      setCamera('denied')
    }
  }

  function requestLocation() {
    navigator.geolocation?.getCurrentPosition(
      () => setLocationOk(true),
      () => setLocationOk(false),
      { timeout: 5000 },
    )
  }

  async function onScanned(result: ScanResult) {
    const location = await currentScanLocation(locationOk)
    setPick({ catalogCarId: result.catalogCar.id, color: result.color, location })
    setScanning(false)
    setStep(5)
  }

  async function finish(goToGarage: boolean) {
    if (!pick) return
    setBusy(true)
    try {
      await createPlayer({
        username: username.trim(),
        avatar,
        firstCar: { catalogCarId: pick.catalogCarId, color: pick.color, location: pick.location },
      })
      router.replace(goToGarage ? '/play/garage' : '/play')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col px-5 pb-8 pt-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar pct={((step + 1) / STEPS.length) * 100} />
          <p className="mt-1.5 text-[11px] text-[var(--text-faint)]">
            {t('onboarding.step', { n: step + 1, total: STEPS.length })}
          </p>
        </div>
        <LanguageToggle />
      </div>

      {step === 0 && (
        <Step title={t('onboarding.birthday')} hint={t('onboarding.birthdayWhy')}>
          <input
            className="field"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
          {age !== null && age < MIN_AGE && (
            <p className="text-[12px] text-[var(--bad)]">{t('onboarding.tooYoung')}</p>
          )}
          <button
            className="btn btn-primary mt-auto"
            disabled={age === null || age < MIN_AGE}
            onClick={() => setStep(1)}
          >
            {t('common.next')}
          </button>
        </Step>
      )}

      {step === 1 && (
        <Step title={t('onboarding.username')} hint={t('onboarding.usernameHint')}>
          <input
            className="field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            placeholder="apex_hunter"
          />
          {usernameError && <p className="text-[12px] text-[var(--bad)]">{usernameError}</p>}
          <button className="btn btn-primary mt-auto" disabled={busy} onClick={() => void nextFromUsername()}>
            {t('common.next')}
          </button>
        </Step>
      )}

      {step === 2 && (
        <Step title={t('onboarding.avatar')}>
          <div className="flex justify-center py-2">
            <Avatar avatar={avatar} size={128} />
          </div>
          <Swatches label="Skin" colors={SKIN_TONES} value={avatar.skin} onPick={(skin) => setAvatar({ ...avatar, skin })} />
          <Swatches label="Hair" colors={HAIR_COLORS} value={avatar.hair} onPick={(hair) => setAvatar({ ...avatar, hair })} />
          <Swatches label="Outfit" colors={OUTFITS} value={avatar.outfit} onPick={(outfit) => setAvatar({ ...avatar, outfit })} />
          <div>
            <div className="label mb-1.5">Accessory</div>
            <div className="flex flex-wrap gap-2">
              {ACCESSORIES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar({ ...avatar, accessory: a })}
                  className={`chip ${avatar.accessory === a ? 'border-[var(--accent)] text-[var(--accent)]' : ''}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary mt-auto" onClick={() => setStep(3)}>
            {t('common.next')}
          </button>
        </Step>
      )}

      {step === 3 && (
        <Step title={t('onboarding.permissions')}>
          <PermissionRow
            text={t('onboarding.cameraNeeded')}
            granted={camera === 'granted'}
            onGrant={() => void requestCamera()}
            grantLabel={t('onboarding.grant')}
            grantedLabel={t('onboarding.granted')}
          />
          {camera === 'denied' && <p className="text-[12px] text-[var(--bad)]">{t('scan.denied')}</p>}
          <PermissionRow
            text={t('onboarding.locationOptional')}
            granted={locationOk}
            onGrant={requestLocation}
            grantLabel={t('onboarding.grant')}
            grantedLabel={t('onboarding.granted')}
          />
          <button className="btn btn-primary mt-auto" disabled={camera === 'unknown'} onClick={() => setStep(4)}>
            {t('common.next')}
          </button>
        </Step>
      )}

      {step === 4 && !scanning && (
        <Step title={t('onboarding.firstCar')} hint={t('onboarding.firstCarHint')}>
          <div className="flex flex-col gap-2">
            {STARTER_CAR_IDS.map((id) => {
              const car = catalogCar(id)!
              const selected = pick?.catalogCarId === id
              return (
                <button
                  key={id}
                  onClick={() => setPick({ catalogCarId: id, color: '#d92b2b' })}
                  className={`surface flex items-center gap-3 p-2 text-left ${
                    selected ? 'border-[var(--accent)]' : ''
                  }`}
                >
                  <CarArt category={car.category} color={selected ? '#ff8a3d' : '#9aa3b2'} className="h-14 w-24 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-bold">{carName(car)}</div>
                    <div className="tabular text-[12px] text-[var(--text-dim)]">
                      {car.horsepower} hp · {t(`category.${car.category}`)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <button className="btn btn-ghost" onClick={() => setScanning(true)}>
            {t('onboarding.scanInstead')}
          </button>
          <button className="btn btn-primary mt-auto" disabled={!pick} onClick={() => setStep(5)}>
            {t('common.next')}
          </button>
        </Step>
      )}

      {step === 4 && scanning && (
        <Step title={t('scan.title')}>
          <Scanner
            onResult={(r) => {
              if (r) void onScanned(r)
            }}
          />
          <button className="btn btn-quiet" onClick={() => setScanning(false)}>
            {t('common.back')}
          </button>
        </Step>
      )}

      {step === 5 && (
        <Step title={t('onboarding.garagePrompt')} hint={t('onboarding.garageHint')}>
          {pick && (
            <div className="surface flex items-center gap-3 p-3">
              <CarArt
                category={catalogCar(pick.catalogCarId)!.category}
                color={pick.color}
                className="h-16 w-28 shrink-0"
              />
              <div className="min-w-0">
                <div className="label">{t('home.personalRide')}</div>
                <div className="truncate text-[14px] font-bold">{carName(catalogCar(pick.catalogCarId)!)}</div>
              </div>
            </div>
          )}
          <div className="mt-auto flex flex-col gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={() => void finish(false)}>
              {t('onboarding.finish')}
            </button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => void finish(true)}>
              {t('onboarding.addToGarage')}
            </button>
          </div>
        </Step>
      )}
    </main>
  )
}

function Step({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-1 flex-col gap-3">
      <h1 className="text-[22px] font-black tracking-tight">{title}</h1>
      {hint && <p className="text-[13px] leading-relaxed text-[var(--text-dim)]">{hint}</p>}
      {children}
    </section>
  )
}

function Swatches({
  label,
  colors,
  value,
  onPick,
}: {
  label: string
  colors: string[]
  value: string
  onPick: (c: string) => void
}) {
  return (
    <div>
      <div className="label mb-1.5">{label}</div>
      <div className="flex gap-2">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            aria-label={`${label} ${c}`}
            className="h-9 w-9 rounded-full border-2 transition-transform active:scale-95"
            style={{ background: c, borderColor: value === c ? 'var(--accent)' : 'transparent' }}
          />
        ))}
      </div>
    </div>
  )
}

function PermissionRow({
  text,
  granted,
  onGrant,
  grantLabel,
  grantedLabel,
}: {
  text: string
  granted: boolean
  onGrant: () => void
  grantLabel: string
  grantedLabel: string
}) {
  return (
    <div className="surface flex items-center gap-3 p-3">
      <p className="flex-1 text-[13px] leading-relaxed">{text}</p>
      <button className={granted ? 'chip border-[var(--good)] text-[var(--good)]' : 'btn btn-ghost'} onClick={onGrant} disabled={granted}>
        {granted ? grantedLabel : grantLabel}
      </button>
    </div>
  )
}
