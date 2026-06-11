import type { AddressRegion, BrDocumentValidity, DocumentValidityDates } from "@/types/hk-new-customer"
import { getAttachmentTypeLabel, getMandatoryAttachmentKeys } from "@/types/hk-new-customer"

export const DOCUMENT_VALIDITY_WINDOW_DAYS = 365

export type DocumentDateValidationMode = "issued_within_year"

export type MandatoryDocumentDateRule = {
  dateLabelEn: string
  dateLabelZh: string
  mode: DocumentDateValidationMode
  helperEn: string
  helperZh: string
}

export const MANDATORY_DOCUMENT_DATE_RULES: Record<string, MandatoryDocumentDateRule> = {
  ci: {
    dateLabelEn: "Issue Date",
    dateLabelZh: "簽發日期",
    mode: "issued_within_year",
    helperEn: "Must be dated within the last 12 months.",
    helperZh: "須為過去12個月內簽發。",
  },
  nar1: {
    dateLabelEn: "Made Up To",
    dateLabelZh: "備忘日期",
    mode: "issued_within_year",
    helperEn: "Enter the made-up-to date. Must be within the last 12 months.",
    helperZh: "請填寫周年申報表備忘日期，須為過去12個月內。",
  },
  cr_company_particulars: {
    dateLabelEn: "Issue Date",
    dateLabelZh: "簽發日期",
    mode: "issued_within_year",
    helperEn: "Must be dated within the last 12 months.",
    helperZh: "須為過去12個月內簽發。",
  },
  macau_commercial_registration: {
    dateLabelEn: "Issue Date",
    dateLabelZh: "簽發日期",
    mode: "issued_within_year",
    helperEn: "Must be dated within the last 12 months.",
    helperZh: "須為過去12個月內簽發。",
  },
}

export type DocumentValidityIssue = {
  documentType: string
  label: string
  messageEn: string
  messageZh: string
}

export type ValidationResult = {
  valid: boolean
  messageEn: string
  messageZh: string
}

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000)
}

