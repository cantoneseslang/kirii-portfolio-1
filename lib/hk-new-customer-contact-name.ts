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

export function emptyContactName(): ContactNameFields {
  return {
    nameEnFirst: "",
    nameEnMiddle: "",
    nameEnLast: "",
    nameZh: "",
  }
}

export function formatContactNameEn(contact?: Partial<ContactNameFields>): string {
  if (!contact) return ""
  return [contact.nameEnFirst, contact.nameEnMiddle, contact.nameEnLast]
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
    nameEnMiddle: String(contact.nameEnMiddle || "").trim(),
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

export function collectContactNameIssues(
  fields: Array<{ key: string; label: string; contact: Partial<ContactNameFields> }>,
): Array<{ key: string; label: string; validation: LegalNameValidation }> {
  return fields.flatMap(({ key, label, contact }) => {
    const issues: Array<{ key: string; label: string; validation: LegalNameValidation }> = []

    const firstValidation = validateLegalEnglishNamePart(
      contact.nameEnFirst,
      "Given name",
      "英文名",
      { required: true },
    )
    if (firstValidation) {
      issues.push({ key: `${key}-en-first`, label: `${label} - Given Name / 英文名`, validation: firstValidation })
    }

    const middleValidation = validateLegalEnglishNamePart(
      contact.nameEnMiddle,
      "Middle name",
      "英文中間名",
      { required: true, minLength: 1 },
    )
    if (middleValidation) {
      issues.push({ key: `${key}-en-middle`, label: `${label} - Middle Name / 英文中間名`, validation: middleValidation })
    }

    const lastValidation = validateLegalEnglishNamePart(
      contact.nameEnLast,
      "Surname",
      "英文姓氏",
      { required: true },
    )
    if (lastValidation) {
      issues.push({ key: `${key}-en-last`, label: `${label} - Surname / 英文姓氏`, validation: lastValidation })
    }

    const chineseValidation = validateLegalChineseName(contact.nameZh)
    if (chineseValidation) {
      issues.push({ key: `${key}-zh`, label: `${label} - Name (Chinese) / 中文姓名`, validation: chineseValidation })
    }

    return issues
  })
}

export function collectLegacySingleNameIssues(
  fields: Array<{ key: string; label: string; value: string }>,
) {
  return collectLegalNameIssues(fields)
}
