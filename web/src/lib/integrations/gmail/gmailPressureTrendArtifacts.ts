export const GMAIL_PRESSURE_TREND_ARTIFACT_WINDOWS = [
  'all_indexed',
  'last_year',
  'last_quarter',
  'last_month',
  'last_week',
  'last_day',
] as const

export type GmailPressureTrendArtifactWindow =
  (typeof GMAIL_PRESSURE_TREND_ARTIFACT_WINDOWS)[number]

export type GmailPressureTrendArtifactWindowLike =
  | GmailPressureTrendArtifactWindow
  | 'custom'

export type GmailPressureTrendArtifactBucketFamily =
  | 'pressure_trend_all_indexed'
  | 'pressure_trend_last_year'
  | 'pressure_trend_last_quarter'
  | 'pressure_trend_last_month'
  | 'pressure_trend_last_week'
  | 'pressure_trend_last_day'

export type GmailPressureTrendArtifactGrouping =
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'

export const GMAIL_PRESSURE_TREND_LEGACY_BUCKET_FAMILY = 'pressure_trend'

const GMAIL_PRESSURE_TREND_ARTIFACT_BUCKET_FAMILY_BY_WINDOW: Record<
  GmailPressureTrendArtifactWindow,
  GmailPressureTrendArtifactBucketFamily
> = {
  all_indexed: 'pressure_trend_all_indexed',
  last_year: 'pressure_trend_last_year',
  last_quarter: 'pressure_trend_last_quarter',
  last_month: 'pressure_trend_last_month',
  last_week: 'pressure_trend_last_week',
  last_day: 'pressure_trend_last_day',
}

const GMAIL_PRESSURE_TREND_GROUPING_BY_BUCKET_FAMILY: Record<
  GmailPressureTrendArtifactBucketFamily,
  GmailPressureTrendArtifactGrouping
> = {
  pressure_trend_all_indexed: 'quarter',
  pressure_trend_last_year: 'month',
  pressure_trend_last_quarter: 'week',
  pressure_trend_last_month: 'day',
  pressure_trend_last_week: 'day',
  pressure_trend_last_day: 'hour',
}

function parseCustomDateInput(value: string | null | undefined): {
  year: number
  month: number
  day: number
} | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number.parseInt(match[1], 10)
  const month = Number.parseInt(match[2], 10)
  const day = Number.parseInt(match[3], 10)
  const validated = new Date(Date.UTC(year, month - 1, day))
  if (
    validated.getUTCFullYear() !== year ||
    validated.getUTCMonth() + 1 !== month ||
    validated.getUTCDate() !== day
  ) {
    return null
  }
  return { year, month, day }
}

function customRangeSpanDays(params: {
  pressureStart?: string | null
  pressureEnd?: string | null
}): number | null {
  const start = parseCustomDateInput(params.pressureStart)
  const end = parseCustomDateInput(params.pressureEnd)
  if (!start || !end) return null
  const startMs = Date.UTC(start.year, start.month - 1, start.day)
  const endMs = Date.UTC(end.year, end.month - 1, end.day)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null
  return Math.max(1, Math.floor((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1)
}

export function listGmailPressureTrendArtifactBucketFamilies(): GmailPressureTrendArtifactBucketFamily[] {
  return GMAIL_PRESSURE_TREND_ARTIFACT_WINDOWS.map(
    (window) => GMAIL_PRESSURE_TREND_ARTIFACT_BUCKET_FAMILY_BY_WINDOW[window]
  )
}

export function gmailPressureTrendArtifactBucketFamilyForWindow(
  window: GmailPressureTrendArtifactWindow
): GmailPressureTrendArtifactBucketFamily {
  return GMAIL_PRESSURE_TREND_ARTIFACT_BUCKET_FAMILY_BY_WINDOW[window]
}

export function gmailPressureTrendArtifactBucketFamilyForCustomRange(params: {
  pressureStart?: string | null
  pressureEnd?: string | null
}): GmailPressureTrendArtifactBucketFamily {
  const spanDays = customRangeSpanDays(params)
  if (spanDays == null) return 'pressure_trend_all_indexed'
  if (spanDays <= 1) return 'pressure_trend_last_day'
  if (spanDays <= 7) return 'pressure_trend_last_week'
  if (spanDays <= 31) return 'pressure_trend_last_month'
  if (spanDays <= 92) return 'pressure_trend_last_quarter'
  if (spanDays <= 366) return 'pressure_trend_last_year'
  return 'pressure_trend_all_indexed'
}

export function gmailPressureTrendArtifactBucketFamilyCandidates(params: {
  window: GmailPressureTrendArtifactWindowLike
  pressureStart?: string | null
  pressureEnd?: string | null
}): string[] {
  if (params.window === 'custom') {
    return [gmailPressureTrendArtifactBucketFamilyForCustomRange(params)]
  }
  const family = gmailPressureTrendArtifactBucketFamilyForWindow(params.window)
  if (params.window === 'all_indexed') {
    return [family, GMAIL_PRESSURE_TREND_LEGACY_BUCKET_FAMILY]
  }
  return [family]
}

export function gmailPressureTrendExpectedGroupingForBucketFamily(
  family: GmailPressureTrendArtifactBucketFamily
): GmailPressureTrendArtifactGrouping {
  return GMAIL_PRESSURE_TREND_GROUPING_BY_BUCKET_FAMILY[family]
}

export function gmailPressureTrendExpectedGroupingForWindow(params: {
  window: GmailPressureTrendArtifactWindowLike
  pressureStart?: string | null
  pressureEnd?: string | null
}): GmailPressureTrendArtifactGrouping {
  if (params.window === 'custom') {
    return gmailPressureTrendExpectedGroupingForBucketFamily(
      gmailPressureTrendArtifactBucketFamilyForCustomRange(params)
    )
  }
  return gmailPressureTrendExpectedGroupingForBucketFamily(
    gmailPressureTrendArtifactBucketFamilyForWindow(params.window)
  )
}

