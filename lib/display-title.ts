export function resolveDisplayTitle(profile: {
  username?: string | null
  full_name?: string | null
  email?: string | null
}): string {
  const username = profile.username?.trim()
  const fullName = profile.full_name?.trim()
  const emailLocal = profile.email?.split("@")[0]?.trim()

  if (username && fullName && username.toLowerCase() !== fullName.toLowerCase()) {
    return username
  }

  if (emailLocal) {
    return emailLocal
  }

  return username || fullName || "—"
}
