import type { AddressRegion } from "@/types/hk-new-customer"

export type CustomerRequestEmailOptions = {
  salesRepName?: string
  salesRepEmail?: string
}

function signatureBlock(options: CustomerRequestEmailOptions): string {
  const name = options.salesRepName?.trim() || "[Your Name / 您的姓名]"
  const email = options.salesRepEmail?.trim()
  const lines = ["Best regards / 此致", name, "Kirii (Hong Kong) Limited / 桐井（香港）有限公司"]
  if (email) lines.push(email)
  return lines.join("\n")
}

export function buildHongKongCustomerRequestEmail(options: CustomerRequestEmailOptions = {}): string {
  return `Subject: Kirii New Customer Account Setup – Required Documents / 新客戶登記所需文件

Dear Sir/Madam / 尊貴的客戶：

Thank you for your interest in opening a trading account with Kirii (Hong Kong) Limited.
To proceed under our New Customer Account Setup & Credit Management Protocol (v3), please reply to this email with scanned PDF copies (or clear photos) of the documents listed below.

感謝您有意與桐井（香港）有限公司建立交易賬戶。為辦理新客戶登記及信貸審批（Protocol v3），請回覆本電郵並附上以下文件之清晰掃描副本（PDF 或照片）。

────────────────────────────────────────
【Mandatory Documents / 必須提交】
────────────────────────────────────────

1. Business Registration Certificate (BR) / 有效商業登記證副本
   · Must be valid (show commencement & expiry dates) / 須為有效版本，並顯示生效及屆滿日期
   · 8-digit main BR number only / 只需8位主號碼

2. Certificate of Incorporation (CI) / 公司註冊證明書副本
   · Show certificate No. (編號) and issue date / 須顯示編號及簽發日期

3. Latest Annual Return (Form NAR1) / 最新周年申報表副本
   · Made-up-to date within the last 12 months / 備忘日期須為過去12個月內

4. Companies Registry Company Particulars / 公司註冊處公司資料
   · Issued within the last 12 months / 須為過去12個月內簽發
   · Download from Companies Registry e-Services / 公司註冊處電子服務：
     https://www.e-services.cr.gov.hk/

────────────────────────────────────────
【Optional / 可選（建議提供）】
────────────────────────────────────────

5. Bank Proof / 銀行戶口證明
   · e.g. bank statement header or cancelled cheque / 例如：月結單表頭或空白支票
   · Account name must match the registered company name / 戶口名稱須與公司註冊名稱一致

────────────────────────────────────────
【Company & Contact Information / 公司及聯絡資料】
Please also provide in your reply / 請於回覆中一併提供：
────────────────────────────────────────

· Registered company name (English & Chinese) / 公司註冊中英文全名
· Business Registration (BR) number / 商業登記號碼
· Date of incorporation / 公司成立日期
· Registered address / 註冊地址
· Delivery address (if different) / 送貨地址（如與註冊地址不同）
· Contact person(s) – full legal name in English & Chinese, title, email & phone
  聯絡人 – 英文及中文法定全名、職位、電郵及電話
· Accounts payable (A/P) contact name & email / 應付賬款聯絡人姓名及電郵
· Bank name, account name, account number & bank code (if credit terms are requested)
  銀行名稱、戶口名稱、戶口號碼及銀行代碼（如申請賬期）
· Estimated monthly purchase (HKD) & requested payment terms / 預計每月採購額（港元）及擬定付款條件

Once we receive all mandatory documents and information, we will process your application and contact you with the result.

收到全部必須文件及資料後，我們將為貴公司辦理申請並另行通知結果。

If you have any questions, please feel free to contact us.
如有任何查詢，歡迎隨時聯絡我們。

${signatureBlock(options)}`
}

export function buildMacauCustomerRequestEmail(options: CustomerRequestEmailOptions = {}): string {
  return `Subject: Kirii New Customer Account Setup – Required Documents / 新客戶登記所需文件

Dear Sir/Madam / 尊貴的客戶：

Thank you for your interest in opening a trading account with Kirii (Hong Kong) Limited.
To proceed under our New Customer Account Setup & Credit Management Protocol (v3), please reply to this email with scanned PDF copies (or clear photos) of the documents listed below.

感謝您有意與桐井（香港）有限公司建立交易賬戶。為辦理新客戶登記及信貸審批（Protocol v3），請回覆本電郵並附上以下文件之清晰掃描副本（PDF 或照片）。

────────────────────────────────────────
【Mandatory Documents / 必須提交】
────────────────────────────────────────

1. Business Registration Certificate (BR) / 有效商業登記證副本
   · Must be valid (show commencement & expiry dates) / 須為有效版本，並顯示生效及屆滿日期

2. Certificate of Incorporation (CI) / 公司註冊證明書副本
   · Show certificate No. and issue date / 須顯示編號及簽發日期

3. Latest Annual Return (Form NAR1) / 最新周年申報表副本
   · Made-up-to date within the last 12 months / 備忘日期須為過去12個月內

4. Commercial Registration Certificate / 商業登記證明
   · Issued within the last 12 months / 須為過去12個月內簽發
   · Basic lookup: Commercial Registration Information Platform / 商業登記訊息平台：
     https://eservice.dsaj.gov.mo/dsajservice9/commercial-platform
   · Formal certificate (查公司紙): apply via 商社通 https://www.ab.gov.mo/ or 一戶通
   · Issued by CRCBM / 商業及動產登記局

────────────────────────────────────────
【Optional / 可選（建議提供）】
────────────────────────────────────────

5. Bank Proof / 銀行戶口證明
   · e.g. bank statement header or cancelled cheque / 例如：月結單表頭或空白支票
   · Account name must match the registered company name / 戶口名稱須與公司註冊名稱一致

────────────────────────────────────────
【Company & Contact Information / 公司及聯絡資料】
Please also provide in your reply / 請於回覆中一併提供：
────────────────────────────────────────

· Registered company name (English & Chinese) / 公司註冊中英文全名
· Business / commercial registration number / 商業或登記編號
· Registered address / 註冊地址
· Delivery address (if different) / 送貨地址（如與註冊地址不同）
· Contact person(s) – full legal name in English & Chinese, title, email & phone
  聯絡人 – 英文及中文法定全名、職位、電郵及電話
· Accounts payable (A/P) contact name & email / 應付賬款聯絡人姓名及電郵
· Bank details & requested payment terms (if credit is requested)
  銀行資料及擬定付款條件（如申請賬期）

Once we receive all mandatory documents and information, we will process your application and contact you with the result.

收到全部必須文件及資料後，我們將為貴公司辦理申請並另行通知結果。

If you have any questions, please feel free to contact us.
如有任何查詢，歡迎隨時聯絡我們。

${signatureBlock(options)}`
}

export function buildCustomerRequestEmail(
  region: AddressRegion,
  options: CustomerRequestEmailOptions = {},
): string {
  if (region === "macau") return buildMacauCustomerRequestEmail(options)
  return buildHongKongCustomerRequestEmail(options)
}
