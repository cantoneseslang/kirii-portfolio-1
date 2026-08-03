"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { PortfolioNotification } from "@/lib/portfolio-notifications"
import {
  formatPortfolioNotificationDateTime,
  getPortfolioNotificationSenderDisplay,
  getPortfolioNotificationSourceLabel,
} from "@/lib/portfolio-notifications"
import { AR_COLLECTION_CONFIRMED_SOURCE } from "@/lib/ar-collection-staff"
import { PortfolioNotificationOverlay } from "@/components/portfolio-notification-overlay"
import { NotificationReadableDetails } from "@/components/notification-readable-details"

const SAMPLE_PAYLOAD = {
  customerCode: "K0112",
  customerEnName: "SAMPLE TRADING CO LTD",
  customerCnName: "Sample Trading Limited",
  salespersonName: "Anson Lam",
  recordedBy: "Anson Lam",
  monthLabel: "2026-07",
  monthKey: "2026-07",
  amount: 128450.5,
  expectedCollectionDate: "2026-08-15",
  collectionMethod: "bank_transfer",
  shareUrl: "https://example.com/ar-collection/sample",
  confirmedByName: "Sakon",
  confirmedByEmail: "hiroki.sakon@kirii.com.hk",
  confirmedAt: "2026-08-03T10:12:00.000Z",
  kind: "ar-collection-confirmed",
}

function buildSampleNotification(): PortfolioNotification {
  return {
    id: "preview-ar-confirmed",
    recipient_email: "anson@kirii.com.hk",
    title: "Sakon confirmed: AR K0112 · SAMPLE TRADING CO LTD",
    body: "Sakon confirmed your AR Collection plan (Recorded by: Anson Lam).",
    payload: SAMPLE_PAYLOAD,
    source: AR_COLLECTION_CONFIRMED_SOURCE,
    created_at: new Date().toISOString(),
    acknowledged_at: null,
  }
}

export function ArConfirmNotificationPreview() {
  const sample = useMemo(() => buildSampleNotification(), [])
  const [showOverlay, setShowOverlay] = useState(true)
  const [view, setView] = useState<"overlay" | "inbox">("overlay")

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Local preview
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#02315a]">
          AR confirmation reply (sender view)
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          When Sakon presses Confirm on an AR notification, the sender (Recorded by)
          receives the same style of blocking popup and inbox item in Portfolio.
          This page is a local display sample.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setView("overlay")
              setShowOverlay(true)
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              view === "overlay"
                ? "bg-[#0a6b3f] text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            1. Blocking popup
          </button>
          <button
            type="button"
            onClick={() => {
              setView("inbox")
              setShowOverlay(false)
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              view === "inbox"
                ? "bg-[#0a6b3f] text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            2. Inbox list
          </button>
          <Link
            href="/dashboard/notifications"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Open live inbox
          </Link>
        </div>
      </div>

      {view === "inbox" ? (
        <div className="mx-auto grid max-w-6xl gap-4 p-4 md:grid-cols-[340px_minmax(0,1fr)] md:p-8">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-1 pb-2 text-sm font-semibold text-slate-800">Inbox</p>
            <button
              type="button"
              className="w-full rounded-lg border border-[#02315a] bg-[#02315a]/5 px-3 py-3 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                  {sample.title}
                </p>
                <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                  NEW
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {getPortfolioNotificationSourceLabel(sample.source)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-medium text-slate-600">Submitted by:</span>{" "}
                {getPortfolioNotificationSenderDisplay(sample)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                <span className="font-medium text-slate-600">Submitted at:</span>{" "}
                {formatPortfolioNotificationDateTime(sample.created_at)} (HKT)
              </p>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{sample.title}</h2>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <p>{getPortfolioNotificationSourceLabel(sample.source)}</p>
              <p>
                <span className="font-medium text-slate-800">Submitted by:</span>{" "}
                {getPortfolioNotificationSenderDisplay(sample)}
              </p>
              <p>
                <span className="font-medium text-slate-800">Submitted at:</span>{" "}
                {formatPortfolioNotificationDateTime(sample.created_at)} (HKT)
              </p>
              <p>Unread</p>
            </div>
            {sample.body ? (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700">
                {sample.body}
              </p>
            ) : null}
            <div className="mt-4 rounded-lg border border-slate-200 p-4">
              <NotificationReadableDetails
                source={sample.source}
                payload={sample.payload}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative min-h-[70vh] p-6">
          <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            <p className="text-sm">
              A green confirmation popup overlays the dashboard (interaction locked underneath).
            </p>
            <button
              type="button"
              onClick={() => setShowOverlay(true)}
              className="mt-4 rounded-lg bg-[#0a6b3f] px-4 py-2 text-sm font-semibold text-white"
            >
              Show popup again
            </button>
          </div>
        </div>
      )}

      {showOverlay && view === "overlay" ? (
        <PortfolioNotificationOverlay
          notification={sample}
          pendingCount={1}
          acknowledging={false}
          acknowledgeError=""
          soundNeedsUnlock={false}
          onConfirm={() => setShowOverlay(false)}
          onConfirmAll={() => setShowOverlay(false)}
          onContinueWork={() => setShowOverlay(false)}
          onRequestSoundUnlock={() => undefined}
        />
      ) : null}
    </div>
  )
}
