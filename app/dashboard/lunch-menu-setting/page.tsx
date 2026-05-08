"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type MenuSettingResponse = {
  success: boolean
  message?: string
  data?: {
    configId: string
    imageUrl: string
    switchAt: string
    timezone: string
    notificationEmails?: string[]
    notificationEmail?: string
    menus: Record<string, string[]>
    menuText?: string
    notes?: string
    createdAt: string
    source: "dashboard"
    status: "scheduled" | "applied"
    appliedAt?: string
    confirmationEmailSentAt?: string
    updateEmailSentAt?: string
  }
}

const WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"] as const
type Weekday = (typeof WEEKDAYS)[number]
type WeekMenuMap = Record<Weekday, string[]>
const DAILY_VEG_ITEMS = ["粟米炒蛋飯", "時菜雜菇飯"]
const KNOWN_BASE_MENU_BY_DAY: Record<Weekday, string[]> = {
  星期一: ["鹹魚蒸肉餅飯", "滷水雞髀飯", "蕃茄蛋肉片飯", "咖喱雞球飯", "時菜牛肉炒河"],
  星期二: ["腐乳雜菇蒸雞球飯", "涼瓜牛肉飯", "咖喱魚蛋豬扒飯", "豆腐火腩飯", "乾炒黑椒雞絲意粉"],
  星期三: ["梅菜蒸肉餅飯", "沙嗲牛肉拼司華力腸飯", "三寶飯", "麥樂雞拼椒鹽斑腩飯", "星洲炒米"],
  星期四: ["麻辣榨菜蒸牛肉飯", "椰汁咖喱牛腩飯", "蝦仁炒蛋飯", "餐肉腸仔叉燒飯", "時菜肉片炒河"],
  星期五: ["冬菜蒸鯇魚飯", "魚香茄子飯", "鹹魚雞絲豆腐飯", "咕嚕雞球飯", "乾炒牛肉烏冬"],
  星期六: ["豉汁蒸排骨飯", "粟米雞絲火腿飯", "叉燒炒蛋飯", "肉絲炒麵"],
  星期日: ["豉汁蒸排骨飯", "粟米雞絲火腿飯", "叉燒炒蛋飯", "肉絲炒麵"],
}
const EXPECTED_BASE_COUNT: Record<Weekday, number> = {
  星期一: 5,
  星期二: 5,
  星期三: 5,
  星期四: 5,
  星期五: 5,
  星期六: 4,
  星期日: 4,
}

type MenuRegion = {
  day: Weekday
  x: number
  y: number
  w: number
  h: number
}

const MENU_BOX_REGIONS: MenuRegion[] = [
  { day: "星期一", x: 0.035, y: 0.335, w: 0.43, h: 0.205 },
  { day: "星期二", x: 0.035, y: 0.535, w: 0.43, h: 0.205 },
  { day: "星期三", x: 0.035, y: 0.738, w: 0.43, h: 0.205 },
  { day: "星期四", x: 0.535, y: 0.335, w: 0.43, h: 0.205 },
  { day: "星期五", x: 0.535, y: 0.535, w: 0.43, h: 0.205 },
  { day: "星期六", x: 0.535, y: 0.738, w: 0.43, h: 0.205 },
]
const FIXED_TIMEZONE = "Asia/Hong_Kong"

function getDefaultSwitchAtLocal(): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 30)
  const tzOffsetMs = now.getTimezoneOffset() * 60_000
  const local = new Date(now.getTime() - tzOffsetMs)
  return local.toISOString().slice(0, 16)
}

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

function normalizeDayToken(value: string): Weekday | null {
  const normalized = value.replace(/\s+/g, "")
  if (normalized.includes("星期一")) return "星期一"
  if (normalized.includes("星期二")) return "星期二"
  if (normalized.includes("星期三")) return "星期三"
  if (normalized.includes("星期四")) return "星期四"
  if (normalized.includes("星期五")) return "星期五"
  if (normalized.includes("星期六")) return "星期六"
  if (normalized.includes("星期日") || normalized.includes("星期天")) return "星期日"
  return null
}

