import { requireCardAccessPage } from "@/lib/portfolio-access"
import { MillCertificationClient } from "@/components/mill-certification-client"

export default async function MillCertificationPage() {
  await requireCardAccessPage("mill_certification")
  return <MillCertificationClient />
}
