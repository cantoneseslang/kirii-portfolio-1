import Link from "next/link";
import {
  getFormat7StatementDetail,
  getFormat7StatementMonthsForCustomer,
} from "@/lib/format7-google-sheet";

export const dynamic = "force-dynamic";

function formatMonthLabel(statementMonth: string) {
  if (!statementMonth) return "";
  const [year, month] = statementMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function formatDateLabel(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
}

function formatAmount(value: number | null) {
  if (value === null || typeof value === "undefined") return "-";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

type PageProps = {
  params: Promise<{ customerCode: string }>;
  searchParams: Promise<{ statementMonth?: string }>;
};

export default async function Format7CustomerStatementPage({
  params,
  searchParams,
}: PageProps) {
  const { customerCode } = await params;
  const { statementMonth } = await searchParams;

  const availableMonths = await getFormat7StatementMonthsForCustomer(customerCode);
  const resolvedMonth = statementMonth || availableMonths[0]?.statementMonth || "";
  const detail = resolvedMonth
    ? await getFormat7StatementDetail(customerCode, resolvedMonth)
    : null;

  if (!detail) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Customer Statement</h1>
            <p className="mt-1 text-sm text-red-600">
              No statement detail found for {customerCode}.
            </p>
          </div>
          <Link href="/format7/latest" className="text-blue-600 underline">
            Back to Collect Payment
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {detail.customerCode} · {detail.customerName}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Salesman: {detail.salesman || "Unassigned"}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Statement Date: {formatDateLabel(detail.statementDate)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/format7/latest" className="text-blue-600 underline">
            Back to Collect Payment
          </Link>
          <Link href="/dashboard" className="text-blue-600 underline">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-sm font-medium text-gray-700">Statement Month</div>
        <div className="flex flex-wrap gap-2">
          {availableMonths.map((month) => {
            const active = month.statementMonth === detail.statementMonth;
            return (
              <Link
                key={month.statementMonth}
                href={`/format7/latest/customer/${encodeURIComponent(customerCode)}?statementMonth=${encodeURIComponent(month.statementMonth)}`}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-300"
                }`}
              >
                {formatMonthLabel(month.statementMonth)}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Outstanding Summary</h2>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Current", detail.summary.current],
            ["Days Outstanding 1-30", detail.summary.daysOutstanding1To30],
            ["Days Outstanding 31-60", detail.summary.daysOutstanding31To60],
            ["Days Outstanding 61-90", detail.summary.daysOutstanding61To90],
            ["Days Outstanding 91-Plus", detail.summary.daysOutstanding91Plus],
            ["Total", detail.summary.total],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label}
              </div>
              <div className="mt-2 text-lg font-semibold">
                {formatAmount(value as number)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Invoice Rows</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Invoice No</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Invoice Date</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Due Date</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Currency</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Open Amount</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Bucket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {detail.invoiceRows.map((row) => (
                <tr key={`${row.invoiceNo}-${row.invoiceDate}`}>
                  <td className="px-3 py-2">{row.invoiceNo}</td>
                  <td className="px-3 py-2">{formatDateLabel(row.invoiceDate)}</td>
                  <td className="px-3 py-2">{formatDateLabel(row.dueDate)}</td>
                  <td className="px-3 py-2">{row.currency}</td>
                  <td className="px-3 py-2 text-right">{formatAmount(row.openAmount)}</td>
                  <td className="px-3 py-2">{row.bucket || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Balance Footer</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Balance Month</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Balance Amount (HKD)</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Bucket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {detail.balanceRows.map((row) => (
                <tr key={`${row.balanceMonth}-${row.bucket}`}>
                  <td className="px-3 py-2">{row.balanceMonth}</td>
                  <td className="px-3 py-2 text-right">{formatAmount(row.balanceAmount)}</td>
                  <td className="px-3 py-2">{row.bucket || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
