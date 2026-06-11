import { getApprovalStatusLabel, getApproverRole } from "@/lib/hk-new-customer-approval"
import { listPendingApprovalsForEmail, listSubmissionsForEmail } from "@/lib/hk-new-customer-storage"
import { fetchTodayLunchOrder, resolveLunchMemberId, type LunchOrderSummary } from "@/lib/lunch-member"
import type { ApprovalStatus } from "@/types/hk-new-customer"

export type DashboardApplicationItem = {
  id: string
  type: "new_customer"
  labelZh: string
  labelEn: string
  companyNameEn: string
  status: ApprovalStatus
  statusLabelZh: string
  statusLabelEn: string
  href: string
}

export type DashboardPersonalSummary = {
  lunch: LunchOrderSummary | null
  lunchMemberId: string | null
  myApplications: DashboardApplicationItem[]
  pendingApprovals: DashboardApplicationItem[]
}

function submissionStatusLabelZh(_status: ApprovalStatus): string {
  return "審批中"
}

function toApplicationItem(
  id: string,
  companyNameEn: string,
  approvalStatus: ApprovalStatus,
  href: string,
): DashboardApplicationItem {
  return {
    id,
    type: "new_customer",
    labelZh: "新客戶資料",
    labelEn: "New Customer Registration",
    companyNameEn,
    status: approvalStatus,
    statusLabelZh: submissionStatusLabelZh(approvalStatus),
    statusLabelEn: getApprovalStatusLabel(approvalStatus),
    href,
  }
}

export async function buildDashboardPersonalSummary(params: {
  email?: string | null
  fullName?: string | null
}): Promise<DashboardPersonalSummary> {
  const email = params.email?.trim() || ""
  const fullName = params.fullName?.trim() || ""
  const lunchMemberId = resolveLunchMemberId(fullName)

  let lunch: LunchOrderSummary | null = null
  if (lunchMemberId) {
    try {
      lunch = await fetchTodayLunchOrder(lunchMemberId)
    } catch {
      lunch = null
    }
  }

  const myApplications: DashboardApplicationItem[] = []
  const pendingApprovals: DashboardApplicationItem[] = []

  if (email) {
    const submissions = await listSubmissionsForEmail(email)
    for (const item of submissions) {
      if (!item.approvalStatus) continue
      myApplications.push(
        toApplicationItem(
          item.id,
          item.companyNameEn,
          item.approvalStatus,
          "/dashboard/new-customer-setting",
        ),
      )
    }

    if (getApproverRole(email)) {
      const pending = await listPendingApprovalsForEmail(email)
      for (const registration of pending) {
        if (!registration.approvalStatus) continue
        pendingApprovals.push(
          toApplicationItem(
            registration.id,
            registration.companyNameEn,
            registration.approvalStatus,
            `/dashboard/new-customer-setting/approvals?id=${encodeURIComponent(registration.id)}`,
          ),
        )
      }
    }
  }

  return {
    lunch,
    lunchMemberId,
    myApplications,
    pendingApprovals,
  }
}
