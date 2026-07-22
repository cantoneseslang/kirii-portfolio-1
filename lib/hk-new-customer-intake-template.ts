import * as XLSX from "xlsx"
import ExcelJS from "exceljs"
import type {
  AddressRegion,
  ContactEntry,
  HkAddressArea,
  Nar1Director,
  Nar1DocumentValidity,
  StructuredAddress,
} from "@/types/hk-new-customer"
import {
  ADDRESS_REGIONS,
  HK_ADDRESS_AREAS,
  HK_DISTRICTS,
  MACAU_DISTRICTS,
  emptyStructuredAddress,
} from "@/lib/hk-new-customer-address"
import { extractBrCoreNumber } from "@/lib/hk-new-customer-document-validity"
import { buildHongKongCustomerRequestInstructionsBody } from "@/lib/hk-new-customer-customer-request-email"
import fs from "fs/promises"
import path from "path"

export const INTAKE_TEMPLATE_FILENAME = "KIRII_New_Customer_Parts2-4_Questionnaire.xlsx"
export const INTAKE_TEMPLATE_PUBLIC_URL = `/templates/${INTAKE_TEMPLATE_FILENAME}`
export const INTAKE_FILL_SHEET = "Fill In"
export const INTAKE_INSTRUCTIONS_SHEET = "Instructions"
export const INTAKE_LISTS_SHEET = "Lists"
export const INTAKE_CONTACT_COUNT = 3
export const INTAKE_NAR1_DIRECTOR_COUNT = 3

const HK_DISTRICT_SELECT_HINT = "Use dropdown in column C / 請用 C 欄下拉選單"

const DISTRICT_SELECT_LABEL_SUFFIX = " (Select from dropdown / 請從下拉選單選擇)"

const FILLED_ANSWER_FILL_COLOR = "FFE2EFDA"

type IntakeFieldDef = {
  key: string
  label: string
  hint?: string
}

