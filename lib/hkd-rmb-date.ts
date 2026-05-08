export function normalizeDateToYmd(input: string): string | null {
  const value = input.trim()
  if (!value) return null

  const match = value.match(/(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  const dt = new Date(Date.UTC(year, month - 1, day))
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() + 1 !== month ||
    dt.getUTCDate() !== day
  ) {
    return null
  }

  const mm = String(month).padStart(2, "0")
  const dd = String(day).padStart(2, "0")
  return `${year}-${mm}-${dd}`
}

export function toYmdKey(input: string): number | null {
  const ymd = normalizeDateToYmd(input)
  if (!ymd) return null
  return Number(ymd.replace(/-/g, ""))
}

export function formatYmdToShort(input: string): string {
  const ymd = normalizeDateToYmd(input)
  if (!ymd) return input
  const [year, month, day] = ymd.split("-")
  return `${year.slice(-2)}/${month}/${day}`
}

export function getPreviousCalendarDayYmd(input: string): string | null {
  const ymd = normalizeDateToYmd(input)
  if (!ymd) return null

  const [year, month, day] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(year, month - 1, day))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
    dt.getUTCDate()
  ).padStart(2, "0")}`
}

function getWeekdayUtc(ymd: string): number | null {
  const normalized = normalizeDateToYmd(ymd)
  if (!normalized) return null
  const [year, month, day] = normalized.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export function getPreviousBusinessDayYmd(input: string): string | null {
  let cursor = getPreviousCalendarDayYmd(input)
  if (!cursor) return null

  for (let i = 0; i < 7; i++) {
    const weekday = getWeekdayUtc(cursor)
    if (weekday == null) return null
    if (weekday !== 0 && weekday !== 6) return cursor
    cursor = getPreviousCalendarDayYmd(cursor)
    if (!cursor) return null
  }
  return null
}

export function getCurrentYmdInTimeZone(
  timeZone: string,
  baseDate: Date = new Date()
): string | null {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(baseDate)

  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value
  if (!year || !month || !day) return null
  return `${year}-${month}-${day}`
}
