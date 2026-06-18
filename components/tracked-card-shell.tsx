"use client"

import type { ReactNode } from "react"
import type { CardPermissionKey } from "@/lib/card-permissions"
import { trackCardClick } from "@/lib/track-activity"

interface TrackedCardShellProps {
  cardKey: CardPermissionKey
  children: ReactNode
}

export function TrackedCardShell({ cardKey, children }: TrackedCardShellProps) {
  return (
    <div
      onClickCapture={() => {
        trackCardClick(cardKey)
      }}
    >
      {children}
    </div>
  )
}
