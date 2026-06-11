"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SalesForecast, SalesForecastRegion, SalesMarketRegion, SalesProductCategory } from "@/types/hk-new-customer"
import {
  calculateRegionMonthlyTotal,
  calculateRegionShareTotal,
  calculateSalesForecastTotals,
  formatHkdAmount,
  SALES_MARKET_REGIONS,
  SALES_PRODUCT_CATEGORIES,
} from "@/lib/hk-new-customer-sales-forecast"

type SalesForecastFieldsProps = {
  value: SalesForecast
  onChange: (value: SalesForecast) => void
}

export function SalesForecastFields({ value, onChange }: SalesForecastFieldsProps) {
  const totals = calculateSalesForecastTotals(value)

  const updateRegion = (region: SalesMarketRegion, patch: Partial<SalesForecastRegion>) => {
    onChange({
      ...value,
      regions: {
        ...value.regions,
        [region]: { ...value.regions[region], ...patch },
      },
    })
  }

  const updateCategory = (
    region: SalesMarketRegion,
    category: SalesProductCategory,
    field: "sharePercent" | "monthlyAmount" | "description",
    nextValue: string,
  ) => {
    onChange({
      ...value,
      regions: {
        ...value.regions,
        [region]: {
          ...value.regions[region],
          categories: {
            ...value.regions[region].categories,
            [category]: {
              ...value.regions[region].categories[category],
              [field]: nextValue,
            },
          },
        },
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Sales Markets / 銷售市場</Label>
        <p className="text-xs text-muted-foreground">
          Select where you plan to sell, then enter product mix (%) and monthly forecast for each market. /
          選擇銷售地區，並填寫各產品比例（%）及每月預計銷售額。
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SALES_MARKET_REGIONS.map((region) => (
            <label
              key={region.value}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <Checkbox
                checked={value.regions[region.value].enabled}
                onCheckedChange={(checked) =>
                  updateRegion(region.value, { enabled: Boolean(checked) })
                }
              />
              <span>
                {region.labelEn} / {region.labelZh}
              </span>
            </label>
          ))}
        </div>
      </div>

      {SALES_MARKET_REGIONS.map((region) => {
        const regionData = value.regions[region.value]
        if (!regionData.enabled) return null

        const regionMonthly = calculateRegionMonthlyTotal(regionData)
        const regionShare = calculateRegionShareTotal(regionData)

        return (
          <div key={region.value} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="font-medium text-[#02315a]">
              {region.labelEn} / {region.labelZh}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="min-w-0" />
                  <col className="w-[5.5rem] sm:w-[6.5rem]" />
                  <col className="w-[6.5rem] sm:w-[7.5rem]" />
                </colgroup>
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-2 font-medium">Product / 產品</th>
                    <th className="pb-2 pr-2 font-medium">Share % / 比例</th>
                    <th className="pb-2 font-medium">Monthly (HKD) / 每月預計</th>
                  </tr>
                </thead>
                <tbody>
                  {SALES_PRODUCT_CATEGORIES.map((category) => {
                    const line = regionData.categories[category.value]
                    const isOther = category.value === "other"
                    const otherNeedsDescription =
                      isOther &&
                      (Boolean(line.sharePercent.trim()) || Boolean(line.monthlyAmount.trim())) &&
                      !String(line.description ?? "").trim()

                    return (
                    <tr key={category.value} className="border-b border-slate-100">
                      <td className="min-w-0 py-2 pr-2 align-top">
                        <div className="break-words">{category.labelEn} / {category.labelZh}</div>
                        {isOther && (
                          <div className="mt-2 space-y-1">
                            <Input
                              value={line.description ?? ""}
                              placeholder="Describe purchase items / 請說明購買品項"
                              className={otherNeedsDescription ? "border-amber-500" : undefined}
                              onChange={(event) =>
                                updateCategory(region.value, category.value, "description", event.target.value)
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Required when share or monthly amount is entered / 填寫比例或金額時須說明品項
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="min-w-0 py-2 pr-2 align-top">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          inputMode="decimal"
                          value={line.sharePercent}
                          placeholder="0"
                          className="w-full min-w-0 px-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          onChange={(event) =>
                            updateCategory(region.value, category.value, "sharePercent", event.target.value)
                          }
                        />
                      </td>
                      <td className="min-w-0 py-2 align-top">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={line.monthlyAmount}
                          placeholder="0"
                          className="w-full min-w-0 px-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          onChange={(event) =>
                            updateCategory(region.value, category.value, "monthlyAmount", event.target.value)
                          }
                        />
                      </td>
                    </tr>
                    )
                  })}
                  <tr className="font-medium">
                    <td className="min-w-0 pt-2 pr-2">Subtotal / 小計</td>
                    <td className="min-w-0 pt-2 pr-2">
                      {regionShare.toFixed(1)}%
                      {regionShare > 0 && Math.abs(regionShare - 100) > 0.05 && (
                        <span className="ml-1 text-xs font-normal text-amber-700">
                          (≠100%)
                        </span>
                      )}
                    </td>
                    <td className="min-w-0 pt-2 break-words">HKD {formatHkdAmount(regionMonthly)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      <div className="grid gap-3 rounded-lg border border-[#02315a]/15 bg-slate-50 p-4 md:grid-cols-2">
        <div>
          <div className="text-xs text-muted-foreground">Total Monthly Purchase (HKD) / 每月預計採購總額</div>
          <div className="text-lg font-semibold text-[#02315a]">HKD {formatHkdAmount(totals.monthlyTotal)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Estimated Annual Purchase (HKD) / 預計年間採購總額</div>
          <div className="text-lg font-semibold text-[#02315a]">HKD {formatHkdAmount(totals.annualTotal)}</div>
          <div className="text-xs text-muted-foreground">Auto-calculated: monthly total × 12 / 自動計算：每月總額 × 12</div>
        </div>
      </div>
    </div>
  )
}

export { calculateSalesForecastTotals }
