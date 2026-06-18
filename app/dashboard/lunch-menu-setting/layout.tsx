"use client"

import { CardAccessGuard } from "@/components/card-access-guard"

export default function LunchMenuSettingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CardAccessGuard cardKey="lunch_order_sheet">{children}</CardAccessGuard>
}
