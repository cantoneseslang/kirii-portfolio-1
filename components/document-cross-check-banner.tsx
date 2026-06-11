import type { DocumentCrossCheck } from "@/lib/hk-new-customer-document-validity"

type DocumentCrossCheckBannerProps = {
  check: DocumentCrossCheck | null
  matchTextEn: string
  matchTextZh: string
  mismatchTextEn: string
  mismatchTextZh: string
  scannedLabelEn?: string
  scannedLabelZh?: string
  referenceLabelEn?: string
  referenceLabelZh?: string
}

export function DocumentCrossCheckBanner({
  check,
  matchTextEn,
  matchTextZh,
  mismatchTextEn,
  mismatchTextZh,
  scannedLabelEn = "Scan result",
  scannedLabelZh = "掃描結果",
  referenceLabelEn = "BR certificate",
  referenceLabelZh = "BR 證件",
}: DocumentCrossCheckBannerProps) {
  if (!check) return null

  return (
    <div
      className={`rounded-md border px-3 py-2 text-xs ${
        check.matches
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="font-medium">
        {check.matches ? `${matchTextEn} / ${matchTextZh}` : `${mismatchTextEn} / ${mismatchTextZh}`}
      </div>
      <div className="mt-1 space-y-0.5">
        <div>
          {scannedLabelEn} / {scannedLabelZh}: {check.scannedDisplay}
        </div>
        <div>
          {referenceLabelEn} / {referenceLabelZh}: {check.referenceDisplay}
        </div>
      </div>
    </div>
  )
}
