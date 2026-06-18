import type { Profile } from "@/types/profile"

export type CardPermissionKey =
  | "lunch_order"
  | "lunch_order_sheet"
  | "qr_scan"
  | "khk_ai_monitor"
  | "salesperson_calendar"
  | "sales_amount"
  | "gantt_wbs"
  | "company_info"
  | "product_manual"
  | "certificate"
  | "collect_payment"
  | "new_customer_setting"
  | "pq_form"
  | "supplier_info"
  | "form_master"

export type CardPermissionSection =
  | "all"
  | "sales"
  | "factory"
  | "purchasing"
  | "admin"

export interface CardPermissionDefinition {
  key: CardPermissionKey
  label: string
  labelZh?: string
  section: CardPermissionSection
}

export const CARD_PERMISSIONS: CardPermissionDefinition[] = [
  { key: "lunch_order", label: "Lunch Order System", labelZh: "午餐訂購", section: "all" },
  { key: "lunch_order_sheet", label: "Lunch Order Sheet", labelZh: "午餐統計表", section: "all" },
  { key: "qr_scan", label: "QR Scan", labelZh: "QR掃描", section: "all" },
  { key: "khk_ai_monitor", label: "KHK AI Monitor", section: "all" },
  { key: "salesperson_calendar", label: "Salesperson Calendar", labelZh: "業務員月曆", section: "sales" },
  { key: "sales_amount", label: "Sales Amount Management", labelZh: "銷售金額統計表", section: "sales" },
  { key: "gantt_wbs", label: "Gantt Chart & WBS", labelZh: "銷售進度管理", section: "sales" },
  { key: "company_info", label: "Company Information", labelZh: "公司信息", section: "sales" },
  { key: "product_manual", label: "Product Manual", labelZh: "產品說明書", section: "sales" },
  { key: "certificate", label: "Product Certificate", labelZh: "保證書", section: "sales" },
  { key: "collect_payment", label: "Collect Payment", labelZh: "回收金額統計表", section: "sales" },
  { key: "new_customer_setting", label: "NewCustomer Setting", labelZh: "新客戶登記", section: "sales" },
  { key: "pq_form", label: "PQ Form", section: "factory" },
  { key: "supplier_info", label: "Supplier Info", section: "purchasing" },
  { key: "form_master", label: "Form Master (ISO)", section: "admin" },
]

export const DEPARTMENT_PERMISSION_KEYS = [
  "Admin",
  "All Employees",
  "Sales",
  "Purchasing",
  "Factory",
] as const

export type DepartmentPermissionKey = (typeof DEPARTMENT_PERMISSION_KEYS)[number]

export function parseDepartmentTokens(department?: string | null): string[] {
  if (!department) return []
  return department
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
}

export function hasDepartmentToken(
  department: string | null | undefined,
  token: DepartmentPermissionKey,
): boolean {
  if (token === "Admin") return false
  return parseDepartmentTokens(department).some(
    (part) => part.toLowerCase() === token.toLowerCase(),
  )
}

export function setDepartmentToken(
  department: string | null | undefined,
  token: DepartmentPermissionKey,
  enabled: boolean,
): string {
  const tokens = parseDepartmentTokens(department).filter(
    (part) => part.toLowerCase() !== token.toLowerCase(),
  )
  if (enabled) tokens.push(token)
  return tokens.join(",")
}

function sectionAllowed(profile: Profile, section: CardPermissionSection): boolean {
  if (profile.is_admin) return true
  const department = profile.department || ""
  switch (section) {
    case "all":
      return true
    case "sales":
      return department.includes("Sales")
    case "factory":
      return department.includes("Factory")
    case "purchasing":
      return department.includes("Purchasing")
    case "admin":
      return profile.is_admin === true
    default:
      return false
  }
}

export function getDefaultCardPermission(
  profile: Profile,
  key: CardPermissionKey,
): boolean {
  const def = CARD_PERMISSIONS.find((item) => item.key === key)
  if (!def) return false
  return sectionAllowed(profile, def.section)
}

export function hasCardPermission(
  profile: Profile | null | undefined,
  key: CardPermissionKey,
): boolean {
  if (!profile) return false
  if (profile.is_active === false) return false
  if (profile.is_admin) return true

  const overrides = profile.card_permissions || {}
  if (Object.prototype.hasOwnProperty.call(overrides, key)) {
    return overrides[key] === true
  }

  return getDefaultCardPermission(profile, key)
}

export function resolveCardPermissionState(
  profile: Profile,
  key: CardPermissionKey,
): boolean {
  const overrides = profile.card_permissions || {}
  if (Object.prototype.hasOwnProperty.call(overrides, key)) {
    return overrides[key] === true
  }
  return getDefaultCardPermission(profile, key)
}

export function buildCardPermissionsPatch(
  profile: Profile,
  key: CardPermissionKey,
  enabled: boolean,
): Record<string, boolean> {
  return {
    ...(profile.card_permissions || {}),
    [key]: enabled,
  }
}

export function getCardPermissionDefinition(key: CardPermissionKey) {
  return CARD_PERMISSIONS.find((item) => item.key === key)
}
