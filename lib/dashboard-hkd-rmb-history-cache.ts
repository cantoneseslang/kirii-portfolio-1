import "server-only"

import fs from "fs"
import path from "path"

import { list, put } from "@vercel/blob"

import { fetchHkdRmbRate, type HkdRmbRate } from "@/lib/hkd-rmb-rate"

export type HkdHistoryPoint = {
  date: string
  rate: number
  buy?: number
  sell?: number
}

export const DASHBOARD_HKD_RMB_HISTORY_BLOB_PATH = "dashboard-hkd-rmb-history/latest.json"

const SEED_RELATIVE = path.join("public", "data", "hkd-rmb-midrate-history.json")

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN
}

function normDate(d: string) {
  return d.replace(/\//g, "-")
}

export function mergeHkdRateIntoHistory(
  history: HkdHistoryPoint[],
  rate: HkdRmbRate
): HkdHistoryPoint[] {
  const todayDate = normDate(rate.date)
  const next = [...history]
  const idx = next.findIndex((h) => h.date === todayDate)
  const entry: HkdHistoryPoint = {
    date: todayDate,
    rate: rate.midRate,
    buy: rate.buyRate,
    sell: rate.sellRate,
  }
  if (idx >= 0) {
    next[idx] = { ...next[idx], ...entry }
  } else {
    next.push(entry)
  }
  return next.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

function loadSeedHistory(): HkdHistoryPoint[] {
  const fullPath = path.join(process.cwd(), SEED_RELATIVE)
  const raw = fs.readFileSync(fullPath, "utf8")
  return JSON.parse(raw) as HkdHistoryPoint[]
}

async function getLatestHkdHistoryFromBlob(token: string): Promise<HkdHistoryPoint[] | null> {
  const result = await list({
    token,
    prefix: DASHBOARD_HKD_RMB_HISTORY_BLOB_PATH,
    limit: 1,
  })
  const latest = result.blobs[0]
  if (!latest?.url) return null
  const response = await fetch(latest.url, { cache: "no-store" })
  if (!response.ok) return null
  return (await response.json()) as HkdHistoryPoint[]
}

/**
 * Blob に保存済みの履歴があればそれを返す。無ければリポジトリ内の静的 JSON をシードとして返す。
 */
export async function getBaseHkdHistory(): Promise<HkdHistoryPoint[]> {
  const token = getBlobToken()
  if (token) {
    const fromBlob = await getLatestHkdHistoryFromBlob(token)
    if (fromBlob && fromBlob.length) return fromBlob
  }
  try {
    return loadSeedHistory()
  } catch {
    return []
  }
}

/**
 * 表示用: ベース履歴に BOC から取得した当日レートをマージ（香港PCの fetch-data.ps1 と同じ考え方）。
 */
export async function getHkdHistoryMergedWithLiveRate(): Promise<HkdHistoryPoint[]> {
  const base = await getBaseHkdHistory()
  const rate = await fetchHkdRmbRate()
  return mergeHkdRateIntoHistory(base.length ? base : [], rate)
}

/**
 * Cron 用: 当日レートを取り込み、Blob に永続化（翌日以降の「前一天」比較に使う）。
 */
export async function refreshHkdRmbHistorySnapshot(params?: { token?: string }) {
  let base = await getBaseHkdHistory()
  if (!base.length) {
    try {
      base = loadSeedHistory()
    } catch {
      /* keep empty */
    }
  }
  const rate = await fetchHkdRmbRate()
  const merged = mergeHkdRateIntoHistory(base, rate)

  const token = params?.token ?? getBlobToken()
  if (token) {
    const body = JSON.stringify(merged, null, 2)
    await put(DASHBOARD_HKD_RMB_HISTORY_BLOB_PATH, body, {
      token,
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    })
  }

  return merged
}
