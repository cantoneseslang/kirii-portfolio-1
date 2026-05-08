import { google } from "googleapis";
import { Readable } from "stream";

const GOOGLE_SHEETS_MIME = "application/vnd.google-apps.spreadsheet";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PREFERRED_SHEET_TITLES = ["桐井回收貨款表", "桐井回収貨款表"];
const FORMAT7_TAB_PREFIXES = ["桐井回收貨款表", "桐井回収貨款表"];
const DEFAULT_FIXED_SPREADSHEET_ID = "1Zrq3NoZc9FBzwOCO8piaZH_Y8wr2MTT6FZRwt7C1VXM";

function getOAuth2Client() {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.OAUTH_REDIRECT_URI || "http://localhost";
  const tokenJson = process.env.GOOGLE_DRIVE_TOKEN;

  if (!clientId || !clientSecret || !tokenJson) {
    throw new Error(
      "Missing Google OAuth env: OAUTH_CLIENT_ID/OAUTH_CLIENT_SECRET/GOOGLE_DRIVE_TOKEN"
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials(JSON.parse(tokenJson));
  return oauth2Client;
}

function resolveFixedSpreadsheetId() {
  return process.env.FORMAT7_FIXED_SPREADSHEET_ID || DEFAULT_FIXED_SPREADSHEET_ID;
}

function buildDateSheetTitle(timestamp?: string) {
  const dt = timestamp ? new Date(timestamp) : new Date();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const hour = String(dt.getHours()).padStart(2, "0");
  const minute = String(dt.getMinutes()).padStart(2, "0");
  return `桐井回收貨款表${month}${day}${hour}${minute}`;
}

function buildReferenceSheetTitle(timestamp?: string) {
  const dt = timestamp ? new Date(timestamp) : new Date();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const hour = String(dt.getHours()).padStart(2, "0");
  const minute = String(dt.getMinutes()).padStart(2, "0");
  return `得意先一覧${month}${day}${hour}${minute}`;
}

function toGoogleSheetUrl(spreadsheetId: string, gid?: number | null) {
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=drivesdk`;
  if (gid == null) return base;
  return `${base}#gid=${gid}`;
}

async function getSpreadsheetTabs(auth: ReturnType<typeof getOAuth2Client>, spreadsheetId: string) {
  const sheets = google.sheets({ version: "v4", auth });
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title,index))",
  });
  return meta.data.sheets || [];
}

async function ensureUniqueSheetTitle(
  auth: ReturnType<typeof getOAuth2Client>,
  spreadsheetId: string,
  baseTitle: string
) {
  const tabs = await getSpreadsheetTabs(auth, spreadsheetId);
  const existing = new Set(
    tabs
      .map((s) => (s.properties?.title || "").trim())
      .filter((t) => t.length > 0)
  );
  if (!existing.has(baseTitle)) return baseTitle;

  let index = 2;
  while (true) {
    const candidate = `${baseTitle}_${index}`;
    if (!existing.has(candidate)) return candidate;
    index += 1;
  }
}

function extractFormat7TabRank(title: string) {
  // Expected: 桐井回收貨款表MMDDHHMM / 桐井回収貨款表MMDDHHMM (8 digits)
  const m = title.match(/^桐井回(?:收|収)貨款表(\d{8})$/);
  if (!m) return Number.MIN_SAFE_INTEGER;
  return Number(m[1]);
}

function isFormat7TabTitle(title: string) {
  return FORMAT7_TAB_PREFIXES.some((prefix) => title.startsWith(prefix));
}

function selectLatestFormat7Tab(
  tabs: Array<{ properties?: { title?: string; index?: number; sheetId?: number } }>
) {
  const format7Tabs = tabs.filter((t) =>
    isFormat7TabTitle((t.properties?.title || "").trim())
  );

  if (format7Tabs.length > 0) {
    return format7Tabs
      .slice()
      .sort((a, b) => {
        const ta = a.properties?.title || "";
        const tb = b.properties?.title || "";
        const ra = extractFormat7TabRank(ta);
        const rb = extractFormat7TabRank(tb);
        if (ra !== rb) return rb - ra; // latest timestamp first
        return (a.properties?.index ?? 9999) - (b.properties?.index ?? 9999);
      })[0];
  }

  const available = tabs
    .map((t) => (t.properties?.title || "").trim())
    .filter((t) => t.length > 0)
    .slice(0, 20);
  throw new Error(
    `No format7 tab found. Expected prefix: ${FORMAT7_TAB_PREFIXES.join(" / ")}. Available tabs: ${available.join(", ")}`
  );
}

