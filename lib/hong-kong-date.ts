const HK_TIME_ZONE = "Asia/Hong_Kong"

export function getHongKongDateKey(ref: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ref)
}

export function getHongKongDayRange(dateKey: string): { from: string; to: string } {
  const [y, m, d] = dateKey.split("-").map(Number)
  const from = new Date(Date.UTC(y, m - 1, d - 1, 16, 0, 0))
  const to = new Date(Date.UTC(y, m - 1, d, 16, 0, 0))
  return { from: from.toISOString(), to: to.toISOString() }
}

export function getHongKongMonthToDateRange(ref: Date = new Date()): {
  from: string
  to: string
  startKey: string
  todayKey: string
  dayOfMonth: number
} {
  const todayKey = getHongKongDateKey(ref)
  const [year, month] = todayKey.split("-")
  const startKey = `${year}-${month}-01`
  const { from } = getHongKongDayRange(startKey)
  const { to } = getHongKongDayRange(todayKey)
  return {
    from,
    to,
    startKey,
    todayKey,
    dayOfMonth: Number(todayKey.slice(-2)),
  }
}

export function listRecentHongKongDateKeys(days: number, ref: Date = new Date()): string[] {
  const keys: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(ref)
    d.setDate(d.getDate() - i)
    keys.push(getHongKongDateKey(d))
  }
  return keys
}
