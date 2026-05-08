import "server-only"
import { normalizeDateToYmd } from "@/lib/hkd-rmb-date"

export type HkdRmbRate = {
  date: string
  time: string
  buyRate: number
  sellRate: number
  midRate: number
}

const BOC_URL = "https://www.boc.cn/sourcedb/whpj/"

function extractTdValues(rowHtml: string): string[] {
  const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/g
  const values: string[] = []
  let match
  while ((match = tdPattern.exec(rowHtml)) !== null) {
    values.push(match[1].trim())
  }
  return values
}

/** BOC 行が 7〜8 列になっても、行内の YYYY/MM/DD から日付を拾う（列ズレに強くする） */
function parseBocHkdDate(rowInnerHtml: string, fallbackCell: string): { date: string; time: string } {
  const plain = rowInnerHtml.replace(/<[^>]*>/g, " ")
  const dm = plain.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
  if (dm) {
    const y = dm[1]
    const mo = dm[2].padStart(2, "0")
    const da = dm[3].padStart(2, "0")
    const normalized = normalizeDateToYmd(`${y}-${mo}-${da}`)
    const timeFull =
      plain.match(/\b(\d{2}:\d{2}:\d{2})\b/)?.[1] ?? plain.match(/\b(\d{2}:\d{2})\b/)?.[1] ?? ""
    const time = timeFull.length >= 5 ? timeFull.slice(0, 5) : timeFull
    if (normalized) return { date: normalized, time }
  }

  const raw = (fallbackCell || "").trim()
  const dateOnly = normalizeDateToYmd(raw.split(/\s+/)[0] || raw)
  const timeMatch = raw.match(/\d{2}:\d{2}/)
  return { date: dateOnly ?? "", time: timeMatch ? timeMatch[0] : "" }
}

export async function fetchHkdRmbRate(): Promise<HkdRmbRate> {
  const response = await fetch(BOC_URL, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KiriiDashboard/1.0)",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch BOC exchange rate page (${response.status})`)
  }

  const html = await response.text()

  const hkdRowMatch = html.match(/<tr\s+data-currency=['"]港币['"]>([\s\S]*?)<\/tr>/)
  if (!hkdRowMatch) {
    throw new Error("HKD row not found in BOC exchange rate page")
  }

  const tds = extractTdValues(hkdRowMatch[1])
  if (tds.length < 7) {
    throw new Error(`Unexpected HKD row structure: got ${tds.length} cells`)
  }

  const buyRate = parseFloat(tds[1])
  const sellRate = parseFloat(tds[3])
  const midRate = parseFloat(tds[5])

  if (isNaN(buyRate) || isNaN(sellRate) || isNaN(midRate)) {
    throw new Error(`Failed to parse HKD rates: buy=${tds[1]} sell=${tds[3]} mid=${tds[5]}`)
  }

  const { date: dateOnly, time } = parseBocHkdDate(hkdRowMatch[1], tds[6] ?? "")
  if (!dateOnly) {
    throw new Error(`Failed to parse HKD date (cells=${tds.length})`)
  }

  return {
    date: dateOnly,
    time,
    buyRate,
    sellRate,
    midRate,
  }
}
