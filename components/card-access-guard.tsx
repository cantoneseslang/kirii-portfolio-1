"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { hasCardPermission, type CardPermissionKey } from "@/lib/card-permissions"
import { trackPageView } from "@/lib/track-activity"
import { getProfile } from "@/utils/profile"

interface CardAccessGuardProps {
  cardKey: CardPermissionKey
  children: ReactNode
}

export function CardAccessGuard({ cardKey, children }: CardAccessGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace("/")
      return
    }

    let cancelled = false

    void getProfile(user.id).then((profile) => {
      if (cancelled) return

      if (!hasCardPermission(profile, cardKey)) {
        router.replace("/")
        return
      }

      setAllowed(true)
      trackPageView(window.location.pathname)
    })

    return () => {
      cancelled = true
    }
  }, [user, isLoading, cardKey, router])

  if (isLoading || !allowed) {
    return (
      <div className="container py-10">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return <>{children}</>
}
