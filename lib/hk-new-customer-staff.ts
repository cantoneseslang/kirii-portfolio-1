import type { Profile } from "@/types/profile"

export type SalesRepOption = {
  id: string
  full_name: string
  email?: string
  position?: string
}

export function isSalesDepartment(department?: string | null): boolean {
  if (!department) return false
  return department.toLowerCase().includes("sales")
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

export function filterSalesRepProfiles(profiles: SalesRepOption[]): SalesRepOption[] {
  return profiles
    .filter((profile) => profile.full_name.trim())
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "en"))
}
