import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import type {
  ContactEntry,
  DocumentChecklist,
  HkNewCustomerRegistration,
} from "@/types/hk-new-customer"
import { validateMandatoryDocumentsForSubmit, parseDocumentValidityDates } from "@/lib/hk-new-customer-document-validity"
import { normalizeContactEntry } from "@/lib/phone-country-codes"
import { collectLegalNameIssues } from "@/lib/hk-new-customer-name-validation"
import { collectContactNameIssues } from "@/lib/hk-new-customer-contact-name"
import { notifyApproversForStatus } from "@/lib/hk-new-customer-approval-notify"
import {
  formatStructuredAddress,
  normalizeStructuredAddress,
  resolveStructuredAddress,
} from "@/lib/hk-new-customer-address"
import {
  getIndex,
  getRegistration,
  saveRegistration,
  searchRegistrations,
  uploadAttachmentFile,
} from "@/lib/hk-new-customer-storage"

export const runtime = "nodejs"

function parseJsonField<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function parseContacts(value: FormDataEntryValue | null): ContactEntry[] {
  const parsed = parseJsonField<Partial<ContactEntry>[]>(value, [])
  if (!Array.isArray(parsed)) return []
  return parsed.map((contact) => normalizeContactEntry(contact))
}

function parseChecklist(value: FormDataEntryValue | null): DocumentChecklist {
  const parsed = parseJsonField<Partial<DocumentChecklist>>(value, {})
  return {
    br: Boolean(parsed.br),
    ci: Boolean(parsed.ci),
    nar1: Boolean(parsed.nar1),
    bankProof: Boolean(parsed.bankProof),
    crCompanyParticulars: Boolean(parsed.crCompanyParticulars),
    macauCommercialRegistration: Boolean(parsed.macauCommercialRegistration),
  }
}

function parseDocumentValidityDatesJson(value: FormDataEntryValue | null) {
  return parseJsonField<Record<string, unknown>>(value, {})
}

function parseInvoiceDelivery(value: FormDataEntryValue | null): ("email" | "post")[] {
  const parsed = parseJsonField<string[]>(value, [])
  return parsed.filter((item): item is "email" | "post" => item === "email" || item === "post")
}

