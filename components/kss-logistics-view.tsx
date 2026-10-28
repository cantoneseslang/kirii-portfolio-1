"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type LogisticsPayload = {
  headers?: unknown
  rows?: unknown
  last_update?: string
  success?: boolean
  message?: string
  error?: string
}

function asStringMatrix(value: unknown): string[][] {
  if (!Array.isArray(value)) return []
  return value.map((row) => {
    if (!Array.isArray(row)) return [String(row ?? "")]
    return row.map((cell) => String(cell ?? ""))
  })
}

function asStringRow(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((cell) => String(cell ?? ""))
}

function isSerialHeader(name: string) {
  const normalized = String(name || "").replace(/\s+/g, "").trim()
  return (
    normalized === "编号" ||
    normalized === "編号" ||
    normalized === "編號" ||
    normalized === "编號" ||
    normalized === "番号"
  )
}

function visibleColumnIndexes(headers: string[]) {
  const indexes = headers
    .map((header, index) => ({ header: String(header || "").trim(), index }))
    .filter((item) => !isSerialHeader(item.header))
    .map((item) => item.index)
  if (indexes.length) return indexes
  return headers.map((_, index) => index)
}

export function KssLogisticsView() {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [meta, setMeta] = useState("Loading logistics...")

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch(`/api/kss-logistics?t=${Date.now()}`, { cache: "no-store" })
        const data = (await response.json().catch(() => ({}))) as LogisticsPayload
        if (!response.ok) {
          const message = data.message || data.error || `HTTP ${response.status}`
          throw new Error(message)
        }

        let nextHeaders = asStringRow(data.headers)
        const nextRows = asStringMatrix(data.rows)
        if (!nextHeaders.length && nextRows.length) {
          const maxLen = nextRows.reduce((max, row) => Math.max(max, row.length), 0)
          nextHeaders = Array.from({ length: maxLen }, (_, index) => `Col${index + 1}`)
        }

        if (cancelled) return
        setHeaders(nextHeaders)
        setRows(nextRows)

        if (!nextHeaders.length && !nextRows.length) {
          setMeta("No logistics data.")
          return
        }

        const stamp = data.last_update
          ? new Date(data.last_update).toLocaleString()
          : new Date().toLocaleString()
        setMeta(`Rows: ${nextRows.length} | Updated: ${stamp}`)
      } catch (error) {
        if (cancelled) return
        setHeaders([])
        setRows([])
        const message = error instanceof Error ? error.message : "unknown"
        setMeta(`Logistics load error: ${message}`)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const columns = visibleColumnIndexes(headers)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-[#02315a] hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Dashboard
        </Link>
        <h1 className="text-base font-semibold text-[#02315a]">KSS Logistics</h1>
        <p className="text-sm text-[#3c3852]">KSS物流</p>
      </div>

      <div className="h-[calc(100vh-53px)] overflow-hidden bg-white p-2">
        <p className="mb-2 text-xs text-gray-500">{meta}</p>
        <div className="h-[calc(100%-24px)] overflow-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[700px] border-collapse text-xs text-gray-900">
            <thead>
              {headers.length > 0 && (
                <tr>
                  {columns.map((index) => (
                    <th
                      key={index}
                      className="sticky top-0 z-[1] border border-gray-200 bg-[#f4f7fb] px-2 py-1.5 text-left font-semibold whitespace-nowrap text-[#02315a]"
                    >
                      {headers[index] || ""}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 1 ? "bg-[#f7f7f8]" : "bg-white"}>
                  {columns.map((index) => (
                    <td
                      key={index}
                      className="border border-gray-200 px-2 py-1.5 text-left whitespace-nowrap"
                    >
                      {row[index] || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
