import { list, put } from "@vercel/blob"
import type { SendEmailParams, SendEmailResult } from "@/lib/send-email"

export const LATEST_CONFIG_PATH = "lunch-menu-settings/latest.json"
export const HISTORY_PREFIX = "lunch-menu-settings/history"
export const IMAGE_PREFIX = "lunch-menu-settings/images"

export const REQUIRED_WEEKDAYS = [
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
  "星期日",
] as const

export type Weekday = (typeof REQUIRED_WEEKDAYS)[number]

export type WeekMenuMap = Record<Weekday, string[]>

export type SavedMenuConfig = {
  configId: string
  imageUrl: string
  switchAt: string
  timezone: string
  menuText?: string
  notes?: string
  notificationEmails: string[]
  notificationEmail?: string
  menus: WeekMenuMap
  createdAt: string
  source: "dashboard"
  status: "scheduled" | "applied"
  confirmationEmailSentAt?: string
  appliedAt?: string
  updateEmailSentAt?: string
}

export function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export function validateMenus(menus: unknown): menus is WeekMenuMap {
  if (!menus || typeof menus !== "object") return false
  const typedMenus = menus as Partial<WeekMenuMap>
  return REQUIRED_WEEKDAYS.every((day) => Array.isArray(typedMenus[day]) && typedMenus[day]!.length > 0)
}

export async function getLatestConfig(token?: string): Promise<SavedMenuConfig | null> {
  const result = await list({
    token,
    prefix: LATEST_CONFIG_PATH,
    limit: 1,
  })
  const latest = result.blobs[0]
  if (!latest?.url) return null

  const response = await fetch(latest.url, { cache: "no-store" })
  if (!response.ok) return null
  return (await response.json()) as SavedMenuConfig
}

export async function saveConfig(config: SavedMenuConfig, token?: string): Promise<void> {
  const body = JSON.stringify(config, null, 2)
  await put(LATEST_CONFIG_PATH, body, {
    token,
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  })

  await put(`${HISTORY_PREFIX}/${config.configId}.json`, body, {
    token,
    access: "public",
    allowOverwrite: true,
    contentType: "application/json",
  })
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { sendEmail: sendEmailViaSmtp } = await import("@/lib/send-email")
  return sendEmailViaSmtp(params)
}

