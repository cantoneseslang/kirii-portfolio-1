import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type NewFeatureBadgeProps = {
  className?: string
}

export function NewFeatureBadge({ className }: NewFeatureBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-sm bg-[#02315a] px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white shadow-sm",
        className,
      )}
      aria-label="New feature"
      title="New"
    >
      <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
      <span>NEW</span>
    </span>
  )
}
