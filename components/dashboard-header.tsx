import type React from "react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
  className?: string
  center?: boolean
}

export function DashboardHeader({ heading, text, children, className, center = false }: DashboardHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 pb-5", center && "text-center", className)}>
      <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
      {text && <p className="text-muted-foreground">{text}</p>}
      {children}
    </div>
  )
}
