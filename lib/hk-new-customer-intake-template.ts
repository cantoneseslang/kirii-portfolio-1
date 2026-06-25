import * as XLSX from "xlsx"
import type { AddressRegion, ContactEntry, HkAddressArea, StructuredAddress } from "@/types/hk-new-customer"
import {
  ADDRESS_REGIONS,
  HK_ADDRESS_AREAS,
  HK_DISTRICTS,
  MACAU_DISTRICTS,
  emptyStructuredAddress,
} from "@/lib/hk-new-customer-address"
import { emptyContactName, type ContactNameFields } from "@/lib/hk-new-customer-contact-name"
import { extractBrCoreNumber } from "@/lib/hk-new-customer-document-validity"

export const INTAKE_TEMPLATE_FILENAME = "KIRII_New_Customer_Questionnaire.xlsx"
export const INTAKE_FILL_SHEET = "Fill In"
export const INTAKE_INSTRUCTIONS_SHEET = "Instructions"

type IntakeFieldDef = {
  key: string
  label: string
  hint?: string
}

type IntakeSection = {
  title: string
  fields: IntakeFieldDef[]
}

const PAYMENT_TERM_HINT =
  "advance | 30_days_invoice | 30_days_eom | other (or 預付 / 發票30天 / 月底30天 / 其他)"

const YES_NO_HINT = "Y / Yes / 是 = yes, leave blank = no"

