import { NextResponse } from "next/server"
import { extractNar1WithGemini } from "@/lib/hk-new-customer-nar1-ocr"

export const runtime = "nodejs"

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("nar1File")
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, message: "nar1File is required" }, { status: 400 })
    }

    const mimeType = file.type || "application/octet-stream"
    if (!ALLOWED_MIME_TYPES.has(mimeType) && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, message: "Unsupported file type. Use PDF, JPG, or PNG." },
        { status: 400 },
      )
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const resolvedMime = file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : mimeType
    const data = await extractNar1WithGemini(bytes, resolvedMime)

    if (
      !data.madeUpToDate &&
      !data.businessRegistrationNumber &&
      !data.companyNameEn &&
      !data.shareCapital &&
      !(data.directors && data.directors.length > 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not read NAR1 fields from this scan. Please enter manually.",
          data,
        },
        { status: 422 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "NAR1 scanned successfully.",
      data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "NAR1 OCR failed"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
