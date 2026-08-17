"use client"

import { FactoryErpCardShell } from "@/components/factory-erp-card-shell"

const ShippingStatusCard = () => (
  <FactoryErpCardShell
    href="/shipping-status"
    title="Auto-save shipping status"
    subtitle="出貨情況自動紀錄"
    showNewBadge
  />
)

export default ShippingStatusCard
