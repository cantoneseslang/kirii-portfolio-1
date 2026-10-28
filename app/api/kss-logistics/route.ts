import { NextResponse } from "next/server"
import { requireCardAccessApi } from "@/lib/portfolio-access"

const LOGISTICS_URL = "https://khk-monitor.vercel.app/api/logistics"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const access = await requireCardAccessApi("kss_logistics", req)
  if (!access.ok) return access.response

  try {
    const upstream = await fetch(`${LOGISTICS_URL}?t=${Date.now()}`, { cache: "no-store" })
    const data = await upstream.json().catch(() => ({}))
    if (!upstream.ok) {
      const message =
        typeof data?.error === "string"
          ? data.error
          : `HTTP ${upstream.status}`
      return NextResponse.json({ success: false, message }, { status: 502 })
    }
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load logistics"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
