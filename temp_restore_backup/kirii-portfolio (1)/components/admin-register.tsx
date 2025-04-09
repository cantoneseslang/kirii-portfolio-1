"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminRegister() {
  const router = useRouter()

  const goToAdmin = () => {
    router.push("/admin")
  }

  return (
    <Button variant="ghost" size="sm" className="gap-1" onClick={goToAdmin}>
      <ShieldAlert className="h-4 w-4" />
      <span className="sr-only md:not-sr-only md:inline">Admin</span>
    </Button>
  )
}