export function formatDateForDisplay(value: string): string {
  const parsed = parseDateOnly(value)
  if (!parsed) return value
  const dd = String(parsed.getDate()).padStart(2, "0")
  const mm = String(parsed.getMonth() + 1).padStart(2, "0")
  const yyyy = parsed.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function normalizeBrNumber(value: string): string {
  return value.replace(/\D/g, "")
}

export function brNumbersMatch(formBrNumber: string, certificateBrNumber: string): boolean {
  const formDigits = normalizeBrNumber(formBrNumber)
  const certDigits = normalizeBrNumber(certificateBrNumber)
  if (!formDigits || !certDigits) return false
  if (formDigits === certDigits) return true
  const formCore = formDigits.slice(0, 8)
  const certCore = certDigits.slice(0, 8)
  return formCore.length >= 8 && formCore === certCore
}

export function validateBrDocument(
  br: BrDocumentValidity | undefined,
  formBrNumber: string,
  referenceDate = new Date(),
): ValidationResult {
  if (!br?.commencementDate?.trim() || !br?.expiryDate?.trim()) {
    return {
      valid: false,
      messageEn: "Enter commencement and expiry dates from the BR certificate.",
      messageZh: "請填寫商業登記證上的生效日期及屆滿日期。",
    }
  }

  const commencement = parseDateOnly(br.commencementDate)
  const expiry = parseDateOnly(br.expiryDate)
  if (!commencement || !expiry) {
    return {
      valid: false,
      messageEn: "Please enter valid commencement and expiry dates.",
      messageZh: "請填寫有效的生效日期及屆滿日期。",
    }
  }

  if (daysBetween(commencement, expiry) < 0) {
    return {
      valid: false,
      messageEn: "Expiry date must be on or after commencement date.",
      messageZh: "屆滿日期不可早於生效日期。",
    }
  }

  const today = startOfDay(referenceDate)
  if (daysBetween(today, commencement) > 0) {
    return {
      valid: false,
      messageEn: "BR certificate is not yet effective.",
      messageZh: "商業登記證尚未生效。",
    }
  }

  if (daysBetween(today, expiry) < 0) {
    return {
      valid: false,
      messageEn: "BR certificate has expired.",
      messageZh: "商業登記證已過屆滿日期。",
    }
  }

  const certificateBrNumber = br.certificateBrNumber?.trim() || ""
  if (!certificateBrNumber) {
    return {
      valid: false,
      messageEn: "Enter the BR number shown on the uploaded certificate.",
      messageZh: "請填寫證件上的商業登記號碼。",
    }
  }

  if (!brNumbersMatch(formBrNumber, certificateBrNumber)) {
    return {
      valid: false,
      messageEn: "BR number on the certificate does not match the form BR number.",
      messageZh: "證件商業登記號碼與表格上的 BR 號碼不一致。",
    }
  }

  return {
    valid: true,
    messageEn: `Valid until ${formatDateForDisplay(br.expiryDate)} / 有效至 ${formatDateForDisplay(br.expiryDate)}`,
    messageZh: `Valid until ${formatDateForDisplay(br.expiryDate)} / 有效至 ${formatDateForDisplay(br.expiryDate)}`,
  }
}

export function validateDocumentDate(
  documentType: string,
  dateValue: string,
  referenceDate = new Date(),
): ValidationResult {
  const rule = MANDATORY_DOCUMENT_DATE_RULES[documentType]
  if (!rule) {
    return { valid: true, messageEn: "", messageZh: "" }
  }

  const parsed = parseDateOnly(dateValue)
  if (!parsed) {
    return {
      valid: false,
      messageEn: "Please enter a valid date.",
      messageZh: "請填寫有效日期。",
    }
  }

  const today = startOfDay(referenceDate)
  const ageDays = daysBetween(parsed, today)
  if (ageDays < 0) {
    return {
      valid: false,
      messageEn: "Date cannot be in the future.",
      messageZh: "日期不可為未來日期。",
    }
  }
  if (ageDays > DOCUMENT_VALIDITY_WINDOW_DAYS) {
    return {
      valid: false,
      messageEn: `Document is older than ${DOCUMENT_VALIDITY_WINDOW_DAYS} days.`,
      messageZh: `文件日期超過${DOCUMENT_VALIDITY_WINDOW_DAYS}天。`,
    }
  }

  return {
    valid: true,
    messageEn: "Within 12 months / 12個月內",
    messageZh: "Within 12 months / 12個月內",
  }
}

export function validateMandatoryDocumentsForSubmit(params: {
  region: AddressRegion
  uploadedDocumentTypes: string[]
  validityDates: DocumentValidityDates
  formBrNumber: string
  referenceDate?: Date
}): { ok: boolean; issues: DocumentValidityIssue[] } {
  const mandatoryKeys = getMandatoryAttachmentKeys(params.region)
  const issues: DocumentValidityIssue[] = []

  for (const documentType of mandatoryKeys) {
    const label = getAttachmentTypeLabel(documentType)
    if (!params.uploadedDocumentTypes.includes(documentType)) {
      issues.push({
        documentType,
        label,
        messageEn: "Required document is missing.",
        messageZh: "缺少必須文件。",
      })
      continue
    }

    if (documentType === "br") {
      const result = validateBrDocument(params.validityDates.br, params.formBrNumber, params.referenceDate)
      if (!result.valid) {
        issues.push({
          documentType,
          label,
          messageEn: result.messageEn,
          messageZh: result.messageZh,
        })
      }
      continue
    }

    const dateValue =
      params.validityDates[documentType as keyof Omit<DocumentValidityDates, "br">]?.trim() || ""
    if (!dateValue) {
      issues.push({
        documentType,
        label,
        messageEn: "Document date is required.",
        messageZh: "請填寫文件日期。",
      })
      continue
    }

    const result = validateDocumentDate(documentType, dateValue, params.referenceDate)
    if (!result.valid) {
      issues.push({
        documentType,
        label,
        messageEn: result.messageEn,
        messageZh: result.messageZh,
      })
    }
  }

  return { ok: issues.length === 0, issues }
}

export function formatDocumentDateLabel(documentType: string): string {
  const rule = MANDATORY_DOCUMENT_DATE_RULES[documentType]
  if (!rule) return "Date / 日期"
  return `${rule.dateLabelEn} / ${rule.dateLabelZh}`
}

export function isBrDocumentValidity(value: unknown): value is BrDocumentValidity {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<BrDocumentValidity>
  return (
    typeof record.commencementDate === "string" &&
    typeof record.expiryDate === "string" &&
    typeof record.certificateBrNumber === "string"
  )
}

export function parseDocumentValidityDates(raw: Record<string, unknown>): DocumentValidityDates {
  const parsed: DocumentValidityDates = {}
  if (isBrDocumentValidity(raw.br)) {
    parsed.br = raw.br
  }
  for (const key of ["ci", "nar1", "cr_company_particulars", "macau_commercial_registration"] as const) {
    if (typeof raw[key] === "string") {
      parsed[key] = raw[key]
    }
  }
  return parsed
}
