import ExcelJS from "exceljs"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import * as XLSX from "xlsx"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const templatePath = path.join(root, "public/templates/KIRII_New_Customer_Parts2-4_Questionnaire.xlsx")
const outputPath = path.join(
  root,
  "public/templates/KIRII_New_Customer_Parts2-4_Questionnaire_SAMPLE.xlsx",
)

/** Sample answers keyed by field_key (column A). Use dropdown labels where applicable. */
const SAMPLE_ANSWERS = {
  companyNameEn: "Apex Trading (Hong Kong) Limited",
  companyNameZh: "益峰貿易（香港）有限公司",
  brNumber: "76543210",
  incorporationDate: "2018-06-15",

  "registeredAddress.region": "Hong Kong / 香港",
  "registeredAddress.area": "Kowloon / 九龍",
  "registeredAddress.district": "Sham Shui Po / 深水埗區",
  "registeredAddress.addressEn": "Unit 1205, 88 Tai Po Road, Cheung Sha Wan",
  "registeredAddress.addressZh": "長沙灣大埔道88號1205室",

  "deliveryAddress.region": "Hong Kong / 香港",
  "deliveryAddress.area": "Hong Kong Island / 港島",
  "deliveryAddress.district": "Wan Chai / 灣仔區",
  "deliveryAddress.addressEn": "Suite 8, 15 Hennessy Road, Wanchai",
  "deliveryAddress.addressZh": "灣仔軒尼詩道15號8樓",

  "nar1.madeUpToDate": "2025-09-30",
  "nar1.shareCapital": "HKD 10,000",

  "nar1.directors.0.nameEn": "CHAN, Tai Man",
  "nar1.directors.0.nameZh": "陳大文",
  "nar1.directors.0.flatFloorBlock": "Flat 12, 3/F, Block A",
  "nar1.directors.0.building": "Lucky Building",
  "nar1.directors.0.street": "Nathan Road",
  "nar1.directors.0.district": "Sham Shui Po / 深水埗區",
  "nar1.directors.0.country": "Hong Kong",

  "nar1.directors.1.nameEn": "LEE, Siu Ming",
  "nar1.directors.1.nameZh": "李小明",
  "nar1.directors.1.flatFloorBlock": "Room 5, 18/F",
  "nar1.directors.1.building": "Harbour Centre",
  "nar1.directors.1.street": "25 Harbour Road",
  "nar1.directors.1.district": "Wan Chai / 灣仔區",
  "nar1.directors.1.country": "Hong Kong",

  "nar1.directors.2.nameEn": "WONG, Mei Ling",
  "nar1.directors.2.nameZh": "黃美玲",
  "nar1.directors.2.flatFloorBlock": "Unit 2, G/F",
  "nar1.directors.2.building": "Green Garden",
  "nar1.directors.2.street": "Castle Peak Road",
  "nar1.directors.2.district": "Tuen Mun / 屯門區",
  "nar1.directors.2.country": "Hong Kong",

  "contacts.0.nameEnFirst": "John",
  "contacts.0.nameEnMiddle": "Michael",
  "contacts.0.nameEnLast": "Wong",
  "contacts.0.nameZh": "王志明",
  "contacts.0.idNumber": "A123456(7)",
  "contacts.0.title": "Purchasing Manager",
  "contacts.0.email": "john.wong@apex-trading-demo.hk",
  "contacts.0.phoneCountryCode": "+852",
  "contacts.0.phone": "9123 4567",

  "contacts.1.nameEnFirst": "Mary",
  "contacts.1.nameEnMiddle": "Ann",
  "contacts.1.nameEnLast": "Cheung",
  "contacts.1.nameZh": "張麗珍",
  "contacts.1.idNumber": "K987654(3)",
  "contacts.1.title": "Finance Officer",
  "contacts.1.email": "mary.cheung@apex-trading-demo.hk",
  "contacts.1.phoneCountryCode": "+852",
  "contacts.1.phone": "6234 5678",

  "contacts.2.nameEnFirst": "David",
  "contacts.2.nameEnMiddle": "",
  "contacts.2.nameEnLast": "Lam",
  "contacts.2.nameZh": "林家輝",
  "contacts.2.idNumber": "Z556677(8)",
  "contacts.2.title": "Operations Supervisor",
  "contacts.2.email": "david.lam@apex-trading-demo.hk",
  "contacts.2.phoneCountryCode": "+852",
  "contacts.2.phone": "5345 6789",

  "apContact.nameEnFirst": "Susan",
  "apContact.nameEnMiddle": "",
  "apContact.nameEnLast": "Ho",
  "apContact.nameZh": "何淑芬",
  "apContact.title": "Accounts Payable",
  "apContact.email": "ap@apex-trading-demo.hk",
  "apContact.phoneCountryCode": "+852",
  "apContact.phone": "2788 9900",

  apEmail: "ap@apex-trading-demo.hk",
  apPhoneCountryCode: "+852",
  apPhone: "2788 9900",

  "invoiceDelivery.email": "yes",
  "invoiceDelivery.post": "no",

  bankName: "The Hongkong and Shanghai Banking Corporation Limited",
  bankBranchName: "Mongkok Branch",
  bankBranchNumber: "123",
  accountName: "Apex Trading (Hong Kong) Limited",
  accountNumber: "123-456789-001",
  bankCode: "HSBCHKHHHKH",
}

async function main() {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  const sheet = workbook.getWorksheet("Fill In")
  if (!sheet) {
    throw new Error('Worksheet "Fill In" not found in template')
  }

  let filled = 0
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const fieldKey = String(row.getCell(1).value ?? "").trim()
    if (!fieldKey || fieldKey === "field_key") return
    const sample = SAMPLE_ANSWERS[fieldKey]
    if (sample !== undefined) {
      row.getCell(3).value = sample
      filled += 1
    }
  })

  await workbook.xlsx.writeFile(outputPath)

  const buffer = await fs.readFile(outputPath)
  const parsed = XLSX.read(buffer, { type: "buffer" })
  const fillSheet = parsed.Sheets["Fill In"]
  const rows = XLSX.utils.sheet_to_json(fillSheet, { header: 1, defval: "" })
  const answerCount = rows.slice(1).filter((row) => String(row[0] || "").includes(".") || /^[a-z]/.test(String(row[0] || ""))).filter((row) => String(row[2] || "").trim()).length

  console.log(`Sample file: ${outputPath}`)
  console.log(`Filled ${filled} fields from sample map`)
  console.log(`Parse check: ${answerCount} rows with answers in column C`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
