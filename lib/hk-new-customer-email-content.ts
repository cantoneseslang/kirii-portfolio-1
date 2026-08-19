import type { HkNewCustomerRegistration } from "@/types/hk-new-customer"
import {
  getApprovalStatusLabel,
  getPortfolioLoginUrl,
} from "@/lib/hk-new-customer-approval"
import {
  getCustomerRecordArchiveUrl,
  getCustomerRecordFolderUrl,
} from "@/lib/hk-new-customer-customer-records"
import { formatWorkRulesHtml } from "@/lib/hk-new-customer-work-rules"

function systemSignature(): string {
  return `<p>KIRII AI Portfolio</p>`
}

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
  const folderUrl = getCustomerRecordFolderUrl(registration.companyNameEn, registration.brNumber)
  const archiveUrl = getCustomerRecordArchiveUrl()
  const loginUrl = getPortfolioLoginUrl()
  const fileItems = [
    ...(registration.attachments || []).map(
      (attachment) => `<li>${attachment.documentType}: ${attachment.fileName}</li>`,
    ),
    registration.completedFormFileName
      ? `<li>Completed application form: ${registration.completedFormFileName}</li>`
      : "",
  ]
    .filter(Boolean)
    .join("")

  return {
    subject: `[New Customer Approved] ${registration.companyNameEn} — files saved in ISO archive`,
    html: `
      <p>The new customer application for <strong>${registration.companyNameEn}</strong>${
        registration.companyNameZh ? ` / ${registration.companyNameZh}` : ""
      } (BR: ${registration.brNumber}) has been approved by the General Manager.</p>
      <p>The files are now stored in KIRII Employee Portfolio:</p>
      <p><strong>Department: ISO → Customer Registration Record / 客戶登記紀錄</strong></p>
      <p>Customer folder:<br/><a href="${folderUrl}">${folderUrl}</a></p>
      <p>All customer folders:<br/><a href="${archiveUrl}">${archiveUrl}</a></p>
      <p>Login:<br/><a href="${loginUrl}">${loginUrl}</a></p>
      ${fileItems ? `<p>Current files in this folder:</p><ul>${fileItems}</ul>` : ""}
      <p>This ISO folder is the official record. Do not treat email or desktop copies as the official file.</p>
      <p>If bank details, company particulars, or documents need to be changed later, do not edit the approved record. Re-apply promptly with the updated Excel and supporting files, using the same BR number.</p>
      ${systemSignature()}
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
      <p>Open <strong>NewCustomer Setting / 新客戶登記</strong> in KIRII Employee Portfolio to review and resubmit promptly.</p>
      <ol>
        <li>Log in at <a href="${getPortfolioLoginUrl()}">KIRII Employee Portfolio</a> / 登入 Portfolio</li>
        <li>Open <strong>NewCustomer Setting / 新客戶登記</strong> from the Dashboard sidebar / 從 Dashboard 側欄進入</li>
        <li>Review the rejection comment and re-apply immediately with updated documents / 查閱拒絕原因並立即以最新文件再申請</li>
      </ol>
      ${formatWorkRulesHtml()}
    `,
  }
}

export function buildSubmitterReapplyEmail(
  registration: HkNewCustomerRegistration,
  comment?: string,
) {
  return {
    subject: `[New Customer Re-apply Required] ${registration.companyNameEn}`,
    html: `
      <h3>Please re-apply promptly / 請立即再申請</h3>
      <p>A correction is required for this customer registration (payment details, company particulars, or supporting documents). The original submitter must start a new application immediately. Do not edit the approved record.</p>
      <p>此客戶登記需要更正（付款資料、公司資料或證明文件）。原申請人必須立即提交新申請。不可改寫已核准紀錄。</p>
      ${registrationSummary(registration)}
      ${comment ? `<p>Change required / 須更正內容: ${comment}</p>` : ""}
      <ol>
        <li>Log in at <a href="${getPortfolioLoginUrl()}">KIRII Employee Portfolio</a> / 登入 Portfolio</li>
        <li>Open <strong>NewCustomer Setting → Search</strong> to review the stored files / 打開 Search 查閱已保存資料</li>
        <li>Start a new application with the same BR number and updated documents / 以同一商業登記號碼及最新文件再申請</li>
      </ol>
      ${formatWorkRulesHtml()}
    `,
  }
}

export const SUBMIT_SUCCESS_MESSAGE =
  "Submitted for approval. Sales managers have been notified by email to review in Portfolio → NewCustomer Approvals."

export const SUBMIT_SUCCESS_MESSAGE_EMAIL_FAILED =
  "Submitted for approval. Email notification failed — please ask sales managers to open NewCustomer Approvals in Portfolio."
