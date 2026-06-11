import { cn } from "@/lib/utils"

type NewFeatureBadgeProps = {
  className?: string
}

export function NewFeatureBadge({ className }: NewFeatureBadgeProps) {
  return (
    <span className={cn("new-feature-glow-badge", className)} aria-label="New feature" title="New">
      <span className="new-feature-glow-badge__content">NEW</span>
    </span>
  )
}
