"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getApprovalStatusLabel } from "@/lib/hk-new-customer-approval"
import { SAMPLE_NEW_CUSTOMER_REGISTRATION } from "@/lib/hk-new-customer-email-content"
import { getAttachmentTypeLabel } from "@/types/hk-new-customer"

export function NewCustomerApprovalPreview() {
  const selectedRecord = SAMPLE_NEW_CUSTOMER_REGISTRATION
  const pendingItems = [selectedRecord]

  return (
    <div className="space-y-6 rounded-xl border border-dashed border-[#02315a]/30 bg-muted/10 p-4">
      <Card className="border-[#02315a]/20 bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">In-Portfolio Workflow / Portfolio 內審批流程</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>All approvals are handled here inside KIRII Employee Portfolio — email is notification only.</p>
          <p>所有審批均在此 Portfolio 內完成，電郵僅作通知。</p>
          <p>Sales Manager → Finance → General Manager</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Pending / 待審批</CardTitle>
            <CardDescription>Sales Manager / 營業經理 (preview)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="w-full rounded-lg border border-[#02315a] bg-muted/30 p-3 text-left"
              >
                <div className="font-medium">{item.companyNameEn}</div>
                <div className="text-sm text-muted-foreground">BR: {item.brNumber}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {getApprovalStatusLabel(item.approvalStatus)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review / 審批詳情</CardTitle>
            <CardDescription>Preview with sample registration data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <span className="font-medium">Company:</span> {selectedRecord.companyNameEn}
              </div>
              <div>
                <span className="font-medium">BR No.:</span> {selectedRecord.brNumber}
              </div>
              <div>
                <span className="font-medium">Sales Rep.:</span> {selectedRecord.salesRepName || "-"}
              </div>
              <div>
                <span className="font-medium">Submitter:</span> {selectedRecord.submitterEmail || "-"}
              </div>
              <div>
                <span className="font-medium">Status:</span> {getApprovalStatusLabel(selectedRecord.approvalStatus)}
              </div>
            </div>

            {selectedRecord.approvalHistory && selectedRecord.approvalHistory.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-medium">Approval History / 審批紀錄</div>
                <ul className="space-y-2 text-sm">
                  {selectedRecord.approvalHistory.map((entry, index) => (
                    <li key={`${entry.timestamp}-${index}`} className="rounded-md border p-2">
                      {entry.action} by {entry.approverName} ({entry.approverEmail}) ·{" "}
                      {new Date(entry.timestamp).toLocaleString("zh-HK")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRecord.attachments.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-medium">Attachments / 附件</div>
                <ul className="space-y-1 text-sm">
                  {selectedRecord.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <span className="text-[#02315a] underline">
                        {getAttachmentTypeLabel(attachment.documentType)} - {attachment.fileName}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="approval-comment-preview">
                Comment / 備註 (optional)
              </label>
              <Textarea
                id="approval-comment-preview"
                defaultValue=""
                placeholder="Optional comment for rejection or approval"
                readOnly
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button disabled>Approve / 批准 (preview)</Button>
              <Button disabled variant="destructive">
                Reject / 拒絕 (preview)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
