"use client"

import { FactoryErpCardShell } from "@/components/factory-erp-card-shell"

const ShippingStatusCard = () => (
  <FactoryErpCardShell
    href="/shipping-status"
    title="Auto-save shipping status"
    subtitle="出貨自動監控紀錄"
    showNewBadge
  />
)

export default ShippingStatusCard
