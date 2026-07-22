import { NextResponse } from "next/server"
import { INTAKE_TEMPLATE_FILENAME } from "@/lib/hk-new-customer-intake-template"
import { readIntakeTemplateBuffer } from "@/lib/hk-new-customer-intake-template-server"

export async function GET() {
  const buffer = await readIntakeTemplateBuffer()
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${INTAKE_TEMPLATE_FILENAME}"`,
      "Cache-Control": "no-store",
    },
  })
}