function parseAddressField(
  jsonValue: FormDataEntryValue | null,
  legacyValue: FormDataEntryValue | null,
  existingDetail?: HkNewCustomerRegistration["registeredAddressDetail"],
  existingLegacy?: string,
) {
  const parsedDetail = normalizeStructuredAddress(parseJsonField(jsonValue, null))
  if (parsedDetail) {
    return {
      detail: parsedDetail,
      formatted: formatStructuredAddress(parsedDetail),
    }
  }

  const legacyText = String(legacyValue || existingLegacy || "").trim() || undefined
  const detail = existingDetail || resolveStructuredAddress(undefined, legacyText)
  return {
    detail,
    formatted: formatStructuredAddress(detail) || legacyText,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const id = searchParams.get("id")

    if (id) {
      const registration = await getRegistration(id)
      if (!registration) {
        return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: registration })
    }

    const index = await getIndex()
    const results = searchRegistrations(index, query)
    return NextResponse.json({ success: true, data: results, total: results.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load registrations"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const companyNameEn = String(formData.get("companyNameEn") || "").trim()
    const brNumber = String(formData.get("brNumber") || "").trim()

    if (!companyNameEn || !brNumber) {
      return NextResponse.json(
        { success: false, message: "Company English name and BR number are required" },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()
    const id = String(formData.get("id") || randomUUID())
    const statusRaw = String(formData.get("status") || "submitted")
    const status = statusRaw === "draft" ? "draft" : "submitted"

    const contacts = parseContacts(formData.get("contactsJson"))
    const apContactDetail = parseJsonField<Partial<ContactEntry>>(formData.get("apContactNameJson"), {})

    const nameIssues = [
      ...collectContactNameIssues(
        contacts.map((contact, index) => ({
          key: `contact-${index}`,
          label: `Contact ${index + 1}`,
          contact,
        })),
      ),
      ...collectContactNameIssues([
        {
          key: "ap-contact",
          label: "Accounts Payable Contact Name",
          contact: apContactDetail,
        },
      ]),
      ...collectLegalNameIssues([
        {
          key: "authorized-signature",
          label: "Authorized Signature",
          value: String(formData.get("authorizedSignature") || ""),
        },
        {
          key: "signer-name-title",
          label: "Name & Title",
          value: String(formData.get("signerNameTitle") || ""),
        },
      ]),
    ]
    if (nameIssues.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid name format detected: ${nameIssues.map((issue) => issue.label).join(", ")}`,
        },
        { status: 400 },
      )
    }

    const existing = await getRegistration(id)
    const submitterEmail = String(formData.get("submitterEmail") || existing?.submitterEmail || "").trim() || undefined
    const registeredAddressData = parseAddressField(
      formData.get("registeredAddressJson"),
      formData.get("registeredAddress"),
      existing?.registeredAddressDetail,
      existing?.registeredAddress,
    )
    const deliveryAddressData = parseAddressField(
      formData.get("deliveryAddressJson"),
      formData.get("deliveryAddress"),
      existing?.deliveryAddressDetail,
      existing?.deliveryAddress,
    )
    const registration: HkNewCustomerRegistration = {
      id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      createdBy: String(formData.get("createdBy") || existing?.createdBy || "") || undefined,
      createdByName: String(formData.get("createdByName") || existing?.createdByName || "") || undefined,
      submitterEmail,
      status,
      companyNameEn,
      companyNameZh: String(formData.get("companyNameZh") || "").trim() || undefined,
      brNumber,
      incorporationDate: String(formData.get("incorporationDate") || "").trim() || undefined,
      registeredAddress: registeredAddressData.formatted,
      deliveryAddress: deliveryAddressData.formatted,
      registeredAddressDetail: registeredAddressData.detail,
      deliveryAddressDetail: deliveryAddressData.detail,
      contacts,
      apContactName: String(formData.get("apContactName") || "").trim() || undefined,
      apEmail: String(formData.get("apEmail") || "").trim() || undefined,
      invoiceDelivery: parseInvoiceDelivery(formData.get("invoiceDeliveryJson")),
      bankName: String(formData.get("bankName") || "").trim() || undefined,
      accountName: String(formData.get("accountName") || "").trim() || undefined,
      accountNumber: String(formData.get("accountNumber") || "").trim() || undefined,
      bankCode: String(formData.get("bankCode") || "").trim() || undefined,
      estimatedMonthlyPurchase: formData.get("estimatedMonthlyPurchase")
        ? Number(formData.get("estimatedMonthlyPurchase"))
        : undefined,
      paymentTerms: (String(formData.get("paymentTerms") || "") || undefined) as HkNewCustomerRegistration["paymentTerms"],
      paymentTermsOther: String(formData.get("paymentTermsOther") || "").trim() || undefined,
      documentsChecklist: parseChecklist(formData.get("documentsChecklistJson")),
      documentValidityDates: {
        ...(existing?.documentValidityDates || {}),
        ...parseDocumentValidityDates(parseDocumentValidityDatesJson(formData.get("documentValidityDatesJson"))),
      },
      attachments: existing?.attachments || [],
      authorizedSignature: String(formData.get("authorizedSignature") || "").trim() || undefined,
      declarationDate: String(formData.get("declarationDate") || "").trim() || undefined,
      signerNameTitle: String(formData.get("signerNameTitle") || "").trim() || undefined,
      salesDepartment: String(formData.get("salesDepartment") || "").trim() || undefined,
      salesRepName: String(formData.get("salesRepName") || "").trim() || undefined,
      verificationCheckedDate: String(formData.get("verificationCheckedDate") || "").trim() || undefined,
      companyStatus: (String(formData.get("companyStatus") || "") || undefined) as HkNewCustomerRegistration["companyStatus"],
      bankProofCheck: (String(formData.get("bankProofCheck") || "") || undefined) as HkNewCustomerRegistration["bankProofCheck"],
      verificationRemarks: String(formData.get("verificationRemarks") || "").trim() || undefined,
      approvalHistory: existing?.approvalHistory,
      approvalStatus: existing?.approvalStatus,
      submittedAt: existing?.submittedAt,
      approvedAt: existing?.approvedAt,
      completedFormUrl: existing?.completedFormUrl,
      completedFormFileName: existing?.completedFormFileName,
    }

    const attachmentTypes = [
      "br",
      "ci",
      "nar1",
      "bank_proof",
      "cr_company_particulars",
      "macau_commercial_registration",
      "other",
    ] as const
    for (const documentType of attachmentTypes) {
      const file = formData.get(`attachment_${documentType}`)
      if (!(file instanceof File) || file.size === 0) continue

      const bytes = Buffer.from(await file.arrayBuffer())
      const uploaded = await uploadAttachmentFile({
        registrationId: id,
        documentType,
        fileName: file.name,
        bytes,
        contentType: file.type || undefined,
      })

      registration.attachments.push({
        id: randomUUID(),
        documentType,
        fileName: file.name,
        fileUrl: uploaded.url,
        fileSize: file.size,
        contentType: file.type || undefined,
        uploadedAt: now,
      })
    }

    registration.documentsChecklist = {
      br: registration.attachments.some((item) => item.documentType === "br"),
      ci: registration.attachments.some((item) => item.documentType === "ci"),
      nar1: registration.attachments.some((item) => item.documentType === "nar1"),
      bankProof: registration.attachments.some((item) => item.documentType === "bank_proof"),
      crCompanyParticulars: registration.attachments.some(
        (item) => item.documentType === "cr_company_particulars",
      ),
      macauCommercialRegistration: registration.attachments.some(
        (item) => item.documentType === "macau_commercial_registration",
      ),
    }

    if (status === "submitted") {
      const region = registration.registeredAddressDetail?.region || "hong_kong"
      const uploadedTypes = registration.attachments.map((item) => item.documentType)
      const documentValidation = validateMandatoryDocumentsForSubmit({
        region,
        uploadedDocumentTypes: uploadedTypes,
        validityDates: registration.documentValidityDates || {},
        formBrNumber: registration.brNumber,
      })
      if (!documentValidation.ok) {
        return NextResponse.json(
          {
            success: false,
            message: `Document validation failed: ${documentValidation.issues
              .map((issue) => `${issue.documentType}: ${issue.messageEn}`)
              .join("; ")}`,
          },
          { status: 400 },
        )
      }
    }

    if (status === "submitted") {
      registration.submittedAt = now
      registration.approvalStatus = "pending_sales_manager"
      registration.approvalHistory = [
        ...(registration.approvalHistory || []),
        {
          step: "pending_sales_manager",
          action: "submit",
          approverName: registration.createdByName || registration.salesRepName || "Sales Representative",
          approverEmail: submitterEmail || "",
          timestamp: now,
        },
      ]
    }

    await saveRegistration(registration)

    if (status === "submitted") {
      const emailResult = await notifyApproversForStatus(registration)
      const message = emailResult.sent
        ? "Submitted for approval. Sales managers have been notified by email to review in Portfolio → NewCustomer Approvals."
        : "Submitted for approval. Email notification failed — please ask sales managers to open NewCustomer Approvals in Portfolio."

      return NextResponse.json({
        success: true,
        message,
        data: registration,
        email: emailResult,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Draft saved successfully",
      data: registration,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save registration"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
