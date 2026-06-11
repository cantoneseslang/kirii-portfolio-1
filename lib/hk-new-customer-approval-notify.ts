import type { HkNewCustomerRegistration } from "@/types/hk-new-customer"
import { sendEmail } from "@/lib/send-email"
import { getApproversForStatus } from "@/lib/hk-new-customer-approval"
import {
  buildApproverNotificationEmail,
  buildSubmitterApprovedEmail,
  buildSubmitterRejectedEmail,
} from "@/lib/hk-new-customer-email-content"

export async function notifyApproversForStatus(registration: HkNewCustomerRegistration) {
  if (!registration.approvalStatus) return { sent: false, message: "No approval status" }

  const recipients = getApproversForStatus(registration.approvalStatus).map((person) => person.email)
  if (recipients.length === 0) return { sent: false, message: "No recipients" }

  const { subject, html } = buildApproverNotificationEmail(registration)
  return sendEmail({ to: recipients, subject, html })
}

export async function notifySubmitterApproved(registration: HkNewCustomerRegistration) {
  const recipient = registration.submitterEmail
  if (!recipient) return { sent: false, message: "Submitter email missing" }

  const { subject, html } = buildSubmitterApprovedEmail(registration)
  return sendEmail({ to: recipient, subject, html })
}

export async function notifySubmitterRejected(
  registration: HkNewCustomerRegistration,
  comment?: string,
) {
  const recipient = registration.submitterEmail
  if (!recipient) return { sent: false, message: "Submitter email missing" }

  const { subject, html } = buildSubmitterRejectedEmail(registration, comment)
  return sendEmail({ to: recipient, subject, html })
}