type IntakeSection = {
  title: string
  fields: IntakeFieldDef[]
}

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
        hint: "Use dropdown in column C / 請用 C 欄下拉選單",
      },
      {
        key: "registeredAddress.area",
        label: "Area (HK only) / 區域（香港）",
        hint: "Use dropdown in column C / 請用 C 欄下拉選單",
      },
      {
        key: "registeredAddress.district",
        label: `District / 分區${DISTRICT_SELECT_LABEL_SUFFIX}`,
        hint: HK_DISTRICT_SELECT_HINT,
      },
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
        hint: "Use dropdown in column C / 請用 C 欄下拉選單",
      },
      {
        key: "deliveryAddress.area",
        label: "Area (HK only) / 區域（香港）",
        hint: "Use dropdown in column C / 請用 C 欄下拉選單",
      },
      {
        key: "deliveryAddress.district",
        label: `District / 分區${DISTRICT_SELECT_LABEL_SUFFIX}`,
        hint: HK_DISTRICT_SELECT_HINT,
      },
      { key: "deliveryAddress.addressEn", label: "Street & building (English) / 英文地址" },
      { key: "deliveryAddress.addressZh", label: "Street & building (Chinese) / 中文地址" },
    ],
  },
  {
    title: "Annual Return (NAR1) / 周年申報表",
    fields: [
      {
        key: "nar1.madeUpToDate",
        label: "Made Up To Date / 結算日期",
        hint: "YYYY-MM-DD · from NAR1 Section 6 / 表格第6項",
      },
      {
        key: "nar1.shareCapital",
        label: "Share Capital / 股本",
        hint: "e.g. HKD 10,000 · from NAR1 / 表格股本",
      },
      ...Array.from({ length: INTAKE_NAR1_DIRECTOR_COUNT }, (_, index) =>
        directorFieldDefs(index),
      ).flat(),
    ],
  },
  {
    title: "Part 3: Contact Information / 聯絡資料",
    fields: [
      ...Array.from({ length: INTAKE_CONTACT_COUNT }, (_, index) =>
        contactFieldDefs(index, `Contact ${index + 1} / 聯絡人 ${index + 1}`, { includeIdNumber: true }),
      ).flat(),
      ...contactFieldDefs("apContact", "Accounts Payable Contact / 應付賬款聯絡人"),
      { key: "apEmail", label: "A/P Email / 應付賬款電郵" },
      {
        key: "apPhoneCountryCode",
        label: "A/P Phone Country Code / 應付賬款電話區號",
        hint: "e.g. +852",
      },
      { key: "apPhone", label: "A/P Phone / 應付賬款電話" },
      {
        key: "invoiceDelivery.email",
        label: "Invoice via Email / 只經電郵發送賬單",
        hint: "Use dropdown: yes | no / 請用下拉選單",
      },
      {
        key: "invoiceDelivery.post",
        label: "Invoice by Post / 郵寄賬單",
        hint: "Use dropdown: yes | no / 請用下拉選單",
      },
    ],
  },
  {
    title: "Part 4: Bank Account Details / 銀行戶口資料",
    fields: [
      { key: "bankName", label: "Bank Name / 銀行名稱" },
      { key: "bankBranchName", label: "Branch Name / 分店名稱" },
      { key: "bankBranchNumber", label: "Branch No. / 分店號碼", hint: "e.g. 123" },
      {
        key: "accountName",
        label: "Account Name / 戶口名稱",
        hint: "Must match company name / 須與公司名稱一致",
      },
      { key: "accountNumber", label: "Account Number / 戶口號碼" },
      { key: "bankCode", label: "Bank Code / SWIFT Code / 銀行代碼" },
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
  apContactNameDetail: Pick<ContactEntry, "nameEnFirst" | "nameEnMiddle" | "nameEnLast" | "nameZh">
  apEmail: string
  apPhoneCountryCode: string
  apPhone: string
  invoiceEmail: boolean | null
  invoicePost: boolean | null
  bankName: string
  bankBranchName: string
  bankBranchNumber: string
  accountName: string
  accountNumber: string
  bankCode: string
  nar1: Partial<Nar1DocumentValidity>
  importedFieldCount: number
  warnings: string[]
}

function directorFieldDefs(index: number): IntakeFieldDef[] {
  const prefix = `nar1.directors.${index}`
  const labelPrefix = `Director ${index + 1} / 董事 ${index + 1}`
  return [
    {
      key: `${prefix}.nameEn`,
      label: `${labelPrefix} - Name (English) / 英文姓名 *`,
      hint: "NAR1 Section 13 / 表格第13項",
    },
    { key: `${prefix}.nameZh`, label: `${labelPrefix} - Name (Chinese) / 中文姓名` },
    {
      key: `${prefix}.flatFloorBlock`,
      label: `${labelPrefix} - Flat/Floor/Block / 室／樓／座等 *`,
      hint: "Correspondence address / 通訊地址",
    },
    { key: `${prefix}.building`, label: `${labelPrefix} - Building / 大廈 *` },
    { key: `${prefix}.street`, label: `${labelPrefix} - Street / 街道 *` },
    {
      key: `${prefix}.district`,
      label: `${labelPrefix} - District / 區 *${DISTRICT_SELECT_LABEL_SUFFIX}`,
      hint: HK_DISTRICT_SELECT_HINT,
    },
    {
      key: `${prefix}.country`,
      label: `${labelPrefix} - Country/Region / 國家／地區 *`,
      hint: "e.g. Hong Kong",
    },
  ]
}

function contactFieldDefs(
  indexOrPrefix: number | string,
  labelPrefix: string,
  options?: { includeIdNumber?: boolean },
): IntakeFieldDef[] {
  const prefix = typeof indexOrPrefix === "number" ? `contacts.${indexOrPrefix}` : indexOrPrefix
  const fields: IntakeFieldDef[] = [
    {
      key: `${prefix}.nameEnFirst`,
      label: `${labelPrefix} - Given Name (English) / 英文名 *`,
    },
    {
      key: `${prefix}.nameEnMiddle`,
      label: `${labelPrefix} - Middle Name (English) / 英文中間名`,
    },
    {
      key: `${prefix}.nameEnLast`,
      label: `${labelPrefix} - Surname (English) / 英文姓氏 *`,
    },
    {
      key: `${prefix}.nameZh`,
      label: `${labelPrefix} - Full Name (Chinese) / 中文姓名全名 *`,
    },
  ]
  if (options?.includeIdNumber) {
    fields.push({
      key: `${prefix}.idNumber`,
      label: `${labelPrefix} - ID Number / 身分證號碼`,
      hint: "As shown on ID copy / 與身分證副本一致",
    })
  }
  fields.push(
    { key: `${prefix}.title`, label: `${labelPrefix} - Title / 職位` },
    { key: `${prefix}.email`, label: `${labelPrefix} - Email / 電郵` },
    {
      key: `${prefix}.phoneCountryCode`,
      label: `${labelPrefix} - Phone Country Code / 電話區號`,
      hint: "e.g. +852",
    },
    { key: `${prefix}.phone`, label: `${labelPrefix} - Phone / 電話` },
  )
  return fields
}

function instructionRows(): string[][] {
  return buildHongKongCustomerRequestInstructionsBody()
    .split("\n")
    .map((line) => [line])
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return String(value).trim()
}

function parseRegion(value: string): AddressRegion | "" {
  const raw = value.trim()
  if (!raw) return ""
  const labelMatch = ADDRESS_REGIONS.find(
    (entry) =>
      raw === `${entry.labelEn} / ${entry.labelZh}` ||
      raw === entry.labelEn ||
      raw === entry.labelZh,
  )
  if (labelMatch) return labelMatch.value
  const normalized = raw.toLowerCase().replace(/\s+/g, "_")
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
  const raw = value.trim()
  if (!raw) return ""
  const labelMatch = HK_ADDRESS_AREAS.find(
    (entry) =>
      raw === `${entry.labelEn} / ${entry.labelZh}` ||
      raw === entry.labelEn ||
      raw === entry.labelZh,
  )
  if (labelMatch) return labelMatch.value
  const normalized = raw.toLowerCase().replace(/\s+/g, "_")
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

function formatHkDistrictLabel(value: string): string {
  const parsed = parseDistrict(value, "hong_kong")
  if (!parsed) return value.trim()
  const match = HK_DISTRICTS.find((entry) => entry.value === parsed)
  if (match) return `${match.labelEn} / ${match.labelZh}`
  return value.trim()
}

function parseDirectorDistrict(value: string): string {
  return formatHkDistrictLabel(value)
}

function setNestedValue(map: Map<string, string>, key: string, value: string) {
  if (value) map.set(key, value)
}

function parseYesNo(value: string): boolean | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (["yes", "y", "true", "1", "是", "✓", "x"].includes(normalized)) return true
  if (["no", "n", "false", "0", "否"].includes(normalized)) return false
  return null
}

function normalizePhoneCountryCode(value: string): string {
  const raw = value.trim()
  if (!raw) return ""
  return raw.startsWith("+") ? raw : `+${raw}`
}

function parseContactFromValues(values: Map<string, string>, prefix: string): ContactEntry {
  return {
    nameEnFirst: values.get(`${prefix}.nameEnFirst`) || "",
    nameEnMiddle: values.get(`${prefix}.nameEnMiddle`) || "",
    nameEnLast: values.get(`${prefix}.nameEnLast`) || "",
    nameZh: values.get(`${prefix}.nameZh`) || "",
    title: values.get(`${prefix}.title`) || "",
    email: values.get(`${prefix}.email`) || "",
    phoneCountryCode: normalizePhoneCountryCode(values.get(`${prefix}.phoneCountryCode`) || "") || "+852",
    phone: values.get(`${prefix}.phone`) || "",
    idNumber: values.get(`${prefix}.idNumber`) || "",
  }
}

function contactHasValues(contact: ContactEntry): boolean {
  return Boolean(
    contact.nameEnFirst ||
      contact.nameEnMiddle ||
      contact.nameEnLast ||
      contact.nameZh ||
      contact.title ||
      contact.email ||
      contact.phone ||
      contact.idNumber,
  )
}

function parseDirectorFromValues(values: Map<string, string>, index: number): Nar1Director {
  const prefix = `nar1.directors.${index}`
  return {
    nameEn: values.get(`${prefix}.nameEn`) || "",
    nameZh: values.get(`${prefix}.nameZh`) || "",
    flatFloorBlock: values.get(`${prefix}.flatFloorBlock`) || "",
    building: values.get(`${prefix}.building`) || "",
    street: values.get(`${prefix}.street`) || "",
    district: parseDirectorDistrict(values.get(`${prefix}.district`) || ""),
    country: values.get(`${prefix}.country`) || "",
  }
}

function directorHasValues(director: Nar1Director): boolean {
  return Boolean(
    director.nameEn ||
      director.nameZh ||
      director.flatFloorBlock ||
      director.building ||
      director.street ||
      director.district ||
      director.country,
  )
}

export function mergeNar1Import(
  current: Nar1DocumentValidity,
  incoming: Partial<Nar1DocumentValidity>,
): Nar1DocumentValidity {
  const incomingDirectors = incoming.directors?.filter(directorHasValues) || []
  return {
    madeUpToDate: incoming.madeUpToDate || current.madeUpToDate,
    businessRegistrationNumber:
      extractBrCoreNumber(incoming.businessRegistrationNumber || "") ||
      current.businessRegistrationNumber,
    companyNameEn: incoming.companyNameEn || current.companyNameEn,
    companyNameZh: incoming.companyNameZh || current.companyNameZh,
    shareCapital: incoming.shareCapital || current.shareCapital,
    registeredOffice: incoming.registeredOffice || current.registeredOffice,
    directors: incomingDirectors.length > 0 ? incomingDirectors : current.directors,
  }
}

export function mergeContactImport(current: ContactEntry, incoming: ContactEntry): ContactEntry {
  return {
    nameEnFirst: incoming.nameEnFirst || current.nameEnFirst,
    nameEnMiddle: incoming.nameEnMiddle || current.nameEnMiddle,
    nameEnLast: incoming.nameEnLast || current.nameEnLast,
    nameZh: incoming.nameZh || current.nameZh,
    title: incoming.title || current.title,
    email: incoming.email || current.email,
    phoneCountryCode: incoming.phoneCountryCode || current.phoneCountryCode,
    phone: incoming.phone || current.phone,
    idNumber: incoming.idNumber || current.idNumber,
  }
}

export function mergeAddressImport(
  current: StructuredAddress,
  incoming: StructuredAddress,
): StructuredAddress {
  return {
    region: incoming.region || current.region,
    area: incoming.area || current.area,
    district: incoming.district || current.district,
    postalCode: incoming.postalCode || current.postalCode,
    addressEn: incoming.addressEn || current.addressEn,
    addressZh: incoming.addressZh || current.addressZh,
  }
}

function formatRegionLabel(entry: (typeof ADDRESS_REGIONS)[number]): string {
  return `${entry.labelEn} / ${entry.labelZh}`
}

function formatAreaLabel(entry: (typeof HK_ADDRESS_AREAS)[number]): string {
  return `${entry.labelEn} / ${entry.labelZh}`
}

function formatDistrictLabel(entry: (typeof HK_DISTRICTS)[number]): string {
  return `${entry.labelEn} / ${entry.labelZh}`
}

function listRange(column: string, count: number): string {
  return `'${INTAKE_LISTS_SHEET}'!$${column}$2:$${column}$${count + 1}`
}

function resolveListRange(fieldKey: string): string | null {
  if (fieldKey.endsWith(".region")) return listRange("B", ADDRESS_REGIONS.length)
  if (fieldKey.endsWith(".area")) return listRange("C", HK_ADDRESS_AREAS.length)
  if (fieldKey.endsWith(".district")) return listRange("A", HK_DISTRICTS.length)
  if (fieldKey === "invoiceDelivery.email" || fieldKey === "invoiceDelivery.post") {
    return listRange("D", 2)
  }
  return null
}

function applyDropdownValidation(cell: ExcelJS.Cell, fieldKey: string) {
  const listFormula = resolveListRange(fieldKey)
  if (!listFormula) return
  cell.dataValidation = {
    type: "list",
    allowBlank: true,
    formulae: [listFormula],
    showErrorMessage: true,
    errorTitle: "Invalid selection / 選項無效",
    error: "Please select a value from the dropdown. / 請從下拉選單選擇。",
  }
}

function populateListsSheet(sheet: ExcelJS.Worksheet) {
  sheet.getCell("A1").value = "HK District / 香港分區"
  sheet.getCell("B1").value = "Region / 地區"
  sheet.getCell("C1").value = "HK Area / 香港區域"
  sheet.getCell("D1").value = "Yes / No"

  HK_DISTRICTS.forEach((entry, index) => {
    sheet.getCell(`A${index + 2}`).value = formatDistrictLabel(entry)
  })
  ADDRESS_REGIONS.forEach((entry, index) => {
    sheet.getCell(`B${index + 2}`).value = formatRegionLabel(entry)
  })
  HK_ADDRESS_AREAS.forEach((entry, index) => {
    sheet.getCell(`C${index + 2}`).value = formatAreaLabel(entry)
  })
  sheet.getCell("D2").value = "yes"
  sheet.getCell("D3").value = "no"

  sheet.state = "veryHidden"
}

function populateInstructionsSheet(sheet: ExcelJS.Worksheet) {
  instructionRows().forEach((row, index) => {
    sheet.getRow(index + 1).values = row
  })
  sheet.getColumn(1).width = 110
}

function applyFilledAnswerFormatting(sheet: ExcelJS.Worksheet, lastRow: number) {
  if (lastRow < 2) return
  sheet.addConditionalFormatting({
    ref: `C2:C${lastRow}`,
    rules: [
      {
        type: "expression",
        priority: 1,
        formulae: ["LEN(TRIM(C2))>0"],
        style: {
          fill: {
            type: "pattern",
            pattern: "solid",
            bgColor: { argb: FILLED_ANSWER_FILL_COLOR },
          },
        },
      },
    ],
  })
}

function populateFillInSheet(sheet: ExcelJS.Worksheet) {
  sheet.getColumn(1).width = 28
  sheet.getColumn(2).width = 52
  sheet.getColumn(3).width = 36
  sheet.getColumn(4).width = 48
  sheet.getColumn(1).hidden = true

  let rowNumber = 1
  const headerRow = sheet.getRow(rowNumber++)
  headerRow.values = ["field_key", "Question / 問題", "Your answer / 請填寫", "Hint / 提示"]
  headerRow.font = { bold: true }

  for (const section of INTAKE_SECTIONS) {
    sheet.getRow(rowNumber++).values = ["", section.title, "", ""]
    for (const field of section.fields) {
      const row = sheet.getRow(rowNumber)
      row.values = [field.key, field.label, "", field.hint || ""]
      applyDropdownValidation(sheet.getCell(`C${rowNumber}`), field.key)
      rowNumber += 1
    }
  }

  applyFilledAnswerFormatting(sheet, rowNumber - 1)
}

export async function generateIntakeTemplateWorkbook(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  populateListsSheet(workbook.addWorksheet(INTAKE_LISTS_SHEET))
  populateInstructionsSheet(workbook.addWorksheet(INTAKE_INSTRUCTIONS_SHEET))
  populateFillInSheet(workbook.addWorksheet(INTAKE_FILL_SHEET))
  return workbook
}

export async function intakeTemplateToBuffer(workbook?: ExcelJS.Workbook): Promise<Buffer> {
  const resolvedWorkbook = workbook ?? (await generateIntakeTemplateWorkbook())
  const arrayBuffer = await resolvedWorkbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

export function getIntakeTemplateFilePath(): string {
  return path.join(process.cwd(), "public/templates", INTAKE_TEMPLATE_FILENAME)
}

/** Serves the curated template in public/templates; falls back to generated workbook. */
export async function readIntakeTemplateBuffer(): Promise<Buffer> {
  try {
    return await fs.readFile(getIntakeTemplateFilePath())
  } catch {
    return intakeTemplateToBuffer()
  }
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

  const companyNameEn = values.get("companyNameEn") || ""
  const companyNameZh = values.get("companyNameZh") || ""
  const brNumber = extractBrCoreNumber(values.get("brNumber") || "")
  const incorporationDate = values.get("incorporationDate") || ""

  const contacts = Array.from({ length: INTAKE_CONTACT_COUNT }, (_, index) =>
    parseContactFromValues(values, `contacts.${index}`),
  )

  const apContactNameDetail = {
    nameEnFirst: values.get("apContact.nameEnFirst") || "",
    nameEnMiddle: values.get("apContact.nameEnMiddle") || "",
    nameEnLast: values.get("apContact.nameEnLast") || "",
    nameZh: values.get("apContact.nameZh") || "",
  }
  const apEmail = values.get("apEmail") || ""
  const apPhoneCountryCode = normalizePhoneCountryCode(values.get("apPhoneCountryCode") || "")
  const apPhone = values.get("apPhone") || ""
  const invoiceEmail = parseYesNo(values.get("invoiceDelivery.email") || "")
  const invoicePost = parseYesNo(values.get("invoiceDelivery.post") || "")

  const bankName = values.get("bankName") || ""
  const bankBranchName = values.get("bankBranchName") || ""
  const bankBranchNumber = values.get("bankBranchNumber") || ""
  const accountName = values.get("accountName") || ""
  const accountNumber = values.get("accountNumber") || ""
  const bankCode = values.get("bankCode") || ""

  const nar1Directors = Array.from({ length: INTAKE_NAR1_DIRECTOR_COUNT }, (_, index) =>
    parseDirectorFromValues(values, index),
  ).filter(directorHasValues)

  const nar1: Partial<Nar1DocumentValidity> = {
    madeUpToDate: values.get("nar1.madeUpToDate") || "",
    shareCapital: values.get("nar1.shareCapital") || "",
    businessRegistrationNumber: extractBrCoreNumber(
      values.get("nar1.businessRegistrationNumber") || brNumber || "",
    ),
    companyNameEn: values.get("nar1.companyNameEn") || companyNameEn || "",
    companyNameZh: values.get("nar1.companyNameZh") || companyNameZh || "",
    directors: nar1Directors,
  }

  ;[
    companyNameEn,
    companyNameZh,
    brNumber,
    incorporationDate,
    registeredAddressDetail.region,
    registeredAddressDetail.area,
    registeredAddressDetail.district,
    registeredAddressDetail.addressEn,
    registeredAddressDetail.addressZh,
    deliveryAddressDetail.region,
    deliveryAddressDetail.area,
    deliveryAddressDetail.district,
    deliveryAddressDetail.addressEn,
    deliveryAddressDetail.addressZh,
    ...contacts.flatMap((contact) => [
      contact.nameEnFirst,
      contact.nameEnMiddle,
      contact.nameEnLast,
      contact.nameZh,
      contact.title,
      contact.email,
      contact.idNumber,
      contact.phoneCountryCode === "+852" ? "" : contact.phoneCountryCode,
      contact.phone,
    ]),
    apContactNameDetail.nameEnFirst,
    apContactNameDetail.nameEnMiddle,
    apContactNameDetail.nameEnLast,
    apContactNameDetail.nameZh,
    apEmail,
    apPhoneCountryCode,
    apPhone,
    invoiceEmail === null ? "" : "set",
    invoicePost === null ? "" : "set",
    bankName,
    bankBranchName,
    bankBranchNumber,
    accountName,
    accountNumber,
    bankCode,
    nar1.madeUpToDate,
    nar1.shareCapital,
    ...nar1Directors.flatMap((director) => [
      director.nameEn,
      director.nameZh,
      director.flatFloorBlock,
      director.building,
      director.street,
      director.district,
      director.country,
    ]),
  ].forEach(countImport)

  const hasAnyAnswer =
    importedFieldCount > 0 ||
    contacts.some(contactHasValues) ||
    nar1Directors.length > 0 ||
    Object.values(apContactNameDetail).some(Boolean) ||
    Boolean(apEmail || apPhone || bankName || accountNumber)

  if (!hasAnyAnswer) {
    warnings.push("No answers found in Parts 2–4. Check that answers are in column C.")
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
    nar1,
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
