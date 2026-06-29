import { NextRequest, NextResponse } from "next/server"

import { sendEmail } from "@/lib/send-email"

export const runtime = "nodejs"

type AlertBody = {
  exitCode?: number
  computer?: string
  scriptDir?: string
  logFile?: string
  errorSummary?: string
  occurredAt?: string
}

function getAlertSecret(): string {
  return (
    process.env.CHINA_DASHBOARD_ALERT_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  )
}

function isAuthorized(request: NextRequest): boolean {
  const secret = getAlertSecret()
  if (!secret) return false

  const headerToken = request.headers.get("x-china-dashboard-alert-token")?.trim()
  const queryToken = request.nextUrl.searchParams.get("token")?.trim()
  const token = headerToken || queryToken
  return Boolean(token && token === secret)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function getRecipients(): string[] {
  const raw =
    process.env.CHINA_DASHBOARD_ALERT_TO?.trim() ||
    process.env.SMTP_TO?.trim() ||
    "bestinksalesman@gmail.com"
  return raw
    .split(/[;,]/)
    .map((email) => email.trim())
    .filter(Boolean)
}

export async function POST(request: NextRequest) {
  const secret = getAlertSecret()
  if (!secret) {
    return NextResponse.json(
      {
        success: false,
        message: "CHINA_DASHBOARD_ALERT_SECRET is not configured on Vercel",
      },
      { status: 503 },
    )
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  let body: AlertBody
  try {
    body = (await request.json()) as AlertBody
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 })
  }

  const exitCode = typeof body.exitCode === "number" ? body.exitCode : -1
  const computer = body.computer?.trim() || "unknown"
  const scriptDir = body.scriptDir?.trim() || "-"
  const logFile = body.logFile?.trim() || "-"
  const occurredAt = body.occurredAt?.trim() || new Date().toISOString()
  const errorSummary = body.errorSummary?.trim() || "（エラー概要なし）"

  const subject = `[china-dashboard] 更新失敗（終了コード ${exitCode}）— ${computer}`
  const html = `
    <h2>china-dashboard のデータ取得に失敗しました</h2>
    <table cellpadding="6" cellspacing="0" border="0">
      <tr><td><strong>日時</strong></td><td>${escapeHtml(occurredAt)}</td></tr>
      <tr><td><strong>コンピュータ名</strong></td><td>${escapeHtml(computer)}</td></tr>
      <tr><td><strong>終了コード</strong></td><td>${exitCode}</td></tr>
      <tr><td><strong>スクリプトの場所</strong></td><td>${escapeHtml(scriptDir)}</td></tr>
      <tr><td><strong>ログファイル</strong></td><td>${escapeHtml(logFile)}</td></tr>
    </table>
    <h3>直近のエラー／ログ末尾</h3>
    <pre style="white-space:pre-wrap;font-family:Consolas,monospace;">${escapeHtml(errorSummary)}</pre>
    <p>401 Unauthorized の場合は、kirii-portfolio-1 の dashboard API がブロックされていないか確認してください。</p>
    <p>手動確認: 該当 PC で fetch-data.bat を実行し、logs フォルダ内のログを確認してください。</p>
  `.trim()

  const result = await sendEmail({
    to: getRecipients(),
    subject,
    html,
  })

  if (!result.sent) {
    return NextResponse.json({ success: false, message: result.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: result.message })
}
