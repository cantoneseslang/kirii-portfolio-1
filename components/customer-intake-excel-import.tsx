"use client"

import { useRef, useState } from "react"
import { Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  INTAKE_TEMPLATE_FILENAME,
  parseIntakeFileBuffer,
  type HkNewCustomerIntakeImport,
} from "@/lib/hk-new-customer-intake-template"

type CustomerIntakeExcelImportProps = {
  onImport: (data: HkNewCustomerIntakeImport) => void
}

export function CustomerIntakeExcelImport({ onImport }: CustomerIntakeExcelImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = "/api/hk-new-customer/intake-template"
    link.download = INTAKE_TEMPLATE_FILENAME
    link.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setImporting(true)
    setError(null)
    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseIntakeFileBuffer(buffer)
      if (parsed.importedFieldCount === 0) {
        throw new Error("No answers found in column C. Please use the KIRII questionnaire template.")
      }
      onImport(parsed)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Failed to import Excel file.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[#02315a]/20 bg-slate-50 p-4">
      <div>
        <div className="font-medium text-[#02315a]">
          Part 2 Excel (Company Information) / Part 2 公司基本資料問卷
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          For delivery address and company details not on scanned documents. Part 1 uploads still
          auto-fill company name, BR, contacts, etc. /
          主要供客戶填寫送貨地址及文件上沒有的公司資料。Part 1 上載後仍會自動填入公司名、BR、聯絡人等。
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
          {importing ? "Importing… / 匯入中…" : "Import filled Excel / 匯入客戶問卷"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
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
