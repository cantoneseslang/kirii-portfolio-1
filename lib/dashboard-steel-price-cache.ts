import { list, put } from "@vercel/blob"

import { getDashboardSteelPriceData } from "@/lib/dashboard-price-sheet"
import type {
  DashboardSteelPriceResponse,
  DashboardSteelPriceSeries,
} from "@/types/dashboard-steel-price"

export const DASHBOARD_STEEL_PRICE_LATEST_PATH = "dashboard-steel-price/latest.json"
export const DASHBOARD_STEEL_PRICE_HISTORY_PREFIX = "dashboard-steel-price/history"

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN
}

function normalizeSnapshotForComparison(snapshot: DashboardSteelPriceResponse) {
  return {
    sheetTitle: snapshot.sheetTitle,
    spreadsheetId: snapshot.spreadsheetId,
    spreadsheetUrl: snapshot.spreadsheetUrl,
    unit: snapshot.unit,
    series: snapshot.series.map((item) => ({
      key: item.key,
      label: item.label,
      description: item.description,
      unit: item.unit,
      color: item.color,
      latestValue: item.latestValue,
    })),
    points: snapshot.points,
  }
}

function isSameSteelPriceData(
  prev: DashboardSteelPriceResponse,
  next: DashboardSteelPriceResponse
): boolean {
  return (
    JSON.stringify(normalizeSnapshotForComparison(prev)) ===
    JSON.stringify(normalizeSnapshotForComparison(next))
  )
}

export async function getLatestSteelPriceSnapshot(
  token = getBlobToken()
): Promise<DashboardSteelPriceResponse | null> {
  if (!token) return null

  const result = await list({
    token,
    prefix: DASHBOARD_STEEL_PRICE_LATEST_PATH,
    limit: 1,
  })

  const latest = result.blobs[0]
  if (!latest?.url) return null

  const response = await fetch(latest.url, { cache: "no-store" })
  if (!response.ok) return null

  return (await response.json()) as DashboardSteelPriceResponse
}

export async function saveSteelPriceSnapshot(
  snapshot: DashboardSteelPriceResponse,
  token = getBlobToken()
) {
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set")
  }

  const body = JSON.stringify(snapshot, null, 2)
  const historyId = snapshot.updatedAt.replace(/[:.]/g, "-")

  await put(DASHBOARD_STEEL_PRICE_LATEST_PATH, body, {
    token,
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  })

  await put(`${DASHBOARD_STEEL_PRICE_HISTORY_PREFIX}/${historyId}.json`, body, {
    token,
    access: "public",
    allowOverwrite: true,
    contentType: "application/json",
  })
}

export async function refreshSteelPriceSnapshot(params?: {
  seriesLimit?: number
  pointLimit?: number
  token?: string
}) {
  const nextSnapshot = await getDashboardSteelPriceData({
    seriesLimit: params?.seriesLimit ?? 6,
    pointLimit: params?.pointLimit ?? 365,
  })

  const token = params?.token ?? getBlobToken()
  const previousSnapshot = token ? await getLatestSteelPriceSnapshot(token) : null
  const updatedAt =
    previousSnapshot && isSameSteelPriceData(previousSnapshot, nextSnapshot)
      ? previousSnapshot.updatedAt
      : new Date().toISOString()
  const snapshot: DashboardSteelPriceResponse = {
    ...nextSnapshot,
    updatedAt,
  }

  if (token) {
    await saveSteelPriceSnapshot(snapshot, token)
  }

  return snapshot
}

export function trimSteelPriceSnapshot(
  snapshot: DashboardSteelPriceResponse,
  params?: {
    seriesLimit?: number
    pointLimit?: number
  }
): DashboardSteelPriceResponse {
  const requestedSeries = Math.max(1, params?.seriesLimit ?? snapshot.series.length)
  const requestedPoints = Math.max(1, params?.pointLimit ?? snapshot.points.length)

  const series = snapshot.series.slice(0, requestedSeries)
  const allowedKeys = new Set<string>(series.map((item) => item.key))
  const points = snapshot.points.slice(-requestedPoints).map((point) => {
    const nextPoint: Record<string, number | string | null> = {
      date: point.date,
      label: point.label,
    }

    Object.entries(point).forEach(([key, value]) => {
      if (key === "date" || key === "label" || allowedKeys.has(key)) {
        nextPoint[key] = value
      }
    })

    return nextPoint as DashboardSteelPriceResponse["points"][number]
  })

  const latestPoint = points[points.length - 1]
  const latestSeries: DashboardSteelPriceSeries[] = series.map((item) => {
    const latestValue = typeof latestPoint?.[item.key] === "number" ? (latestPoint[item.key] as number) : null
    return {
      ...item,
      latestValue,
    }
  })

  return {
    ...snapshot,
    series: latestSeries,
    points,
  }
}
