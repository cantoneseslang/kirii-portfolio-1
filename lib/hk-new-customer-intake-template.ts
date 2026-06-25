import * as XLSX from "xlsx"
import type { AddressRegion, HkAddressArea, StructuredAddress } from "@/types/hk-new-customer"
import {
  ADDRESS_REGIONS,
  HK_ADDRESS_AREAS,
  HK_DISTRICTS,
  MACAU_DISTRICTS,
  emptyStructuredAddress,
} from "@/lib/hk-new-customer-address"
import { extractBrCoreNumber } from "@/lib/hk-new-customer-document-validity"

export const INTAKE_TEMPLATE_FILENAME = "KIRII_New_Customer_Part2_Company_Info.xlsx"
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
]

export type HkNewCustomerIntakeImport = {
  companyNameEn: string
  companyNameZh: string
  brNumber: string
  incorporationDate: string
  registeredAddressDetail: StructuredAddress
  deliveryAddressDetail: StructuredAddress
  importedFieldCount: number
  warnings: string[]
}

function instructionRows(): string[][] {
  return [
    ["KIRII New Customer – Part 2 Company Information / 桐井新客戶 Part 2 公司基本資料"],
    [""],
    ["How to use / 使用方法"],
    ["1. Open the sheet \"Fill In\" and enter answers in column C only. / 請在「Fill In」工作表 C 欄填寫。"],
    ["2. Do not change column A (field keys). / 請勿修改 A 欄欄位代碼。"],
    ["3. Part 1 documents (BR, CI, NAR1) are uploaded separately in Portfolio and auto-fill many fields. / Part 1 文件於 Portfolio 另外上載並可自動填入。"],
    ["4. Use this Excel mainly for delivery address and any company details not on the documents. / 此問卷主要用於送貨地址及文件上沒有的公司資料。"],
    ["5. Return this Excel with scanned documents. Sales uploads it to auto-fill Part 2. / 連同掃描文件交回；Sales 上載後自動填入 Part 2。"],
    [""],
    ["Region options / 地區選項"],
    ...ADDRESS_REGIONS.map((entry) => [entry.value, `${entry.labelEn} / ${entry.labelZh}`]),
    [""],
    ["HK Area options / 香港區域"],
    ...HK_ADDRESS_AREAS.map((entry) => [entry.value, `${entry.labelEn} / ${entry.labelZh}`]),
  ]
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return String(value).trim()
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

function setNestedValue(map: Map<string, string>, key: string, value: string) {
  if (value) map.set(key, value)
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

  const companyNameEn = values.get("companyNameEn") || ""
  const companyNameZh = values.get("companyNameZh") || ""
  const brNumber = extractBrCoreNumber(values.get("brNumber") || "")
  const incorporationDate = values.get("incorporationDate") || ""

  ;[
    companyNameEn,
    companyNameZh,
    brNumber,
    incorporationDate,
    registeredAddressDetail.region,
    registeredAddressDetail.area,
    registeredAddressDetail.district,
    registeredAddressDetail.postalCode,
    registeredAddressDetail.addressEn,
    registeredAddressDetail.addressZh,
    deliveryAddressDetail.region,
    deliveryAddressDetail.area,
    deliveryAddressDetail.district,
    deliveryAddressDetail.postalCode,
    deliveryAddressDetail.addressEn,
    deliveryAddressDetail.addressZh,
  ].forEach(countImport)

  if (!companyNameEn && !brNumber && !deliveryAddressDetail.addressEn && !deliveryAddressDetail.addressZh) {
    warnings.push("No Part 2 answers found. Check that answers are in column C.")
  }

  return {
    companyNameEn,
    companyNameZh,
    brNumber,
    incorporationDate,
    registeredAddressDetail,
    deliveryAddressDetail,
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
