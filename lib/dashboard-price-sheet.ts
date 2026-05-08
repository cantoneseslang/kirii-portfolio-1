import "server-only"

import { google } from "googleapis"

import type {
  DashboardSteelPricePoint,
  DashboardSteelPriceResponse,
  DashboardSteelPriceSeries,
} from "@/types/dashboard-steel-price"

const DEFAULT_SPREADSHEET_ID = "1RQb5fBTipFZPslbG60vP46DJZ8ZD9D7a7_eaKw718nM"
const DEFAULT_SHEET_GID = "1922386555"
const DEFAULT_SHEET_TITLE = "镀锌板卷价格"
const DEFAULT_SERIES_LIMIT = 6
const DEFAULT_POINT_LIMIT = 5000
const START_DATE_UTC = Date.UTC(2025, 2, 1)
const SERIES_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#111827", "#22c55e", "#8b5cf6"]
const SERIES_COLUMN_CONFIG = [
  { columnIndex: 1, label: "有花：1*1219*C：乐从镇：鞍钢" }, // B
  { columnIndex: 3, label: "无花：1*1250*C：乐从镇：鞍钢" }, // D
  { columnIndex: 4, label: "无花：1*1250*C：济南：宝钢" },   // E
  { columnIndex: 5, label: "无花：1*1250*C：广州：鞍钢" },   // F
  { columnIndex: 2, label: "无花：0.8*1250*C：乐从：鞍钢" }, // C
  { columnIndex: 6, label: "无花：0.8*1250*C：广州：鞍钢" }, // G
] as const

function getOAuth2Client() {
  const clientId = process.env.OAUTH_CLIENT_ID
  const clientSecret = process.env.OAUTH_CLIENT_SECRET
  const redirectUri = process.env.OAUTH_REDIRECT_URI || "http://localhost"
  const tokenJson = process.env.GOOGLE_DRIVE_TOKEN

  if (!clientId || !clientSecret || !tokenJson) {
    throw new Error(
      "Missing Google OAuth env: OAUTH_CLIENT_ID/OAUTH_CLIENT_SECRET/GOOGLE_DRIVE_TOKEN"
    )
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  oauth2Client.setCredentials(JSON.parse(tokenJson))
  return oauth2Client
}

function hasOAuthCredentials() {
  return Boolean(
    process.env.OAUTH_CLIENT_ID &&
      process.env.OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_DRIVE_TOKEN
  )
}

function resolveSpreadsheetId() {
  return process.env.DASHBOARD_STEEL_PRICE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID
}

function resolveSheetTitle() {
  return process.env.DASHBOARD_STEEL_PRICE_SHEET_NAME || DEFAULT_SHEET_TITLE
}

function resolveSheetGid() {
  return process.env.DASHBOARD_STEEL_PRICE_SHEET_GID || DEFAULT_SHEET_GID
}

function resolveSpreadsheetUrl() {
  const spreadsheetId = resolveSpreadsheetId()
  const gid = resolveSheetGid()
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${gid}#gid=${gid}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function parseNumberCell(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== "string") {
    return null
  }

  const cleaned = value.replace(/,/g, "").trim()
  if (!cleaned) return null

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function parseDateCell(value: unknown) {
  const raw = String(value ?? "").trim()
  if (!raw) return null

  const yearFirstMatch = raw.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/)
  const monthFirstMatch = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/)

  let year = 0
  let month = 0
  let day = 0

  if (yearFirstMatch) {
    year = Number(yearFirstMatch[1])
    month = Number(yearFirstMatch[2])
    day = Number(yearFirstMatch[3])
  } else if (monthFirstMatch) {
    month = Number(monthFirstMatch[1])
    day = Number(monthFirstMatch[2])
    year = Number(monthFirstMatch[3])
    if (year < 100) {
      year += 2000
    }
  } else {
    return null
  }

  if (!year || !month || !day) return null

  const normalized = `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`
  return {
    raw: normalized,
    timestamp: Date.UTC(year, month - 1, day),
  }
}

