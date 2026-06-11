import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  getSalesRepAllowlist,
  normalizeStaffEmail,
  type SalesRepOption,
} from "@/lib/hk-new-customer-staff"

export async function GET() {
  try {
    const allowlist = getSalesRepAllowlist()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: true, data: allowlist })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const emails = allowlist.map((rep) => rep.email).filter(Boolean) as string[]
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, position")
      .in("email", emails)

    if (error) {
      return NextResponse.json({ success: true, data: allowlist })
    }

    const profileByEmail = new Map(
      (data || []).map((profile) => [normalizeStaffEmail(profile.email), profile]),
    )

    const salesReps: SalesRepOption[] = allowlist.map((rep) => {
      const profile = profileByEmail.get(normalizeStaffEmail(rep.email))
      return {
        ...rep,
        id: profile?.id || rep.id,
      }
    })

    return NextResponse.json({ success: true, data: salesReps })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load sales representatives",
      },
      { status: 500 },
    )
  }
}
