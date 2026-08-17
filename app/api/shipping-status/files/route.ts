import { google } from "googleapis"
import { NextResponse } from "next/server"
import { getOAuth2Client } from "@/lib/drive-server"
import { requireCardAccessApi } from "@/lib/portfolio-access"
import { SHIPPING_STATUS_FOLDER_ID, sortFoldersNewestFirst } from "@/lib/shipping-status"

export async function GET(req: Request) {
  const access = await requireCardAccessApi("shipping_status", req)
  if (!access.ok) return access.response

  const folderId = new URL(req.url).searchParams.get("folderId") || SHIPPING_STATUS_FOLDER_ID

  try {
    const drive = google.drive({ version: "v3", auth: getOAuth2Client() })
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id,name,mimeType,size,modifiedTime,createdTime)",
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    const items = response.data.files || []
    const folders = sortFoldersNewestFirst(
      items.filter((item) => item.mimeType === "application/vnd.google-apps.folder"),
    )
    const files = items.filter((item) => item.mimeType !== "application/vnd.google-apps.folder")

    return NextResponse.json({
      success: true,
      folderId,
      folders,
      files,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Drive folder"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
