import { NextResponse } from "next/server"
import { extractBrCertificateWithGemini } from "@/lib/hk-new-customer-br-ocr"

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
    const file = formData.get("brFile")
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, message: "brFile is required" }, { status: 400 })
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
    const data = await extractBrCertificateWithGemini(bytes, resolvedMime)

    if (
      !data.commencementDate &&
      !data.expiryDate &&
      !data.certificateBrNumber &&
      !data.certificateCompanyNameEn
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not read BR certificate fields from this scan. Please enter manually.",
          data,
        },
        { status: 422 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "BR certificate scanned successfully.",
      data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "BR OCR failed"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
