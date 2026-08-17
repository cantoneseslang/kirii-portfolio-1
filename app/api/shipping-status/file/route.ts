import { google } from "googleapis"
import { NextResponse } from "next/server"
import { getOAuth2Client } from "@/lib/drive-server"
import { requireCardAccessApi } from "@/lib/portfolio-access"

export async function GET(req: Request) {
  const access = await requireCardAccessApi("shipping_status", req)
  if (!access.ok) return access.response

  const url = new URL(req.url)
  const fileId = url.searchParams.get("id")
  const thumb = url.searchParams.get("thumb") === "1"
  if (!fileId) {
    return NextResponse.json({ success: false, message: "fileId is required" }, { status: 400 })
  }

  try {
    const auth = getOAuth2Client()
    const drive = google.drive({ version: "v3", auth })
    const meta = await drive.files.get({
      fileId,
      fields: "id,name,mimeType,thumbnailLink",
      supportsAllDrives: true,
    })

    if (thumb && meta.data.thumbnailLink) {
      const thumbRes = await fetch(meta.data.thumbnailLink)
      if (thumbRes.ok) {
        return new NextResponse(thumbRes.body, {
          headers: {
            "Content-Type": thumbRes.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "private, max-age=300",
          },
        })
      }
    }

    const media = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" },
    )
    const buffer = Buffer.from(media.data as ArrayBuffer)
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": meta.data.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(meta.data.name || "file")}"`,
        "Cache-Control": "private, max-age=300",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load file"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
