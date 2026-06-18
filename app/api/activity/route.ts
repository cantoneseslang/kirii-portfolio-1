import { createClient } from "@supabase/supabase-js"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { getCardPermissionDefinition, type CardPermissionKey } from "@/lib/card-permissions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventType = "card_click",
      resourceKey,
      resourcePath,
      metadata,
    } = body as {
      eventType?: string
      resourceKey?: CardPermissionKey | string
      resourcePath?: string
      metadata?: Record<string, unknown>
    }

    const supabaseAuth = createServerComponentClient({ cookies })
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabaseAuth
      .from("profiles")
      .select("is_active")
      .eq("id", session.user.id)
      .single()

    if (profile?.is_active === false) {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 })
    }

    const cardDef = resourceKey
      ? getCardPermissionDefinition(resourceKey as CardPermissionKey)
      : undefined

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { error } = await service.from("activity_events").insert({
      user_id: session.user.id,
      event_type: eventType,
      resource_key: resourceKey || null,
      resource_label: cardDef?.label || null,
      resource_path: resourcePath || null,
      metadata: metadata || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
