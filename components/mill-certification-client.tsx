"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LocalPdfPreviewModal } from "@/components/local-pdf-preview-modal"
import { MILL_CERT_FILES, type MillCertFile } from "@/lib/mill-cert-files"

export function MillCertificationClient() {
  const [preview, setPreview] = useState<MillCertFile | null>(null)

  const handleDownload = (file: MillCertFile) => {
    const link = document.createElement("a")
    link.href = file.pdfPath
    link.download = file.downloadName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Mill Certification</h1>
        <p className="text-muted-foreground mt-2">原材料質量證明書</p>
      </div>

      <div className="grid gap-4">
        {MILL_CERT_FILES.map((file) => (
          <div
            key={file.pdfPath}
            className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl bg-[#f1f1f3] p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => setPreview(file)}
              className="relative shrink-0 w-20 h-28 overflow-hidden rounded-md border border-black/10 bg-white shadow-sm self-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#02315a]"
              aria-label={`Preview ${file.label}`}
            >
              <Image
                src={file.thumbPath}
                alt=""
                fill
                className="object-cover object-top"
                sizes="80px"
              />
            </button>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-[#02315a] break-all">
                {file.label}
              </h2>
              <p className="text-sm text-[#3c3852] mt-1">Click thumbnail or Preview to enlarge</p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-white"
                onClick={() => setPreview(file)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                className="bg-[#02315a] text-white hover:bg-[#02315a]/90"
                onClick={() => handleDownload(file)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      <LocalPdfPreviewModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        filePath={preview?.pdfPath ?? ""}
        fileName={preview?.downloadName ?? ""}
      />
    </div>
  )
}
