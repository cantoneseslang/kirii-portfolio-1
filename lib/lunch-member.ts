/** Lunch order member ids — keep in sync with lunch-order/data/members.ts */
export const LUNCH_MEMBER_ID_BY_FULL_NAME: Record<string, string> = {
  "Sakon Hiroki": "1",
  "Wong Hong Keung": "2",
  "Lau Cheuk Ming": "3",
  "Poon Kit Ling": "4",
  "Ip Ting Hin": "5",
  "Lam Wai Lok": "7",
  "Li Pui Lok": "8",
  "Kit Yu Yi": "9",
  "Lam Wan Tat": "10",
  "Poon Hiu Yi": "11",
  "Lo Leung Kei": "12",
  "Yeung Siu Tuen": "13",
  "Mak Wan Hoi": "14",
  "Wu Ka Yan": "15",
  "Hui Oi Han": "17",
  "Lin Daoqun": "18",
  "Yau Siu Yin": "21",
  "Lee Ka Lin": "23",
  "Yiu Pak Ho": "24",
  "Lee Cheuk Yin": "25",
  "Wong Kok Lam": "26",
  "Chu Kaki Kathy": "27",
  Kathy: "27",
  "Chu Kaki": "27",
}

export const LUNCH_MEMBER_ID_BY_CHINESE_NAME: Record<string, string> = {
  佐近宏樹: "1",
  黃漢強: "2",
  劉焯明: "3",
  潘潔鈴: "4",
  葉庭軒: "5",
  林韋樂: "7",
  李貝樂: "8",
  揭瑜宜: "9",
  林運達: "10",
  潘曉誼: "11",
  盧良基: "12",
  楊兆端: "13",
  麥雲開: "14",
  胡家欣: "15",
  許愛嫻: "17",
  林道群: "18",
  邱少燕: "21",
  李家年: "23",
  姚栢浩: "24",
  李卓賢: "25",
  王玨琳: "26",
  朱家琪: "27",
}

const LUNCH_MEMBER_ID_BY_EMAIL: Record<string, string> = {
  "hiroki.sakon@kirii.com.hk": "1",
  "alexwong@kirii.com.hk": "2",
  "billylau@kirii.com.hk": "3",
  "grace@kirii.com.hk": "4",
  "ivan@kirii.com.hk": "5",
  "anson@kirii.com.hk": "7",
  "billyli@kirii.com.hk": "8",
  "kami@kirii.com.hk": "9",
  "info4@kirii.com.hk": "10",
  "ada@kirii.com.hk": "11",
  "ralphlo@kirii.com.hk": "12",
  "tina@kirii.com.hk": "13",
  "irenewu@kirii.com.hk": "15",
  "info2@kirii.com.hk": "17",
  "info3@kirii.com.hk": "18",
  "info5@kirii.com.hk": "21",
  "info6@kirii.com.hk": "23",
  "info7@kirii.com.hk": "25",
  "info8@kirii.com.hk": "26",
  "kathy@kirii.com.hk": "27",
  "info9@kirii.com.hk": "27",
}

const CHINESE_NAME_BY_MEMBER_ID: Record<string, string> = Object.fromEntries(
  Object.entries(LUNCH_MEMBER_ID_BY_CHINESE_NAME).map(([chineseName, memberId]) => [memberId, chineseName]),
)

export function resolveChineseName(fullName?: string | null, email?: string | null): string | null {
  const memberId = resolveLunchMemberId(fullName, email)
  if (!memberId) return null
  return CHINESE_NAME_BY_MEMBER_ID[memberId] ?? null
}

export function resolveLunchMemberId(fullName?: string | null, email?: string | null): string | null {
  const name = String(fullName ?? "").trim()
  if (name) {
    const byName = LUNCH_MEMBER_ID_BY_FULL_NAME[name] ?? LUNCH_MEMBER_ID_BY_CHINESE_NAME[name]
    if (byName) return byName
  }
  const normalizedEmail = String(email ?? "").trim().toLowerCase()
  if (normalizedEmail && LUNCH_MEMBER_ID_BY_EMAIL[normalizedEmail]) {
    return LUNCH_MEMBER_ID_BY_EMAIL[normalizedEmail]
  }
  return null
}

export function getLunchOrderApiBaseUrl(): string {
  return (
    process.env.LUNCH_ORDER_API_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_LUNCH_ORDER_API_BASE_URL?.replace(/\/$/, "") ||
    "https://v0-random-ui-example.vercel.app"
  )
}

export type LunchOrderSummaryLine = {
  label: string
  quantity: number
}

export type LunchOrderSummarySection = {
  category: string
  items: LunchOrderSummaryLine[]
}

export type LunchOrderSummary = {
  dateKey: string
  hasOrder: boolean
  sections: LunchOrderSummarySection[]
}

export async function fetchTodayLunchOrder(memberId: string): Promise<LunchOrderSummary | null> {
  const baseUrl = getLunchOrderApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/member/today-order?member_id=${encodeURIComponent(memberId)}`, {
    cache: "no-store",
  })

  if (!response.ok) return null
  const payload = (await response.json()) as {
    success?: boolean
    data?: {
      dateKey?: string
      hasOrder?: boolean
      sections?: LunchOrderSummarySection[]
    }
  }

  if (!payload.success || !payload.data) return null
  return {
    dateKey: payload.data.dateKey || "",
    hasOrder: Boolean(payload.data.hasOrder),
    sections: payload.data.sections || [],
  }
}
