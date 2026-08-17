"use client"

import { CardAccessGuard } from "@/components/card-access-guard"

export default function ShippingStatusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CardAccessGuard cardKey="shipping_status">{children}</CardAccessGuard>
}
