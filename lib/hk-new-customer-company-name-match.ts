const ENGLISH_LEGAL_SUFFIXES = [
  "COMPANY LIMITED",
  "COMPANY LTD",
  "CO LIMITED",
  "CO LTD",
  "CORPORATION",
  "CORPORATE",
  "CORP",
  "LIMITED",
  "LTD",
  "INCORPORATED",
  "INC",
  "LLC",
  "PLC",
  "GMBH",
  "SA",
  "BV",
  "AG",
]

const CHINESE_LEGAL_SUFFIXES = [
  "股份有限公司",
  "有限責任公司",
  "有限责任公司",
  "有限公司",
  "株式会社",
  "控股股份有限公司",
  "控股有限公司",
  "控股",
]

function toHalfWidthAscii(value: string): string {
  return value.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
}

function expandRegionAliases(value: string): string {
  let s = toHalfWidthAscii(value).toUpperCase()
  s = s.replace(/[\(（]\s*HK\s*[\)）]/g, " HONGKONG ")
  s = s.replace(/[\(（]\s*HONG\s+KONG\s*[\)）]/g, " HONGKONG ")
  s = s.replace(/\bHONG\s+KONG\b/g, " HONGKONG ")
  s = s.replace(/\bH\s*\.\s*K\s*\./g, " HONGKONG ")
  s = s.replace(/\bHK\b/g, " HONGKONG ")
  return s
}

function stripEnglishLegalSuffixes(value: string): string {
  let s = expandRegionAliases(value)
  for (const suffix of ENGLISH_LEGAL_SUFFIXES) {
    const pattern = new RegExp(`\\b${suffix.replace(/\./g, "\\.").replace(/\s+/g, "\\s*")}\\b`, "gi")
    s = s.replace(pattern, " ")
  }
  s = s.replace(/\bCO\.?\s*,?\s*LTD\.?\b/gi, " ")
  s = s.replace(/\bCO\.?\s*,?\s*LIMITED\b/gi, " ")
  return s
}

export function normalizeEnglishCompanyCore(value: string): string {
  return stripEnglishLegalSuffixes(value).replace(/[^A-Z0-9]/g, "")
}

export function normalizeChineseCompanyCore(value: string): string {
  let s = value.replace(/[\s()（）\-·,，.]/g, "")
  for (const suffix of CHINESE_LEGAL_SUFFIXES) {
    if (s.endsWith(suffix)) {
      s = s.slice(0, -suffix.length)
    }
  }
  return s
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }
  return matrix[a.length][b.length]
}

function englishCoresMatch(coreA: string, coreB: string): boolean {
  if (!coreA || !coreB) return false
  if (coreA === coreB) return true

  const minLen = Math.min(coreA.length, coreB.length)
  const maxLen = Math.max(coreA.length, coreB.length)
  if (minLen < 4) return false

  if (coreA.includes(coreB) || coreB.includes(coreA)) {
    return minLen >= Math.max(4, Math.floor(maxLen * 0.6))
  }

  const distance = levenshteinDistance(coreA, coreB)
  const similarity = 1 - distance / maxLen
  return similarity >= 0.88
}

function chineseCoresMatch(coreA: string, coreB: string): boolean {
  if (!coreA || !coreB) return false
  if (coreA === coreB) return true
  const minLen = Math.min(coreA.length, coreB.length)
  if (minLen < 2) return false
  return coreA.includes(coreB) || coreB.includes(coreA)
}

export function companyNamesMatch(formName: string, certificateName: string): boolean {
  if (!formName.trim() || !certificateName.trim()) return false

  const enA = normalizeEnglishCompanyCore(formName)
  const enB = normalizeEnglishCompanyCore(certificateName)
  if (enA && enB && englishCoresMatch(enA, enB)) return true

  const zhA = normalizeChineseCompanyCore(formName)
  const zhB = normalizeChineseCompanyCore(certificateName)
  if (zhA && zhB && chineseCoresMatch(zhA, zhB)) return true

  return false
}

function companyNamePairMatches(nameA: string, nameB: string): boolean {
  return companyNamesMatch(nameA, nameB)
}

export function brCertificateNameMatchesForm(
  formCompanyNameEn: string,
  formCompanyNameZh: string,
  certificateCompanyNameEn: string,
  certificateCompanyNameZh: string,
): boolean {
  const formNames = [formCompanyNameEn, formCompanyNameZh].map((v) => v.trim()).filter(Boolean)
  const certNames = [certificateCompanyNameEn, certificateCompanyNameZh]
    .map((v) => (v || "").trim())
    .filter(Boolean)
  if (formNames.length === 0 || certNames.length === 0) return false

  return formNames.some((formName) =>
    certNames.some((certName) => companyNamePairMatches(formName, certName)),
  )
}
