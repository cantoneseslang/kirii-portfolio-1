import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import {
  getCardPermissionDefinition,
  hasCardPermission,
  type CardPermissionKey,
} from "@/lib/card-permissions"
import type { Profile } from "@/types/profile"
import { createServerSupabaseClient } from "@/utils/supabase/server"

export type PortfolioAccessResult =
  | { ok: true; userId: string; profile: Profile }
  | { ok: false; reason: "unauthenticated" | "inactive" | "forbidden" }

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function getAuthenticatedProfile(): Promise<PortfolioAccessResult> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, reason: "unauthenticated" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { ok: false, reason: "unauthenticated" }
  }

  if (profile.is_active === false) {
    return { ok: false, reason: "inactive" }
  }

  return { ok: true, userId: user.id, profile: profile as Profile }
}

export async function requireCardAccess(
  cardKey: CardPermissionKey,
): Promise<PortfolioAccessResult> {
  const access = await getAuthenticatedProfile()
  if (!access.ok) return access

  if (!hasCardPermission(access.profile, cardKey)) {
    return { ok: false, reason: "forbidden" }
  }

  return access
}

export async function requireCardAccessPage(cardKey: CardPermissionKey): Promise<Profile> {
  const access = await requireCardAccess(cardKey)
  if (!access.ok) {
    redirect("/")
  }
  return access.profile
}

export async function requireCardAccessApi(
  cardKey: CardPermissionKey,
  req: Request,
): Promise<
  | { ok: true; userId: string; profile: Profile }
  | { ok: false; response: NextResponse }
> {
  const access = await requireCardAccess(cardKey)
  const loginUrl = new URL("/", req.url)

  if (!access.ok) {
    return { ok: false, response: NextResponse.redirect(loginUrl) }
  }

  return access
}

export async function logActivityEventServer(params: {
  userId: string
  eventType: "card_click" | "page_view" | "portal_open" | "admin_change"
  resourceKey?: CardPermissionKey | string
  resourcePath?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  try {
    const cardDef = params.resourceKey
      ? getCardPermissionDefinition(params.resourceKey as CardPermissionKey)
      : undefined

    const service = getServiceRoleClient()
    await service.from("activity_events").insert({
      user_id: params.userId,
      event_type: params.eventType,
      resource_key: params.resourceKey || null,
      resource_label: cardDef?.label || null,
      resource_path: params.resourcePath || null,
      metadata: params.metadata || {},
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    })
  } catch {
    // non-blocking
  }
}

export function getRequestMeta(req: Request) {
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  const userAgent = req.headers.get("user-agent") || "unknown"
  return { ipAddress, userAgent }
}
