"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardContent } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"

type HkdRmbRate = {
  date: string
  time: string
  buyRate: number
  sellRate: number
  midRate: number
}

type HistoryPoint = {
  date: string
  rate: number
  buy?: number
  sell?: number
}

const FIXED_Y_DOMAIN: [number, number] = [87, 93]
const FIXED_Y_TICKS = [87, 88, 89, 90, 91, 92, 93]

const chartConfig: ChartConfig = {
  rate: { label: "中间价", color: "#16a34a" },
}

function fmt(value: number) {
  return value.toFixed(2)
}

function fmtPct(current: number, base: number) {
  if (!base) return "-"
  const pct = ((current - base) / base) * 100
  const str = pct.toFixed(2) + "%"
  if (pct > 0) return "+" + str
  return str
}

function formatAxisDate(value: string) {
  const parts = value.split("-")
  if (parts.length < 3) return value
  return `${parts[0].slice(-2)}/${parts[1]}/${parts[2]}`
}

function normDate(d: string) {
  return d.replace(/\//g, "-")
}

/** Calendar previous day as YYYY-MM-DD (Hong Kong calendar; no holiday handling). */
function calendarPrevDayStr(todayDate: string): string {
  const ymd = normDate(todayDate)
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 1)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(dt.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

function findPrevTradingDay(history: HistoryPoint[], todayDate: string) {
  const today = normDate(todayDate)
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].date < today) return history[i]
  }
  return null
}

/** Prefer exact calendar "yesterday" in history; otherwise last point before today (may be stale). */
function resolvePrevComparison(
  history: HistoryPoint[],
  todayDate: string
): { point: HistoryPoint; label: "前一天" | "上一笔" } | null {
  const today = normDate(todayDate)
  const yPrev = calendarPrevDayStr(todayDate)
  const exact = history.find((h) => h.date === yPrev)
  if (exact) return { point: exact, label: "前一天" }

  const lastBefore = findPrevTradingDay(history, todayDate)
  if (!lastBefore) return null
  return { point: lastBefore, label: "上一笔" }
}

function findMonthStart(history: HistoryPoint[], todayDate: string) {
  const today = normDate(todayDate)
  const monthPrefix = today.slice(0, 7) + "-01"
  for (let i = 0; i < history.length; i++) {
    if (history[i].date >= monthPrefix && history[i].date < today) return history[i]
  }
  return null
}