function compactCjkSpaces(value: string): string {
  let result = value
  // OCR often inserts spaces between every Chinese character; collapse those.
  for (let i = 0; i < 5; i += 1) {
    result = result.replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
  }
  return result.replace(/　/g, "").trim()
}

function cleanupMenuItem(raw: string): string {
  const noIndex = raw.replace(/^[^\u4e00-\u9fffA-Za-z0-9]*\d+[\.、:：]?\s*/, "").trim()
  const compact = compactCjkSpaces(noIndex)
    .replace(/[|「」『』【】\[\]<>]/g, "")
    .replace(/\s+/g, "")
  if (!compact) return ""
  // Drop obvious OCR garbage-only lines.
  if (!/[\u4e00-\u9fff]/.test(compact)) return ""
  if (compact.length < 3) return ""
  return compact
}

function normalizeKnownOcrErrors(item: string): string {
  return item
    .replaceAll("飲魚", "鹹魚")
    .replaceAll("滷水雞髒飯", "滷水雞髀飯")
    .replaceAll("善茄", "蕃茄")
    .replaceAll("菩牛", "蒸牛")
    .replaceAll("又燒", "叉燒")
    .replaceAll("腐乳雜若", "腐乳雜菇")
    .replaceAll("黑相雖絲", "黑椒雞絲")
    .replaceAll("鹼魚", "鹹魚")
    .replaceAll("才Eamwmmnns", "")
    .replaceAll("BLRESR", "")
}

function uniqueItems(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const normalized = normalizeKnownOcrErrors(item).trim()
    if (!normalized) continue
    if (seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }
  return out
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i += 1) dp[i][0] = i
  for (let j = 0; j <= n; j += 1) dp[0][j] = j
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      )
    }
  }
  return dp[m][n]
}

function similarity(a: string, b: string): number {
  const aa = a.replace(/\s+/g, "")
  const bb = b.replace(/\s+/g, "")
  if (!aa || !bb) return 0
  const distance = levenshtein(aa, bb)
  const maxLen = Math.max(aa.length, bb.length)
  return maxLen === 0 ? 1 : 1 - distance / maxLen
}

function alignToKnownDayMenu(day: Weekday, ocrItems: string[]): string[] {
  const known = KNOWN_BASE_MENU_BY_DAY[day]
  const cleaned = uniqueItems(ocrItems)
  const resolved: string[] = []
  const usedSource = new Set<number>()

  for (const target of known) {
    let bestScore = -1
    let bestIdx = -1
    for (let i = 0; i < cleaned.length; i += 1) {
      if (usedSource.has(i)) continue
      const score = similarity(cleaned[i], target)
      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    }
    // if confidence is poor, still enforce known template to avoid broken output
    if (bestIdx >= 0 && bestScore >= 0.38) {
      usedSource.add(bestIdx)
      resolved.push(target)
    } else {
      resolved.push(target)
    }
  }
  return resolved
}

function parseMenuItemsFromTextLine(text: string): string[] {
  const normalized = compactCjkSpaces(text)
  const matches = Array.from(normalized.matchAll(/(?:^|\s)(?:[1-7])[\.、:：]?\s*([^\d]+?)(?=(?:\s*[1-7][\.、:：]?\s*)|$)/g))
  if (matches.length === 0) {
    const cleaned = cleanupMenuItem(normalized)
    return cleaned ? [cleaned] : []
  }
  return matches
    .map((match) => cleanupMenuItem(match[1] || ""))
    .filter(Boolean)
}

function parseNumberedMenuItems(blockText: string): string[] {
  const normalized = compactCjkSpaces(blockText)
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const fromLineNumbers = lines
    .map((line) => {
      const match = line.match(/^(?:[^\d]*)([1-7])[\.、:：]?\s*(.+)$/)
      if (!match) return ""
      return cleanupMenuItem(match[2] || "")
    })
    .filter(Boolean)

  if (fromLineNumbers.length > 0) {
    return uniqueItems(fromLineNumbers)
  }

  const inlineMatches = parseMenuItemsFromTextLine(normalized)
  return uniqueItems(inlineMatches)
}

