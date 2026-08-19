"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CustomerRecordFolder } from "@/lib/hk-new-customer-customer-records"
import { getApprovalStatusLabel } from "@/lib/hk-new-customer-approval"
import type { ApprovalStatus } from "@/types/hk-new-customer"

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" })
}

function CustomerRegistrationRecordsPage() {
  const searchParams = useSearchParams()
  const selectedFolder = searchParams.get("folder")?.trim() || ""
  const [folders, setFolders] = useState<CustomerRecordFolder[]>([])
  const [selected, setSelected] = useState<CustomerRecordFolder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFolders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/hk-new-customer/customer-records", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load customer folders")
      }
      setFolders(result.data || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load customer folders")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFolders()
  }, [loadFolders])

  useEffect(() => {
    if (!selectedFolder) {
      setSelected(null)
      return
    }
    const match = folders.find((item) => item.folder === selectedFolder)
    setSelected(match || null)
  }, [folders, selectedFolder])

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#02315a]">客戶登記紀錄</h1>
          <p className="text-sm text-muted-foreground">Customer Registration Record / ISO archive by customer folder</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {!selectedFolder ? (
        <Card>
          <CardHeader>
            <CardTitle>Customer folders / 客戶資料夾</CardTitle>
            <CardDescription>
              Each approved customer has a folder with Excel, scans, and the completed Word form. /
              每個已核准客戶一個資料夾，內含 Excel、掃描件及 Word 表格。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-sm text-muted-foreground">Loading folders...</p>}
            {!loading && folders.length === 0 && (
              <p className="text-sm text-muted-foreground">No customer folders yet / 尚未有客戶資料夾</p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {folders.map((folder) => (
                <Link
                  key={folder.folder}
                  href={`/dashboard/customer-registration-records?folder=${encodeURIComponent(folder.folder)}`}
                  className="rounded-xl border bg-[#f1f1f3] p-4 transition hover:border-[#02315a] hover:shadow-sm"
                >
                  <div className="text-lg font-semibold text-[#02315a]">{folder.companyNameEn}</div>
                  {folder.companyNameZh ? (
                    <div className="text-sm text-muted-foreground">{folder.companyNameZh}</div>
                  ) : null}
                  <div className="mt-2 text-sm">BR: {folder.brNumber}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getApprovalStatusLabel(folder.approvalStatus as ApprovalStatus)} · {folder.fileCount} files ·{" "}
                    {formatDate(folder.approvedAt || folder.submittedAt)}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{selected?.companyNameEn || selectedFolder}</CardTitle>
            <CardDescription>
              {selected?.companyNameZh ? `${selected.companyNameZh} · ` : ""}
              BR: {selected?.brNumber || "-"} · {selected ? getApprovalStatusLabel(selected.approvalStatus as ApprovalStatus) : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/customer-registration-records">Back to folders / 返回資料夾</Link>
            </Button>
            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {selected && (
              <>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <div>Approved: {formatDate(selected.approvedAt)}</div>
                  <div>Submitted: {formatDate(selected.submittedAt)}</div>
                </div>
                <div>
                  <div className="mb-2 font-medium">Files in this folder / 此資料夾檔案</div>
                  {selected.files.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No Excel or scans were stored with this application. /
                      此申請沒有保存 Excel 或掃描件。
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.files.map((file) => (
                        <li key={`${file.documentType}-${file.name}`} className="rounded-md border p-3">
                          <div className="font-medium">{file.label}</div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#02315a] underline"
                          >
                            {file.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function CustomerRegistrationRecordsPageRoute() {
  return (
    <Suspense fallback={<div className="py-6 text-sm text-muted-foreground">Loading...</div>}>
      <CustomerRegistrationRecordsPage />
    </Suspense>
  )
}
