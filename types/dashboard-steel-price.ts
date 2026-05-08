export type DashboardSteelPriceSeries = {
  key: string
  label: string
  description: string
  unit: string
  color: string
  latestValue: number | null
}

export type DashboardSteelPricePoint = {
  date: string
  label: string
} & Record<string, number | string | null>

export type DashboardSteelPriceResponse = {
  sheetTitle: string
  spreadsheetId: string
  spreadsheetUrl: string
  updatedAt: string
  unit: string
  series: DashboardSteelPriceSeries[]
  points: DashboardSteelPricePoint[]
}
