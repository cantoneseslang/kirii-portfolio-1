import { NextResponse } from "next/server"

export const runtime = "nodejs"

const WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"] as const
type Weekday = (typeof WEEKDAYS)[number]
type WeekMenuMap = Record<Weekday, string[]>
const DAILY_VEG_ITEMS = ["粟米炒蛋飯", "時菜雜菇飯"]

function emptyMenus(): WeekMenuMap {
  return {
    星期一: [],
    星期二: [],
    星期三: [],
    星期四: [],
    星期五: [],
    星期六: [],
    星期日: [],
  }
}

function normalizeMenus(input: unknown): WeekMenuMap {
  const base = emptyMenus()
  if (!input || typeof input !== "object") return base
  for (const day of WEEKDAYS) {
    const maybe = (input as Record<string, unknown>)[day]
    if (!Array.isArray(maybe)) continue
    base[day] = maybe
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .map((v) => v.replace(/[。．]+$/g, "").trim())
  }
  if (base["星期日"].length === 0 && base["星期六"].length > 0) {
    base["星期日"] = [...base["星期六"]]
  }
  return base
}

function withDailyVegItems(menus: WeekMenuMap): WeekMenuMap {
  const next = { ...menus }
  for (const day of WEEKDAYS) {
    const items = [...next[day]]
      .map((v) => v.trim())
      .filter(Boolean)
    for (const veg of DAILY_VEG_ITEMS) {
      if (!items.includes(veg)) items.push(veg)
    }
    next[day] = items
  }
  return next
}

function formatMenusForReview(menus: WeekMenuMap): string {
  return WEEKDAYS.map((day) => {
    const items = menus[day].map((item) => `"${item}"`).join(", ")
    return `"${day}"\n${items}`
  }).join("\n")
}

async function callGeminiVision(imageBase64: string, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is required")
  }

  const model = "gemini-2.5-flash"
  const prompt = `
You are OCR + structured extractor for a Cantonese lunch menu image.
Extract ONLY weekday menu items from menu boxes.
Ignore headers, phone numbers, date range, slogans, prices, and notes.

Return STRICT JSON only, no markdown:
{
  "星期一": ["...", "..."],
  "星期二": ["...", "..."],
  "星期三": ["...", "..."],
  "星期四": ["...", "..."],
  "星期五": ["...", "..."],
  "星期六": ["...", "..."],
  "星期日": ["...","..."]
}

Rules:
- Keep original Traditional Chinese text as accurately as possible.
- Remove numbering prefixes like 1. 2. etc.
- If image has "星期六/日", use same items for both Saturday and Sunday.
- Output only the JSON object.
`.trim()

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
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType || "image/png",
                  data: imageBase64,
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
    throw new Error(`Gemini request failed: ${res.status} ${body}`)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text || typeof text !== "string") {
    throw new Error("Gemini response is empty")
  }
  return text
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get("menuImage")
    if (!(image instanceof File)) {
      return NextResponse.json({ success: false, message: "menuImage is required" }, { status: 400 })
    }

    const bytes = Buffer.from(await image.arrayBuffer())
    const base64 = bytes.toString("base64")
    const raw = await callGeminiVision(base64, image.type || "image/png")

    const parsed = JSON.parse(raw)
    const menus = withDailyVegItems(normalizeMenus(parsed))
    const missing = WEEKDAYS.filter((day) => menus[day].length === 0)
    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `OCR result missing menu days: ${missing.join(", ")}`,
          raw,
        },
        { status: 422 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        menus,
        menuText: formatMenusForReview(menus),
        raw,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR failed"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

