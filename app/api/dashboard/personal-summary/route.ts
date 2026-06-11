import { NextResponse } from "next/server"
import { buildDashboardPersonalSummary } from "@/lib/dashboard-personal-summary"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = String(searchParams.get("email") || "").trim()
    const fullName = String(searchParams.get("fullName") || "").trim()

    if (!email && !fullName) {
      return NextResponse.json(
        { success: false, message: "email or fullName is required" },
        { status: 400 },
      )
    }

    const data = await buildDashboardPersonalSummary({ email, fullName })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load dashboard summary",
      },
      { status: 500 },
    )
  }
}
