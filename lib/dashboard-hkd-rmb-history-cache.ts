import "server-only"

import fs from "fs"
import path from "path"

import { list, put } from "@vercel/blob"

import { normalizeDateToYmd, toYmdKey } from "@/lib/hkd-rmb-date"
import { fetchHkdRmbRate, type HkdRmbRate } from "@/lib/hkd-rmb-rate"

import backfillHistoryFallback from "@/public/data/hkd-rmb-history-backfill.json"
import seedHistoryFallback from "@/public/data/hkd-rmb-midrate-history.json"

export type HkdHistoryPoint = {
  date: string
  rate: number
  buy?: number
  sell?: number
}

const DAILY_BLOB_PREFIX = "dashboard-hkd-rmb-history/daily/"

const SEED_RELATIVE = path.join("public", "data", "hkd-rmb-midrate-history.json")
const BACKFILL_RELATIVE = path.join("public", "data", "hkd-rmb-history-backfill.json")

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN
}

function normalizeHistoryPoint(value: unknown): HkdHistoryPoint | null {
  if (!value || typeof value !== "object") return null

  const raw = value as {
    date?: unknown
    rate?: unknown
    buy?: unknown
    sell?: unknown
  }

  if (typeof raw.date !== "string" || !raw.date.trim()) return null
  const date = normalizeDateToYmd(raw.date.trim())
  if (!date) return null

  const rateNum = typeof raw.rate === "number" ? raw.rate : Number(raw.rate)
  if (!Number.isFinite(rateNum)) return null

  const point: HkdHistoryPoint = { date, rate: rateNum }
  if (typeof raw.buy === "number" && Number.isFinite(raw.buy)) point.buy = raw.buy
  if (typeof raw.sell === "number" && Number.isFinite(raw.sell)) point.sell = raw.sell
  return point
}

function sanitizeHistory(values: unknown[]): HkdHistoryPoint[] {
  const map = new Map<string, HkdHistoryPoint>()
  for (const value of values) {
    const point = normalizeHistoryPoint(value)
    if (!point) continue
    const prev = map.get(point.date)
    map.set(point.date, { ...prev, ...point })
  }
  return Array.from(map.values()).sort((a, b) => {
    const ka = toYmdKey(a.date) ?? 0
    const kb = toYmdKey(b.date) ?? 0
    return ka - kb
  })
}

export function mergeHkdRateIntoHistory(
  history: HkdHistoryPoint[],
  rate: HkdRmbRate
): HkdHistoryPoint[] {
  const base = sanitizeHistory(history)
  const todayDate = normalizeDateToYmd(rate.date)
  if (!todayDate) return base
  const entry: HkdHistoryPoint = {
    date: todayDate,
    rate: rate.midRate,
    buy: rate.buyRate,
    sell: rate.sellRate,
  }
  return sanitizeHistory([...base, entry])
}

function loadSeedHistory(): HkdHistoryPoint[] {
  try {
    const fullPath = path.join(process.cwd(), SEED_RELATIVE)
    const raw = fs.readFileSync(fullPath, "utf8")
    const parsed = JSON.parse(raw) as unknown
    return sanitizeHistory(Array.isArray(parsed) ? parsed : [])
  } catch {
    const parsedFallback = seedHistoryFallback as unknown
    return sanitizeHistory(Array.isArray(parsedFallback) ? parsedFallback : [])
  }
}

function loadBackfillHistory(): HkdHistoryPoint[] {
  try {
    const fullPath = path.join(process.cwd(), BACKFILL_RELATIVE)
    const raw = fs.readFileSync(fullPath, "utf8")
    const parsed = JSON.parse(raw) as unknown
    return sanitizeHistory(Array.isArray(parsed) ? parsed : [])
  } catch {
    const parsedFallback = backfillHistoryFallback as unknown
    return sanitizeHistory(Array.isArray(parsedFallback) ? parsedFallback : [])
  }
}

