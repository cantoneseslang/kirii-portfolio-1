import Link from "next/link";
import CollectPaymentDataNoticeDialog from "@/components/collect-payment-data-notice-dialog";
import Format7TableViewer from "@/components/format7-table-viewer";
import { getLatestFormat7SheetData } from "@/lib/format7-google-sheet";
import { requireCardAccessPage, logActivityEventServer, getAuthenticatedProfile } from "@/lib/portfolio-access";

export const dynamic = "force-dynamic";

export default async function LatestFormat7Page() {
  await requireCardAccessPage("collect_payment")

  const access = await getAuthenticatedProfile()
  if (access.ok) {
    await logActivityEventServer({
      userId: access.userId,
      eventType: "page_view",
      resourceKey: "collect_payment",
      resourcePath: "/format7/latest",
    })
  }
  let sheetTitle = "";
  let rows: string[][] = [];

  try {
    const latestData = await getLatestFormat7SheetData();
    sheetTitle = latestData.sheetTitle;
    rows = latestData.rows;
  } catch {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <CollectPaymentDataNoticeDialog />
        <h1 className="text-2xl font-bold">Collect Payment</h1>
        <p className="mt-4 text-red-600">Failed to fetch the latest data.</p>
        <Link href="/dashboard" className="text-blue-600 underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  if (rows.length === 0) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <CollectPaymentDataNoticeDialog />
        <h1 className="text-2xl font-bold">Collect Payment</h1>
        <p className="text-sm text-gray-600 mt-1">Sheet: {sheetTitle}</p>
        <p className="mt-6 text-gray-600">No data available to display.</p>
        <Link href="/dashboard" className="text-blue-600 underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  const headers = rows[0] ?? [];
  const bodyRows = rows.slice(1);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <CollectPaymentDataNoticeDialog />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Collect Payment</h1>
          <p className="text-sm text-gray-600 mt-1">Sheet: {sheetTitle}</p>
        </div>
        <Link href="/dashboard" className="text-blue-600 underline">
          Back to Dashboard
        </Link>
      </div>

      <Format7TableViewer
        headers={headers}
        rows={bodyRows}
        customerDetailBasePath="/format7/latest/customer"
      />
    </main>
  );
}
