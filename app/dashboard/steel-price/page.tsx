import Link from "next/link"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import SteelPriceChartCard from "@/components/steel-price-chart-card"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"

export default function DashboardSteelPricePage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Galvanized steel coil"
        text="Latest galvanized steel price trend details"
      >
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </DashboardHeader>

      <SteelPriceChartCard variant="detail" />
      <Footer />
    </DashboardShell>
  )
}
