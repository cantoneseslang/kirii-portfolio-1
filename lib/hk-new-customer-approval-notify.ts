import type { HkNewCustomerRegistration } from "@/types/hk-new-customer"
import { sendEmail } from "@/lib/send-email"
import {
  getApprovalPageUrl,
  getApproversForStatus,
  getApprovalStatusLabel,
  getSiteBaseUrl,
  HK_NEW_CUSTOMER_APPROVERS,
} from "@/lib/hk-new-customer-approval"
import {
  createPortfolioNotifications,
  NEW_CUSTOMER_SOURCE,
} from "@/lib/portfolio-notifications"
import {
  buildApproverNotificationEmail,
  buildSubmitterApprovedEmail,
  buildSubmitterRejectedEmail,
} from "@/lib/hk-new-customer-email-content"

function uniqueEmails(emails: string[]): string[] {
  return [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))]
}

function newCustomerNotificationPayload(registration: HkNewCustomerRegistration) {
  const shareUrl = getApprovalPageUrl(registration.id)
  return {
    registrationId: registration.id,
    companyNameEn: registration.companyNameEn,
    companyNameZh: registration.companyNameZh || "",
    brNumber: registration.brNumber,
    salesRepName: registration.salesRepName || "",
    submitterEmail: registration.submitterEmail || "",
    submitterName: registration.createdByName || registration.salesRepName || "",
    createdByName: registration.createdByName || "",
    approvalStatus: registration.approvalStatus || "",
    shareUrl,
    href: `/dashboard/new-customer-setting/approvals?id=${encodeURIComponent(registration.id)}`,
  }
}

async function notifyNewCustomerInApp(
  registration: HkNewCustomerRegistration,
  recipientEmails: string[],
  title: string,
  body: string,
) {
  return createPortfolioNotifications({
    recipientEmails,
    title,
    body,
    source: NEW_CUSTOMER_SOURCE,
    payload: newCustomerNotificationPayload(registration),
  })
}

export async function notifyApproversForStatus(registration: HkNewCustomerRegistration) {
  if (!registration.approvalStatus) return { sent: false, message: "No approval status" }

  const stepRecipients = getApproversForStatus(registration.approvalStatus).map((person) => person.email)
  const gmRecipients = HK_NEW_CUSTOMER_APPROVERS.general_manager.map((person) => person.email)
  const inAppRecipients = uniqueEmails([...stepRecipients, ...gmRecipients])
  if (inAppRecipients.length === 0) return { sent: false, message: "No recipients" }

  const submitter =
    registration.createdByName || registration.salesRepName || registration.submitterEmail || "Sales"
  const statusLabel = getApprovalStatusLabel(registration.approvalStatus)
  const title = `New Customer: ${registration.companyNameEn}`
  const body = `${submitter} submitted ${registration.companyNameEn}${
    registration.companyNameZh ? ` / ${registration.companyNameZh}` : ""
  }. ${statusLabel}`

  const inApp = await notifyNewCustomerInApp(registration, inAppRecipients, title, body)
  const emailRecipients = uniqueEmails(stepRecipients)
  const emailResult =
    emailRecipients.length > 0
      ? await sendEmail({
          to: emailRecipients,
          ...buildApproverNotificationEmail(registration),
        })
      : { sent: false, message: "No email recipients" }

  return {
    sent: inApp.inserted > 0 || emailResult.sent,
    message: `in-app ${inApp.inserted}; email ${emailResult.message}`,
  }
}

function submitterRecordHref(registrationId: string): string {
  return `/dashboard/new-customer-setting?tab=search&id=${encodeURIComponent(registrationId)}`
}

async function notifySubmitterInApp(
  registration: HkNewCustomerRegistration,
  params: {
    title: string
    body: string
    kind: "submitter-approved" | "submitter-rejected"
    decidedByName?: string
    decidedByEmail?: string
    comment?: string
  },
) {
  const recipient = registration.submitterEmail
  if (!recipient) return { inserted: 0, message: "Submitter email missing" }

  const href = submitterRecordHref(registration.id)
  return createPortfolioNotifications({
    recipientEmails: [recipient],
    title: params.title,
    body: params.body,
    source: NEW_CUSTOMER_SOURCE,
    payload: {
      ...newCustomerNotificationPayload(registration),
      href,
      shareUrl: `${getSiteBaseUrl()}${href}`,
      approvalStatus: params.kind === "submitter-approved" ? "approved" : "rejected",
      kind: params.kind,
      decidedByName: params.decidedByName || "",
      decidedByEmail: params.decidedByEmail || "",
      comment: params.comment || "",
    },
  })
}

export async function notifySubmitterApproved(
  registration: HkNewCustomerRegistration,
  decidedBy?: { name: string; email: string },
) {
  const recipient = registration.submitterEmail
  if (!recipient) return { sent: false, message: "Submitter email missing" }

  const company = registration.companyNameZh
    ? `${registration.companyNameEn} / ${registration.companyNameZh}`
    : registration.companyNameEn
  const title = `Approved: ${registration.companyNameEn}`
  const body = `${company} has been approved / 你的新客戶登記已獲批准。`

  const inApp = await notifySubmitterInApp(registration, {
    title,
    body,
    kind: "submitter-approved",
    decidedByName: decidedBy?.name,
    decidedByEmail: decidedBy?.email,
  })
  const { subject, html } = buildSubmitterApprovedEmail(registration)
  const emailResult = await sendEmail({ to: recipient, subject, html })

  return {
    sent: inApp.inserted > 0 || emailResult.sent,
    message: `in-app ${inApp.inserted}; email ${emailResult.message}`,
  }
}

export async function notifySubmitterRejected(
  registration: HkNewCustomerRegistration,
  comment?: string,
  decidedBy?: { name: string; email: string },
) {
  const recipient = registration.submitterEmail
  if (!recipient) return { sent: false, message: "Submitter email missing" }

  const company = registration.companyNameZh
    ? `${registration.companyNameEn} / ${registration.companyNameZh}`
    : registration.companyNameEn
  const title = `Rejected: ${registration.companyNameEn}`
  const body = comment
    ? `${company} was rejected / 你的新客戶登記已被拒絕。${comment}`
    : `${company} was rejected / 你的新客戶登記已被拒絕。`

  const inApp = await notifySubmitterInApp(registration, {
    title,
    body,
    kind: "submitter-rejected",
    decidedByName: decidedBy?.name,
    decidedByEmail: decidedBy?.email,
    comment,
  })
  const { subject, html } = buildSubmitterRejectedEmail(registration, comment)
  const emailResult = await sendEmail({ to: recipient, subject, html })

  return {
    sent: inApp.inserted > 0 || emailResult.sent,
    message: `in-app ${inApp.inserted}; email ${emailResult.message}`,
  }
}
