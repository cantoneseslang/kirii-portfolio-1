import "server-only"
import nodemailer from "nodemailer"

export type SendEmailParams = {
  to: string | string[]
  subject: string
  html: string
}

export type SendEmailResult = {
  sent: boolean
  message: string
}

function formatFromAddress(displayName: string | undefined, mailbox: string): string {
  if (!displayName || displayName === mailbox) {
    return mailbox
  }
  if (displayName.includes("@") || displayName.includes("<")) {
    return displayName
  }
  const escaped = displayName.replace(/"/g, '\\"')
  return `"${escaped}" <${mailbox}>`
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS
  const port = Number(process.env.SMTP_PORT || 587)
  const fromDisplay = process.env.SMTP_FROM?.trim()
  const from = user ? formatFromAddress(fromDisplay, user) : fromDisplay
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465

  return { host, user, pass, port, from, secure }
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const recipients = Array.isArray(params.to) ? params.to : [params.to]
  const validRecipients = recipients.map((email) => email.trim()).filter(Boolean)
  if (validRecipients.length === 0) {
    return { sent: false, message: "No recipients provided" }
  }

  const { host, user, pass, port, from, secure } = getSmtpConfig()
  if (!host || !user || !pass || !from) {
    return { sent: false, message: "SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)" }
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: secure ? undefined : { minVersion: "TLSv1.2" },
  })

  try {
    await transporter.sendMail({
      from,
      to: validRecipients,
      subject: params.subject,
      html: params.html,
    })
    return { sent: true, message: "sent via SMTP" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP send failed"
    return { sent: false, message: `SMTP error: ${message}` }
  }
}