const INTAKE_SECTIONS: IntakeSection[] = [
  {
    title: "Part 2: Company Information / 公司基本資料",
    fields: [
      {
        key: "companyNameEn",
        label: "Registered Company Name (English) / 公司英文名稱 *",
        hint: "e.g. KIRII (Hong Kong) Limited",
      },
      { key: "companyNameZh", label: "Registered Company Name (Chinese) / 公司中文全稱" },
      {
        key: "brNumber",
        label: "Business Registration (BR) No. / 商業登記號碼 *",
        hint: "8 digits only / 只需8位數字",
      },
      {
        key: "incorporationDate",
        label: "Date of Incorporation / 成立日期",
        hint: "YYYY-MM-DD",
      },
    ],
  },
  {
    title: "Registered Address / 註冊地址",
    fields: [
      {
        key: "registeredAddress.region",
        label: "Region / 地區",
        hint: "hong_kong | macau | china | overseas",
      },
      {
        key: "registeredAddress.area",
        label: "Area (HK only) / 區域（香港）",
        hint: "hong_kong_island | kowloon | new_territories",
      },
      {
        key: "registeredAddress.district",
        label: "District / 分區",
        hint: "e.g. Central and Western / 中西區",
      },
      { key: "registeredAddress.postalCode", label: "Postal Code / 郵政編號" },
      { key: "registeredAddress.addressEn", label: "Street & building (English) / 英文地址" },
      { key: "registeredAddress.addressZh", label: "Street & building (Chinese) / 中文地址" },
    ],
  },
  {
    title: "Delivery Address / 送貨地址",
    fields: [
      {
        key: "deliveryAddress.region",
        label: "Region / 地區",
        hint: "hong_kong | macau | china | overseas",
      },
      {
        key: "deliveryAddress.area",
        label: "Area (HK only) / 區域（香港）",
        hint: "hong_kong_island | kowloon | new_territories",
      },
      { key: "deliveryAddress.district", label: "District / 分區" },
      { key: "deliveryAddress.postalCode", label: "Postal Code / 郵政編號" },
      { key: "deliveryAddress.addressEn", label: "Street & building (English) / 英文地址" },
      { key: "deliveryAddress.addressZh", label: "Street & building (Chinese) / 中文地址" },
    ],
  },
  ...([1, 2, 3] as const).map((index) => ({
    title: `Contact ${index} / 聯絡人 ${index}`,
    fields: [
      { key: `contact${index}.nameEnFirst`, label: "Given name (English) / 英文名字" },
      { key: `contact${index}.nameEnMiddle`, label: "Middle name (English) / 英文中間名" },
      { key: `contact${index}.nameEnLast`, label: "Surname (English) / 英文姓氏" },
      { key: `contact${index}.nameZh`, label: "Full name (Chinese) / 中文全名" },
      { key: `contact${index}.title`, label: "Title / 職銜" },
      { key: `contact${index}.email`, label: "Email / 電郵" },
      { key: `contact${index}.phoneCountryCode`, label: "Phone country code / 電話區號", hint: "+852" },
      { key: `contact${index}.phone`, label: "Phone number / 電話號碼" },
    ],
  })),
  {
    title: "Accounts Payable Contact / 應付賬款聯絡人",
    fields: [
      { key: "ap.nameEnFirst", label: "Given name (English) / 英文名字" },
      { key: "ap.nameEnMiddle", label: "Middle name (English) / 英文中間名" },
      { key: "ap.nameEnLast", label: "Surname (English) / 英文姓氏" },
      { key: "ap.nameZh", label: "Full name (Chinese) / 中文全名" },
      { key: "apEmail", label: "A/P Email / 應付賬款電郵" },
      { key: "apPhoneCountryCode", label: "A/P phone country code / 電話區號", hint: "+852" },
      { key: "apPhone", label: "A/P phone number / 電話號碼" },
      {
        key: "invoiceDelivery.email",
        label: "Send invoice by email / 以電郵發送賬單",
        hint: YES_NO_HINT,
      },
      {
        key: "invoiceDelivery.post",
        label: "Send invoice by post / 以郵寄發送賬單",
        hint: YES_NO_HINT,
      },
    ],
  },
  {
    title: "Part 4: Bank Account / 銀行戶口資料",
    fields: [
      { key: "bankName", label: "Bank Name / 銀行名稱" },
      { key: "bankBranchName", label: "Branch Name / 分店名稱" },
      { key: "bankBranchNumber", label: "Branch No. / 分店號碼" },
      {
        key: "accountName",
        label: "Account Name / 戶口名稱",
        hint: "Must match company name / 須與公司名稱一致",
      },
      { key: "accountNumber", label: "Account Number / 戶口號碼" },
      { key: "bankCode", label: "Bank Code / SWIFT Code / 銀行代碼" },
    ],
  },
  {
    title: "Part 5: Payment Terms / 付款條件",
    fields: [
      {
        key: "paymentTerms",
        label: "Requested Payment Terms / 擬定付款條件",
        hint: PAYMENT_TERM_HINT,
      },
      { key: "paymentTermsOther", label: "Other payment terms detail / 其他付款條件說明" },
    ],
  },
  {
    title: "Part 6: Declaration / 聲明及簽署",
    fields: [
      {
        key: "authorizedSignature",
        label: "Authorized signatory (typed full name) / 獲授權人簽署（全名）",
      },
      { key: "declarationDate", label: "Date / 日期", hint: "YYYY-MM-DD" },
    ],
  },
]

export type HkNewCustomerIntakeImport = {
  companyNameEn: string
  companyNameZh: string
  brNumber: string
  incorporationDate: string
  registeredAddressDetail: StructuredAddress
  deliveryAddressDetail: StructuredAddress
  contacts: ContactEntry[]
  apContactNameDetail: ContactNameFields
  apEmail: string
  apPhoneCountryCode: string
  apPhone: string
  invoiceEmail: boolean
  invoicePost: boolean
  bankName: string
  bankBranchName: string
  bankBranchNumber: string
  accountName: string
  accountNumber: string
  bankCode: string
  paymentTerms: string
  paymentTermsOther: string
  authorizedSignature: string
  declarationDate: string
  importedFieldCount: number
  warnings: string[]
}

