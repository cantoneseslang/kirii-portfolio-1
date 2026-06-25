"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DocumentFileInput } from "@/components/document-file-input"
import { DocumentCrossCheckBanner } from "@/components/document-cross-check-banner"
import type { CiDocumentValidity } from "@/types/hk-new-customer"
import {
  checkCiCompanyNameAgainstBr,
  formatDocumentDateLabel,
  MANDATORY_DOCUMENT_DATE_RULES,
  normalizeCiCertificateNumber,
  validateCiDocument,
} from "@/lib/hk-new-customer-document-validity"

type CiDocumentSlotProps = {
  labelEn: string
  labelZh: string
  brCertificateCompanyNameEn: string
  brCertificateCompanyNameZh: string
  file: File | null
  validity: CiDocumentValidity
  onFileChange: (file: File | null) => void
  onValidityChange: (value: CiDocumentValidity) => void
  onScanAutofill?: (issueDate?: string, companyNameZh?: string) => void
  showValidation?: boolean
}

export function CiDocumentSlot({
  labelEn,
  labelZh,
  brCertificateCompanyNameEn,
  brCertificateCompanyNameZh,
  file,
  validity,
  onFileChange,
  onValidityChange,
  onScanAutofill,
  showValidation = false,
}: CiDocumentSlotProps) {
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrMessage, setOcrMessage] = useState<string | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)

  const rule = MANDATORY_DOCUMENT_DATE_RULES.ci
  const validation = validateCiDocument(
    validity,
    brCertificateCompanyNameEn,
    brCertificateCompanyNameZh,
  )
  const hasAllFields =
    Boolean(validity.issueDate) &&
    Boolean(validity.certificateNumber.trim()) &&
    Boolean(validity.certificateCompanyNameEn.trim() || validity.certificateCompanyNameZh?.trim())

  const ciBrNameCrossCheck = useMemo(
    () =>
      checkCiCompanyNameAgainstBr(
        validity.certificateCompanyNameEn,
        validity.certificateCompanyNameZh,
        brCertificateCompanyNameEn,
        brCertificateCompanyNameZh,
      ),
    [
      validity.certificateCompanyNameEn,
      validity.certificateCompanyNameZh,
      brCertificateCompanyNameEn,
      brCertificateCompanyNameZh,
    ],
  )

  const runOcr = async (targetFile: File) => {
    setOcrLoading(true)
    setOcrMessage(null)
    setOcrError(null)
    try {
      const formData = new FormData()
      formData.append("ciFile", targetFile)
      const response = await fetch("/api/hk-new-customer/ci-ocr", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to scan CI certificate")
      }

      const extracted = result.data || {}
      onValidityChange({
        issueDate: extracted.issueDate || validity.issueDate,
        certificateNumber: normalizeCiCertificateNumber(
          extracted.certificateNumber || validity.certificateNumber,
        ),
        certificateCompanyNameEn:
          extracted.certificateCompanyNameEn || validity.certificateCompanyNameEn,
        certificateCompanyNameZh:
          extracted.certificateCompanyNameZh || validity.certificateCompanyNameZh,
      })
      onScanAutofill?.(
        extracted.issueDate || validity.issueDate,
        extracted.certificateCompanyNameZh || validity.certificateCompanyNameZh,
      )
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
          Reads No., center company name and issue date / 讀取編號、中央公司名稱及簽發日期
        </span>
      </div>

      {ocrLoading && (
        <p className="text-xs text-muted-foreground">Reading certificate with OCR... / 正在讀取證件...</p>
      )}
      {ocrMessage && <p className="text-xs text-green-700">{ocrMessage}</p>}
      {ocrError && <p className="text-xs text-red-700">{ocrError}</p>}

      <div className="grid gap-3 md:grid-cols-2 max-w-2xl">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ci-certificate-company-en">
            Company Name on Certificate (English) / 公司名稱 <span className="text-red-600">*</span>
          </Label>
          <Input
            id="ci-certificate-company-en"
            value={validity.certificateCompanyNameEn}
            placeholder="KIRII (Hong Kong) Limited"
            onChange={(event) =>
              onValidityChange({ ...validity, certificateCompanyNameEn: event.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            Center of CI certificate. Must match BR certificate name (English or Chinese, fuzzy) /
            證明書中央公司名稱，須與 BR 證件英文或中文公司名稱一致（容許 HK/Hong Kong、Ltd/Co. 等差異）
          </p>
          <DocumentCrossCheckBanner
            check={ciBrNameCrossCheck}
            matchTextEn="Matches BR certificate company name"
            matchTextZh="與 BR 證件公司名稱一致"
            mismatchTextEn="Does not match BR certificate company name"
            mismatchTextZh="與 BR 證件公司名稱不一致"
            scannedLabelEn="CI scan"
            scannedLabelZh="CI 掃描"
            referenceLabelEn="BR certificate"
            referenceLabelZh="BR 證件"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ci-certificate-company-zh">
            Company Name on Certificate (Chinese) / 中文名稱（如有）
          </Label>
          <Input
            id="ci-certificate-company-zh"
            value={validity.certificateCompanyNameZh || ""}
            onChange={(event) =>
              onValidityChange({ ...validity, certificateCompanyNameZh: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ci-certificate-number">
            Certificate No. (No. / 編號) <span className="text-red-600">*</span>
          </Label>
          <Input
            id="ci-certificate-number"
            value={validity.certificateNumber}
            placeholder="3228132"
            onChange={(event) =>
              onValidityChange({
                ...validity,
                certificateNumber: normalizeCiCertificateNumber(event.target.value),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ci-issue-date">
            {formatDocumentDateLabel("ci")} <span className="text-red-600">*</span>
          </Label>
          <Input
            id="ci-issue-date"
            type="date"
            value={validity.issueDate}
            onChange={(event) => onValidityChange({ ...validity, issueDate: event.target.value })}
          />
          {rule && (
            <p className="text-xs text-muted-foreground">
              {rule.helperEn} / {rule.helperZh}
            </p>
          )}
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
          Please complete all CI certificate fields. / 請填寫公司註冊證明書上的全部資料。
        </p>
      )}
    </div>
  )
}
