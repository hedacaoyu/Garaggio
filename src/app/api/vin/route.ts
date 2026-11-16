import { NextResponse } from 'next/server'
import { validateVin } from '@/lib/game/vin'

/**
 * Proxies NHTSA vPIC, which is free, needs no key, and is the authority for
 * US-market VINs. Going through the server keeps CORS out of the picture and
 * leaves one place to swap in a different decoder for other markets.
 */
const VPIC = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues'

type VpicRow = {
  Make?: string
  Model?: string
  Trim?: string
  Series?: string
  ModelYear?: string
  ErrorCode?: string
  ErrorText?: string
}

export async function GET(request: Request) {
  const vin = (new URL(request.url).searchParams.get('vin') ?? '').trim().toUpperCase()
  const check = validateVin(vin)
  if (!check.ok) {
    return NextResponse.json({ error: 'invalid_vin', reason: check.reason }, { status: 400 })
  }

  try {
    const res = await fetch(`${VPIC}/${encodeURIComponent(vin)}?format=json`, {
      headers: { accept: 'application/json' },
      // Decoded VIN data for a given VIN does not change.
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!res.ok) return NextResponse.json({ error: 'decoder_unavailable' }, { status: 502 })

    const body = (await res.json()) as { Results?: VpicRow[] }
    const row = body.Results?.[0]
    if (!row?.Make || !row.Model) {
      return NextResponse.json({ error: 'not_decoded' }, { status: 404 })
    }

    return NextResponse.json({
      vin,
      make: row.Make,
      model: row.Model,
      trim: row.Trim || row.Series || undefined,
      modelYear: row.ModelYear ? Number(row.ModelYear) : undefined,
    })
  } catch {
    return NextResponse.json({ error: 'decoder_unavailable' }, { status: 502 })
  }
}
