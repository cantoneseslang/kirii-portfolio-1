export const SHIPPING_STATUS_FOLDER_ID = "1gSi0LB532lEf_d97UL-KpVL02Bmuber4"

function folderDateKey(name?: string): string {
  const match = String(name || "").match(/(\d{4}-\d{2}-\d{2})/)
  return match?.[1] || ""
}

export function sortFoldersNewestFirst<T extends { name?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = folderDateKey(a.name)
    const dateB = folderDateKey(b.name)
    if (dateA && dateB && dateA !== dateB) return dateB.localeCompare(dateA)
    if (dateA && !dateB) return -1
    if (!dateA && dateB) return 1
    return String(b.name || "").localeCompare(String(a.name || ""), "en")
  })
}

export function isImageFile(file: { name?: string; mimeType?: string }): boolean {
  const mime = (file.mimeType || "").toLowerCase()
  if (mime.startsWith("image/")) return true
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|tif{1,2})$/i.test(file.name || "")
}
