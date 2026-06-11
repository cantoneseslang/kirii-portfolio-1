import { NextResponse } from "next/server"
import { extractCiCertificateWithGemini } from "@/lib/hk-new-customer-ci-ocr"

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
    const file = formData.get("ciFile")
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, message: "ciFile is required" }, { status: 400 })
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
    const data = await extractCiCertificateWithGemini(bytes, resolvedMime)

    if (!data.issueDate && !data.certificateNumber && !data.certificateCompanyNameEn) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not read CI certificate fields from this scan. Please enter manually.",
          data,
        },
        { status: 422 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "CI certificate scanned successfully.",
      data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "CI OCR failed"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