function escapeSheetTitle(sheetTitle: string) {
  return sheetTitle.replace(/'/g, "''")
}

function extractJsonPayload(text: string) {
  const prefix = "google.visualization.Query.setResponse("
  const start = text.indexOf(prefix)
  if (start === -1) {
    throw new Error("Unexpected gviz response format")
  }

  const jsonStart = start + prefix.length
  const jsonEnd = text.lastIndexOf(");")
  if (jsonEnd === -1) {
    throw new Error("Failed to locate gviz payload terminator")
  }

  return text.slice(jsonStart, jsonEnd)
}

async function getSheetRowsViaOAuth(spreadsheetId: string, sheetTitle: string) {
  const auth = getOAuth2Client()
  const sheets = google.sheets({ version: "v4", auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${escapeSheetTitle(sheetTitle)}'!A:Z`,
    majorDimension: "ROWS",
  })

  return (response.data.values || []) as string[][]
}

async function getSheetRowsViaPublicGviz(sheetTitle: string) {
  const response = await fetch(
    `https://docs.google.com/spreadsheets/d/${resolveSpreadsheetId()}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetTitle)}`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch public steel price sheet (${response.status})`)
  }

  const text = await response.text()
  const payload = JSON.parse(extractJsonPayload(text)) as {
    table?: {
      rows?: Array<{
        c?: Array<{ v?: string | number | null; f?: string | null } | null>
      }>
    }
  }

  const headerRows = Array.from({ length: 4 }, () =>
    Array.from({ length: 7 }, () => "")
  )
  headerRows[0][0] = "产品名称"
  headerRows[1][0] = "产品说明"
  headerRows[2][0] = "价格时间"
  headerRows[3][0] = "单位"

  SERIES_COLUMN_CONFIG.forEach((series) => {
    headerRows[0][series.columnIndex] = series.label
    headerRows[3][series.columnIndex] = "元/吨"
  })

  const dataRows = (payload.table?.rows || []).map((row) => {
    const nextRow = Array.from({ length: 7 }, () => "")
    ;(row.c || []).forEach((cell, index) => {
      if (!cell || index > 6) return
      const formatted = cell.f ?? cell.v
      nextRow[index] = formatted == null ? "" : String(formatted)
    })
    return nextRow
  })

  return [...headerRows, ...dataRows]
}

async function getSheetRowsViaPublicCsv() {
  const response = await fetch(`https://docs.google.com/spreadsheets/d/${resolveSpreadsheetId()}/export?format=csv&gid=${resolveSheetGid()}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch public steel price sheet (${response.status})`)
  }

  return (await response.text())
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(","))
}

async function getSteelPriceSheetRows(_spreadsheetId: string, _sheetTitle: string) {
  try {
    return await getSheetRowsViaPublicCsv()
  } catch (error) {
    console.warn("CSV fetch failed for steel price sheet:", error)
    throw error
  }
}

function buildSeries(
  rows: string[][],
  seriesLimit: number
): Array<
  Omit<DashboardSteelPriceSeries, "latestValue"> & {
    columnIndex: number
  }
> {
  const descriptionRow = rows[1] || []
  const unitRow = rows[3] || []
  const dataRows = rows.slice(4)

  return SERIES_COLUMN_CONFIG.slice(0, seriesLimit)
    .filter((series) => dataRows.some((row) => parseNumberCell(row[series.columnIndex]) != null))
    .map((series, index) => ({
      key: `series${index + 1}`,
      columnIndex: series.columnIndex,
      label: series.label,
      description: String(descriptionRow[series.columnIndex] || "").trim(),
      unit: String(unitRow[series.columnIndex] || "").trim() || "元/吨",
      color: SERIES_COLORS[index % SERIES_COLORS.length],
    }))
}

export async function getDashboardSteelPriceData(params?: {
  seriesLimit?: number
  pointLimit?: number
}): Promise<DashboardSteelPriceResponse> {
  const spreadsheetId = resolveSpreadsheetId()
  const sheetTitle = resolveSheetTitle()
  const seriesLimit = clamp(params?.seriesLimit ?? DEFAULT_SERIES_LIMIT, 1, 8)
  const pointLimit = clamp(params?.pointLimit ?? DEFAULT_POINT_LIMIT, 30, 5000)
  const rows = await getSteelPriceSheetRows(spreadsheetId, sheetTitle)
  if (rows.length < 5) {
    throw new Error("Steel price sheet is missing the expected header rows")
  }

  const seriesDefinitions = buildSeries(rows, seriesLimit)
  if (!seriesDefinitions.length) {
    throw new Error("Steel price sheet does not contain any chartable series")
  }

  const nowTimestamp = Date.now()
  const datedPoints = rows
    .slice(4)
    .map((row) => {
      const parsedDate = parseDateCell(row[0])
      if (!parsedDate || parsedDate.timestamp < START_DATE_UTC || parsedDate.timestamp > nowTimestamp) return null

      const point: DashboardSteelPricePoint = {
        date: parsedDate.raw,
        label: parsedDate.raw,
      }

      let hasValue = false
      for (const series of seriesDefinitions) {
        const value = parseNumberCell(row[series.columnIndex])
        point[series.key] = value
        if (value != null) hasValue = true
      }

      if (!hasValue) return null

      return {
        point,
        timestamp: parsedDate.timestamp,
      }
    })
    .filter((entry): entry is { point: DashboardSteelPricePoint; timestamp: number } => entry != null)
    .sort((a, b) => a.timestamp - b.timestamp)

  const points = datedPoints.slice(-pointLimit).map((entry) => entry.point)
  if (!points.length) {
    throw new Error("Steel price sheet does not contain any dated data rows")
  }

  const latestPoint = points[points.length - 1]
  const series: DashboardSteelPriceSeries[] = seriesDefinitions.map((series) => {
    const latestRaw = latestPoint?.[series.key]
    const latestValue = typeof latestRaw === "number" ? latestRaw : null

    return {
      key: series.key,
      label: series.label,
      description: series.description,
      unit: series.unit,
      color: series.color,
      latestValue,
    }
  })

  return {
    sheetTitle,
    spreadsheetId,
    spreadsheetUrl: resolveSpreadsheetUrl(),
    updatedAt: new Date().toISOString(),
    unit: series[0]?.unit || "元/吨",
    series,
    points,
  }
}
