import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getCardPermissionDefinition, type CardPermissionKey } from "@/lib/card-permissions"
import { createServerSupabaseClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    let body: {
      eventType?: string
      resourceKey?: CardPermissionKey | string
      resourcePath?: string
      metadata?: Record<string, unknown>
    } = {}

    try {
      body = await request.json()
    } catch {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    }

    const {
      eventType = "card_click",
      resourceKey,
      resourcePath,
      metadata,
    } = body

    const supabaseAuth = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabaseAuth
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
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
      user_id: user.id,
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
