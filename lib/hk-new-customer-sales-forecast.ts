import type { SalesForecast, SalesForecastRegion, SalesMarketRegion, SalesProductCategory } from "@/types/hk-new-customer"

export const SALES_MARKET_REGIONS: {
  value: SalesMarketRegion
  labelEn: string
  labelZh: string
}[] = [
  { value: "hong_kong", labelEn: "Hong Kong", labelZh: "香港" },
  { value: "macau", labelEn: "Macau", labelZh: "澳門" },
  { value: "china", labelEn: "Mainland China", labelZh: "大陸" },
  { value: "overseas", labelEn: "Overseas", labelZh: "海外" },
]

export const SALES_PRODUCT_CATEGORIES: {
  value: SalesProductCategory
  labelEn: string
  labelZh: string
}[] = [
  { value: "studs", labelEn: "Studs", labelZh: "Stud類" },
  { value: "gypsum_insulation", labelEn: "Gypsum Board / Insulation", labelZh: "石膏板/棉類" },
  { value: "ceiling", labelEn: "Ceiling Materials", labelZh: "天花材料" },
  { value: "other", labelEn: "Other", labelZh: "其他" },
]

function emptyLine() {
  return { sharePercent: "", monthlyAmount: "", description: "" }
}

export function emptySalesForecastRegion(): SalesForecastRegion {
  return {
    enabled: false,
    categories: {
      studs: emptyLine(),
      gypsum_insulation: emptyLine(),
      ceiling: emptyLine(),
      other: emptyLine(),
    },
  }
}

export function emptySalesForecast(): SalesForecast {
  return {
    regions: {
      hong_kong: emptySalesForecastRegion(),
      macau: emptySalesForecastRegion(),
      china: emptySalesForecastRegion(),
      overseas: emptySalesForecastRegion(),
    },
  }
}

function parseAmount(value: string): number {
  const parsed = Number(String(value).replace(/,/g, "").trim())
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function parsePercent(value: string): number {
  const parsed = Number(String(value).replace(/,/g, "").trim())
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function calculateRegionMonthlyTotal(region: SalesForecastRegion): number {
  if (!region.enabled) return 0
  return SALES_PRODUCT_CATEGORIES.reduce(
    (sum, category) => sum + parseAmount(region.categories[category.value].monthlyAmount),
    0,
  )
}

export function calculateRegionShareTotal(region: SalesForecastRegion): number {
  if (!region.enabled) return 0
  return SALES_PRODUCT_CATEGORIES.reduce(
    (sum, category) => sum + parsePercent(region.categories[category.value].sharePercent),
    0,
  )
}

export function calculateSalesForecastTotals(forecast: SalesForecast) {
  const monthlyTotal = SALES_MARKET_REGIONS.reduce(
    (sum, region) => sum + calculateRegionMonthlyTotal(forecast.regions[region.value]),
    0,
  )
  return {
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
  }
}

export function normalizeSalesForecast(value: unknown): SalesForecast {
  const base = emptySalesForecast()
  if (!value || typeof value !== "object") return base

  const record = value as Partial<SalesForecast>
  for (const region of SALES_MARKET_REGIONS) {
    const rawRegion = record.regions?.[region.value]
    if (!rawRegion || typeof rawRegion !== "object") continue

    base.regions[region.value].enabled = Boolean(rawRegion.enabled)
    for (const category of SALES_PRODUCT_CATEGORIES) {
      const rawLine = rawRegion.categories?.[category.value]
      if (!rawLine || typeof rawLine !== "object") continue
      base.regions[region.value].categories[category.value] = {
        sharePercent: String(rawLine.sharePercent ?? "").trim(),
        monthlyAmount: String(rawLine.monthlyAmount ?? "").trim(),
        description: String(rawLine.description ?? "").trim(),
      }
    }
  }

  return base
}

export function formatHkdAmount(value: number): string {
  return value.toLocaleString("en-HK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function validateSalesForecastForSubmit(forecast: SalesForecast): {
  ok: boolean
  issues: { region: SalesMarketRegion; labelEn: string; labelZh: string }[]
} {
  const issues: { region: SalesMarketRegion; labelEn: string; labelZh: string }[] = []

  for (const region of SALES_MARKET_REGIONS) {
    const regionData = forecast.regions[region.value]
    if (!regionData.enabled) continue

    const other = regionData.categories.other
    const hasOtherData =
      parseAmount(other.monthlyAmount) > 0 || parsePercent(other.sharePercent) > 0
    if (hasOtherData && !String(other.description ?? "").trim()) {
      issues.push({
        region: region.value,
        labelEn: region.labelEn,
        labelZh: region.labelZh,
      })
    }
  }

  return { ok: issues.length === 0, issues }
}
