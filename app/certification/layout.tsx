"use client"

import { CardAccessGuard } from "@/components/card-access-guard"

export default function CertificationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CardAccessGuard cardKey="certificate">{children}</CardAccessGuard>
}
