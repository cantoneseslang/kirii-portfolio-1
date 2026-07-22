"use client"

import { useCallback, useEffect, useRef } from "react"
import type { PortfolioNotification } from "@/lib/portfolio-notifications"
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
const AR_COLLECTION_SOURCE = "sales-dashboard-ar-collection"

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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
  // AR: show inline details (iframe preview breaks for cross-app / old localhost URLs)
  const previewUrl =
    !isArCollection && shareUrl
      ? buildEmbeddedPreviewUrl(shareUrl, false)
      : !isArCollection
        ? buildEmbeddedPreviewUrl("", false)
        : ""
  previewOriginRef.current = previewUrl ? new URL(previewUrl).origin : PQ_FORM_ORIGIN

  const sendPreviewState = useCallback(() => {
    if (isArCollection) return
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
  }, [notification.payload, isArCollection])

  useEffect(() => {
    if (!previewUrl || isArCollection) return undefined
    sendPreviewState()
    const intervalId = window.setInterval(sendPreviewState, 400)
    const timeoutId = window.setTimeout(() => window.clearInterval(intervalId), 6000)
    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [previewUrl, sendPreviewState, isArCollection])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#02315a]/95 p-3 md:p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="portfolio-notification-title"
    >
      <div className="flex h-full w-full max-w-[1200px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
        <div
          className="border-b border-slate-200 bg-[#02315a] px-6 py-5 text-white md:px-8 md:py-6"
          onPointerDown={soundNeedsUnlock ? onRequestSoundUnlock : undefined}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">
            {isArCollection ? "AR Collection Notification" : "Portfolio Notification"}
          </p>
          <h2 id="portfolio-notification-title" className="mt-2 text-2xl font-bold md:text-3xl">
            {notification.title}
          </h2>
          <p className="mt-2 text-sm text-white/80 md:text-base">
            {formatDateTime(notification.created_at)}
            {pendingCount > 1 ? ` ・ 尚有 ${pendingCount - 1} 則待確認通知` : ""}
          </p>
          {notification.body ? (
            <p className="mt-2 text-sm text-white/80">{notification.body}</p>
          ) : null}
          <p className="mt-2 text-sm text-white/70">
            通知顯示期間，下方 Dashboard 無法操作。請按「確認」或「繼續作業」關閉通知。
          </p>
          {soundNeedsUnlock ? (
            <p className="mt-3 rounded-lg bg-amber-400/20 px-3 py-2 text-sm text-amber-100">
              輕觸此區域以播放提示音
            </p>
          ) : null}
          {acknowledgeError ? (
            <p className="mt-3 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100">
              {acknowledgeError}
            </p>
          ) : null}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#bdbdbd]">
          {isArCollection ? (
            <ArCollectionNotificationPreview
              payload={payload}
              body={notification.body}
            />
          ) : previewUrl ? (
            <>
              <iframe
                ref={iframeRef}
                title="生產依頼書預覽"
                src={previewUrl}
                onLoad={sendPreviewState}
                className="pointer-events-none h-full w-full border-0 opacity-80"
              />
              <div className="absolute inset-0 bg-white/15" aria-hidden="true" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-slate-600">
              此通知沒有表單預覽。請重新送出，或使用「繼續作業」開啟表單。
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
                  ? "處理中…"
                  : isArCollection
                    ? "開啟案件・留言"
                    : "繼續作業"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={acknowledging}
              className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-[#02315a] text-lg font-semibold text-white transition hover:bg-[#03467f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {acknowledging ? "確認中…" : pendingCount > 1 ? `確認（${pendingCount - 1} 則待下一則）` : "確認"}
            </button>
            {pendingCount > 1 ? (
              <button
                type="button"
                onClick={() => void onConfirmAll()}
                disabled={acknowledging}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#02315a] bg-white text-base font-semibold text-[#02315a] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acknowledging ? "處理中…" : `一次確認全部（${pendingCount} 則）`}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
