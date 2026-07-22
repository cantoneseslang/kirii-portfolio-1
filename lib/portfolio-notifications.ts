import { createClient } from "@supabase/supabase-js"

export type { ProductionOrderFormState } from "@/lib/production-order-form-state"

const DEFAULT_SUPABASE_URL = "https://mnshbcvrrzlumfomniim.supabase.co"

function getServiceRoleClient() {
  const url =
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim() || DEFAULT_SUPABASE_URL
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

export type PortfolioNotification = {
  id: string
  recipient_email: string
  title: string
  body: string | null
  payload: Record<string, unknown>
  source: string
  created_at: string
  acknowledged_at: string | null
}

export async function getPendingNotificationsForUser(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from("portfolio_notifications")
    .select("id, recipient_email, title, body, payload, source, created_at, acknowledged_at")
    .is("acknowledged_at", null)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message || "Failed to load pending notifications")
  }

  return (data || []).filter(
    (row) => row.recipient_email?.trim().toLowerCase() === normalizedEmail,
  ) as PortfolioNotification[]
}

/** Inbox/history: pending + acknowledged (newest first). */
export async function getNotificationInboxForUser(
  email: string,
  options?: { limit?: number },
) {
  const normalizedEmail = email.trim().toLowerCase()
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200)
  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from("portfolio_notifications")
    .select("id, recipient_email, title, body, payload, source, created_at, acknowledged_at")
    .order("created_at", { ascending: false })
    .limit(300)

  if (error) {
    throw new Error(error.message || "Failed to load notification inbox")
  }

  return (data || [])
    .filter((row) => row.recipient_email?.trim().toLowerCase() === normalizedEmail)
    .slice(0, limit) as PortfolioNotification[]
}

export async function acknowledgeNotificationForUser(notificationId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const supabase = getServiceRoleClient()

  const { data: existing, error: existingError } = await supabase
    .from("portfolio_notifications")
    .select("id, recipient_email")
    .eq("id", notificationId)
    .is("acknowledged_at", null)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message || "Failed to load notification")
  }

  if (!existing || existing.recipient_email.trim().toLowerCase() !== normalizedEmail) {
    throw new Error("Notification not found or already acknowledged")
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("portfolio_notifications")
    .update({ acknowledged_at: now })
    .eq("id", notificationId)
    .select("id, acknowledged_at")
    .maybeSingle()

  if (error) {
    throw new Error(error.message || "Failed to acknowledge notification")
  }

  if (!data) {
    throw new Error("Notification not found or already acknowledged")
  }

  return data
}
