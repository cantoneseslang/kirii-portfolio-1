"use client"

import { CardAccessGuard } from "@/components/card-access-guard"

export default function NewCustomerSettingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CardAccessGuard cardKey="new_customer_setting">{children}</CardAccessGuard>
}
