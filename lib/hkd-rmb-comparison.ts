import { getPreviousBusinessDayYmd, normalizeDateToYmd, toYmdKey } from "./hkd-rmb-date"

export type HkdHistoryComparablePoint = {
  date: string
}

export function sortHistoryByDate<T extends HkdHistoryComparablePoint>(history: T[]): T[] {
  return [...history].sort((a, b) => (toYmdKey(a.date) ?? 0) - (toYmdKey(b.date) ?? 0))
}

export function resolvePrevBusinessDayComparison<T extends HkdHistoryComparablePoint>(
  history: T[],
  todayDate: string
): { targetDate: string; point: T | null; label: "前一个工作日" } | null {
  if (!normalizeDateToYmd(todayDate)) return null
  const yPrev = getPreviousBusinessDayYmd(todayDate)
  if (!yPrev) return null
  const exact = history.find((h) => h.date === yPrev)
  return { targetDate: yPrev, point: exact ?? null, label: "前一个工作日" }
}

export function resolveMonthStartComparison<T extends HkdHistoryComparablePoint>(
  history: T[],
  todayDate: string
): { targetDate: string; point: T | null } | null {
  const today = normalizeDateToYmd(todayDate)
  if (!today) return null
  const [y, m, d] = today.split("-").map(Number)
  const currentMonthStart = `${today.slice(0, 7)}-01`
  const currentMonthStartKey = toYmdKey(currentMonthStart)
  if (currentMonthStartKey == null) return null

  if (d <= 2) {
    const prevMonthEndDate = new Date(Date.UTC(y, m - 1, 0))
    const prevMonthEnd = `${prevMonthEndDate.getUTCFullYear()}-${String(prevMonthEndDate.getUTCMonth() + 1).padStart(2, "0")}-${String(prevMonthEndDate.getUTCDate()).padStart(2, "0")}`
    const exact = history.find((h) => h.date === prevMonthEnd)
    return { targetDate: prevMonthEnd, point: exact ?? null }
  }

  const exact = history.find((h) => h.date === currentMonthStart)
  return { targetDate: currentMonthStart, point: exact ?? null }
}
