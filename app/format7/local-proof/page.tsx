import Format7TableViewer from "@/components/format7-table-viewer";

const headers = [
  "customer code",
  "Format7 summary",
  "salesman",
  "Days Outstanding 1-30",
  "Days Outstanding 31-60",
  "Days Outstanding 61-90",
  "Days Outstanding 91-Plus",
  "Total",
];

const rows = [
  ["A0045", "AID Ltd.", "Billy Lau, Grace Poon, Ivan Ip, Kirii (HK)", "0.0", "0.0", "13,872.0", "3,041.0", "16,913.0"],
  ["B0061", "BONETTO (ASIA) LTD", "Alex Wong", "0.0", "3,748.2", "0.0", "0.0", "3,748.2"],
  ["C0002", "Cemac (Hong Kong) Ltd.,", "Alex Wong, Billy Li, Ivan Ip, Kami Kit, Kirii (HK)", "42,561.1", "21,288.0", "2,808.0", "235,602.0", "302,259.1"],
  ["合計", "", "", "1,278,051.1", "4,824,726.4", "2,753,991.2", "10,569,648.3", "19,426,417.0"],
];

export default function LocalProofPage() {
  return (
    <main className="max-w-7xl mx-auto p-6">
      <h1 className="text-xl font-semibold">Local Proof: Column Resize Verification</h1>
      <p className="text-sm text-gray-600 mt-1">This page uses local mock data only.</p>
      <Format7TableViewer headers={headers} rows={rows} />
    </main>
  );
}
