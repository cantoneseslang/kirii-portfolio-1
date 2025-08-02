"use client"

import { useState, useEffect } from "react"
import { X, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PDFPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
}

export function PDFPreviewModal({ isOpen, onClose, fileId, fileName }: PDFPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Google DriveのプレビューURLを生成
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`
  
  // ダウンロードURLを生成
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=AIzaSyAVhBDAR1knpgN_6ZnDKOy5HKVdqpm9_48`

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(previewUrl, '_blank')
  }

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold truncate flex-1 mr-4">{fileName}</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </Button>
          </div>
        </div>

        {/* PDF表示エリア */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={handleOpenInNewTab} variant="outline">
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}

          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setError("Failed to load PDF preview")
            }}
            title={fileName}
          />
        </div>
      </div>
    </div>
  )
} 