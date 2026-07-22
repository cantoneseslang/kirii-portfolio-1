"use client"

import { useAuth } from "@/context/auth-context"
import { PortfolioNotificationGate } from "@/components/portfolio-notification-gate"

export function PortfolioNotificationRoot() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user?.email) {
    return null
  }

  return <PortfolioNotificationGate />
}