async function pinTabToFirstIndex(
  auth: ReturnType<typeof getOAuth2Client>,
  spreadsheetId: string,
  sheetId?: number | null
) {
  if (sheetId == null) return;
  const sheets = google.sheets({ version: "v4", auth });
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: { sheetId, index: 0 },
              fields: "index",
            },
          },
        ],
      },
    });
  } catch {
    // non-blocking self-heal attempt
  }
}

async function importExcelAsTemporarySpreadsheet(params: {
  auth: ReturnType<typeof getOAuth2Client>;
  filename: string;
  excelBytes: Buffer;
  timestamp?: string;
}) {
  const drive = google.drive({ version: "v3", auth: params.auth });
  const folderId = process.env.FORMAT7_GOOGLE_DRIVE_FOLDER_ID;
  const tempName = `format7_tmp_${params.filename.replace(/\.[^.]+$/, "")}_${Date.now()}`;
  const requestBody: Record<string, unknown> = {
    name: tempName,
    mimeType: GOOGLE_SHEETS_MIME,
  };
  if (folderId) {
    requestBody.parents = [folderId];
  }

  const created = await drive.files.create({
    requestBody,
    media: {
      mimeType: XLSX_MIME,
      body: Readable.from(params.excelBytes),
    },
    fields: "id,name",
    supportsAllDrives: true,
  });
  return { drive, tempSpreadsheetId: created.data.id || "" };
}

async function findPreferredSourceSheetId(
  auth: ReturnType<typeof getOAuth2Client>,
  tempSpreadsheetId: string
) {
  const tabs = await getSpreadsheetTabs(auth, tempSpreadsheetId);
  if (tabs.length === 0) return null;

  const preferred = tabs.find((s) =>
    PREFERRED_SHEET_TITLES.includes((s.properties?.title || "").trim())
  );
  return preferred?.properties?.sheetId ?? tabs[0]?.properties?.sheetId ?? null;
}

export async function createFormat7GoogleSheet(params: {
  filename: string;
  excelBytes: Buffer;
  timestamp?: string;
}) {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: "v4", auth });
  const fixedSpreadsheetId = resolveFixedSpreadsheetId();

  const { drive, tempSpreadsheetId } = await importExcelAsTemporarySpreadsheet({
    auth,
    filename: params.filename,
    excelBytes: params.excelBytes,
    timestamp: params.timestamp,
  });

  if (!tempSpreadsheetId) {
    throw new Error("Failed to import Excel as temporary spreadsheet");
  }

  try {
    const sourceSheetId = await findPreferredSourceSheetId(auth, tempSpreadsheetId);
    if (sourceSheetId == null) {
      throw new Error("No sheet found in imported workbook");
    }

    const copied = await sheets.spreadsheets.sheets.copyTo({
      spreadsheetId: tempSpreadsheetId,
      sheetId: sourceSheetId,
      requestBody: {
        destinationSpreadsheetId: fixedSpreadsheetId,
      },
    });
    const copiedSheetId = copied.data.sheetId;
    if (copiedSheetId == null) {
      throw new Error("Failed to copy preferred sheet to fixed spreadsheet");
    }

    const desiredTitle = buildDateSheetTitle(params.timestamp);
    const finalTitle = await ensureUniqueSheetTitle(auth, fixedSpreadsheetId, desiredTitle);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: fixedSpreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: copiedSheetId,
                title: finalTitle,
                index: 0,
              },
              fields: "title,index",
            },
          },
        ],
      },
    });

    return {
      id: fixedSpreadsheetId,
      name: finalTitle,
      url: toGoogleSheetUrl(fixedSpreadsheetId, copiedSheetId),
    };
  } finally {
    // Cleanup temporary converted spreadsheet created for import.
    try {
      await drive.files.delete({
        fileId: tempSpreadsheetId,
        supportsAllDrives: true,
      });
    } catch {
      // non-blocking cleanup
    }
  }
}

