export type ContactEntry = {
  nameEnFirst: string
  nameEnMiddle: string
  nameEnLast: string
  nameZh: string
  /** @deprecated Legacy combined name; derived on save for older records */
  name?: string
  title: string
  email: string
  phoneCountryCode: string
  phone: string
}

export type AddressRegion = "hong_kong" | "macau" | "china" | "overseas"

export type HkAddressArea = "hong_kong_island" | "kowloon" | "new_territories"

export type StructuredAddress = {
  region: AddressRegion
  area?: HkAddressArea
  district: string
  postalCode?: string
  addressEn: string
  addressZh: string
}

export type DocumentChecklist = {
  br: boolean
  ci: boolean
  nar1: boolean
  bankProof: boolean
  crCompanyParticulars?: boolean
  macauCommercialRegistration?: boolean
}

export type AttachmentDocumentType =
  | "br"
  | "ci"
  | "nar1"
  | "bank_proof"
  | "cr_company_particulars"
  | "macau_commercial_registration"
  | "other"

export type AttachmentRecord = {
  id: string
  documentType: AttachmentDocumentType
  fileName: string
  fileUrl: string
  fileSize?: number
  contentType?: string
  uploadedAt: string
}

export type ApprovalStatus =
  | "pending_sales_manager"
  | "pending_finance"
  | "pending_gm"
  | "approved"
  | "rejected"

export type ApprovalHistoryEntry = {
  step: ApprovalStatus | "draft"
  action: "submit" | "approve" | "reject"
  approverName: string
  approverEmail: string
  comment?: string
  timestamp: string
}

export type BrDocumentValidity = {
  commencementDate: string
  expiryDate: string
  certificateBrNumber: string
  certificateCompanyNameEn: string
  certificateCompanyNameZh?: string
}

export type CiDocumentValidity = {
  issueDate: string
  certificateNumber: string
  certificateCompanyNameEn: string
  certificateCompanyNameZh?: string
}

export type Nar1AddressParts = {
  flatFloorBlock: string
  building: string
  street: string
  district: string
  country: string
  /** OCR hint: hong_kong_island | kowloon | new_territories */
  area?: HkAddressArea
  /** OCR hint: HK_DISTRICTS value e.g. sai_kung */
  districtKey?: string
}

export type Nar1Director = Nar1AddressParts & {
  nameEn: string
  nameEnFirst?: string
  nameEnLast?: string
  nameZh?: string
}

export type Nar1DocumentValidity = {
  madeUpToDate: string
  businessRegistrationNumber: string
  companyNameEn: string
  companyNameZh?: string
  shareCapital: string
  registeredOffice?: Nar1AddressParts
  directors: Nar1Director[]
}

export type DocumentValidityDates = {
  br?: BrDocumentValidity
  ci?: CiDocumentValidity | string
  nar1?: Nar1DocumentValidity | string
  cr_company_particulars?: string
  macau_commercial_registration?: string
}

export type HkNewCustomerRegistration = {
  id: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  createdByName?: string
  submitterEmail?: string
  status: "draft" | "submitted"
  approvalStatus?: ApprovalStatus
  approvalHistory?: ApprovalHistoryEntry[]
  submittedAt?: string
  approvedAt?: string

  companyNameEn: string
  companyNameZh?: string
  brNumber: string
  incorporationDate?: string
  registeredAddress?: string
  deliveryAddress?: string
  registeredAddressDetail?: StructuredAddress
  deliveryAddressDetail?: StructuredAddress

  contacts: ContactEntry[]
  apContactName?: string
  apEmail?: string
  apPhoneCountryCode?: string
  apPhone?: string
  invoiceDelivery: ("email" | "post")[]

  bankName?: string
  bankBranchName?: string
  bankBranchNumber?: string
  accountName?: string
  accountNumber?: string
  bankCode?: string

  estimatedMonthlyPurchase?: number
  paymentTerms?: "advance" | "30_days_invoice" | "30_days_eom" | "other"
  paymentTermsOther?: string

  documentsChecklist: DocumentChecklist
  attachments: AttachmentRecord[]
  documentValidityDates?: DocumentValidityDates

  authorizedSignature?: string
  declarationDate?: string
  signerNameTitle?: string

  salesDepartment?: string
  salesRepName?: string
  verificationCheckedDate?: string
  companyStatus?: "live" | "dissolved"
  bankProofCheck?: "match" | "discrepancy"
  verificationRemarks?: string

  completedFormUrl?: string
  completedFormFileName?: string
}

export type HkNewCustomerIndexItem = {
  id: string
  companyNameEn: string
  companyNameZh?: string
  brNumber: string
  createdAt: string
  status: "draft" | "submitted"
  approvalStatus?: ApprovalStatus
  submitterEmail?: string
  salesRepName?: string
  apContactName?: string
}

export type HkNewCustomerIndex = {
  updatedAt: string
  items: HkNewCustomerIndexItem[]
}

export const DOCUMENT_TYPES = [
  { key: "br", labelEn: "Business Registration (BR)", labelZh: "有效商業登記證副本" },
  { key: "ci", labelEn: "Certificate of Incorporation (CI)", labelZh: "公司註冊證明書副本" },
  { key: "nar1", labelEn: "Annual Return (NAR1)", labelZh: "最新周年申報表副本" },
  { key: "bank_proof", labelEn: "Bank Proof", labelZh: "銀行戶口證明" },
] as const

export const REGION_VERIFICATION_DOCUMENTS = {
  hong_kong: {
    key: "cr_company_particulars",
    labelEn: "Companies Registry Company Particulars",
    labelZh: "公司註冊處公司資料",
  },
  macau: {
    key: "macau_commercial_registration",
    labelEn: "Commercial Registration Certificate",
    labelZh: "商業登記證明",
  },
} as const

export function getRegionVerificationDocument(region: AddressRegion) {
  if (region === "hong_kong") return REGION_VERIFICATION_DOCUMENTS.hong_kong
  if (region === "macau") return REGION_VERIFICATION_DOCUMENTS.macau
  return null
}

export function getMandatoryAttachmentKeys(region: AddressRegion): string[] {
  const keys = DOCUMENT_TYPES.filter((doc) => doc.key !== "bank_proof").map((doc) => doc.key)
  const verification = getRegionVerificationDocument(region)
  if (verification) keys.push(verification.key)
  return keys
}

/** @deprecated Use getMandatoryAttachmentKeys. Bank proof is optional and excluded. */
export function getRequiredAttachmentKeys(region: AddressRegion): string[] {
  return getMandatoryAttachmentKeys(region)
}

export const OPTIONAL_ATTACHMENT_KEYS = ["bank_proof", "other"] as const

export function getAttachmentTypeLabel(documentType: string): string {
  const base = DOCUMENT_TYPES.find((doc) => doc.key === documentType)
  if (base) return `${base.labelEn} / ${base.labelZh}`
  if (documentType === "cr_company_particulars") {
    return `${REGION_VERIFICATION_DOCUMENTS.hong_kong.labelEn} / ${REGION_VERIFICATION_DOCUMENTS.hong_kong.labelZh}`
  }
  if (documentType === "macau_commercial_registration") {
    return `${REGION_VERIFICATION_DOCUMENTS.macau.labelEn} / ${REGION_VERIFICATION_DOCUMENTS.macau.labelZh}`
  }
  if (documentType === "other") return "Other Supporting Document / 其他附件"
  return documentType
}
