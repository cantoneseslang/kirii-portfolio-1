"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import type { DashboardPersonalSummary } from "@/lib/dashboard-personal-summary"

type DashboardPersonalSummaryProps = {
  email?: string | null
  fullName?: string | null
}

const SUMMARY_POLL_MS = 30_000

export function DashboardPersonalSummary({ email, fullName }: DashboardPersonalSummaryProps) {
  const [summary, setSummary] = useState<DashboardPersonalSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSummary = useCallback(async (showLoading = false) => {
    if (!email && !fullName) {
      setLoading(false)
      return
    }

    if (showLoading) setLoading(true)

    const params = new URLSearchParams()
    if (email) params.set("email", email)
    if (fullName) params.set("fullName", fullName)

    try {
      const response = await fetch(`/api/dashboard/personal-summary?${params.toString()}`, {
        cache: "no-store",
      })
      const result = await response.json()
      if (result.success && result.data) {
        setSummary(result.data)
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [email, fullName])

  useEffect(() => {
    void loadSummary(true)

    const intervalId = window.setInterval(() => {
      void loadSummary(false)
    }, SUMMARY_POLL_MS)

    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        void loadSummary(false)
      }
    }

    window.addEventListener("focus", refreshOnFocus)
    document.addEventListener("visibilitychange", refreshOnFocus)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", refreshOnFocus)
      document.removeEventListener("visibilitychange", refreshOnFocus)
    }
  }, [loadSummary])

  if (loading) return null

  const hasLunch = Boolean(summary?.lunch?.hasOrder && summary.lunch.sections.length > 0)
  const hasMyApplications = (summary?.myApplications.length || 0) > 0
  const hasPendingApprovals = (summary?.pendingApprovals.length || 0) > 0

  if (!hasLunch && !hasMyApplications && !hasPendingApprovals) {
    return null
  }

  return (
    <div className="rounded-lg border bg-slate-50/80 p-4 md:p-5 space-y-4 mb-6">
      {hasLunch && summary?.lunch && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">今日你訂咗嘅午餐係以下內容</h2>
          {summary.lunch.sections.map((section) => (
            <div key={section.category} className="space-y-1">
              <p className="text-sm font-medium text-slate-800">{section.category}</p>
              <ul className="text-sm text-slate-700 space-y-0.5 pl-1">
                {section.items.map((item) => (
                  <li key={`${section.category}-${item.label}`}>
                    {item.label} {item.quantity}個
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {hasMyApplications && (
        <section className="space-y-2">
          {summary!.myApplications.map((application) => (
            <p key={application.id} className="text-sm text-slate-800">
              你有一份申請{" "}
              <Link href={application.href} className="font-medium text-[#02315a] hover:underline">
                {application.labelZh}
              </Link>{" "}
              {application.statusLabelZh}
              {application.companyNameEn ? (
                <span className="text-muted-foreground">（{application.companyNameEn}）</span>
              ) : null}
            </p>
          ))}
        </section>
      )}

      {hasPendingApprovals && (
        <section className="space-y-2">
          {summary!.pendingApprovals.length === 1 ? (
            <p className="text-sm text-slate-800">
              你有 1 份{" "}
              <Link
                href={summary!.pendingApprovals[0].href}
                className="font-medium text-[#02315a] hover:underline"
              >
                {summary!.pendingApprovals[0].labelZh}
              </Link>{" "}
              待你審批
              {summary!.pendingApprovals[0].companyNameEn ? (
                <span className="text-muted-foreground">
                  （{summary!.pendingApprovals[0].companyNameEn}）
                </span>
              ) : null}
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">
                你有 {summary!.pendingApprovals.length} 份新客戶資料待你審批
              </p>
              <ul className="text-sm text-slate-700 space-y-1">
                {summary!.pendingApprovals.map((application) => (
                  <li key={application.id}>
                    <Link href={application.href} className="text-[#02315a] hover:underline">
                      {application.companyNameEn || application.labelZh}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