export async function createFormat7ReferenceSheet(params: {
  filename: string;
  excelBytes: Buffer;
  timestamp?: string;
}) {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: "v4", auth });
  const fixedSpreadsheetId = resolveFixedSpreadsheetId();
  const { drive, tempSpreadsheetId } = await importExcelAsTemporarySpreadsheet({
    auth,
    filename: params.filename,
    excelBytes: params.excelBytes,
    timestamp: params.timestamp,
  });

  if (!tempSpreadsheetId) {
    throw new Error("Failed to import reference Excel as temporary spreadsheet");
  }

  try {
    const tabs = await getSpreadsheetTabs(auth, tempSpreadsheetId);
    const sourceSheetId = tabs[0]?.properties?.sheetId;
    if (sourceSheetId == null) {
      throw new Error("No source sheet found for reference upload");
    }

    const copied = await sheets.spreadsheets.sheets.copyTo({
      spreadsheetId: tempSpreadsheetId,
      sheetId: sourceSheetId,
      requestBody: {
        destinationSpreadsheetId: fixedSpreadsheetId,
      },
    });
    const copiedSheetId = copied.data.sheetId;
    if (copiedSheetId == null) {
      throw new Error("Failed to copy reference sheet to fixed spreadsheet");
    }

    const desiredTitle = buildReferenceSheetTitle(params.timestamp);
    const finalTitle = await ensureUniqueSheetTitle(auth, fixedSpreadsheetId, desiredTitle);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: fixedSpreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: copiedSheetId,
                title: finalTitle,
              },
              fields: "title",
            },
          },
        ],
      },
    });

    return {
      id: fixedSpreadsheetId,
      name: finalTitle,
      url: toGoogleSheetUrl(fixedSpreadsheetId, copiedSheetId),
    };
  } finally {
    try {
      await drive.files.delete({
        fileId: tempSpreadsheetId,
        supportsAllDrives: true,
      });
    } catch {
      // non-blocking cleanup
    }
  }
}

export async function getLatestFormat7GoogleSheetUrl() {
  const auth = getOAuth2Client();
  const fixedSpreadsheetId = resolveFixedSpreadsheetId();
  const tabs = await getSpreadsheetTabs(auth, fixedSpreadsheetId);
  if (tabs.length === 0) return toGoogleSheetUrl(fixedSpreadsheetId, null);

  const latestTab = selectLatestFormat7Tab(tabs);
  await pinTabToFirstIndex(auth, fixedSpreadsheetId, latestTab.properties?.sheetId ?? null);

  return toGoogleSheetUrl(fixedSpreadsheetId, latestTab.properties?.sheetId ?? null);
}

export async function getLatestFormat7SheetData() {
  const auth = getOAuth2Client();
  const fixedSpreadsheetId = resolveFixedSpreadsheetId();
  const tabs = await getSpreadsheetTabs(auth, fixedSpreadsheetId);

  if (tabs.length === 0) {
    return {
      sheetTitle: "No sheet",
      rows: [] as string[][],
      spreadsheetId: fixedSpreadsheetId,
    };
  }

  const latestTab = selectLatestFormat7Tab(tabs);
  await pinTabToFirstIndex(auth, fixedSpreadsheetId, latestTab.properties?.sheetId ?? null);

  const sheetTitle = latestTab.properties?.title || "Sheet1";
  const escapedSheetTitle = sheetTitle.replace(/'/g, "''");
  const sheets = google.sheets({ version: "v4", auth });
  const valuesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: fixedSpreadsheetId,
    range: `'${escapedSheetTitle}'`,
    majorDimension: "ROWS",
  });

  return {
    sheetTitle,
    rows: (valuesResponse.data.values || []) as string[][],
    spreadsheetId: fixedSpreadsheetId,
  };
}

type Format7StatementIndexRow = {
  statementMonth: string;
  statementDate: string;
  customerCode: string;
  customerName: string;
  salesman: string;
  current: number;
  daysOutstanding1To30: number;
  daysOutstanding31To60: number;
  daysOutstanding61To90: number;
  daysOutstanding91Plus: number;
  total: number;
};

export type Format7StatementDetail = {
  statementMonth: string;
  statementDate: string;
  customerCode: string;
  customerName: string;
  salesman: string;
  summary: {
    current: number;
    daysOutstanding1To30: number;
    daysOutstanding31To60: number;
    daysOutstanding61To90: number;
    daysOutstanding91Plus: number;
    total: number;
  };
  invoiceRows: Array<{
    invoiceNo: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;
    openAmount: number | null;
    bucket: string;
  }>;
  balanceRows: Array<{
    balanceMonth: string;
    balanceAmount: number | null;
    bucket: string;
  }>;
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getSheetValuesByTitle(
  auth: ReturnType<typeof getOAuth2Client>,
  spreadsheetId: string,
  sheetTitle: string
) {
  const escapedSheetTitle = sheetTitle.replace(/'/g, "''");
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${escapedSheetTitle}'`,
    majorDimension: "ROWS",
  });
  return (response.data.values || []) as string[][];
}

