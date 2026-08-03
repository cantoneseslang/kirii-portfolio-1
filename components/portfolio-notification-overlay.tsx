"use client"

import { useCallback, useEffect, useRef } from "react"
import type { PortfolioNotification } from "@/lib/portfolio-notifications"
import {
  AR_COLLECTION_CONFIRMED_SOURCE,
  AR_COLLECTION_SOURCE,
} from "@/lib/ar-collection-staff"
import { extractProductionOrderFormState } from "@/lib/production-order-form-state"
import { ArCollectionNotificationPreview } from "@/components/ar-collection-notification-preview"

type PortfolioNotificationOverlayProps = {
  notification: PortfolioNotification
  pendingCount: number
  acknowledging: boolean
  acknowledgeError: string
  soundNeedsUnlock: boolean
  onConfirm: () => void
  onConfirmAll: () => void
  onContinueWork: (shareUrl: string) => void
  onRequestSoundUnlock: () => void
}

const PQ_FORM_ORIGIN = "https://pq-form.vercel.app"

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Hong_Kong",
  })
}

function buildEmbeddedPreviewUrl(shareUrl: string, isArCollection: boolean) {
  if (!shareUrl) {
    return isArCollection
      ? ""
      : `${PQ_FORM_ORIGIN}/production-order/?preview=1&embedded=1`
  }
  const url = new URL(shareUrl)
  if (!isArCollection) {
    url.searchParams.set("preview", "1")
    url.searchParams.set("embedded", "1")
  }
  return url.toString()
}

export function PortfolioNotificationOverlay({
  notification,
  pendingCount,
  acknowledging,
  acknowledgeError,
  soundNeedsUnlock,
  onConfirm,
  onConfirmAll,
  onContinueWork,
  onRequestSoundUnlock,
}: PortfolioNotificationOverlayProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewOriginRef = useRef(PQ_FORM_ORIGIN)
  const payload = notification.payload || {}
  const shareUrl = typeof payload.shareUrl === "string" ? payload.shareUrl : ""
  const isArCollection = notification.source === AR_COLLECTION_SOURCE
  const isArConfirmed = notification.source === AR_COLLECTION_CONFIRMED_SOURCE
  const isArRelated = isArCollection || isArConfirmed
  // AR: show inline details (iframe preview breaks for cross-app / old localhost URLs)
  const previewUrl =
    !isArRelated && shareUrl
      ? buildEmbeddedPreviewUrl(shareUrl, false)
      : !isArRelated
        ? buildEmbeddedPreviewUrl("", false)
        : ""
  previewOriginRef.current = previewUrl ? new URL(previewUrl).origin : PQ_FORM_ORIGIN

  const sendPreviewState = useCallback(() => {
    if (isArRelated) return
    const formState = extractProductionOrderFormState(notification.payload)
    const targetWindow = iframeRef.current?.contentWindow
    if (!formState || !targetWindow) return
    targetWindow.postMessage(
      {
        type: "pq-form-apply-state",
        formState,
      },
      previewOriginRef.current,
    )
  }, [notification.payload, isArRelated])

  useEffect(() => {
    if (!previewUrl || isArRelated) return undefined
    sendPreviewState()
    const intervalId = window.setInterval(sendPreviewState, 400)
    const timeoutId = window.setTimeout(() => window.clearInterval(intervalId), 6000)
    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [previewUrl, sendPreviewState, isArRelated])

  const headerClass = isArConfirmed
    ? "border-b border-emerald-800/40 bg-[#0a6b3f] px-6 py-5 text-white md:px-8 md:py-6"
    : "border-b border-slate-200 bg-[#02315a] px-6 py-5 text-white md:px-8 md:py-6"
  const backdropClass = isArConfirmed
    ? "fixed inset-0 z-[100] flex items-center justify-center bg-[#0a6b3f]/92 p-3 md:p-6"
    : "fixed inset-0 z-[100] flex items-center justify-center bg-[#02315a]/95 p-3 md:p-6"
  const headerLabel = isArConfirmed
    ? "AR Confirmed by Sakon"
    : isArCollection
      ? "AR Collection Notification"
      : "Portfolio Notification"

  return (
    <div
      className={backdropClass}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="portfolio-notification-title"
    >
      <div className="flex h-full w-full max-w-[1200px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
        <div
          className={headerClass}
          onPointerDown={soundNeedsUnlock ? onRequestSoundUnlock : undefined}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">
            {headerLabel}
          </p>
          <h2 id="portfolio-notification-title" className="mt-2 text-2xl font-bold md:text-3xl">
            {notification.title}
          </h2>
          <p className="mt-2 text-sm text-white/80 md:text-base">
            {formatDateTime(notification.created_at)}
            {pendingCount > 1 ? ` · ${pendingCount - 1} more pending` : ""}
          </p>
          {notification.body ? (
            <p className="mt-2 text-sm text-white/80">{notification.body}</p>
          ) : null}
          <p className="mt-2 text-sm text-white/70">
            {isArConfirmed
              ? "Sakon confirmed your AR submission. Press Confirm to dismiss, or open the case for details."
              : "While this notification is open, the dashboard below is locked. Press Confirm or Continue to dismiss."}
          </p>
          {soundNeedsUnlock ? (
            <p className="mt-3 rounded-lg bg-amber-400/20 px-3 py-2 text-sm text-amber-100">
              Tap this area to enable notification sound
            </p>
          ) : null}
          {acknowledgeError ? (
            <p className="mt-3 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100">
              {acknowledgeError}
            </p>
          ) : null}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#bdbdbd]">
          {isArRelated ? (
            <ArCollectionNotificationPreview
              payload={payload}
              body={notification.body}
              confirmed={isArConfirmed}
            />
          ) : previewUrl ? (
            <>
              <iframe
                ref={iframeRef}
                title="Production order preview"
                src={previewUrl}
                onLoad={sendPreviewState}
                className="pointer-events-none h-full w-full border-0 opacity-80"
              />
              <div className="absolute inset-0 bg-white/15" aria-hidden="true" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-slate-600">
              No form preview for this notification. Resubmit, or use Continue to open the form.
            </div>
          )}
        </div>

        <div
          className="border-t border-slate-200 bg-slate-50 px-6 py-5 md:px-8"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-3">
            {shareUrl ? (
              <button
                type="button"
                onClick={() => void onContinueWork(shareUrl)}
                disabled={acknowledging}
                className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-[#0a6b3f] text-lg font-semibold text-white transition hover:bg-[#0d8049] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acknowledging
                  ? "Working…"
                  : isArRelated
                    ? "Open case · Comment"
                    : "Continue"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={acknowledging}
              className={`inline-flex h-14 w-full items-center justify-center rounded-xl text-lg font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isArConfirmed
                  ? "bg-[#0a6b3f] hover:bg-[#0d8049]"
                  : "bg-[#02315a] hover:bg-[#03467f]"
              }`}
            >
              {acknowledging
                ? "Confirming…"
                : pendingCount > 1
                  ? `Confirm (${pendingCount - 1} more)`
                  : "Confirm"}
            </button>
            {pendingCount > 1 ? (
              <button
                type="button"
                onClick={() => void onConfirmAll()}
                disabled={acknowledging}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#02315a] bg-white text-base font-semibold text-[#02315a] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acknowledging ? "Working…" : `Confirm all (${pendingCount})`}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
