"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useState, useEffect, useCallback } from "react"
import { getProfile } from "@/utils/profile"
import type { Profile } from "@/types/profile"
import { getApproverRole } from "@/lib/hk-new-customer-approval"

interface NavItem {
  title: string
  href: string
  disabled?: boolean
  approverOnly?: boolean
}

export function DashboardNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)

  const visibleItems = items.filter((item) => {
    if (!item.approverOnly) return true
    return Boolean(user?.email && getApproverRole(user.email))
  })

  const loadNotificationCount = useCallback(async () => {
    if (!user?.email) {
      setNotificationCount(0)
      return
    }
    try {
      const res = await fetch("/api/notifications/inbox?limit=200", { cache: "no-store" })
      const result = await res.json()
      if (res.ok && result.success && Array.isArray(result.data)) {
        setNotificationCount(result.data.length)
      }
    } catch {
      // keep previous count
    }
  }, [user?.email])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      try {
        const profileData = await getProfile(user.id)
        setProfile(profileData)
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }

    void loadProfile()
  }, [user])

  useEffect(() => {
    if (!user?.email) return
    void loadNotificationCount()
    const id = window.setInterval(() => {
      void loadNotificationCount()
    }, 15000)
    const onFocus = () => {
      void loadNotificationCount()
    }
    window.addEventListener("focus", onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener("focus", onFocus)
    }
  }, [loadNotificationCount, user?.email])

  const handleSignOut = async () => {
    try {
      await logout()
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <nav className="grid w-full min-w-0 items-start gap-2">
      {visibleItems.map((item) => {
        const isNotifications = item.href === "/dashboard/notifications"
        const label =
          isNotifications && notificationCount > 0
            ? `${item.title} (${notificationCount})`
            : item.title
        return (
          <Link
            key={item.href}
            href={item.disabled ? "#" : item.href}
            className={cn(
              "flex w-full min-w-0 items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
              item.disabled && "pointer-events-none opacity-60",
            )}
          >
            <span className="min-w-0 whitespace-normal break-words">{label}</span>
          </Link>
        )
      })}
      <Button
        variant="ghost"
        className="h-auto w-full min-w-0 justify-start whitespace-normal px-3 py-2 text-sm font-medium"
        onClick={handleSignOut}
      >
        Logout
      </Button>

      {user && profile && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-1 px-3 text-xs font-semibold text-muted-foreground">
            Profile Information
          </p>
          <div className="space-y-1 px-3 py-1">
            <p className="text-xs">
              <span className="font-medium">Name:</span> {profile.full_name || "Not set"}
            </p>
            <p className="text-xs">
              <span className="font-medium">Department:</span>{" "}
              {profile.department || "Not set"}
            </p>
            <p className="text-xs">
              <span className="font-medium">Position:</span> {profile.position || "Not set"}
            </p>
            <p className="text-xs">
              <span className="font-medium">Admin:</span> {profile.is_admin ? "Yes" : "No"}
            </p>
          </div>
        </div>
      )}
    </nav>
  )
}
