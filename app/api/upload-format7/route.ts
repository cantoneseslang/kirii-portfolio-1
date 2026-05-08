import { put } from "@vercel/blob";
import {
  createFormat7GoogleSheet,
  createFormat7ReferenceSheet,
} from "@/lib/format7-google-sheet";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // GAS integration path: JSON payload { filename, data(base64), timestamp }
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const filename = typeof body?.filename === "string" ? body.filename : "";
      const data = typeof body?.data === "string" ? body.data : "";
      const timestamp =
        typeof body?.timestamp === "string" ? body.timestamp : undefined;
      const referenceOnly = body?.referenceOnly === true;
      const customerStatementManifest =
        body?.customerStatementManifest &&
        typeof body.customerStatementManifest === "object"
          ? body.customerStatementManifest
          : null;

      if (!filename || !data) {
        return new Response("filename and data are required", { status: 400 });
      }

      const excelBytes = Buffer.from(data, "base64");
      const sheet = referenceOnly
        ? await createFormat7ReferenceSheet({
            filename,
            excelBytes,
            timestamp,
          })
        : await createFormat7GoogleSheet({
            filename,
            excelBytes,
            timestamp,
          });

      let statementManifestPath: string | null = null;
      if (
        customerStatementManifest &&
        typeof customerStatementManifest.statementMonth === "string"
      ) {
        const statementMonth = customerStatementManifest.statementMonth;
        statementManifestPath = `format7/statements/${statementMonth}.json`;
        await put(
          statementManifestPath,
          JSON.stringify(customerStatementManifest, null, 2),
          {
            access: "public",
            contentType: "application/json",
            addRandomSuffix: false,
            token,
          } as any
        );
        await put(
          "format7/statements/latest.json",
          JSON.stringify(customerStatementManifest, null, 2),
          {
            access: "public",
            contentType: "application/json",
            addRandomSuffix: false,
            token,
          } as any
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          referenceOnly,
          sheetId: sheet.id,
          sheetName: sheet.name,
          sheetUrl: sheet.url,
          url: sheet.url,
          statementManifestPath,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Manual upload path from /format7 page: multipart/form-data
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `format7/${Date.now()}-${safeName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(key, fileBuffer, {
      access: "public",
      contentType: file.type || "application/octet-stream",
      // Pass token explicitly to avoid "No token found" in protected deployments
      token,
    } as any);

    // Keep backward compatibility: manual upload still returns blob URL.
    // Also create Google Sheet so the dashboard can always jump to latest data.
    const sheet = await createFormat7GoogleSheet({
      filename: safeName,
      excelBytes: fileBuffer,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        sheetId: sheet.id,
        sheetName: sheet.name,
        sheetUrl: sheet.url,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (e: any) {
    return new Response(e?.message || "Upload failed", { status: 500 });
  }
}


