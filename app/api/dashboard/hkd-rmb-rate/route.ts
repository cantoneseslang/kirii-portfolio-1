import { NextResponse } from "next/server"

import { fetchHkdRmbRate } from "@/lib/hkd-rmb-rate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const rate = await fetchHkdRmbRate()

    return NextResponse.json(rate, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "HKD/RMB rate API error" },
      { status: 500 }
    )
  }
}
