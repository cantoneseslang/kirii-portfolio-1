import { NextResponse } from "next/server"

import { getDashboardAluminumPriceData } from "@/lib/dashboard-aluminum-price-sheet"

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
    const pointLimit = parsePositiveInteger(reqUrl.searchParams.get("pointLimit"), 2000)

    const data = await getDashboardAluminumPriceData({ pointLimit })

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "aluminum price chart API error",
      },
      { status: 500 }
    )
  }
}
