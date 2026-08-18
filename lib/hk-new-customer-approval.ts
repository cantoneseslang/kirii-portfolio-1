import type { ApprovalStatus, HkNewCustomerRegistration } from "@/types/hk-new-customer"

export type ApproverRole = "sales_manager" | "general_manager"

export type ApproverContact = {
  name: string
  email: string
}

export const HK_NEW_CUSTOMER_APPROVERS = {
  sales_managers: [
    { name: "Alex", email: "alexwong@kirii.com.hk" },
    { name: "Grace", email: "grace@kirii.com.hk" },
    { name: "BillyLau", email: "billylau@kirii.com.hk" },
    { name: "Kami", email: "kami@kirii.com.hk" },
  ],
  general_manager: [{ name: "Sakon", email: "hiroki.sakon@kirii.com.hk" }],
} as const

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Stable production URL for KIRII Employee Portfolio (never use VERCEL_URL — preview deployments). */
export const PORTFOLIO_PRODUCTION_URL = "https://kirii-portfolio-1.vercel.app"

export function getSiteBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    const host = process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")
    return `https://${host}`
  }
  if (process.env.NODE_ENV === "production") {
    return PORTFOLIO_PRODUCTION_URL
  }
  return "http://localhost:3010"
}

export function getDashboardApprovalPath(registrationId?: string): string {
  const base = "/dashboard/new-customer-setting/approvals"
  return registrationId ? `${base}?id=${encodeURIComponent(registrationId)}` : base
}

export function getApprovalPageUrl(registrationId?: string): string {
  return `${getSiteBaseUrl()}${getDashboardApprovalPath(registrationId)}`
}

export function getPortfolioLoginUrl(): string {
  return `${getSiteBaseUrl()}/`
}

export function getNewCustomerSettingUrl(): string {
  return `${getSiteBaseUrl()}/dashboard/new-customer-setting`
}

export function getApproverRole(email: string): ApproverRole | null {
  const normalized = normalizeEmail(email)
  if (HK_NEW_CUSTOMER_APPROVERS.sales_managers.some((person) => normalizeEmail(person.email) === normalized)) {
    return "sales_manager"
  }
  if (
    HK_NEW_CUSTOMER_APPROVERS.general_manager.some((person) => normalizeEmail(person.email) === normalized)
  ) {
    return "general_manager"
  }
  return null
}

export function getApproverName(email: string): string | null {
  const normalized = normalizeEmail(email)
  const all = [
    ...HK_NEW_CUSTOMER_APPROVERS.sales_managers,
    ...HK_NEW_CUSTOMER_APPROVERS.general_manager,
  ]
  return all.find((person) => normalizeEmail(person.email) === normalized)?.name || null
}

export function getPendingStatusForRole(role: ApproverRole): ApprovalStatus {
  if (role === "sales_manager") return "pending_sales_manager"
  return "pending_gm"
}

export function isPendingApprovalStatus(
  status?: ApprovalStatus | null,
): status is ApprovalStatus {
  return (
    status === "pending_sales_manager" ||
    status === "pending_finance" ||
    status === "pending_gm"
  )
}

export function canApproveRegistration(
  registration: HkNewCustomerRegistration,
  email: string,
): boolean {
  const role = getApproverRole(email)
  if (!role || !isPendingApprovalStatus(registration.approvalStatus)) return false
  if (role === "general_manager") return true
  return registration.approvalStatus === getPendingStatusForRole(role)
}

export function getNextApprovalStatus(
  current: ApprovalStatus,
  role?: ApproverRole | null,
): ApprovalStatus | "approved" {
  if (role === "general_manager") return "approved"
  if (current === "pending_sales_manager") return "pending_gm"
  if (current === "pending_finance" || current === "pending_gm") return "approved"
  return "approved"
}

export function getApproversForStatus(status: ApprovalStatus): ApproverContact[] {
  if (status === "pending_sales_manager") return [...HK_NEW_CUSTOMER_APPROVERS.sales_managers]
  if (status === "pending_finance" || status === "pending_gm") {
    return [...HK_NEW_CUSTOMER_APPROVERS.general_manager]
  }
  return []
}

export function getApprovalStatusLabel(status?: ApprovalStatus): string {
  switch (status) {
    case "pending_sales_manager":
      return "Pending Sales Manager / 待營業經理審批"
    case "pending_finance":
    case "pending_gm":
      return "Pending General Manager / 待社長審批"
    case "approved":
      return "Approved / 已完成"
    case "rejected":
      return "Rejected / 已拒絕"
    default:
      return "Draft / 草稿"
  }
}
