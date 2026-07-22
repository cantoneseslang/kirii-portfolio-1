"use client"

import { useRef, useState } from "react"
import { Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getCustomerPackageAcceptAttribute,
  type CustomerPackageFiles,
} from "@/lib/hk-new-customer-customer-package-import"
import { INTAKE_TEMPLATE_FILENAME } from "@/lib/hk-new-customer-intake-template"

type CustomerIntakeExcelImportProps = {
  onPackageImport: (files: File[]) => Promise<void>
  importing?: boolean
}

export function CustomerIntakeExcelImport({
  onPackageImport,
  importing = false,
}: CustomerIntakeExcelImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = "/api/hk-new-customer/intake-template"
    link.download = INTAKE_TEMPLATE_FILENAME
    link.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ""
    if (files.length === 0) return

    setError(null)
    try {
      await onPackageImport(files)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Failed to import customer files.")
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[#02315a]/20 bg-slate-50 p-4">
      <div>
        <div className="font-medium text-[#02315a]">
          Customer Excel (Parts 2–4) / 客戶問卷（Part 2–4）
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Download the questionnaire, then upload the filled Excel together with BR / CI / NAR1 scans (PDF or
          photos). The form auto-fills from both. /
          下載問卷後，可一次上載填好的 Excel 及 BR / CI / NAR1 掃描件（PDF 或照片），系統會自動填入表格。
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" className="gap-2" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Download Excel / 下載問卷
        </Button>
        <Button
          type="button"
          className="gap-2 bg-[#02315a] hover:bg-[#02315a]/90"
          disabled={importing}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {importing
            ? "Importing… / 匯入中…"
            : "Import Excel & documents / 匯入問卷及文件"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={getCustomerPackageAcceptAttribute()}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export type { CustomerPackageFiles }
