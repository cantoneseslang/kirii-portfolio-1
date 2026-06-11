"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DocumentFileInput } from "@/components/document-file-input"
import type { BrDocumentValidity } from "@/types/hk-new-customer"
import { extractBrCoreNumber, validateBrDocument } from "@/lib/hk-new-customer-document-validity"

type BrDocumentSlotProps = {
  labelEn: string
  labelZh: string
  formBrNumber: string
  file: File | null
  validity: BrDocumentValidity
  onFileChange: (file: File | null) => void
  onValidityChange: (value: BrDocumentValidity) => void
  onFormBrNumberSuggest?: (coreBrNumber: string) => void
  showValidation?: boolean
}

export function BrDocumentSlot({
  labelEn,
  labelZh,
  formBrNumber,
  file,
  validity,
  onFileChange,
  onValidityChange,
  onFormBrNumberSuggest,
  showValidation = false,
}: BrDocumentSlotProps) {
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrMessage, setOcrMessage] = useState<string | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)

  const validation = validateBrDocument(validity, formBrNumber)
  const hasAllFields =
    Boolean(validity.commencementDate) &&
    Boolean(validity.expiryDate) &&
    Boolean(validity.certificateBrNumber.trim())

  const runOcr = async (targetFile: File) => {
    setOcrLoading(true)
    setOcrMessage(null)
    setOcrError(null)
    try {
      const formData = new FormData()
      formData.append("brFile", targetFile)
      const response = await fetch("/api/hk-new-customer/br-ocr", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to scan BR certificate")
      }

      const extracted = result.data || {}
      const coreBrNumber = extractBrCoreNumber(
        extracted.certificateBrNumber || validity.certificateBrNumber || formBrNumber,
      )
      onValidityChange({
        commencementDate: extracted.commencementDate || validity.commencementDate,
        expiryDate: extracted.expiryDate || validity.expiryDate,
        certificateBrNumber: coreBrNumber || validity.certificateBrNumber || formBrNumber,
      })
      if (coreBrNumber) {
        onFormBrNumberSuggest?.(coreBrNumber)
      }
      setOcrMessage("Scanned from certificate / 已從證件自動讀取（可手動修正）")
    } catch (scanError) {
      const message =
        scanError instanceof Error
          ? scanError.message
          : "Failed to scan certificate / 證件掃描失敗，請手動輸入"
      setOcrError(
        message.includes("not available in this environment")
          ? `${message} / 此環境未設定 GEMINI_API_KEY。Production 已設定後請重新部署，或手動輸入。`
          : message.includes("unavailable from this server region")
            ? `${message} / 本地環境可能無法使用 Gemini OCR。請在 Vercel Production 上測試，或手動輸入。`
            : message,
      )
    } finally {
      setOcrLoading(false)
    }
  }

  const handleFileChange = (nextFile: File | null) => {
    onFileChange(nextFile)
    setOcrMessage(null)
    setOcrError(null)
    if (nextFile) {
      void runOcr(nextFile)
    }
  }

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

      <DocumentFileInput className="w-full max-w-md" value={file} onChange={handleFileChange} />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!file || ocrLoading}
          onClick={() => file && void runOcr(file)}
        >
          {ocrLoading ? "Scanning..." : "Scan Certificate / 掃描證件"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Supports scanned PDF and images / 支援掃描 PDF 及圖片
        </span>
      </div>

      {ocrLoading && (
        <p className="text-xs text-muted-foreground">Reading certificate with OCR... / 正在讀取證件...</p>
      )}
      {ocrMessage && (
        <p className="text-xs text-green-700">{ocrMessage}</p>
      )}
      {ocrError && (
        <p className="text-xs text-red-700">{ocrError}</p>
      )}

      <div className="grid gap-3 md:grid-cols-2 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="br-commencement">
            Date of Commencement / 生效日期 <span className="text-red-600">*</span>
          </Label>
          <Input
            id="br-commencement"
            type="date"
            value={validity.commencementDate}
            onChange={(event) =>
              onValidityChange({ ...validity, commencementDate: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="br-expiry">
            Date of Expiry / 屆滿日期 <span className="text-red-600">*</span>
          </Label>
          <Input
            id="br-expiry"
            type="date"
            value={validity.expiryDate}
            onChange={(event) => onValidityChange({ ...validity, expiryDate: event.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="br-certificate-number">
            BR No. on Certificate / 證件商業登記號碼 <span className="text-red-600">*</span>
          </Label>
          <Input
            id="br-certificate-number"
            value={validity.certificateBrNumber}
            placeholder={formBrNumber || "8-digit BR number e.g. 10955344 / 8位商業登記號碼"}
            onChange={(event) =>
              onValidityChange({
                ...validity,
                certificateBrNumber: extractBrCoreNumber(event.target.value),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Main 8-digit BR number only (suffix not required) / 只需8位主號碼，無需 -000-03-26-0
            等後綴。Must match Part 1 when entered / 如 Part 1 已填寫須一致。Today must fall between
            commencement and expiry / 今天須在生效日期與屆滿日期之間。
          </p>
        </div>
      </div>

      {hasAllFields && validation.valid && (
        <p className="text-xs text-green-700">{validation.messageEn}</p>
      )}
      {hasAllFields && !validation.valid && (
        <p className="text-xs text-red-700">
          {validation.messageEn} / {validation.messageZh}
        </p>
      )}
      {showValidation && !hasAllFields && (
        <p className="text-xs text-red-700">
          Please complete all BR certificate fields. / 請填寫商業登記證上的全部資料。
        </p>
      )}
    </div>
  )
}