export async function getFormat7StatementIndexRows() {
  const auth = getOAuth2Client();
  const fixedSpreadsheetId = resolveFixedSpreadsheetId();
  const values = await getSheetValuesByTitle(auth, fixedSpreadsheetId, "F7STAT_INDEX");
  if (values.length <= 1) return [];

  return values.slice(1).map((row) => ({
    statementMonth: row[0] || "",
    statementDate: row[1] || "",
    customerCode: row[2] || "",
    customerName: row[3] || "",
    salesman: row[4] || "",
    current: toNumber(row[5]),
    daysOutstanding1To30: toNumber(row[6]),
    daysOutstanding31To60: toNumber(row[7]),
    daysOutstanding61To90: toNumber(row[8]),
    daysOutstanding91Plus: toNumber(row[9]),
    total: toNumber(row[10]),
  })) as Format7StatementIndexRow[];
}

export async function getFormat7StatementCustomerList() {
  const rows = await getFormat7StatementIndexRows();
  const map = new Map<string, {
    customerCode: string;
    customerName: string;
    salesman: string;
    latestStatementMonth: string;
    months: string[];
  }>();

  rows.forEach((row) => {
    if (!row.customerCode) return;
    const existing = map.get(row.customerCode);
    if (!existing) {
      map.set(row.customerCode, {
        customerCode: row.customerCode,
        customerName: row.customerName,
        salesman: row.salesman,
        latestStatementMonth: row.statementMonth,
        months: row.statementMonth ? [row.statementMonth] : [],
      });
      return;
    }

    if (row.statementMonth && !existing.months.includes(row.statementMonth)) {
      existing.months.push(row.statementMonth);
    }
    if (row.statementMonth > existing.latestStatementMonth) {
      existing.latestStatementMonth = row.statementMonth;
      existing.customerName = row.customerName;
      existing.salesman = row.salesman;
    }
  });

  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      months: entry.months.sort((a, b) => b.localeCompare(a)),
    }))
    .sort((a, b) => a.customerCode.localeCompare(b.customerCode));
}

export async function getFormat7StatementMonthsForCustomer(customerCode: string) {
  const rows = await getFormat7StatementIndexRows();
  const months = new Map<string, string>();
  rows.forEach((row) => {
    if (row.customerCode !== customerCode || !row.statementMonth) return;
    months.set(row.statementMonth, row.statementDate);
  });

  return Array.from(months.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([statementMonth, statementDate]) => ({ statementMonth, statementDate }));
}

export async function getFormat7StatementDetail(
  customerCode: string,
  statementMonth?: string
) {
  const auth = getOAuth2Client();
  const fixedSpreadsheetId = resolveFixedSpreadsheetId();
  const months = await getFormat7StatementMonthsForCustomer(customerCode);
  const resolvedMonth = statementMonth || months[0]?.statementMonth;
  if (!resolvedMonth) {
    return null;
  }

  const values = await getSheetValuesByTitle(
    auth,
    fixedSpreadsheetId,
    `F7STAT_${resolvedMonth.replace(/-/g, "")}`
  );
  if (values.length <= 1) return null;

  const detailRows = values.slice(1).filter((row) => (row[2] || "") === customerCode);
  if (!detailRows.length) return null;

  return {
    statementMonth: detailRows[0][0] || "",
    statementDate: detailRows[0][1] || "",
    customerCode: detailRows[0][2] || "",
    customerName: detailRows[0][3] || "",
    salesman: detailRows[0][4] || "",
    summary: {
      current: toNumber(detailRows[0][14]),
      daysOutstanding1To30: toNumber(detailRows[0][15]),
      daysOutstanding31To60: toNumber(detailRows[0][16]),
      daysOutstanding61To90: toNumber(detailRows[0][17]),
      daysOutstanding91Plus: toNumber(detailRows[0][18]),
      total: toNumber(detailRows[0][19]),
    },
    invoiceRows: detailRows
      .filter((row) => row[5] === "invoice")
      .map((row) => ({
        invoiceNo: row[6] || "",
        invoiceDate: row[7] || "",
        dueDate: row[8] || "",
        currency: row[9] || "",
        openAmount: row[10] ? toNumber(row[10]) : null,
        bucket: row[11] || "",
      })),
    balanceRows: detailRows
      .filter((row) => row[5] === "balance")
      .map((row) => ({
        balanceMonth: row[12] || "",
        balanceAmount: row[13] ? toNumber(row[13]) : null,
        bucket: row[11] || "",
      })),
  } as Format7StatementDetail;
}
