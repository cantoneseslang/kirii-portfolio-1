"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  DOCUMENT_TYPES,
  getAttachmentTypeLabel,
  getMandatoryAttachmentKeys,
  getRegionVerificationDocument,
} from "@/types/hk-new-customer"
import { ContactNameFields } from "@/components/contact-name-fields"
import { LegalNameInput } from "@/components/legal-name-input"
import { DocumentFileInput } from "@/components/document-file-input"
import {
  collectContactNameIssues,
  emptyContactName,
  formatContactNameFull,
} from "@/lib/hk-new-customer-contact-name"
import { collectLegalNameIssues } from "@/lib/hk-new-customer-name-validation"
import { getApprovalStatusLabel, getApproverRole } from "@/lib/hk-new-customer-approval"
import {
  emptyStructuredAddress,
  formatStructuredAddress,
  getAreaLabel,
  getDistrictLabel,
  getRegionLabel,
  resolveStructuredAddress,
} from "@/lib/hk-new-customer-address"
import { HkAddressFields } from "@/components/hk-address-fields"
import { PhoneWithCountryCodeInput } from "@/components/phone-with-country-code-input"
import { MandatoryDocumentSlot } from "@/components/mandatory-document-slot"
import { BrDocumentSlot } from "@/components/br-document-slot"
import { CiDocumentSlot } from "@/components/ci-document-slot"
import { Nar1DocumentSlot } from "@/components/nar1-document-slot"
import { DocumentComplianceSummary } from "@/components/document-compliance-summary"
import { extractBrCoreNumber, validateMandatoryDocumentsForSubmit } from "@/lib/hk-new-customer-document-validity"
import type {
  BrDocumentValidity,
  CiDocumentValidity,
  Nar1DocumentValidity,
  ContactEntry,
  DocumentChecklist,
  DocumentValidityDates,
  HkNewCustomerIndexItem,
  HkNewCustomerRegistration,
  StructuredAddress,
} from "@/types/hk-new-customer"

type AttachmentFiles = Record<string, File | null>

const EMPTY_BR_VALIDITY: BrDocumentValidity = {
  commencementDate: "",
  expiryDate: "",
  certificateBrNumber: "",
  certificateCompanyNameEn: "",
  certificateCompanyNameZh: "",
}

const EMPTY_CI_VALIDITY: CiDocumentValidity = {
  issueDate: "",
  certificateNumber: "",
}

const EMPTY_NAR1_VALIDITY: Nar1DocumentValidity = {
  madeUpToDate: "",
  businessRegistrationNumber: "",
  companyNameEn: "",
  shareCapital: "",
  directors: [],
}

const EMPTY_CONTACT: ContactEntry = {
  ...emptyContactName(),
  title: "",
  email: "",
  phoneCountryCode: "+852",
  phone: "",
}

function emptyContacts(): ContactEntry[] {
  return [{ ...EMPTY_CONTACT }, { ...EMPTY_CONTACT }, { ...EMPTY_CONTACT }]
}

function checklistFromAttachments(files: AttachmentFiles): DocumentChecklist {
  return {
    br: Boolean(files.br),
    ci: Boolean(files.ci),
    nar1: Boolean(files.nar1),
    bankProof: Boolean(files.bank_proof),
    crCompanyParticulars: Boolean(files.cr_company_particulars),
    macauCommercialRegistration: Boolean(files.macau_commercial_registration),
  }
}

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" })
}

function AddressSummary({ detail, legacyText }: { detail?: StructuredAddress; legacyText?: string }) {
  const address = resolveStructuredAddress(detail, legacyText)
  const hasContent =
    address.addressEn || address.addressZh || address.district || address.area || legacyText

  if (!hasContent) return <>-</>

  return (
    <div className="space-y-1">
      <div>{getRegionLabel(address.region)}</div>
      {address.region === "hong_kong" && address.area && <div>{getAreaLabel(address.area)}</div>}
      {address.district && (
        <div>
          {address.region === "china" ? "Province / City / District / 省市区" : "District / 分區"}:{" "}
          {getDistrictLabel(address.district, address.region)}
        </div>
      )}
      {address.region === "china" && address.postalCode && (
        <div>
          Postal Code / 郵編: {address.postalCode}
        </div>
      )}
      {address.addressEn && (
        <div>
          EN: {address.addressEn}
        </div>
      )}
      {address.addressZh && (
        <div>
          中文: {address.addressZh}
        </div>
      )}
      {!detail && legacyText && !address.addressEn && !address.addressZh && <div>{legacyText}</div>}
    </div>
  )
}

