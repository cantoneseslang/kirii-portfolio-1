import { list, put } from "@vercel/blob"
import type { HkNewCustomerRegistration } from "@/types/hk-new-customer"
import { getAttachmentTypeLabel } from "@/types/hk-new-customer"
import { getSiteBaseUrl } from "@/lib/hk-new-customer-approval"
import { getIndex, getRegistration, safeFilename } from "@/lib/hk-new-customer-storage"

export const CUSTOMER_RECORD_PREFIX = "hk-new-customer/customer-records"

export type CustomerRecordFile = {
  name: string
  label: string
  documentType: string
  url: string
  uploadedAt?: string
}

export type CustomerRecordFolder = {
  folder: string
  companyNameEn: string
  companyNameZh: string
  brNumber: string
  registrationId: string
  approvalStatus: string
  submittedAt?: string
  approvedAt?: string
  fileCount: number
  files: CustomerRecordFile[]
}

type CustomerRecordManifest = Omit<CustomerRecordFolder, "fileCount">

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN
}

export function customerRecordFolderName(companyNameEn: string, brNumber: string): string {
  const company = safeFilename(companyNameEn || "customer").replace(/_+/g, "_").replace(/^_|_$/g, "")
  const br = safeFilename(brNumber || "no-br")
  return `${company}_${br}`
}

export function getCustomerRecordArchivePath(folder?: string): string {
  const base = "/dashboard/customer-registration-records"
  return folder ? `${base}?folder=${encodeURIComponent(folder)}` : base
}

export function getCustomerRecordArchiveUrl(folder?: string): string {
  return `${getSiteBaseUrl()}${getCustomerRecordArchivePath(folder)}`
}

export function getCustomerRecordFolderUrl(companyNameEn: string, brNumber: string): string {
  return getCustomerRecordArchiveUrl(customerRecordFolderName(companyNameEn, brNumber))
}

function freshBlobUrl(url: string): string {
  const next = new URL(url)
  next.searchParams.set("t", String(Date.now()))
  return next.toString()
}

async function copyUrlToPath(params: {
  sourceUrl: string
  path: string
  contentType?: string
}): Promise<{ url: string; path: string }> {
  const token = getBlobToken()
  const response = await fetch(freshBlobUrl(params.sourceUrl), { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Failed to copy ${params.sourceUrl}`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  const blob = await put(params.path, bytes, {
    token,
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: params.contentType || response.headers.get("content-type") || "application/octet-stream",
  })
  return { url: blob.url, path: params.path }
}

export async function syncCustomerRecordFolder(
  registration: HkNewCustomerRegistration,
): Promise<CustomerRecordFolder> {
  const folder = customerRecordFolderName(registration.companyNameEn, registration.brNumber)
  const files: CustomerRecordFile[] = []

  for (const attachment of registration.attachments || []) {
    if (!attachment.fileUrl) continue
    const path = `${CUSTOMER_RECORD_PREFIX}/${folder}/${attachment.documentType}-${safeFilename(attachment.fileName)}`
    const copied = await copyUrlToPath({
      sourceUrl: attachment.fileUrl,
      path,
      contentType: attachment.contentType,
    })
    files.push({
      name: attachment.fileName,
      label: getAttachmentTypeLabel(attachment.documentType),
      documentType: attachment.documentType,
      url: copied.url,
      uploadedAt: attachment.uploadedAt,
    })
  }

  if (registration.completedFormUrl) {
    const fileName = registration.completedFormFileName || "completed-application.docx"
    const path = `${CUSTOMER_RECORD_PREFIX}/${folder}/completed-form-${safeFilename(fileName)}`
    const copied = await copyUrlToPath({
      sourceUrl: registration.completedFormUrl,
      path,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })
    files.push({
      name: fileName,
      label: "Completed Application Form / 已完成申請表格",
      documentType: "completed_form",
      url: copied.url,
    })
  }

  const manifest: CustomerRecordManifest = {
    folder,
    companyNameEn: registration.companyNameEn,
    companyNameZh: registration.companyNameZh || "",
    brNumber: registration.brNumber,
    registrationId: registration.id,
    approvalStatus: registration.approvalStatus || "",
    submittedAt: registration.submittedAt,
    approvedAt: registration.approvedAt,
    files,
  }

  const token = getBlobToken()
  await put(
    `${CUSTOMER_RECORD_PREFIX}/${folder}/_record.json`,
    JSON.stringify(manifest, null, 2),
    {
      token,
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    },
  )

  return { ...manifest, fileCount: files.length }
}

async function readManifest(folder: string): Promise<CustomerRecordFolder | null> {
  const token = getBlobToken()
  const result = await list({
    token,
    prefix: `${CUSTOMER_RECORD_PREFIX}/${folder}/_record.json`,
    limit: 1,
  })
  const blob = result.blobs[0]
  if (!blob?.url) return null
  const response = await fetch(freshBlobUrl(blob.url), { cache: "no-store" })
  if (!response.ok) return null
  const manifest = (await response.json()) as CustomerRecordManifest
  return { ...manifest, fileCount: manifest.files?.length || 0 }
}

export async function listCustomerRecordFolders(): Promise<CustomerRecordFolder[]> {
  const index = await getIndex()
  const approved = index.items.filter((item) => item.approvalStatus === "approved")

  for (const item of approved) {
    const folder = customerRecordFolderName(item.companyNameEn, item.brNumber)
    const existing = await readManifest(folder)
    if (existing && existing.registrationId === item.id && existing.fileCount > 0) continue
    const registration = await getRegistration(item.id)
    if (registration) {
      try {
        await syncCustomerRecordFolder(registration)
      } catch (error) {
        console.error("Failed to sync customer record folder", folder, error)
      }
    }
  }

  const token = getBlobToken()
  const listed = await list({ token, prefix: `${CUSTOMER_RECORD_PREFIX}/`, limit: 1000 })
  const folders = new Set<string>()
  for (const blob of listed.blobs) {
    const parts = blob.pathname.split("/")
    if (parts[2]) folders.add(parts[2])
  }

  const records = await Promise.all([...folders].map((folder) => readManifest(folder)))
  return records
    .filter((item): item is CustomerRecordFolder => Boolean(item))
    .sort((a, b) => {
      const aTime = new Date(a.approvedAt || a.submittedAt || 0).getTime()
      const bTime = new Date(b.approvedAt || b.submittedAt || 0).getTime()
      return bTime - aTime
    })
}

export async function getCustomerRecordFolder(folder: string): Promise<CustomerRecordFolder | null> {
  const safe = folder.replace(/[^a-zA-Z0-9._-]/g, "")
  if (!safe) return null
  return readManifest(safe)
}
