"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PortfolioNotification } from "@/lib/portfolio-notifications"
import {
  formatPortfolioNotificationDateTime,
  getPortfolioNotificationSenderDisplay,
  getPortfolioNotificationSourceLabel,
} from "@/lib/portfolio-notifications"
import { NotificationReadableDetails } from "@/components/notification-readable-details"

function openHref(notification: PortfolioNotification): string | null {
  const payload = notification.payload || {}
  const shareUrl = typeof payload.shareUrl === "string" ? payload.shareUrl : ""
  if (shareUrl) return shareUrl

  const registrationId =
    typeof payload.registrationId === "string"
      ? payload.registrationId
      : typeof payload.caseId === "string"
        ? payload.caseId
        : ""

  if (notification.source.includes("new-customer") && registrationId) {
    return `/dashboard/new-customer-setting?tab=search&id=${encodeURIComponent(registrationId)}`
  }

  return null
}

export default function NotificationsInboxPage() {
  const { user, isLoading } = useAuth()
  const [items, setItems] = useState<PortfolioNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.email) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/notifications/inbox?limit=80", { cache: "no-store" })
      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load inbox")
      }
      setItems(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox")
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  useEffect(() => {
    if (isLoading) return
    void load()
  }, [isLoading, load])

  const filtered = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !n.acknowledged_at)
    if (filter === "read") return items.filter((n) => Boolean(n.acknowledged_at))
    return items
  }, [filter, items])

  const selected = filtered.find((n) => n.id === selectedId) || filtered[0] || null

  useEffect(() => {
    if (selected && selectedId !== selected.id) {
      setSelectedId(selected.id)
    }
  }, [selected, selectedId])

  if (isLoading) {
    return <div className="py-10 text-sm text-muted-foreground">Loading…</div>
  }

  if (!user?.email) {
    return <div className="py-10 text-sm text-red-600">Please sign in to view inbox.</div>
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#02315a]">Notifications</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
          >
            Unread
          </Button>
          <Button
            variant={filter === "read" ? "default" : "outline"}
            onClick={() => setFilter("read")}
          >
            Read
          </Button>
          <Button variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inbox</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${filtered.length} item(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[70vh] space-y-2 overflow-y-auto p-3 pt-0">
            {!loading && filtered.length === 0 ? (
              <p className="px-2 py-6 text-sm text-muted-foreground">No notifications.</p>
            ) : (
              filtered.map((item) => {
                const active = selected?.id === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      active
                        ? "border-[#02315a] bg-[#02315a]/5"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                        {item.title}
                      </p>
                      {!item.acknowledged_at ? (
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          NEW
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {getPortfolioNotificationSourceLabel(item.source)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Submitted by / 送信者:</span>{" "}
                      {getPortfolioNotificationSenderDisplay(item)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Submitted at / 送信日時:</span>{" "}
                      {formatPortfolioNotificationDateTime(item.created_at)} (HKT)
                    </p>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selected ? selected.title : "Select a notification"}
            </CardTitle>
            {selected ? (
              <CardDescription className="space-y-1">
                <p>{getPortfolioNotificationSourceLabel(selected.source)}</p>
                <p>
                  <span className="font-medium text-foreground">Submitted by / 送信者:</span>{" "}
                  {getPortfolioNotificationSenderDisplay(selected)}
                </p>
                <p>
                  <span className="font-medium text-foreground">Submitted at / 送信日時:</span>{" "}
                  {formatPortfolioNotificationDateTime(selected.created_at)} (HKT)
                </p>
                {selected.acknowledged_at ? (
                  <p>
                    <span className="font-medium text-foreground">Confirmed at / 確認日時:</span>{" "}
                    {formatPortfolioNotificationDateTime(selected.acknowledged_at)} (HKT)
                  </p>
                ) : (
                  <p>Unread / 未読</p>
                )}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <p className="text-sm text-muted-foreground">Select a notification from the list.</p>
            ) : (
              <>
                {selected.body ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700">
                    {selected.body}
                  </p>
                ) : null}

                <div className="rounded-lg border border-slate-200 p-4">
                  <NotificationReadableDetails
                    source={selected.source}
                    payload={selected.payload || {}}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {openHref(selected) ? (
                    <Button asChild>
                      <a
                        href={openHref(selected)!}
                        target={
                          openHref(selected)!.startsWith("http") ? "_blank" : undefined
                        }
                        rel="noopener noreferrer"
                      >
                        Open related page
                      </a>
                    </Button>
                  ) : null}
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
