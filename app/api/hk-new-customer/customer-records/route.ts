import { NextResponse } from "next/server"
import {
  getCustomerRecordFolder,
  listCustomerRecordFolders,
} from "@/lib/hk-new-customer-customer-records"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const folder = String(searchParams.get("folder") || "").trim()
    if (folder) {
      const data = await getCustomerRecordFolder(folder)
      if (!data) {
        return json({ success: false, message: "Customer folder not found" }, 404)
      }
      return json({ success: true, data })
    }

    const data = await listCustomerRecordFolders()
    return json({ success: true, data, total: data.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load customer records"
    return json({ success: false, message }, 500)
  }
}