function instructionRows(): string[][] {
  return [
    ["KIRII New Customer Questionnaire / 桐井新客戶資料問卷"],
    [""],
    ["How to use / 使用方法"],
    ["1. Open the sheet \"Fill In\" and enter answers in column C only. / 請在「Fill In」工作表 C 欄填寫。"],
    ["2. Do not change column A (field keys). / 請勿修改 A 欄欄位代碼。"],
    ["3. Return this Excel file together with scanned documents (BR, CI, NAR1, etc.). / 連同 BR、CI、NAR1 等掃描文件一併交回。"],
    ["4. Sales will upload this file in Portfolio to auto-fill the registration form. / Sales 同事會在 Portfolio 上載此檔以自動填入表格。"],
    [""],
    ["Region options / 地區選項"],
    ...ADDRESS_REGIONS.map((entry) => [entry.value, `${entry.labelEn} / ${entry.labelZh}`]),
    [""],
    ["HK Area options / 香港區域"],
    ...HK_ADDRESS_AREAS.map((entry) => [entry.value, `${entry.labelEn} / ${entry.labelZh}`]),
    [""],
    ["Payment terms / 付款條件"],
    ["advance", "Advance Payment / 預付"],
    ["30_days_invoice", "30 Days from Invoice Date / 發票日期起計30天"],
    ["30_days_eom", "30 Days EOM / 月底結算後30天"],
    ["other", "Other / 其他"],
  ]
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return String(value).trim()
}

function parseYesNo(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return ["y", "yes", "true", "1", "是", "有", "✓", "x"].includes(normalized)
}

function parseRegion(value: string): AddressRegion | "" {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_")
  const aliases: Record<string, AddressRegion> = {
    hong_kong: "hong_kong",
    hk: "hong_kong",
    hongkong: "hong_kong",
    香港: "hong_kong",
    macau: "macau",
    mo: "macau",
    澳門: "macau",
    china: "china",
    cn: "china",
    中國: "china",
    overseas: "overseas",
    海外: "overseas",
  }
  return aliases[normalized] || (ADDRESS_REGIONS.some((entry) => entry.value === normalized) ? (normalized as AddressRegion) : "")
}

function parseArea(value: string): HkAddressArea | "" {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_")
  const aliases: Record<string, HkAddressArea> = {
    hong_kong_island: "hong_kong_island",
    hk_island: "hong_kong_island",
    island: "hong_kong_island",
    港島: "hong_kong_island",
    kowloon: "kowloon",
    九龍: "kowloon",
    new_territories: "new_territories",
    nt: "new_territories",
    新界: "new_territories",
  }
  return aliases[normalized] || (HK_ADDRESS_AREAS.some((entry) => entry.value === normalized) ? (normalized as HkAddressArea) : "")
}

function parseDistrict(value: string, region: AddressRegion | ""): string {
  const raw = value.trim()
  if (!raw) return ""
  const normalized = raw.toLowerCase()
  const pools =
    region === "macau"
      ? MACAU_DISTRICTS
      : region === "hong_kong" || !region
        ? HK_DISTRICTS
        : []
  const exact = pools.find((entry) => entry.value === normalized)
  if (exact) return exact.value
  const fuzzy = pools.find(
    (entry) =>
      entry.labelEn.toLowerCase() === normalized ||
      entry.labelZh === raw ||
      raw.includes(entry.labelEn) ||
      raw.includes(entry.labelZh),
  )
  return fuzzy?.value || raw
}

function parsePaymentTerms(value: string): string {
  const normalized = value.trim().toLowerCase()
  const aliases: Record<string, string> = {
    advance: "advance",
    預付: "advance",
    prepaid: "advance",
    "30_days_invoice": "30_days_invoice",
    "30 days invoice": "30_days_invoice",
    "30天": "30_days_invoice",
    發票30天: "30_days_invoice",
    "30_days_eom": "30_days_eom",
    eom: "30_days_eom",
    月底30天: "30_days_eom",
    other: "other",
    其他: "other",
  }
  return aliases[normalized] || (["advance", "30_days_invoice", "30_days_eom", "other"].includes(normalized) ? normalized : value)
}

