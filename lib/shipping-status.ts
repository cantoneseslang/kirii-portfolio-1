export const SHIPPING_STATUS_FOLDER_ID = "1gSi0LB532lEf_d97UL-KpVL02Bmuber4"

export function isImageFile(file: { name?: string; mimeType?: string }): boolean {
  const mime = (file.mimeType || "").toLowerCase()
  if (mime.startsWith("image/")) return true
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|tif{1,2})$/i.test(file.name || "")
}
