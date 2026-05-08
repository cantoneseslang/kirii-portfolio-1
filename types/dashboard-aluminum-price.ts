export type DashboardAluminumPriceSeries = {
  key: string
  label: string
  description: string
  unit: string
  color: string
  latestValue: number | null
}

export type DashboardAluminumPricePoint = {
  date: string
  label: string
} & Record<string, number | string | null>

export type DashboardAluminumPriceResponse = {
  sheetTitle: string
  spreadsheetId: string
  spreadsheetUrl: string
  updatedAt: string
  unit: string
  series: DashboardAluminumPriceSeries[]
  points: DashboardAluminumPricePoint[]
}
