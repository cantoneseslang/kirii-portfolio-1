const blockedEmailSet = new Set(["ricky@kirii.com.hk"])

export function isBlockedAuthEmail(email?: string | null): boolean {
  if (!email) return false
  return blockedEmailSet.has(email.toLowerCase())
}
