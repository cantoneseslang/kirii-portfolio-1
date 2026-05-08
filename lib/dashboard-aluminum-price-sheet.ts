import "server-only"

import { google } from "googleapis"

import type {
  DashboardAluminumPricePoint,
  DashboardAluminumPriceResponse,
  DashboardAluminumPriceSeries,
} from "@/types/dashboard-aluminum-price"

const DEFAULT_SPREADSHEET_ID = "1RQb5fBTipFZPslbG60vP46DJZ8ZD9D7a7_eaKw718nM"
const DEFAULT_SHEET_GID = "1629194981"
const DEFAULT_SHEET_TITLE = "当天铝锭价格"
const DEFAULT_POINT_LIMIT = 2000
const START_DATE_UTC = Date.UTC(2025, 2, 1)

const SERIES_CONFIG = [
  { key: "series1", columnIndex: 1, label: "长江铝锭", color: "#ef4444" },
  { key: "series2", columnIndex: 9, label: "南海灵通", color: "#3b82f6" },
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
  return process.env.DASHBOARD_ALUMINUM_PRICE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID
}

function resolveSheetTitle() {
  return process.env.DASHBOARD_ALUMINUM_PRICE_SHEET_NAME || DEFAULT_SHEET_TITLE
}

function resolveSheetGid() {
  return process.env.DASHBOARD_ALUMINUM_PRICE_SHEET_GID || DEFAULT_SHEET_GID
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
  if (typeof value !== "string") return null

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
    if (year < 100) year += 2000
  } else {
    return null
  }

  if (!year || !month || !day) return null

  return {
    raw: `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`,
    timestamp: Date.UTC(year, month - 1, day),
  }
}

function escapeSheetTitle(sheetTitle: string) {
  return sheetTitle.replace(/'/g, "''")
}

function extractJsonPayload(text: string) {
  const prefix = "google.visualization.Query.setResponse("
  const start = text.indexOf(prefix)
  if (start === -1) throw new Error("Unexpected gviz response format")

  const jsonStart = start + prefix.length
  const jsonEnd = text.lastIndexOf(");")
  if (jsonEnd === -1) throw new Error("Failed to locate gviz payload terminator")

  return text.slice(jsonStart, jsonEnd)
}

async function getSheetRowsViaOAuth(spreadsheetId: string, sheetTitle: string) {
  const auth = getOAuth2Client()
  const sheets = google.sheets({ version: "v4", auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${escapeSheetTitle(sheetTitle)}'!A:J`,
    majorDimension: "ROWS",
  })

  return (response.data.values || []) as string[][]
}

async function getSheetRowsViaPublicGviz(sheetTitle: string) {
  const response = await fetch(
    `https://docs.google.com/spreadsheets/d/${resolveSpreadsheetId()}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetTitle)}`,
    { cache: "no-store" }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch public aluminum price sheet (${response.status})`)
  }

  const text = await response.text()
  const payload = JSON.parse(extractJsonPayload(text)) as {
    table?: {
      rows?: Array<{
        c?: Array<{ v?: string | number | null; f?: string | null } | null>
      }>
    }
  }

  return (payload.table?.rows || []).map((row) => {
    const nextRow = Array.from({ length: 10 }, () => "")
    ;(row.c || []).forEach((cell, index) => {
      if (!cell || index > 9) return
      const formatted = cell.f ?? cell.v
      nextRow[index] = formatted == null ? "" : String(formatted)
    })
    return nextRow
  })
}

async function getSheetRowsViaPublicCsv() {
  const response = await fetch(
    `https://docs.google.com/spreadsheets/d/${resolveSpreadsheetId()}/export?format=csv&gid=${resolveSheetGid()}`,
    { cache: "no-store" }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch public aluminum price sheet (${response.status})`)
  }

  return (await response.text())
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(","))
}

async function getAluminumPriceSheetRows(spreadsheetId: string, sheetTitle: string) {
  if (hasOAuthCredentials()) {
    try {
      return await getSheetRowsViaOAuth(spreadsheetId, sheetTitle)
    } catch (error) {
      console.warn("Falling back to public CSV for aluminum price sheet:", error)
    }
  }

  try {
    return await getSheetRowsViaPublicGviz(sheetTitle)
  } catch (error) {
    console.warn("Falling back to gid-based CSV for aluminum price sheet:", error)
    return getSheetRowsViaPublicCsv()
  }
}

export async function getDashboardAluminumPriceData(params?: {
  pointLimit?: number
}): Promise<DashboardAluminumPriceResponse> {
  const spreadsheetId = resolveSpreadsheetId()
  const sheetTitle = resolveSheetTitle()
  const pointLimit = clamp(params?.pointLimit ?? DEFAULT_POINT_LIMIT, 30, 5000)
  const nowTimestamp = Date.now()

  const rows = await getAluminumPriceSheetRows(spreadsheetId, sheetTitle)
  if (!rows.length) {
    throw new Error("Aluminum price sheet is empty")
  }

  const datedPoints = rows
    .map((row) => {
      const parsedDate = parseDateCell(row[0])
      if (
        !parsedDate ||
        parsedDate.timestamp < START_DATE_UTC ||
        parsedDate.timestamp > nowTimestamp
      ) {
        return null
      }

      const point: DashboardAluminumPricePoint = {
        date: parsedDate.raw,
        label: parsedDate.raw,
      }

      let hasValue = false
      for (const series of SERIES_CONFIG) {
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
    .filter((entry): entry is { point: DashboardAluminumPricePoint; timestamp: number } => entry != null)
    .sort((a, b) => a.timestamp - b.timestamp)

  const points = datedPoints.slice(-pointLimit).map((entry) => entry.point)
  if (!points.length) {
    throw new Error("Aluminum price sheet does not contain any chartable rows")
  }

  const latestPoint = points[points.length - 1]
  const series: DashboardAluminumPriceSeries[] = SERIES_CONFIG.map((item) => {
    const latestRaw = latestPoint?.[item.key]
    const latestValue = typeof latestRaw === "number" ? latestRaw : null
    return {
      key: item.key,
      label: item.label,
      description: "",
      unit: "元/吨",
      color: item.color,
      latestValue,
    }
  })

  return {
    sheetTitle,
    spreadsheetId,
    spreadsheetUrl: resolveSpreadsheetUrl(),
    updatedAt: new Date().toISOString(),
    unit: "元/吨",
    series,
    points,
  }
}
