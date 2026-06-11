"use client"

import { useMemo, useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AddressRegion } from "@/types/hk-new-customer"
import {
  buildHongKongCustomerRequestEmail,
  buildMacauCustomerRequestEmail,
  type CustomerRequestEmailCustomerType,
} from "@/lib/hk-new-customer-customer-request-email"

type CustomerDocumentRequestEmailProps = {
  salesRepName?: string
  salesRepEmail?: string
}

type EmailTemplateKey = `${CustomerRequestEmailCustomerType}_${AddressRegion}`

const EMAIL_TAB_LIST_CLASS =
  "grid h-auto w-full grid-cols-1 gap-2 rounded-md bg-muted p-1.5 sm:max-w-lg sm:grid-cols-2"

const EMAIL_TAB_TRIGGER_CLASS =
  "h-auto min-h-11 whitespace-normal px-3 py-2.5 text-center text-xs leading-snug sm:text-sm"

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

function RegionEmailTabs({
  customerType,
  salesRepName,
  salesRepEmail,
  copiedKey,
  onCopy,
}: {
  customerType: CustomerRequestEmailCustomerType
  salesRepName?: string
  salesRepEmail?: string
  copiedKey: EmailTemplateKey | null
  onCopy: (key: EmailTemplateKey, text: string) => void
}) {
  const options = useMemo(
    () => ({ salesRepName, salesRepEmail, customerType }),
    [salesRepName, salesRepEmail, customerType],
  )

  const hkEmail = useMemo(() => buildHongKongCustomerRequestEmail(options), [options])
  const macauEmail = useMemo(() => buildMacauCustomerRequestEmail(options), [options])

  return (
    <Tabs defaultValue="hong_kong">
      <TabsList className={EMAIL_TAB_LIST_CLASS}>
        <TabsTrigger value="hong_kong" className={EMAIL_TAB_TRIGGER_CLASS}>
          Hong Kong / 香港
        </TabsTrigger>
        <TabsTrigger value="macau" className={EMAIL_TAB_TRIGGER_CLASS}>
          Macau / 澳門
        </TabsTrigger>
      </TabsList>
      <TabsContent value="hong_kong" className="mt-3">
        <EmailTemplatePanel
          emailText={hkEmail}
          copied={copiedKey === `${customerType}_hong_kong`}
          onCopy={() => onCopy(`${customerType}_hong_kong`, hkEmail)}
        />
      </TabsContent>
      <TabsContent value="macau" className="mt-3">
        <EmailTemplatePanel
          emailText={macauEmail}
          copied={copiedKey === `${customerType}_macau`}
          onCopy={() => onCopy(`${customerType}_macau`, macauEmail)}
        />
      </TabsContent>
    </Tabs>
  )
}

export function CustomerDocumentRequestEmail({
  salesRepName,
  salesRepEmail,
}: CustomerDocumentRequestEmailProps) {
  const [copiedKey, setCopiedKey] = useState<EmailTemplateKey | null>(null)

  const copyEmail = async (key: EmailTemplateKey, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 2000)
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
          For new or existing customers. Once they reply with the listed documents and information, you can
          complete the registration form in this system. / 新客戶或現有客戶均可使用。待對方回覆文件及公司資料後，即可在本系統完成登記。
        </p>
      </div>

      <Tabs defaultValue="new">
        <TabsList className={EMAIL_TAB_LIST_CLASS}>
          <TabsTrigger value="new" className={EMAIL_TAB_TRIGGER_CLASS}>
            New Customer / 新客戶
          </TabsTrigger>
          <TabsTrigger value="existing" className={EMAIL_TAB_TRIGGER_CLASS}>
            Existing Customer / 現有客戶
          </TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="mt-3">
          <RegionEmailTabs
            customerType="new"
            salesRepName={salesRepName}
            salesRepEmail={salesRepEmail}
            copiedKey={copiedKey}
            onCopy={copyEmail}
          />
        </TabsContent>
        <TabsContent value="existing" className="mt-3">
          <RegionEmailTabs
            customerType="existing"
            salesRepName={salesRepName}
            salesRepEmail={salesRepEmail}
            copiedKey={copiedKey}
            onCopy={copyEmail}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
