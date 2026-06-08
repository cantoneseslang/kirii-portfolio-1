import { NextResponse } from "next/server"
import { listPendingApprovalsForEmail } from "@/lib/hk-new-customer-storage"
import { getApproverRole } from "@/lib/hk-new-customer-approval"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = String(searchParams.get("email") || "").trim()
    if (!email) {
      return NextResponse.json({ success: false, message: "email is required" }, { status: 400 })
    }

    const role = getApproverRole(email)
    if (!role) {
      return NextResponse.json({ success: true, data: [], role: null, total: 0 })
    }

    const data = await listPendingApprovalsForEmail(email)
    return NextResponse.json({ success: true, data, role, total: data.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pending approvals"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
