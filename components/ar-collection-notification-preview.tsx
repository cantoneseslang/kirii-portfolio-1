"use client"

type ArCollectionNotificationPreviewProps = {
  payload: Record<string, unknown>
  body: string | null
  confirmed?: boolean
}

function text(value: unknown): string {
  if (value == null) return "-"
  return String(value).trim() || "-"
}

function formatAmount(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return text(value)
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
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

export function ArCollectionNotificationPreview({
  payload,
  body,
  confirmed = false,
}: ArCollectionNotificationPreviewProps) {
  const customerCode = text(payload.customerCode)
  const customerEn = text(payload.customerEnName)
  const customerCn = text(payload.customerCnName)
  const monthLabel = text(payload.monthLabel || payload.monthKey)
  const amount = formatAmount(payload.amount)
  const expected = text(payload.expectedCollectionDate).replace(/-/g, "/")
  const method = methodLabel(payload.collectionMethod)
  const chequeDate = payload.chequeDate
    ? text(payload.chequeDate).replace(/-/g, "/")
    : null
  const confirmedBy =
    text(payload.confirmedByName) !== "-"
      ? text(payload.confirmedByName)
      : "Sakon"
  const confirmedAt = payload.confirmedAt
    ? (() => {
        const date = new Date(String(payload.confirmedAt))
        if (Number.isNaN(date.getTime())) return text(payload.confirmedAt)
        return date.toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Hong_Kong",
        })
      })()
    : null

  return (
    <div className="flex h-full w-full items-start justify-center overflow-y-auto bg-slate-100 p-4 md:p-8">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        {confirmed ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Confirmed
            </p>
            <p className="mt-1 text-base font-bold text-emerald-900">
              {confirmedBy} confirmed this AR Collection
            </p>
            {confirmedAt ? (
              <p className="mt-1 text-sm text-emerald-800">Confirmed at: {confirmedAt}</p>
            ) : null}
          </div>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {confirmed ? "Your AR Collection plan" : "AR Collection plan"}
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">
          {customerCode} · {customerEn}
        </h3>
        {customerCn !== "-" ? (
          <p className="mt-1 text-sm text-slate-600">{customerCn}</p>
        ) : null}

        <dl className="mt-5 grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="font-semibold text-slate-600">Collection owner</dt>
          <dd className="font-medium text-slate-900">
            {text(payload.salespersonName)}
          </dd>
          <dt className="font-semibold text-slate-600">Recorded by</dt>
          <dd className="font-medium text-slate-900">
            {text(payload.recordedBy)}
          </dd>
          <dt className="font-semibold text-slate-600">Balance</dt>
          <dd className="tabular-nums text-slate-900">
            {monthLabel} {amount}
          </dd>
          <dt className="font-semibold text-slate-600">Expected</dt>
          <dd>{expected}</dd>
          <dt className="font-semibold text-slate-600">Method</dt>
          <dd>
            {method}
            {chequeDate
              ? ` (${
                  String(payload.collectionMethod || "") === "post_dated_cheque"
                    ? "Cheque"
                    : "Due"
                }: ${chequeDate})`
              : ""}
          </dd>
          {String(payload.collectionMethod || "") === "negotiating_deadline" ? (
            <>
              <dt className="font-semibold text-slate-600">Date</dt>
              <dd>{text(payload.negotiationDate).replace(/-/g, "/")}</dd>
              <dt className="font-semibold text-slate-600">Contact person</dt>
              <dd>{text(payload.contactPerson)}</dd>
              <dt className="font-semibold text-slate-600">Job title</dt>
              <dd>{text(payload.jobTitle)}</dd>
              <dt className="font-semibold text-slate-600">Payment schedule</dt>
              <dd>{text(payload.paymentSchedule)}</dd>
              <dt className="font-semibold text-slate-600">Amount</dt>
              <dd className="tabular-nums">
                {formatAmount(payload.negotiationAmount)}
              </dd>
            </>
          ) : null}
        </dl>

        {body ? (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {body}
          </p>
        ) : null}
      </div>
    </div>
  )
}
