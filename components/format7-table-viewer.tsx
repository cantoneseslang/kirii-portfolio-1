"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

type SortDirection = "asc" | "desc";

type Props = {
  headers: string[];
  rows: string[][];
  customerDetailBasePath?: string;
};

function parseNumber(value: string) {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const numberValue = Number(cleaned);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeCellText(value: string) {
  return value.replace(/\r?\n+/g, " ").replace(/\s{2,}/g, " ").trim();
}

function getInitialColumnWidth(index: number) {
  // [customer code, customer name, salesman, 1-30, 31-60, 61-90, 91-Plus, Total]
  const defaults = [115, 200, 210, 140, 140, 140, 140, 145];
  return defaults[index] ?? 140;
}

function getDefaultColumnWidths(headers: string[]) {
  return headers.map((_, colIndex) => getInitialColumnWidth(colIndex));
}

function getDisplayHeader(cell: string, index: number) {
  if (index === 1) return "customer name";
  return cell;
}

/** Excel column width (wch) so long headers are not all truncated to "Days Outsta…". */
function sheetColsFromAoA(headerRow: string[], dataRows: string[][]): { wch: number }[] {
  const sampleRows = Math.min(dataRows.length, 100);
  return headerRow.map((header, c) => {
    let maxChars = [...header].length;
    for (let r = 0; r < sampleRows; r++) {
      const cell = dataRows[r]?.[c] ?? "";
      maxChars = Math.max(maxChars, [...cell].length);
    }
    const wch = Math.min(Math.max(maxChars + 2, 14), 52);
    return { wch };
  });
}

/** Align with create_format7_customer_summary.py / GAS format7ApplySummarySheetPresentation_ */
const FORMAT7_HEADER_FILL = "#D3D3D3";
const FORMAT7_FILL_61_90 = "#FFE6CC";
const FORMAT7_FILL_91_120 = "#FFE0E0";
const FORMAT7_FILL_120_PLUS = "#FFCCCC";
const FORMAT7_FILL_TOTAL_ROW = "#E6E6FA";
const FORMAT7_FILL_FY_POSITIVE = "#E06666";

const FORMAT7_FOLLOWUP_HEADERS_LOWER = [
  "date",
  "contact person",
  "job title",
  "specific ways to follow up on payments",
  "payment schedule",
  "next actions",
] as const;

function normalizeHeaderKey(value: string) {
  return value.replace(/\r?\n+/g, " ").replace(/\s{2,}/g, " ").trim().toLowerCase();
}

const FORMAT7_FOLLOWUP_HEADER_SET = new Set<string>(FORMAT7_FOLLOWUP_HEADERS_LOWER);

function isFollowupColumnHeader(header: string) {
  return FORMAT7_FOLLOWUP_HEADER_SET.has(normalizeHeaderKey(header));
}

function isFyOutstandingColumn(header: string) {
  // Sheet labels may be "2024-2025年outstanding" or "2024-2025年 outstanding" (space).
  const collapsed = normalizeHeaderKey(header).replace(/\s+/g, "");
  return collapsed.includes("年outstanding");
}

/** Python format7_fy_cell_highlight_positive_only: round(x, 2) > 0 */
function fyHighlightPositiveOnly(cellText: string): boolean {
  const numeric = parseNumber(cellText);
  if (numeric == null) return false;
  return Math.round(numeric * 100) / 100 > 0;
}

function agingHighlightPositive(cellText: string): boolean {
  const numeric = parseNumber(cellText);
  return numeric != null && numeric > 0;
}

export default function Format7TableViewer({ headers, rows, customerDetailBasePath }: Props) {
  const [sortState, setSortState] = useState<{ index: number; direction: SortDirection } | null>(null);
  const defaultColumnWidths = useMemo(() => getDefaultColumnWidths(headers), [headers]);
  const [columnWidths, setColumnWidths] = useState<number[]>(defaultColumnWidths);
  const [searchQuery, setSearchQuery] = useState("");
  const isResizingRef = useRef(false);
  const resizeCleanupRef = useRef<(() => void) | null>(null);

  const colIndex61to90 = useMemo(
    () =>
      headers.findIndex((h) => normalizeHeaderKey(h) === normalizeHeaderKey("Days Outstanding 61-90")),
    [headers]
  );
  const colIndex91to120 = useMemo(
    () =>
      headers.findIndex((h) => normalizeHeaderKey(h) === normalizeHeaderKey("Days Outstanding 91-120")),
    [headers]
  );
  const colIndex120Plus = useMemo(
    () =>
      headers.findIndex(
        (h) =>
          normalizeHeaderKey(h) ===
          normalizeHeaderKey("Days Outstanding 120-Plus半年以上")
      ),
    [headers]
  );
  /** Legacy single-column layout → treat like 120+ bucket styling */
  const colIndex91PlusLegacy = useMemo(
    () =>
      headers.findIndex((h) => normalizeHeaderKey(h) === normalizeHeaderKey("Days Outstanding 91-plus")),
    [headers]
  );
  const fyColumnIndices = useMemo(
    () =>
      headers
        .map((h, i) => (isFyOutstandingColumn(h) ? i : -1))
        .filter((i) => i >= 0),
    [headers]
  );
  const followupColumnIndices = useMemo(
    () => headers.map((h, i) => (isFollowupColumnHeader(h) ? i : -1)).filter((i) => i >= 0),
    [headers]
  );
  const customerNameColIndex = useMemo(() => {
    const byOriginal = headers.findIndex((h) => h.trim().toLowerCase() === "format7 summary");
    if (byOriginal !== -1) return byOriginal;
    return headers.findIndex((h) => h.trim().toLowerCase() === "customer name");
  }, [headers]);
  const customerCodeColIndex = useMemo(() => {
    const byOriginal = headers.findIndex((h) => h.trim().toLowerCase() === "customer code");
    if (byOriginal !== -1) return byOriginal;
    return headers.findIndex((h) => h.trim().toLowerCase() === "コード");
  }, [headers]);

  useEffect(() => {
    setColumnWidths(defaultColumnWidths);
  }, [defaultColumnWidths]);

  const sortedRows = useMemo(() => {
    if (rows.length === 0) return rows;

    // Keep the final summary row fixed at the bottom and exclude from sorting.
    const detailRows = rows.slice(0, -1);
    const summaryRow = rows[rows.length - 1];
    const keyword = searchQuery.trim().toLowerCase();
    const filteredDetails =
      keyword && customerNameColIndex !== -1
        ? detailRows.filter((row) => normalizeCellText(row[customerNameColIndex] ?? "").toLowerCase().includes(keyword))
        : detailRows;

    if (!sortState) {
      return keyword ? filteredDetails : [...filteredDetails, summaryRow];
    }

    const { index, direction } = sortState;
    const factor = direction === "asc" ? 1 : -1;
    const sortedDetails = [...filteredDetails].sort((a, b) => {
      const aText = normalizeCellText(a[index] ?? "");
      const bText = normalizeCellText(b[index] ?? "");
      const aNum = parseNumber(aText);
      const bNum = parseNumber(bText);
      if (aNum != null && bNum != null) return (aNum - bNum) * factor;
      return aText.localeCompare(bText, undefined, { sensitivity: "base", numeric: true }) * factor;
    });
    return keyword ? sortedDetails : [...sortedDetails, summaryRow];
  }, [rows, sortState, searchQuery, customerNameColIndex]);

  const handleSort = (index: number) => {
    setSortState((current) => {
      if (!current || current.index !== index) return { index, direction: "asc" };
      return { index, direction: current.direction === "asc" ? "desc" : "asc" };
    });
  };

  const handleDownload = () => {
    const headerRow = headers.map((header, index) => getDisplayHeader(header, index));
    const sheetRows = sortedRows.map((row) => row.map((cell) => normalizeCellText(cell ?? "")));
    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...sheetRows]);
    worksheet["!cols"] = sheetColsFromAoA(headerRow, sheetRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Collect Payment");
    XLSX.writeFile(workbook, "collect-payment-latest.xlsx");
  };

  const handleResizeStart = (columnIndex: number, startX: number) => {
    if (resizeCleanupRef.current) resizeCleanupRef.current();

    isResizingRef.current = true;
    const startWidth = columnWidths[columnIndex] || getInitialColumnWidth(columnIndex);
    const minWidth = 80;

    const onPointerMove = (event: PointerEvent) => {
      const nextWidth = Math.max(minWidth, startWidth + (event.clientX - startX));
      setColumnWidths((prev) => {
        const next = [...prev];
        next[columnIndex] = nextWidth;
        return next;
      });
    };

    const onPointerUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      resizeCleanupRef.current = null;
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    resizeCleanupRef.current = onPointerUp;
  };

  const tableWidthPx = columnWidths.reduce((sum, width, index) => {
    const base = width || getInitialColumnWidth(index);
    return sum + base;
  }, 0);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search customer name"
          className="h-10 w-64 rounded-md border border-gray-300 bg-white px-3 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#02315a]/40"
        />
        <a
          href="/format7/latest/export"
          className="px-3 py-2 rounded-md bg-[#02315a] text-white text-sm hover:opacity-90 inline-flex items-center justify-center no-underline"
        >
          Download Excel (sheet)
        </a>
        <button
          type="button"
          onClick={handleDownload}
          className="px-3 py-2 rounded-md border border-gray-400 bg-white text-gray-800 text-sm hover:bg-gray-50"
          title="Same numbers as the table here; no Sheet colors. Column widths are auto-sized."
        >
          Plain XLSX (this view)
        </button>
      </div>
      <p className="mt-2 text-right text-xs text-gray-500 max-w-full ml-auto">
        <span className="font-medium text-gray-600">Download Excel (sheet):</span> full Google Sheet
        workbook (.xlsx), same formatting and colors as the Sheet.
        <span className="mx-1 text-gray-400">·</span>
        <span className="font-medium text-gray-600">Plain XLSX:</span> snapshot of this web table only
        (file saves as collect-payment-latest.xlsx).
      </p>
      <div className="mt-3 overflow-auto border rounded-lg bg-white">
        <table
          className="w-max table-fixed border-separate border-spacing-0 text-sm"
          style={{ width: `${tableWidthPx}px` }}
        >
          <colgroup>
            {headers.map((_, index) => (
              <col key={`col-${index}`} style={{ width: `${columnWidths[index] || getInitialColumnWidth(index)}px` }} />
            ))}
          </colgroup>
          <thead style={{ backgroundColor: FORMAT7_HEADER_FILL }}>
            <tr>
              {headers.map((cell, index) => {
                const isSorted = sortState?.index === index;
                const arrow = isSorted ? (sortState?.direction === "asc" ? " ▲" : " ▼") : "";
                return (
                  <th
                    key={`header-${index}`}
                    className="relative text-left px-3 py-2 font-semibold border-r border-b border-gray-300 first:border-l"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isResizingRef.current) return;
                        handleSort(index);
                      }}
                      className="block w-full text-left hover:underline pr-6 leading-tight whitespace-normal break-words"
                    >
                      {getDisplayHeader(cell, index)}
                      {arrow}
                    </button>
                    <div
                      role="presentation"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleResizeStart(index, event.clientX);
                      }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleResizeStart(index, event.clientX);
                      }}
                      onTouchStart={(event) => {
                        const point = event.touches[0];
                        if (!point) return;
                        event.preventDefault();
                        event.stopPropagation();
                        handleResizeStart(index, point.clientX);
                      }}
                      className="absolute top-0 right-0 translate-x-1/2 z-30 h-full w-3 cursor-col-resize select-none bg-transparent hover:bg-blue-100/70 active:bg-blue-200/80"
                      title="Drag to resize column width"
                    >
                      <span className="absolute left-1/2 top-0 h-full -translate-x-1/2 border-l-2 border-[#4b5563]" />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {headers.map((_, colIndex) => {
                  const rawCellText = row[colIndex] ?? "";
                  const cellText = normalizeCellText(rawCellText);
                  const numeric = parseNumber(cellText);
                  const customerCode = normalizeCellText(row[customerCodeColIndex] ?? "");
                  const isSummaryRow = customerCode === "" || customerCode === "合計";
                  const isFollowupCol = followupColumnIndices.includes(colIndex);

                  let cellBgStyle: CSSProperties | undefined;
                  if (isSummaryRow) {
                    if (isFollowupCol) {
                      cellBgStyle = { backgroundColor: "#ffffff" };
                    } else {
                      cellBgStyle = { backgroundColor: FORMAT7_FILL_TOTAL_ROW };
                    }
                  } else if (isFollowupCol) {
                    cellBgStyle = { backgroundColor: "#ffffff" };
                  } else if (fyColumnIndices.includes(colIndex) && fyHighlightPositiveOnly(cellText)) {
                    cellBgStyle = { backgroundColor: FORMAT7_FILL_FY_POSITIVE };
                  } else if (colIndex === colIndex61to90 && agingHighlightPositive(cellText)) {
                    cellBgStyle = { backgroundColor: FORMAT7_FILL_61_90 };
                  } else if (colIndex === colIndex91to120 && agingHighlightPositive(cellText)) {
                    cellBgStyle = { backgroundColor: FORMAT7_FILL_91_120 };
                  } else if (
                    (colIndex === colIndex120Plus || colIndex === colIndex91PlusLegacy) &&
                    agingHighlightPositive(cellText)
                  ) {
                    cellBgStyle = { backgroundColor: FORMAT7_FILL_120_PLUS };
                  }

                  const numericAlignClass = numeric != null ? "text-right tabular-nums" : "text-left";
                  const clipClass = numeric != null ? "" : "overflow-hidden text-ellipsis";
                  const isCustomerLinkCell =
                    !!customerDetailBasePath &&
                    !isSummaryRow &&
                    (colIndex === customerCodeColIndex || colIndex === customerNameColIndex);
                  const customerHref = isCustomerLinkCell
                    ? `${customerDetailBasePath}/${encodeURIComponent(customerCode)}`
                    : "";

                  return (
                    <td
                      key={`cell-${rowIndex}-${colIndex}`}
                      title={cellText}
                      style={cellBgStyle}
                      className={`px-3 py-2 h-12 border-r border-b border-gray-300 align-middle whitespace-nowrap first:border-l bg-white ${numericAlignClass} ${clipClass}`}
                    >
                      {isCustomerLinkCell ? (
                        <Link
                          href={customerHref}
                          className="block overflow-hidden text-ellipsis whitespace-nowrap text-[#02315a] underline-offset-2 hover:underline"
                        >
                          {cellText}
                        </Link>
                      ) : (
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                          {cellText}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
