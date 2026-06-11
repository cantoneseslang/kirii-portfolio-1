import type { Profile } from "@/types/profile"

export type SalesRepRecord = {
  english_name: string
  full_name: string
  email: string
  position: string
}

export type SalesRepOption = {
  id: string
  english_name: string
  full_name: string
  email?: string
  position?: string
}

/** Fixed Sales roster for HK New Customer registration (allowlist only). */
export const HK_NEW_CUSTOMER_SALES_REPS: readonly SalesRepRecord[] = [
  { english_name: "Ivan", full_name: "Ip Ting Hin", email: "ivan@kirii.com.hk", position: "Sales Executive" },
  { english_name: "Kami", full_name: "Kit Yu Yi", email: "kami@kirii.com.hk", position: "Ass. Sales Manageress" },
  { english_name: "Anson", full_name: "Lam Wai Lok", email: "anson@kirii.com.hk", position: "S & M Executive" },
  { english_name: "Billy Lau", full_name: "Lau Cheuk Ming", email: "billylau@kirii.com.hk", position: "S & M Manger" },
  { english_name: "Billy Li", full_name: "Li Pui Lok", email: "billyli@kirii.com.hk", position: "Project Manager" },
  { english_name: "Ada", full_name: "Poon Hiu Yi", email: "ada@kirii.com.hk", position: "Project Administrator" },
  { english_name: "Grace", full_name: "Poon Kit Ling", email: "grace@kirii.com.hk", position: "S & M Manageress" },
  { english_name: "Alex", full_name: "Wong Hong Keung", email: "alexwong@kirii.com.hk", position: "Sales Manager and Director" },
] as const

export function normalizeStaffEmail(email?: string | null): string {
  return email?.trim().toLowerCase() || ""
}

export function resolveSalesRep(
  email?: string | null,
  fullName?: string | null,
): SalesRepRecord | undefined {
  const normalizedEmail = normalizeStaffEmail(email)
  const normalizedName = fullName?.trim().toLowerCase() || ""

  return HK_NEW_CUSTOMER_SALES_REPS.find((rep) => {
    if (normalizedEmail && normalizeStaffEmail(rep.email) === normalizedEmail) return true
    if (normalizedName && rep.full_name.trim().toLowerCase() === normalizedName) return true
    return false
  })
}

export function isSalesStaffMember(email?: string | null, fullName?: string | null): boolean {
  return Boolean(resolveSalesRep(email, fullName))
}

export function resolveStaffDisplayName(profile: Profile | null, userMetadataName?: string): string {
  return profile?.full_name?.trim() || userMetadataName?.trim() || ""
}

export function formatStaffNameAndTitle(
  fullName: string,
  position?: string | null,
  englishName?: string | null,
): string {
  const name = fullName.trim()
  const title = position?.trim()
  const english = englishName?.trim()

  if (!name) return ""
  const namePart = english ? `${english} / ${name}` : name
  if (!title) return namePart
  return `${namePart} / ${title}`
}

export function formatSalesRepLabel(rep: Pick<SalesRepRecord, "english_name" | "full_name" | "position">): string {
  return formatStaffNameAndTitle(rep.full_name, rep.position, rep.english_name)
}

export function formatSalesRepShortName(rep: Pick<SalesRepRecord, "english_name" | "full_name">): string {
  return `${rep.english_name.trim()} / ${rep.full_name.trim()}`
}

export function getTodayIsoDateInHongKong(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export function getSalesRepAllowlist(): SalesRepOption[] {
  return [...HK_NEW_CUSTOMER_SALES_REPS]
    .map((rep) => ({
      id: rep.email,
      english_name: rep.english_name,
      full_name: rep.full_name,
      email: rep.email,
      position: rep.position,
    }))
    .sort((a, b) => a.english_name.localeCompare(b.english_name, "en"))
}

export function filterSalesRepProfiles(profiles: SalesRepOption[]): SalesRepOption[] {
  const allowedEmails = new Set(HK_NEW_CUSTOMER_SALES_REPS.map((rep) => normalizeStaffEmail(rep.email)))
  const allowedNames = new Set(
    HK_NEW_CUSTOMER_SALES_REPS.map((rep) => rep.full_name.trim().toLowerCase()),
  )

  return profiles
    .filter((profile) => {
      const email = normalizeStaffEmail(profile.email)
      const name = profile.full_name.trim().toLowerCase()
      return (email && allowedEmails.has(email)) || (name && allowedNames.has(name))
    })
    .sort((a, b) => a.english_name.localeCompare(b.english_name, "en"))
}

export function resolveSalesRepPosition(fullName: string): string | undefined {
  return resolveSalesRep(null, fullName)?.position
}

export function resolveSalesRepEnglishName(fullName: string): string | undefined {
  return resolveSalesRep(null, fullName)?.english_name
}