function setNestedValue(map: Map<string, string>, key: string, value: string) {
  if (value) map.set(key, value)
}

function buildFillRows(): string[][] {
  const rows: string[][] = [
    ["field_key", "Question / 問題", "Your answer / 請填寫", "Hint / 提示"],
  ]
  for (const section of INTAKE_SECTIONS) {
    rows.push(["", section.title, "", ""])
    for (const field of section.fields) {
      rows.push([field.key, field.label, "", field.hint || ""])
    }
  }
  return rows
}

export function generateIntakeTemplateWorkbook(): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()
  const instructions = XLSX.utils.aoa_to_sheet(instructionRows())
  const fillIn = XLSX.utils.aoa_to_sheet(buildFillRows())

  instructions["!cols"] = [{ wch: 28 }, { wch: 48 }]
  fillIn["!cols"] = [{ wch: 28 }, { wch: 52 }, { wch: 36 }, { wch: 34 }]

  XLSX.utils.book_append_sheet(workbook, instructions, INTAKE_INSTRUCTIONS_SHEET)
  XLSX.utils.book_append_sheet(workbook, fillIn, INTAKE_FILL_SHEET)
  return workbook
}

export function intakeTemplateToBuffer(workbook: XLSX.WorkBook = generateIntakeTemplateWorkbook()): Buffer {
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer
}

