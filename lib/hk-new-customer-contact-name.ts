import type { ContactEntry } from "@/types/hk-new-customer"
import {
  collectLegalNameIssues,
  validateLegalChineseName,
  validateLegalEnglishNamePart,
  type LegalNameValidation,
} from "@/lib/hk-new-customer-name-validation"

export type ContactNameFields = Pick<
  ContactEntry,
  "nameEnFirst" | "nameEnMiddle" | "nameEnLast" | "nameZh"
>

const OPTIONAL_MIDDLE_NAME_PLACEHOLDERS = new Set(["NA", "N/A", "-"])

export function emptyContactName(): ContactNameFields {
  return {
    nameEnFirst: "",
    nameEnMiddle: "",
    nameEnLast: "",
    nameZh: "",
  }
}

export function normalizeOptionalMiddleName(value: string | undefined): string {
  const trimmed = String(value || "").trim()
  if (!trimmed) return ""
  if (OPTIONAL_MIDDLE_NAME_PLACEHOLDERS.has(trimmed.toUpperCase())) return ""
  return trimmed
}

export function formatContactNameEn(contact?: Partial<ContactNameFields>): string {
  if (!contact) return ""
  return [
    contact.nameEnFirst,
    normalizeOptionalMiddleName(contact.nameEnMiddle),
    contact.nameEnLast,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
}

export function formatContactNameFull(contact?: Partial<ContactNameFields>): string {
  const english = formatContactNameEn(contact)
  const chinese = String(contact?.nameZh || "").trim()
  if (english && chinese) return `${english} / ${chinese}`
  return english || chinese
}

export function normalizeContactNameFields(
  contact: Partial<ContactEntry>,
): ContactNameFields {
  const structured: ContactNameFields = {
    nameEnFirst: String(contact.nameEnFirst || "").trim(),
    nameEnMiddle: normalizeOptionalMiddleName(contact.nameEnMiddle),
    nameEnLast: String(contact.nameEnLast || "").trim(),
    nameZh: String(contact.nameZh || "").trim(),
  }

  const hasStructured = Object.values(structured).some(Boolean)
  const legacyName = String(contact.name || "").trim()
  if (!hasStructured && legacyName) {
    return {
      ...emptyContactName(),
      nameEnFirst: legacyName,
    }
  }

  return structured
}

export function hasAnyContactNamePart(contact: Partial<ContactNameFields>): boolean {
  const normalized = normalizeContactNameFields(contact)
  return Boolean(
    normalized.nameEnFirst ||
      normalized.nameEnMiddle ||
      normalized.nameEnLast ||
      normalized.nameZh,
  )
}

function invalid(messageEn: string, messageZh: string): LegalNameValidation {
  return { valid: false, messageEn, messageZh }
}

function isValidEnglishPart(
  validation: LegalNameValidation | null,
): validation is LegalNameValidation {
  return validation !== null && validation.valid
}

export function isEnglishContactNameComplete(contact: Partial<ContactNameFields>): boolean {
  const normalized = normalizeContactNameFields(contact)
  if (!normalized.nameEnFirst || !normalized.nameEnLast) return false

  const firstValidation = validateLegalEnglishNamePart(
    normalized.nameEnFirst,
    "Given name",
    "英文名",
  )
  const lastValidation = validateLegalEnglishNamePart(
    normalized.nameEnLast,
    "Surname",
    "英文姓氏",
  )

  return isValidEnglishPart(firstValidation) && isValidEnglishPart(lastValidation)
}

export function isChineseContactNameComplete(contact: Partial<ContactNameFields>): boolean {
  const normalized = normalizeContactNameFields(contact)
  const chineseValidation = validateLegalChineseName(normalized.nameZh)
  return chineseValidation !== null && chineseValidation.valid
}

export function isContactNameComplete(contact: Partial<ContactNameFields>): boolean {
  return isEnglishContactNameComplete(contact) || isChineseContactNameComplete(contact)
}

export type ContactNameFieldValidations = {
  nameEnFirst: LegalNameValidation | null
  nameEnMiddle: LegalNameValidation | null
  nameEnLast: LegalNameValidation | null
  nameZh: LegalNameValidation | null
  summary: LegalNameValidation | null
}

export function getContactNameFieldValidations(
  contact: Partial<ContactNameFields>,
): ContactNameFieldValidations {
  const normalized = normalizeContactNameFields(contact)
  const englishComplete = isEnglishContactNameComplete(normalized)
  const chineseComplete = isChineseContactNameComplete(normalized)

  const nameEnFirst = normalized.nameEnFirst
    ? validateLegalEnglishNamePart(normalized.nameEnFirst, "Given name", "英文名")
    : null
  const nameEnMiddle = normalized.nameEnMiddle
    ? validateLegalEnglishNamePart(normalized.nameEnMiddle, "Middle name", "英文中間名", {
        minLength: 1,
      })
    : null
  const nameEnLast = normalized.nameEnLast
    ? validateLegalEnglishNamePart(normalized.nameEnLast, "Surname", "英文姓氏")
    : null
  const nameZh = normalized.nameZh ? validateLegalChineseName(normalized.nameZh) : null

  if (englishComplete || chineseComplete) {
    return {
      nameEnFirst,
      nameEnMiddle,
      nameEnLast,
      nameZh: chineseComplete ? null : nameZh,
      summary: null,
    }
  }

  if (!hasAnyContactNamePart(normalized)) {
    return {
      nameEnFirst: null,
      nameEnMiddle: null,
      nameEnLast: null,
      nameZh: null,
      summary: null,
    }
  }

  return {
    nameEnFirst,
    nameEnMiddle,
    nameEnLast,
    nameZh,
    summary: invalid(
      "Enter English given name and surname, or a full Chinese legal name.",
      "請填寫英文名字及姓氏，或填寫中文姓名全名。",
    ),
  }
}

export function collectContactNameIssues(
  fields: Array<{ key: string; label: string; contact: Partial<ContactNameFields> }>,
): Array<{ key: string; label: string; validation: LegalNameValidation }> {
  return fields.flatMap(({ key, label, contact }) => {
    if (!hasAnyContactNamePart(contact)) return []

    const validations = getContactNameFieldValidations(contact)
    const issues: Array<{ key: string; label: string; validation: LegalNameValidation }> = []

    if (validations.summary) {
      issues.push({ key: `${key}-name`, label, validation: validations.summary })
      return issues
    }

    if (validations.nameEnFirst && !validations.nameEnFirst.valid) {
      issues.push({
        key: `${key}-en-first`,
        label: `${label} - Given Name / 英文名`,
        validation: validations.nameEnFirst,
      })
    }
    if (validations.nameEnMiddle && !validations.nameEnMiddle.valid) {
      issues.push({
        key: `${key}-en-middle`,
        label: `${label} - Middle Name / 英文中間名`,
        validation: validations.nameEnMiddle,
      })
    }
    if (validations.nameEnLast && !validations.nameEnLast.valid) {
      issues.push({
        key: `${key}-en-last`,
        label: `${label} - Surname / 英文姓氏`,
        validation: validations.nameEnLast,
      })
    }
    if (validations.nameZh && !validations.nameZh.valid) {
      issues.push({
        key: `${key}-zh`,
        label: `${label} - Name (Chinese) / 中文姓名`,
        validation: validations.nameZh,
      })
    }

    return issues
  })
}

export function collectLegacySingleNameIssues(
  fields: Array<{ key: string; label: string; value: string }>,
) {
  return collectLegalNameIssues(fields)
}
