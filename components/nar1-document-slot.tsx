"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DocumentFileInput } from "@/components/document-file-input"
import { DocumentCrossCheckBanner } from "@/components/document-cross-check-banner"
import type { Nar1Director, Nar1DocumentValidity } from "@/types/hk-new-customer"
import {
  checkNar1BrAgainstBrCertificate,
  extractBrCoreNumber,
  formatDocumentDateLabel,
  MANDATORY_DOCUMENT_DATE_RULES,
  validateNar1Document,
} from "@/lib/hk-new-customer-document-validity"

const EMPTY_DIRECTOR: Nar1Director = {
  nameEn: "",
  nameZh: "",
  flatFloorBlock: "",
  building: "",
  street: "",
  district: "",
  country: "",
}

type Nar1DocumentSlotProps = {
  labelEn: string
  labelZh: string
  formBrNumber: string
  formCompanyNameEn: string
  brCertificateBrNumber: string
  file: File | null
  validity: Nar1DocumentValidity
  onFileChange: (file: File | null) => void
  onValidityChange: (value: Nar1DocumentValidity) => void
  onFormBrNumberSuggest?: (coreBrNumber: string) => void
  onFormCompanyNameSuggest?: (companyNameEn: string) => void
  onScanAutofill?: (validity: Nar1DocumentValidity) => void
  showValidation?: boolean
}

