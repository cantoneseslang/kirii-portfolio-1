import { NextRequest, NextResponse } from "next/server"

import { refreshHkdRmbHistorySnapshot } from "@/lib/dashboard-hkd-rmb-history-cache"

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
    const merged = await refreshHkdRmbHistorySnapshot({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    const last = merged[merged.length - 1]
    return NextResponse.json({
      success: true,
      message: "HKD/RMB history snapshot refreshed",
      points: merged.length,
      lastDate: last?.date ?? null,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refresh HKD/RMB history snapshot"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
