import { createClient } from "@supabase/supabase-js"
import { getHongKongDayRange, listRecentHongKongDateKeys } from "@/lib/hong-kong-date"

const META_EMPLOYEE_PREFIX = "meta-employee-"
const META_MENU_PREFIX = "meta-menu-"
const META_FP_PREFIX = "meta-fp-"
const META_FP_DRINK = "__meta_fp__"
const META_AUDIT_PREFIX = "meta-audit-"
const META_AUDIT_DRINK = "__meta_audit__"

const DEFAULT_LUNCH_SUPABASE_URL = "https://cejpzifpjkhjuhemehmv.supabase.co"

type LunchOrderDbRow = {
  id: string
  member_id: string
  member_name: string
  dish: string
  drink: string
  timestamp: string
  operator_member_id?: string | null
  operator_member_name?: string | null
}

export type LunchOrderActivityRow = {
  id: string
  timestamp: string
  dateKey: string
  channel: "tingkok" | "foodpanda"
  memberId: string
  memberName: string
  operatorMemberId: string | null
  operatorMemberName: string | null
  isProxyOrder: boolean
  detail: string
}

function getLunchOrderSupabase() {
  const url =
    process.env.LUNCH_ORDER_SUPABASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_LUNCH_ORDER_SUPABASE_URL?.replace(/\/$/, "") ||
    DEFAULT_LUNCH_SUPABASE_URL
  const key = process.env.LUNCH_ORDER_SUPABASE_SERVICE_ROLE_KEY

  if (!key) {
    return null
  }

  return createClient(url, key, { auth: { persistSession: false } })
}

function isMetaRow(memberId: string, drink?: string) {
  if (drink === META_FP_DRINK || drink === META_AUDIT_DRINK) return true
  if (memberId.startsWith(META_AUDIT_PREFIX)) return true
  return (
    memberId.startsWith(META_EMPLOYEE_PREFIX) ||
    memberId.startsWith(META_MENU_PREFIX) ||
    memberId.startsWith(META_FP_PREFIX)
  )
}

function isFpOrderRow(row: { member_id: string; drink?: string }) {
  return row.drink === META_FP_DRINK || row.member_id.startsWith(META_FP_PREFIX)
}

function isProxyOrder(row: {
  member_id: string
  operator_member_id?: string | null
}): boolean {
  if (!row.operator_member_id) return false
  return String(row.operator_member_id) !== String(row.member_id)
}

function formatFpDetail(row: LunchOrderDbRow): string {
  try {
    const parsed = JSON.parse(row.dish) as {
      dish?: string
      noodle?: string
      addOns?: string[]
      drink?: string
    }
    const parts = [parsed.dish].filter(Boolean)
    if (parsed.noodle && parsed.noodle !== "不適用") parts.push(`麵:${parsed.noodle}`)
    if (parsed.addOns?.length) parts.push(`追加:${parsed.addOns.join("、")}`)
    if (parsed.drink) parts.push(`飲:${parsed.drink}`)
    return parts.join(" / ")
  } catch {
    return row.member_name
  }
}

function rowToActivity(row: LunchOrderDbRow): LunchOrderActivityRow {
  const channel = isFpOrderRow(row) ? "foodpanda" : "tingkok"
  const detail =
    channel === "foodpanda"
      ? formatFpDetail(row)
      : `餐:${row.dish} / 飲:${row.drink}`

  return {
    id: row.id,
    timestamp: row.timestamp,
    dateKey: new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(row.timestamp)),
    channel,
    memberId: row.member_id,
    memberName: row.member_name,
    operatorMemberId: row.operator_member_id ?? null,
    operatorMemberName: row.operator_member_name ?? null,
    isProxyOrder: isProxyOrder(row),
    detail,
  }
}

export async function fetchLunchOrderActivity(
  days = 7,
  limit = 300,
): Promise<{ rows: LunchOrderActivityRow[]; error: string | null }> {
  const supabase = getLunchOrderSupabase()
  if (!supabase) {
    return {
      rows: [],
      error: "LUNCH_ORDER_SUPABASE_SERVICE_ROLE_KEY が未設定です（Vercel 環境変数を追加してください）",
    }
  }

  const dateKeys = listRecentHongKongDateKeys(days)
  const oldestKey = dateKeys[dateKeys.length - 1] ?? dateKeys[0]
  const newestKey = dateKeys[0]
  const { from } = getHongKongDayRange(oldestKey)
  const { to } = getHongKongDayRange(newestKey)

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, member_id, member_name, dish, drink, timestamp, operator_member_id, operator_member_name",
    )
    .gte("timestamp", from)
    .lt("timestamp", to)
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error) {
    return { rows: [], error: error.message }
  }

  const rows = (data ?? [])
    .filter((row) => !isMetaRow(row.member_id, row.drink))
    .map((row) => rowToActivity(row as LunchOrderDbRow))

  return { rows, error: null }
}

export type LunchOrderEngagement = {
  days: number
  lastAt: Date
}

export async function fetchLunchOrderEngagementByMemberId(
  fromIso: string,
  toIso: string,
): Promise<Map<string, LunchOrderEngagement>> {
  const engagement = new Map<string, LunchOrderEngagement>()
  const supabase = getLunchOrderSupabase()
  if (!supabase) return engagement

  const { data, error } = await supabase
    .from("orders")
    .select("member_id, drink, timestamp, operator_member_id")
    .gte("timestamp", fromIso)
    .lte("timestamp", toIso)
    .order("timestamp", { ascending: false })
    .limit(5000)

  if (error || !data) return engagement

  const daysByMember = new Map<string, Set<string>>()

  const add = (memberId: string | null | undefined, timestamp: string) => {
    const id = String(memberId || "").trim()
    if (!id) return
    const at = new Date(timestamp)
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(at)
    const days = daysByMember.get(id) ?? new Set<string>()
    days.add(dateKey)
    daysByMember.set(id, days)
    const current = engagement.get(id)
    if (!current || at > current.lastAt) {
      engagement.set(id, { days: days.size, lastAt: at })
    } else {
      current.days = days.size
    }
  }

  for (const row of data) {
    if (isMetaRow(row.member_id, row.drink)) continue
    add(row.member_id, row.timestamp)
    if (row.operator_member_id) add(row.operator_member_id, row.timestamp)
  }

  return engagement
}
