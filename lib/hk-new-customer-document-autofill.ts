import type {
  ContactEntry,
  HkAddressArea,
  Nar1AddressParts,
  Nar1Director,
  Nar1DocumentValidity,
  StructuredAddress,
} from "@/types/hk-new-customer"
import {
  emptyStructuredAddress,
  enrichStructuredAddress,
  inferHkAreaFromText,
  normalizeHkDistrictKey,
  resolveHongKongAddressParts,
} from "@/lib/hk-new-customer-address"

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

function combinedAddressText(parts: Nar1AddressParts): string {
  return [parts.flatFloorBlock, parts.building, parts.street].filter(Boolean).join(" ")
}

function normalizeOcrArea(value: unknown): HkAddressArea | undefined {
  if (value === "hong_kong_island" || value === "kowloon" || value === "new_territories") {
    return value
  }
  if (typeof value !== "string") return undefined
  return inferHkAreaFromText(value)
}

function normalizeOcrDistrictKey(value: unknown): string {
  if (typeof value !== "string") return ""
  return normalizeHkDistrictKey(value)
}

function resolveHkAreaAndDistrict(parts: Nar1AddressParts): { area?: HkAddressArea; district: string } {
  const district =
    normalizeOcrDistrictKey(parts.districtKey) || normalizeOcrDistrictKey(parts.district)

  let area = normalizeOcrArea(parts.area)
  const areaHintText = [parts.district, parts.country, combinedAddressText(parts)].filter(Boolean).join(" ")
  if (!area) {
    area = inferHkAreaFromText(areaHintText)
  }

  return resolveHongKongAddressParts({
    area,
    district,
    addressEn: combinedAddressText(parts),
    addressZh: "",
  })
}

function formatAddressEn(parts: Nar1AddressParts): string {
  return [parts.flatFloorBlock, parts.building, parts.street].filter(Boolean).join(", ")
}

export function enrichStructuredAddressFromText(address: StructuredAddress): StructuredAddress {
  return enrichStructuredAddress(address)
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

  return enrichStructuredAddressFromText({
    ...emptyStructuredAddress(),
    region,
    area,
    district,
    addressEn: formatAddressEn(parts),
    addressZh: "",
  })
}

export function mergeRegisteredAddressAutofill(
  current: StructuredAddress,
  fromDoc: StructuredAddress,
): StructuredAddress {
  const merged = isStructuredAddressEmpty(current)
    ? fromDoc
    : {
        ...current,
        region: current.region || fromDoc.region,
        area: current.area || fromDoc.area,
        district: current.district || fromDoc.district,
        addressEn: current.addressEn.trim() || fromDoc.addressEn,
        addressZh: current.addressZh.trim() || fromDoc.addressZh,
      }

  return enrichStructuredAddressFromText(merged)
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
