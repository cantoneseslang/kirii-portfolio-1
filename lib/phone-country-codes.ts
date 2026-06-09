import type { ContactEntry } from "@/types/hk-new-customer"
import {
  formatContactNameFull,
  normalizeContactNameFields,
} from "@/lib/hk-new-customer-contact-name"

export const PHONE_COUNTRY_CODES = [
  { code: "+852", labelEn: "Hong Kong", labelZh: "香港" },
  { code: "+853", labelEn: "Macau", labelZh: "澳門" },
  { code: "+86", labelEn: "China", labelZh: "中國" },
  { code: "+886", labelEn: "Taiwan", labelZh: "台灣" },
  { code: "+65", labelEn: "Singapore", labelZh: "新加坡" },
  { code: "+60", labelEn: "Malaysia", labelZh: "馬來西亞" },
  { code: "+81", labelEn: "Japan", labelZh: "日本" },
  { code: "+82", labelEn: "South Korea", labelZh: "韓國" },
  { code: "+1", labelEn: "USA/Canada", labelZh: "美國/加拿大" },
  { code: "+44", labelEn: "United Kingdom", labelZh: "英國" },
  { code: "+61", labelEn: "Australia", labelZh: "澳洲" },
] as const

export function normalizeContactEntry(contact: Partial<ContactEntry>): ContactEntry {
  const phone = String(contact.phone || "").trim()
  let phoneCountryCode = String(contact.phoneCountryCode || "").trim()

  if (!phoneCountryCode && phone.startsWith("+")) {
    const matched = PHONE_COUNTRY_CODES.find((entry) => phone.startsWith(entry.code))
    if (matched) {
      phoneCountryCode = matched.code
    }
  }

  const nameFields = normalizeContactNameFields(contact)

  return {
    ...nameFields,
    name: formatContactNameFull(nameFields),
    title: String(contact.title || "").trim(),
    email: String(contact.email || "").trim(),
    phoneCountryCode: phoneCountryCode || "+852",
    phone,
  }
}

export function formatContactPhone(contact?: Pick<ContactEntry, "phoneCountryCode" | "phone">): string {
  if (!contact?.phone?.trim()) return ""
  const code = contact.phoneCountryCode?.trim() || "+852"
  const localNumber = contact.phone.trim()
  if (localNumber.startsWith("+")) return localNumber
  return `${code} ${localNumber}`
}

export function getCountryCodeLabel(code?: string): string {
  if (!code) return "+852"
  const item = PHONE_COUNTRY_CODES.find((entry) => entry.code === code)
  return item ? `${item.code} (${item.labelEn})` : code
}
