"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocumentFileInput } from "@/components/document-file-input"
import {
  formatDocumentDateLabel,
  MANDATORY_DOCUMENT_DATE_RULES,
  validateDocumentDate,
} from "@/lib/hk-new-customer-document-validity"

type MandatoryDocumentSlotProps = {
  docKey: string
  labelEn: string
  labelZh: string
  file: File | null
  validityDate: string
  onFileChange: (file: File | null) => void
  onValidityDateChange: (value: string) => void
  showValidation?: boolean
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
}: MandatoryDocumentSlotProps) {
  const rule = MANDATORY_DOCUMENT_DATE_RULES[docKey]
  const dateValidation = validityDate ? validateDocumentDate(docKey, validityDate) : null
  const dateInvalid = showValidation && validityDate && dateValidation && !dateValidation.valid
  const dateValid = validityDate && dateValidation?.valid

  return (
    <div className="space-y-3 rounded-lg border border-[#02315a]/20 bg-slate-50/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-[#02315a]">
            {labelEn} <span className="text-red-600">*</span>
          </div>
          <div className="text-sm text-muted-foreground">{labelZh}</div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            file ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"
          }`}
        >
          {file ? "Uploaded / 已上載" : "Required / 必須上載"}
        </span>
      </div>

      <DocumentFileInput
        className="w-full max-w-md"
        value={file}
        onChange={onFileChange}
      />

      {rule && (
        <div className="space-y-2 max-w-md">
          <Label htmlFor={`validity-${docKey}`}>
            {formatDocumentDateLabel(docKey)} <span className="text-red-600">*</span>
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
          {showValidation && !validityDate && (
            <p className="text-xs text-red-700">
              Please enter the document date or validity. / 請填寫文件日期或有效期限。
            </p>
          )}
        </div>
      )}
    </div>
  )
}
