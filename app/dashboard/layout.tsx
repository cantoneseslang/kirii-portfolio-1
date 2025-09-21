import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Logo } from "@/components/logo"
import DashboardDateDisplay from "@/components/dashboard-date-display"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
  },
  {
    title: "Certification",
    href: "/certification",
  },
  {
    title: "🗣️ Cantonese Chat",
    href: "/cantonese-chat",
  },
  {
    title: "Admin",
    href: "/admin",
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b pb-2 pt-2">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            {/* メインメッセージ */}
            <div className="hidden md:block">
              <h2 className="text-3xl md:text-4xl font-bold text-[#02315a] mb-0">
                逆境轉型，革新求存
              </h2>
              <p className="text-sm md:text-base text-gray-600 italic -mt-1">
                Transform in Adversity. Innovate for Survival.
              </p>
            </div>
          </div>
          <DashboardDateDisplay />
        </div>
      </div>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <DashboardNav items={navItems} />
        </aside>
        <main className="flex w-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
