import { NextResponse } from "next/server"
import { getApproverName, getApproverRole } from "@/lib/hk-new-customer-approval"
import { notifySubmitterReapply } from "@/lib/hk-new-customer-approval-notify"
import { getRegistration } from "@/lib/hk-new-customer-storage"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const registrationId = String(body?.registrationId || "").trim()
    const requesterEmail = String(body?.requesterEmail || "").trim()
    const comment = String(body?.comment || "").trim() || undefined

    if (!registrationId || !requesterEmail) {
      return NextResponse.json(
        { success: false, message: "registrationId and requesterEmail are required" },
        { status: 400 },
      )
    }

    const role = getApproverRole(requesterEmail)
    if (!role) {
      return NextResponse.json({ success: false, message: "Unauthorized requester" }, { status: 403 })
    }

    const registration = await getRegistration(registrationId)
    if (!registration) {
      return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
    }

    if (!registration.submitterEmail) {
      return NextResponse.json(
        { success: false, message: "Original submitter email is missing on this record" },
        { status: 400 },
      )
    }

    const result = await notifySubmitterReapply(registration, comment, {
      name: getApproverName(requesterEmail) || requesterEmail,
      email: requesterEmail,
    })

    return NextResponse.json({
      success: result.sent,
      message: result.sent
        ? "Original submitter has been notified to re-apply promptly, with file location and work rules."
        : result.message,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request re-application"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
