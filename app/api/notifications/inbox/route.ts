import { NextResponse } from "next/server"
import { getAuthenticatedProfile } from "@/lib/portfolio-access"
import { getNotificationInboxForUser } from "@/lib/portfolio-notifications"
import { createServerSupabaseClient } from "@/utils/supabase/server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const access = await getAuthenticatedProfile()
    if (!access.ok) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const email = user?.email?.trim()
    if (!email) {
      return NextResponse.json({ success: false, message: "User email not found" }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") || 50)
    const notifications = await getNotificationInboxForUser(email, { limit })

    return NextResponse.json({ success: true, data: notifications })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load inbox",
      },
      { status: 500 },
    )
  }
}
