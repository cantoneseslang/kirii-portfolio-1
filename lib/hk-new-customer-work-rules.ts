export const NEW_CUSTOMER_ARCHIVE_PATH =
  "KIRII Employee Portfolio → NewCustomer Setting → Search / 新客戶登記 → Search"

export type NewCustomerWorkRule = {
  titleEn: string
  titleZh: string
  bodyEn: string
  bodyZh: string
}

export const NEW_CUSTOMER_WORK_RULES: NewCustomerWorkRule[] = [
  {
    titleEn: "Official file location",
    titleZh: "正式資料保存位置",
    bodyEn:
      "Approved Excel, scans (BR / CI / NAR1 / bank proof / images / PDFs), and the completed Word form are stored with the application in Portfolio. Open NewCustomer Setting → Search, then search by company name or BR number. Do not treat email or a desktop copy as the official file.",
    bodyZh:
      "已核准的 Excel、掃描件（BR / CI / NAR1 / 銀行證明 / 圖片 / PDF）及完成的 Word 表格，一律保存在該申請紀錄內。請打開 NewCustomer Setting → Search，以公司名稱或商業登記號碼搜尋。電郵或桌面副本不是正式存檔。",
  },
  {
    titleEn: "How to find a record later",
    titleZh: "日後如何查找",
    bodyEn:
      "Dashboard → NewCustomer Setting → Search. Enter the company name or BR number. Open the record to download attachments and the Word form.",
    bodyZh:
      "Dashboard → NewCustomer Setting → Search。輸入公司名稱或商業登記號碼，打開紀錄後即可下載附件及 Word 表格。",
  },
  {
    titleEn: "Payment issues or registration changes",
    titleZh: "付款問題或登記變更",
    bodyEn:
      "Do not edit an approved record in place. The original submitter must start a new application promptly with the corrected information and supporting documents. Keep the same BR number so Search can show both the original approval and the amendment.",
    bodyZh:
      "已核准紀錄不可直接改寫。須由原申請人盡快提交新的申請，並附上更正後的資料及證明文件。請沿用同一商業登記號碼，以便 Search 同時找到原核准與更正申請。",
  },
  {
    titleEn: "Re-application rule",
    titleZh: "再申請規則",
    bodyEn:
      "If you are asked to correct bank details, company particulars, contacts, or documents, re-apply immediately. Re-attach the latest Excel and scans. Previous approved files stay in Search for reference. Approval is again Sales Manager → General Manager.",
    bodyZh:
      "如被要求更正銀行資料、公司資料、聯絡人或文件，請立即再申請。重新上載最新 Excel 及掃描件。先前已核准的檔案仍保留在 Search 供查閱。審批仍為營業經理 → 社長決裁。",
  },
]

export function formatWorkRulesPlain(): string {
  return NEW_CUSTOMER_WORK_RULES.map(
    (rule, index) =>
      `${index + 1}. ${rule.titleEn} / ${rule.titleZh}\n${rule.bodyEn}\n${rule.bodyZh}`,
  ).join("\n\n")
}

export function formatWorkRulesHtml(): string {
  const items = NEW_CUSTOMER_WORK_RULES.map(
    (rule) => `
      <li>
        <strong>${rule.titleEn} / ${rule.titleZh}</strong><br/>
        ${rule.bodyEn}<br/>
        ${rule.bodyZh}
      </li>
    `,
  ).join("")

  return `
    <h4>File location and work rules / 資料保存位置及作業規則</h4>
    <p>Official archive: <strong>${NEW_CUSTOMER_ARCHIVE_PATH}</strong></p>
    <ol>${items}</ol>
  `
}

export const NEW_CUSTOMER_APPROVED_SHORT_RULE =
  "Files are in NewCustomer Setting → Search (company name or BR). For payment or registration changes, the original submitter must re-apply promptly — do not edit the approved record. / 資料在 Search（公司名稱或商業登記號碼）。付款或登記變更須由原申請人盡快再申請，不可改寫已核准紀錄。"
