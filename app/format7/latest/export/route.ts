import { NextResponse } from "next/server";
import { exportLatestFormat7SpreadsheetAsXlsx } from "@/lib/format7-google-sheet";
import { requireCardAccessApi } from "@/lib/portfolio-access";

export const runtime = "nodejs";

function contentDispositionAttachment(filenameStem: string) {
  const suffix = ".xlsx";
  const safeStem = filenameStem.replace(/[^\w.-]+/g, "_").slice(0, 120) || "format7-latest";
  const asciiFilename = `${safeStem}${suffix}`;
  const utf8Filename = `${filenameStem}${suffix}`;
  const star = encodeURIComponent(utf8Filename);
  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${star}`;
}

export async function GET(req: Request) {
  const access = await requireCardAccessApi("collect_payment", req);
  if (!access.ok) return access.response;

  try {
    const { buffer, filenameStem } = await exportLatestFormat7SpreadsheetAsXlsx();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": contentDispositionAttachment(filenameStem),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
