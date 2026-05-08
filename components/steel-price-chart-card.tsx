"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import type { DashboardSteelPriceResponse } from "@/types/dashboard-steel-price"

type LoadState = "loading" | "success" | "error"
type SteelPriceChartCardProps = {
  variant?: "preview" | "detail"
}

const DETAIL_PAGE_HREF = "/dashboard/steel-price"
const CHART_SPEC_LABEL = "DX51D+Z,120"
const SHORT_LABELS: Record<string, string> = {
  "有花：1*1219*C：乐从镇：鞍钢": "有花1*1219乐从镇",
  "无花：1*1250*C：乐从镇：鞍钢": "无花1*1250乐从镇",
  "无花：1*1250*C：济南：宝钢": "无花1*1250济南",
  "无花：1*1250*C：广州：鞍钢": "无花1*1250广州",
  "无花：0.8*1250*C：乐从：鞍钢": "无花0.8*1250乐从",
  "无花：0.8*1250*C：广州：鞍钢": "无花0.8*1250广州",
}
const FIXED_Y_AXIS_DOMAIN: [number, number] = [4200, 5700]
const FIXED_Y_AXIS_TICKS = [4200, 4500, 4800, 5100, 5400, 5700]

function formatShortDate(value: string) {
  const [year, month, day] = value.split("/")
  if (!year || !month || !day) return value
  return `${month}/${day}`
}

function formatAxisDate(value: string) {
  const [year, month, day] = value.split("/")
  if (!year || !month || !day) return value
  return `${year.slice(-2)}/${month}/${day}`
}

function formatYAxisValue(value: number) {
  return `${(value / 1000).toFixed(1)}K`
}

