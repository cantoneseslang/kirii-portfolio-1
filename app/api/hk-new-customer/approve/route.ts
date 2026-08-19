import { NextResponse } from "next/server"
import {
  buildCompletedFormFilename,
  generateHkNewCustomerDocx,
} from "@/lib/hk-new-customer-docx"
import {
  canApproveRegistration,
  getApproverName,
  getApproverRole,
  getNextApprovalStatus,
} from "@/lib/hk-new-customer-approval"
import {
  notifyApproversForStatus,
  notifySubmitterApproved,
  notifySubmitterRejected,
} from "@/lib/hk-new-customer-approval-notify"
import { syncCustomerRecordFolder } from "@/lib/hk-new-customer-customer-records"
import {
  getRegistration,
  saveRegistration,
  uploadCompletedForm,
} from "@/lib/hk-new-customer-storage"
import type { ApprovalHistoryEntry, ApprovalStatus } from "@/types/hk-new-customer"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const registrationId = String(body?.registrationId || "").trim()
    const action = body?.action === "reject" ? "reject" : "approve"
    const approverEmail = String(body?.approverEmail || "").trim()
    const comment = String(body?.comment || "").trim() || undefined

    if (!registrationId || !approverEmail) {
      return NextResponse.json(
        { success: false, message: "registrationId and approverEmail are required" },
        { status: 400 },
      )
    }

    const role = getApproverRole(approverEmail)
    if (!role) {
      return NextResponse.json({ success: false, message: "Unauthorized approver" }, { status: 403 })
    }

    const registration = await getRegistration(registrationId)
    if (!registration) {
      return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
    }

    if (!canApproveRegistration(registration, approverEmail)) {
      return NextResponse.json(
        { success: false, message: "This registration is not awaiting your approval" },
        { status: 403 },
      )
    }

    const now = new Date().toISOString()
    const approverName = getApproverName(approverEmail) || approverEmail
    const historyEntry: ApprovalHistoryEntry = {
      step: registration.approvalStatus || "pending_sales_manager",
      action,
      approverName,
      approverEmail,
      comment,
      timestamp: now,
    }

    const approvalHistory = [...(registration.approvalHistory || []), historyEntry]

    if (action === "reject") {
      registration.approvalStatus = "rejected"
      registration.updatedAt = now
      registration.approvalHistory = approvalHistory
      await saveRegistration(registration)
      await notifySubmitterRejected(registration, comment, {
        name: approverName,
        email: approverEmail,
      })
      return NextResponse.json({
        success: true,
        message: "Registration rejected and submitter notified.",
        data: registration,
      })
    }

    const next = getNextApprovalStatus(
      registration.approvalStatus || "pending_sales_manager",
      role,
    )
    if (next === "approved") {
      registration.approvalStatus = "approved"
      registration.approvedAt = now
      registration.updatedAt = now
      registration.approvalHistory = approvalHistory

      try {
        const completedFormBytes = await generateHkNewCustomerDocx(registration)
        const completedFormFileName = buildCompletedFormFilename(registration)
        const completedForm = await uploadCompletedForm({
          registrationId: registration.id,
          fileName: completedFormFileName,
          bytes: completedFormBytes,
        })
        registration.completedFormUrl = completedForm.url
        registration.completedFormFileName = completedFormFileName
      } catch (docError) {
        console.error("Failed to generate completed Word form on final approval:", docError)
      }

      await saveRegistration(registration)
      try {
        await syncCustomerRecordFolder(registration)
      } catch (archiveError) {
        console.error("Failed to archive customer record folder:", archiveError)
      }
      await notifySubmitterApproved(registration, {
        name: approverName,
        email: approverEmail,
      })

      return NextResponse.json({
        success: true,
        message: "Final approval completed. Submitter has been notified.",
        data: registration,
      })
    }

    registration.approvalStatus = next as ApprovalStatus
    registration.updatedAt = now
    registration.approvalHistory = approvalHistory
    await saveRegistration(registration)
    await notifyApproversForStatus(registration)

    return NextResponse.json({
      success: true,
      message: "Approval recorded. Next approver has been notified to review in Portfolio.",
      data: registration,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process approval"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
