import type { Profile } from "@/types/profile"

export type SalesRepOption = {
  id: string
  full_name: string
  email?: string
  position?: string
}

/** Fixed Sales roster for HK New Customer registration (allowlist only). */
export const HK_NEW_CUSTOMER_SALES_REPS = [
  { full_name: "Ip Ting Hin", email: "ivan@kirii.com.hk", position: "Sales Executive" },
  { full_name: "Kit Yu Yi", email: "kami@kirii.com.hk", position: "Ass. Sales Manageress" },
  { full_name: "Lam Wai Lok", email: "anson@kirii.com.hk", position: "S & M Executive" },
  { full_name: "Lau Cheuk Ming", email: "billylau@kirii.com.hk", position: "S & M Manger" },
  { full_name: "Li Pui Lok", email: "billyli@kirii.com.hk", position: "Project Manager" },
  { full_name: "Poon Hiu Yi", email: "ada@kirii.com.hk", position: "Project Administrator" },
  { full_name: "Poon Kit Ling", email: "grace@kirii.com.hk", position: "S & M Manageress" },
  { full_name: "Wong Hong Keung", email: "alexwong@kirii.com.hk", position: "Fty. Manager" },
] as const

export function normalizeStaffEmail(email?: string | null): string {
  return email?.trim().toLowerCase() || ""
}

export function isSalesStaffMember(email?: string | null, fullName?: string | null): boolean {
  const normalizedEmail = normalizeStaffEmail(email)
  const normalizedName = fullName?.trim().toLowerCase() || ""

  return HK_NEW_CUSTOMER_SALES_REPS.some((rep) => {
    if (normalizedEmail && normalizeStaffEmail(rep.email) === normalizedEmail) return true
    if (normalizedName && rep.full_name.trim().toLowerCase() === normalizedName) return true
    return false
  })
}

export function resolveStaffDisplayName(profile: Profile | null, userMetadataName?: string): string {
  return profile?.full_name?.trim() || userMetadataName?.trim() || ""
}

export function formatStaffNameAndTitle(fullName: string, position?: string | null): string {
  const name = fullName.trim()
  const title = position?.trim()
  if (!name) return ""
  if (!title) return name
  return `${name} / ${title}`
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
      full_name: rep.full_name,
      email: rep.email,
      position: rep.position,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "en"))
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
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "en"))
}

export function resolveSalesRepPosition(fullName: string): string | undefined {
  return HK_NEW_CUSTOMER_SALES_REPS.find(
    (rep) => rep.full_name.trim().toLowerCase() === fullName.trim().toLowerCase(),
  )?.position
}
