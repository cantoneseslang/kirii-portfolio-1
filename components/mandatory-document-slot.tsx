"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocumentFileInput } from "@/components/document-file-input"
import {
  formatDocumentDateLabel,
  MANDATORY_DOCUMENT_DATE_RULES,
  validateDocumentDate,
} from "@/lib/hk-new-customer-document-validity"
import {
  downloadRegistryExpenseClaim,
  formatRegistryFeeLine,
  REGISTRY_DOCUMENT_FEES,
  type RegistryDocumentFeeInfo,
} from "@/lib/hk-new-customer-registry-expense-claim"

type MandatoryDocumentSlotProps = {
  docKey: string
  labelEn: string
  labelZh: string
  file: File | null
  validityDate: string
  onFileChange: (file: File | null) => void
  onValidityDateChange: (value: string) => void
  showValidation?: boolean
  expenseClaimDocumentKey?: RegistryDocumentFeeInfo["documentKey"]
  applicantName?: string
  companyNameEn?: string
  companyNameZh?: string
  brNumber?: string
}

export function MandatoryDocumentSlot({
  docKey,
  labelEn,
  labelZh,
  file,
  validityDate,
  onFileChange,
  onValidityDateChange,
  showValidation = false,
  expenseClaimDocumentKey,
  applicantName,
  companyNameEn,
  companyNameZh,
  brNumber,
}: MandatoryDocumentSlotProps) {
  const rule = MANDATORY_DOCUMENT_DATE_RULES[docKey]
  const dateValidation = validityDate ? validateDocumentDate(docKey, validityDate) : null
  const dateInvalid = showValidation && validityDate && dateValidation && !dateValidation.valid
  const dateValid = validityDate && dateValidation?.valid

  return (
    <div className="space-y-3 rounded-lg border border-[#02315a]/20 bg-slate-50/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-[#02315a]">{labelEn}</div>
          <div className="text-sm text-muted-foreground">{labelZh}</div>
          <div className="text-xs text-muted-foreground mt-1">Optional / 可選</div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            file ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"
          }`}
        >
          {file ? "Uploaded / 已上載" : "Optional / 可選"}
        </span>
      </div>

      <DocumentFileInput
        className="w-full max-w-md"
        value={file}
        onChange={onFileChange}
      />

      {file && expenseClaimDocumentKey && (
        <div className="space-y-2 max-w-md rounded-md border border-[#02315a]/15 bg-white p-3">
          <p className="text-xs text-muted-foreground">
            {formatRegistryFeeLine(REGISTRY_DOCUMENT_FEES[expenseClaimDocumentKey])}
            {" · "}
            Applicant / 申請人：{applicantName?.trim() || "-"}
          </p>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              downloadRegistryExpenseClaim({
                applicantName: applicantName || "",
                companyNameEn,
                companyNameZh,
                brNumber,
                documentKey: expenseClaimDocumentKey,
              })
            }
          >
            <Download className="h-4 w-4" />
            Claim Reimbursement / 請求報銷
          </Button>
        </div>
      )}

      {rule && (
        <div className="space-y-2 max-w-md">
          <Label htmlFor={`validity-${docKey}`}>
            {formatDocumentDateLabel(docKey)}
          </Label>
          <Input
            id={`validity-${docKey}`}
            type="date"
            value={validityDate}
            onChange={(event) => onValidityDateChange(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {rule.helperEn} / {rule.helperZh}
          </p>
          {dateValid && (
            <p className="text-xs text-green-700">{dateValidation?.messageEn}</p>
          )}
          {dateInvalid && (
            <p className="text-xs text-red-700">
              {dateValidation?.messageEn} / {dateValidation?.messageZh}
            </p>
          )}
          {showValidation && Boolean(file) && !validityDate && (
            <p className="text-xs text-red-700">
              Please enter the document date or validity. / 請填寫文件日期或有效期限。
            </p>
          )}
        </div>
      )}
    </div>
  )
}
