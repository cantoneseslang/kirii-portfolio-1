import type { AddressRegion } from "@/types/hk-new-customer"

export type CustomerRequestEmailCustomerType = "new" | "existing"

export type CustomerRequestEmailOptions = {
  salesRepName?: string
  salesRepEmail?: string
  customerType?: CustomerRequestEmailCustomerType
}

function signatureBlock(options: CustomerRequestEmailOptions): string {
  const name = options.salesRepName?.trim() || "[Your Name / 您的姓名]"
  const email = options.salesRepEmail?.trim()
  const lines = ["Best regards / 此致", name, "Kirii (Hong Kong) Limited / 桐井（香港）有限公司"]
  if (email) lines.push(email)
  return lines.join("\n")
}

function subjectLine(customerType: CustomerRequestEmailCustomerType): string {
  if (customerType === "existing") {
    return "Subject: Kirii Customer Record Update – Required Documents / 客戶資料更新所需文件"
  }
  return "Subject: Kirii New Customer Registration – Required Documents / 新客戶登記所需文件及資料"
}

function introBlock(customerType: CustomerRequestEmailCustomerType): string {
  if (customerType === "existing") {
    return `Dear Sir/Madam / 尊貴的客戶：

In line with management enhancement by our parent company, Kirii Manufacturing Co., Ltd. (株式会社桐井製作所), we are updating our customer records. Even if you are an existing customer, we kindly ask you to provide the documents and company information listed below (scanned PDF or clear photos) so that we can complete the registration update on our side.

因敝日本公司 株式会社桐井製作所 加強公司管理之需要，現正更新客戶檔案。即使 貴我雙方已有業務往來，亦懇請 貴司配合準備以下文件及公司資料（清晰掃描副本 PDF 或照片），以便敝司辦理登記更新手續。`
  }

  return `Dear Sir/Madam / 尊貴的客戶：

Thank you for your interest in trading with Kirii (Hong Kong) Limited.
To complete new customer registration, please reply to this email with the documents and company information listed below (scanned PDF or clear photos).

感謝您有意與桐井（香港）有限公司建立業務關係。為完成新客戶登記，請回覆本電郵，並提供以下文件及公司資料（清晰掃描副本 PDF 或照片）。`
}

function closingBlock(customerType: CustomerRequestEmailCustomerType): string {
  if (customerType === "existing") {
    return `Once we receive the required documents and information, we will update your customer records and contact you accordingly.

收到所需文件及資料後，我們將為 貴公司更新客戶檔案，並另行通知。

If you have any questions, please feel free to contact us.
如有任何查詢，歡迎隨時聯絡我們。`
  }

  return `Once we receive the required documents and information, we will proceed with your new customer registration and contact you accordingly.

收到所需文件及資料後，我們將為 貴公司辦理新客戶登記，並另行通知。

If you have any questions, please feel free to contact us.
如有任何查詢，歡迎隨時聯絡我們。`
}

const HK_MANDATORY_DOCS = `────────────────────────────────────────
【Mandatory Documents / 必須提交】
────────────────────────────────────────

1. Business Registration Certificate (BR) / 有效商業登記證副本
   · Must be valid (show commencement & expiry dates) / 須為有效版本，並顯示生效及屆滿日期
   · 8-digit main BR number only / 只需8位主號碼

2. Certificate of Incorporation (CI) / 公司註冊證明書副本
   · Show certificate No. (編號) and issue date / 須顯示編號及簽發日期

3. Latest Annual Return (Form NAR1) / 最新周年申報表副本
   · Made-up-to date within the last 12 months / 備忘日期須為過去12個月內`

const MACAU_MANDATORY_DOCS = `────────────────────────────────────────
【Mandatory Documents / 必須提交】
────────────────────────────────────────

1. Business Registration Certificate (BR) / 有效商業登記證副本
   · Must be valid (show commencement & expiry dates) / 須為有效版本，並顯示生效及屆滿日期

2. Certificate of Incorporation (CI) / 公司註冊證明書副本
   · Show certificate No. and issue date / 須顯示編號及簽發日期

3. Latest Annual Return (Form NAR1) / 最新周年申報表副本
   · Made-up-to date within the last 12 months / 備忘日期須為過去12個月內`

