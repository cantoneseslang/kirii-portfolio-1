import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import {
  IMAGE_PREFIX,
  REQUIRED_WEEKDAYS,
  type SavedMenuConfig,
  type WeekMenuMap,
  getLatestConfig,
  safeFilename,
  saveConfig,
  sendEmail,
  validateMenus,
} from "@/lib/lunch-menu-setting"

export const runtime = "nodejs"

function parseSwitchAtWithTimezone(input: string, timezone: string): Date {
  // If timezone/offset is already included, trust native parsing.
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(input)) {
    return new Date(input)
  }

  // datetime-local comes as "YYYY-MM-DDTHH:mm" (or with :ss). Interpret using requested timezone.
  if (timezone === "Asia/Hong_Kong") {
    const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input) ? `${input}:00` : input
    return new Date(`${normalized}+08:00`)
  }

  return new Date(input)
}

function parseMenusJson(value: string): WeekMenuMap | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (!validateMenus(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    const latest = await getLatestConfig(token)
    if (!latest) {
      return NextResponse.json({ success: true, data: null })
    }
    return NextResponse.json({ success: true, data: latest })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load latest setting"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    const formData = await request.formData()
    const image = formData.get("menuImage")
    const switchAt = String(formData.get("switchAt") || "")
    const timezone = String(formData.get("timezone") || "Asia/Hong_Kong")
    const menuText = String(formData.get("menuText") || "")
    const notes = String(formData.get("notes") || "")
    const notificationEmailsJson = String(formData.get("notificationEmailsJson") || "")
    const legacyNotificationEmail = String(formData.get("notificationEmail") || "").trim()
    const menusJson = String(formData.get("menusJson") || "")
    const menus = parseMenusJson(menusJson)
    let notificationEmails: string[] = []
    if (notificationEmailsJson) {
      try {
        const parsed = JSON.parse(notificationEmailsJson)
        if (Array.isArray(parsed)) {
          notificationEmails = parsed.map((email) => String(email).trim()).filter(Boolean)
        }
      } catch {
        notificationEmails = []
      }
    }
    if (notificationEmails.length === 0 && legacyNotificationEmail) {
      notificationEmails = [legacyNotificationEmail]
    }

    if (!(image instanceof File)) {
      return NextResponse.json(
        { success: false, message: "menuImage is required" },
        { status: 400 },
      )
    }

    if (!switchAt) {
      return NextResponse.json(
        { success: false, message: "switchAt is required" },
        { status: 400 },
      )
    }
    if (notificationEmails.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one notification email is required" },
        { status: 400 },
      )
    }
    if (notificationEmails.length > 3) {
      return NextResponse.json(
        { success: false, message: "Notification emails must be 3 or fewer" },
        { status: 400 },
      )
    }
    if (notificationEmails.some((email) => !email.includes("@"))) {
      return NextResponse.json(
        { success: false, message: "One or more notification emails are invalid" },
        { status: 400 },
      )
    }
    if (!menus) {
      return NextResponse.json(
        {
          success: false,
          message: `menusJson is invalid. Required weekdays: ${REQUIRED_WEEKDAYS.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const switchAtDate = parseSwitchAtWithTimezone(switchAt, timezone)
    if (Number.isNaN(switchAtDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "switchAt is invalid" },
        { status: 400 },
      )
    }

    const configId = `menu-switch-${Date.now()}`
    const fileBytes = Buffer.from(await image.arrayBuffer())
    const imagePath = `${IMAGE_PREFIX}/${Date.now()}-${safeFilename(image.name || "menu-image.png")}`
    const imageBlob = await put(imagePath, fileBytes, {
      token,
      access: "public",
      contentType: image.type || "application/octet-stream",
    })

    const savedConfig: SavedMenuConfig = {
      configId,
      imageUrl: imageBlob.url,
      switchAt: switchAtDate.toISOString(),
      timezone,
      menuText: menuText || undefined,
      notes: notes || undefined,
      notificationEmails,
      notificationEmail: notificationEmails[0],
      menus,
      createdAt: new Date().toISOString(),
      source: "dashboard",
      status: "scheduled",
    }

    const emailResult = await sendEmail({
      to: notificationEmails,
      subject: "Lunch Menu Setting Completed",
      html: `
        <h3>Lunch Menu Setting Saved</h3>
        <p>Your menu update has been scheduled.</p>
        <ul>
          <li>Switch At: ${switchAtDate.toISOString()}</li>
          <li>Timezone: ${timezone}</li>
          <li>Config ID: ${configId}</li>
          <li>Recipients: ${notificationEmails.join(", ")}</li>
        </ul>
      `,
    })
    if (emailResult.sent) {
      savedConfig.confirmationEmailSentAt = new Date().toISOString()
    }

    await saveConfig(savedConfig, token)

    return NextResponse.json({
      success: true,
      message: emailResult.sent
        ? "Menu switch setting saved and confirmation email sent"
        : `Menu switch setting saved, but confirmation email failed: ${emailResult.message}`,
      data: savedConfig,
      email: emailResult,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save menu setting"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

