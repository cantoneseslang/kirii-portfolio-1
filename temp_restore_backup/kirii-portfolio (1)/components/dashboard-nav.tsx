"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

interface NavItem {
  title: string
  href: string
  disabled?: boolean
}

export function DashboardNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleSignOut = async () => {
    try {
      await logout()
      // ログアウト後はログインページにリダイレクトされます
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
    </nav>
  )
}
