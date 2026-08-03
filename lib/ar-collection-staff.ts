/** Map AR "Recorded by" display names → portfolio login emails. */
export const AR_RECORDED_BY_EMAILS: Record<string, string> = {
  "Billy Lau": "billylau@kirii.com.hk",
  "Alex Wong": "alexwong@kirii.com.hk",
  "Grace Poon": "grace@kirii.com.hk",
  "Kami Kit": "kami@kirii.com.hk",
  "Billy Li": "billyli@kirii.com.hk",
  "Ivan Ip": "ivan@kirii.com.hk",
  "Anson Lam": "anson@kirii.com.hk",
}

export const AR_COLLECTION_SOURCE = "sales-dashboard-ar-collection"
export const AR_COLLECTION_CONFIRMED_SOURCE = "portfolio-ar-collection-confirmed"

export function resolveArRecordedByEmail(
  recordedBy?: string | null,
  recordedByEmail?: string | null,
): string {
  const fromPayload = recordedByEmail?.trim().toLowerCase() || ""
  if (fromPayload.includes("@")) return fromPayload

  const name = recordedBy?.trim() || ""
  if (!name) return ""
  return (AR_RECORDED_BY_EMAILS[name] || "").trim().toLowerCase()
}
