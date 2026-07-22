"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/context/auth-context"
import type { PortfolioNotification } from "@/lib/portfolio-notifications"
import { PortfolioNotificationOverlay } from "@/components/portfolio-notification-overlay"
import {
  createPortfolioNotificationSound,
  playPortfolioNotificationSound,
  stopPortfolioNotificationSound,
} from "@/lib/portfolio-notification-sound"
import { supabase } from "@/utils/supabase"

const NOTIFICATION_POLL_MS = 2_000

export function PortfolioNotificationGate() {
  const { user, isLoading } = useAuth()
  const [notifications, setNotifications] = useState<PortfolioNotification[]>([])
  const [acknowledging, setAcknowledging] = useState(false)
  const [soundNeedsUnlock, setSoundNeedsUnlock] = useState(false)
  const [acknowledgeError, setAcknowledgeError] = useState("")
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null)

  const loadNotifications = useCallback(async () => {
    if (!user?.email) {
      setNotifications([])
      return
    }

    const normalizedEmail = user.email.trim().toLowerCase()

    try {
      const response = await fetch("/api/notifications/pending", { cache: "no-store" })
      const result = await response.json()

      if (response.ok && result.success && Array.isArray(result.data)) {
        // Prefer API result, but if empty fall through to client query as backup
        // (service-role URL misconfig can return empty/fail silently in some envs).
        if (result.data.length > 0) {
          setNotifications(result.data)
          return
        }
      } else if (!response.ok || !result.success) {
        console.warn("[portfolio-notifications] API pending failed", {
          status: response.status,
          result,
          email: normalizedEmail,
        })
      }
    } catch (error) {
      console.warn("[portfolio-notifications] API pending request failed", error)
    }

    try {
      const { data, error } = await supabase
        .from("portfolio_notifications")
        .select("id, recipient_email, title, body, payload, source, created_at, acknowledged_at")
        .is("acknowledged_at", null)
        .order("created_at", { ascending: true })

      if (error) {
        console.warn("[portfolio-notifications] Supabase client pending failed", error)
        return
      }

      const mine = (data || []).filter(
        (row) => row.recipient_email?.trim().toLowerCase() === normalizedEmail,
      ) as PortfolioNotification[]

      setNotifications(mine)
    } catch (error) {
      console.error("[portfolio-notifications] Failed to load pending notifications", error)
    }
  }, [user?.email])

  useEffect(() => {
    if (isLoading || !user?.email) return

    void loadNotifications()

    const intervalId = window.setInterval(() => {
      void loadNotifications()
    }, NOTIFICATION_POLL_MS)

    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications()
      }
    }

    window.addEventListener("focus", refreshOnFocus)
    document.addEventListener("visibilitychange", refreshOnFocus)

    const channel = supabase
      .channel(`portfolio-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "portfolio_notifications",
          // Quote email so `@` does not break the realtime filter parser
          filter: `recipient_email=eq."${user.email}"`,
        },
        () => {
          void loadNotifications()
        },
      )
      .subscribe()

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", refreshOnFocus)
      document.removeEventListener("visibilitychange", refreshOnFocus)
      void supabase.removeChannel(channel)
    }
  }, [isLoading, loadNotifications, user?.email, user?.id])

  const currentNotification = notifications[0]

  const stopNotificationSound = useCallback(() => {
    stopPortfolioNotificationSound(notificationSoundRef.current)
  }, [])

  const tryPlayNotificationSound = useCallback(async () => {
    if (!notificationSoundRef.current) {
      notificationSoundRef.current = createPortfolioNotificationSound()
    }

    const played = await playPortfolioNotificationSound(notificationSoundRef.current)
    setSoundNeedsUnlock(!played)
    return played
  }, [])

  useEffect(() => {
    if (!currentNotification) {
      stopNotificationSound()
      setSoundNeedsUnlock(false)
      setAcknowledgeError("")
      return
    }

    void tryPlayNotificationSound()

    return () => {
      stopNotificationSound()
    }
  }, [currentNotification?.id, stopNotificationSound, tryPlayNotificationSound])

  const acknowledgeNotificationIds = useCallback(async (ids: string[]) => {
    if (!ids.length || acknowledging) return false

    stopNotificationSound()
    setAcknowledging(true)
    setAcknowledgeError("")

    try {
      let failed = 0
      for (const id of ids) {
        const response = await fetch(`/api/notifications/${id}/acknowledge`, {
          method: "POST",
        })
        const result = await response.json()
        if (!result.success) {
          failed += 1
        }
      }

      if (failed > 0) {
        setAcknowledgeError(`有 ${failed} 則通知未能確認，請再試一次`)
      }

      setNotifications((prev) => prev.filter((item) => !ids.includes(item.id)))
      await loadNotifications()
      return failed === 0
    } catch (error) {
      console.error("Failed to acknowledge portfolio notification", error)
      setAcknowledgeError("確認失敗，請再試一次")
      return false
    } finally {
      setAcknowledging(false)
    }
  }, [acknowledging, loadNotifications, stopNotificationSound])

  const handleConfirm = async () => {
    if (!currentNotification) return
    await acknowledgeNotificationIds([currentNotification.id])
  }

  const handleConfirmAll = async () => {
    await acknowledgeNotificationIds(notifications.map((item) => item.id))
  }

  const handleContinueWork = async (shareUrl: string) => {
    if (!currentNotification) return
    const acknowledged = await acknowledgeNotificationIds([currentNotification.id])
    if (acknowledged && shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleRequestSoundUnlock = () => {
    void tryPlayNotificationSound()
  }

  if (!currentNotification) {
    return null
  }

  return (
    <PortfolioNotificationOverlay
      notification={currentNotification}
      pendingCount={notifications.length}
      acknowledging={acknowledging}
      acknowledgeError={acknowledgeError}
      soundNeedsUnlock={soundNeedsUnlock}
      onConfirm={handleConfirm}
      onConfirmAll={handleConfirmAll}
      onContinueWork={handleContinueWork}
      onRequestSoundUnlock={handleRequestSoundUnlock}
    />
  )
}
