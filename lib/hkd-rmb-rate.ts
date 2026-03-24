import "server-only"

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

  const hkdRowMatch = html.match(/<tr\s+data-currency='港币'>([\s\S]*?)<\/tr>/)
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
  const date = tds[6]

  if (isNaN(buyRate) || isNaN(sellRate) || isNaN(midRate)) {
    throw new Error(`Failed to parse HKD rates: buy=${tds[1]} sell=${tds[3]} mid=${tds[5]}`)
  }

  const dateOnly = date.split(" ")[0] || date
  const timeMatch = date.match(/\d{2}:\d{2}/)
  const time = timeMatch ? timeMatch[0] : ""

  return {
    date: dateOnly,
    time,
    buyRate,
    sellRate,
    midRate,
  }
}
