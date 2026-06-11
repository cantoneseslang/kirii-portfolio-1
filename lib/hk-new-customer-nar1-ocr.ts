import type { HkAddressArea, Nar1AddressParts, Nar1Director, Nar1DocumentValidity } from "@/types/hk-new-customer"
import { extractBrCoreNumber } from "@/lib/hk-new-customer-document-validity"
import { parseFlexibleDateToIso } from "@/lib/hk-new-customer-br-ocr"

export type Nar1OcrExtractResult = Partial<Nar1DocumentValidity>

const NAR1_OCR_PROMPT = `
You are OCR for a Hong Kong Annual Return (Form NAR1) from the Companies Registry.
The upload may be a multi-page scanned PDF with little or no embedded text.

Extract these fields and return STRICT JSON only (no markdown):
{
  "businessRegistrationNumber": "string or null",
  "companyNameEn": "string or null",
  "companyNameZh": "string or null",
  "madeUpToDate": "YYYY-MM-DD or null",
  "shareCapital": "string or null",
  "registeredOffice": {
    "flatFloorBlock": "string or null",
    "building": "string or null",
    "street": "string or null",
    "district": "string or null",
    "country": "string or null",
    "area": "hong_kong_island | kowloon | new_territories | null",
    "districtKey": "one of: central_and_western, wan_chai, eastern, southern, yau_tsim_mong, sham_shui_po, kowloon_city, wong_tai_sin, kwun_tong, north, tai_po, sha_tin, sai_kung, tsuen_wan, tuen_mun, yuen_long, kwai_tsing, islands | null"
  },
  "directors": [
    {
      "nameEnLast": "string or null",
      "nameEnFirst": "string or null",
      "nameEn": "string or null",
      "nameZh": "string or null",
      "flatFloorBlock": "string or null",
      "building": "string or null",
      "street": "string or null",
      "district": "string or null",
      "country": "string or null"
    }
  ]
}

Field mapping:
- 商業登記號碼 / Business Registration Number -> businessRegistrationNumber (8 digits only, e.g. 74804319)
- 公司名稱 / Company Name (English) -> companyNameEn
- 公司名稱 / Company Name (Chinese) -> companyNameZh
- 本申報表的結算日期 / Date to which this Return is Made Up -> madeUpToDate
- 股本 / Share Capital (amount with currency if shown) -> shareCapital
- 註冊辦事處地址 / Address of Registered Office (NOT director correspondence) -> registeredOffice
- Section 13 董事 Directors -> directors array (ALL natural-person directors listed)

Registered office address mapping:
- 室／樓／座等 / Flat/Floor/Block etc. -> flatFloorBlock
- 大廈 / Building -> building
- 街道／屋苑／地段／村等 / Street etc. -> street
- 區／市／省／州／郵遞區號等 / District etc. -> district
- 國家／地區 / Country/Region -> country
- Infer HK area from address: 港島 -> hong_kong_island, 九龍 -> kowloon, 新界 -> new_territories -> area
- districtKey: only when the form explicitly shows an official 18 HK district name in 區／市 (e.g. 西貢區 / Sai Kung). Do NOT infer district from village, street, or building names.

Director address mapping (Correspondence Address / 通訊地址 only):
- Same field names as registeredOffice for each director row

Director name mapping:
- 姓氏 / Surname -> nameEnLast
- 名字 / Other Names -> nameEnFirst
- nameEn: combine surname and other names (e.g. SAKON HIROKI)

Rules:
- Convert dates to YYYY-MM-DD.
- businessRegistrationNumber: main 8-digit number only, no branch suffix.
- Include every director (自然人) with name and correspondence address.
- registeredOffice is the company registered address on the form, separate from director addresses.
- If a field is unreadable, use null. directors may be empty array if none found.
- Read all pages to find company details, registered office, and all directors.
`.trim()

function normalizeOcrArea(value: unknown): HkAddressArea | undefined {
  if (value === "hong_kong_island" || value === "kowloon" || value === "new_territories") {
    return value
  }
  return undefined
}

function normalizeAddressParts(raw: unknown): Nar1AddressParts | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const record = raw as Record<string, unknown>
  const flatFloorBlock = typeof record.flatFloorBlock === "string" ? record.flatFloorBlock.trim() : ""
  const building = typeof record.building === "string" ? record.building.trim() : ""
  const street = typeof record.street === "string" ? record.street.trim() : ""
  const district = typeof record.district === "string" ? record.district.trim() : ""
  const country = typeof record.country === "string" ? record.country.trim() : ""
  const area = normalizeOcrArea(record.area)
  const districtKey = typeof record.districtKey === "string" ? record.districtKey.trim() : undefined

  if (!flatFloorBlock && !building && !street && !district && !country && !area && !districtKey) {
    return undefined
  }

  return { flatFloorBlock, building, street, district, country, area, districtKey }
}

function normalizeDirector(raw: unknown): Nar1Director | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  const nameEnLast = typeof record.nameEnLast === "string" ? record.nameEnLast.trim() : ""
  const nameEnFirst = typeof record.nameEnFirst === "string" ? record.nameEnFirst.trim() : ""
  const nameEnRaw = typeof record.nameEn === "string" ? record.nameEn.trim() : ""
  const nameZh = typeof record.nameZh === "string" ? record.nameZh.trim() : ""
  const flatFloorBlock = typeof record.flatFloorBlock === "string" ? record.flatFloorBlock.trim() : ""
  const building = typeof record.building === "string" ? record.building.trim() : ""
  const street = typeof record.street === "string" ? record.street.trim() : ""
  const district = typeof record.district === "string" ? record.district.trim() : ""
  const country = typeof record.country === "string" ? record.country.trim() : ""

  const nameEn =
    nameEnRaw ||
    [nameEnLast, nameEnFirst].filter(Boolean).join(" ") ||
    nameZh

  if (!nameEn && !nameZh) return null

  return {
    nameEn,
    nameEnFirst: nameEnFirst || undefined,
    nameEnLast: nameEnLast || undefined,
    nameZh: nameZh || undefined,
    flatFloorBlock,
    building,
    street,
    district,
    country,
  }
}

export function normalizeNar1OcrResult(raw: unknown): Nar1OcrExtractResult {
  if (!raw || typeof raw !== "object") return { directors: [] }
  const record = raw as Record<string, unknown>
  const directors = Array.isArray(record.directors)
    ? record.directors
        .map(normalizeDirector)
        .filter((director): director is Nar1Director => Boolean(director))
    : []

  return {
    businessRegistrationNumber:
      typeof record.businessRegistrationNumber === "string"
        ? extractBrCoreNumber(record.businessRegistrationNumber.trim()) || undefined
        : undefined,
    companyNameEn:
      typeof record.companyNameEn === "string" ? record.companyNameEn.trim() : undefined,
    companyNameZh:
      typeof record.companyNameZh === "string" ? record.companyNameZh.trim() : undefined,
    madeUpToDate: parseFlexibleDateToIso(record.madeUpToDate) || undefined,
    shareCapital: typeof record.shareCapital === "string" ? record.shareCapital.trim() : undefined,
    registeredOffice: normalizeAddressParts(record.registeredOffice),
    directors,
  }
}

export async function extractNar1WithGemini(
  fileBytes: Buffer,
  mimeType: string,
): Promise<Nar1OcrExtractResult> {
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
              { text: NAR1_OCR_PROMPT },
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
  return normalizeNar1OcrResult(parsed)
}
