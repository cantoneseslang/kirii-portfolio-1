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
  {
    title: "NewCustomer Setting",
    href: "/dashboard/new-customer-setting",
  },
  {
    title: "NewCustomer Approvals",
    href: "/dashboard/new-customer-setting/approvals",
    approverOnly: true,
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
        {/* Mobile: layout unchanged */}
        <div className="container flex flex-row items-center justify-between gap-2 md:hidden">
          <div className="flex">
            <LogoMobile />
          </div>
          <div className="flex flex-col items-end">
            <DashboardDateDisplay />
          </div>
        </div>

        {/* Desktop: logo left, calendar pinned to container right */}
        <div className="container hidden md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
          <div className="flex min-w-0 flex-row items-center gap-4">
            <div className="flex shrink-0 items-center">
              <Logo />
            </div>
            <div className="min-w-0">
              <h2 className="mb-0 text-lg font-bold text-[#02315a] md:text-xl lg:text-2xl">
                逆境轉型，革新求存
              </h2>
              <p className="-mt-1 text-[10px] text-gray-600 italic md:text-xs lg:text-sm">
                Transform in Adversity. Innovate for Survival.
              </p>
            </div>
          </div>
          <div className="justify-self-end">
            <DashboardDateDisplay variant="desktop" />
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