const OPTIONAL_DOCS = `────────────────────────────────────────
【Optional / 可選（建議提供）】
────────────────────────────────────────

4. Bank Proof / 銀行戶口證明
   · e.g. bank statement header or cancelled cheque / 例如：月結單表頭或空白支票
   · Account name must match the registered company name / 戶口名稱須與公司註冊名稱一致`

const EXCEL_QUESTIONNAIRE = `────────────────────────────────────────
【Part 2 Excel (Company Information) / Part 2 公司基本資料問卷】
────────────────────────────────────────

Please fill in the attached Excel (column C only) and return it with your documents.
It covers registered / delivery address and company details not shown on the certificates.
Part 1 documents will still be processed separately in our system.
請填寫附上的 Excel（只需填 C 欄）並連同文件交回，用於送貨地址及證件上沒有的公司資料。`

const HK_COMPANY_INFO = `────────────────────────────────────────
【Company & Contact Information / 公司及聯絡資料】
If you cannot use the Excel questionnaire, please also provide in your reply / 如未能使用 Excel 問卷，請於回覆中一併提供：
────────────────────────────────────────

· Registered company name (English & Chinese) / 公司註冊中英文全名
· Business Registration (BR) number / 商業登記號碼
· Date of incorporation / 公司成立日期
· Registered address / 註冊地址
· Delivery address (if different) / 送貨地址（如與註冊地址不同）
· Contact person(s) – full legal name in English & Chinese, title, email & phone
  聯絡人 – 英文及中文法定全名、職位、電郵及電話
· Accounts payable (A/P) contact name, email & phone / 應付賬款聯絡人姓名、電郵及電話`

const MACAU_COMPANY_INFO = `────────────────────────────────────────
【Company & Contact Information / 公司及聯絡資料】
If you cannot use the Excel questionnaire, please also provide in your reply / 如未能使用 Excel 問卷，請於回覆中一併提供：
────────────────────────────────────────

· Registered company name (English & Chinese) / 公司註冊中英文全名
· Business / commercial registration number / 商業或登記編號
· Registered address / 註冊地址
· Delivery address (if different) / 送貨地址（如與註冊地址不同）
· Contact person(s) – full legal name in English & Chinese, title, email & phone
  聯絡人 – 英文及中文法定全名、職位、電郵及電話
· Accounts payable (A/P) contact name, email & phone / 應付賬款聯絡人姓名、電郵及電話`

function buildEmailBody(
  region: AddressRegion,
  options: CustomerRequestEmailOptions,
): string {
  const customerType = options.customerType ?? "new"
  const mandatoryDocs = region === "macau" ? MACAU_MANDATORY_DOCS : HK_MANDATORY_DOCS
  const companyInfo = region === "macau" ? MACAU_COMPANY_INFO : HK_COMPANY_INFO

  return `${subjectLine(customerType)}

${introBlock(customerType)}

${mandatoryDocs}

${EXCEL_QUESTIONNAIRE}

${OPTIONAL_DOCS}

${companyInfo}

${closingBlock(customerType)}

${signatureBlock(options)}`
}

export function buildHongKongCustomerRequestInstructionsBody(): string {
  return `${subjectLine("new")}

${introBlock("new")}

${HK_MANDATORY_DOCS}

${EXCEL_QUESTIONNAIRE}

${OPTIONAL_DOCS}

${HK_COMPANY_INFO}

${closingBlock("new")}`
}

export function buildHongKongCustomerRequestEmail(options: CustomerRequestEmailOptions = {}): string {
  return buildEmailBody("hong_kong", options)
}

export function buildMacauCustomerRequestEmail(options: CustomerRequestEmailOptions = {}): string {
  return buildEmailBody("macau", options)
}

export function buildCustomerRequestEmail(
  region: AddressRegion,
  options: CustomerRequestEmailOptions = {},
): string {
  if (region === "macau") return buildMacauCustomerRequestEmail(options)
  return buildHongKongCustomerRequestEmail(options)
}
