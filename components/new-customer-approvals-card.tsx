"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { NewFeatureBadge } from "@/components/new-feature-badge"
import { useAuth } from "@/context/auth-context"
import { getApproverRole } from "@/lib/hk-new-customer-approval"

export default function NewCustomerApprovalsCard() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  const isApprover = Boolean(user?.email && getApproverRole(user.email))

  useEffect(() => {
    if (!user?.email || !isApprover) return

    let cancelled = false
    void (async () => {
      try {
        const response = await fetch(
          `/api/hk-new-customer/pending?email=${encodeURIComponent(user.email!)}`,
        )
        const result = await response.json()
        if (!cancelled && response.ok && result.success) {
          setPendingCount(typeof result.total === "number" ? result.total : result.data?.length ?? 0)
        }
      } catch {
        if (!cancelled) setPendingCount(0)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.email, isApprover])

  if (!isApprover) return null

  return (
    <Link href="/dashboard/new-customer-setting/approvals" className="block w-full">
      <div className="w-full md:w-[420px] relative p-4 rounded-xl bg-[#f1f1f3] shadow-sm cursor-pointer transition-all hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex flex-1 flex-wrap items-center gap-2 text-xl font-bold transition-colors">
            <span className="hover:text-[#02315a] hover:underline">NewCustomer Approvals</span>
            <NewFeatureBadge />
          </h3>
          {pendingCount !== null && pendingCount > 0 && (
            <span className="shrink-0 rounded-full bg-[#02315a] px-2.5 py-0.5 text-xs font-semibold text-white">
              {pendingCount}
            </span>
          )}
        </div>
        <p className="text-[#3c3852] text-sm mt-4">新客戶登記審批 · Pending approvals in Portfolio</p>

        <div className="absolute bottom-0 right-0 bg-[#02315a] p-1.5 rounded-tl-xl rounded-br-xl flex items-center justify-center transition-colors hover:bg-[#02315a] group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            height={15}
            width={15}
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path
              fill="#fff"
              d="M13.4697 17.9697C13.1768 18.2626 13.1768 18.7374 13.4697 19.0303C13.7626 19.3232 14.2374 19.3232 14.5303 19.0303L20.3232 13.2374C21.0066 12.554 21.0066 11.446 20.3232 10.7626L14.5303 4.96967C14.2374 4.67678 13.7626 4.67678 13.4697 4.96967C13.1768 5.26256 13.1768 5.73744 13.4697 6.03033L18.6893 11.25H4C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75H18.6893L13.4697 17.9697Z"
            />
          </svg>
        </div>
      </div>
    </Link>
  )
}
