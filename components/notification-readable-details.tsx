"use client"

type DetailRow = { label: string; value: string }

function text(value: unknown): string {
  if (value == null) return "-"
  const s = String(value).trim()
  return s || "-"
}

function formatAmount(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return text(value)
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

function formatDate(value: unknown): string {
  const s = text(value)
  if (s === "-") return s
  return s.replace(/-/g, "/")
}

function methodLabel(method: unknown): string {
  switch (String(method || "")) {
    case "post_dated_cheque":
      return "Post-dated cheque"
    case "bank_transfer":
      return "Bank transfer"
    case "cash":
      return "Cash"
    case "negotiating_deadline":
      return "Negotiating the payment deadline"
    case "other":
      return "Other"
    default:
      return text(method)
  }
}

function DetailTable({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="font-semibold text-slate-600">{row.label}</dt>
          <dd className="text-slate-900 break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ArCollectionReadableDetails({
  payload,
}: {
  payload: Record<string, unknown>
}) {
  const rows: DetailRow[] = [
    {
      label: "Collection owner",
      value: text(payload.salespersonName),
    },
    {
      label: "Recorded by",
      value: text(payload.recordedBy),
    },
    { label: "CSCODE", value: text(payload.customerCode) },
    { label: "Customer EN", value: text(payload.customerEnName) },
    { label: "Customer CN", value: text(payload.customerCnName) },
    {
      label: "Balance",
      value: `${text(payload.monthLabel || payload.monthKey)} ${formatAmount(payload.amount)}`,
    },
    {
      label: "Expected date",
      value: formatDate(payload.expectedCollectionDate),
    },
    { label: "Method", value: methodLabel(payload.collectionMethod) },
  ]

  if (payload.chequeDate) {
    const dateLabel =
      String(payload.collectionMethod || "") === "post_dated_cheque"
        ? "Cheque date"
        : "Due date"
    rows.push({ label: dateLabel, value: formatDate(payload.chequeDate) })
  }
  if (String(payload.collectionMethod || "") === "negotiating_deadline") {
    rows.push(
      { label: "Date", value: formatDate(payload.negotiationDate) },
      { label: "Contact person", value: text(payload.contactPerson) },
      { label: "Job title", value: text(payload.jobTitle) },
      { label: "Payment schedule", value: text(payload.paymentSchedule) },
      { label: "Amount", value: formatAmount(payload.negotiationAmount) },
    )
  }
  if (payload.otherMethodNote) {
    rows.push({ label: "Other note", value: text(payload.otherMethodNote) })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-800">AR Collection plan</p>
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        <p>
          <span className="font-semibold">Collection owner:</span>{" "}
          {text(payload.salespersonName)}
        </p>
        <p className="mt-1">
          <span className="font-semibold">Recorded by:</span>{" "}
          {text(payload.recordedBy)}
        </p>
      </div>
      <DetailTable rows={rows} />
    </div>
  )
}

function ProductionOrderReadableDetails({
  payload,
}: {
  payload: Record<string, unknown>
}) {
  const header =
    payload.header && typeof payload.header === "object"
      ? (payload.header as Record<string, unknown>)
      : payload
  const products = Array.isArray(payload.products) ? payload.products : []

  const rows: DetailRow[] = [
    { label: "送貨單號", value: text(header.deliveryNoteNo) },
    { label: "訂貨公司", value: text(header.orderingCompany) },
    { label: "交貨日期", value: text(header.deliveryDate) },
    { label: "負責人", value: text(header.personInCharge) },
    { label: "制單人", value: text(header.preparerSignature) },
    { label: "產品行數", value: String(products.length) },
  ]

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-800">Production Order / 生產依頼書</p>
      <DetailTable rows={rows} />
    </div>
  )
}

function GenericReadableDetails({ payload }: { payload: Record<string, unknown> }) {
  const preferredKeys = [
    "companyNameEn",
    "companyNameZh",
    "registrationId",
    "approvalStatus",
    "customerCode",
    "customerEnName",
    "shareUrl",
  ]
  const rows: DetailRow[] = []
  for (const key of preferredKeys) {
    if (payload[key] == null) continue
    if (typeof payload[key] === "object") continue
    rows.push({ label: key, value: text(payload[key]) })
  }

  if (rows.length === 0) {
    for (const [key, value] of Object.entries(payload)) {
      if (value == null || typeof value === "object") continue
      rows.push({ label: key, value: text(value) })
      if (rows.length >= 12) break
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No details to display.</p>
  }

  return <DetailTable rows={rows} />
}

export function NotificationReadableDetails({
  source,
  payload,
}: {
  source: string
  payload: Record<string, unknown>
}) {
  if (
    source === "sales-dashboard-ar-collection" ||
    source === "portfolio-ar-collection-confirmed"
  ) {
    return (
      <div className="space-y-3">
        {source === "portfolio-ar-collection-confirmed" ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
            <p className="font-semibold">Sakon confirmed</p>
            <p className="mt-1">
              Confirmed by:{" "}
              {text(payload.confirmedByName) !== "-"
                ? text(payload.confirmedByName)
                : "Sakon"}
            </p>
            {payload.confirmedAt ? (
              <p className="mt-1">
                Confirmed at:{" "}
                {(() => {
                  const date = new Date(String(payload.confirmedAt))
                  if (Number.isNaN(date.getTime())) return formatDate(payload.confirmedAt)
                  return date.toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Hong_Kong",
                  })
                })()}
              </p>
            ) : null}
          </div>
        ) : null}
        <ArCollectionReadableDetails payload={payload} />
      </div>
    )
  }
  if (source === "pq-form-production-order") {
    return <ProductionOrderReadableDetails payload={payload} />
  }
  if (source === "hk-new-customer" || source.includes("new-customer")) {
    return (
      <div className="space-y-4">
        <DetailTable
          rows={[
            { label: "Company", value: text(payload.companyNameEn) },
            { label: "中文名稱", value: text(payload.companyNameZh) },
            { label: "BR No.", value: text(payload.brNumber) },
            { label: "Sales Rep", value: text(payload.salesRepName) },
            { label: "Submitted by", value: text(payload.submitterName) || text(payload.createdByName) },
            { label: "Email", value: text(payload.submitterEmail) },
            {
              label: "Status",
              value:
                payload.kind === "submitter-approved"
                  ? "Approved / 已批准"
                  : payload.kind === "submitter-rejected"
                    ? "Rejected / 已拒絕"
                    : text(payload.approvalStatus),
            },
            ...(text(payload.decidedByName) !== "-"
              ? [{ label: "Decided by", value: text(payload.decidedByName) }]
              : []),
            ...(text(payload.comment) !== "-"
              ? [{ label: "Comment", value: text(payload.comment) }]
              : []),
          ]}
        />
      </div>
    )
  }
  return <GenericReadableDetails payload={payload} />
}
