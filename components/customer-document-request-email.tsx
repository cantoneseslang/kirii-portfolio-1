"use client"

import { useMemo, useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AddressRegion } from "@/types/hk-new-customer"
import {
  buildHongKongCustomerRequestEmail,
  buildMacauCustomerRequestEmail,
} from "@/lib/hk-new-customer-customer-request-email"

type CustomerDocumentRequestEmailProps = {
  salesRepName?: string
  salesRepEmail?: string
}

function EmailTemplatePanel({
  emailText,
  onCopy,
  copied,
}: {
  emailText: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Copy and paste into your email to the customer. / 複製後貼到寄給客戶的電郵即可。
        </p>
        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onCopy}>
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied / 已複製" : "Copy / 複製"}
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 text-xs leading-relaxed text-foreground">
        {emailText}
      </pre>
    </div>
  )
}

export function CustomerDocumentRequestEmail({
  salesRepName,
  salesRepEmail,
}: CustomerDocumentRequestEmailProps) {
  const [copiedRegion, setCopiedRegion] = useState<AddressRegion | null>(null)

  const options = useMemo(
    () => ({ salesRepName, salesRepEmail }),
    [salesRepName, salesRepEmail],
  )

  const hkEmail = useMemo(() => buildHongKongCustomerRequestEmail(options), [options])
  const macauEmail = useMemo(() => buildMacauCustomerRequestEmail(options), [options])

  const copyEmail = async (region: AddressRegion, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedRegion(region)
      window.setTimeout(() => setCopiedRegion(null), 2000)
    } catch {
      window.prompt("Copy this email text / 請複製以下電郵內容：", text)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[#02315a]/15 bg-slate-50/80 p-4">
      <div>
        <div className="font-medium text-foreground">
          Customer Email Template / 客戶所需文件電郵範本
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Send this to the customer. Once they reply with the listed documents and information, you can
          complete the registration form. / 寄給客戶後，待對方回覆文件及公司資料，即可在本系統完成新客戶登記。
        </p>
      </div>

      <Tabs defaultValue="hong_kong">
        <TabsList className="grid h-auto w-full max-w-md grid-cols-2">
          <TabsTrigger value="hong_kong">Hong Kong / 香港</TabsTrigger>
          <TabsTrigger value="macau">Macau / 澳門</TabsTrigger>
        </TabsList>
        <TabsContent value="hong_kong" className="mt-3">
          <EmailTemplatePanel
            emailText={hkEmail}
            copied={copiedRegion === "hong_kong"}
            onCopy={() => void copyEmail("hong_kong", hkEmail)}
          />
        </TabsContent>
        <TabsContent value="macau" className="mt-3">
          <EmailTemplatePanel
            emailText={macauEmail}
            copied={copiedRegion === "macau"}
            onCopy={() => void copyEmail("macau", macauEmail)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