export function parseIntakeWorkbook(workbook: XLSX.WorkBook): HkNewCustomerIntakeImport {
  const sheet =
    workbook.Sheets[INTAKE_FILL_SHEET] ||
    workbook.Sheets[workbook.SheetNames.find((name) => name.toLowerCase().includes("fill")) || ""]
  if (!sheet) {
    throw new Error("Could not find the \"Fill In\" worksheet.")
  }

  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  })

  const values = new Map<string, string>()
  for (const row of rows.slice(1)) {
    const key = normalizeCell(row[0])
    const value = normalizeCell(row[2])
    if (!key || key === "field_key") continue
    setNestedValue(values, key, value)
  }

  const warnings: string[] = []
  let importedFieldCount = 0
  const countImport = (value: string) => {
    if (value) importedFieldCount += 1
  }

  const registeredRegion = parseRegion(values.get("registeredAddress.region") || "")
  const deliveryRegion = parseRegion(values.get("deliveryAddress.region") || "")

  const registeredAddressDetail: StructuredAddress = {
    ...emptyStructuredAddress(),
    region: registeredRegion || "hong_kong",
    area: parseArea(values.get("registeredAddress.area") || "") || undefined,
    district: parseDistrict(values.get("registeredAddress.district") || "", registeredRegion || "hong_kong"),
    postalCode: values.get("registeredAddress.postalCode") || "",
    addressEn: values.get("registeredAddress.addressEn") || "",
    addressZh: values.get("registeredAddress.addressZh") || "",
  }

  const deliveryAddressDetail: StructuredAddress = {
    ...emptyStructuredAddress(),
    region: deliveryRegion || "hong_kong",
    area: parseArea(values.get("deliveryAddress.area") || "") || undefined,
    district: parseDistrict(values.get("deliveryAddress.district") || "", deliveryRegion || "hong_kong"),
    postalCode: values.get("deliveryAddress.postalCode") || "",
    addressEn: values.get("deliveryAddress.addressEn") || "",
    addressZh: values.get("deliveryAddress.addressZh") || "",
  }

  const buildContact = (index: 1 | 2 | 3): ContactEntry => ({
    ...emptyContactName(),
    nameEnFirst: values.get(`contact${index}.nameEnFirst`) || "",
    nameEnMiddle: values.get(`contact${index}.nameEnMiddle`) || "",
    nameEnLast: values.get(`contact${index}.nameEnLast`) || "",
    nameZh: values.get(`contact${index}.nameZh`) || "",
    title: values.get(`contact${index}.title`) || "",
    email: values.get(`contact${index}.email`) || "",
    phoneCountryCode: values.get(`contact${index}.phoneCountryCode`) || "+852",
    phone: values.get(`contact${index}.phone`) || "",
  })

  const contacts = ([1, 2, 3] as const).map((index) => buildContact(index))
  const apContactNameDetail: ContactNameFields = {
    nameEnFirst: values.get("ap.nameEnFirst") || "",
    nameEnMiddle: values.get("ap.nameEnMiddle") || "",
    nameEnLast: values.get("ap.nameEnLast") || "",
    nameZh: values.get("ap.nameZh") || "",
  }

  const companyNameEn = values.get("companyNameEn") || ""
  const companyNameZh = values.get("companyNameZh") || ""
  const brNumber = extractBrCoreNumber(values.get("brNumber") || "")
  const incorporationDate = values.get("incorporationDate") || ""
  const apEmail = values.get("apEmail") || ""
  const apPhoneCountryCode = values.get("apPhoneCountryCode") || "+852"
  const apPhone = values.get("apPhone") || ""
  const invoiceEmail = parseYesNo(values.get("invoiceDelivery.email") || "")
  const invoicePost = parseYesNo(values.get("invoiceDelivery.post") || "")
  const bankName = values.get("bankName") || ""
  const bankBranchName = values.get("bankBranchName") || ""
  const bankBranchNumber = values.get("bankBranchNumber") || ""
  const accountName = values.get("accountName") || ""
  const accountNumber = values.get("accountNumber") || ""
  const bankCode = values.get("bankCode") || ""
  const paymentTerms = parsePaymentTerms(values.get("paymentTerms") || "")
  const paymentTermsOther = values.get("paymentTermsOther") || ""
  const authorizedSignature = values.get("authorizedSignature") || ""
  const declarationDate = values.get("declarationDate") || ""

  ;[
    companyNameEn,
    companyNameZh,
    brNumber,
    incorporationDate,
    registeredAddressDetail.addressEn,
    registeredAddressDetail.addressZh,
    deliveryAddressDetail.addressEn,
    deliveryAddressDetail.addressZh,
    apEmail,
    apPhone,
    bankName,
    bankBranchName,
    bankBranchNumber,
    accountName,
    accountNumber,
    bankCode,
    paymentTerms,
    paymentTermsOther,
    authorizedSignature,
    declarationDate,
    ...contacts.flatMap((contact) => [
      contact.nameEnFirst,
      contact.nameEnMiddle,
      contact.nameEnLast,
      contact.nameZh,
      contact.title,
      contact.email,
      contact.phone,
    ]),
    apContactNameDetail.nameEnFirst,
    apContactNameDetail.nameEnMiddle,
    apContactNameDetail.nameEnLast,
    apContactNameDetail.nameZh,
  ].forEach(countImport)

  if (invoiceEmail) importedFieldCount += 1
  if (invoicePost) importedFieldCount += 1

  if (!companyNameEn && !brNumber) {
    warnings.push("No company name or BR number found. Check that answers are in column C.")
  }

  return {
    companyNameEn,
    companyNameZh,
    brNumber,
    incorporationDate,
    registeredAddressDetail,
    deliveryAddressDetail,
    contacts,
    apContactNameDetail,
    apEmail,
    apPhoneCountryCode,
    apPhone,
    invoiceEmail,
    invoicePost,
    bankName,
    bankBranchName,
    bankBranchNumber,
    accountName,
    accountNumber,
    bankCode,
    paymentTerms,
    paymentTermsOther,
    authorizedSignature,
    declarationDate,
    importedFieldCount,
    warnings,
  }
}

export function parseIntakeFileBuffer(buffer: ArrayBuffer | Buffer): HkNewCustomerIntakeImport {
  const workbook =
    buffer instanceof ArrayBuffer
      ? XLSX.read(buffer, { type: "array" })
      : XLSX.read(buffer, { type: "buffer" })
  return parseIntakeWorkbook(workbook)
}
