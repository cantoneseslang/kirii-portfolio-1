import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  buildApproverNotificationEmail,
  buildSubmitterApprovedEmail,
  buildSubmitterRejectedEmail,
  SAMPLE_NEW_CUSTOMER_REGISTRATION,
  SUBMIT_SUCCESS_MESSAGE,
  SUBMIT_SUCCESS_MESSAGE_EMAIL_FAILED,
} from "@/lib/hk-new-customer-email-content"
import { HK_NEW_CUSTOMER_APPROVERS } from "@/lib/hk-new-customer-approval"
import { NewCustomerApprovalPreview } from "@/components/dev/new-customer-approval-preview"

function EmailPreview({ subject, html }: { subject: string; html: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{subject}</CardTitle>
        <CardDescription>Local email preview / 本地電郵預覽</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="rounded-md border bg-white p-4 text-sm [&_a]:text-[#02315a] [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </CardContent>
    </Card>
  )
}

export default function NewCustomerWorkflowDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  const sample = SAMPLE_NEW_CUSTOMER_REGISTRATION
  const approvedSample = {
    ...sample,
    approvalStatus: "approved" as const,
    completedFormUrl: "#local-preview-docx",
    completedFormFileName: "Sample-Trading-Limited-new-customer.docx",
  }

  const approverEmail = buildApproverNotificationEmail(sample)
  const approvedEmail = buildSubmitterApprovedEmail(approvedSample)
  const rejectedEmail = buildSubmitterRejectedEmail(sample, "Please update bank proof and resubmit.")

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl space-y-8 py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#02315a]">New Customer Workflow — Local Review</h1>
          <p className="text-sm text-muted-foreground">
            Development-only page for verifying post-submit UI, approval emails, and approval screens on{" "}
            <code>http://localhost:3010</code>.
          </p>
        </div>

        <Card className="border-[#02315a]/30">
          <CardHeader>
            <CardTitle>1. Live app pages / 實際頁面</CardTitle>
            <CardDescription>Log in first, then open these routes in the same browser session.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="default">
              <Link href="/">Login / 登入</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/new-customer-setting">NewCustomer Setting</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/new-customer-setting/approvals">NewCustomer Approvals</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Test accounts / 測試帳號</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Use your Supabase login, or these configured approver emails after login:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sales Manager: {HK_NEW_CUSTOMER_APPROVERS.sales_managers.map((p) => p.email).join(", ")}</li>
              <li>General Manager: {HK_NEW_CUSTOMER_APPROVERS.general_manager.map((p) => p.email).join(", ")}</li>
            </ul>
            <p className="text-muted-foreground">
              After submit, the form shows the success banner below. Approvers see pending items on the Approvals page
              when real data exists in Blob storage.
            </p>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#02315a]">3. Post-submit page message / 送信後の画面メッセージ</h2>
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {SUBMIT_SUCCESS_MESSAGE}
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {SUBMIT_SUCCESS_MESSAGE_EMAIL_FAILED}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#02315a]">4. Email content / 電郵內容</h2>
          <EmailPreview subject={approverEmail.subject} html={approverEmail.html} />
          <EmailPreview subject={approvedEmail.subject} html={approvedEmail.html} />
          <EmailPreview subject={rejectedEmail.subject} html={rejectedEmail.html} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#02315a]">5. Approval screen preview / 承認画面プレビュー</h2>
          <p className="text-sm text-muted-foreground">
            Sample data — same layout as{" "}
            <Link href="/dashboard/new-customer-setting/approvals" className="text-[#02315a] underline">
              /dashboard/new-customer-setting/approvals
            </Link>
          </p>
          <NewCustomerApprovalPreview />
        </section>
      </div>
    </div>
  )
}