/**
 * Blob の daily/ 以下にある全日別ファイルを読み、ポイント配列として返す。
 * 各ファイルは 1 日分の { date, rate, buy?, sell? } を格納。
 */
async function getAllDailyBlobPoints(token: string): Promise<HkdHistoryPoint[]> {
  const allPoints: HkdHistoryPoint[] = []
  let cursor: string | undefined

  for (;;) {
    const result = await list({
      token,
      prefix: DAILY_BLOB_PREFIX,
      limit: 1000,
      cursor,
    })

    const fetches = result.blobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url, { cache: "no-store" })
        if (!res.ok) return null
        return (await res.json()) as unknown
      } catch {
        return null
      }
    })

    const bodies = await Promise.all(fetches)
    for (const body of bodies) {
      if (!body) continue
      const point = normalizeHistoryPoint(body)
      if (point) allPoints.push(point)
    }

    if (!result.hasMore) break
    cursor = result.cursor
  }

  return allPoints
}

/**
 * 1 日分のレートポイントを日別 Blob に保存。
 * パスは daily/YYYY-MM-DD.json で、同日の再実行は上書き（同日の最新値で更新されるだけ）。
 */
async function saveDailyBlobPoint(point: HkdHistoryPoint, token: string) {
  const blobPath = `${DAILY_BLOB_PREFIX}${point.date}.json`
  await put(blobPath, JSON.stringify(point), {
    token,
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  })
}

/**
 * seed + 全日別 Blob をマージして返す。
 * 日別 Blob は個別ファイルなので、1 回の上書きで他の日が消えることがない。
 */
export async function getBaseHkdHistory(): Promise<HkdHistoryPoint[]> {
  let seed: HkdHistoryPoint[] = []
  let backfill: HkdHistoryPoint[] = []
  try {
    seed = loadSeedHistory()
  } catch {
    /* empty */
  }
  try {
    backfill = loadBackfillHistory()
  } catch {
    /* empty */
  }

  const token = getBlobToken()
  if (token) {
    const dailyPoints = await getAllDailyBlobPoints(token)
    if (dailyPoints.length) {
      return sanitizeHistory([...seed, ...backfill, ...dailyPoints])
    }
  }
  return sanitizeHistory([...seed, ...backfill])
}

/**
 * 表示用: ベース履歴 + BOC 当日レート。
 */
export async function getHkdHistoryMergedWithLiveRate(): Promise<HkdHistoryPoint[]> {
  const base = await getBaseHkdHistory()
  const rate = await fetchHkdRmbRate()
  const token = getBlobToken()
  const todayDate = normalizeDateToYmd(rate.date)
  if (token && todayDate && !base.some((point) => point.date === todayDate)) {
    await saveDailyBlobPoint(
      {
        date: todayDate,
        rate: rate.midRate,
        buy: rate.buyRate,
        sell: rate.sellRate,
      },
      token
    )
  }
  return mergeHkdRateIntoHistory(base.length ? base : [], rate)
}

/**
 * Cron 用: 当日レートを日別 Blob に永続化。
 * 日別ファイルなので、過去日の蓄積を壊さない。
 */
export async function refreshHkdRmbHistorySnapshot(params?: { token?: string }) {
  const token = params?.token ?? getBlobToken()
  const rate = await fetchHkdRmbRate()
  const todayDate = normalizeDateToYmd(rate.date)
  if (!todayDate) {
    throw new Error(`Invalid HKD date from source: ${rate.date}`)
  }
  const point: HkdHistoryPoint = {
    date: todayDate,
    rate: rate.midRate,
    buy: rate.buyRate,
    sell: rate.sellRate,
  }

  if (token) {
    await saveDailyBlobPoint(point, token)
  }

  const base = await getBaseHkdHistory()
  return mergeHkdRateIntoHistory(base.length ? base : [], rate)
}
