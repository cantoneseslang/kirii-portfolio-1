import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Logo } from "@/components/logo"
import { LogoMobile } from "@/components/logo-mobile"
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
    title: "Admin",
    href: "/admin",
  },
  {
    title: "Lunch Menu Setting",
    href: "/dashboard/lunch-menu-setting",
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
        <div className="container flex flex-row items-center justify-between gap-2">
          {/* 767px以下: ロゴ2のみ表示 */}
          <div className="flex md:hidden">
            <LogoMobile />
          </div>
          
          {/* 768px以上: 元のロゴ+標語表示 */}
          <div className="hidden md:flex md:flex-row md:items-center gap-4">
            <div className="flex items-center">
              <Logo />
            </div>
            {/* メインメッセージ */}
            <div className="block">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-[#02315a] mb-0">
                逆境轉型，革新求存
              </h2>
              <p className="text-[10px] md:text-xs lg:text-sm text-gray-600 italic -mt-1">
                Transform in Adversity. Innovate for Survival.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <DashboardDateDisplay />
          </div>
        </div>
      </div>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <DashboardNav items={navItems} />
        </aside>
        <main className="flex w-full min-w-0 flex-col">{children}</main>
      </div>
    </div>
  )
}
