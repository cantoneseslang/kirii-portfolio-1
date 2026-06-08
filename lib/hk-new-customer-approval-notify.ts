import type { HkNewCustomerRegistration } from "@/types/hk-new-customer"
import { sendEmail } from "@/lib/send-email"
import {
  getApprovalPageUrl,
  getApproversForStatus,
  getSiteBaseUrl,
} from "@/lib/hk-new-customer-approval"

function registrationSummary(registration: HkNewCustomerRegistration): string {
  return `
    <ul>
      <li>Company: ${registration.companyNameEn}${registration.companyNameZh ? ` / ${registration.companyNameZh}` : ""}</li>
      <li>BR No.: ${registration.brNumber}</li>
      <li>Sales Rep.: ${registration.salesRepName || "-"}</li>
      <li>Submitted By: ${registration.submitterEmail || registration.createdByName || "-"}</li>
    </ul>
  `
}

export async function notifyApproversForStatus(registration: HkNewCustomerRegistration) {
  if (!registration.approvalStatus) return { sent: false, message: "No approval status" }

  const recipients = getApproversForStatus(registration.approvalStatus).map((person) => person.email)
  if (recipients.length === 0) return { sent: false, message: "No recipients" }

  const approvalUrl = getApprovalPageUrl(registration.id)
  return sendEmail({
    to: recipients,
    subject: `[New Customer Approval] ${registration.companyNameEn} - Action Required`,
    html: `
      <h3>New Customer Registration Approval Required / 新客戶登記待審批</h3>
      <p>A new customer registration is waiting for your approval.</p>
      ${registrationSummary(registration)}
      <p><a href="${approvalUrl}">Open Approval Page / 開啟審批頁面</a></p>
    `,
  })
}

export async function notifySubmitterApproved(registration: HkNewCustomerRegistration) {
  const recipient = registration.submitterEmail
  if (!recipient) return { sent: false, message: "Submitter email missing" }

  const searchUrl = `${getSiteBaseUrl()}/dashboard/new-customer-setting`
  const docLink = registration.completedFormUrl
    ? `<p><a href="${registration.completedFormUrl}">Download Completed Word Form / 下載已完成 Word 表格</a></p>`
    : ""

  return sendEmail({
    to: recipient,
    subject: `[New Customer Approved] ${registration.companyNameEn}`,
    html: `
      <h3>New Customer Registration Approved / 新客戶登記已完成審批</h3>
      <p>Your new customer registration has been fully approved by the General Manager.</p>
      ${registrationSummary(registration)}
      ${docLink}
      <p><a href="${searchUrl}">Open NewCustomer Setting / 開啟新客戶登記</a></p>
    `,
  })
}

export async function notifySubmitterRejected(
  registration: HkNewCustomerRegistration,
  comment?: string,
) {
  const recipient = registration.submitterEmail
  if (!recipient) return { sent: false, message: "Submitter email missing" }

  return sendEmail({
    to: recipient,
    subject: `[New Customer Rejected] ${registration.companyNameEn}`,
    html: `
      <h3>New Customer Registration Rejected / 新客戶登記已被拒絕</h3>
      <p>Your new customer registration was rejected during approval.</p>
      ${registrationSummary(registration)}
      ${comment ? `<p>Comment / 備註: ${comment}</p>` : ""}
      <p><a href="${getSiteBaseUrl()}/dashboard/new-customer-setting">Open NewCustomer Setting / 開啟新客戶登記</a></p>
    `,
  })
}
