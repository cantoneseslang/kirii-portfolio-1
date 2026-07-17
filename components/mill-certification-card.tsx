"use client"

import React, { useState } from "react"
import Image from "next/image"
import { NewFeatureBadge } from "@/components/new-feature-badge"
import { LocalPdfPreviewModal } from "@/components/local-pdf-preview-modal"

const FILES = [
  {
    label: "0.8*1210-Z-120-S280GD+Z",
    pdfPath: "/pdfs/mill-cert/s280gd.pdf",
    thumbPath: "/pdfs/mill-cert/thumbs/s280gd.png",
    downloadName: "0.8x1210-Z-120-S280GD+Z.pdf",
  },
  {
    label: "0.8*1210-Z-120-S350GD+Z",
    pdfPath: "/pdfs/mill-cert/s350gd.pdf",
    thumbPath: "/pdfs/mill-cert/thumbs/s350gd.png",
    downloadName: "0.8x1210-Z-120-S350GD+Z.pdf",
  },
  {
    label: "0.4*97",
    pdfPath: "/pdfs/mill-cert/sx-0.4x97.pdf",
    thumbPath: "/pdfs/mill-cert/thumbs/sx-0.4x97.png",
    downloadName: "0.4x97.pdf",
  },
] as const

type MillFile = (typeof FILES)[number]

const MillCertificationCard = () => {
  const [preview, setPreview] = useState<MillFile | null>(null)

  return (
    <>
      <div className="w-full md:w-[420px] relative p-4 pb-10 rounded-xl bg-[#f1f1f3] shadow-sm transition-all hover:shadow-md">
        <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold transition-colors">
          <span>Mill Certification</span>
          <NewFeatureBadge />
        </h3>
        <p className="text-[#3c3852] text-sm mt-2">原材料質量證明書</p>

        <ul className="mt-4 space-y-2">
          {FILES.map((file) => (
            <li key={file.pdfPath}>
              <button
                type="button"
                onClick={() => setPreview(file)}
                className="w-full flex items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#02315a]"
              >
                <span className="relative shrink-0 w-10 h-14 overflow-hidden rounded border border-black/10 bg-white shadow-sm">
                  <Image
                    src={file.thumbPath}
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="40px"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#02315a] truncate">
                    {file.label}
                  </span>
                  <span className="block text-xs text-[#3c3852]/60 mt-0.5">
                    Preview / Download
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="absolute bottom-0 right-0 bg-[#02315a] p-1.5 rounded-tl-xl rounded-br-xl flex items-center justify-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            height={15}
            width={15}
          >
            <path
              fill="#fff"
              d="M13.4697 17.9697C13.1768 18.2626 13.1768 18.7374 13.4697 19.0303C13.7626 19.3232 14.2374 19.3232 14.5303 19.0303L20.3232 13.2374C21.0066 12.554 21.0066 11.446 20.3232 10.7626L14.5303 4.96967C14.2374 4.67678 13.7626 4.67678 13.4697 4.96967C13.1768 5.26256 13.1768 5.73744 13.4697 6.03033L18.6893 11.25H4C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75H18.6893L13.4697 17.9697Z"
            />
          </svg>
        </div>
      </div>

      <LocalPdfPreviewModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        filePath={preview?.pdfPath ?? ""}
        fileName={preview?.downloadName ?? ""}
      />
    </>
  )
}

export default MillCertificationCard
