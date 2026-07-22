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

export const HK_DISTRICTS: {
  value: string
  area: HkAddressArea
  labelEn: string
  labelZh: string
}[] = [
  { value: "central_and_western", area: "hong_kong_island", labelEn: "Central and Western", labelZh: "中西區" },
  { value: "wan_chai", area: "hong_kong_island", labelEn: "Wan Chai", labelZh: "灣仔區" },
  { value: "eastern", area: "hong_kong_island", labelEn: "Eastern", labelZh: "東區" },
  { value: "southern", area: "hong_kong_island", labelEn: "Southern", labelZh: "南區" },
  { value: "yau_tsim_mong", area: "kowloon", labelEn: "Yau Tsim Mong", labelZh: "油尖旺區" },
  { value: "sham_shui_po", area: "kowloon", labelEn: "Sham Shui Po", labelZh: "深水埗區" },
  { value: "kowloon_city", area: "kowloon", labelEn: "Kowloon City", labelZh: "九龍城區" },
  { value: "wong_tai_sin", area: "kowloon", labelEn: "Wong Tai Sin", labelZh: "黃大仙區" },
  { value: "kwun_tong", area: "kowloon", labelEn: "Kwun Tong", labelZh: "觀塘區" },
  { value: "north", area: "new_territories", labelEn: "North", labelZh: "北區" },
  { value: "tai_po", area: "new_territories", labelEn: "Tai Po", labelZh: "大埔區" },
  { value: "sha_tin", area: "new_territories", labelEn: "Sha Tin", labelZh: "沙田區" },
  { value: "sai_kung", area: "new_territories", labelEn: "Sai Kung", labelZh: "西貢區" },
  { value: "tsuen_wan", area: "new_territories", labelEn: "Tsuen Wan", labelZh: "荃灣區" },
  { value: "tuen_mun", area: "new_territories", labelEn: "Tuen Mun", labelZh: "屯門區" },
  { value: "yuen_long", area: "new_territories", labelEn: "Yuen Long", labelZh: "元朗區" },
  { value: "kwai_tsing", area: "new_territories", labelEn: "Kwai Tsing", labelZh: "葵青區" },
  { value: "islands", area: "new_territories", labelEn: "Islands", labelZh: "離島區" },
]

export const MACAU_DISTRICTS: {
  value: string
  labelEn: string
  labelZh: string
}[] = [
  { value: "nossa_senhora_de_fatima", labelEn: "Nossa Senhora de Fátima", labelZh: "花地瑪堂區" },
  { value: "santo_antonio", labelEn: "Santo António", labelZh: "花王堂區" },
  { value: "sao_lazaro", labelEn: "São Lázaro", labelZh: "望德堂區" },
  { value: "se", labelEn: "Sé", labelZh: "大堂區" },
  { value: "sao_lourenco", labelEn: "São Lourenço", labelZh: "風順堂區" },
  { value: "taipa", labelEn: "Taipa", labelZh: "嘉模堂區" },
  { value: "coloane", labelEn: "Coloane", labelZh: "聖方濟各堂區" },
]

export function getHkDistrictsForArea(area?: HkAddressArea) {
  if (!area) return []
  return HK_DISTRICTS.filter((entry) => entry.area === area)
}

export function getEffectiveHkArea(address: Pick<StructuredAddress, "area" | "district">): HkAddressArea | undefined {
  if (address.area) return address.area
  const districtKey = normalizeHkDistrictKey(address.district)
  if (!districtKey) return undefined
  return HK_DISTRICTS.find((entry) => entry.value === districtKey)?.area
}

export function getHkDistrictOptionsForAddress(
  address: Pick<StructuredAddress, "area" | "district">,
) {
  const effectiveArea = getEffectiveHkArea(address)
  return effectiveArea ? getHkDistrictsForArea(effectiveArea) : HK_DISTRICTS
}

export function normalizeHkDistrictKey(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""

  if (HK_DISTRICTS.some((entry) => entry.value === trimmed)) return trimmed

  const normalized = trimmed.toLowerCase()
  for (const entry of HK_DISTRICTS) {
    const label = `${entry.labelEn} / ${entry.labelZh}`
    if (
      normalized === entry.value ||
      trimmed === label ||
      trimmed === entry.labelEn ||
      trimmed === entry.labelZh ||
      trimmed.includes(entry.labelEn) ||
      trimmed.includes(entry.labelZh)
    ) {
      return entry.value
    }
  }

  return ""
}

export function normalizeMacauDistrictKey(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""

  if (MACAU_DISTRICTS.some((entry) => entry.value === trimmed)) return trimmed

  for (const entry of MACAU_DISTRICTS) {
    const label = `${entry.labelEn} / ${entry.labelZh}`
    if (trimmed === label || trimmed === entry.labelEn || trimmed === entry.labelZh) {
      return entry.value
    }
  }

  return ""
}

