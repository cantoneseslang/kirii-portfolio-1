import type {
  AddressRegion,
  BrDocumentValidity,
  CiDocumentValidity,
  DocumentValidityDates,
  Nar1DocumentValidity,
} from "@/types/hk-new-customer"
import { getAttachmentTypeLabel, getMandatoryAttachmentKeys } from "@/types/hk-new-customer"

export const DOCUMENT_VALIDITY_WINDOW_DAYS = 365

export type DocumentDateValidationMode = "issued_within_year" | "issue_date_only"

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
    mode: "issue_date_only",
    helperEn: "Enter the issue date shown on the CI. No expiry applies.",
    helperZh: "請填寫公司註冊證明書上的簽發日期。CI 沒有有效期限。",
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

/** Main BR number only (first 8 digits). Branch suffix e.g. -000-03-26-0 is ignored. */
export function extractBrCoreNumber(value: string): string {
  const digits = normalizeBrNumber(value)
  if (!digits) return ""
  return digits.slice(0, 8)
}

export function normalizeCiCertificateNumber(value: string): string {
  return value.replace(/\D/g, "")
}

export function brNumbersMatch(formBrNumber: string, certificateBrNumber: string): boolean {
  const formCore = extractBrCoreNumber(formBrNumber)
  const certCore = extractBrCoreNumber(certificateBrNumber)
  if (!formCore || !certCore) return false
  return formCore === certCore
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

  if (formBrNumber.trim() && !brNumbersMatch(formBrNumber, certificateBrNumber)) {
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
  if (rule.mode === "issued_within_year" && ageDays > DOCUMENT_VALIDITY_WINDOW_DAYS) {
    return {
      valid: false,
      messageEn: `Document is older than ${DOCUMENT_VALIDITY_WINDOW_DAYS} days.`,
      messageZh: `文件日期超過${DOCUMENT_VALIDITY_WINDOW_DAYS}天。`,
    }
  }

  if (rule.mode === "issue_date_only") {
    return {
      valid: true,
      messageEn: "Issue date recorded / 已記錄簽發日期",
      messageZh: "Issue date recorded / 已記錄簽發日期",
    }
  }

  return {
    valid: true,
    messageEn: "Within 12 months / 12個月內",
    messageZh: "Within 12 months / 12個月內",
  }
}

export function getCiIssueDate(ci: DocumentValidityDates["ci"]): string {
  if (!ci) return ""
  if (typeof ci === "string") return ci.trim()
  return ci.issueDate?.trim() || ""
}

export function getCiDocumentValidity(ci: DocumentValidityDates["ci"]): CiDocumentValidity | undefined {
  if (!ci) return undefined
  if (typeof ci === "string") {
    return ci.trim() ? { issueDate: ci.trim(), certificateNumber: "" } : undefined
  }
  if (ci.issueDate?.trim() || ci.certificateNumber?.trim()) {
    return ci
  }
  return undefined
}

export function validateCiDocument(
  ci: CiDocumentValidity | undefined,
  referenceDate = new Date(),
): ValidationResult {
  if (!ci?.issueDate?.trim()) {
    return {
      valid: false,
      messageEn: "Enter the issue date from the CI certificate.",
      messageZh: "請填寫公司註冊證明書上的簽發日期。",
    }
  }

  const dateResult = validateDocumentDate("ci", ci.issueDate, referenceDate)
  if (!dateResult.valid) {
    return dateResult
  }

  const certificateNumber = ci.certificateNumber?.trim() || ""
  if (!certificateNumber) {
    return {
      valid: false,
      messageEn: "Enter the certificate No. (編號) from the top-left of the CI.",
      messageZh: "請填寫公司註冊證明書左上角的編號。",
    }
  }

  return {
    valid: true,
    messageEn: `CI No. ${certificateNumber} / 編號 ${certificateNumber}`,
    messageZh: `CI No. ${certificateNumber} / 編號 ${certificateNumber}`,
  }
}

function normalizeCompanyNameForMatch(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export function companyNamesMatch(formName: string, certificateName: string): boolean {
  const formNorm = normalizeCompanyNameForMatch(formName)
  const certNorm = normalizeCompanyNameForMatch(certificateName)
  if (!formNorm || !certNorm) return false
  return formNorm === certNorm || formNorm.includes(certNorm) || certNorm.includes(formNorm)
}

export function getNar1DocumentValidity(
  nar1: DocumentValidityDates["nar1"],
): Nar1DocumentValidity | undefined {
  if (!nar1) return undefined
  if (typeof nar1 === "string") {
    return nar1.trim()
      ? {
          madeUpToDate: nar1.trim(),
          businessRegistrationNumber: "",
          companyNameEn: "",
          shareCapital: "",
          directors: [],
        }
      : undefined
  }
  if (
    nar1.madeUpToDate?.trim() ||
    nar1.businessRegistrationNumber?.trim() ||
    nar1.companyNameEn?.trim() ||
    nar1.shareCapital?.trim() ||
    nar1.directors?.length
  ) {
    return nar1
  }
  return undefined
}

export function validateNar1Document(
  nar1: Nar1DocumentValidity | undefined,
  formBrNumber: string,
  formCompanyNameEn: string,
  referenceDate = new Date(),
): ValidationResult {
  if (!nar1?.madeUpToDate?.trim()) {
    return {
      valid: false,
      messageEn: "Enter the made-up-to date from the NAR1.",
      messageZh: "請填寫周年申報表的結算日期。",
    }
  }

  const dateResult = validateDocumentDate("nar1", nar1.madeUpToDate, referenceDate)
  if (!dateResult.valid) {
    return dateResult
  }

  const brNumber = extractBrCoreNumber(nar1.businessRegistrationNumber || "")
  if (!brNumber) {
    return {
      valid: false,
      messageEn: "Enter the Business Registration Number from the NAR1.",
      messageZh: "請填寫周年申報表上的商業登記號碼。",
    }
  }

  if (formBrNumber.trim() && !brNumbersMatch(formBrNumber, brNumber)) {
    return {
      valid: false,
      messageEn: "NAR1 BR number does not match the form BR number.",
      messageZh: "周年申報表商業登記號碼與表格上的 BR 號碼不一致。",
    }
  }

  if (!nar1.companyNameEn?.trim()) {
    return {
      valid: false,
      messageEn: "Enter the company name from the NAR1.",
      messageZh: "請填寫周年申報表上的公司名稱。",
    }
  }

  if (formCompanyNameEn.trim() && !companyNamesMatch(formCompanyNameEn, nar1.companyNameEn)) {
    return {
      valid: false,
      messageEn: "NAR1 company name does not match the form company name.",
      messageZh: "周年申報表公司名稱與表格上的公司名稱不一致。",
    }
  }

  if (!nar1.shareCapital?.trim()) {
    return {
      valid: false,
      messageEn: "Enter the share capital from the NAR1.",
      messageZh: "請填寫周年申報表上的股本。",
    }
  }

  if (!nar1.directors?.length) {
    return {
      valid: false,
      messageEn: "Enter at least one director from the NAR1.",
      messageZh: "請填寫至少一名董事資料。",
    }
  }

  const incompleteDirector = nar1.directors.find(
    (director) =>
      !director.nameEn?.trim() ||
      !director.flatFloorBlock?.trim() ||
      !director.building?.trim() ||
      !director.street?.trim() ||
      !director.district?.trim() ||
      !director.country?.trim(),
  )
  if (incompleteDirector) {
    return {
      valid: false,
      messageEn: "Each director needs name and full correspondence address.",
      messageZh: "每位董事須填寫姓名及完整通訊地址。",
    }
  }

  return {
    valid: true,
    messageEn: `NAR1 made up to ${formatDateForDisplay(nar1.madeUpToDate)} · ${nar1.directors.length} director(s) / 結算日期 ${formatDateForDisplay(nar1.madeUpToDate)} · ${nar1.directors.length} 名董事`,
    messageZh: `NAR1 made up to ${formatDateForDisplay(nar1.madeUpToDate)} · ${nar1.directors.length} director(s) / 結算日期 ${formatDateForDisplay(nar1.madeUpToDate)} · ${nar1.directors.length} 名董事`,
  }
}

export function validateMandatoryDocumentsForSubmit(params: {
  region: AddressRegion
  uploadedDocumentTypes: string[]
  validityDates: DocumentValidityDates
  formBrNumber: string
  formCompanyNameEn?: string
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

    if (documentType === "ci") {
      const ci = getCiDocumentValidity(params.validityDates.ci)
      const result = validateCiDocument(ci, params.referenceDate)
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

    if (documentType === "nar1") {
      const nar1 = getNar1DocumentValidity(params.validityDates.nar1)
      const result = validateNar1Document(
        nar1,
        params.formBrNumber,
        params.formCompanyNameEn || "",
        params.referenceDate,
      )
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
      typeof params.validityDates[documentType as keyof Omit<DocumentValidityDates, "br" | "ci" | "nar1">] ===
      "string"
        ? (
            params.validityDates[
              documentType as keyof Omit<DocumentValidityDates, "br" | "ci" | "nar1">
            ] as string
          ).trim()
        : ""
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

export function isCiDocumentValidity(value: unknown): value is CiDocumentValidity {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<CiDocumentValidity>
  return typeof record.issueDate === "string" && typeof record.certificateNumber === "string"
}

export function isNar1DocumentValidity(value: unknown): value is Nar1DocumentValidity {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<Nar1DocumentValidity>
  return (
    typeof record.madeUpToDate === "string" &&
    typeof record.businessRegistrationNumber === "string" &&
    typeof record.companyNameEn === "string" &&
    typeof record.shareCapital === "string" &&
    Array.isArray(record.directors)
  )
}

export function parseDocumentValidityDates(raw: Record<string, unknown>): DocumentValidityDates {
  const parsed: DocumentValidityDates = {}
  if (isBrDocumentValidity(raw.br)) {
    parsed.br = raw.br
  }
  if (isCiDocumentValidity(raw.ci)) {
    parsed.ci = raw.ci
  } else if (typeof raw.ci === "string") {
    parsed.ci = raw.ci
  }
  if (isNar1DocumentValidity(raw.nar1)) {
    parsed.nar1 = raw.nar1
  } else if (typeof raw.nar1 === "string") {
    parsed.nar1 = raw.nar1
  }
  for (const key of ["cr_company_particulars", "macau_commercial_registration"] as const) {
    if (typeof raw[key] === "string") {
      parsed[key] = raw[key]
    }
  }
  return parsed
}
