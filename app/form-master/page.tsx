import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Footer } from "@/components/footer"
import { requireCardAccessPage } from "@/lib/portfolio-access"
import { FileSpreadsheet, FileText } from "lucide-react"

type DownloadItem = {
  label: string
  href: string
}

type FormRow = {
  title: string
  formNumber: string
  revision: string
  factoryDistribution: string
  downloads?: DownloadItem[]
}

type FileCategory = "xlsx" | "docs" | "pdf"

const formRows: FormRow[] = [
  { title: "Certificate of Goods Received", formNumber: "ADM-02", revision: "2/04", factoryDistribution: "1" },
  {
    title: "Nonconformity Report",
    formNumber: "ADM-03",
    revision: "10/09",
    factoryDistribution: "1",
    downloads: [{ label: "ADM-03 04 CPAR PN Log.xls", href: "/form-master/adm-03-04-cpar-pn-log.xls" }],
  },
  {
    title: "Corrective and Preventive Action Request Log",
    formNumber: "ADM-04",
    revision: "7/98",
    factoryDistribution: "-",
    downloads: [{ label: "CPAR Log (ADM-03 04 CPAR PN Log.xls)", href: "/form-master/adm-03-04-cpar-pn-log.xls" }],
  },
  { title: "Credit Note", formNumber: "ADM-05", revision: "7/05", factoryDistribution: "-", downloads: [] },
  { title: "Debit Note", formNumber: "ADM-06", revision: "7/05", factoryDistribution: "-", downloads: [] },
  { title: "Delivery Order", formNumber: "ADM-07", revision: "2/04", factoryDistribution: "1", downloads: [] },
  {
    title: "Employee Training Record",
    formNumber: "ADM-08",
    revision: "7/98",
    factoryDistribution: "-",
    downloads: [{ label: "Training Record F.xls", href: "/form-master/training-record-f.xls" }],
  },
  { title: "Invoice", formNumber: "ADM-09", revision: "2/04", factoryDistribution: "-", downloads: [] },
  { title: "Purchase Order", formNumber: "ADM-10", revision: "2/04", factoryDistribution: "1", downloads: [] },
  { title: "Quotation", formNumber: "ADM-11", revision: "2/04", factoryDistribution: "-", downloads: [] },
  {
    title: "Supplier Assessment Report",
    formNumber: "ADM-14",
    revision: "10/17",
    factoryDistribution: "-",
    downloads: [{ label: "ADM-14 Supplier Assessment Report.doc", href: "/form-master/adm-14-supplier-assessment-report.doc" }],
  },
  {
    title: "Internal Quality Audit Report",
    formNumber: "ADM-15",
    revision: "7/98",
    factoryDistribution: "-",
    downloads: [{ label: "Audit Summary Form.xls", href: "/form-master/audit-summary-form.xls" }],
  },
  { title: "Product Nonconformance Report", formNumber: "ADM-16", revision: "7/98", factoryDistribution: "1", downloads: [] },
  {
    title: "Customer Satisfaction Survey",
    formNumber: "ADM-17",
    revision: "12/13",
    factoryDistribution: "-",
    downloads: [
      { label: "List.xlsx", href: "/form-master/customer-satisfaction-survey-list.xlsx" },
      { label: "Calculation.xlsx", href: "/form-master/customer-satisfaction-survey-calculation.xlsx" },
    ],
  },
  {
    title: "Course Evaluation Form",
    formNumber: "ADM-18",
    revision: "12/05",
    factoryDistribution: "-",
    downloads: [{ label: "ADM-18 Course Evaluation Form.doc", href: "/form-master/adm-18-course-evaluation-form.doc" }],
  },
  {
    title: "Production Order",
    formNumber: "ADM-19",
    revision: "3/25",
    factoryDistribution: "-",
    downloads: [{ label: "Form Master.xls", href: "/form-master/form-master.xls" }],
  },
  { title: "Purchase Order", formNumber: "FAC-04", revision: "1/07", factoryDistribution: "-", downloads: [] },
  {
    title: "維修 / 保養指引及記錄 (1) [ 2噸吊機 / 3噸吊機 ]",
    formNumber: "FAC-05",
    revision: "3/22",
    factoryDistribution: "1",
    downloads: [{ label: "(1) Sheet - FAC-05 06 07 維修保養.xls", href: "/form-master/fac-05-06-07-maintenance.xls" }],
  },
  {
    title: "維修 / 保養指引及記錄 (2) [ Roll Former ]",
    formNumber: "FAC-06",
    revision: "3/22",
    factoryDistribution: "1",
    downloads: [{ label: "(2) Sheet - FAC-05 06 07 維修保養.xls", href: "/form-master/fac-05-06-07-maintenance.xls" }],
  },
  {
    title: "維修 / 保養指引及記錄 (3) [ 模具 ]",
    formNumber: "FAC-07",
    revision: "3/22",
    factoryDistribution: "1",
    downloads: [{ label: "(3) Sheet - FAC-05 06 07 維修保養.xls", href: "/form-master/fac-05-06-07-maintenance.xls" }],
  },
  {
    title: "產品 品質檢定及用料記錄表",
    formNumber: "FAC-08",
    revision: "2/16",
    factoryDistribution: "1",
    downloads: [{ label: "new stud qc form.doc", href: "/form-master/new-stud-qc-form.doc" }],
  },
  {
    title: "龍骨 品質檢定及用料記錄表",
    formNumber: "FAC-09",
    revision: "10/04",
    factoryDistribution: "1",
    downloads: [{ label: "new stud qc form.doc", href: "/form-master/new-stud-qc-form.doc" }],
  },
  {
    title: "副龍骨 品質檢定及用料記錄表",
    formNumber: "FAC-10",
    revision: "03/26",
    factoryDistribution: "1",
    downloads: [
      {
        label: "FAC-10 副龍骨 品質檢定及用料記錄表.doc",
        href: "/form-master/fac-10-secondary-keel-qc-material-record.doc",
      },
    ],
  },
  {
    title: "每日生產記錄表",
    formNumber: "FAC-12",
    revision: "7/98",
    factoryDistribution: "1",
    downloads: [{ label: "FAC-12 生產記錄 - 4.xls", href: "/form-master/fac-12-production-record-4.xls" }],
  },
  {
    title: "特別款式 品質檢定及用料記錄表",
    formNumber: "FAC-15",
    revision: "7/02",
    factoryDistribution: "1",
    downloads: [
      {
        label: "FAC-15 特別款式 品質檢定及用料記錄表.doc",
        href: "/form-master/fac-15-special-style-qc-material-record.doc",
      },
    ],
  },
  { title: "維修報告 / 記錄表", formNumber: "FAC-16", revision: "2/16", factoryDistribution: "1", downloads: [] },
  { title: "現沽單", formNumber: "FAC-17", revision: "8/00", factoryDistribution: "1", downloads: [] },
  { title: "副龍骨開料品質檢定及用料記錄表", formNumber: "FAC-18", revision: "10/04", factoryDistribution: "1", downloads: [] },
]

