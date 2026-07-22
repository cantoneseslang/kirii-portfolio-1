import { list, put } from "@vercel/blob"
import type {
  ApprovalStatus,
  HkNewCustomerIndex,
  HkNewCustomerIndexItem,
  HkNewCustomerRegistration,
} from "@/types/hk-new-customer"
import { getApproverRole, getPendingStatusForRole } from "@/lib/hk-new-customer-approval"

export const INDEX_PATH = "hk-new-customer/index.json"
export const REGISTRATION_PREFIX = "hk-new-customer/registrations"
export const ATTACHMENT_PREFIX = "hk-new-customer/attachments"

export function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN
}

export async function getIndex(): Promise<HkNewCustomerIndex> {
  const token = getBlobToken()
  const result = await list({ token, prefix: INDEX_PATH, limit: 1 })
  const latest = result.blobs[0]
  if (!latest?.url) {
    return { updatedAt: new Date().toISOString(), items: [] }
  }

  const response = await fetch(latest.url, { cache: "no-store" })
  if (!response.ok) {
    return { updatedAt: new Date().toISOString(), items: [] }
  }
  return (await response.json()) as HkNewCustomerIndex
}

async function saveIndex(index: HkNewCustomerIndex): Promise<void> {
  const token = getBlobToken()
  await put(INDEX_PATH, JSON.stringify(index, null, 2), {
    token,
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  })
}

export async function saveRegistration(
  registration: HkNewCustomerRegistration,
): Promise<void> {
  const token = getBlobToken()
  await put(`${REGISTRATION_PREFIX}/${registration.id}.json`, JSON.stringify(registration, null, 2), {
    token,
    access: "public",
    allowOverwrite: true,
    contentType: "application/json",
  })

  const index = await getIndex()
  const summary: HkNewCustomerIndexItem = {
    id: registration.id,
    companyNameEn: registration.companyNameEn,
    companyNameZh: registration.companyNameZh,
    brNumber: registration.brNumber,
    createdAt: registration.createdAt,
    status: registration.status,
    approvalStatus: registration.approvalStatus,
    submitterEmail: registration.submitterEmail,
    salesRepName: registration.salesRepName,
    apContactName: registration.apContactName,
  }

  const existingIdx = index.items.findIndex((item) => item.id === registration.id)
  if (existingIdx >= 0) {
    index.items[existingIdx] = summary
  } else {
    index.items.unshift(summary)
  }
  index.updatedAt = new Date().toISOString()
  await saveIndex(index)
}

export async function getRegistration(
  id: string,
): Promise<HkNewCustomerRegistration | null> {
  const token = getBlobToken()
  const result = await list({ token, prefix: `${REGISTRATION_PREFIX}/${id}.json`, limit: 1 })
  const blob = result.blobs[0]
  if (!blob?.url) return null

  const response = await fetch(blob.url, { cache: "no-store" })
  if (!response.ok) return null
  return (await response.json()) as HkNewCustomerRegistration
}

export function searchRegistrations(
  index: HkNewCustomerIndex,
  query: string,
): HkNewCustomerIndexItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return [...index.items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  return index.items
    .filter((item) => {
      const haystack = [
        item.companyNameEn,
        item.companyNameZh,
        item.brNumber,
        item.salesRepName,
        item.apContactName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalized)
    })
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
}

export async function listPendingApprovalsForEmail(email: string): Promise<HkNewCustomerRegistration[]> {
  const role = getApproverRole(email)
  if (!role) return []

  const pendingStatus = getPendingStatusForRole(role)
  const index = await getIndex()
  const candidates = index.items.filter((item) => item.approvalStatus === pendingStatus)
  const registrations = await Promise.all(
    candidates.map((item) => getRegistration(item.id)),
  )
  return registrations.filter((item): item is HkNewCustomerRegistration => Boolean(item))
}

export async function listSubmissionsForEmail(email: string): Promise<HkNewCustomerIndexItem[]> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return []

  const index = await getIndex()
  const rank = (status?: string | null) => {
    if (!status) return 9
    if (status.startsWith("pending")) return 0
    if (status === "rejected") return 1
    if (status === "approved") return 2
    return 3
  }

  return index.items
    .filter(
      (item) =>
        item.submitterEmail?.trim().toLowerCase() === normalized &&
        item.status === "submitted" &&
        Boolean(item.approvalStatus),
    )
    .sort((a, b) => {
      const byStatus = rank(a.approvalStatus) - rank(b.approvalStatus)
      if (byStatus !== 0) return byStatus
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 30)
}

export async function uploadCompletedForm(params: {
  registrationId: string
  fileName: string
  bytes: Buffer
}): Promise<{ url: string; path: string }> {
  const token = getBlobToken()
  const path = `${REGISTRATION_PREFIX}/${params.registrationId}/${safeFilename(params.fileName)}`
  const blob = await put(path, params.bytes, {
    token,
    access: "public",
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
  return { url: blob.url, path }
}

export async function uploadAttachmentFile(params: {
  registrationId: string
  documentType: string
  fileName: string
  bytes: Buffer
  contentType?: string
}): Promise<{ url: string; path: string }> {
  const token = getBlobToken()
  const path = `${ATTACHMENT_PREFIX}/${params.registrationId}/${params.documentType}-${Date.now()}-${safeFilename(params.fileName)}`
  const blob = await put(path, params.bytes, {
    token,
    access: "public",
    contentType: params.contentType || "application/octet-stream",
  })
  return { url: blob.url, path }
}
