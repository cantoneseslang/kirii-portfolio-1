"use client"

import { CardAccessGuard } from "@/components/card-access-guard"
import { NewCustomerIntroVideo } from "@/components/new-customer-intro-video"

export default function NewCustomerSettingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CardAccessGuard cardKey="new_customer_setting">
      <NewCustomerIntroVideo />
      {children}
    </CardAccessGuard>
  )
}
