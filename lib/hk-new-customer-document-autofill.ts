import type {
  ContactEntry,
  HkAddressArea,
  Nar1AddressParts,
  Nar1Director,
  Nar1DocumentValidity,
  StructuredAddress,
} from "@/types/hk-new-customer"
import { emptyStructuredAddress, HK_DISTRICTS } from "@/lib/hk-new-customer-address"

export function fillIfEmpty(current: string, next?: string): string {
  if (current.trim()) return current
  return next?.trim() || current
}

export function isStructuredAddressEmpty(address: StructuredAddress): boolean {
  return (
    !address.addressEn.trim() &&
    !address.addressZh.trim() &&
    !address.district.trim() &&
    !address.area
  )
}

export function isContactNameEmpty(contact: Pick<ContactEntry, "nameEnFirst" | "nameEnMiddle" | "nameEnLast" | "nameZh">): boolean {
  return (
    !contact.nameEnFirst.trim() &&
    !contact.nameEnMiddle.trim() &&
    !contact.nameEnLast.trim() &&
    !contact.nameZh.trim()
  )
}

const HK_LOCALITY_HINTS: Array<{
  pattern: RegExp
  area: HkAddressArea
  district: string
}> = [
  { pattern: /\bPAN\s*CHUNG\b|畔涌/u, area: "new_territories", district: "sai_kung" },
  { pattern: /\bTSEUNG\s*KWAN\s*O\b|將軍澳/u, area: "new_territories", district: "sai_kung" },
  { pattern: /\bCLEAR\s*WATER\s*BAY\b|清水灣/u, area: "new_territories", district: "sai_kung" },
  { pattern: /\bSHATIN\b|\bSHA\s*TIN\b|沙田/u, area: "new_territories", district: "sha_tin" },
  { pattern: /\bTAI\s*PO\b|大埔/u, area: "new_territories", district: "tai_po" },
  { pattern: /\bTUEN\s*MUN\b|屯門/u, area: "new_territories", district: "tuen_mun" },
  { pattern: /\bYUEN\s*LONG\b|元朗/u, area: "new_territories", district: "yuen_long" },
  { pattern: /\bTSUEN\s*WAN\b|荃灣/u, area: "new_territories", district: "tsuen_wan" },
  { pattern: /\bKWUN\s*TONG\b|觀塘/u, area: "kowloon", district: "kwun_tong" },
  { pattern: /\bMONG\s*KOK\b|旺角/u, area: "kowloon", district: "yau_tsim_mong" },
  { pattern: /\bTSIM\s*SHA\s*TSUI\b|尖沙咀/u, area: "kowloon", district: "yau_tsim_mong" },
  { pattern: /\bCENTRAL\b|中環/u, area: "hong_kong_island", district: "central_and_western" },
  { pattern: /\bWAN\s*CHAI\b|灣仔/u, area: "hong_kong_island", district: "wan_chai" },
]

function combinedAddressText(parts: Nar1AddressParts): string {
  return [parts.flatFloorBlock, parts.building, parts.street, parts.district, parts.country]
    .filter(Boolean)
    .join(" ")
}

function inferHkArea(text: string): HkAddressArea | undefined {
  const upper = text.toUpperCase()
  if (upper.includes("KOWLOON") || upper.includes("九龍")) return "kowloon"
  if (upper.includes("NEW TERRITOR") || upper.includes("新界") || /\bNT\b/.test(upper)) {
    return "new_territories"
  }
  if (
    upper.includes("HONG KONG ISLAND") ||
    upper.includes("港島") ||
    (upper.includes("HONG KONG") && !upper.includes("KOWLOON"))
  ) {
    return "hong_kong_island"
  }
  return undefined
}

function matchHkDistrictInText(
  text: string,
  area?: HkAddressArea,
): { district: string; area: HkAddressArea } | null {
  const upper = text.toUpperCase()
  const candidates = [...HK_DISTRICTS].sort((a, b) => b.labelEn.length - a.labelEn.length)

  for (const entry of candidates) {
    if (area && entry.area !== area) continue
    const labelUpper = entry.labelEn.toUpperCase()
    const zhCore = entry.labelZh.replace(/區$/u, "")
    if (
      upper.includes(labelUpper) ||
      (zhCore && text.includes(zhCore)) ||
      text.includes(entry.labelZh)
    ) {
      return { district: entry.value, area: entry.area }
    }
  }

  return null
}

function matchLocalityHint(text: string): { area: HkAddressArea; district: string } | null {
  for (const hint of HK_LOCALITY_HINTS) {
    if (hint.pattern.test(text)) {
      return { area: hint.area, district: hint.district }
    }
  }
  return null
}

function normalizeOcrArea(value: unknown): HkAddressArea | undefined {
  if (value === "hong_kong_island" || value === "kowloon" || value === "new_territories") {
    return value
  }
  if (typeof value !== "string") return undefined
  const upper = value.trim().toUpperCase()
  if (upper.includes("KOWLOON") || upper.includes("九龍")) return "kowloon"
  if (upper.includes("NEW TERRITOR") || upper.includes("新界")) return "new_territories"
  if (upper.includes("HONG KONG ISLAND") || upper.includes("港島")) return "hong_kong_island"
  return undefined
}

function normalizeOcrDistrictKey(value: unknown): string {
  if (typeof value !== "string") return ""
  const trimmed = value.trim()
  if (HK_DISTRICTS.some((entry) => entry.value === trimmed)) return trimmed
  const match = matchHkDistrictInText(trimmed)
  return match?.district || ""
}

