import type { ScanLocation } from './types'

/**
 * Where a car was spotted, resolved without calling any geocoding service.
 * Precise coordinates are kept for the player's own map but are never shown:
 * the UI only ever displays city and country, and garage cars show nothing at
 * all so a VIN cannot point at someone's driveway.
 */
const ZONE_COUNTRY: Record<string, string> = {
  America: 'United States',
  Europe: 'Europe',
  Asia: 'Asia',
  Australia: 'Australia',
  Africa: 'Africa',
  Pacific: 'Pacific',
  Atlantic: 'Atlantic',
  Indian: 'Indian Ocean',
}

const CITY_COUNTRY: Record<string, string> = {
  Vancouver: 'Canada', Toronto: 'Canada', Montreal: 'Canada', Edmonton: 'Canada', Winnipeg: 'Canada',
  New_York: 'United States', Los_Angeles: 'United States', Chicago: 'United States',
  Denver: 'United States', Phoenix: 'United States', Detroit: 'United States',
  Mexico_City: 'Mexico', Sao_Paulo: 'Brazil', Buenos_Aires: 'Argentina',
  London: 'United Kingdom', Dublin: 'Ireland', Paris: 'France', Madrid: 'Spain',
  Lisbon: 'Portugal', Berlin: 'Germany', Amsterdam: 'Netherlands', Brussels: 'Belgium',
  Zurich: 'Switzerland', Rome: 'Italy', Vienna: 'Austria', Stockholm: 'Sweden',
  Oslo: 'Norway', Copenhagen: 'Denmark', Warsaw: 'Poland', Prague: 'Czechia',
  Moscow: 'Russia', Istanbul: 'Türkiye', Athens: 'Greece',
  Tokyo: 'Japan', Seoul: 'South Korea', Shanghai: 'China', Hong_Kong: 'Hong Kong',
  Taipei: 'Taiwan', Singapore: 'Singapore', Bangkok: 'Thailand', Jakarta: 'Indonesia',
  Kolkata: 'India', Dubai: 'United Arab Emirates', Riyadh: 'Saudi Arabia',
  Sydney: 'Australia', Melbourne: 'Australia', Perth: 'Australia', Auckland: 'New Zealand',
  Johannesburg: 'South Africa', Lagos: 'Nigeria', Cairo: 'Egypt', Nairobi: 'Kenya',
}

export function placeFromTimezone(): { city: string; country: string } {
  let zone = 'Etc/Unknown'
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || zone
  } catch {
    // Some environments refuse to report a zone; fall through to Unknown.
  }
  const parts = zone.split('/')
  const area = parts[0]
  const raw = parts[parts.length - 1]
  const city = raw.replace(/_/g, ' ')
  const country = CITY_COUNTRY[raw] ?? ZONE_COUNTRY[area] ?? 'Unknown'
  return { city, country }
}

export async function currentScanLocation(allowPrecise: boolean): Promise<ScanLocation> {
  const place = placeFromTimezone()
  if (!allowPrecise || typeof navigator === 'undefined' || !navigator.geolocation) return place
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, maximumAge: 300_000 }),
    )
    return { ...place, lat: pos.coords.latitude, lon: pos.coords.longitude }
  } catch {
    return place
  }
}

/** The only form a location is ever shown in. */
export function formatPlace(loc?: ScanLocation): string | undefined {
  if (!loc) return undefined
  return loc.country && loc.country !== 'Unknown' ? `${loc.city}, ${loc.country}` : loc.city
}
