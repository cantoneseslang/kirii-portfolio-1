"use client"

import { FactoryErpCardShell } from "@/components/factory-erp-card-shell"

const ManufacturingOrderCard = () => (
  <FactoryErpCardShell
    href="https://pq-form.vercel.app/production-order/"
    title="Manufacturing Order"
    subtitle="生產依頼書"
    showNewBadge
    external
  />
)

export default ManufacturingOrderCard
