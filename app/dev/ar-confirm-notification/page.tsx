import { notFound } from "next/navigation"
import { ArConfirmNotificationPreview } from "@/components/dev/ar-confirm-notification-preview"

export default function ArConfirmNotificationDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  return <ArConfirmNotificationPreview />
}
