import { NextResponse } from "next/server"
import {
  INTAKE_TEMPLATE_FILENAME,
  intakeTemplateToBuffer,
} from "@/lib/hk-new-customer-intake-template"

export async function GET() {
  const buffer = intakeTemplateToBuffer()
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${INTAKE_TEMPLATE_FILENAME}"`,
      "Cache-Control": "no-store",
    },
  })
}
