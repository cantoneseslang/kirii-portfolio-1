import { NextRequest, NextResponse } from "next/server"
import { requireCardAccess } from "@/lib/portfolio-access"
import { createSalesPortalToken } from "@/lib/sales-portal-token"
import { getLunchOrderApiBaseUrl, resolveLunchMemberId } from "@/lib/lunch-member"
import { createServerSupabaseClient } from "@/utils/supabase/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") === "sheet" ? "sheet" : "order"
  const access = await requireCardAccess(to === "sheet" ? "lunch_order_sheet" : "lunch_order")
  if (!access.ok) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const base = getLunchOrderApiBaseUrl()
  const target = new URL(to === "sheet" ? `${base}/monthly-summary` : `${base}/`)
  target.searchParams.set("portal_access", createSalesPortalToken(120))
  target.searchParams.set("source", "kirii-portfolio")
  const fullName = access.profile.full_name
  const email = user?.email
  if (fullName) target.searchParams.set("full_name", fullName)
  if (email) target.searchParams.set("email", email)
  const memberId = resolveLunchMemberId(fullName, email)
  if (memberId) target.searchParams.set("member_id", memberId)

  return NextResponse.redirect(target)
}
