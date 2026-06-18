"use client"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type AdminPermissionSwitchProps = React.ComponentProps<typeof Switch>

export function AdminPermissionSwitch({ className, ...props }: AdminPermissionSwitchProps) {
  return (
    <Switch
      {...props}
      className={cn(
        "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500",
        className,
      )}
    />
  )
}
