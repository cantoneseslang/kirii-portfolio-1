import { NextResponse } from "next/server"

import { getHkdHistoryMergedWithLiveRate } from "@/lib/dashboard-hkd-rmb-history-cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const history = await getHkdHistoryMergedWithLiveRate()
    return NextResponse.json(history, {
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=300, stale-while-revalidate=60",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "HKD/RMB history API error" },
      { status: 500 }
    )
  }
}