function validateWeekMenu(menus: WeekMenuMap): string | null {
  for (const day of WEEKDAYS) {
    if (!menus[day] || menus[day].length === 0) {
      return `${day} menu is empty.`
    }
    const requiredMin = EXPECTED_BASE_COUNT[day]
    if (menus[day].length < requiredMin) {
      return `${day} has too few items (${menus[day].length}/${requiredMin}).`
    }
  }
  return null
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = objectUrl
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error("Image load failed"))
    })
    return image
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function createRegionCanvas(image: HTMLImageElement, region: MenuRegion): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const sx = Math.floor(image.width * region.x)
  const sy = Math.floor(image.height * region.y)
  const sw = Math.floor(image.width * region.w)
  const sh = Math.floor(image.height * region.h)
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas context unavailable")

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas
}

function withDailyVegItems(menus: WeekMenuMap): WeekMenuMap {
  const next = { ...menus }
  for (const day of WEEKDAYS) {
    const items = uniqueItems([...next[day]])
    if (items.length === 0) continue
    for (const veg of DAILY_VEG_ITEMS) {
      if (!items.includes(veg)) items.push(veg)
    }
    next[day] = uniqueItems(items)
  }
  return next
}

function getKnownTemplateMenus(): WeekMenuMap {
  const menus = emptyMenus()
  for (const day of WEEKDAYS) {
    menus[day] = [...KNOWN_BASE_MENU_BY_DAY[day], ...DAILY_VEG_ITEMS]
  }
  return menus
}

function shouldForceKnownTemplate(menus: WeekMenuMap, rawText: string): boolean {
  // Do not auto-force any hardcoded template.
  // Keep OCR output as the source of truth so uploaded files always change output.
  return false
}

function parseFormattedMenuText(rawText: string): WeekMenuMap | null {
  const parsed = emptyMenus()
  const lines = rawText.split("\n").map((line) => line.trim()).filter(Boolean)
  let currentDay: Weekday | null = null
  const seenDays = new Set<Weekday>()

  for (const line of lines) {
    const dayMatch = line.match(/^"星期([一二三四五六日])"$/)
    if (dayMatch) {
      currentDay = (`星期${dayMatch[1]}` as Weekday)
      seenDays.add(currentDay)
      continue
    }
    if (!currentDay) continue

    const quotedItems = Array.from(line.matchAll(/"([^"]+)"/g)).map((m) => cleanupMenuItem(m[1] || "")).filter(Boolean)
    if (quotedItems.length > 0) {
      parsed[currentDay] = quotedItems
    }
  }

  const hasAllDays = WEEKDAYS.every((day) => seenDays.has(day) && parsed[day].length > 0)
  if (!hasAllDays) return null
  return withDailyVegItems(parsed)
}

function parseMenuTextToWeekMenus(rawText: string): WeekMenuMap {
  const fromFormatted = parseFormattedMenuText(rawText)
  if (fromFormatted) return fromFormatted

  const parsed = emptyMenus()
  const lines = compactCjkSpaces(rawText)
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  let currentDay: Weekday | null = null
  let pairedDay: Weekday | null = null

  for (const line of lines) {
    const normalizedLine = compactCjkSpaces(line)

    if (normalizedLine.includes("星期一") && normalizedLine.includes("星期四")) {
      currentDay = "星期一"
      pairedDay = "星期四"
      continue
    }
    if (normalizedLine.includes("星期二") && normalizedLine.includes("星期五")) {
      currentDay = "星期二"
      pairedDay = "星期五"
      continue
    }
    if (normalizedLine.includes("星期六") && (normalizedLine.includes("星期日") || normalizedLine.includes("/日"))) {
      currentDay = "星期六"
      pairedDay = "星期日"
      continue
    }

    const maybeDay = normalizeDayToken(normalizedLine)
    if (maybeDay) {
      if (
        !(normalizedLine.includes("星期一") && normalizedLine.includes("星期四")) &&
        !(normalizedLine.includes("星期二") && normalizedLine.includes("星期五")) &&
        !(normalizedLine.includes("星期六") && (normalizedLine.includes("星期日") || normalizedLine.includes("/日")))
      ) {
        currentDay = maybeDay
        pairedDay = null
      }

      const afterDay = normalizedLine.replace(/.*?星期[一二三四五六日天]/, "")
      const items = parseMenuItemsFromTextLine(afterDay)
      if (items.length > 0 && currentDay) {
        parsed[currentDay] = [...parsed[currentDay], ...items]
      }
      continue
    }

    if (!currentDay) continue

    if (pairedDay && normalizedLine.includes("|")) {
      const [leftRaw, rightRaw] = normalizedLine.split("|", 2)
      const leftItems = parseMenuItemsFromTextLine(leftRaw || "")
      const rightItems = parseMenuItemsFromTextLine(rightRaw || "")
      if (leftItems.length > 0) parsed[currentDay] = [...parsed[currentDay], ...leftItems]
      if (rightItems.length > 0) parsed[pairedDay] = [...parsed[pairedDay], ...rightItems]
      continue
    }

    const parsedItems = parseMenuItemsFromTextLine(normalizedLine)
    if (parsedItems.length === 0) continue

    if (pairedDay) {
      // For paired sections without clear column separators, keep both days same.
      parsed[currentDay] = [...parsed[currentDay], ...parsedItems]
      parsed[pairedDay] = [...parsed[pairedDay], ...parsedItems]
    } else {
      parsed[currentDay] = [...parsed[currentDay], ...parsedItems]
    }
  }
  return withDailyVegItems(parsed)
}

