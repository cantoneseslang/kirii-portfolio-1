"use client"

import { CardAccessGuard } from "@/components/card-access-guard"

export default function CompanyInformationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CardAccessGuard cardKey="company_info">{children}</CardAccessGuard>
}
