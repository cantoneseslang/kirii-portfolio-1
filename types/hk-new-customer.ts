export type ContactEntry = {
  name: string
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
}

export type AttachmentRecord = {
  id: string
  documentType: "br" | "ci" | "nar1" | "bank_proof" | "other"
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
  invoiceDelivery: ("email" | "post")[]

  bankName?: string
  accountName?: string
  accountNumber?: string
  bankCode?: string

  estimatedMonthlyPurchase?: number
  paymentTerms?: "advance" | "30_days_invoice" | "30_days_eom" | "other"
  paymentTermsOther?: string

  documentsChecklist: DocumentChecklist
  attachments: AttachmentRecord[]

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