function formatMenusForReview(menus: WeekMenuMap): string {
  return WEEKDAYS.map((day) => {
    const items = menus[day].map((item) => `"${item}"`).join(", ")
    return `"${day}"\n${items}`
  }).join("\n")
}

export default function LunchMenuSettingPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [menuImage, setMenuImage] = useState<File | null>(null)
  const [switchAt, setSwitchAt] = useState<string>(getDefaultSwitchAtLocal())
  const [notificationEmails, setNotificationEmails] = useState<string[]>([
    "bestinksalesman@gmail.com",
    "",
    "",
  ])
  const [menus, setMenus] = useState<WeekMenuMap>(emptyMenus())
  const [reviewFormat, setReviewFormat] = useState<string>("")
  const [isReading, setIsReading] = useState(false)
  const [ocrDone, setOcrDone] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)
  const [isWaitingVercelUpdate, setIsWaitingVercelUpdate] = useState(false)
  const [statusNote, setStatusNote] = useState("")
  const [lastStatusCheckedAt, setLastStatusCheckedAt] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [latest, setLatest] = useState<MenuSettingResponse["data"] | null>(null)

  const imagePreviewUrl = useMemo(() => {
    if (!menuImage) return ""
    return URL.createObjectURL(menuImage)
  }, [menuImage])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  useEffect(() => {
    let ignore = false
    const loadLatest = async () => {
      try {
        const res = await fetch("/api/lunch-menu-setting", { method: "GET" })
        if (!res.ok) return
        const json = (await res.json()) as MenuSettingResponse
        if (!ignore && json.data) {
          setLatest(json.data)
        }
      } catch {
        // Keep UI usable even if latest config cannot be loaded.
      }
    }
    loadLatest()
    return () => {
      ignore = true
    }
  }, [])

  const refreshLatestStatus = async () => {
    setIsRefreshingStatus(true)
    try {
      const res = await fetch("/api/lunch-menu-setting", { method: "GET" })
      const json = (await res.json()) as MenuSettingResponse
      if (res.ok && json.data) {
        setLatest(json.data)
        setLastStatusCheckedAt(new Date().toISOString())
        if (json.data.status === "applied") {
          setIsWaitingVercelUpdate(false)
          setStatusNote("Vercel update completed.")
        } else {
          setStatusNote("Vercel update is still in progress. Please wait.")
        }
        setMessage("Latest status refreshed from Vercel.")
      } else {
        setMessage("Failed to refresh latest status.")
      }
    } catch {
      setMessage("Failed to refresh latest status.")
    } finally {
      setIsRefreshingStatus(false)
    }
  }

  const updateNotificationEmail = (index: number, value: string) => {
    setNotificationEmails((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  useEffect(() => {
    if (!isWaitingVercelUpdate) return
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/lunch-menu-setting", { method: "GET" })
        const json = (await res.json()) as MenuSettingResponse
        if (!res.ok || !json.data) return

        setLatest(json.data)
        setLastStatusCheckedAt(new Date().toISOString())

        if (json.data.status === "applied") {
          setIsWaitingVercelUpdate(false)
          setStatusNote("更新完了: Vercel側のメニュー更新が完了しました。")
          setMessage("Update completed on Vercel.")
        } else {
          setStatusNote("vercelに更新にはしばらく待つ必要があるので、しばらくお待ちください。更新中...")
        }
      } catch {
        // Keep waiting; user can manually refresh.
      }
    }, 15000)

    return () => clearInterval(timer)
  }, [isWaitingVercelUpdate])

  const processSelectedImage = async (selectedImage: File) => {
    setMessage("Reading image automatically...")
    setIsReading(true)
    setReviewFormat("")
    setOcrDone(false)
    try {
      const formData = new FormData()
      formData.append("menuImage", selectedImage)

      const res = await fetch("/api/lunch-menu-setting/ocr", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json?.success || !json?.data?.menus) {
        throw new Error(json?.message || "Google OCR failed.")
      }

      const parsed = withDailyVegItems(json.data.menus as WeekMenuMap)
      const validateMessage = validateWeekMenu(parsed)
      setMenus(parsed)
      setReviewFormat(formatMenusForReview(parsed))
      setOcrDone(!validateMessage)
      if (validateMessage) {
        setMessage(`Read finished but validation failed: ${validateMessage}`)
      } else {
        setMessage("Google OCR complete. Please review and confirm.")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "OCR failed."
      setMessage(errorMessage)
    } finally {
      setIsReading(false)
    }
  }

  useEffect(() => {
    if (!menuImage) return
    processSelectedImage(menuImage)
  }, [menuImage])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage("")

    if (!menuImage) {
      setMessage("Please select a menu image.")
      return
    }

    if (!switchAt) {
      setMessage("Please set switch date and time.")
      return
    }
    const normalizedEmails = notificationEmails
      .map((email) => email.trim())
      .filter(Boolean)
    if (normalizedEmails.length === 0) {
      setMessage("Please enter at least one notification email.")
      return
    }
    if (normalizedEmails.length > 3) {
      setMessage("Notification emails must be 3 or fewer.")
      return
    }
    if (normalizedEmails.some((email) => !email.includes("@"))) {
      setMessage("One or more notification emails are invalid.")
      return
    }
    if (!reviewFormat.trim()) {
      setMessage("Please run image reading first or paste menu text in the edit box.")
      return
    }

    const parsedFromReview = parseFormattedMenuText(reviewFormat)
    if (!parsedFromReview) {
      setMessage("Edit box format is invalid. Keep exact quoted weekday + item format.")
      return
    }
    setMenus(parsedFromReview)

    const validationError = validateWeekMenu(parsedFromReview)
    if (validationError) {
      setMessage(validationError)
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append("menuImage", menuImage)
      formData.append("switchAt", switchAt)
      formData.append("timezone", FIXED_TIMEZONE)
      formData.append("notificationEmailsJson", JSON.stringify(normalizedEmails))
      formData.append("menusJson", JSON.stringify(parsedFromReview))
      formData.append("menuText", reviewFormat)

      const res = await fetch("/api/lunch-menu-setting", {
        method: "POST",
        body: formData,
      })

      const json = (await res.json()) as MenuSettingResponse
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message || "Failed to save menu setting.")
      }

      setLatest(json.data)
      setMessage("Saved. We will update at the scheduled time and send both confirmation and update emails.")
      setIsWaitingVercelUpdate(json.data.status !== "applied")
      setStatusNote(
        json.data.status === "applied"
          ? "更新完了: Vercel側のメニュー更新が完了しました。"
          : "vercelに更新にはしばらく待つ必要があるので、しばらくお待ちください。更新中...",
      )
      setMenuImage(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save menu setting."
      setMessage(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>New Lunch Menu Setting</CardTitle>
          <CardDescription>
            Upload a new menu photo, review OCR results, and schedule automatic menu switching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {(isWaitingVercelUpdate || statusNote) && (
              <div
                className={`rounded-md border p-3 text-sm ${
                  isWaitingVercelUpdate
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-green-300 bg-green-50 text-green-800"
                }`}
              >
                <p className="font-medium">{statusNote || "Status not available."}</p>
                {lastStatusCheckedAt && (
                  <p className="mt-1 text-xs">Last checked: {lastStatusCheckedAt}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="menuImage">Menu Image</Label>
              <input
                ref={fileInputRef}
                id="menuImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null
                  setMenuImage(nextFile)
                  setOcrDone(false)
                  // Allow selecting the same file repeatedly and still trigger OCR.
                  event.currentTarget.value = ""
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border border-[#02315a] text-[#02315a]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
                <span className="text-sm text-slate-700">
                  {menuImage ? menuImage.name : "No file selected"}
                </span>
              </div>
              {isReading && (
                <p className="text-sm text-[#02315a]">Reading image...</p>
              )}
              {imagePreviewUrl && (
                <img
                  src={imagePreviewUrl}
                  alt="menu preview"
                  className="mt-2 max-h-64 rounded-md border object-contain"
                />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="switchAt">Switch Date & Time</Label>
                <Input
                  id="switchAt"
                  type="datetime-local"
                  value={switchAt}
                  onChange={(event) => setSwitchAt(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notification Emails (up to 3)</Label>
              <Input
                id="notificationEmail1"
                type="email"
                value={notificationEmails[0]}
                onChange={(event) => updateNotificationEmail(0, event.target.value)}
                placeholder="Email 1 (required)"
              />
              <Input
                id="notificationEmail2"
                type="email"
                value={notificationEmails[1]}
                onChange={(event) => updateNotificationEmail(1, event.target.value)}
                placeholder="Email 2 (optional)"
              />
              <Input
                id="notificationEmail3"
                type="email"
                value={notificationEmails[2]}
                onChange={(event) => updateNotificationEmail(2, event.target.value)}
                placeholder="Email 3 (optional)"
              />
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <p className="font-medium text-sm">Menu Text (single edit box)</p>
              <Textarea
                value={reviewFormat}
                onChange={(event) => setReviewFormat(event.target.value)}
                placeholder=""
                rows={16}
                className="h-[600px] max-h-[600px] overflow-y-auto resize-y"
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 border-2 border-[#02315a] bg-[#02315a] px-5 text-white shadow-sm hover:bg-[#03457d]"
            >
              {isSaving ? "Sending..." : "Confirm and Schedule"}
            </Button>
            {message && <p className="text-sm text-[#02315a]">{message}</p>}
          </form>

          {latest && (
            <div className="mt-8 rounded-md border p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold">Latest Saved Setting</h4>
                <Button
                  type="button"
                  variant="outline"
                  onClick={refreshLatestStatus}
                  disabled={isRefreshingStatus}
                  className="border border-[#02315a] text-[#02315a]"
                >
                  {isRefreshingStatus ? "Refreshing..." : "Refresh Status"}
                </Button>
              </div>
              <p className="text-sm mt-2">Switch At: {latest.switchAt}</p>
              <p className="text-sm">Timezone: {latest.timezone}</p>
              <p className="text-sm">
                Notification: {(latest.notificationEmails?.length
                  ? latest.notificationEmails
                  : latest.notificationEmail
                    ? [latest.notificationEmail]
                    : []
                ).join(", ")}
              </p>
              <p className="text-sm">
                Status:{" "}
                <span
                  className={
                    latest.status === "applied"
                      ? "font-semibold text-green-700"
                      : "font-semibold text-amber-700"
                  }
                >
                  {latest.status === "applied" ? "Applied (Vercel update done)" : "Scheduled (waiting)"}
                </span>
              </p>
              {latest.appliedAt && <p className="text-sm">Applied At: {latest.appliedAt}</p>}
              {latest.confirmationEmailSentAt && (
                <p className="text-sm">Confirmation Email Sent: {latest.confirmationEmailSentAt}</p>
              )}
              {latest.updateEmailSentAt && (
                <p className="text-sm">Update Email Sent: {latest.updateEmailSentAt}</p>
              )}
              <p className="text-sm">Saved At: {latest.createdAt}</p>
              <a
                href={latest.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-700 hover:underline"
              >
                Open Uploaded Image
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

