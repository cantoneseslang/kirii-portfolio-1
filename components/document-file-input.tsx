"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DocumentFileInputProps = {
  accept?: string
  value: File | null
  onChange: (file: File | null) => void
  className?: string
  id?: string
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true
  return /\.(jpg|jpeg|png)$/i.test(file.name)
}

function isPdfFile(file: File): boolean {
  if (file.type === "application/pdf") return true
  return /\.pdf$/i.test(file.name)
}

function FilePreview({ file, previewUrl }: { file: File; previewUrl: string }) {
  if (isImageFile(file)) {
    return (
      <img
        src={previewUrl}
        alt={file.name}
        className="h-36 w-full rounded-md border bg-white object-contain"
      />
    )
  }

  if (isPdfFile(file)) {
    return (
      <iframe
        src={`${previewUrl}#page=1&view=FitH`}
        title={file.name}
        className="h-36 w-full rounded-md border bg-white"
      />
    )
  }

  return (
    <div className="flex h-36 w-full flex-col items-center justify-center rounded-md border bg-muted/20 px-3 text-center">
      <div className="text-sm font-medium text-[#02315a]">Document / 文件</div>
      <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{file.name}</div>
    </div>
  )
}

export function DocumentFileInput({
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  value,
  onChange,
  className,
  id,
}: DocumentFileInputProps) {
  const generatedId = useId()
  const inputId = id || generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          onChange(event.target.files?.[0] || null)
          event.currentTarget.value = ""
        }}
      />

      {!value ? (
        <Button
          type="button"
          variant="outline"
          className="w-fit border-[#02315a] text-[#02315a]"
          onClick={() => inputRef.current?.click()}
        >
          Choose File / 選擇檔案
        </Button>
      ) : (
        <div className="space-y-2">
          {previewUrl && <FilePreview file={value} previewUrl={previewUrl} />}
          <div className="truncate text-xs text-muted-foreground">{value.name}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#02315a] text-[#02315a]"
            onClick={() => inputRef.current?.click()}
          >
            Replace / 更換
          </Button>
        </div>
      )}
    </div>
  )
}