function formatUpdatedAt(value?: string) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatLatestDataDate(value?: string) {
  if (!value) return null
  const [year, month, day] = value.split("/")
  if (!year || !month || !day) return value
  return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}`
}

function toDateNum(d: string) {
  return Number(d.replace(/\//g, ""))
}

function fmtPctSteel(current: number | null, base: number | null) {
  if (current == null || base == null || !base) return ""
  const pct = ((current - base) / base) * 100
  const str = pct.toFixed(2) + "%"
  if (pct > 0) return "+" + str
  return str
}

type CompRow = {
  label: string
  date: string
  values: Record<string, number | null>
}

function buildComparisonRows(
  points: DashboardSteelPriceResponse["points"],
  series: DashboardSteelPriceResponse["series"]
): CompRow[] {
  if (!points.length) return []

  const latest = points[points.length - 1]
  const latestNum = toDateNum(latest.date)
  const [ly, lm, ld] = latest.date.split("/").map(Number)

  function findPointByOffset(targetNum: number, direction: "exact" | "before") {
    let best: typeof points[0] | null = null
    for (let i = points.length - 1; i >= 0; i--) {
      const num = toDateNum(points[i].date)
      if (direction === "exact" && num === targetNum) return points[i]
      if (direction === "before" && num <= targetNum) {
        if (!best || num > toDateNum(best.date)) best = points[i]
        if (num === targetNum) return best
      }
    }
    return best
  }

  function findClosest(targetNum: number) {
    return findPointByOffset(targetNum, "before")
  }

  const prevDay = points.length >= 2 ? points[points.length - 2] : null

  const weekAgoTarget = new Date(ly, lm - 1, ld - 7)
  const weekAgoNum = Number(`${weekAgoTarget.getFullYear()}${String(weekAgoTarget.getMonth() + 1).padStart(2, "0")}${String(weekAgoTarget.getDate()).padStart(2, "0")}`)
  const weekAgo = findClosest(weekAgoNum)

  const monthStartNum = Number(`${ly}${String(lm).padStart(2, "0")}01`)
  const monthStart = findClosest(monthStartNum)

  const prevMonthTarget = new Date(ly, lm - 2, ld)
  const prevMonthNum = Number(`${prevMonthTarget.getFullYear()}${String(prevMonthTarget.getMonth() + 1).padStart(2, "0")}${String(prevMonthTarget.getDate()).padStart(2, "0")}`)
  const prevMonth = findClosest(prevMonthNum)

  const quarterAgoTarget = new Date(ly, lm - 4, ld)
  const quarterAgoNum = Number(`${quarterAgoTarget.getFullYear()}${String(quarterAgoTarget.getMonth() + 1).padStart(2, "0")}${String(quarterAgoTarget.getDate()).padStart(2, "0")}`)
  const quarterAgo = findClosest(quarterAgoNum)

  const yearStartNum = Number(`${ly}0101`)
  const yearStart = findClosest(yearStartNum)

  const rows: CompRow[] = []

  function addRow(label: string, point: typeof points[0] | null) {
    if (!point) return
    const vals: Record<string, number | null> = {}
    for (const s of series) {
      const v = point[s.key]
      vals[s.key] = typeof v === "number" ? v : null
    }
    rows.push({ label, date: point.date, values: vals })
  }

  addRow("最新单价", latest)
  addRow("前一天", prevDay)
  addRow("上周同期", weekAgo)
  addRow("本月初", monthStart)
  addRow("上月同期", prevMonth)
  addRow("上一季同期", quarterAgo)
  addRow("年初", yearStart)

  return rows
}

export default function SteelPriceChartCard({
  variant = "preview",
}: SteelPriceChartCardProps) {
  const [liveData, setLiveData] = useState<DashboardSteelPriceResponse | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isPreview = variant === "preview"

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      try {
        setLoadState("loading")
        setErrorMessage(null)

        const params = new URLSearchParams({
          seriesLimit: "6",
          pointLimit: "2000",
        })

        const response = await fetch(`/api/dashboard/steel-price?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(payload?.error || "Failed to load steel price data")
        }

        const payload = (await response.json()) as DashboardSteelPriceResponse
        setLiveData(payload)
        setLoadState("success")
      } catch (error) {
        if (controller.signal.aborted) return
        setLoadState("error")
        setErrorMessage(error instanceof Error ? error.message : "Failed to load steel price data")
      }
    }

    loadData()

    return () => controller.abort()
  }, [isPreview])

  const hasLiveData = Boolean(liveData?.points.length && liveData?.series.length)
  const latestPointDate = liveData?.points[liveData.points.length - 1]?.date
  const updatedAtLabel = formatLatestDataDate(latestPointDate) ?? formatUpdatedAt(liveData?.updatedAt)

  const chartConfig = useMemo(() => {
    if (!liveData) return {} as ChartConfig

    return liveData.series.reduce((config, series) => {
      config[series.key] = {
        label: series.label,
        color: series.color,
      }
      return config
    }, {} as ChartConfig)
  }, [liveData])

  const chartMarkup = hasLiveData && liveData ? (
    <div className="rounded-lg border bg-white p-1 sm:rounded-xl sm:p-3">
      <div className="mb-1 flex justify-end sm:mb-2">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 sm:px-2.5 sm:py-1 sm:text-[11px]">
          {CHART_SPEC_LABEL}
        </span>
      </div>
      <ChartContainer
        config={chartConfig}
        className={isPreview ? "h-[220px] w-full sm:h-[240px]" : "h-[300px] w-full sm:h-[420px]"}
      >
        <LineChart
          accessibilityLayer
          data={liveData.points}
          margin={{ top: 8, right: 2, left: -10, bottom: isPreview ? 14 : 24 }}
        >
          <CartesianGrid vertical stroke="#cbd5e1" strokeOpacity={0.75} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={4}
            height={isPreview ? 44 : 58}
            angle={-45}
            textAnchor="end"
            tickMargin={8}
            tick={{ fontSize: isPreview ? 8 : 10 }}
            tickFormatter={formatAxisDate}
            ticks={(() => {
              if (!liveData) return undefined
              const pts = liveData.points
              const seen = new Set<string>()
              const result: string[] = []
              for (const p of pts) {
                const ym = p.date.slice(0, 7)
                if (!seen.has(ym)) {
                  seen.add(ym)
                  result.push(p.date)
                }
              }
              if (pts.length && !result.includes(pts[pts.length - 1].date)) {
                result.push(pts[pts.length - 1].date)
              }
              return result
            })()}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            domain={FIXED_Y_AXIS_DOMAIN}
            ticks={FIXED_Y_AXIS_TICKS}
            allowDecimals={false}
            tick={{ fontSize: 9 }}
            tickMargin={2}
            tickFormatter={formatYAxisValue}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(value) => `Date ${String(value)}`}
              />
            }
          />
          
          {liveData.series.map((series) => (
            <Line
              key={series.key}
              dataKey={series.key}
              type="monotone"
              stroke={series.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  ) : null

  if (isPreview) {
    return (
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-2 md:static md:ml-0 md:mr-0 md:w-full md:px-0">
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardContent className="space-y-2 p-2 sm:space-y-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:gap-2 sm:text-xs">
              <Link
                href={DETAIL_PAGE_HREF}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:px-2.5 sm:py-1"
              >
                {hasLiveData
                  ? "Galvanized steel coil"
                  : loadState === "loading"
                    ? "Loading..."
                    : "Static Preview"}
              </Link>
              <span className="text-[10px] sm:text-xs">
                {updatedAtLabel ? `Updated ${updatedAtLabel}` : ""}
              </span>
            </div>
            {hasLiveData && liveData ? (() => {
              const compRows = buildComparisonRows(liveData.points, liveData.series)
              const latestRow = compRows[0]
              if (!compRows.length) return null
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] sm:text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-muted-foreground">
                        <th className="py-1 pr-1 text-left font-medium"></th>
                        <th className="py-1 pr-1 text-left font-medium">日期</th>
                        {liveData.series.map((s) => (
                          <th key={s.key} className="py-1 pr-1 text-center font-medium text-[9px] sm:text-[10px]" style={{ minWidth: 50, maxWidth: 70 }} title={s.label}>
                            <div><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: s.color }} /></div>
                            <div className="leading-tight">{SHORT_LABELS[s.label] || s.label}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {compRows.map((row, ri) => (
                        <tr key={ri} className={ri === 0 ? "bg-amber-50/50 text-slate-900" : "text-slate-700 border-t border-slate-100"}>
                          <td className={`py-1 pr-1 font-medium whitespace-nowrap ${ri === 0 ? "text-amber-700" : ""}`}>{row.label}</td>
                          <td className="py-1 pr-1 tabular-nums whitespace-nowrap">{row.date.replace(/^\d{2}/, "")}</td>
                          {liveData.series.map((s) => {
                            const val = row.values[s.key]
                            if (ri === 0) {
                              return <td key={s.key} className="py-1 pr-1 tabular-nums text-right font-medium">{val?.toLocaleString() ?? "--"}</td>
                            }
                            const latestVal = latestRow?.values[s.key]
                            const pct = fmtPctSteel(latestVal ?? null, val)
                            return (
                              <td key={s.key} className="py-1 pr-1 tabular-nums text-right whitespace-nowrap leading-tight">
                                <div>{val?.toLocaleString() ?? "--"}</div>
                                <div className="text-[9px] text-slate-500">{pct}</div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })() : null}
            {chartMarkup}
            {hasLiveData && liveData ? (
              <div className="space-y-0.5 text-[10px] text-slate-700 sm:space-y-1 sm:text-xs">
                {liveData.series.map((series) => (
                  <div
                    key={series.key}
                    className="grid grid-cols-[8px_1fr_auto] items-center gap-x-1.5 sm:grid-cols-[10px_1fr_auto] sm:gap-x-2"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5"
                      style={{ backgroundColor: series.color }}
                    />
                    <span className="min-w-0 truncate">{series.label}</span>
                    <span className="whitespace-nowrap pl-1 text-right font-medium tabular-nums text-slate-900">
                      {series.latestValue?.toLocaleString() || "--"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="w-full">
      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        <CardHeader className="gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl text-[#02315a]">Galvanized steel coil</CardTitle>
            <CardDescription>
              Detailed galvanized steel coil price trend. The dashboard shows only a compact recent preview.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
                  {hasLiveData
                    ? "Galvanized steel coil"
                    : loadState === "loading"
                      ? "Loading Galvanized steel coil"
                      : "Static Preview"}
                </span>
                <span>
                  {updatedAtLabel
                    ? `Updated ${updatedAtLabel}`
                    : "Preview image placed for dashboard layout review"}
                </span>
              </div>
              {hasLiveData && liveData ? (
                <div className="space-y-1 text-[11px] text-slate-700 sm:text-xs">
                  {liveData.series.map((series) => (
                    <div
                      key={series.key}
                      className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-x-2"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: series.color }}
                      />
                      <span className="min-w-0 truncate pr-1">{series.label}</span>
                      <span className="min-w-[3.4rem] text-right font-medium tabular-nums text-slate-900">
                        {series.latestValue?.toLocaleString() || "--"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-3 pt-0 sm:p-6 sm:pt-0">
          {chartMarkup}

          {hasLiveData && liveData ? (
            <div className="space-y-0.5 text-[11px] text-slate-700 sm:space-y-1 sm:text-xs">
              {liveData.series.map((series) => (
                <div
                  key={series.key}
                  className="grid grid-cols-[8px_1fr_auto] items-center gap-x-1.5 sm:grid-cols-[10px_1fr_auto] sm:gap-x-2"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5"
                    style={{ backgroundColor: series.color }}
                  />
                  <span className="min-w-0 truncate">{series.label}</span>
                  <span className="whitespace-nowrap pl-1 text-right font-medium tabular-nums text-slate-900">
                    {series.latestValue?.toLocaleString() || "--"}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              {hasLiveData
                ? `Showing ${liveData?.series.length || 0} live series from Google Sheets`
                : errorMessage || "Loading chart data..."}
            </span>
            <a
              href={liveData?.spreadsheetUrl || "https://docs.google.com/spreadsheets/d/1RQb5fBTipFZPslbG60vP46DJZ8ZD9D7a7_eaKw718nM/edit?gid=1922386555#gid=1922386555"}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#02315a] underline-offset-4 hover:underline"
            >
              Open source sheet
            </a>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
