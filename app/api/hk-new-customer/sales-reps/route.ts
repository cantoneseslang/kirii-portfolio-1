import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { filterSalesRepProfiles, isSalesDepartment } from "@/lib/hk-new-customer-staff"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, message: "Server configuration missing for sales rep lookup." },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, department, position")
      .order("full_name", { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    const salesReps = filterSalesRepProfiles(
      (data || [])
        .filter((profile) => isSalesDepartment(profile.department))
        .map((profile) => ({
          id: profile.id,
          full_name: String(profile.full_name || "").trim(),
          position: profile.position || undefined,
        }))
        .filter((profile) => profile.full_name),
    )

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
