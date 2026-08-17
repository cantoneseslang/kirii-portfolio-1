"use client"

import { FactoryErpCardShell } from "@/components/factory-erp-card-shell"

/** Finished-goods inventory report (STOCK-AI-SCAN / TakeStock). Parallel to MaterialStock. */
const InventorySummaryCard = () => (
  <FactoryErpCardShell
    href="https://qr-new-six.vercel.app/take-stock"
    title="Inventory Summary"
    subtitle="製品庫存盤點表"
    showNewBadge
    external
  />
)

export default InventorySummaryCard
