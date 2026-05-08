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
import {
  formatYmdToShort,
  getCurrentYmdInTimeZone,
  normalizeDateToYmd,
} from "@/lib/hkd-rmb-date"
import {
  resolveMonthStartComparison,
  resolvePrevBusinessDayComparison,
  sortHistoryByDate,
} from "@/lib/hkd-rmb-comparison"

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

/** 画面上端=85.0、下端=93.0（数値が大きいほど下）。 */
const FIXED_Y_DOMAIN: [number, number] = [85, 93]
const FIXED_Y_TICKS = [85, 86, 87, 88, 89, 90, 91, 92, 93]

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
  return formatYmdToShort(value)
}

/** Table 日期 column: YY/MM/DD with slashes (same as chart axis). */
function formatTableDate(ymd: string) {
  return formatAxisDate(ymd)
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
    const normalized = sortHistoryByDate(
      history
      .map((h) => {
        const date = normalizeDateToYmd(h.date)
        if (!date) return null
        return { ...h, date }
      })
      .filter((h): h is HistoryPoint => h !== null)
    )

    if (!normalized.length) return []
    if (!rate) return normalized

    const todayDate = normalizeDateToYmd(rate.date)
    if (!todayDate) return normalized
    const existing = normalized.find((h) => h.date === todayDate)
    if (existing) {
      if (existing.buy == null || existing.sell == null) {
        return normalized.map((h) =>
          h.date === todayDate
            ? { ...h, buy: rate.buyRate, sell: rate.sellRate, rate: rate.midRate }
            : h
        )
      }
      return normalized
    }
    return [
      ...normalized,
      { date: todayDate, rate: rate.midRate, buy: rate.buyRate, sell: rate.sellRate },
    ].sort((a, b) => (toYmdKey(a.date) ?? 0) - (toYmdKey(b.date) ?? 0))
  }, [history, rate])

  const chartData = useMemo(() => {
    if (!mergedHistory.length) return []
    return mergedHistory
  }, [mergedHistory])

  const dateLabel = (() => {
    if (rate) {
      const normalized = normalizeDateToYmd(rate.date) ?? rate.date
      return `${normalized}${rate.time ? ` ${rate.time}` : ""}`
    }
    if (error) return "Error"
    return "Loading..."
  })()
  const todayHongKong = getCurrentYmdInTimeZone("Asia/Hong_Kong")

  const resolvedPrev = useMemo(() => {
    if (!mergedHistory.length || !todayHongKong) return null
    return resolvePrevBusinessDayComparison(mergedHistory, todayHongKong)
  }, [mergedHistory, todayHongKong])

  const monthStartComparison = useMemo(() => {
    if (!rate || !mergedHistory.length) return null
    const monthStart = resolveMonthStartComparison(mergedHistory, rate.date)
    return monthStart
  }, [mergedHistory, rate])

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
                    <td className="py-1 pr-2 tabular-nums">{formatTableDate(rate.date)}</td>
                    <td className="py-1 pr-2 tabular-nums font-medium text-right">{fmt(rate.buyRate)}</td>
                    <td className="py-1 pr-2 tabular-nums font-medium text-right">{fmt(rate.sellRate)}</td>
                    <td className="py-1 pr-2 tabular-nums font-medium text-right">{fmt(rate.midRate)}</td>
                    <td className="py-1 pr-2 text-right"></td>
                    <td className="py-1 pr-2 text-right"></td>
                    <td className="py-1 text-right"></td>
                  </tr>
                  {resolvedPrev ? (
                    (() => {
                      const { point, targetDate, label } = resolvedPrev
                      const hasBuySell = point?.buy != null && point?.sell != null
                      return (
                        <tr className="text-slate-700 border-t border-slate-100">
                          <td className="py-1 pr-2 font-medium">{label}</td>
                          <td className="py-1 pr-2 tabular-nums">{formatTableDate(targetDate)}</td>
                          <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmt(point!.buy!) : "--"}</td>
                          <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmt(point!.sell!) : "--"}</td>
                          <td className="py-1 pr-2 tabular-nums text-right">{point ? fmt(point.rate) : "--"}</td>
                          <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmtPct(rate.buyRate, point!.buy!) : "--"}</td>
                          <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmtPct(rate.sellRate, point!.sell!) : "--"}</td>
                          <td className="py-1 tabular-nums text-right">{point ? fmtPct(rate.midRate, point.rate) : "--"}</td>
                        </tr>
                      )
                    })()
                  ) : null}
                  {monthStartComparison ? (
                    (() => {
                      const { point, targetDate } = monthStartComparison
                      const hasBuySell = point?.buy != null && point?.sell != null
                      return (
                        <tr className="text-slate-700 border-t border-slate-100">
                          <td className="py-1 pr-2 font-medium">与本月初对比</td>
                          <td className="py-1 pr-2 tabular-nums">{formatTableDate(targetDate)}</td>
                          <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmt(point!.buy!) : "--"}</td>
                          <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmt(point!.sell!) : "--"}</td>
                          <td className="py-1 pr-2 tabular-nums text-right">{point ? fmt(point.rate) : "--"}</td>
                          <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmtPct(rate.buyRate, point!.buy!) : "--"}</td>
                          <td className="py-1 pr-2 tabular-nums text-right">{hasBuySell ? fmtPct(rate.sellRate, point!.sell!) : "--"}</td>
                          <td className="py-1 tabular-nums text-right">{point ? fmtPct(rate.midRate, point.rate) : "--"}</td>
                        </tr>
                      )
                    })()
                  ) : null}
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
                    reversed
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
