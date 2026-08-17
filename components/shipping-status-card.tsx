"use client"

import { FactoryErpCardShell } from "@/components/factory-erp-card-shell"

/** Google Drive folder link will be wired when the shared URL is provided. */
const ShippingStatusCard = () => (
  <FactoryErpCardShell
    href="#"
    title="Auto-save shipping status"
    subtitle="出貨情況自動紀錄"
    showNewBadge
  />
)

export default ShippingStatusCard