export default function NewCustomerSettingPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("form")
  const [registrationId] = useState(() => crypto.randomUUID())
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [companyNameEn, setCompanyNameEn] = useState("")
  const [companyNameZh, setCompanyNameZh] = useState("")
  const [brNumber, setBrNumber] = useState("")
  const [incorporationDate, setIncorporationDate] = useState("")
  const [registeredAddressDetail, setRegisteredAddressDetail] = useState<StructuredAddress>(emptyStructuredAddress)
  const [deliveryAddressDetail, setDeliveryAddressDetail] = useState<StructuredAddress>(emptyStructuredAddress)
  const [contacts, setContacts] = useState<ContactEntry[]>(emptyContacts)
  const [apContactNameDetail, setApContactNameDetail] = useState(emptyContactName)
  const [apEmail, setApEmail] = useState("")
  const [invoiceEmail, setInvoiceEmail] = useState(true)
  const [invoicePost, setInvoicePost] = useState(false)
  const [bankName, setBankName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [estimatedMonthlyPurchase, setEstimatedMonthlyPurchase] = useState("")
  const [paymentTerms, setPaymentTerms] = useState<string>("advance")
  const [paymentTermsOther, setPaymentTermsOther] = useState("")
  const [attachmentFiles, setAttachmentFiles] = useState<AttachmentFiles>({})
  const [documentValidityDates, setDocumentValidityDates] = useState<DocumentValidityDates>({})
  const [showDocumentValidation, setShowDocumentValidation] = useState(false)
  const [authorizedSignature, setAuthorizedSignature] = useState("")
  const [declarationDate, setDeclarationDate] = useState("")
  const [signerNameTitle, setSignerNameTitle] = useState("")
  const [salesDepartment, setSalesDepartment] = useState("Sales")
  const [salesRepName, setSalesRepName] = useState("")
  const [verificationCheckedDate, setVerificationCheckedDate] = useState("")
  const [companyStatus, setCompanyStatus] = useState<string>("")
  const [bankProofCheck, setBankProofCheck] = useState<string>("")
  const [verificationRemarks, setVerificationRemarks] = useState("")

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<HkNewCustomerIndexItem[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<HkNewCustomerRegistration | null>(null)
  const [completedFormUrl, setCompletedFormUrl] = useState<string | null>(null)
  const [completedFormFileName, setCompletedFormFileName] = useState<string | null>(null)
  const [showNameValidation, setShowNameValidation] = useState(false)

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setSalesRepName(String(user.user_metadata.full_name))
    }
  }, [user])

  useEffect(() => {
    setAttachmentFiles((prev) => {
      const next = { ...prev }
      if (registeredAddressDetail.region !== "hong_kong") {
        delete next.cr_company_particulars
      }
      if (registeredAddressDetail.region !== "macau") {
        delete next.macau_commercial_registration
      }
      return next
    })
  }, [registeredAddressDetail.region])

  const regionVerificationDocument = useMemo(
    () => getRegionVerificationDocument(registeredAddressDetail.region),
    [registeredAddressDetail.region],
  )

  const mandatoryAttachmentKeys = useMemo(
    () => getMandatoryAttachmentKeys(registeredAddressDetail.region),
    [registeredAddressDetail.region],
  )

  const mandatoryDocumentSlots = useMemo(() => {
    const slots = DOCUMENT_TYPES.filter(
      (doc) => doc.key !== "bank_proof" && doc.key !== "br" && doc.key !== "ci" && doc.key !== "nar1",
    ).map((doc) => ({
      key: doc.key,
      labelEn: doc.labelEn,
      labelZh: doc.labelZh,
    }))
    if (regionVerificationDocument) {
      slots.push({
        key: regionVerificationDocument.key,
        labelEn: regionVerificationDocument.labelEn,
        labelZh: regionVerificationDocument.labelZh,
      })
    }
    return slots
  }, [regionVerificationDocument])

  const brDocument = useMemo(() => DOCUMENT_TYPES.find((doc) => doc.key === "br"), [])

  const ciDocument = useMemo(() => DOCUMENT_TYPES.find((doc) => doc.key === "ci"), [])

  const nar1Document = useMemo(() => DOCUMENT_TYPES.find((doc) => doc.key === "nar1"), [])

  const bankProofDocument = useMemo(
    () => DOCUMENT_TYPES.find((doc) => doc.key === "bank_proof"),
    [],
  )

  const updateContact = (index: number, field: keyof ContactEntry, value: string) => {
    setContacts((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const invoiceDelivery = useMemo(() => {
    const values: ("email" | "post")[] = []
    if (invoiceEmail) values.push("email")
    if (invoicePost) values.push("post")
    return values
  }, [invoiceEmail, invoicePost])

  const nameValidationIssues = useMemo(
    () => [
      ...collectContactNameIssues(
        contacts.map((contact, index) => ({
          key: `contact-${index}`,
          label: `Contact ${index + 1} / 聯絡人 ${index + 1}`,
          contact,
        })),
      ),
      ...collectContactNameIssues([
        {
          key: "ap-contact",
          label: "Accounts Payable Contact Name / 應付賬款聯絡人",
          contact: apContactNameDetail,
        },
      ]),
      ...collectLegalNameIssues([
        {
          key: "authorized-signature",
          label: "Authorized Signature / 獲授權人簽署",
          value: authorizedSignature,
        },
        {
          key: "signer-name-title",
          label: "Name & Title / 姓名及職位",
          value: signerNameTitle,
        },
      ]),
    ],
    [contacts, apContactNameDetail, authorizedSignature, signerNameTitle],
  )

  const buildFormData = (status: "draft" | "submitted") => {
    const formData = new FormData()
    formData.append("id", registrationId)
    formData.append("status", status)
    formData.append("createdBy", user?.id || "")
    formData.append("createdByName", user?.user_metadata?.full_name || user?.email || "")
    formData.append("submitterEmail", user?.email || "")
    formData.append("companyNameEn", companyNameEn)
    formData.append("companyNameZh", companyNameZh)
    formData.append("brNumber", brNumber)
    formData.append("incorporationDate", incorporationDate)
    formData.append("registeredAddressJson", JSON.stringify(registeredAddressDetail))
    formData.append("deliveryAddressJson", JSON.stringify(deliveryAddressDetail))
    formData.append("registeredAddress", formatStructuredAddress(registeredAddressDetail))
    formData.append("deliveryAddress", formatStructuredAddress(deliveryAddressDetail))
    formData.append("contactsJson", JSON.stringify(contacts))
    formData.append("apContactName", formatContactNameFull(apContactNameDetail))
    formData.append("apContactNameJson", JSON.stringify(apContactNameDetail))
    formData.append("apEmail", apEmail)
    formData.append("invoiceDeliveryJson", JSON.stringify(invoiceDelivery))
    formData.append("bankName", bankName)
    formData.append("accountName", accountName)
    formData.append("accountNumber", accountNumber)
    formData.append("bankCode", bankCode)
    formData.append("estimatedMonthlyPurchase", estimatedMonthlyPurchase)
    formData.append("paymentTerms", paymentTerms)
    formData.append("paymentTermsOther", paymentTermsOther)
    formData.append("documentsChecklistJson", JSON.stringify(checklistFromAttachments(attachmentFiles)))
    formData.append("documentValidityDatesJson", JSON.stringify(documentValidityDates))
    formData.append("authorizedSignature", authorizedSignature)
    formData.append("declarationDate", declarationDate)
    formData.append("signerNameTitle", signerNameTitle)
    formData.append("salesDepartment", salesDepartment)
    formData.append("salesRepName", salesRepName)
    formData.append("verificationCheckedDate", verificationCheckedDate)
    formData.append("companyStatus", companyStatus)
    formData.append("bankProofCheck", bankProofCheck)
    formData.append("verificationRemarks", verificationRemarks)

    for (const [documentType, file] of Object.entries(attachmentFiles)) {
      if (file) {
        formData.append(`attachment_${documentType}`, file)
      }
    }

    return formData
  }

  const handleSubmit = async (event: FormEvent, status: "draft" | "submitted") => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (nameValidationIssues.length > 0) {
      setShowNameValidation(true)
      setError(
        `Please correct invalid name fields before saving. / 請先修正不符合規則的姓名欄位：${nameValidationIssues
          .map((issue) => issue.label)
          .join(", ")}`,
      )
      return
    }

    setShowNameValidation(false)

    if (status === "submitted") {
      const uploadedTypes = Object.entries(attachmentFiles)
        .filter(([, file]) => Boolean(file))
        .map(([key]) => key)
      const documentValidation = validateMandatoryDocumentsForSubmit({
        region: registeredAddressDetail.region,
        uploadedDocumentTypes: uploadedTypes,
        validityDates: documentValidityDates,
        formBrNumber: brNumber,
        formCompanyNameEn: companyNameEn,
        formCompanyNameZh: companyNameZh,
      })

      if (!documentValidation.ok) {
        setShowDocumentValidation(true)
        setError(
          `Please complete all mandatory documents with valid dates. / 請上載所有必須文件並填寫有效日期：${documentValidation.issues
            .map((issue) => `${issue.label} (${issue.messageEn})`)
            .join("; ")}`,
        )
        return
      }
    }

    setShowDocumentValidation(false)

    setSubmitting(true)

    try {
      const response = await fetch("/api/hk-new-customer", {
        method: "POST",
        body: buildFormData(status),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save registration")
      }
      setMessage(result.message)
      if (result.data?.completedFormUrl) {
        setCompletedFormUrl(result.data.completedFormUrl)
        setCompletedFormFileName(result.data.completedFormFileName || "HK_New_Customer_Application.docx")
      } else if (status === "submitted") {
        setCompletedFormUrl(null)
        setCompletedFormFileName(null)
      }
      if (status === "submitted") {
        setActiveTab("search")
        void runSearch("")
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save registration")
    } finally {
      setSubmitting(false)
    }
  }

  const runSearch = useCallback(async (query: string) => {
    setSearchLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      const response = await fetch(`/api/hk-new-customer?${params.toString()}`)
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Search failed")
      }
      setSearchResults(result.data || [])
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed")
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const loadRecord = async (id: string) => {
    setSearchLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/hk-new-customer?id=${encodeURIComponent(id)}`)
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load record")
      }
      setSelectedRecord(result.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load record")
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "search") {
      void runSearch(searchQuery)
    }
  }, [activeTab, runSearch, searchQuery])

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#02315a]">NewCustomer Setting</h1>
          <p className="text-sm text-muted-foreground">New Customer Registration / 新客戶登記</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
        {user?.email && getApproverRole(user.email) && (
          <Button variant="outline" asChild>
            <Link href="/dashboard/new-customer-setting/approvals">Approvals / 審批</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Protocol Reference / 指引參考</CardTitle>
          <CardDescription>
            Hong Kong New Customer Account Setup &amp; Credit Management Protocol v3. Required documents:
            BR, CI, NAR1, Bank Proof, plus region-specific registry verification (HK: Companies Registry
            Company Particulars / 公司註冊處公司資料; Macau: Commercial Registration Certificate / 商業登記證明).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">Hong Kong / 香港：</span> Verify via{" "}
            <a
              href="https://www.e-services.cr.gov.hk/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#02315a] underline"
            >
              Companies Registry e-Services Portal / 公司註冊處電子服務
            </a>
            .
          </div>
          <div>
            <span className="font-medium text-foreground">Macau / 澳門：</span> Free basic lookup via{" "}
            <a
              href="https://eservice.dsaj.gov.mo/dsajservice9/commercial-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#02315a] underline"
            >
              Commercial Registration Information Platform / 商業登記訊息平台
            </a>
            {" "}
            (search by registration no. or business name / 以登記編號或商業名稱搜尋). For formal certificates
            (查公司紙 / 商業登記證明), apply via{" "}
            <a
              href="https://www.ab.gov.mo/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#02315a] underline"
            >
              商社通
            </a>{" "}
            or 一戶通, or see{" "}
            <a
              href="https://www.gov.mo/zh-hant/services/ps-2000/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#02315a] underline"
            >
              DSAJ commercial registration services / 法務局商業登記服務
            </a>
            . Issued by CRCBM / 商業及動產登記局.
          </div>
        </CardContent>
      </Card>

      {completedFormUrl && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <div className="font-medium">Completed Application Form / 已完成申請表格</div>
          <a
            href={completedFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[#02315a] underline"
          >
            Download Word Form / 下載 Word 表格 ({completedFormFileName || "application.docx"})
          </a>
        </div>
      )}

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-gray-100 p-1.5 sm:max-w-xl sm:grid-cols-2">
          <TabsTrigger
            value="form"
            className="rounded-md border border-transparent px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-white/70 data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:text-[#02315a] data-[state=active]:shadow-sm"
          >
            New Registration / 新客戶登記
          </TabsTrigger>
          <TabsTrigger
            value="search"
            className="rounded-md border border-transparent px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-white/70 data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:text-[#02315a] data-[state=active]:shadow-sm"
          >
            Search Records / 搜尋紀錄
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6">
          <form className="space-y-6" onSubmit={(event) => handleSubmit(event, "submitted")}>
            <Card>
              <CardHeader>
                <CardTitle>Part 1: Company Information / 公司基本資料</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyNameEn">Registered Company Name (English) *</Label>
                  <Input id="companyNameEn" value={companyNameEn} onChange={(e) => setCompanyNameEn(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyNameZh">Registered Company Name (Chinese / 中文全稱)</Label>
                  <Input id="companyNameZh" value={companyNameZh} onChange={(e) => setCompanyNameZh(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brNumber">Business Registration (BR) No. *</Label>
                  <Input
                    id="brNumber"
                    value={brNumber}
                    placeholder="10955344 (8 digits, suffix not required)"
                    onChange={(e) => setBrNumber(extractBrCoreNumber(e.target.value))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Main 8-digit number only / 只需8位主號碼。Auto-filled from BR scan when empty /
                    掃描證件後可自動填入。
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incorporationDate">Date of Incorporation</Label>
                  <Input id="incorporationDate" type="date" value={incorporationDate} onChange={(e) => setIncorporationDate(e.target.value)} />
                </div>
                <HkAddressFields
                  idPrefix="registered"
                  titleEn="Registered Address"
                  titleZh="註冊地址"
                  value={registeredAddressDetail}
                  onChange={setRegisteredAddressDetail}
                />
                <HkAddressFields
                  idPrefix="delivery"
                  titleEn="Delivery Address"
                  titleZh="送貨地址"
                  value={deliveryAddressDetail}
                  onChange={setDeliveryAddressDetail}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Part 2: Contact Information / 聯絡資料</CardTitle>
                <CardDescription>
                  Primary contacts must use full legal names in English (given name, middle name, surname) and
                  Chinese. Nicknames are not allowed. / 必須分別填寫英文名字、中間名、姓氏及中文姓名全名，嚴禁使用花名。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {showNameValidation && nameValidationIssues.length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                    <div className="font-medium">
                      Name validation required / 姓名檢查未通過
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {nameValidationIssues.map((issue) => (
                        <li key={issue.key}>
                          {issue.label}: {issue.validation.messageEn} / {issue.validation.messageZh}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {contacts.map((contact, index) => (
                  <div key={index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                    <div className="md:col-span-2 font-medium">Contact {index + 1} / 聯絡人 {index + 1}</div>
                    <ContactNameFields
                      idPrefix={`contact-${index}`}
                      value={contact}
                      showErrors={showNameValidation}
                      onChange={(value) =>
                        setContacts((prev) => {
                          const next = [...prev]
                          next[index] = { ...next[index], ...value }
                          return next
                        })
                      }
                    />
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={contact.title} onChange={(e) => updateContact(index, "title", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={contact.email} onChange={(e) => updateContact(index, "email", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <PhoneWithCountryCodeInput
                        id={`contact-${index}`}
                        countryCode={contact.phoneCountryCode}
                        phone={contact.phone}
                        onCountryCodeChange={(value) => updateContact(index, "phoneCountryCode", value)}
                        onPhoneChange={(value) => updateContact(index, "phone", value)}
                      />
                    </div>
                  </div>
                ))}

                <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                  <div className="md:col-span-2 font-medium">
                    Accounts Payable Contact / 應付賬款聯絡人
                  </div>
                  <ContactNameFields
                    idPrefix="ap-contact"
                    value={apContactNameDetail}
                    showErrors={showNameValidation}
                    onChange={setApContactNameDetail}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="apEmail">A/P Email</Label>
                    <Input id="apEmail" type="email" value={apEmail} onChange={(e) => setApEmail(e.target.value)} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Invoice Delivery / 賬單發送方式</Label>
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={invoiceEmail} onCheckedChange={(checked) => setInvoiceEmail(Boolean(checked))} />
                        Via Email Only / 只經電郵
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={invoicePost} onCheckedChange={(checked) => setInvoicePost(Boolean(checked))} />
                        Post / 郵寄
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Part 3: Bank Account Details / 銀行戶口資料</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name / 戶口名稱</Label>
                  <Input
                    id="accountName"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Must match company name / 須與公司名稱一致"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankCode">Bank Code / SWIFT Code</Label>
                  <Input id="bankCode" value={bankCode} onChange={(e) => setBankCode(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Part 4: Requested Terms / 擬定交易條件</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedMonthlyPurchase">Estimated Monthly Purchase (HKD)</Label>
                  <Input
                    id="estimatedMonthlyPurchase"
                    type="number"
                    min="0"
                    value={estimatedMonthlyPurchase}
                    onChange={(e) => setEstimatedMonthlyPurchase(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Requested Payment Terms</Label>
                  <RadioGroup value={paymentTerms} onValueChange={setPaymentTerms}>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="advance" /> Advance Payment / 預付
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="30_days_invoice" /> 30 Days from Invoice Date / 發票日期起計30天
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="30_days_eom" /> 30 Days EOM / 月底結算後30天
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="other" /> Other / 其他
                    </label>
                  </RadioGroup>
                  {paymentTerms === "other" && (
                    <Input
                      placeholder="Other payment terms"
                      value={paymentTermsOther}
                      onChange={(e) => setPaymentTermsOther(e.target.value)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Part 5: Required Documents / 必須附帶文件</CardTitle>
                <CardDescription>
                  Upload each mandatory document and enter its date or validity. Bank proof is optional. /
                  請上載必須文件並填寫日期或有效期限。銀行戶口證明為可選。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {brDocument && (
                  <BrDocumentSlot
                    labelEn={brDocument.labelEn}
                    labelZh={brDocument.labelZh}
                    formBrNumber={brNumber}
                    formCompanyNameEn={companyNameEn}
                    formCompanyNameZh={companyNameZh}
                    file={attachmentFiles.br || null}
                    validity={documentValidityDates.br || EMPTY_BR_VALIDITY}
                    showValidation={showDocumentValidation}
                    onFileChange={(nextFile) =>
                      setAttachmentFiles((prev) => ({
                        ...prev,
                        br: nextFile,
                      }))
                    }
                    onValidityChange={(value) =>
                      setDocumentValidityDates((prev) => ({
                        ...prev,
                        br: value,
                      }))
                    }
                    onFormBrNumberSuggest={(coreBrNumber) => {
                      setBrNumber((current) => (current.trim() ? current : coreBrNumber))
                    }}
                    onFormCompanyNameEnSuggest={(name) => {
                      setCompanyNameEn((current) => (current.trim() ? current : name))
                    }}
                  />
                )}

                {ciDocument && (
                  <CiDocumentSlot
                    labelEn={ciDocument.labelEn}
                    labelZh={ciDocument.labelZh}
                    file={attachmentFiles.ci || null}
                    validity={
                      typeof documentValidityDates.ci === "object" && documentValidityDates.ci
                        ? documentValidityDates.ci
                        : {
                            ...EMPTY_CI_VALIDITY,
                            issueDate:
                              typeof documentValidityDates.ci === "string"
                                ? documentValidityDates.ci
                                : "",
                          }
                    }
                    showValidation={showDocumentValidation}
                    onFileChange={(nextFile) =>
                      setAttachmentFiles((prev) => ({
                        ...prev,
                        ci: nextFile,
                      }))
                    }
                    onValidityChange={(value) =>
                      setDocumentValidityDates((prev) => ({
                        ...prev,
                        ci: value,
                      }))
                    }
                  />
                )}

                {nar1Document && (
                  <Nar1DocumentSlot
                    labelEn={nar1Document.labelEn}
                    labelZh={nar1Document.labelZh}
                    formBrNumber={brNumber}
                    formCompanyNameEn={companyNameEn}
                    file={attachmentFiles.nar1 || null}
                    validity={
                      typeof documentValidityDates.nar1 === "object" && documentValidityDates.nar1
                        ? documentValidityDates.nar1
                        : {
                            ...EMPTY_NAR1_VALIDITY,
                            madeUpToDate:
                              typeof documentValidityDates.nar1 === "string"
                                ? documentValidityDates.nar1
                                : "",
                          }
                    }
                    showValidation={showDocumentValidation}
                    onFileChange={(nextFile) =>
                      setAttachmentFiles((prev) => ({
                        ...prev,
                        nar1: nextFile,
                      }))
                    }
                    onValidityChange={(value) =>
                      setDocumentValidityDates((prev) => ({
                        ...prev,
                        nar1: value,
                      }))
                    }
                    onFormBrNumberSuggest={(coreBrNumber) => {
                      setBrNumber((current) => (current.trim() ? current : coreBrNumber))
                    }}
                    onFormCompanyNameSuggest={(name) => {
                      setCompanyNameEn((current) => (current.trim() ? current : name))
                    }}
                  />
                )}

                {mandatoryDocumentSlots.map((doc) => (
                  <MandatoryDocumentSlot
                    key={doc.key}
                    docKey={doc.key}
                    labelEn={doc.labelEn}
                    labelZh={doc.labelZh}
                    file={attachmentFiles[doc.key] || null}
                    validityDate={
                      typeof documentValidityDates[doc.key as keyof DocumentValidityDates] === "string"
                        ? (documentValidityDates[doc.key as keyof DocumentValidityDates] as string)
                        : ""
                    }
                    showValidation={showDocumentValidation}
                    onFileChange={(nextFile) =>
                      setAttachmentFiles((prev) => ({
                        ...prev,
                        [doc.key]: nextFile,
                      }))
                    }
                    onValidityDateChange={(value) =>
                      setDocumentValidityDates((prev) => ({
                        ...prev,
                        [doc.key]: value,
                      }))
                    }
                  />
                ))}

                {bankProofDocument && (
                  <div className="space-y-3 rounded-lg border border-dashed p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{bankProofDocument.labelEn}</div>
                        <div className="text-sm text-muted-foreground">{bankProofDocument.labelZh}</div>
                        <div className="text-xs text-muted-foreground mt-1">Optional / 可選</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {attachmentFiles.bank_proof ? "Uploaded / 已上載" : "Optional / 可選"}
                      </span>
                    </div>
                    <DocumentFileInput
                      className="w-full max-w-md"
                      value={attachmentFiles.bank_proof || null}
                      onChange={(file) =>
                        setAttachmentFiles((prev) => ({
                          ...prev,
                          bank_proof: file,
                        }))
                      }
                    />
                  </div>
                )}
                <div className="space-y-3 rounded-lg border border-dashed p-4">
                  <div>
                    <div className="font-medium">Other Supporting Document / 其他附件</div>
                    <div className="text-sm text-muted-foreground">Optional / 可選</div>
                  </div>
                  <DocumentFileInput
                    className="w-full max-w-md"
                    value={attachmentFiles.other || null}
                    onChange={(file) =>
                      setAttachmentFiles((prev) => ({
                        ...prev,
                        other: file,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Part 6: Declaration &amp; Signature / 聲明及簽署</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 text-sm text-muted-foreground">
                  We declare that the information provided is true, accurate, and complete. We authorize credit
                  background checks via official channels. / 我們特此聲明所填資料真實、準確及完整，並授權進行信貸背景審查。
                </div>
                <div className="space-y-2">
                  <LegalNameInput
                    id="authorizedSignature"
                    label="Authorized Signature (typed name) / 獲授權人簽署"
                    value={authorizedSignature}
                    onChange={setAuthorizedSignature}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="declarationDate">Date</Label>
                  <Input id="declarationDate" type="date" value={declarationDate} onChange={(e) => setDeclarationDate(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <LegalNameInput
                    id="signerNameTitle"
                    label="Name & Title / 姓名及職位"
                    value={signerNameTitle}
                    onChange={setSignerNameTitle}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>For Internal Use Only / 內部處理專欄</CardTitle>
                <CardDescription>Do not send this section to the customer. / 請勿發送給客戶</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salesDepartment">Department</Label>
                  <Input id="salesDepartment" value={salesDepartment} onChange={(e) => setSalesDepartment(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesRepName">Sales Representative</Label>
                  <Input id="salesRepName" value={salesRepName} onChange={(e) => setSalesRepName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verificationCheckedDate">Checked Date</Label>
                  <Input id="verificationCheckedDate" type="date" value={verificationCheckedDate} onChange={(e) => setVerificationCheckedDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company Status</Label>
                  <RadioGroup value={companyStatus} onValueChange={setCompanyStatus}>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="live" /> Live / Active / 仍註冊
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="dissolved" /> Dissolved / Ceased / 已解散
                    </label>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Bank Proof Check</Label>
                  <RadioGroup value={bankProofCheck} onValueChange={setBankProofCheck}>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="match" /> Match / 相符
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="discrepancy" /> Discrepancy / 不相符
                    </label>
                  </RadioGroup>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="verificationRemarks">Findings / Remarks</Label>
                  <Textarea id="verificationRemarks" value={verificationRemarks} onChange={(e) => setVerificationRemarks(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit / 提交"}
              </Button>
              <Button type="button" variant="secondary" disabled={submitting} onClick={(event) => handleSubmit(event, "draft")}>
                Save Draft / 儲存草稿
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Customer Registrations / 搜尋客戶登記</CardTitle>
              <CardDescription>
                Search by company name, BR number, contact name, or sales representative. /
                可按公司名稱、商業登記號碼、聯絡人或銷售員搜尋。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  placeholder="Search / 搜尋"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="button" onClick={() => runSearch(searchQuery)} disabled={searchLoading}>
                  {searchLoading ? "Searching..." : "Search"}
                </Button>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Company</th>
                      <th className="px-3 py-2 text-left">BR No.</th>
                      <th className="px-3 py-2 text-left">Approval</th>
                      <th className="px-3 py-2 text-left">Created</th>
                      <th className="px-3 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                          {searchLoading ? "Loading..." : "No records found"}
                        </td>
                      </tr>
                    ) : (
                      searchResults.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2">
                            <div>{item.companyNameEn}</div>
                            {item.companyNameZh && <div className="text-muted-foreground">{item.companyNameZh}</div>}
                          </td>
                          <td className="px-3 py-2">{item.brNumber}</td>
                          <td className="px-3 py-2">{getApprovalStatusLabel(item.approvalStatus)}</td>
                          <td className="px-3 py-2">{formatDate(item.createdAt)}</td>
                          <td className="px-3 py-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => loadRecord(item.id)}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {selectedRecord && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedRecord.companyNameEn}</CardTitle>
                <CardDescription>
                  BR: {selectedRecord.brNumber} · Approval: {getApprovalStatusLabel(selectedRecord.approvalStatus)} · Created: {formatDate(selectedRecord.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-2 md:grid-cols-2">
                  <div><span className="font-medium">Chinese Name:</span> {selectedRecord.companyNameZh || "-"}</div>
                  <div><span className="font-medium">Incorporation Date:</span> {selectedRecord.incorporationDate || "-"}</div>
                  <div><span className="font-medium">Registered Address / 註冊地址:</span> <AddressSummary detail={selectedRecord.registeredAddressDetail} legacyText={selectedRecord.registeredAddress} /></div>
                  <div><span className="font-medium">Delivery Address / 送貨地址:</span> <AddressSummary detail={selectedRecord.deliveryAddressDetail} legacyText={selectedRecord.deliveryAddress} /></div>
                  <div><span className="font-medium">A/P Contact:</span> {selectedRecord.apContactName || "-"}</div>
                  <div><span className="font-medium">A/P Email:</span> {selectedRecord.apEmail || "-"}</div>
                  <div><span className="font-medium">Sales Rep:</span> {selectedRecord.salesRepName || "-"}</div>
                  <div><span className="font-medium">Payment Terms:</span> {selectedRecord.paymentTerms || "-"}</div>
                </div>

                {selectedRecord.approvalHistory && selectedRecord.approvalHistory.length > 0 && (
                  <div>
                    <div className="mb-2 font-medium">Approval History / 審批紀錄</div>
                    <ul className="space-y-2">
                      {selectedRecord.approvalHistory.map((entry, index) => (
                        <li key={`${entry.timestamp}-${index}`} className="rounded-md border p-2">
                          {entry.action} by {entry.approverName} ({entry.approverEmail}) · {new Date(entry.timestamp).toLocaleString("zh-HK")}
                          {entry.comment ? ` · ${entry.comment}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedRecord.attachments.length > 0 && (
                  <div>
                    <div className="mb-2 font-medium">Attachments / 附件</div>
                    <ul className="space-y-1">
                      {selectedRecord.attachments.map((attachment) => (
                        <li key={attachment.id}>
                          <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#02315a] underline">
                            {getAttachmentTypeLabel(attachment.documentType)} - {attachment.fileName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <DocumentComplianceSummary registration={selectedRecord} />

                {selectedRecord.completedFormUrl && (
                  <div>
                    <div className="mb-2 font-medium">Completed Application Form / 已完成申請表格</div>
                    <a
                      href={selectedRecord.completedFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#02315a] underline"
                    >
                      Download Word Form / 下載 Word 表格
                      {selectedRecord.completedFormFileName
                        ? ` (${selectedRecord.completedFormFileName})`
                        : ""}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
