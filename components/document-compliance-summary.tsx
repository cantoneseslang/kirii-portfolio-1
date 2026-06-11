import type { HkNewCustomerRegistration } from "@/types/hk-new-customer"
import { getAttachmentTypeLabel, getMandatoryAttachmentKeys } from "@/types/hk-new-customer"
import {
  formatDateForDisplay,
  formatDocumentDateLabel,
  getCiDocumentValidity,
  getNar1DocumentValidity,
  validateBrDocument,
  validateCiDocument,
  validateDocumentDate,
  validateMandatoryDocumentsForSubmit,
  validateNar1Document,
} from "@/lib/hk-new-customer-document-validity"

export function DocumentComplianceSummary({
  registration,
}: {
  registration: HkNewCustomerRegistration
}) {
  const region = registration.registeredAddressDetail?.region || "hong_kong"
  const uploadedTypes = registration.attachments.map((item) => item.documentType)
  const validation = validateMandatoryDocumentsForSubmit({
    region,
    uploadedDocumentTypes: uploadedTypes,
    validityDates: registration.documentValidityDates || {},
    formBrNumber: registration.brNumber,
    formCompanyNameEn: registration.companyNameEn,
    formCompanyNameZh: registration.companyNameZh || "",
  })

  const mandatoryKeys = getMandatoryAttachmentKeys(region)

  return (
    <div>
      <div className="mb-2 font-medium text-sm">Required Documents Check / 必須文件檢查</div>
      <ul className="space-y-2 text-sm">
        {mandatoryKeys.map((documentType) => {
          const uploaded = uploadedTypes.includes(documentType)
          const label = getAttachmentTypeLabel(documentType)
          const issue = validation.issues.find((item) => item.documentType === documentType)

          if (documentType === "br") {
            const br = registration.documentValidityDates?.br
            const brResult = br
              ? validateBrDocument(
                  br,
                  registration.brNumber,
                  registration.companyNameEn,
                  registration.companyNameZh || "",
                )
              : null
            const ok = uploaded && Boolean(brResult?.valid)

            return (
              <li
                key={documentType}
                className={`rounded-md border p-2 ${ok ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}
              >
                <div className="font-medium">{label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  File: {uploaded ? "Uploaded / 已上載" : "Missing / 缺少"}
                </div>
                {br && (
                  <>
                    <div className="text-xs text-muted-foreground">
                      Commencement / 生效日期: {formatDateForDisplay(br.commencementDate)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expiry / 屆滿日期: {formatDateForDisplay(br.expiryDate)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Certificate BR / 證件 BR: {br.certificateBrNumber} · Form BR / 表格 BR:{" "}
                      {registration.brNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Certificate Name / 證件公司名: {br.certificateCompanyNameEn || "—"}
                      {br.certificateCompanyNameZh ? ` · ${br.certificateCompanyNameZh}` : ""}
                    </div>
                  </>
                )}
                {brResult?.valid && <div className="text-xs text-green-700 mt-1">{brResult.messageEn}</div>}
                {brResult && !brResult.valid && (
                  <div className="text-xs text-red-700 mt-1">
                    {brResult.messageEn} / {brResult.messageZh}
                  </div>
                )}
                {issue && (
                  <div className="text-xs text-red-700 mt-1">
                    {issue.messageEn} / {issue.messageZh}
                  </div>
                )}
              </li>
            )
          }

          if (documentType === "ci") {
            const ci = getCiDocumentValidity(registration.documentValidityDates?.ci)
            const ciResult = ci ? validateCiDocument(ci) : null
            const ok = uploaded && Boolean(ciResult?.valid)

            return (
              <li
                key={documentType}
                className={`rounded-md border p-2 ${ok ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}
              >
                <div className="font-medium">{label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  File: {uploaded ? "Uploaded / 已上載" : "Missing / 缺少"}
                </div>
                {ci && (
                  <>
                    <div className="text-xs text-muted-foreground">
                      No. / 編號: {ci.certificateNumber || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDocumentDateLabel("ci")}: {formatDateForDisplay(ci.issueDate)}
                    </div>
                  </>
                )}
                {ciResult?.valid && <div className="text-xs text-green-700 mt-1">{ciResult.messageEn}</div>}
                {ciResult && !ciResult.valid && (
                  <div className="text-xs text-red-700 mt-1">
                    {ciResult.messageEn} / {ciResult.messageZh}
                  </div>
                )}
                {issue && (
                  <div className="text-xs text-red-700 mt-1">
                    {issue.messageEn} / {issue.messageZh}
                  </div>
                )}
              </li>
            )
          }

          if (documentType === "nar1") {
            const nar1 = getNar1DocumentValidity(registration.documentValidityDates?.nar1)
            const nar1Result = nar1
              ? validateNar1Document(nar1, registration.brNumber, registration.companyNameEn)
              : null
            const ok = uploaded && Boolean(nar1Result?.valid)

            return (
              <li
                key={documentType}
                className={`rounded-md border p-2 ${ok ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}
              >
                <div className="font-medium">{label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  File: {uploaded ? "Uploaded / 已上載" : "Missing / 缺少"}
                </div>
                {nar1 && (
                  <>
                    <div className="text-xs text-muted-foreground">
                      BR / 商業登記號碼: {nar1.businessRegistrationNumber || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Company / 公司: {nar1.companyNameEn || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDocumentDateLabel("nar1")}: {formatDateForDisplay(nar1.madeUpToDate)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Share Capital / 股本: {nar1.shareCapital || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Directors / 董事: {nar1.directors.length}
                    </div>
                  </>
                )}
                {nar1Result?.valid && <div className="text-xs text-green-700 mt-1">{nar1Result.messageEn}</div>}
                {nar1Result && !nar1Result.valid && (
                  <div className="text-xs text-red-700 mt-1">
                    {nar1Result.messageEn} / {nar1Result.messageZh}
                  </div>
                )}
                {issue && (
                  <div className="text-xs text-red-700 mt-1">
                    {issue.messageEn} / {issue.messageZh}
                  </div>
                )}
              </li>
            )
          }

          const dateValue =
            registration.documentValidityDates?.[
              documentType as keyof NonNullable<HkNewCustomerRegistration["documentValidityDates"]>
            ]
          const dateString = typeof dateValue === "string" ? dateValue : ""
          const dateResult = dateString ? validateDocumentDate(documentType, dateString) : null
          const ok = uploaded && Boolean(dateString) && Boolean(dateResult?.valid)

          return (
            <li
              key={documentType}
              className={`rounded-md border p-2 ${ok ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                File: {uploaded ? "Uploaded / 已上載" : "Missing / 缺少"}
              </div>
              {dateString && (
                <div className="text-xs text-muted-foreground">
                  {formatDocumentDateLabel(documentType)}: {formatDateForDisplay(dateString)}
                  {dateResult && !dateResult.valid && (
                    <span className="text-red-700">
                      {" "}
                      · {dateResult.messageEn} / {dateResult.messageZh}
                    </span>
                  )}
                  {dateResult?.valid && <span className="text-green-700"> · OK</span>}
                </div>
              )}
              {!dateString && uploaded && (
                <div className="text-xs text-red-700">Date not recorded / 未記錄日期</div>
              )}
              {issue && (
                <div className="text-xs text-red-700 mt-1">
                  {issue.messageEn} / {issue.messageZh}
                </div>
              )}
            </li>
          )
        })}
        <li className="rounded-md border border-dashed p-2 text-muted-foreground">
          Bank Proof / 銀行戶口證明 — Optional / 可選
          {" · "}
          {uploadedTypes.includes("bank_proof") ? "Uploaded / 已上載" : "Not provided / 未提供"}
        </li>
      </ul>
    </div>
  )
}
