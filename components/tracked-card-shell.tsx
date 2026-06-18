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
      className="w-full min-w-0"
      onPointerDown={() => {
        trackCardClick(cardKey)
      }}
    >
      {children}
    </div>
  )
}
