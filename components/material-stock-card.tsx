"use client"

import { FactoryErpCardShell } from "@/components/factory-erp-card-shell"

const MaterialStockCard = () => (
  <FactoryErpCardShell
    href="https://pq-form.vercel.app/material-stock-take/"
    title="MaterialStock"
    subtitle="原材料庫存"
    showNewBadge
    external
  />
)

export default MaterialStockCard
