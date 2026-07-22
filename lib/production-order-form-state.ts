export type ProductionOrderFormHeader = {
  deliveryNoteNo?: string
  customerNo?: string
  orderingCompany?: string
  deliveryDate?: string
  orderDate?: string
  estimatedProductionPeriod?: string
  completionDate?: string
  personInCharge?: string
  signature?: string
  deliveryDestination?: string
  preparerSignature?: string
}

export type ProductionOrderFormProduct = {
  type?: string
  machine?: string
  thickness?: string
  width?: string
  height?: string
  length?: string
  quantity?: string
  productCode?: string
  productName?: string
  materialWidth?: string
  packagingNote?: string
  bandNote?: string
  cuttingComplete?: boolean
  packagingComplete?: boolean
  punchingComplete?: boolean
}

export type ProductionOrderFormState = {
  header: ProductionOrderFormHeader
  products: ProductionOrderFormProduct[]
}

export function extractProductionOrderFormState(
  payload: Record<string, unknown> | null | undefined,
): ProductionOrderFormState | null {
  if (!payload || typeof payload !== "object") return null
  const header = payload.header
  const products = payload.products
  if (!header || typeof header !== "object" || !Array.isArray(products)) return null
  return {
    header: header as ProductionOrderFormHeader,
    products: products as ProductionOrderFormProduct[],
  }
}
