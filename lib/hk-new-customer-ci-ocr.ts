import type { CiDocumentValidity } from "@/types/hk-new-customer"
import { normalizeCiCertificateNumber } from "@/lib/hk-new-customer-document-validity"
import { parseFlexibleDateToIso } from "@/lib/hk-new-customer-br-ocr"

export type CiOcrExtractResult = Partial<CiDocumentValidity> & {
  companyNameEn?: string
  companyNameZh?: string
}

const CI_OCR_PROMPT = `
You are OCR for a Hong Kong Certificate of Incorporation (CI) from the Companies Registry.
The upload may be a scanned PDF or image with little or no embedded text.

Extract these fields and return STRICT JSON only (no markdown):
{
  "certificateNumber": "string or null",
  "issueDate": "YYYY-MM-DD or null",
  "companyNameEn": "string or null",
  "companyNameZh": "string or null"
}

Field mapping on the certificate:
- Top-left 編號 / No. -> certificateNumber (digits only, e.g. 3228132)
- Issued at Hong Kong on [date] / 本證明書於...發出 -> issueDate
- Company name in the certificate body (English) -> companyNameEn
- Company name in Chinese if shown -> companyNameZh

Rules:
- Convert DD/MM/YYYY, "31 January 2023", or Chinese date formats to YYYY-MM-DD.
- certificateNumber: digits only from the No. field in the top-left corner.
- If a field is unreadable, use null.
`.trim()

export function normalizeCiOcrResult(raw: unknown): CiOcrExtractResult {
  if (!raw || typeof raw !== "object") return {}
  const record = raw as Record<string, unknown>
  const certificateNumber =
    typeof record.certificateNumber === "string"
      ? normalizeCiCertificateNumber(record.certificateNumber.trim())
      : ""
  return {
    certificateNumber: certificateNumber || undefined,
    issueDate: parseFlexibleDateToIso(record.issueDate) || undefined,
    companyNameEn:
      typeof record.companyNameEn === "string" ? record.companyNameEn.trim() : undefined,
    companyNameZh:
      typeof record.companyNameZh === "string" ? record.companyNameZh.trim() : undefined,
  }
}

export async function extractCiCertificateWithGemini(
  fileBytes: Buffer,
  mimeType: string,
): Promise<CiOcrExtractResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not available in this environment. Add it to Vercel (Production + Development) or .env.local for local testing.",
    )
  }

  const model = "gemini-2.5-flash"
  const base64 = fileBytes.toString("base64")
  const resolvedMime =
    mimeType ||
    (fileBytes.slice(0, 4).toString("utf8") === "%PDF" ? "application/pdf" : "image/jpeg")

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: CI_OCR_PROMPT },
              {
                inline_data: {
                  mime_type: resolvedMime,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    if (body.includes("User location is not supported")) {
      throw new Error(
        "Gemini OCR is unavailable from this server region. Deploy to Vercel Production or enter certificate details manually.",
      )
    }
    throw new Error(`Gemini OCR failed: ${res.status} ${body}`)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text || typeof text !== "string") {
    throw new Error("Gemini OCR returned empty content")
  }

  const parsed = JSON.parse(text)
  return normalizeCiOcrResult(parsed)
}
