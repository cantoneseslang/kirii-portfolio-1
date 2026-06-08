import type { AddressRegion, HkAddressArea, StructuredAddress } from "@/types/hk-new-customer"

export const ADDRESS_REGIONS: {
  value: AddressRegion
  labelEn: string
  labelZh: string
}[] = [
  { value: "hong_kong", labelEn: "Hong Kong", labelZh: "香港" },
  { value: "macau", labelEn: "Macau", labelZh: "澳門" },
  { value: "china", labelEn: "China", labelZh: "中國" },
  { value: "overseas", labelEn: "Overseas", labelZh: "海外" },
]

export const HK_ADDRESS_AREAS: {
  value: HkAddressArea
  labelEn: string
  labelZh: string
}[] = [
  { value: "hong_kong_island", labelEn: "Hong Kong Island", labelZh: "港島" },
  { value: "kowloon", labelEn: "Kowloon", labelZh: "九龍" },
  { value: "new_territories", labelEn: "New Territories", labelZh: "新界" },
]

export function emptyStructuredAddress(): StructuredAddress {
  return {
    region: "hong_kong",
    area: undefined,
    district: "",
    postalCode: "",
    addressEn: "",
    addressZh: "",
  }
}

export function normalizeStructuredAddress(value: unknown): StructuredAddress | undefined {
  if (!value || typeof value !== "object") return undefined
  const raw = value as Partial<StructuredAddress>
  const region = raw.region
  if (
    region !== "hong_kong" &&
    region !== "macau" &&
    region !== "china" &&
    region !== "overseas"
  ) {
    return undefined
  }

  const area =
    raw.area === "hong_kong_island" || raw.area === "kowloon" || raw.area === "new_territories"
      ? raw.area
      : undefined

  return {
    region,
    area: region === "hong_kong" ? area : undefined,
    district: String(raw.district || "").trim(),
    postalCode: region === "china" ? String(raw.postalCode || "").trim() : "",
    addressEn: String(raw.addressEn || "").trim(),
    addressZh: region === "overseas" ? "" : String(raw.addressZh || "").trim(),
  }
}

export function getRegionLabel(region: AddressRegion): string {
  const item = ADDRESS_REGIONS.find((entry) => entry.value === region)
  return item ? `${item.labelEn} / ${item.labelZh}` : region
}

export function getAreaLabel(area?: HkAddressArea): string {
  if (!area) return ""
  const item = HK_ADDRESS_AREAS.find((entry) => entry.value === area)
  return item ? `${item.labelEn} / ${item.labelZh}` : area
}

export function formatStructuredAddress(address?: StructuredAddress): string {
  if (!address) return ""

  const parts: string[] = [getRegionLabel(address.region)]

  if (address.region === "hong_kong" && address.area) {
    parts.push(getAreaLabel(address.area))
  }

  if (address.district) {
    parts.push(address.district)
  }

  if (address.region === "china" && address.postalCode) {
    parts.push(`Postal Code / 郵編: ${address.postalCode}`)
  }

  const prefix = `[${parts.join(" | ")}]`
  if (address.region === "overseas") {
    return `${prefix} ${address.addressEn}`.trim()
  }

  const en = address.addressEn.trim()
  const zh = address.addressZh.trim()
  if (en && zh) return `${prefix} ${en} / ${zh}`
  if (en) return `${prefix} ${en}`
  if (zh) return `${prefix} ${zh}`
  return prefix
}

export function resolveStructuredAddress(
  detail?: StructuredAddress,
  legacyText?: string,
): StructuredAddress {
  if (detail) return detail
  if (legacyText?.trim()) {
    return {
      ...emptyStructuredAddress(),
      addressEn: legacyText.trim(),
    }
  }
  return emptyStructuredAddress()
}
