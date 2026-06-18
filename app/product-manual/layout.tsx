"use client"

import { CardAccessGuard } from "@/components/card-access-guard"

export default function ProductManualLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CardAccessGuard cardKey="product_manual">{children}</CardAccessGuard>
}
