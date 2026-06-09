import type { ContactEntry } from "@/types/hk-new-customer"
import {
  formatContactNameFull,
  normalizeContactNameFields,
} from "@/lib/hk-new-customer-contact-name"
import { WORLD_PHONE_COUNTRY_CODES, type PhoneCountryCodeEntry } from "@/lib/phone-country-codes-data"

export type { PhoneCountryCodeEntry }

const PRIORITY_COUNTRY_CODES = [
  "+852",
  "+853",
  "+86",
  "+886",
  "+65",
  "+60",
  "+81",
  "+82",
  "+66",
  "+84",
  "+63",
  "+91",
  "+971",
  "+1",
  "+44",
  "+61",
  "+64",
  "+49",
  "+33",
  "+39",
] as const

const worldByCode = new Map(WORLD_PHONE_COUNTRY_CODES.map((entry) => [entry.code, entry]))

export const PHONE_COUNTRY_CODES: PhoneCountryCodeEntry[] = [
  ...PRIORITY_COUNTRY_CODES.map((code) => worldByCode.get(code)).filter(
    (entry): entry is PhoneCountryCodeEntry => Boolean(entry),
  ),
  ...WORLD_PHONE_COUNTRY_CODES.filter((entry) => !PRIORITY_COUNTRY_CODES.includes(entry.code as (typeof PRIORITY_COUNTRY_CODES)[number])),
]

export function findPhoneCountryCode(phone: string): PhoneCountryCodeEntry | undefined {
  return [...PHONE_COUNTRY_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((entry) => phone.startsWith(entry.code))
}

export function getPhoneCountryCodeEntry(code?: string): PhoneCountryCodeEntry | undefined {
  if (!code) return worldByCode.get("+852")
  return worldByCode.get(code)
}

export function normalizeContactEntry(contact: Partial<ContactEntry>): ContactEntry {
  const phone = String(contact.phone || "").trim()
  let phoneCountryCode = String(contact.phoneCountryCode || "").trim()

  if (!phoneCountryCode && phone.startsWith("+")) {
    phoneCountryCode = findPhoneCountryCode(phone)?.code || ""
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
  const item = getPhoneCountryCodeEntry(code)
  return item ? `${item.code} ${item.labelEn} / ${item.labelZh}` : code || "+852"
}

export function formatCountryCodeOptionLabel(entry: PhoneCountryCodeEntry): string {
  return `${entry.code} ${entry.labelEn} / ${entry.labelZh}`
}
