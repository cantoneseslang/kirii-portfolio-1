import Link from "next/link"

import AluminumPriceChartCard from "@/components/aluminum-price-chart-card"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

export default function DashboardAluminumPricePage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Aluminium coil"
        text="Latest aluminum ingot price trend details"
      >
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </DashboardHeader>

      <AluminumPriceChartCard variant="detail" />
      <Footer />
    </DashboardShell>
  )
}
