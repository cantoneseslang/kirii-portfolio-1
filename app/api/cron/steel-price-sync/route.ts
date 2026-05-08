import { NextRequest, NextResponse } from "next/server"

import { refreshSteelPriceSnapshot } from "@/lib/dashboard-steel-price-cache"

export const runtime = "nodejs"

function isAuthorized(request: NextRequest): boolean {
  const cronHeader = request.headers.get("x-vercel-cron")
  if (cronHeader) return true

  const token = request.nextUrl.searchParams.get("token")
  const secret = process.env.CRON_SECRET
  if (secret && token === secret) return true
  return false
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const snapshot = await refreshSteelPriceSnapshot({
      seriesLimit: 6,
      pointLimit: 365,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({
      success: true,
      message: "Steel price snapshot refreshed",
      updatedAt: snapshot.updatedAt,
      points: snapshot.points.length,
      series: snapshot.series.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh steel price snapshot"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