const categorizeDownload = (href: string): FileCategory | null => {
  const lowerHref = href.toLowerCase()
  if (lowerHref.endsWith(".xlsx") || lowerHref.endsWith(".xls")) return "xlsx"
  if (lowerHref.endsWith(".docx") || lowerHref.endsWith(".doc")) return "docs"
  if (lowerHref.endsWith(".pdf")) return "pdf"
  return null
}

const formatRevision = (value: string): string => {
  const match = value.trim().match(/^(\d{1,2})\/(\d{2}|\d{4})$/)
  if (!match) return value

  const month = match[1].padStart(2, "0")
  const yearRaw = match[2]
  if (yearRaw.length === 4) return `${month}/${yearRaw}`

  const yearTwoDigits = Number(yearRaw)
  const yearFull = yearTwoDigits >= 90 ? 1900 + yearTwoDigits : 2000 + yearTwoDigits
  return `${month}/${yearFull}`
}

const downloadButtonClassName =
  "inline-flex h-8 w-8 items-center justify-center rounded border border-[#02315a] text-[#02315a] hover:bg-[#02315a]/10 transition-colors"

export default async function FormMasterPage() {
  await requireCardAccessPage("form_master")
  return (
    <DashboardShell>
      <DashboardHeader heading="Form Master" text="公司文件" center />

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">Title of Form</th>
              <th className="border px-3 py-2 text-center">XLSX</th>
              <th className="border px-3 py-2 text-center">DOCS</th>
              <th className="border px-3 py-2 text-center">PDF</th>
              <th className="border px-3 py-2 text-left">Form Number</th>
              <th className="border px-3 py-2 text-left">Revision</th>
              <th className="border px-3 py-2 text-left">Factory&apos;s Distribution</th>
            </tr>
          </thead>
          <tbody>
            {formRows.map((row) => {
              const groupedDownloads: Record<FileCategory, DownloadItem[]> = { xlsx: [], docs: [], pdf: [] }
              for (const download of row.downloads ?? []) {
                const category = categorizeDownload(download.href)
                if (category) groupedDownloads[category].push(download)
              }

              const renderButtons = (items: DownloadItem[], label: "XLSX" | "DOCS" | "PDF") => {
                if (items.length === 0) return <span className="text-gray-400"> </span>

                const iconClassName =
                  label === "XLSX"
                    ? "h-4 w-4 text-emerald-600"
                    : label === "DOCS"
                    ? "h-4 w-4 text-blue-600"
                    : "h-4 w-4 text-red-600"

                return (
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {items.map((item, index) => (
                      <a
                        key={`${row.formNumber}-${item.href}-${index}`}
                        href={item.href}
                        download
                        title={item.label}
                        aria-label={`${row.title} ${label} file ${index + 1}`}
                        className={downloadButtonClassName}
                      >
                        {label === "XLSX" ? (
                          <FileSpreadsheet className={iconClassName} />
                        ) : (
                          <FileText className={iconClassName} />
                        )}
                      </a>
                    ))}
                  </div>
                )
              }

              return (
                <tr key={`${row.formNumber}-${row.title}`} className="align-top">
                  <td className="border px-3 py-2">{row.title}</td>
                  <td className="border px-2 py-2 min-w-[84px]">{renderButtons(groupedDownloads.xlsx, "XLSX")}</td>
                  <td className="border px-2 py-2 min-w-[84px]">{renderButtons(groupedDownloads.docs, "DOCS")}</td>
                  <td className="border px-2 py-2 min-w-[84px]">{renderButtons(groupedDownloads.pdf, "PDF")}</td>
                  <td className="border px-3 py-2 whitespace-nowrap">{row.formNumber}</td>
                  <td className="border px-3 py-2 whitespace-nowrap">{formatRevision(row.revision)}</td>
                  <td className="border px-3 py-2 text-center whitespace-nowrap">{row.factoryDistribution}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Footer />
    </DashboardShell>
  )
}