export function inferHkAreaFromText(text: string): HkAddressArea | undefined {
  const upper = text.toUpperCase()
  if (upper.includes("KOWLOON") || upper.includes("九龍")) return "kowloon"
  if (upper.includes("NEW TERRITOR") || upper.includes("新界") || /\bNT\b/.test(upper)) {
    return "new_territories"
  }
  if (upper.includes("HONG KONG ISLAND") || upper.includes("港島")) {
    return "hong_kong_island"
  }
  return undefined
}

export function resolveHongKongAddressParts(
  address: Pick<StructuredAddress, "area" | "district" | "addressEn" | "addressZh">,
): { area?: HkAddressArea; district: string } {
  const district = normalizeHkDistrictKey(address.district)
  let area = address.area

  if (district && !area) {
    area = HK_DISTRICTS.find((entry) => entry.value === district)?.area
  }

  if (!area) {
    area = inferHkAreaFromText([address.addressEn, address.addressZh].filter(Boolean).join(" "))
  }

  if (district) {
    const districtEntry = HK_DISTRICTS.find((entry) => entry.value === district)
    if (districtEntry) {
      area = districtEntry.area
    }
  }

  return { area, district }
}

export function enrichStructuredAddress(address: StructuredAddress): StructuredAddress {
  if (address.region === "hong_kong") {
    const { area, district } = resolveHongKongAddressParts(address)
    return {
      ...address,
      area: area || address.area,
      district: district || address.district,
    }
  }

  if (address.region === "macau" && address.district) {
    const district = normalizeMacauDistrictKey(address.district)
    return district ? { ...address, district } : address
  }

  return address
}

export function getDistrictLabel(district: string, region?: AddressRegion): string {
  if (!district) return ""
  const hkMatch = HK_DISTRICTS.find((entry) => entry.value === district)
  if (hkMatch) return `${hkMatch.labelEn} / ${hkMatch.labelZh}`
  const macauMatch = MACAU_DISTRICTS.find((entry) => entry.value === district)
  if (macauMatch) return `${macauMatch.labelEn} / ${macauMatch.labelZh}`
  if (region === "hong_kong" || region === "macau") return district
  return district
}

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
    parts.push(getDistrictLabel(address.district, address.region))
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

export function isKnownHkDistrictKey(value: string): boolean {
  return HK_DISTRICTS.some((entry) => entry.value === value)
}

export function isKnownMacauDistrictKey(value: string): boolean {
  return MACAU_DISTRICTS.some((entry) => entry.value === value)
}

export type StructuredAddressValidationIssue = {
  messageEn: string
  messageZh: string
}

export function validateStructuredAddressForSubmit(
  address: StructuredAddress,
  labelEn: string,
  labelZh: string,
): { ok: boolean; issues: StructuredAddressValidationIssue[] } {
  const issues: StructuredAddressValidationIssue[] = []
  const prefixEn = `${labelEn}:`
  const prefixZh = `${labelZh}：`

  if (address.region === "hong_kong") {
    if (!address.area) {
      issues.push({
        messageEn: `${prefixEn} select Area / 區域`,
        messageZh: `${prefixZh}請選擇區域`,
      })
    }
    if (!address.district || !isKnownHkDistrictKey(address.district)) {
      issues.push({
        messageEn: `${prefixEn} select District / 分區`,
        messageZh: `${prefixZh}請選擇分區`,
      })
    } else if (address.area) {
      const districtEntry = HK_DISTRICTS.find((entry) => entry.value === address.district)
      if (districtEntry && districtEntry.area !== address.area) {
        issues.push({
          messageEn: `${prefixEn} District must match selected Area / 分區須與所選區域一致`,
          messageZh: `${prefixZh}分區須與所選區域一致`,
        })
      }
    }
  }

  if (address.region === "macau") {
    if (!address.district || !isKnownMacauDistrictKey(address.district)) {
      issues.push({
        messageEn: `${prefixEn} select District / 分區`,
        messageZh: `${prefixZh}請選擇分區`,
      })
    }
  }

  if (address.region === "china") {
    if (!address.district.trim()) {
      issues.push({
        messageEn: `${prefixEn} enter Province / City / District / 省市区`,
        messageZh: `${prefixZh}請填寫省市区`,
      })
    }
  }

  if (!address.addressEn.trim()) {
    issues.push({
      messageEn: `${prefixEn} enter Address (English) / 地址（英文）`,
      messageZh: `${prefixZh}請填寫地址（英文）`,
    })
  }

  return { ok: issues.length === 0, issues }
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
