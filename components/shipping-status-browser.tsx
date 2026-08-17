"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, ChevronRight, Eye, FolderOpen, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PDFPreviewModal } from "@/components/pdf-preview-modal"
import { isImageFile, sortFoldersNewestFirst } from "@/lib/shipping-status"

type PreviewState = { fileId: string; fileName: string; image: boolean } | null

type DriveItem = {
  id: string
  name: string
  mimeType?: string
  size?: string
  modifiedTime?: string
}

type FolderNode = DriveItem & {
  contents?: {
    folders: DriveItem[]
    files: DriveItem[]
  }
}

export function ShippingStatusBrowser() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [folders, setFolders] = useState<FolderNode[]>([])
  const [files, setFiles] = useState<DriveItem[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<PreviewState>(null)

  const loadFolder = async (folderId?: string) => {
    const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : ""
    const res = await fetch(`/api/shipping-status/files${query}`, { cache: "no-store" })
    const data = await res.json()
    if (!data.success) throw new Error(data.message || "Failed to load")
    return {
      folders: sortFoldersNewestFirst((data.folders || []) as DriveItem[]),
      files: (data.files || []) as DriveItem[],
    }
  }

  const fetchRoot = async () => {
    setIsLoading(true)
    setError("")
    try {
      const data = await loadFolder()
      setFolders(data.folders)
      setFiles(data.files)
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchRoot()
  }, [])

  const updateFolderContents = (nodes: FolderNode[], folderId: string, contents: FolderNode["contents"]): FolderNode[] =>
    nodes.map((item) => {
      if (item.id === folderId) return { ...item, contents }
      if (!item.contents?.folders) return item
      return {
        ...item,
        contents: {
          ...item.contents,
          folders: updateFolderContents(item.contents.folders as FolderNode[], folderId, contents),
        },
      }
    })

  const toggleFolder = async (folder: FolderNode) => {
    const next = new Set(expandedFolders)
    if (next.has(folder.id)) {
      next.delete(folder.id)
      setExpandedFolders(next)
      return
    }

    next.add(folder.id)
    setExpandedFolders(next)
    if (folder.contents) return

    try {
      const data = await loadFolder(folder.id)
      setFolders((prev) => updateFolderContents(prev, folder.id, data))
    } catch {
      alert("子フォルダの読み込みに失敗しました")
    }
  }

  const renderFolders = (items: FolderNode[]) => (
    <div className="space-y-4">
      {sortFoldersNewestFirst(items).map((folder) => (
        <div key={folder.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded p-2 hover:bg-gray-100"
            onClick={() => void toggleFolder(folder)}
          >
            <div className="flex items-center space-x-2 min-w-0">
              {expandedFolders.has(folder.id) ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
              <FolderOpen className="h-5 w-5 text-blue-600 shrink-0" />
              <span className="font-medium truncate">{folder.name}</span>
            </div>
          </button>
          {expandedFolders.has(folder.id) && folder.contents && (
            <div className="mt-4 ml-6 border-l-2 border-gray-200 pl-4 space-y-4">
              {renderFolders(folder.contents.folders as FolderNode[])}
              {renderFiles(folder.contents.files)}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderFiles = (items: DriveItem[]) => {
    const images = items.filter(isImageFile)
    const others = items.filter((item) => !isImageFile(item))

    return (
      <div className="space-y-4">
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => setPreview({ fileId: file.id, fileName: file.name, image: true })}
                className="w-[calc(25%-0.6rem)] min-w-[120px] overflow-hidden rounded-lg border border-gray-200 bg-white text-left hover:shadow-md transition-shadow"
              >
                <img
                  src={`/api/shipping-status/file?id=${encodeURIComponent(file.id)}&thumb=1`}
                  alt={file.name}
                  className="w-full h-auto object-contain bg-gray-100"
                />
                <p className="truncate px-2 py-1.5 text-[11px] text-gray-700">{file.name}</p>
              </button>
            ))}
          </div>
        )}

        {others.map((file) => (
          <div key={file.id} className="p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="font-semibold break-all">{file.name}</h3>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setPreview({ fileId: file.id, fileName: file.name, image: false })}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full py-10 px-2 sm:px-4">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Auto-save shipping status</h1>
        <p className="text-muted-foreground mt-2">出貨自動監控紀錄</p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {error && (
        <div className="p-6 border rounded-lg bg-white text-center">
          <p className="text-lg font-semibold text-red-600">發生錯誤</p>
          <p className="text-sm mt-2">{error}</p>
          <Button onClick={() => void fetchRoot()} className="mt-4 bg-[#02315a] text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            重試
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {renderFolders(folders)}
          {renderFiles(files)}

          {folders.length === 0 && files.length === 0 && (
            <div className="p-6 border rounded-lg bg-white text-sm text-gray-600">
              このフォルダに写真はまだありません。
            </div>
          )}
        </div>
      )}

      {preview?.image ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <img
            src={`/api/shipping-status/file?id=${encodeURIComponent(preview.fileId)}`}
            alt={preview.fileName}
            className="max-h-[70vh] max-w-[50vw] rounded-lg object-contain"
          />
        </div>
      ) : (
        <PDFPreviewModal
          isOpen={Boolean(preview)}
          onClose={() => setPreview(null)}
          fileId={preview?.fileId || ""}
          fileName={preview?.fileName || ""}
        />
      )}
    </div>
  )
}
