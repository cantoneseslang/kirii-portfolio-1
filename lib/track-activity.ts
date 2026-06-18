"use client"

import type { CardPermissionKey } from "@/lib/card-permissions"

type ActivityPayload = {
  eventType?: "card_click" | "page_view" | "portal_open"
  resourceKey?: CardPermissionKey | string
  resourcePath?: string
  metadata?: Record<string, unknown>
}

export async function trackActivity(payload: ActivityPayload) {
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // non-blocking
  }
}

export function trackCardClick(resourceKey: CardPermissionKey, resourcePath?: string) {
  void trackActivity({
    eventType: "card_click",
    resourceKey,
    resourcePath: resourcePath || "/dashboard",
  })
}

export function trackPageView(resourcePath: string) {
  void trackActivity({
    eventType: "page_view",
    resourcePath,
  })
}
