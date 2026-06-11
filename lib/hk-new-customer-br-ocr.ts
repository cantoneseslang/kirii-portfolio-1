import type { BrDocumentValidity } from "@/types/hk-new-customer"

export type BrOcrExtractResult = Partial<BrDocumentValidity> & {
  companyNameEn?: string
  companyNameZh?: string
}

const BR_OCR_PROMPT = `
You are OCR for a Hong Kong Business Registration (BR) certificate.
The upload may be a scanned PDF or image with little or no embedded text.

Extract these fields and return STRICT JSON only (no markdown):
{
  "commencementDate": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "certificateBrNumber": "string or null",
  "companyNameEn": "string or null",
  "companyNameZh": "string or null"
}

Field mapping on the certificate:
- Date of Commencement / 生效日期 -> commencementDate
- Date of Expiry / 屆滿日期 -> expiryDate
- Business Registration Number / 商業登記號碼 / Registration Number -> certificateBrNumber

Rules:
- Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD.
- Use digits only for certificateBrNumber (keep branch suffix if shown, e.g. 12345678-000-01-23-0).
- If a field is unreadable, use null.
- Read all pages if needed; prefer the main certificate page with commencement/expiry dates.
`.trim()

export function parseFlexibleDateToIso(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const dmy = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (dmy) {
    const day = Number(dmy[1])
    const month = Number(dmy[2])
    const year = Number(dmy[3])
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function normalizeBrOcrResult(raw: unknown): BrOcrExtractResult {
  if (!raw || typeof raw !== "object") return {}
  const record = raw as Record<string, unknown>
  return {
    commencementDate: parseFlexibleDateToIso(record.commencementDate) || undefined,
    expiryDate: parseFlexibleDateToIso(record.expiryDate) || undefined,
    certificateBrNumber:
      typeof record.certificateBrNumber === "string"
        ? record.certificateBrNumber.trim()
        : undefined,
    companyNameEn:
      typeof record.companyNameEn === "string" ? record.companyNameEn.trim() : undefined,
    companyNameZh:
      typeof record.companyNameZh === "string" ? record.companyNameZh.trim() : undefined,
  }
}

export async function extractBrCertificateWithGemini(
  fileBytes: Buffer,
  mimeType: string,
): Promise<BrOcrExtractResult> {
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
              { text: BR_OCR_PROMPT },
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
  return normalizeBrOcrResult(parsed)
}
