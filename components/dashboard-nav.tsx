"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { getProfile } from "@/utils/profile"
import type { Profile } from "@/types/profile"

interface NavItem {
  title: string
  href: string
  disabled?: boolean
}

export function DashboardNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      
      setIsLoading(true)
      try {
        const profileData = await getProfile(user.id)
        setProfile(profileData)
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProfile()
  }, [user])

  const handleSignOut = async () => {
    try {
      await logout()
      window.location.href = '/' // ログアウト後にホームページにリダイレクト
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <nav className="grid items-start gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.disabled ? "#" : item.href}
          className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
            item.disabled && "pointer-events-none opacity-60",
          )}
        >
          {item.title}
        </Link>
      ))}
      <Button variant="ghost" className="justify-start px-3 py-2 text-sm font-medium" onClick={handleSignOut}>
        Logout
      </Button>
      
      {user && profile && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-1 px-3 text-xs font-semibold text-muted-foreground">Profile Information</p>
          <div className="space-y-1 px-3 py-1">
            <p className="text-xs">
              <span className="font-medium">Name:</span> {profile.full_name || "Not set"}
            </p>
            <p className="text-xs">
              <span className="font-medium">Department:</span> {profile.department || "Not set"}
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
