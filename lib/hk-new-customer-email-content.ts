import type { HkNewCustomerRegistration } from "@/types/hk-new-customer"
import {
  getApprovalStatusLabel,
  getPortfolioLoginUrl,
} from "@/lib/hk-new-customer-approval"

function registrationSummary(registration: HkNewCustomerRegistration): string {
  return `
    <ul>
      <li>Company: ${registration.companyNameEn}${registration.companyNameZh ? ` / ${registration.companyNameZh}` : ""}</li>
      <li>BR No.: ${registration.brNumber}</li>
      <li>Sales Rep.: ${registration.salesRepName || "-"}</li>
      <li>Submitted By: ${registration.submitterEmail || registration.createdByName || "-"}</li>
      <li>Status: ${getApprovalStatusLabel(registration.approvalStatus)}</li>
    </ul>
  `
}

function inAppWorkflowInstructions(): string {
  const loginUrl = getPortfolioLoginUrl()
  return `
    <p><strong>Please complete approval inside KIRII Employee Portfolio / 請於 KIRII Employee Portfolio 內完成審批：</strong></p>
    <ol>
      <li>Log in at <a href="${loginUrl}">KIRII Employee Portfolio</a> / 登入 Portfolio</li>
      <li>Open <strong>NewCustomer Approvals / 新客戶審批</strong> from the Dashboard sidebar or home card / 從 Dashboard 側欄或首頁卡片進入</li>
      <li>Select the pending registration, review attachments, then Approve or Reject / 選擇待審項目、查閱附件後批准或拒絕</li>
    </ol>
    <p style="color:#666;font-size:13px;">
      This email is a notification only. Do not use external links — all approval steps stay inside Portfolio.
      / 此電郵僅作通知，請勿使用外部連結，所有審批均在 Portfolio 內完成。
    </p>
  `
}

export const SAMPLE_NEW_CUSTOMER_REGISTRATION: HkNewCustomerRegistration = {
  id: "local-preview-sample-id",
  companyNameEn: "Sample Trading Limited",
  companyNameZh: "示例貿易有限公司",
  brNumber: "12345678",
  salesRepName: "Demo Sales Rep",
  submitterEmail: "sales.demo@kirii.com.hk",
  createdByName: "Demo Sales Rep",
  approvalStatus: "pending_sales_manager",
  status: "submitted",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  contacts: [],
  invoiceDelivery: ["email"],
  documentsChecklist: {
    br: true,
    ci: true,
    nar1: true,
    bankProof: true,
    crCompanyParticulars: true,
  },
  attachments: [
    {
      id: "att-1",
      documentType: "br",
      fileName: "BR-sample.pdf",
      fileUrl: "#",
      uploadedAt: new Date().toISOString(),
    },
  ],
  approvalHistory: [
    {
      step: "pending_sales_manager",
      action: "submit",
      approverName: "Demo Sales Rep",
      approverEmail: "sales.demo@kirii.com.hk",
      timestamp: new Date().toISOString(),
    },
  ],
}

export function buildApproverNotificationEmail(registration: HkNewCustomerRegistration) {
  return {
    subject: `[New Customer Approval] ${registration.companyNameEn} - Action Required`,
    html: `
      <h3>New Customer Registration Approval Required / 新客戶登記待審批</h3>
      <p>A new customer registration is waiting for your approval in KIRII Employee Portfolio.</p>
      ${registrationSummary(registration)}
      ${inAppWorkflowInstructions()}
    `,
  }
}

export function buildSubmitterApprovedEmail(registration: HkNewCustomerRegistration) {
  const docLink = registration.completedFormUrl
    ? `<p>Download the completed Word form from <strong>NewCustomer Setting → Search</strong> in Portfolio, or use this file link:<br/>
      <a href="${registration.completedFormUrl}">${registration.completedFormFileName || "Completed Word Form"}</a></p>`
    : ""

  return {
    subject: `[New Customer Approved] ${registration.companyNameEn}`,
    html: `
      <h3>New Customer Registration Approved / 新客戶登記已完成審批</h3>
      <p>Your new customer registration has been fully approved by the General Manager.</p>
      ${registrationSummary(registration)}
      ${docLink}
      <p>Open <strong>NewCustomer Setting / 新客戶登記</strong> in KIRII Employee Portfolio to view the record and download documents.</p>
      <ol>
        <li>Log in at <a href="${getPortfolioLoginUrl()}">KIRII Employee Portfolio</a> / 登入 Portfolio</li>
        <li>Open <strong>NewCustomer Setting / 新客戶登記</strong> from the Dashboard sidebar / 從 Dashboard 側欄進入</li>
        <li>Use the Search tab to find this registration and download the completed form / 使用「Search」分頁查找記錄並下載表格</li>
      </ol>
    `,
  }
}

export function buildSubmitterRejectedEmail(registration: HkNewCustomerRegistration, comment?: string) {
  return {
    subject: `[New Customer Rejected] ${registration.companyNameEn}`,
    html: `
      <h3>New Customer Registration Rejected / 新客戶登記已被拒絕</h3>
      <p>Your new customer registration was rejected during approval.</p>
      ${registrationSummary(registration)}
      ${comment ? `<p>Comment / 備註: ${comment}</p>` : ""}
      <p>Open <strong>NewCustomer Setting / 新客戶登記</strong> in KIRII Employee Portfolio to review and resubmit.</p>
      <ol>
        <li>Log in at <a href="${getPortfolioLoginUrl()}">KIRII Employee Portfolio</a> / 登入 Portfolio</li>
        <li>Open <strong>NewCustomer Setting / 新客戶登記</strong> from the Dashboard sidebar / 從 Dashboard 側欄進入</li>
        <li>Review the rejection comment and update the form / 查閱拒絕原因並修改表格</li>
      </ol>
    `,
  }
}

export const SUBMIT_SUCCESS_MESSAGE =
  "Submitted for approval. Sales managers have been notified by email to review in Portfolio → NewCustomer Approvals."

export const SUBMIT_SUCCESS_MESSAGE_EMAIL_FAILED =
  "Submitted for approval. Email notification failed — please ask sales managers to open NewCustomer Approvals in Portfolio."
