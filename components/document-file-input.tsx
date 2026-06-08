"use client"

import { useId, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DocumentFileInputProps = {
  accept?: string
  value: File | null
  onChange: (file: File | null) => void
  className?: string
  id?: string
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
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="shrink-0 border-[#02315a] text-[#02315a]"
          onClick={() => inputRef.current?.click()}
        >
          Choose File / 選擇檔案
        </Button>
        <span className="truncate text-sm text-muted-foreground">
          {value ? value.name : "No file chosen / 未選擇檔案"}
        </span>
      </div>
    </div>
  )
}