export default function HkdRmbRateCard() {
  const [rate, setRate] = useState<HkdRmbRate | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadRate() {
      try {
        const res = await fetch("/api/dashboard/hkd-rmb-rate", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error || "Failed to load HKD/RMB rate")
        }
        setRate((await res.json()) as HkdRmbRate)
      } catch (e) {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : "Failed to load HKD/RMB rate")
      }
    }

    async function loadHistory() {
      try {
        const res = await fetch("/api/dashboard/hkd-rmb-history", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (res.ok) {
          const data = (await res.json()) as HistoryPoint[]
          setHistory(data)
          return
        }
      } catch {
        /* try static fallback */
      }
      try {
        const res = await fetch("/data/hkd-rmb-midrate-history.json", {
          signal: controller.signal,
        })
        if (res.ok) {
          const data = (await res.json()) as HistoryPoint[]
          setHistory(data)
        }
      } catch {
        /* history is optional */
      }
    }

    loadRate()
    loadHistory()
    return () => controller.abort()
  }, [])

  const mergedHistory = useMemo(() => {
    if (!history.length) return []
    if (!rate) return history

    const todayDate = normDate(rate.date)
    const existing = history.find((h) => h.date === todayDate)
    if (existing) {
      if (existing.buy == null || existing.sell == null) {
        return history.map((h) =>
          h.date === todayDate
            ? { ...h, buy: rate.buyRate, sell: rate.sellRate, rate: rate.midRate }
            : h
        )
      }
      return history
    }
    return [
      ...history,
      { date: todayDate, rate: rate.midRate, buy: rate.buyRate, sell: rate.sellRate },
    ].sort((a, b) => (a.date < b.date ? -1 : 1))
  }, [history, rate])

  const chartData = useMemo(() => {
    if (!mergedHistory.length) return []
    return mergedHistory
  }, [mergedHistory])

  const dateLabel = rate
    ? `${rate.date}${rate.time ? ` ${rate.time}` : ""}`
    : error
      ? "Error"
      : "Loading..."

  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-2 md:static md:ml-0 md:mr-0 md:w-full md:px-0">
      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        <CardContent className="space-y-2 p-2 sm:space-y-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:gap-2 sm:text-xs">
            <a
              href="https://www.chinamoney.com.cn/chinese/bkccpr/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:px-2.5 sm:py-1"
            >
              HKD/RMB
            </a>
            <span className="text-[10px] sm:text-xs">
              {dateLabel}
            </span>
            <span className="text-[10px] text-slate-400 sm:text-xs">
              100HKD = RMB
            </span>
          </div>

          {rate ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] sm:text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-muted-foreground">
                    <th className="py-1 pr-2 font-medium"></th>
                    <th className="py-1 pr-2 font-medium">日期</th>
                    <th className="py-1 pr-2 font-medium text-center">汇买</th>
                    <th className="py-1 pr-2 font-medium text-center">汇卖</th>
                    <th className="py-1 pr-2 font-medium text-center">中行折算价</th>
                    <th className="py-1 pr-2 font-medium text-center">买入变动</th>
                    <th className="py-1 pr-2 font-medium text-center">卖出变动</th>
                    <th className="py-1 font-medium text-center">折算变动</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-slate-900 bg-amber-50/50">
                    <td className="py-1 pr-2 font-medium text-amber-700">最新外汇价</td>
                    <td className="py-1 pr-2 tabular-nums">{rate.date.replace(/^\d{2}/, "")}</td>
                    <td className="py-1 pr-2 tabular-nums font-medium text-right">{fmt(rate.buyRate)}</td>
                    <td className="py-1 pr-2 tabular-nums font-medium text-right">{fmt(rate.sellRate)}</td>
                    <td className="py-1 pr-2 tabular-nums font-medium text-right">{fmt(rate.midRate)}</td>
                    <td className="py-1 pr-2 text-right"></td>
                    <td className="py-1 pr-2 text-right"></td>
                    <td className="py-1 text-right"></td>
                  </tr>
                  {(() => {
                    const resolved = resolvePrevComparison(mergedHistory, rate.date)
                    if (!resolved) return null
                    const { point: prev, label } = resolved
                    const hasBuySell = prev.buy != null && prev.sell != null
                    return (
                      <tr className="text-slate-700 border-t border-slate-100">
                        <td className="py-1 pr-2 font-medium">{label}</td>
                        <td className="py-1 pr-2 tabular-nums">{prev.date.replace(/-/g, "/").replace(/^\d{2}/, "")}</td>
                        <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmt(prev.buy!) : ""}</td>
                        <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmt(prev.sell!) : ""}</td>
                        <td className="py-1 pr-2 tabular-nums text-right">{fmt(prev.rate)}</td>
                        <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmtPct(rate.buyRate, prev.buy!) : ""}</td>
                        <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmtPct(rate.sellRate, prev.sell!) : ""}</td>
                        <td className="py-1 tabular-nums text-right">{fmtPct(rate.midRate, prev.rate)}</td>
                      </tr>
                    )
                  })()}
                  {(() => {
                    const monthStart = findMonthStart(mergedHistory, rate.date)
                    if (!monthStart) return null
                    const hasBuySell = monthStart.buy != null && monthStart.sell != null
                    return (
                      <tr className="text-slate-700 border-t border-slate-100">
                        <td className="py-1 pr-2 font-medium">本月初</td>
                        <td className="py-1 pr-2 tabular-nums">{monthStart.date.replace(/-/g, "/").replace(/^\d{2}/, "")}</td>
                        <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmt(monthStart.buy!) : ""}</td>
                        <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmt(monthStart.sell!) : ""}</td>
                        <td className="py-1 pr-2 tabular-nums text-right">{fmt(monthStart.rate)}</td>
                        <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmtPct(rate.buyRate, monthStart.buy!) : ""}</td>
                        <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmtPct(rate.sellRate, monthStart.sell!) : ""}</td>
                        <td className="py-1 tabular-nums text-right">{fmtPct(rate.midRate, monthStart.rate)}</td>
                      </tr>
                    )
                  })()}
                </tbody>
              </table>
            </div>
          ) : error ? (
            <p className="text-[11px] text-red-500">{error}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">Loading rate...</p>
          )}

          {chartData.length > 0 && (
            <div className="rounded-lg border bg-white p-1 sm:rounded-xl sm:p-3">
              <div className="mb-1 flex justify-end sm:mb-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 sm:px-2.5 sm:py-1 sm:text-[11px]">
                  中间价
                </span>
              </div>
              <ChartContainer
                config={chartConfig}
                className="h-[160px] w-full sm:h-[180px]"
              >
                <LineChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ top: 8, right: 2, left: 2, bottom: 14 }}
                >
                  <CartesianGrid vertical stroke="#cbd5e1" strokeOpacity={0.75} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={12}
                    height={44}
                    angle={-45}
                    textAnchor="end"
                    tickMargin={8}
                    interval="preserveStartEnd"
                    tick={{ fontSize: 8 }}
                    tickFormatter={formatAxisDate}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={46}
                    domain={FIXED_Y_DOMAIN}
                    ticks={FIXED_Y_TICKS}
                    allowDecimals
                    tick={{ fontSize: 9 }}
                    tickMargin={2}
                    tickFormatter={(v: number) => v.toFixed(2)}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        labelFormatter={(value) => `Date ${String(value)}`}
                      />
                    }
                  />
                  <Line
                    dataKey="rate"
                    type="monotone"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                </LineChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
