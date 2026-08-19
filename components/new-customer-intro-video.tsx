"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

const VIDEO_SRC = "/videos/new-customer-setting-guide.mp4"

export function NewCustomerIntroVideo() {
  const [open, setOpen] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const close = useCallback(() => {
    const video = videoRef.current
    if (video) {
      video.pause()
    }
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const video = videoRef.current
    const play = async () => {
      if (!video) return
      try {
        await video.play()
      } catch {
        video.muted = true
        try {
          await video.play()
        } catch {
          // Browser blocked autoplay; close button still works.
        }
      }
    }
    void play()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="NewCustomer Setting guide / 新客戶登記說明"
    >
      <button
        type="button"
        onClick={close}
        className="absolute right-4 top-4 z-[201] flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#02315a] shadow-lg hover:bg-white/90"
        aria-label="Close / 關閉"
      >
        <X className="h-6 w-6" />
      </button>
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        className="max-h-[90vh] max-w-[min(92vw,1100px)] rounded-lg bg-black shadow-2xl"
        autoPlay
        playsInline
        controls
        onEnded={close}
      />
    </div>
  )
}
