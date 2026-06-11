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

function inferHkArea(districtText: string): HkAddressArea | undefined {
  const upper = districtText.toUpperCase()
  if (upper.includes("KOWLOON") || upper.includes("九龍")) return "kowloon"
  if (upper.includes("NEW TERRITOR") || upper.includes("新界")) return "new_territories"
  if (
    upper.includes("HONG KONG ISLAND") ||
    upper.includes("港島") ||
    (upper.includes("HONG KONG") && !upper.includes("KOWLOON"))
  ) {
    return "hong_kong_island"
  }
  return undefined
}

function matchHkDistrict(districtText: string, area?: HkAddressArea): string {
  const upper = districtText.toUpperCase()
  for (const entry of HK_DISTRICTS) {
    if (area && entry.area !== area) continue
    const labelUpper = entry.labelEn.toUpperCase()
    if (upper.includes(labelUpper) || labelUpper.includes(upper)) {
      return entry.value
    }
  }
  return ""
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

  const area = region === "hong_kong" ? inferHkArea(parts.district) : undefined
  const district =
    region === "hong_kong" ? matchHkDistrict(parts.district, area) || matchHkDistrict(parts.street, area) : ""

  return {
    ...emptyStructuredAddress(),
    region,
    area,
    district,
    addressEn: formatAddressEn(parts),
    addressZh: "",
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
    if (fromOffice.addressEn.trim()) return fromOffice
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
