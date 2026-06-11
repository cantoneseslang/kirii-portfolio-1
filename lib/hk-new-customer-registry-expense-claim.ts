import { getTodayIsoDateInHongKong } from "@/lib/hk-new-customer-staff"

export type RegistryRegion = "hong_kong" | "macau"

export type RegistryDocumentFeeInfo = {
  region: RegistryRegion
  documentKey: "cr_company_particulars" | "macau_commercial_registration"
  labelEn: string
  labelZh: string
  unitFee: number
  currency: "HKD" | "MOP"
  defaultCopies: number
}

export const REGISTRY_DOCUMENT_FEES: Record<
  RegistryDocumentFeeInfo["documentKey"],
  RegistryDocumentFeeInfo
> = {
  cr_company_particulars: {
    region: "hong_kong",
    documentKey: "cr_company_particulars",
    labelEn: "Companies Registry Company Particulars",
    labelZh: "公司註冊處公司資料",
    unitFee: 22,
    currency: "HKD",
    defaultCopies: 1,
  },
  macau_commercial_registration: {
    region: "macau",
    documentKey: "macau_commercial_registration",
    labelEn: "Commercial Registration Certificate",
    labelZh: "商業登記證明",
    unitFee: 50,
    currency: "MOP",
    defaultCopies: 1,
  },
}

export function formatRegistryFeeLine(info: RegistryDocumentFeeInfo, copies = info.defaultCopies): string {
  const total = info.unitFee * copies
  return `${copies} copy / ${copies}份 × ${info.currency} ${info.unitFee.toLocaleString("en-HK")} = ${info.currency} ${total.toLocaleString("en-HK")}`
}

export type RegistryExpenseClaimInput = {
  applicantName: string
  companyNameEn?: string
  companyNameZh?: string
  brNumber?: string
  documentKey: RegistryDocumentFeeInfo["documentKey"]
  copies?: number
  claimDate?: string
}

export function buildRegistryExpenseClaimText(input: RegistryExpenseClaimInput): string {
  const feeInfo = REGISTRY_DOCUMENT_FEES[input.documentKey]
  const copies = input.copies ?? feeInfo.defaultCopies
  const total = feeInfo.unitFee * copies
  const claimDate = input.claimDate || getTodayIsoDateInHongKong()
  const companyLabel = [input.companyNameEn, input.companyNameZh].filter(Boolean).join(" / ") || "-"

  return [
    "Kirii (Hong Kong) Limited / 桐井（香港）有限公司",
    "政府查冊文件費用報銷申請 / Government Registry Document Fee Reimbursement Claim",
    "",
    `Date / 日期: ${claimDate}`,
    `Applicant / 申請人: ${input.applicantName || "-"}`,
    `Customer Company / 客戶公司: ${companyLabel}`,
    `BR No. / 商業登記號碼: ${input.brNumber?.trim() || "-"}`,
    "",
    `Document / 文件: ${feeInfo.labelEn} / ${feeInfo.labelZh}`,
    `Region / 地區: ${feeInfo.region === "hong_kong" ? "Hong Kong / 香港" : "Macau / 澳門"}`,
    `Quantity / 份數: ${copies}`,
    `Unit Fee / 每份費用: ${feeInfo.currency} ${feeInfo.unitFee.toLocaleString("en-HK")}`,
    `Total Amount / 總金額: ${feeInfo.currency} ${total.toLocaleString("en-HK")}`,
    "",
    "Declaration / 聲明:",
    "I completed the paid government application and request reimbursement of the above fee from the company.",
    "本人已完成政府付費申請，現申請公司報銷上述費用。",
    "",
    "Applicant Signature / 申請人簽署: ___________________________",
    `Name / 姓名: ${input.applicantName || "-"}`,
    `Date / 日期: ${claimDate}`,
  ].join("\n")
}

export function downloadRegistryExpenseClaim(input: RegistryExpenseClaimInput): void {
  const feeInfo = REGISTRY_DOCUMENT_FEES[input.documentKey]
  const text = buildRegistryExpenseClaimText(input)
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  const safeCompany = (input.companyNameEn || "customer").replace(/[^\w.-]+/g, "_").slice(0, 40)
  anchor.href = url
  anchor.download = `Registry_Fee_Claim_${feeInfo.documentKey}_${safeCompany}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}
