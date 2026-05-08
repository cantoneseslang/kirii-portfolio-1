import { NextResponse } from "next/server"

import { getDashboardSteelPriceData } from "@/lib/dashboard-price-sheet"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(req: Request) {
  try {
    const reqUrl = new URL(req.url)
    const seriesLimit = parsePositiveInteger(reqUrl.searchParams.get("seriesLimit"), 6)
    const pointLimit = parsePositiveInteger(reqUrl.searchParams.get("pointLimit"), 365)

    const data = await getDashboardSteelPriceData({ seriesLimit, pointLimit })

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "steel price chart API error",
      },
      { status: 500 }
    )
  }
}
