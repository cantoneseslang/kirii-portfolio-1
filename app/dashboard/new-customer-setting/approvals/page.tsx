"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  canApproveRegistration,
  getApprovalStatusLabel,
  getApproverRole,
  getNextApprovalStatus,
} from "@/lib/hk-new-customer-approval"
import type { HkNewCustomerRegistration } from "@/types/hk-new-customer"
import { getAttachmentTypeLabel } from "@/types/hk-new-customer"
import { DocumentComplianceSummary } from "@/components/document-compliance-summary"
import { formatContactPhone } from "@/lib/phone-country-codes"

export default function NewCustomerApprovalsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get("id")
  const [pendingItems, setPendingItems] = useState<HkNewCustomerRegistration[]>([])
  const [selectedRecord, setSelectedRecord] = useState<HkNewCustomerRegistration | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [comment, setComment] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const approverRole = useMemo(
    () => (user?.email ? getApproverRole(user.email) : null),
    [user?.email],
  )

  const loadPending = useCallback(async () => {
    if (!user?.email) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/hk-new-customer/pending?email=${encodeURIComponent(user.email)}`,
        { cache: "no-store" },
      )
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load pending approvals")
      }
      setPendingItems(result.data || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load pending approvals")
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  const loadRecord = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/hk-new-customer?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load registration")
      }
      setSelectedRecord(result.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load registration")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPending()
  }, [loadPending])

  const singlePendingId = pendingItems.length === 1 ? pendingItems[0]?.id : null

  useEffect(() => {
    if (selectedId) {
      void loadRecord(selectedId)
      return
    }
    if (singlePendingId) {
      void loadRecord(singlePendingId)
    }
  }, [selectedId, singlePendingId, loadRecord])

  const handleDecision = async (action: "approve" | "reject") => {
    if (!user?.email || !selectedRecord) return
    setProcessing(true)
    setMessage(null)
    setError(null)
    try {
      const response = await fetch("/api/hk-new-customer/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: selectedRecord.id,
          action,
          approverEmail: user.email,
          comment,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to process approval")
      }
      const updated = result.data as HkNewCustomerRegistration
      setMessage(result.message)
      setComment("")
      setPendingItems((current) => current.filter((item) => item.id !== updated.id))
      setSelectedRecord(updated)
      await loadPending()
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Failed to process approval")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#02315a]">NewCustomer Approvals</h1>
          <p className="text-sm text-muted-foreground">Approval Workflow / 新客戶登記審批</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard / 主頁</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/new-customer-setting">NewCustomer Setting / 新客戶登記</Link>
          </Button>
        </div>
      </div>

      <Card className="border-[#02315a]/20 bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">In-Portfolio Workflow / Portfolio 內審批流程</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>All approvals are handled here inside KIRII Employee Portfolio — email is notification only.</p>
          <p>所有審批均在此 Portfolio 內完成，電郵僅作通知。</p>
          <p>Sales Manager → General Manager (社長決裁)</p>
        </CardContent>
      </Card>

      {!approverRole && (
        <Card>
          <CardHeader>
            <CardTitle>Not Authorized / 沒有審批權限</CardTitle>
            <CardDescription>
              Your account is not configured as an approver for this workflow.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {approverRole && (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Pending / 待審批</CardTitle>
              <CardDescription>
                {approverRole === "sales_manager" && "Sales Manager / 營業經理"}
                {approverRole === "general_manager" &&
                  "General Manager / 社長 · 社長決裁"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
              {!loading && pendingItems.length === 0 && (
                <p className="text-sm text-muted-foreground">No pending approvals / 沒有待審批項目</p>
              )}
              {pendingItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void loadRecord(item.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 ${
                    selectedRecord?.id === item.id ? "border-[#02315a] bg-muted/30" : ""
                  }`}
                >
                  <div className="font-medium">{item.companyNameEn}</div>
                  <div className="text-sm text-muted-foreground">BR: {item.brNumber}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getApprovalStatusLabel(item.approvalStatus)}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review / 審批詳情</CardTitle>
              <CardDescription>
                Sales Manager sends to GM. GM approval completes the application. Reject returns it to the submitter. /
                營業經理批准後交社長。社長批准即完成。拒絕則退回申請人。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedRecord && (
                <p className="text-sm text-muted-foreground">Select a pending registration / 請選擇待審批項目</p>
              )}

              {selectedRecord && (
                <>
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <div><span className="font-medium">Company:</span> {selectedRecord.companyNameEn}</div>
                    <div><span className="font-medium">BR No.:</span> {selectedRecord.brNumber}</div>
                    <div><span className="font-medium">Sales Rep.:</span> {selectedRecord.salesRepName || "-"}</div>
                    <div><span className="font-medium">Submitter:</span> {selectedRecord.submitterEmail || "-"}</div>
                    <div><span className="font-medium">Status:</span> {getApprovalStatusLabel(selectedRecord.approvalStatus)}</div>
                    <div><span className="font-medium">A/P Contact:</span> {selectedRecord.apContactName || "-"}</div>
                    <div><span className="font-medium">A/P Email:</span> {selectedRecord.apEmail || "-"}</div>
                    <div>
                      <span className="font-medium">A/P Phone:</span>{" "}
                      {formatContactPhone({
                        phoneCountryCode: selectedRecord.apPhoneCountryCode,
                        phone: selectedRecord.apPhone,
                      }) || "-"}
                    </div>
                  </div>

                  {selectedRecord.approvalHistory && selectedRecord.approvalHistory.length > 0 && (
                    <div>
                      <div className="mb-2 font-medium text-sm">Approval History / 審批紀錄</div>
                      <ul className="space-y-2 text-sm">
                        {selectedRecord.approvalHistory.map((entry, index) => (
                          <li key={`${entry.timestamp}-${index}`} className="rounded-md border p-2">
                            {entry.action} by {entry.approverName} ({entry.approverEmail}) · {new Date(entry.timestamp).toLocaleString("zh-HK")}
                            {entry.comment ? ` · ${entry.comment}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedRecord.attachments.length > 0 && (
                    <div>
                      <div className="mb-2 font-medium text-sm">Attachments / 附件</div>
                      <ul className="space-y-1 text-sm">
                        {selectedRecord.attachments.map((attachment) => (
                          <li key={attachment.id}>
                            <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#02315a] underline">
                              {getAttachmentTypeLabel(attachment.documentType)} - {attachment.fileName}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <DocumentComplianceSummary registration={selectedRecord} />

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="approval-comment">
                      Comment / 備註 (optional)
                    </label>
                    <Textarea
                      id="approval-comment"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Optional comment for rejection or approval"
                    />
                  </div>

                  {user?.email && canApproveRegistration(selectedRecord, user.email) ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const next = getNextApprovalStatus(
                            selectedRecord.approvalStatus || "pending_sales_manager",
                            approverRole,
                          )
                          if (next === "approved") {
                            return "Approve to complete registration. / 批准後完成登記。"
                          }
                          return `Approve to send to ${getApprovalStatusLabel(next)}. / 批准後進入：${getApprovalStatusLabel(next)}`
                        })()}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button disabled={processing} onClick={() => void handleDecision("approve")}>
                          {processing ? "Processing..." : "Approve / 批准"}
                        </Button>
                        <Button
                          disabled={processing}
                          variant="destructive"
                          onClick={() => void handleDecision("reject")}
                        >
                          Reject / 拒絕
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Waiting for the current step: {getApprovalStatusLabel(selectedRecord.approvalStatus)}.
                      You can review the application now. /
                      現正等待：{getApprovalStatusLabel(selectedRecord.approvalStatus)}。可先查閱申請內容。
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
