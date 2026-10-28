import { requireCardAccessPage } from "@/lib/portfolio-access"
import { KssLogisticsView } from "@/components/kss-logistics-view"

export default async function KssLogisticsPage() {
  await requireCardAccessPage("kss_logistics")
  return <KssLogisticsView />
}