export function Nar1DocumentSlot({
  labelEn,
  labelZh,
  formBrNumber,
  formCompanyNameEn,
  brCertificateBrNumber,
  file,
  validity,
  onFileChange,
  onValidityChange,
  onFormBrNumberSuggest,
  onFormCompanyNameSuggest,
  onScanAutofill,
  showValidation = false,
}: Nar1DocumentSlotProps) {
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrMessage, setOcrMessage] = useState<string | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)

  const rule = MANDATORY_DOCUMENT_DATE_RULES.nar1
  const validation = validateNar1Document(
    validity,
    formBrNumber,
    formCompanyNameEn,
    brCertificateBrNumber,
  )
  const hasCoreFields =
    Boolean(validity.madeUpToDate) &&
    Boolean(validity.businessRegistrationNumber.trim()) &&
    Boolean(validity.companyNameEn.trim()) &&
    Boolean(validity.shareCapital.trim()) &&
    validity.directors.length > 0

  const nar1BrCrossCheck = useMemo(
    () =>
      checkNar1BrAgainstBrCertificate(validity.businessRegistrationNumber, brCertificateBrNumber),
    [validity.businessRegistrationNumber, brCertificateBrNumber],
  )

  const runOcr = async (targetFile: File) => {
    setOcrLoading(true)
    setOcrMessage(null)
    setOcrError(null)
    try {
      const formData = new FormData()
      formData.append("nar1File", targetFile)
      const response = await fetch("/api/hk-new-customer/nar1-ocr", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to scan NAR1")
      }

      const extracted = result.data || {}
      const coreBrNumber = extractBrCoreNumber(extracted.businessRegistrationNumber || "")
      const nextValidity: Nar1DocumentValidity = {
        madeUpToDate: extracted.madeUpToDate || validity.madeUpToDate,
        businessRegistrationNumber: coreBrNumber || validity.businessRegistrationNumber,
        companyNameEn: extracted.companyNameEn || validity.companyNameEn,
        companyNameZh: extracted.companyNameZh || validity.companyNameZh,
        shareCapital: extracted.shareCapital || validity.shareCapital,
        registeredOffice: extracted.registeredOffice || validity.registeredOffice,
        directors:
          extracted.directors?.length > 0 ? extracted.directors : validity.directors,
      }
      onValidityChange(nextValidity)
      if (coreBrNumber) onFormBrNumberSuggest?.(coreBrNumber)
      if (extracted.companyNameEn) onFormCompanyNameSuggest?.(extracted.companyNameEn)
      onScanAutofill?.(nextValidity)
      setOcrMessage("Scanned from NAR1 / 已從周年申報表自動讀取（可手動修正）")
    } catch (scanError) {
      const message =
        scanError instanceof Error ? scanError.message : "Failed to scan NAR1 / 掃描失敗，請手動輸入"
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

  const updateDirector = (index: number, field: keyof Nar1Director, value: string) => {
    const nextDirectors = [...validity.directors]
    nextDirectors[index] = { ...nextDirectors[index], [field]: value }
    onValidityChange({ ...validity, directors: nextDirectors })
  }

  const addDirector = () => {
    onValidityChange({ ...validity, directors: [...validity.directors, { ...EMPTY_DIRECTOR }] })
  }

  const removeDirector = (index: number) => {
    onValidityChange({
      ...validity,
      directors: validity.directors.filter((_, i) => i !== index),
    })
  }

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

      <DocumentFileInput className="w-full max-w-md" value={file} onChange={handleFileChange} />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!file || ocrLoading}
          onClick={() => file && void runOcr(file)}
        >
          {ocrLoading ? "Scanning..." : "Scan NAR1 / 掃描申報表"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Reads BR, company, made-up-to date, share capital and directors / 讀取 BR、公司、結算日期、股本及董事
        </span>
      </div>

      {ocrLoading && (
        <p className="text-xs text-muted-foreground">Reading NAR1 with OCR... / 正在讀取周年申報表...</p>
      )}
      {ocrMessage && <p className="text-xs text-green-700">{ocrMessage}</p>}
      {ocrError && <p className="text-xs text-red-700">{ocrError}</p>}

      <div className="grid gap-3 md:grid-cols-2 max-w-3xl">
        <div className="space-y-2">
          <Label htmlFor="nar1-br-number">
            Business Registration No. / 商業登記號碼
          </Label>
          <Input
            id="nar1-br-number"
            value={validity.businessRegistrationNumber}
            placeholder="10955344"
            onChange={(event) =>
              onValidityChange({
                ...validity,
                businessRegistrationNumber: extractBrCoreNumber(event.target.value),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Must match BR certificate and Part 2 (8-digit core) / 須與 BR 證件及 Part 2
            商業登記號碼一致
          </p>
          <DocumentCrossCheckBanner
            check={nar1BrCrossCheck}
            matchTextEn="Matches BR certificate"
            matchTextZh="與 BR 證件一致"
            mismatchTextEn="Does not match BR certificate"
            mismatchTextZh="與 BR 證件不一致"
            scannedLabelEn="NAR1 scan"
            scannedLabelZh="NAR1 掃描"
            referenceLabelEn="BR certificate"
            referenceLabelZh="BR 證件"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nar1-made-up-to">
            {formatDocumentDateLabel("nar1")}
          </Label>
          <Input
            id="nar1-made-up-to"
            type="date"
            value={validity.madeUpToDate}
            onChange={(event) => onValidityChange({ ...validity, madeUpToDate: event.target.value })}
          />
          {rule && (
            <p className="text-xs text-muted-foreground">
              {rule.helperEn} / {rule.helperZh}
            </p>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nar1-company-name">
            Company Name / 公司名稱
          </Label>
          <Input
            id="nar1-company-name"
            value={validity.companyNameEn}
            onChange={(event) => onValidityChange({ ...validity, companyNameEn: event.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nar1-share-capital">
            Share Capital / 股本
          </Label>
          <Input
            id="nar1-share-capital"
            value={validity.shareCapital}
            placeholder="HKD 10,000"
            onChange={(event) => onValidityChange({ ...validity, shareCapital: event.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Directors / 董事</Label>
          <Button type="button" variant="outline" size="sm" onClick={addDirector}>
            Add Director / 新增董事
          </Button>
        </div>

        {validity.directors.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Scan NAR1 or add directors manually / 掃描申報表或手動新增董事
          </p>
        )}

        {validity.directors.map((director, index) => (
          <div key={index} className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">
                Director {index + 1} / 董事 {index + 1}
              </div>
              {validity.directors.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeDirector(index)}>
                  Remove / 移除
                </Button>
              )}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                placeholder="Name (English) / 英文姓名"
                value={director.nameEn}
                onChange={(event) => updateDirector(index, "nameEn", event.target.value)}
              />
              <Input
                placeholder="Name (Chinese) / 中文姓名"
                value={director.nameZh || ""}
                onChange={(event) => updateDirector(index, "nameZh", event.target.value)}
              />
              <Input
                placeholder="Flat/Floor/Block / 室／樓／座等"
                value={director.flatFloorBlock}
                onChange={(event) => updateDirector(index, "flatFloorBlock", event.target.value)}
              />
              <Input
                placeholder="Building / 大廈"
                value={director.building}
                onChange={(event) => updateDirector(index, "building", event.target.value)}
              />
              <Input
                placeholder="Street / 街道"
                value={director.street}
                onChange={(event) => updateDirector(index, "street", event.target.value)}
              />
              <Input
                placeholder="District / 區"
                value={director.district}
                onChange={(event) => updateDirector(index, "district", event.target.value)}
              />
              <Input
                placeholder="Country/Region / 國家／地區"
                value={director.country}
                onChange={(event) => updateDirector(index, "country", event.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {hasCoreFields && validation.valid && (
        <p className="text-xs text-green-700">{validation.messageEn}</p>
      )}
      {hasCoreFields && !validation.valid && (
        <p className="text-xs text-red-700">
          {validation.messageEn} / {validation.messageZh}
        </p>
      )}
      {showValidation && Boolean(file) && !hasCoreFields && (
        <p className="text-xs text-red-700">
          Please complete all NAR1 fields. / 請填寫周年申報表上的全部資料。
        </p>
      )}
    </div>
  )
}