function resolveHkAreaAndDistrict(parts: Nar1AddressParts): { area?: HkAddressArea; district: string } {
  const searchText = combinedAddressText(parts)
  let area = normalizeOcrArea(parts.area)
  let district = normalizeOcrDistrictKey(parts.districtKey)

  if (district && !area) {
    area = HK_DISTRICTS.find((entry) => entry.value === district)?.area
  }

  if (!district) {
    const districtMatch = matchHkDistrictInText(searchText, area)
    if (districtMatch) {
      district = districtMatch.district
      area = area || districtMatch.area
    }
  }

  if (!area) {
    area = inferHkArea(searchText)
  }

  if (!district && area) {
    district = matchHkDistrictInText(searchText, area)?.district || ""
  }

  if (!area || !district) {
    const hint = matchLocalityHint(searchText)
    if (hint) {
      area = area || hint.area
      district = district || hint.district
    }
  }

  return { area, district }
}

function formatAddressEn(parts: Nar1AddressParts): string {
  return [parts.flatFloorBlock, parts.building, parts.street].filter(Boolean).join(", ")
}

export function nar1AddressPartsToStructured(parts: Nar1AddressParts): StructuredAddress {
  const country = parts.country.trim().toUpperCase()
  let region: StructuredAddress["region"] = "hong_kong"

  if (country.includes("MACAU") || country.includes("澳門")) {
    region = "macau"
  } else if (
    country.includes("CHINA") ||
    country.includes("中国") ||
    country.includes("中國") ||
    country.includes("PRC")
  ) {
    region = "china"
  } else if (
    country &&
    !country.includes("HONG KONG") &&
    !country.includes("香港") &&
    !country.includes("HK")
  ) {
    region = "overseas"
  }

  const { area, district } = region === "hong_kong" ? resolveHkAreaAndDistrict(parts) : { area: undefined, district: "" }

  return {
    ...emptyStructuredAddress(),
    region,
    area,
    district,
    addressEn: formatAddressEn(parts),
    addressZh: "",
  }
}

export function mergeRegisteredAddressAutofill(
  current: StructuredAddress,
  fromDoc: StructuredAddress,
): StructuredAddress {
  if (isStructuredAddressEmpty(current)) return fromDoc

  return {
    ...current,
    region: current.region || fromDoc.region,
    area: current.area || fromDoc.area,
    district: current.district || fromDoc.district,
    addressEn: current.addressEn.trim() || fromDoc.addressEn,
    addressZh: current.addressZh.trim() || fromDoc.addressZh,
  }
}

const NO_MIDDLE_NAME_PLACEHOLDER = "NA"

export function parseDirectorEnglishName(director: Nar1Director): {
  nameEnFirst: string
  nameEnMiddle: string
  nameEnLast: string
} {
  const explicitLast = director.nameEnLast?.trim() || ""
  const explicitFirst = director.nameEnFirst?.trim() || ""

  if (explicitLast && explicitFirst) {
    const firstTokens = explicitFirst.split(/\s+/).filter(Boolean)
    if (firstTokens.length >= 2) {
      return {
        nameEnFirst: firstTokens[0],
        nameEnMiddle: firstTokens.slice(1).join(" "),
        nameEnLast: explicitLast,
      }
    }
    return {
      nameEnFirst: explicitFirst,
      nameEnMiddle: NO_MIDDLE_NAME_PLACEHOLDER,
      nameEnLast: explicitLast,
    }
  }

  const tokens = director.nameEn.trim().split(/\s+/).filter(Boolean)
  if (tokens.length >= 2) {
    return {
      nameEnLast: tokens[0],
      nameEnFirst: tokens[1],
      nameEnMiddle: tokens.length > 2 ? tokens.slice(2).join(" ") : NO_MIDDLE_NAME_PLACEHOLDER,
    }
  }

  if (tokens.length === 1) {
    return {
      nameEnLast: tokens[0],
      nameEnFirst: NO_MIDDLE_NAME_PLACEHOLDER,
      nameEnMiddle: NO_MIDDLE_NAME_PLACEHOLDER,
    }
  }

  return {
    nameEnFirst: "",
    nameEnMiddle: "",
    nameEnLast: "",
  }
}

export function directorToContactPartial(director: Nar1Director): Partial<ContactEntry> {
  const { nameEnFirst, nameEnMiddle, nameEnLast } = parseDirectorEnglishName(director)
  return {
    nameEnFirst,
    nameEnMiddle,
    nameEnLast,
    nameZh: director.nameZh?.trim() || "",
    title: "Director / 董事",
  }
}

export function mergeDirectorsIntoContacts(
  contacts: ContactEntry[],
  directors: Nar1Director[],
  emptyContact: ContactEntry,
): ContactEntry[] {
  if (directors.length === 0) return contacts

  const next = contacts.map((contact) => ({ ...contact }))
  while (next.length < Math.max(3, directors.length)) {
    next.push({ ...emptyContact })
  }

  directors.forEach((director, index) => {
    if (!isContactNameEmpty(next[index])) return
    next[index] = { ...next[index], ...directorToContactPartial(director) }
  })

  return next
}

export function pickRegisteredAddressFromNar1(validity: Nar1DocumentValidity): StructuredAddress | null {
  if (validity.registeredOffice) {
    const fromOffice = nar1AddressPartsToStructured(validity.registeredOffice)
    if (fromOffice.addressEn.trim() || fromOffice.area) return fromOffice
  }

  const firstDirectorWithAddress = validity.directors.find(
    (director) =>
      director.flatFloorBlock.trim() ||
      director.building.trim() ||
      director.street.trim(),
  )
  if (!firstDirectorWithAddress) return null
  return nar1AddressPartsToStructured(firstDirectorWithAddress)
}
