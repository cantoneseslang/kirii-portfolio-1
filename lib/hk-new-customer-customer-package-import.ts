import type {
  AttachmentDocumentType,
  BrDocumentValidity,
  CiDocumentValidity,
  Nar1DocumentValidity,
} from "@/types/hk-new-customer"
import { extractBrCoreNumber } from "@/lib/hk-new-customer-document-validity"

export type CustomerPackageFiles = {
  excel: File | null
  br: File | null
  ci: File | null
  nar1: File | null
  bankProof: File | null
  other: File | null
}

export type CustomerPackageOcrSummary = {
  br: boolean
  ci: boolean
  nar1: boolean
}

const EXCEL_EXTENSIONS = [".xlsx", ".xls"]

const DOCUMENT_ACCEPT =
  ".xlsx,.xls,.pdf,application/pdf,image/jpeg,image/png,image/webp,image/jpg"

function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return EXCEL_EXTENSIONS.some((ext) => name.endsWith(ext))
}

function classifyByFilename(file: File): AttachmentDocumentType | "excel" | null {
  if (isExcelFile(file)) return "excel"
  const name = file.name.toLowerCase()
  if (/nar1|annual.?return|周年|週年/.test(name)) return "nar1"
  if (/\bci\b|incorporation|certificate.?of.?inc|註冊證|注册证|公司注册/.test(name)) return "ci"
  if (/\bbr\b|business.?registration|商業登記|商业登记|business.?reg/.test(name)) return "br"
  if (/bank|銀行|银行|cheque|check|statement|戶口|户口/.test(name)) return "bank_proof"
  return null
}

export function getCustomerPackageAcceptAttribute(): string {
  return DOCUMENT_ACCEPT
}

export function classifyCustomerPackageFiles(files: File[]): CustomerPackageFiles {
  const result: CustomerPackageFiles = {
    excel: null,
    br: null,
    ci: null,
    nar1: null,
    bankProof: null,
    other: null,
  }

  const unclassified: File[] = []

  for (const file of files) {
    const kind = classifyByFilename(file)
    if (kind === "excel") {
      if (!result.excel) result.excel = file
      continue
    }
    if (kind === "br" && !result.br) {
      result.br = file
      continue
    }
    if (kind === "ci" && !result.ci) {
      result.ci = file
      continue
    }
    if (kind === "nar1" && !result.nar1) {
      result.nar1 = file
      continue
    }
    if (kind === "bank_proof" && !result.bankProof) {
      result.bankProof = file
      continue
    }
    unclassified.push(file)
  }

  const fallbackSlots: Array<keyof Pick<CustomerPackageFiles, "br" | "ci" | "nar1" | "bankProof" | "other">> = [
    "br",
    "ci",
    "nar1",
    "bankProof",
    "other",
  ]

  for (const file of unclassified) {
    const slot = fallbackSlots.find((key) => !result[key])
    if (!slot) break
    result[slot] = file
  }

  return result
}

async function postOcr<T>(endpoint: string, fieldName: string, file: File): Promise<T> {
  const formData = new FormData()
  formData.append(fieldName, file)
  const response = await fetch(endpoint, { method: "POST", body: formData })
  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Failed to scan ${file.name}`)
  }
  return result.data as T
}

export async function scanBrDocument(file: File): Promise<Partial<BrDocumentValidity>> {
  return postOcr("/api/hk-new-customer/br-ocr", "brFile", file)
}

export async function scanCiDocument(file: File): Promise<Partial<CiDocumentValidity>> {
  return postOcr("/api/hk-new-customer/ci-ocr", "ciFile", file)
}

export async function scanNar1Document(file: File): Promise<Partial<Nar1DocumentValidity>> {
  return postOcr("/api/hk-new-customer/nar1-ocr", "nar1File", file)
}

export function mergeBrScanResult(
  current: BrDocumentValidity,
  extracted: Partial<BrDocumentValidity>,
  formBrNumber: string,
): BrDocumentValidity {
  const coreBrNumber = extractBrCoreNumber(
    extracted.certificateBrNumber || current.certificateBrNumber || formBrNumber,
  )
  return {
    commencementDate: extracted.commencementDate || current.commencementDate,
    expiryDate: extracted.expiryDate || current.expiryDate,
    certificateBrNumber: coreBrNumber || current.certificateBrNumber || formBrNumber,
    certificateCompanyNameEn:
      extracted.certificateCompanyNameEn || current.certificateCompanyNameEn,
    certificateCompanyNameZh:
      extracted.certificateCompanyNameZh || current.certificateCompanyNameZh,
  }
}

export function mergeCiScanResult(
  current: CiDocumentValidity,
  extracted: Partial<CiDocumentValidity>,
): CiDocumentValidity {
  return {
    issueDate: extracted.issueDate || current.issueDate,
    certificateNumber: extracted.certificateNumber || current.certificateNumber,
    certificateCompanyNameEn:
      extracted.certificateCompanyNameEn || current.certificateCompanyNameEn,
    certificateCompanyNameZh:
      extracted.certificateCompanyNameZh || current.certificateCompanyNameZh,
  }
}

export function mergeNar1ScanResult(
  current: Nar1DocumentValidity,
  extracted: Partial<Nar1DocumentValidity>,
): Nar1DocumentValidity {
  const coreBrNumber = extractBrCoreNumber(
    extracted.businessRegistrationNumber || current.businessRegistrationNumber,
  )
  return {
    madeUpToDate: extracted.madeUpToDate || current.madeUpToDate,
    businessRegistrationNumber: coreBrNumber || current.businessRegistrationNumber,
    companyNameEn: extracted.companyNameEn || current.companyNameEn,
    companyNameZh: extracted.companyNameZh || current.companyNameZh,
    shareCapital: extracted.shareCapital || current.shareCapital,
    registeredOffice: extracted.registeredOffice || current.registeredOffice,
    directors:
      extracted.directors && extracted.directors.length > 0
        ? extracted.directors
        : current.directors,
  }
}
