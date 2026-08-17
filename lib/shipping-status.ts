export const SHIPPING_STATUS_FOLDER_ID = "1gSi0LB532lEf_d97UL-KpVL02Bmuber4"

function folderDateKey(name?: string): string {
  const normalized = String(name || "")
    .normalize("NFKC")
    .replace(/[\u2010-\u2015\u2212\u30FC\uFF0D]/g, "-")
  const match = normalized.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/)
  if (!match) return ""
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
}

function folderSortValue(item: { name?: string; createdTime?: string; modifiedTime?: string }): number {
  const dateKey = folderDateKey(item.name)
  if (dateKey) return Date.parse(`${dateKey}T23:59:59Z`)
  const timestamp = item.createdTime || item.modifiedTime
  return timestamp ? Date.parse(timestamp) : 0
}

export function sortFoldersNewestFirst<T extends { name?: string; createdTime?: string; modifiedTime?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const value = folderSortValue(b) - folderSortValue(a)
    if (value !== 0) return value
    return String(b.name || "").localeCompare(String(a.name || ""), "en")
  })
}

export function isImageFile(file: { name?: string; mimeType?: string }): boolean {
  const mime = (file.mimeType || "").toLowerCase()
  if (mime.startsWith("image/")) return true
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|tif{1,2})$/i.test(file.name || "")
}
