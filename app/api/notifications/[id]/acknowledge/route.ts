import { NextResponse } from "next/server"
import { getAuthenticatedProfile } from "@/lib/portfolio-access"
import { acknowledgeNotificationForUser } from "@/lib/portfolio-notifications"
import { createServerSupabaseClient } from "@/utils/supabase/server"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const access = await getAuthenticatedProfile()
    if (!access.ok) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ success: false, message: "Notification id is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const email = user?.email?.trim()
    if (!email) {
      return NextResponse.json({ success: false, message: "User email not found" }, { status: 400 })
    }

    const result = await acknowledgeNotificationForUser(id, email)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to acknowledge notification",
      },
      { status: 500 },
    )
  }
}
