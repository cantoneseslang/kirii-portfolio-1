"use client"

import { useEffect, useState } from "react"
import { X, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LocalPdfPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  filePath: string
  fileName: string
}

export function LocalPdfPreviewModal({
  isOpen,
  onClose,
  filePath,
  fileName,
}: LocalPdfPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
    }
  }, [isOpen, filePath])

  if (!isOpen) return null

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = filePath
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(filePath, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b gap-2">
          <h2 className="text-lg font-semibold truncate flex-1">{fileName}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 relative min-h-0">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02315a] mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}
          <iframe
            src={filePath}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            title={fileName}
          />
        </div>
      </div>
    </div>
  )
}
