import fs from "fs/promises"
import path from "path"
import Docxtemplater from "docxtemplater"
import PizZip from "pizzip"
import type { HkNewCustomerRegistration } from "@/types/hk-new-customer"
import { formatStructuredAddress } from "@/lib/hk-new-customer-address"
import { formatContactPhone } from "@/lib/phone-country-codes"

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public/templates/hk-new-customer-template.docx",
)

function mark(checked: boolean): string {
  return checked ? "X" : " "
}

function formatIncDate(value?: string): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function buildTemplateData(registration: HkNewCustomerRegistration) {
  const [c1, c2, c3] = registration.contacts
  const invoiceEmail = registration.invoiceDelivery.includes("email")
  const invoicePost = registration.invoiceDelivery.includes("post")

  return {
    companyNameEn: registration.companyNameEn || "",
    companyNameZh: registration.companyNameZh || "",
    brNumber: registration.brNumber || "",
    incorporationDate: formatIncDate(registration.incorporationDate),
    registeredAddress:
      formatStructuredAddress(registration.registeredAddressDetail) ||
      registration.registeredAddress ||
      "",
    deliveryAddress:
      formatStructuredAddress(registration.deliveryAddressDetail) ||
      registration.deliveryAddress ||
      "",
    contact1Name: c1?.name || "",
    contact1Title: c1?.title || "",
    contact1Email: c1?.email || "",
    contact1Phone: formatContactPhone(c1) || c1?.phone || "",
    contact2Name: c2?.name || "",
    contact2Title: c2?.title || "",
    contact2Email: c2?.email || "",
    contact2Phone: formatContactPhone(c2) || c2?.phone || "",
    contact3Name: c3?.name || "",
    contact3Title: c3?.title || "",
    contact3Email: c3?.email || "",
    contact3Phone: formatContactPhone(c3) || c3?.phone || "",
    apContactName: registration.apContactName || "",
    apEmail: registration.apEmail || "",
    invoiceEmail: mark(invoiceEmail),
    invoicePost: mark(invoicePost),
    bankName: registration.bankName || "",
    accountName: registration.accountName || "",
    accountNumber: registration.accountNumber || "",
    bankCode: registration.bankCode || "",
    estimatedMonthlyPurchase:
      registration.estimatedMonthlyPurchase !== undefined
        ? String(registration.estimatedMonthlyPurchase)
        : "",
    payAdvance: mark(registration.paymentTerms === "advance"),
    pay30Invoice: mark(registration.paymentTerms === "30_days_invoice"),
    pay30Eom: mark(registration.paymentTerms === "30_days_eom"),
    payOther: mark(registration.paymentTerms === "other"),
    paymentTermsOther: registration.paymentTermsOther || "",
    docBr: mark(Boolean(registration.documentsChecklist.br)),
    docCi: mark(Boolean(registration.documentsChecklist.ci)),
    docNar1: mark(Boolean(registration.documentsChecklist.nar1)),
    docBankProof: mark(Boolean(registration.documentsChecklist.bankProof)),
    authorizedSignature: registration.authorizedSignature || "",
    declarationDate: formatIncDate(registration.declarationDate),
    signerNameTitle: registration.signerNameTitle || "",
    salesDepartment: registration.salesDepartment || "",
    salesRepName: registration.salesRepName || "",
    verificationCheckedDate: formatIncDate(registration.verificationCheckedDate),
    statusLive: mark(registration.companyStatus === "live"),
    statusDissolved: mark(registration.companyStatus === "dissolved"),
    bankMatch: mark(registration.bankProofCheck === "match"),
    bankDiscrepancy: mark(registration.bankProofCheck === "discrepancy"),
    verificationRemarks: registration.verificationRemarks || "",
    verificationRemarksInternal: registration.verificationRemarks || "",
    verificationSpacer: "",
  }
}

export async function generateHkNewCustomerDocx(
  registration: HkNewCustomerRegistration,
): Promise<Buffer> {
  const template = await fs.readFile(TEMPLATE_PATH)
  const zip = new PizZip(template)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
  })

  doc.render(buildTemplateData(registration))
  return doc.getZip().generate({ type: "nodebuffer" }) as Buffer
}

export function buildCompletedFormFilename(registration: HkNewCustomerRegistration): string {
  const safeCompany = registration.companyNameEn
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60)
  return `HK_New_Customer_${safeCompany || registration.id}.docx`
}
