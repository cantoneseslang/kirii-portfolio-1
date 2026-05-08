import { NextRequest, NextResponse } from "next/server"
import { getLatestConfig, saveConfig, sendEmail } from "@/lib/lunch-menu-setting"

export const runtime = "nodejs"

function isAuthorized(request: NextRequest): boolean {
  const cronHeader = request.headers.get("x-vercel-cron")
  if (cronHeader) return true

  const token = request.nextUrl.searchParams.get("token")
  const secret = process.env.CRON_SECRET
  if (secret && token === secret) return true
  return false
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    const latest = await getLatestConfig(token)

    if (!latest) {
      return NextResponse.json({ success: true, message: "No config found" })
    }

    if (latest.status === "applied") {
      return NextResponse.json({ success: true, message: "Already applied", configId: latest.configId })
    }

    const now = Date.now()
    const switchAt = new Date(latest.switchAt).getTime()
    if (Number.isNaN(switchAt)) {
      return NextResponse.json({ success: false, message: "Invalid switchAt in latest config" }, { status: 500 })
    }

    if (now < switchAt) {
      return NextResponse.json({
        success: true,
        message: "Not yet switch time",
        configId: latest.configId,
        switchAt: latest.switchAt,
      })
    }

    latest.status = "applied"
    latest.appliedAt = new Date().toISOString()
    const recipients = (latest.notificationEmails && latest.notificationEmails.length > 0)
      ? latest.notificationEmails
      : latest.notificationEmail
        ? [latest.notificationEmail]
        : []

    const emailResult = await sendEmail({
      to: recipients,
      subject: "Lunch Menu Updated",
      html: `
        <h3>Lunch Menu Update Executed</h3>
        <p>The scheduled menu switch has been executed.</p>
        <ul>
          <li>Config ID: ${latest.configId}</li>
          <li>Scheduled: ${latest.switchAt}</li>
          <li>Applied At: ${latest.appliedAt}</li>
          <li>Recipients: ${recipients.join(", ")}</li>
        </ul>
      `,
    })
    if (emailResult.sent) {
      latest.updateEmailSentAt = new Date().toISOString()
    }

    await saveConfig(latest, token)

    return NextResponse.json({
      success: true,
      message: emailResult.sent
        ? "Menu switch applied and update email sent"
        : `Menu switch applied, but update email failed: ${emailResult.message}`,
      data: latest,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process menu switch"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

