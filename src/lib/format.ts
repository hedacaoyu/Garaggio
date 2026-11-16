export function money(usd: number, locale = 'en'): string {
  const l = locale === 'zh' ? 'zh-CN' : 'en-US'
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(usd >= 10_000_000 ? 1 : 2)}M`
  if (usd >= 1_000) return `$${Math.round(usd / 1000).toLocaleString(l)}K`
  return `$${usd.toLocaleString(l)}`
}

export function moneyFull(usd: number, locale = 'en'): string {
  return `$${usd.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}`
}

export function number(n: number, locale = 'en'): string {
  return n.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')
}

export function hp(n: number): string {
  return `${n} hp`
}

export function mph(n: number): string {
  return `${n} mph`
}

export function lbs(n: number, locale = 'en'): string {
  return `${number(n, locale)} lb`
}
